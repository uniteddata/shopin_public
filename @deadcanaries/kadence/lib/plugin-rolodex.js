/**
 * @module kadence/rolodex
 */

'use strict';

const fs = require('fs');
const utils = require('./utils');
const { EventEmitter } = require('events');


/**
 * Keeps track of seen contacts in a compact file so they can be used as
 * bootstrap nodes
 */
class RolodexPlugin extends EventEmitter {

  static get EXTERNAL_PREFIX() {
    return 'external';
  }

  static get INTERNAL_PREFIX() {
    return 'internal';
  }

  /**
   * @constructor
   * @param {KademliaNode} node
   * @param {string} peerCacheFilePath - Path to file to use for storing peers
   */
  constructor(node, peerCacheFilePath) {
    super();

    this._peerCacheFilePath = peerCacheFilePath;
    this._cache = {};
    this.node = node;

    // When a contact is added to the routing table, cache it
    this.node.router.events.on('add', identity => {
      this.node.logger.debug(`updating cached peer profile ${identity}`);
      const contact = this.node.router.getContactByNodeId(identity);
      if (contact) {
        contact.timestamp = Date.now();
        this.setExternalPeerInfo(identity, contact);
      }
    });

    // When a contact is dropped from the routing table, remove it from cache
    this.node.router.events.on('remove', identity => {
      this.node.logger.debug(`dropping cached peer profile ${identity}`);
      delete this._cache[`${RolodexPlugin.EXTERNAL_PREFIX}:${identity}`];
      delete this._cache[`${RolodexPlugin.INTERNAL_PREFIX}:${identity}`];
    });

    this._sync();
  }

  /**
   * @private
   */
  _sync() {
    const _syncRecursive = () => {
      setTimeout(() => {
        this._syncToFile().then(() => {
          _syncRecursive();
        }, (err) => {
          this.node.logger.error(`failed to write peer cache, ${err.message}`);
        });
      }, 60 * 1000);
    };

    this._syncFromFile().then(() => {
      _syncRecursive();
    }, (err) => {
      this.node.logger.error(`failed to read peer cache, ${err.message}`);
      _syncRecursive();
    });
  }

  /**
   * @private
   */
  _syncToFile() {
    return new Promise((resolve, reject) => {
      if (!this._peerCacheFilePath) {
        return resolve();
      }

      fs.writeFile(
        this._peerCacheFilePath,
        JSON.stringify(this._cache),
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * @private
   */
  _syncFromFile() {
    return new Promise((resolve, reject) => {
      if (!this._peerCacheFilePath) {
        return resolve();
      }

      fs.readFile(this._peerCacheFilePath, (err, data) => {
        if (err) {
          return reject(err);
        }

        try {
          this._cache = JSON.parse(data.toString());
        } catch (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }

  /**
   * Returns a list of bootstrap nodes from local profiles
   * @returns {string[]} urls
   */
  getBootstrapCandidates() {
    const candidates = [];
    return new Promise(resolve => {
      for (let key in this._cache) {
        const [prefix, identity] = key.split(':');

        /* istanbul ignore else */
        if (prefix === RolodexPlugin.EXTERNAL_PREFIX) {
          candidates.push([identity, this._cache[key]]);
        }
      }

      resolve(candidates.sort((a, b) => b[1].timestamp - a[1].timestamp)
        .map(utils.getContactURL));
    });
  }

  /**
   * Returns the external peer data for the given identity
   * @param {string} identity - Identity key for the peer
   * @returns {object}
   */
  getExternalPeerInfo(identity) {
    return new Promise((resolve, reject) => {
      const data = this._cache[`${RolodexPlugin.EXTERNAL_PREFIX}:${identity}`];
      /* istanbul ignore if */
      if (!data) {
        reject(new Error('Peer not found'));
      } else {
        resolve(data);
      }
    });
  }

  /**
   * Returns the internal peer data for the given identity
   * @param {string} identity - Identity key for the peer
   * @returns {object}
   */
  getInternalPeerInfo(identity) {
    return new Promise((resolve, reject) => {
      const data = this._cache[`${RolodexPlugin.INTERNAL_PREFIX}:${identity}`];
      /* istanbul ignore if */
      if (!data) {
        reject(new Error('Peer not found'));
      } else {
        resolve(data);
      }
    });
  }

  /**
   * Returns the external peer data for the given identity
   * @param {string} identity - Identity key for the peer
   * @param {object} data - Peer's external contact information
   * @returns {object}
   */
  setExternalPeerInfo(identity, data) {
    return new Promise((resolve) => {
      this._cache[`${RolodexPlugin.EXTERNAL_PREFIX}:${identity}`] = data;
      resolve(data);
    });
  }

  /**
   * Returns the internal peer data for the given identity
   * @param {string} identity - Identity key for the peer
   * @param {object} data - Our own internal peer information
   * @returns {object}
   */
  setInternalPeerInfo(identity, data) {
    return new Promise((resolve) => {
      this._cache[`${RolodexPlugin.INTERNAL_PREFIX}:${identity}`] = data;
      resolve(data);
    });
  }

}

/**
 * Registers a {@link module:kadence/rolodex~RolodexPlugin} with a
 * {@link KademliaNode}
 * @param {string} peerCacheFilePath - Path to file to use for storing peers
 */
module.exports = function(peerCacheFilePath) {
  return function(node) {
    return new RolodexPlugin(node, peerCacheFilePath);
  }
};

module.exports.RolodexPlugin = RolodexPlugin;
