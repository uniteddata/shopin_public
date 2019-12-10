/**
 * @module kadence/trust
 */

'use strict';

const assert = require('assert');
const utils = require('./utils');


/**
 * Handles user-defined rules for allowing and preventing the processing of
 * messages from given identities
 */
class TrustPlugin {

  /**
   * @typedef {object} module:kadence/trust~TrustPlugin~policy
   * @property {string|buffer} identity - Node identity key
   * @property {string[]} methods - Methods, wildcard (*) supported for all
   */

  /**
   * Validates the trust policy format
   * @private
   */
  static validatePolicy(policy) {
    assert(typeof policy === 'object', 'Invalid policy object');
    assert(
      utils.keyBufferIsValid(policy.identity) ||
        utils.keyStringIsValid(policy.identity) || policy.identity === '*',
      'Invalid policy identity'
    );
    assert(Array.isArray(policy.methods) && policy.methods.length,
      'No policy methods defined');
  }

  /**
   * Mode flag passed to {@link TrustPlugin} to place into blacklist mode
   * @static
   */
  static get MODE_BLACKLIST() {
    return 0x000;
  }

  /**
   * Mode flag passed to {@link TrustPlugin} to place into whitelist mode
   * @static
   */
  static get MODE_WHITELIST() {
    return 0xfff;
  }

  /**
   * @constructor
   * @param {module:kadence/trust~TrustPlugin~policy[]} policies
   * @param {number} [mode=TrustPlugin.MODE_BLACKLIST] - Blacklist or whitelist
   */
  constructor(node, policies = [], mode = TrustPlugin.MODE_BLACKLIST) {
    assert([
      TrustPlugin.MODE_BLACKLIST,
      TrustPlugin.MODE_WHITELIST
    ].includes(mode), `Invalid trust policy mode "${mode}"`);

    this.mode = mode;
    this.policies = new Map();
    this.node = node;

    policies.forEach(policy => this.addTrustPolicy(policy));

    // NB: Automatically trust ourselves if this is a whitelist
    if (this.mode === TrustPlugin.MODE_WHITELIST) {
      this.addTrustPolicy({
        identity: node.identity.toString('hex'),
        methods: ['*']
      });
    }

    const send = this.node.send.bind(this.node);

    this.node.use(this._checkIncoming.bind(this));
    this.node.send = (method, params, contact, callback) => {
      this._checkOutgoing(method, contact, err => {
        if (err) {
          return callback(err);
        }
        send(method, params, contact, callback);
      });
    };
  }

  /**
   * Checks the incoming message
   * @private
   */
  _checkIncoming(request, response, callback) {
    const [identity] = request.contact;
    const method = request.method;
    const policy = this.getTrustPolicy(identity);

    this._checkPolicy(identity, method, policy, callback);
  }

  /**
   * Checks the outgoing message
   * @private
   */
  _checkOutgoing(method, contact, callback) {
    const [identity] = contact;
    const policy = this.getTrustPolicy(identity);

    this._checkPolicy(identity, method, policy, callback);
  }

  /**
   * Checks policy against identity and method
   * @private
   */
  _checkPolicy(identity, method, policy, next) {
    /* eslint complexity: [2, 10] */
    switch (this.mode) {
      case TrustPlugin.MODE_BLACKLIST:
        if (!policy) {
          next();
        } else if (policy.includes('*') || policy.includes(method)) {
          next(new Error(`Refusing to handle ${method} message to/from ` +
            `${identity} due to trust policy`));
        } else {
          next();
        }
        break;
      case TrustPlugin.MODE_WHITELIST:
        if (!policy) {
          next(new Error(`Refusing to handle ${method} message to/from ` +
            `${identity} due to trust policy`));
        } else if (policy.includes('*') || policy.includes(method)) {
          next();
        } else {
          next(new Error(`Refusing to handle ${method} message to/from ` +
            `${identity} due to trust policy`));
        }
        break;
      default:
        /* istanbul ignore next */
        throw new Error('Failed to determine trust mode');
    }
  }

  /**
   * Adds a new trust policy
   * @param {module:kadence/trust~TrustPlugin~policy} policy
   * @returns {TrustPlugin}
   */
  addTrustPolicy(policy) {
    TrustPlugin.validatePolicy(policy);
    this.policies.set(policy.identity.toString('hex'), policy.methods);
    return this;
  }

  /**
   * Returns the trust policy for the given identity
   * @param {string|buffer} identity - Identity key for the policy
   * @returns {module:kadence/trust~TrustPlugin~policy|null}
   */
  getTrustPolicy(identity) {
    return this.policies.get(identity.toString('hex')) ||
      this.policies.get('*');
  }

  /**
   * Removes an existing trust policy
   * @param {string|buffer} identity - Trust policy to remove
   * @returns {TrustPlugin}
   */
  removeTrustPolicy(identity) {
    this.policies.delete(identity.toString('hex'));
    return this;
  }

}

/**
 * Registers a {@link module:kadence/trust~TrustPlugin} with a
 * {@link KademliaNode}
 * @param {module:kadence/trust~TrustPlugin~policy[]} policies
 * @param {number} [mode=TrustPlugin.MODE_BLACKLIST] - Blacklist or whitelist
 */
module.exports = function(policies, mode) {
  return function(node) {
    return new TrustPlugin(node, policies, mode);
  }
};

module.exports.TrustPlugin = TrustPlugin;
module.exports.MODE_BLACKLIST = TrustPlugin.MODE_BLACKLIST;
module.exports.MODE_WHITELIST = TrustPlugin.MODE_WHITELIST;
