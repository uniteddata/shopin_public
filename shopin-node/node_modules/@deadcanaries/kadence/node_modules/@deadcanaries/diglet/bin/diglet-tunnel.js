#!/usr/bin/env node

'use strict';

const path = require('path');
const os = require('os');
const bunyan = require('bunyan');
const diglet = require('..');
const config = require('./_config');
const fs = require('fs');
const { randomBytes } = require('crypto');
const secp256k1 = require('secp256k1');
const program = require('commander');
const DEFAULT_KEY_PATH = path.join(os.homedir(), '.diglet.prv');


program
  .version(require('../package').version)
  .option('--port <port>', 'local port to reverse tunnel', 8080)
  .option('--save [path]', 'save the generated key')
  .option('--load [path]', 'load the saved key')
  .option('--local-server-ssl', 'indicate the local server uses tls')
  .option('--debug', 'show verbose logs')
  .parse(process.argv);

if (program.save && program.load) {
  console.error('\n  error: cannot use `--save` and `--load` together');
  process.exit(1);
}

if (program.save && typeof program.save !== 'string') {
  program.save = DEFAULT_KEY_PATH;
}

if (program.load && typeof program.load !== 'string') {
  program.load = DEFAULT_KEY_PATH;
}

function getPrivateKey() {
  if (program.load) {
    return fs.readFileSync(program.load);
  }

  let key = Buffer.from([]);

  while (!secp256k1.privateKeyVerify(key)) {
    key = randomBytes(32);
  }

  if (program.save) {
    fs.writeFileSync(program.save, key);
  }

  return key;
}

const logger = bunyan.createLogger({ name: 'diglet-client', level: program.debug ? 'info' : 'error' });
const tunnel = new diglet.Tunnel({
  localAddress: '127.0.0.1',
  localPort: parseInt(program.port),
  remoteAddress: config.Hostname,
  remotePort: config.TunnelPort,
  logger,
  privateKey: getPrivateKey(),
  secureLocalConnection: program.localServerSsl
});

console.info(`

   ____  _     _     _
  |    \\|_|___| |___| |_
  |  |  | | . | | -_|  _|
  |____/|_|_  |_|___|_|
          |___|

   Copyright (c) 2019 Dead Canaries, Inc.
   Licensed under the GNU Affero General Public License Version 3
`);
console.info(`
   Your tunnel is available at:
   ${tunnel.url}
`);
tunnel.open();
