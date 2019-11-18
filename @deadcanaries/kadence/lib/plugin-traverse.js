/**
 * @module kadence/traverse
 */

'use strict';

const { createLogger } = require('bunyan');
const ip = require('ip');
const merge = require('merge');
const async = require('async');
const { get_gateway_ip: getGatewayIp } = require('network');
const natpmp = require('nat-pmp');
const natupnp = require('nat-upnp');
const url = require('url');
const diglet = require('../../diglet');


/**
 * Establishes a series of NAT traversal strategies to execute before
 * {@link AbstractNode#listen}
 */
class TraversePlugin {

  static get TEST_INTERVAL() {
    return 600000;
  }

  /**
   * @constructor
   * @param {KademliaNode} node
   * @param {module:kadence/traverse~TraverseStrategy[]} strategies
   */
  constructor(node, strategies) {
    this.node = node;
    this.strategies = strategies;
    this._originalContact = merge({}, node.contact);

    this._wrapNodeListen();
  }

  /**
   * @private
   * @param {function} callback
   */
  _execTraversalStrategies(callback) {
    async.detectSeries(this.strategies, (strategy, test) => {
      this.node.logger.info(
        `attempting nat traversal strategy ${strategy.constructor.name}`
      );
      this.node.contact = this._originalContact;
      strategy.exec(this.node, (err) => {
        if (err) {
          this.node.logger.warn(err.message);
          test(null, false);
        } else {
          this._testIfReachable(test);
        }
      });
    }, callback);
  }

  /**
   * @private
   */
  _startTestInterval() {
    clearInterval(this._testInterval);

    this._testInterval = setInterval(() => {
      this._testIfReachable((err, isReachable) => {
        /* istanbul ignore else */
        if (!isReachable) {
          this.node.logger.warn('no longer reachable, retrying traversal');
          this._execTraversalStrategies(() => null);
        }
      });
    }, TraversePlugin.TEST_INTERVAL);
  }

  /**
   * @private
   */
  _testIfReachable(callback) {
    if (!ip.isPublic(this.node.contact.hostname)) {
      this.node.logger.warn('traversal strategy failed, not reachable');
      return callback(null, false);
    }

    callback(null, true);
  }

  /**
   * @private
   */
  _wrapNodeListen() {
    const self = this;
    const listen = this.node.listen.bind(this.node);

    this.node.listen = function() {
      let args = [...arguments];
      let listenCallback = () => null;

      if (typeof args[args.length - 1] === 'function') {
        listenCallback = args.pop();
      }

      listen(...args, () => {
        self._execTraversalStrategies((err, strategy) => {
          if (err) {
            self.node.logger.error('traversal errored %s', err.message);
          } else if (!strategy) {
            self.node.logger.warn('traversal failed - may not be reachable');
          } else {
            self.node.logger.info('traversal succeeded - you are reachable');
          }

          self._startTestInterval();
          listenCallback();
        });
      });
    };
  }

}

/**
 * Uses NAT-PMP to attempt port forward on gateway device
 * @extends {module:kadence/traverse~TraverseStrategy}
 */
class NATPMPStrategy {

  static get DEFAULTS() {
    return {
      publicPort: 0,
      mappingTtl: 0,
      timeout: 10000
    };
  }

  /**
   * @constructor
   * @param {object} [options]
   * @param {number} [options.publicPort=contact.port] - Port number to map
   * @param {number} [options.mappingTtl=0] - TTL for port mapping on router
   */
  constructor(options) {
    this.options = merge(NATPMPStrategy.DEFAULTS, options);
  }

  /**
   * @param {KademliaNode} node
   * @param {function} callback
   */
  exec(node, callback) {
    async.waterfall([
      (next) => getGatewayIp(next),
      (gateway, next) => {
        const timeout = setTimeout(() => {
          next(new Error('NAT-PMP traversal timed out'));
        }, this.options.timeout);
        this.client = natpmp.connect(gateway);
        this.client.portMapping({
          public: this.options.publicPort || node.contact.port,
          private: node.contact.port,
          ttl: this.options.mappingTtl
        }, err => {
          clearTimeout(timeout);
          next(err);
        });
      },
      (next) => this.client.externalIp(next)
    ], (err, info) => {
      if (err) {
        return callback(err);
      }

      node.contact.port = this.options.publicPort;
      node.contact.hostname = info.ip.join('.');

      callback(null);
    });
  }

}

/**
 * Uses UPnP to attempt port forward on gateway device
 * @extends {module:kadence/traverse~TraverseStrategy}
 */
class UPNPStrategy {

  static get DEFAULTS() {
    return {
      publicPort: 0,
      mappingTtl: 0
    };
  }

  /**
   * @constructor
   * @param {object} [options]
   * @param {number} [options.publicPort=contact.port] - Port number to map
   * @param {number} [options.mappingTtl=0] - TTL for mapping on router
   */
  constructor(options) {
    this.client = natupnp.createClient();
    this.options = merge(UPNPStrategy.DEFAULTS, options);
  }

