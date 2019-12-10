'use strict';

const secp256k1 = require('secp256k1');
const crypto = require('crypto');
const merge = require('merge');
const assert = require('assert');
const net = require('net');
const tls = require('tls');
const { Transform } = require('stream');
const { createLogger } = require('bunyan');
const { randomBytes } = require('crypto');
const { EventEmitter } = require('events');
const Handshake = require('./handshake');

/** Manages a group of connections that compose a tunnel */
class Tunnel extends EventEmitter {

  static get DEFAULTS() {
    return {
      maxConnections: 24,
      logger: createLogger({ name: 'diglet' }),
      transform: function(data, enc, cb) {
        cb(null, data)
      },
      privateKey: randomBytes(32),
      secureLocalConnection: false
    };
  }

  /**
   * Create a tunnel
   * @param {object} options
   * @param {string} options.localAddress - The local IP or hostname to expose
   * @param {number} options.localPort - The local port to expose
   * @param {string} options.remoteAddress - The remote tunnel address
   * @param {number} options.remotePort - The remote tunnel port
   * @param {number} [options.maxConnections=24] - Total connections to maintain
   * @param {object} [options.logger=console] - Logger to use
   * @param {stream.Transform} [options.transform] - Transform stream for
   * manipulating incoming proxied stream
   */
  constructor(options) {
    super();
    this.setMaxListeners(0);

    this._opts = this._checkOptions(merge(Tunnel.DEFAULTS, options));
    this._logger = this._opts.logger;
    this._pool = new Set();

    this.on('open', tunnel => this._handleTunnelOpen(tunnel));
  }

  /**
   * Validates options given to constructor
   * @private
   */
  _checkOptions(o) {
    assert(typeof o.localAddress === 'string', 'Invalid localAddress');
    assert(typeof o.localPort === 'number', 'Invalid localPort');
    assert(typeof o.remoteAddress === 'string', 'Invalid remoteAddress');
    assert(typeof o.remotePort === 'number', 'Invalid remotePort');
    assert(typeof o.maxConnections === 'number', 'Invalid maxConnections');
    return o;
  }

  /**
   * Gets the appropriate tunnel URL
   * @returns {string}
   */
  get url() {
    const pubkey = secp256k1.publicKeyCreate(this._opts.privateKey);
    const id = crypto.createHash('rmd160')
      .update(crypto.createHash('sha256').update(pubkey).digest())
      .digest('hex');

    return `https://${id}.${this._opts.remoteAddress}`;
  }

  /**
   * Establishes the tunnel connection
   */
  open() {
    this._logger.info(
      'establishing %s connections to %s:%s',
      this._opts.maxConnections,
      this._opts.remoteAddress,
      this._opts.remotePort
    );

    for (let i = this._pool.size; i < this._opts.maxConnections; i++) {
      this._logger.debug('creating remote connection %s', i + 1);
      this._createRemoteConnection();
    }

    return this;
  }

  /**
   * Sets up listeners and tracks status of a given tunnel
   * @private
   */
  _handleTunnelOpen(tunnelConnection) {
    this._logger.debug('a tunnel connection was opened');

    const _handleClose = () => {
      this._logger.warn('all tunnel connections were closed');
      tunnelConnection.destroy();
    };

    const _handleTunnelClose = () => {
      this._logger.debug('a tunnel connection was closed');
      this.removeListener('close', _handleClose);
    };

    this.once('close', _handleClose);
    tunnelConnection.once('close', _handleTunnelClose);
  }

  /**
   * Connects out to the remote proxy
   * @private
   */
  _createRemoteConnection() {
    const remoteConnection = tls.connect({
      host: this._opts.remoteAddress,
      port: this._opts.remotePort,
      rejectUnauthorized: false // so we can use the same cert for the proxy
    });

    remoteConnection.setKeepAlive(true);
    remoteConnection.setNoDelay(true);

    remoteConnection.on('error', err => {
      this._logger.error('error with remote connection: %s', err.message);
      this._handleRemoteError(remoteConnection, err);
      this._pool.delete(remoteConnection);
    });

    remoteConnection.once('connect', () => {
      this._logger.info('remote connection established, waiting for challenge');
      this._pool.add(remoteConnection);
    });

    remoteConnection.on('close', () => {
      this._logger.info('remote connection closed');
      this._pool.delete(remoteConnection);
    });

    remoteConnection.once('data', data => {
      this._logger.info('received challenge, signing handshake');
      remoteConnection.write(
        Handshake.from(data).sign(this._opts.privateKey).toBuffer()
      );
      this.emit('open', remoteConnection);
      this._createLocalConnection(remoteConnection);
    });
  }

  /**
   * Opens the connection to the local server
   * @private
   */
  _createLocalConnection(remoteConnection) {
    const proto = this._opts.secureLocalConnection
      ? tls
      : net;

    this._logger.debug('creating local connection...');

    if (remoteConnection.destroyed) {
      this._logger.warn('remote connection was destroyed, reconnecting...');
      return this._createRemoteConnection();
    }

    var localConnection = proto.connect({
      host: this._opts.localAddress,
      port: this._opts.localPort,
      rejectUnauthorized: false // so local servers can self-sign
    });

    remoteConnection.pause();

    remoteConnection.once('close', () => {
      this._logger.info('remote connection closed, ending local connection');
      localConnection.end();
      this._logger.info('reopening remote tunnel connection');
      this._createRemoteConnection();
    });

    localConnection.once('error', err => {
      this._handleLocalError(err, localConnection, remoteConnection);
    });

    localConnection.once('connect', () => {
      this._handleLocalOpen(localConnection, remoteConnection);
    });
  }

  /**
   * Handles errors from the local server
   * @private
   */
  _handleLocalError(err, localConnection, remoteConnection) {
    localConnection.end();
    remoteConnection.removeAllListeners('close');

    this._logger.error('local connection error: %s', err.message);

    if (err.code !== 'ECONNREFUSED') {
      return remoteConnection.end();
    }

    setTimeout(() => this._createLocalConnection(remoteConnection), 1000);
  }

  /**
   * Connects the local and remote sockets to create tunnel
   * @private
   */
  _handleLocalOpen(localConnection, remoteConnection) {
    let stream = remoteConnection;

    this._logger.info('local connection opened');

    if (this._opts.localAddress !== 'localhost') {
      stream = remoteConnection.pipe(this._transformHeaders());
    }

    stream = stream.pipe(new Transform({ transform: this._opts.transform }));

    this._logger.info('connecting local and remote connections');
    stream.pipe(localConnection).pipe(remoteConnection);
    this.emit('connected');
  }

  /**
   * Transforms the host header
   * @private
   */
  _transformHeaders() {
    let replaced = false;

    return new Transform({
      transform: (chunk, enc, cb) => {
        if (replaced) {
          return cb(null, chunk);
        }

        chunk = chunk.toString();

        cb(null, chunk.replace(/(\r\nHost: )\S+/, (match, $1) => {
          replaced = true;
          return $1 + this._opts.localAddress;
        }));
      }
    });
  }

  /**
   * Handles errors from the remote proxy
   * @private
   */
  _handleRemoteError(remoteConnection, err) {
    if (err.code === 'ECONNREFUSED') {
      this.emit('disconnected', new Error('Tunnel connection refused'));
    }

    this._logger.error('remote connection encountered error: %s', err.message);
    remoteConnection.end();
    remoteConnection.destroy();
  }

}

module.exports = Tunnel;
