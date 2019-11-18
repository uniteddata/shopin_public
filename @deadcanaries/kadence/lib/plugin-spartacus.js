/**
 * @module kadence/spartacus
 */

'use strict';

const merge = require('merge');
const assert = require('assert');
const secp256k1 = require('secp256k1');
const utils = require('./utils');
const jsonrpc = require('jsonrpc-lite');
const { Transform } = require('stream');


/**
 * Implements the spartacus decorations to the node object
 */
class SpartacusPlugin {

  static get DEFAULTS() {
    return {
      checkPublicKeyHash: true
    };
  }

  /**
   * Creates the plugin instance given a node and optional identity
   * @constructor
   * @param {KademliaNode} node
   * @param {buffer} [privateKey] - SECP256K1 private key
   * @param {object} [options={}]
   * @param {boolean} [options.checkPublicKeyHash=true]
   */
  constructor(node, priv, opts) {
    priv = priv || utils.generatePrivateKey();

    this.opts = merge(SpartacusPlugin.DEFAULTS, opts);
    this.privateKey = priv;
    this.publicKey = secp256k1.publicKeyCreate(this.privateKey);
    this.identity = utils.toPublicKeyHash(this.publicKey);
    this._validatedContacts = new Map();
    this._pendingValidators = new Map();

    node.contact.pubkey = this.publicKey.toString('hex');
    node.identity = node.router.identity = this.identity;

    node.rpc.serializer.append(() => new Transform({
      transform: this.serialize.bind(this),
      objectMode: true
    }));
    node.rpc.deserializer.prepend(() => new Transform({
      transform: this.deserialize.bind(this),
      objectMode: true
    }));
    node.use((req, res, next) => this.validate(node, req, res, next));
    this.setValidationPeriod();
  }

  /**
   * Sets the validation period for nodes
   * @param {number} period - Milliseconds to honor a proven contact response
   */
  setValidationPeriod(n = 10800000) {
    this._validationPeriod = n;
  }

  /**
   * Checks if the sender is addressable at the claimed contact information
   * and cross checks signatures between the original sender and the node
   * addressed. This is intended to prevent reflection attacks and general
   * DDoS via spam.
   * @param {KademliaNode} node
   * @param {AbstractNode~request} request
   * @param {AbstractNode~response} response
   * @param {AbstractNode~next} next
   */
  validate(node, req, res, next) {
    const period = this._validationPeriod;
    const record = this._validatedContacts.get(req.contact[0]);
    const validated = record && record.validated;
    const fresh = validated && ((Date.now() - record.timestamp) < period);

    if (this._pendingValidators.get(req.contact[0])) {
      return next(); // NB: Let's not get into an infinte validation loop
    }

    if (validated && fresh) {
      return next();
    }

    this._pendingValidators.set(req.contact[0], req.contact[1]);
    node.ping(req.contact, (err) => {
      this._pendingValidators.delete(req.contact[0]);

      if (err) {
        return this._validatedContacts.set(req.contact[0], {
          validated: false,
          timestamp: Date.now()
        });
      }

      this._validatedContacts.set(req.contact[0], {
        validated: true,
        timestamp: Date.now()
      });
      next();
    });
  }

  /**
   * Processes with JsonRpcSerializer then signs the result and appends an
   * additional payload containing signature+identity information
   * @implements {Messenger~serializer}
   */
  serialize(data, encoding, callback) {
    let [id, buffer, target] = data;
    let payload = jsonrpc.parse(buffer.toString('utf8')).map((obj) => {
      return obj.payload;
    });
    let { signature, recovery } = secp256k1.sign(
      utils._sha256(buffer),
      this.privateKey
    );
    let authenticate = jsonrpc.notification('AUTHENTICATE', [
      Buffer.concat([Buffer.from([recovery]), signature]).toString('base64'),
      this.publicKey.toString('hex')
    ]);

    payload.push(authenticate);
    callback(null, [
      id,
      Buffer.from(JSON.stringify(payload), 'utf8'),
      target
    ]);
  }

  /**
   * Parses and verifies the signature payload, then passes through to the
   * JsonRpcDeserializer if successful
   * @implements {Messenger~deserializer}
   */
  deserialize(buffer, encoding, callback) {
    /* eslint max-statements: [2, 30] */
    /* eslint complexity: [2, 12] */
    let payload = jsonrpc.parse(buffer.toString('utf8'))

    try {
      payload = payload.map(obj => {
        assert(obj.type !== 'invalid');
        return obj.payload;
      });
    } catch (err) {
      return callback(new Error('Failed to parse received payload'));
    }

    let [, identify] = payload;
    let authenticate = payload.filter(m => m.method === 'AUTHENTICATE').pop();

    if (typeof authenticate === 'undefined') {
      return callback(new Error('Missing authentication payload in message'));
    }

    let identity = Buffer.from(identify.params[0], 'hex');
    let [signature, publicKey] = authenticate.params;

    let signedPayload = [];

    for (let i = 0; i < payload.length; i++) {
      if (payload[i].method === 'AUTHENTICATE') {
        break;
      } else {
        signedPayload.push(payload[i]);
      }
    }

    signedPayload = utils._sha256(
      Buffer.from(JSON.stringify(signedPayload), 'utf8')
    );

    let publicKeyHash = utils.toPublicKeyHash(Buffer.from(publicKey, 'hex'));
    let pendingValid = this._pendingValidators.get(
      identity.toString('hex')
    );

    if (pendingValid && pendingValid.pubkey !== publicKey) {
      return callback(new Error('Failed pending contact validation'));
    }

    if (this.opts.checkPublicKeyHash && publicKeyHash.compare(identity) !== 0) {
      return callback(new Error('Identity does not match public key'));
    }

    try {
      assert.ok(secp256k1.verify(
        signedPayload,
        Buffer.from(signature, 'base64').slice(1),
        Buffer.from(publicKey, 'hex')
      ));
    } catch (err) {
      return callback(new Error('Message includes invalid signature'));
    }

    callback(null, buffer);
  }

}

/**
 * Registers a {@link module:kadence/spartacus~SpartacusPlugin} with a
 * {@link KademliaNode}
 * @param {string} priv - Private key
 * @param {object} opts - Plugin options
 */
module.exports = function(priv, opts) {
  return function(node) {
    return new SpartacusPlugin(node, priv, opts);
  };
};

module.exports.SpartacusPlugin = SpartacusPlugin;
