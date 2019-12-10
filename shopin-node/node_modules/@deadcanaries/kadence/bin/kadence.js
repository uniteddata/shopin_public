#!/usr/bin/env sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

'use strict';

// NB: We use self-signed certificates, *however*, we perform our own
// NB: authentication/authorization via ECDSA, so this is fine. We don't
// NB: care about certificate authorities, just TLS, because our nodes
// NB: identified by public key hashes and verified by signatures.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { homedir } = require('os');
const assert = require('assert');
const async = require('async');
const program = require('commander');
const kadence = require('../index');
const bunyan = require('bunyan');
const RotatingLogStream = require('bunyan-rotating-file-stream');
const fs = require('fs');
const path = require('path');
const options = require('./config');
const npid = require('npid');
const daemon = require('daemon');
const pem = require('pem');
const levelup = require('levelup');
const leveldown = require('leveldown');
const boscar = require('boscar');
const { fork } = require('child_process');
const os = require('os');
const ms = require('ms');
const rc = require('rc');
const ini = require('ini');
const encoding = require('encoding-down');
const secp256k1 = require('secp256k1');


program.version(`
  kadence  ${kadence.version.software}
  protocol ${kadence.version.protocol}
`);

program.description(`
  Copyright (c) 2019 Dead Canaries, Inc.
  Licensed under the GNU Affero General Public License Version 3
`);

program.option('--config <file>', 'path to a kadence configuration file',
  path.join(homedir(), '.config/kadence/config'));
program.option('--datadir <path>', 'path to the default data directory',
  path.join(homedir(), '.config/kadence'));
program.option('--shutdown', 'sends the shutdown signal to the daemon');
program.option('--testnet', 'runs with reduced identity difficulty');
program.option('--daemon', 'sends the kadence daemon to the background');
program.option('--rpc <method> [params]', 'send a command to the daemon');
program.parse(process.argv);

let argv;

if (program.datadir) {
  argv = { config: path.join(program.datadir, 'config') };
  program.config = argv.config;
}

if (program.testnet) {
  process.env.kadence_TestNetworkEnabled = '1';
}

let config = rc('kadence', options(program.datadir), argv);
let privkey, identity, logger, controller, node, nonce, proof;


// Handle certificate generation
function _generateSelfSignedCertificate() {
  return new Promise((resolve, reject) => {
    pem.createCertificate({
      days: 365,
      selfSigned: true
    }, (err, keys) => {
      if (err) {
        return reject(err);
      }

      fs.writeFileSync(config.SSLKeyPath, keys.serviceKey);
      fs.writeFileSync(config.SSLCertificatePath, keys.certificate);
      resolve();
    });
  });
}

// Initialize logging
logger = bunyan.createLogger({
  name: 'kadence',
  streams: [
    {
      stream: new RotatingLogStream({
        path: config.LogFilePath,
        totalFiles: parseInt(config.LogFileMaxBackCopies),
        rotateExisting: true,
        gzip: false
      })
    },
    { stream: process.stdout }
  ],
  level: parseInt(config.VerboseLoggingEnabled) ? 'debug' : 'info'
});

if (parseInt(config.TestNetworkEnabled)) {
  logger.info('kadence is running in test mode, difficulties are reduced');
  process.env.kadence_TestNetworkEnabled = config.TestNetworkEnabled;
  kadence.constants.IDENTITY_DIFFICULTY = kadence.constants.TESTNET_DIFFICULTY;
}

if (parseInt(config.TraverseNatEnabled) && parseInt(config.OnionEnabled)) {
  logger.error('refusing to start with both TraverseNatEnabled and ' +
    'OnionEnabled - this is a privacy risk');
  process.exit(1);
}

