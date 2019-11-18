'use strict';

const merge = require('merge');
const { Duplex: DuplexStream } = require('stream');
const dgram = require('dgram');
const utils = require('./utils');


/**
 * Implements a UDP transport adapter
 */
class UDPTransport extends DuplexStream {

  static get DEFAULTS() {
    return {
      type: 'udp4',
      reuseAddr: false,
      allowLoopbackAddresses: true
    };
  }

  /**
   * Constructs a datagram socket interface
   * @constructor
   * @param {object} [socketOpts] - Passed to dgram.createSocket(options)
   */
  constructor(options) {
    super({ objectMode: true });
    this._options = merge(UDPTransport.DEFAULTS, options);

    this.socket = dgram.createSocket({
      type: this._options.type,
      reuseAddr: this._options.reuseAddr
    });

    this.socket.on('error', (err) => this.emit('error', err));
  }

  /**
   * Implements the writable interface
   * @private
   */
  _write([, buffer, target], encoding, callback) {
    let [, contact] = target;

    this.socket.send(buffer, 0, buffer.length, contact.port, contact.hostname,
      callback);
  }

  /**
   * Implements the readable interface
   * @private
   */
  _read() {
    this.socket.once('message', (buffer) => {
      this.push(buffer);
    });
  }

  /**
   * @private
   */
  _validate(contact) {
    return utils.isValidContact(contact, this._options.allowLoopbackAddresses);
  }

  /**
   * Binds the socket to the [port] [, address] [, callback]
   * @param {number} [port=0] - Port to bind to
   * @param {string} [address=0.0.0.0] - Address to bind to
   * @param {function} [callback] - called after bind complete
   */
  listen() {
    this.socket.bind(...arguments);
  }

}

module.exports = UDPTransport;
