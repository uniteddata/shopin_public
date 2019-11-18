'use strict';

const assert = require('assert');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');


/**
 * Create an validate a proxy authentication handshake
 */
class Handshake {

  /**
   * Generates a random 32 byte challenge
   * @returns {buffer}
   */
  static challenge() {
    return randomBytes(32);
  }

  static from(buffer) {
    assert(Buffer.isBuffer(buffer));
    return new Handshake(
      buffer.slice(0, 32),
      buffer.slice(32, 65),
      buffer.slice(65)
    );
  }

  /**
   * @constructor
   * @param {buffer} challenge - Random bytes for challenge to sign
   * @param {buffer} publicKey - SECP256K1 public key
   * @param {buffer} signature - ECDSA signature of the challenge
   */
  constructor(challenge, pubkey, signature) {
    this.challenge = challenge || Handshake.challenge();
    this.pubkey = pubkey;
    this.signature = signature;
  }

  /**
   * Verifies the signature
   * @returns {boolean}
   */
  verify() {
    try {
      return secp256k1.verify(this.challenge, this.signature, this.pubkey);
    } catch (err) {
      return false;
    }
  }

  /**
   * Signs the challenge
   * @param {buffer} privateKey - SECP256K1 private key
   * @returns {Handshake}
   */
  sign(privkey) {
    this.pubkey = secp256k1.publicKeyCreate(privkey);
    this.signature = secp256k1.sign(this.challenge, privkey).signature;

    return this;
  }

  /**
   * Serialize to a buffer
   * @returns {buffer}
   */
  toBuffer() {
    return Buffer.concat([
      this.challenge,
      this.pubkey,
      this.signature
    ]);
  }

}

module.exports = Handshake;