async function _init() {
  // Generate a private extended key if it does not exist
  if (!fs.existsSync(config.PrivateKeyPath)) {
    fs.writeFileSync(config.PrivateKeyPath, kadence.utils.generatePrivateKey());
  }

  if (fs.existsSync(config.IdentityProofPath)) {
    proof = fs.readFileSync(config.IdentityProofPath);
  }

  if (fs.existsSync(config.IdentityNoncePath)) {
    nonce = parseInt(fs.readFileSync(config.IdentityNoncePath).toString());
  }

  if (program.shutdown) {
    try {
      process.kill(parseInt(
        fs.readFileSync(config.DaemonPidFilePath).toString().trim()
      ), 'SIGTERM');
    } catch (err) {
      logger.error('failed to shutdown daemon, is it running?');
      process.exit(1);
    }
    process.exit();
  }

  if (parseInt(config.SSLEnabled) && !fs.existsSync(config.SSLKeyPath)) {
    await _generateSelfSignedCertificate();
  }

  if (program.daemon) {
    require('daemon')({ cwd: process.cwd() });
  }

  try {
    npid.create(config.DaemonPidFilePath).removeOnExit();
  } catch (err) {
    logger.error('Failed to create PID file, is kadence already running?');
    process.exit(1);
  }

  // Shutdown children cleanly on exit
  process.on('exit', killChildrenAndExit);
  process.on('SIGTERM', killChildrenAndExit);
  process.on('SIGINT', killChildrenAndExit);
  process.on('uncaughtException', (err) => {
    npid.remove(config.DaemonPidFilePath);
    logger.error(err.message);
    logger.debug(err.stack);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    npid.remove(config.DaemonPidFilePath);
    logger.error(err.message);
    logger.debug(err.stack);
    process.exit(1);
  });

  // Initialize private extended key
  privkey = fs.readFileSync(config.PrivateKeyPath);
  identity = new kadence.eclipse.EclipseIdentity(
    secp256k1.publicKeyCreate(privkey),
    nonce,
    proof
  );

  // If identity is not solved yet, start trying to solve it
  if (!identity.validate()) {
    logger.warn(`identity proof not yet solved, this can take a while`);
    await identity.solve();
    fs.writeFileSync(config.IdentityNoncePath, identity.nonce.toString());
    fs.writeFileSync(config.IdentityProofPath, identity.proof);
  }

  init();
}

function killChildrenAndExit() {
  logger.info('exiting, killing child services, cleaning up');
  npid.remove(config.DaemonPidFilePath);
  process.removeListener('exit', killChildrenAndExit);

  if (controller && parseInt(config.ControlSockEnabled)) {
    controller.server.close();
  }

  process.exit(0);
}

function registerControlInterface() {
  assert(!(parseInt(config.ControlPortEnabled) &&
           parseInt(config.ControlSockEnabled)),
  'ControlSock and ControlPort cannot both be enabled');

  controller = new boscar.Server(new kadence.Control(node));

  if (parseInt(config.ControlPortEnabled)) {
    logger.info('binding controller to port ' + config.ControlPort);
    controller.listen(parseInt(config.ControlPort), '0.0.0.0');
  }

  if (parseInt(config.ControlSockEnabled)) {
    logger.info('binding controller to path ' + config.ControlSock);
    controller.listen(config.ControlSock);
  }
}

