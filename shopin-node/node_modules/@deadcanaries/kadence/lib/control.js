'use strict';

const constants = require('./constants');
const version = require('./version');
const utils = require('./utils');


/**
 * The Kadence daemon can be controlled by another process on the same host or
 * remotely via socket connection. By default, the daemon is configured to
 * listen on a UNIX domain socket located at $HOME/.config/kadence/kadence.sock.
 * Once connected to the daemon, you may send it control commands to build
 * networks in other languages. The controller understands newline terminated
 * JSON-RPC 2.0 payloads.
 */
class Control {

  /**
   * @constructor
   * @param {KademliaNode} node
   */
  constructor(node) {
    this.node = node;
  }

  /**
   * @private
   */
  _parseMethodSignature(name) {
    const method = name;
    const func = this[method].toString();
    const args = func.split(`${method}(`)[1].split(')')[0];
    const params = args.split(', ').map(s => s.trim());

    params.pop();

    return { method, params };
  }

  /**
   * Returns a list of the support methods from the controller
   * @param {Control~listMethodsCallback} callback
   */
  listMethods(callback) {
    callback(null, Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(method => {
        return method[0] !== '_' && method !== 'constructor' &&
          typeof this[method] === 'function';
      })
      .map(this._parseMethodSignature.bind(this))
      .sort((a, b) => b.method < a.method));
  }
  /**
   * @callback Control~listMethodsCallback
   * @param {error|null} error
   * @param {object[]} methods
   * @param {string} methods.method
   * @param {string[]} methods.params
   */

  /**
   * Returns basic informations about the running node
   * @param {Control~getProtocolInfoCallback} callback
   */
  getProtocolInfo(callback) {
    const peers = [], dump = this.node.router.getClosestContactsToKey(
      this.node.identity,
      constants.K * constants.B
    );

    for (let peer of dump) {
      peers.push(peer);
    }

    callback(null, {
      versions: version,
      identity: this.node.identity.toString('hex'),
      contact: this.node.contact,
      peers
    });
  }
  /**
   * @callback Control~getProtocolInfoCallback
   * @param {error|null} error
   * @param {object} info
   * @param {object} info.versions
   * @param {string} info.versions.software
   * @param {string} info.versions.protocol
   * @param {string} info.identity
   * @param {object} info.contact
   * @param {array[]} info.peers
   */

  /**
   * {@link KademliaNode#iterativeFindNode}
   */
  /* istanbul ignore next */
  iterativeFindNode(hexKey, callback) {
    this.node.iterativeFindNode(hexKey, callback);
  }

  /**
   * {@link KademliaNode#iterativeFindValue}
   */
  /* istanbul ignore next */
  iterativeFindValue(hexKey, callback) {
    this.node.iterativeFindValue(Buffer.from(hexKey, 'hex'), callback);
  }

  /**
   * {@link KademliaNode#iterativeStore}
   */
  /* istanbul ignore next */
  iterativeStore(hexValue, callback) {
    let hexKey = utils.hash160(Buffer.from(hexValue, 'hex')).toString('hex');
    this.node.iterativeStore(hexKey, hexValue, function(err, count) {
      if (err) {
        return callback(err);
      }

      callback(null, count, hexKey);
    });
  }

  /**
   * {@link module:kadence/quasar~QuasarPlugin#quasarSubscribe}
   */
  /* istanbul ignore next */
  quasarSubscribe(hexKey, callback) {
    this.node.quasarSubscribe(hexKey, callback);
  }

  /**
   * {@link module:kadence/quasar~QuasarPlugin#quasarPublish}
   */
  /* istanbul ignore next */
  quasarPublish(hexKey, contentValue, callback) {
    this.node.quasarPublish(hexKey, contentValue, callback);
  }

}

module.exports = Control;
