'use strict';

const merge = require('merge');
const http = require('http');
const net = require('tls');
const { createLogger } = require('bunyan');
const crypto = require('crypto');
const Proxy = require('./proxy');
const Handshake = require('./handshake');
const HSTS_POLICY_HEADER = 'max-age=31536000; includeSubDomains';

/** Manages a collection of proxy tunnels and routing incoming requests */
class Server {

  static get DEFAULTS() {
    return {
      proxyMaxConnections: 48,
      logger: createLogger({ name: 'diglet' }),
      whitelist: false,
      key: null,
      cert: null
    };
  }

  /**
   * Represents a tunnel/proxy server
   * @param {Object} options
   * @param {Number} [options.proxyMaxConnections=48] - Max tunnels for proxy
   * @param {Object} [options.logger=console] - Custom logger to use
   */
  constructor(options) {
    this._opts = this._checkOptions(merge(Server.DEFAULTS, options));
    this._proxies = new Map();
    this._logger = this._opts.logger;
    this._server = net.createServer({
      key: this._opts.key,
      cert: this._opts.cert
    }, sock => this._handleTunnelClient(sock));
  }

  /**
   * Listens for tunnel clients on the port
   * @param {number} port
   */
  listen() {
    this._server.listen(...arguments);
  }

  /**
   * Validates options given to constructor
   * @private
   */
  _checkOptions(o) {
    return o;
  }

  /**
   * Establishes a handshake with a tunnel client and creates a proxy
   * @private
   */
  _handleTunnelClient(socket) {
    const challenge = Handshake.challenge();

    socket.once('data', message => {
      this._logger.info('received challenge response from client');

      const handshake = Handshake.from(message);
      const id = crypto.createHash('rmd160').update(
        crypto.createHash('sha256').update(handshake.pubkey || '').digest()
      ).digest('hex');

      if (Buffer.compare(challenge, handshake.challenge) !== 0) {
        this._logger.info('invalid challenge response - bad challenge');
        return socket.destroy();
      }

      if (!handshake.verify()) {
        this._logger.info('invalid challenge response - bad signature');
        return socket.destroy();
      }

      if (this._opts.whitelist && this._opts.whitelist.indexOf(id) === -1) {
        this._logger.info('invalid challenge response - not in whitelist');
        return socket.destroy();
      }

      const proxy = this._proxies.get(id) || new Proxy({
        id,
        logger: this._logger,
        maxConnections: this._opts.proxyMaxConnections
      });

      this._proxies.set(id, proxy);
      proxy.push(socket);
    });

    socket.on('error', err => {
      this._logger.warn(err.message);
      socket.destroy();
    });

    this._logger.info('tunnel client opened, issuing challenge');
    socket.write(challenge);
  }

  /**
   * Routes the incoming HTTP request to it's corresponding proxy
   * @param {String} proxyId - The unique ID for the proxy instance
   * @param {http.IncomingMessage} request
   * @param {http.ServerResponse} response
   * @param {Server~routeHttpRequestCallback} callback
   */
  routeHttpRequest(proxyId, request, response, callback) {
    const proxy = this._proxies.get(proxyId);

    this._logger.info('routing HTTP request to proxy');

    if (!proxy) {
      this._logger.warn('no proxy with id %s exists', proxyId);
      response.statusCode = 502;
      response.setHeader('Strict-Transport-Security', HSTS_POLICY_HEADER);
      response.end('Unable to route to tunnel, client is not connected');
      response.connection.destroy();
      return callback(false);
    }

    let responseDidFinish = false;

    const _onFinished = () => {
      this._logger.info('response finished, destroying connection');
      responseDidFinish = true;
      request.connection.destroy();
    };

    const _sendCannotService = () => {
      response.statusCode = 504;
      response.setHeader('Strict-Transport-Security', HSTS_POLICY_HEADER);
      response.end('Client cannot service request at this time');
      request.connection.destroy();
    };

    response
      .once('finish', _onFinished)
      .once('error', _onFinished)
      .once('close', _onFinished);

    const getSocketHandler = (proxySocket, addSocketBackToPool) => {
      if (responseDidFinish) {
        this._logger.warn('response already finished, aborting');
        return addSocketBackToPool && addSocketBackToPool();
      } else if (!proxySocket) {
        this._logger.warn('no proxied sockets back to client are available');
        return _sendCannotService();
      }

      const clientRequest = http.request({
        path: request.url,
        method: request.method,
        headers: request.headers,
        createConnection: () => proxySocket
      });

      const _forwardResponse = (clientResponse) => {
        this._logger.info('forwarding tunneled response back to requester');
        proxySocket.setTimeout(0);
        response.writeHead(clientResponse.statusCode, {
          'Strict-Transport-Security': HSTS_POLICY_HEADER,
          ...clientResponse.headers
        });
        clientResponse.pipe(response);
      };

      this._logger.info('tunneling request through to client');
      proxySocket.setTimeout(2000);
      proxySocket.on('timeout', () => {
        _sendCannotService();
        clientRequest.abort();
        proxySocket.destroy();
      });
      response.once('finish', () => addSocketBackToPool());
      clientRequest.on('abort', () => proxy.pop(getSocketHandler));
      clientRequest.on('response', (resp) => _forwardResponse(resp));
      clientRequest.on('error', () => request.connection.destroy());
      request.pipe(clientRequest);
    };

    this._logger.info('getting proxy tunnel socket back to client...');
    proxy.pop(getSocketHandler);
    callback(true);
  }
  /**
   * @callback Server~routeHttpRequestCallback
   * @param {Boolean} didRouteRequest
   */

  /**
   * Routes the incoming WebSocket connection to it's corresponding proxy
   * @param {String} proxyId - The unique ID for the proxy instance
   * @param {http.IncomingMessage} request
   * @param {net.Socket} socket
   * @param {Server~routeWebSocketConnectionCallback} callback
   */
  routeWebSocketConnection(proxyId, request, socket, callback) {
    const proxy = this._proxies.get(proxyId);

    if (!proxy) {
      socket.destroy();
      return callback(false);
    }

    let socketDidFinish = false;

    socket.once('end', () => socketDidFinish = true);
    proxy.pop(function(proxySocket) {
      if (socketDidFinish) {
        return;
      } else if (!proxySocket) {
        socket.destroy();
        request.connection.destroy();
        return;
      }

      proxySocket.pipe(socket).pipe(proxySocket);
      proxySocket.write(Server.recreateWebSocketHeaders(request));
    });

    callback(true);
  }
  /**
   * @callback Server~routeWebSocketConnectionCallback
   * @param {Boolean} didRouteConnection
   */

  /**
   * Recreates the header information for websocket connections
   * @private
   */
  static recreateWebSocketHeaders(request) {
    var headers = [
      `${request.method} ${request.url} HTTP/${request.httpVersion}`
    ];

    for (let i = 0; i < (request.rawHeaders.length - 1); i += 2) {
      headers.push(`${request.rawHeaders[i]}: ${request.rawHeaders[i + 1]}`);
    }

    headers.push(`Strict-Transport-Security: ${HSTS_POLICY_HEADER}`);
    headers.push('');
    headers.push('');

    return headers.join('\r\n');
  }

}

module.exports = Server;