async function init() {
  logger.info('initializing kadence');

  // Initialize public contact data
  const contact = {
    hostname: config.NodePublicAddress,
    protocol: parseInt(config.SSLEnabled) ? 'https:' : 'http:',
    port: parseInt(config.NodePublicPort)
  };

  let transport;

  if (parseInt(config.SSLEnabled)) {
    const key = fs.readFileSync(config.SSLKeyPath);
    const cert = fs.readFileSync(config.SSLCertificatePath);
    const ca = config.SSLAuthorityPaths.map(fs.readFileSync);

    transport = new kadence.HTTPSTransport({ key, cert, ca });
  } else {
    transport = new kadence.HTTPTransport();
  }

  // Initialize protocol implementation
  node = new kadence.KademliaNode({
    logger,
    transport,
    contact,
    storage: levelup(encoding(leveldown(config.EmbeddedDatabaseDirectory)))
  });

  node.hashcash = node.plugin(kadence.hashcash({
    methods: ['PUBLISH', 'SUBSCRIBE'],
    difficulty: 8
  }));
  node.quasar = node.plugin(kadence.quasar());
  node.spartacus = node.plugin(kadence.spartacus(privkey, {
    checkPublicKeyHash: false
  }));
  node.content = node.plugin(kadence.contentaddress({
    valueEncoding: 'hex'
  }));
  node.eclipse = node.plugin(kadence.eclipse(identity));
  node.rolodex = node.plugin(kadence.rolodex(config.EmbeddedPeerCachePath));

  // Check if we need to enable the churn filter plugin (experimental)
  if (parseInt(config.ChurnFilterEnabled)) {
    node.blacklist = node.plugin(kadence.churnfilter({
      cooldownBaseTimeout: config.ChurnCoolDownBaseTimeout,
      cooldownMultiplier: parseInt(config.ChurnCoolDownMultiplier),
      cooldownResetTime: config.ChurnCoolDownResetTime
    }));
  }

  // Hibernate when bandwidth thresholds are reached
  if (!!parseInt(config.BandwidthAccountingEnabled)) {
    node.hibernate = node.plugin(kadence.hibernate({
      limit: config.BandwidthAccountingMax,
      interval: config.BandwidthAccountingReset,
      reject: ['FIND_VALUE', 'STORE']
    }));
  }

  // Use Tor for an anonymous overlay
  if (!!parseInt(config.OnionEnabled)) {
    kadence.constants.T_RESPONSETIMEOUT = 20000;
    node.onion = node.plugin(kadence.onion({
      dataDirectory: config.OnionHiddenServiceDirectory,
      virtualPort: config.OnionVirtualPort,
      localMapping: `127.0.0.1:${config.NodeListenPort}`,
      torrcEntries: {
        CircuitBuildTimeout: 10,
        KeepalivePeriod: 60,
        NewCircuitPeriod: 60,
        NumEntryGuards: 8,
        Log: `${config.OnionLoggingVerbosity} stdout`
      },
      passthroughLoggingEnabled: !!parseInt(config.OnionLoggingEnabled)
    }));
  }

  // Punch through NATs
  if (!!parseInt(config.TraverseNatEnabled)) {
    node.traverse = node.plugin(kadence.traverse([
      new kadence.traverse.UPNPStrategy({
        mappingTtl: parseInt(config.TraversePortForwardTTL),
        publicPort: parseInt(node.contact.port)
      }),
      new kadence.traverse.NATPMPStrategy({
        mappingTtl: parseInt(config.TraversePortForwardTTL),
        publicPort: parseInt(node.contact.port)
      }),
      new kadence.traverse.ReverseTunnelStrategy({
        remoteAddress: config.TraverseReverseTunnelHostname,
        remotePort: parseInt(config.TraverseReverseTunnelPort),
        privateKey: node.spartacus.privateKey,
        secureLocalConnection: parseInt(config.SSLEnabled),
        verboseLogging: parseInt(config.VerboseLoggingEnabled)
      })
    ]));
  }

  // Handle any fatal errors
  node.on('error', (err) => {
    logger.error(err.message.toLowerCase());
  });

  // Use verbose logging if enabled
  if (!!parseInt(config.VerboseLoggingEnabled)) {
    node.plugin(kadence.logger(logger));
  }

  // Cast network nodes to an array
  if (typeof config.NetworkBootstrapNodes === 'string') {
    config.NetworkBootstrapNodes = config.NetworkBootstrapNodes.trim().split();
  }

  async function joinNetwork(callback) {
    let peers = config.NetworkBootstrapNodes.concat(
      await node.rolodex.getBootstrapCandidates()
    );

    if (peers.length === 0) {
      logger.info('no bootstrap seeds provided and no known profiles');
      logger.info('running in seed mode (waiting for connections)');

      return node.router.events.once('add', (identity) => {
        config.NetworkBootstrapNodes = [
          kadence.utils.getContactURL([
            identity,
            node.router.getContactByNodeId(identity)
          ])
        ];
        joinNetwork(callback)
      });
    }

    logger.info(`joining network from ${peers.length} seeds`);
    async.detectSeries(peers, (url, done) => {
      const contact = kadence.utils.parseContactURL(url);
      node.join(contact, (err) => {
        done(null, (err ? false : true) && node.router.size > 1);
      });
    }, (err, result) => {
      if (!result) {
        logger.error('failed to join network, will retry in 1 minute');
        callback(new Error('Failed to join network'));
      } else {
        callback(null, result);
      }
    });
  }

  node.listen(parseInt(config.NodeListenPort), () => {
    logger.info(
      `node listening on local port ${config.NodeListenPort} ` +
      `and exposed at ${node.contact.protocol}//${node.contact.hostname}` +
      `:${node.contact.port}`
    );
    registerControlInterface();
    async.retry({
      times: Infinity,
      interval: 60000
    }, done => joinNetwork(done), (err, entry) => {
      if (err) {
        logger.error(err.message);
        process.exit(1);
      }

      logger.info(`connected to network via ${entry}`);
      logger.info(`discovered ${node.router.size} peers from seed`);
    });
  });
}

// Check if we are sending a command to a running daemon's controller
if (program.rpc) {
  assert(!(parseInt(config.ControlPortEnabled) &&
           parseInt(config.ControlSockEnabled)),
    'ControlSock and ControlPort cannot both be enabled');

  const client = new boscar.Client();

  if (parseInt(config.ControlPortEnabled)) {
    client.connect(parseInt(config.ControlPort));
  } else if (parseInt(config.ControlSockEnabled)) {
    client.connect(config.ControlSock);
  }

  client.on('ready', () => {
    const [method, ...params] = program.rpc.split(' ');
    client.invoke(method, params, function(err, ...results) {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        console.info(results);
        process.exit(0);
      }
    });
  });

  client.on('error', err => {
    console.error(err);
    process.exit(1)
  });
} else {
  // Otherwise, kick everything off
  _init();
}