  /**
   * @param {KademliaNode} node
   * @param {function} callback
   */
  exec(node, callback) {
    async.waterfall([
      (next) => {
        this.client.portMapping({
          public: this.options.publicPort || node.contact.port,
          private: node.contact.port,
          ttl: this.options.mappingTtl
        }, err => next(err));
      },
      (next) => this.client.externalIp(next)
    ], (err, ip) => {
      if (err) {
        return callback(err);
      }

      node.contact.port = this.options.publicPort;
      node.contact.hostname = ip;

      callback(null);
    });
  }

}

/**
 * Uses a secure reverse HTTPS tunnel via the Diglet package to traverse NAT.
 * This requires a running Diglet server on the internet. By default, this
 * plugin will use a test server operated by bookchin, but this may not be
 * reliable or available. It is highly recommended to deploy your own Diglet
 * server and configure your nodes to use them instead.
 * There is {@link https://gitlab.com/bookchin/diglet detailed documentation}
 * on deploying a Diglet server at the project page.
 * @extends {module:kadence/traverse~TraverseStrategy}
 */
class ReverseTunnelStrategy {

  static get DEFAULTS() {
    return {
      remoteAddress: 'tunnel.bookch.in',
      remotePort: 8443,
      secureLocalConnection: false,
      verboseLogging: false
    };
  }

  /**
   * @constructor
   * @param {object} [options]
   * @param {string} [options.remoteAddress=tunnel.bookch.in] - Diglet server address
   * @param {number} [options.remotePort=8443] - Diglet server port
   * @param {buffer} [options.privateKey] - SECP256K1 private key if using spartacus
   * @param {boolean} [options.secureLocalConnection=false] - Set to true if using {@link HTTPSTransport}
   * @param {boolean} [options.verboseLogging=false] - Useful for debugging
   */
  constructor(options) {
    this.options = merge(ReverseTunnelStrategy.DEFAULTS, options);
  }

  /**
   * @param {KademliaNode} node
   * @param {function} callback
   */
  exec(node, callback) {
    const opts = {
      localAddress: '127.0.0.1',
      localPort: node.contact.port,
      remoteAddress: this.options.remoteAddress,
      remotePort: this.options.remotePort,
      logger: this.options.verboseLogging
        ? node.logger
        : createLogger({ name: 'kadence', level: 'warn' }),
      secureLocalConnection: this.options.secureLocalConnection
    };

    if (this.options.privateKey) {
      opts.privateKey = this.options.privateKey;
    }

    this.tunnel = new diglet.Tunnel(opts);

    this.tunnel.once('connected', () => {
      node.contact.hostname = url.parse(this.tunnel.url).hostname;
      node.contact.port = 443;
      node.contact.protocol = 'https:';

      this.tunnel.removeListener('disconnected', callback);
      callback()
    });

    this.tunnel.once('disconnected', callback);
    this.tunnel.open();
  }

}

/**
 * @class
 */
class TraverseStrategy {

  constructor() {}

  /**
   * @param {KademliaNode} node
   * @param {function} callback - Called on travere complete or failed
   */
  exec(node, callback) {
    callback(new Error('Not implemented'));
  }

}

/**
 * Registers a {@link module:kadence/traverse~TraversePlugin} with an
 * {@link AbstractNode}. Strategies are attempted in the order they are
 * defined.
 * @param {module:kadence/traverse~TraverseStrategy[]} strategies
 * @example <caption>Proper Configuration</caption>
 * const node = new kadence.KademliaNode(node_options);
 * const keys = node.plugin(kadence.spartacus(key_options));
 *
 * node.plugin(kadence.traverse([
 *   new kadence.traverse.UPNPStrategy({
 *     publicPort: 8080,
 *     mappingTtl: 0
 *   }),
 *   new kadence.traverse.NATPMPStrategy({
 *     publicPort: 8080,
 *     mappingTtl: 0
 *   }),
 *   new kadence.traverse.ReverseTunnelStrategy({
 *     remoteAddress: 'my.diglet.server',
 *     remotePort: 8443,
 *     privateKey: keys.privateKey,
 *     secureLocalConnection: false,
 *     verboseLogging: false
 *   })
 * ]));
 *
 * node.listen(node.contact.port);
 */
module.exports = function(strategies) {
  return function(node) {
    return new module.exports.TraversePlugin(node, strategies);
  };
};

module.exports.ReverseTunnelStrategy = ReverseTunnelStrategy;
module.exports.UPNPStrategy = UPNPStrategy;
module.exports.NATPMPStrategy = NATPMPStrategy;
module.exports.TraverseStrategy = TraverseStrategy;
module.exports.TraversePlugin = TraversePlugin;
