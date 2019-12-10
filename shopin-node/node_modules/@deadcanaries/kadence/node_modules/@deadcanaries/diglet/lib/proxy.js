'use strict';

const merge = require('merge');
const assert = require('assert');
const { createLogger } = require('bunyan');
const { EventEmitter } = require('events');

/**
 * Sets up a proxy server for use by the remote tunnel server
 */
class Proxy extends EventEmitter {

  static get DEFAULTS() {
    return {
      id: null,
      maxConnections: 48,
      logger: createLogger({ name: 'diglet' })
    };
  }

  /**
   * Manages proxy for tunneling hosts to connect
   * @param {object} options
   * @param {string} options.id - Unique ID for this proxy
   * @param {Object} [options.maxConnections=24] - Maximum inbound connections
   * @param {Object} [options.logger=console] - Logger to use
   */
  constructor(options) {
    super();

    this._opts = this._checkOptions(merge(Proxy.DEFAULTS, options));
    this._waitingHandlers = [];
    this._connectedSockets = [];
    this._logger = this._opts.logger;
  }

  /**
   * Validates options given to constructor
   * @private
   */
  _checkOptions(o) {
    assert(typeof o.maxConnections === 'number', 'Invalid maxConnections');
    assert(typeof o.id === 'string', 'Invalid proxyId');
    return o;
  }

  get id() {
    return this._opts.id;
  }

  /**
   * Returns a connected socket off the list to process a request and places it
   * back when the handler is finished
   * @param {Proxy~socketHandler} socketHandler
   */
  pop(socketHandler) {
    const socket = this._connectedSockets.shift();

    this._logger.info('getting socket from proxy tunnel');

    if (!socket) {
      this._logger.warn('no socket available, queuing handler');
      return this._waitingHandlers.push(socketHandler);
    } else if (socket.destroyed) {
      this._logger.warn('got destroyed socket, getting another...');
      this._handleSocketClose(socket);
      return this.pop(socketHandler);
    }

    this._logger.info('got tunnel socket, passing to handler');
    socketHandler(socket, () => {
      this._logger.info('socket handler finished, adding back to pool');

      if (!socket.destroyed) {
        this._connectedSockets.push(socket);
      }

      if (this._connectedSockets.length !== 0) {
        this._processNextWaitingHandler();
      }
    });
  }
  /**
   * @callback Proxy~socketHandler
   * @param {net.Socket} socket - The socket back to the client
   * @param {Proxy~socketHandlerCallback}
   */
  /**
   * @callback Proxy~socketHandlerCallback
   * @param {Error|null} error - Possible error during handling
   */

  /**
   * Pulls the next waiting hanlder off the list and processes it
   * @private
   */
  _processNextWaitingHandler() {
    const waitingHandler = this._waitingHandlers.shift();

    if (waitingHandler) {
      this.pop(waitingHandler);
    }
  }

  /**
   * Cleans up waiting and open connections
   */
  clean() {
    const destroyed = [];

    this._logger.info('cleaning connection pool');
    this._waitingHandlers.forEach(handler => handler(null));
    this._connectedSockets.forEach(socket => {
      if (socket.destroyed) {
        destroyed.push(socket);
      }
    });
    destroyed.forEach(socket => {
      this._connectedSockets.splice(this._connectedSockets.indexOf(socket), 1);
    });
    this.emit('end');
  }

  /**
   * Processes incoming connections from tunnel client
   * @param {net.Socket} socket - Raw socket from an incoming connection
   */
  push(socket) {
    this._logger.info('handling incoming tunnel connection');

    if (this._connectedSockets.length >= this._opts.maxConnections) {
      this._logger.warn('maximum tunnel sockets enhausted');
      return socket.end();
    }

    this._logger.info('establishing tunnel connection to client');
    socket.on('close', () => this._handleSocketClose(socket));
    socket.on('error', (err) => this._handleSocketError(socket, err));
    this._connectedSockets.push(socket);
    this._processNextWaitingHandler();
  }

  /**
   * Handles a socket error
   * @private
   */
  _handleSocketError(socket, err) {
    this._logger.error('socket encountered an error: %s', err.message);
    this.clean();
    socket.destroy();
  }

  /**
   * Handles a closed tunnel socket
   * @private
   */
  _handleSocketClose(socket) {
    const index = this._connectedSockets.indexOf(socket);

    if (index !== -1) {
      return;
    }

    this._connectedSockets.splice(index, 1);
  }

}

module.exports = Proxy;
