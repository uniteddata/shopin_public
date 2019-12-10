/**
 * @module kadence/churnfilter
 */

'use strict';

const ms = require('ms');
const merge = require('merge');


/**
 * Plugin that tracks contacts that are not online and evicts them from the
 * routing table, prevents re-entry into the routing table using an exponential
 * cooldown time.
 */
class ChurnFilterPlugin {

  static get DEFAULTS() {
    return {
      cooldownBaseTimeout: '1M', // Start block at N minutes
      cooldownMultiplier: 2, // Multiply the block time by M every offense
      cooldownResetTime: '10M' // Until no offense has occured for K minutes
    };
  }

  /**
   * @constructor
   * @param {AbstractNode} node
   * @param {object} [options]
   * @param {number} [options.cooldownMultiplier=2] - Multiply cooldown time
   * by this number after every offense
   * @param {string} [options.cooldownResetTime="10M"] - Human time string
   * for resetting the cooldown multiplier after no block added for a given
   * peer fingerprint
   * @param {string} [options.cooldownBaseTimeout="1M"] - Human time string
   * for starting timeout, multiplied by two every time the cooldown is reset
   * and broken again
   */
  constructor(node, options) {
    this.node = node;
    this.opts = merge(ChurnFilterPlugin.DEFAULTS, options);
    this.cooldown = new Map();
    this.blocked = new Set();

    // Not sure how well this is going to work in a production environment yet
    // so let's warn users that it could be problematic
    this.node.logger.warn(
      'the churn filter plugin may not be suitable for production networks'
    );

    this._wrapAbstractNodeSend(); // Detect timeouts and network errors
    this._wrapAbstractNodeUpdateContact(); // Gatekeep the routing table

    setInterval(
      this.resetCooldownForStablePeers.bind(this),
      ms(this.opts.cooldownBaseTimeout)
    );
  }

  /**
   * @private
   */
  _wrapAbstractNodeUpdateContact() {
    const _updateContact = this.node._updateContact.bind(this.node);

    this.node._updateContact = (identity, contact) => {
      if (this.hasBlock(identity)) {
        this.node.logger.debug(
          'preventing entry of blocked fingerprint %s into routing table',
          identity
        );
        return null;
      }

      _updateContact(identity, contact);
    };
  }

  /**
   * @private
   */
  _wrapAbstractNodeSend() {
    const send = this.node.send.bind(this.node);

    this.node.send = (method, params, target, handler) => {
      if (this.hasBlock(target[0])) {
        this.node.logger.warn(
          'sending message to contact %s with active block',
          target[0]
        );
      }

      send(method, params, target, (err, result) => {
        if (err && (err.type === 'TIMEOUT' || err.dispose)) {
          this.node.logger.info('setting temporary block for %s', target[0]);
          this.setBlock(target[0]);
        }

        handler(err, result);
      });
    };
  }

  /**
   * Checks if the fingerprint is blocked
   * @param {string|buffer} fingerprint - Node ID to check
   * @returns {boolean}
   */
  hasBlock(fingerprint) {
    fingerprint = fingerprint.toString('hex');

    if (this.blocked.has(fingerprint)) {
      return !this.cooldown.get(fingerprint).expired;
    }

    return false;
  }

  /**
   * Creates a new block or renews the cooldown for an existing block
   * @param {string|buffer} fingerprint - Node ID to block
   * @returns {object}
   */
  setBlock(fingerprint) {
    fingerprint = fingerprint.toString('hex');

    let cooldown = this.cooldown.get(fingerprint);

    if (cooldown) {
      cooldown.duration = cooldown.expired
        ? cooldown.duration
        : cooldown.duration * this.opts.cooldownMultiplier;
      cooldown.time = Date.now();
    } else {
      cooldown = {
        duration: ms(this.opts.cooldownBaseTimeout),
        time: Date.now(),
        get expiration() {
          return this.time + this.duration;
        },
        get expired() {
          return this.expiration <= Date.now();
        }
      };
    }

    this.cooldown.set(fingerprint, cooldown);
    this.blocked.add(fingerprint);
    this.node.router.removeContactByNodeId(fingerprint);
  }

  /**
   * Deletes the blocked fingerprint
   * @param {string|buffer} fingerprint - Node ID to remove block
   */
  delBlock(fingerprint) {
    this.cooldown.delete(fingerprint);
    this.blocked.delete(fingerprint);
  }

  /**
   * Clears all blocked and cooldown data
   */
  reset() {
    this.cooldown.clear();
    this.blocked.clear();
  }

  /**
   * Releases blocked to reset cooldown multipliers for fingerprints with
   * cooldowns that are long expired and not blocked
   */
  resetCooldownForStablePeers() {
    const now = Date.now();

    for (let [fingerprint, cooldown] of this.cooldown) {
      if (this.hasBlock(fingerprint)) {
        continue;
      }

      let { expired, expiration } = cooldown;

      if (expired && (now - expiration >= ms(this.opts.cooldownResetTime))) {
        this.delBlock(fingerprint);
      }
    }
  }

}

/**
 * Registers a {@link module:kadence/contentaddress~ChurnFilterPlugin} with
 * a {@link KademliaNode}
 * @param {object} [options]
 * @param {number} [options.cooldownMultiplier=2] - Multiply cooldown time
 * by this number after every offense
 * @param {string} [options.cooldownResetTime="60M"] - Human time string
 * for resetting the cooldown multiplier after no block added for a given
 * peer fingerprint
 * @param {string} [options.cooldownBaseTimeout="5M"] - Human time string
 * for starting timeout, multiplied by two every time the cooldown is reset
 * and broken again
 */
module.exports = function(options) {
  return function(node) {
    return new ChurnFilterPlugin(node, options);
  }
};

module.exports.ChurnFilterPlugin = ChurnFilterPlugin;
