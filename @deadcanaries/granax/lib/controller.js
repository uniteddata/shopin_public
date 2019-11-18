'use strict';

const crypto = require('crypto');
const async = require('async');
const { Transform: TransformStream } = require('stream');
const merge = require('merge');
const { readFileSync } = require('fs');
const { EventEmitter } = require('events');
const commands = require('./commands');
const replies = require('./replies');


/**
 * Represents a Tor controller for issuing commands
 */
class TorController extends EventEmitter {

  static get CLIENT_HASH() {
    return 'Tor safe cookie authentication controller-to-server hash';
  }

  /**
   * Creates the challenge response from a SAFECOOKIE challenge
   * @param {string} cookie - The secret cookie string
   * @param {string} clientNonce - Client nonce sent with auth challenge
   * @param {string} serverNonce - Server nonce reply from auth challenge
   * @returns {string}
   */
  static createChallengeResponse(cookie, clientNonce, serverNonce) {
    return crypto.createHmac('sha256', TorController.CLIENT_HASH)
      .update(Buffer.concat([
        Buffer.from(cookie, 'hex'),
        Buffer.from(clientNonce, 'hex'),
        Buffer.from(serverNonce, 'hex')
      ]))
      .digest('hex');
  }

  /**
   * Creates a message splitter from incoming socket data
   * @static
   */
  static createReplySplitter() {
    return new TransformStream({
      objectMode: true,
      transform: function(data, enc, next) {
        let reply = [];
        let lines = data.toString().split('\r\n');

        for (let line of lines) {
          reply.push(line);

          if (line[3] === ' ') {
            this.push(reply);
            reply = [];
          }
        }

        next(null);
      }
    });
  }

  /**
   * Fired when the underlying socket encounters an error
   * @event TorController#error
   * @type {error}
   */

  /**
   * Fires when the controller is authenticated and ready to send commands
   * @event TorController#ready
   */

  /**
   * Fires when the underlying socket closes
   * @event TorController#close
   */

  static get DEFAULTS() {
    return {
      authOnConnect: true
    };
  }

  /**
   * @constructor
   * @param {Socket} socket - net.Socket connected to Tor's control port
   * @param {object} [options]
   * @param {boolean} [options.authOnConnect=true] - Automatically authenticate
   */
  constructor(socket, options) {
    super();

    this._opts = merge(TorController.DEFAULTS, options);
    this._stack = [];

    this.socket = socket
      .on('connect', () => this._handleConnect())
      .on('error', (err) => this._handleError(err))
      .on('close', () => this._handleClose());

    this.socket.pipe(TorController.createReplySplitter())
      .on('data', (data) => this._handleReply(data));
  }

  /**
   * Handles authentication routine on socket connect
   * @private
   * @param {function} callback
   */
  _authOnConnect(callback) {
    const self = this;
    const clientNonce = crypto.randomBytes(32).toString('hex');

    function maybeGetChallenge(cookie, authTypes, next) {
      if (authTypes.includes('SAFECOOKIE')) {
        self.getAuthChallenge(clientNonce, (err, result) => {
          next(err, result, cookie)
        });
      } else {
        next(null, {}, cookie);
      }
    }

    function sendAuthCommand({ hash, nonce }, cookie, next) {
      if (!(hash && nonce)) {
        return self.authenticate(cookie, next);
      }

      self.authenticate(TorController.createChallengeResponse(
        cookie,
        clientNonce,
        nonce,
        hash
      ), next);
    }

    async.waterfall([
      (next) => this._getAuthCookie(next),
      (cookie, authTypes, next) => maybeGetChallenge(cookie, authTypes, next),
      (challenge, cookie, next) => sendAuthCommand(challenge, cookie, next)
    ], callback);
  }

  /**
   * Handles authentication upon socket connection
   * @private
   */
  _handleConnect() {
    if (this._opts.authOnConnect) {
      this._authOnConnect((err) => this.emit(err ? 'error': 'ready', err));
    } else {
      this.emit('ready');
    }
  }

  /**
   * Handles errors on the underlying socket and bubbles them
   * @private
   * @param {object} error
   */
  _handleError(err) {
    this.emit('error', err);
  }

  /**
   * Handles message processing and parsing from the socket
   * @private
   * @param {buffer} data
   */
  _handleReply(data) {
    let code = parseInt(data[0].substr(0, 3));
    let lines = data
      .filter((line) => !!line)
      .map((line) => line.substr(4).trim());

    switch (code.toString()[0]) {
      case '2':
        let { method, callback } = this._stack.pop();
        let parsed = replies[method]
          ? replies[method](lines)
          : lines;
        callback(null, parsed);
        break;
      case '4':
      case '5':
        this._stack.pop().callback(new Error(lines[0]));
        break;
      case '6':
      default:
        let event = lines[0].split(' ')[0];
        lines[0] = lines[0].replace(`${event} `, '');
        this.emit(event, lines);
    }
  }

  /**
   * Handles socket close event and bubbles it
   * @private
   */
  _handleClose() {
    this.emit('close');
  }

  /**
   * Send an arbitrary command and pass response to callback
   * @private
   * @param {string} command
   * @param {function} callback
   */
  _send(command, callback) {
    const self = this;

    callback = callback || function(err) {
      /* istanbul ignore else */
      if (err) {
        self.emit('error', err);
      }
    };

    this._stack.unshift({ method: command.split(' ')[0], callback });
    this.socket.write(`${command}\r\n`);
  }

  /**
   * Load the authentication cookie
   * @private
   * @param {TorController~_getAuthCookieCallback} callback
   */
  _getAuthCookie(callback) {
    this.getProtocolInfo((err, info) => {
      if (err) {
        return callback(err);
      }

      try {
        callback(
          null,
          info.auth.cookieFile
            ? readFileSync(info.auth.cookieFile).toString('hex')
            : '',
          info.auth.methods
        );
      } catch (err) {
        callback(err);
      }
    });
  }
  /**
   * @private
   * @callback TorController~_getAuthCookieCallback
   * @param {object|null} error
   * @param {string} cookie
   * @param {string[]} authTypes
   */

  /**
   * Authenticates with the control port given the supplied param
   * @param {string} token
   * @param {TorController~authenticateCallback} callback
   */
  authenticate(token, callback) {
    this._send(commands.AUTHENTICATE(token), callback);
  }

  /**
   * Requests an authentication challenge from tor
   * @param {string} nonce - Client nonce for authenticating
   * @param {TorController~getAuthChallengeCallback} callback
   */
  getAuthChallenge(nonce, callback) {
    this._send(commands.AUTHCHALLENGE(nonce), callback);
  }
  /**
   * @callback TorController~getAuthChallengeCallback
   * @param {object|null} error
   * @param {AuthChallengeResult} result
   */

  /**
   * Ask tor for general information
   * @param {TorController~getProtocolInfoCallback} callback
   */
  getProtocolInfo(callback) {
    this._send(commands.PROTOCOLINFO(), callback);
  }
  /**
   * @callback TorController~getProtocolInfoCallback
   * @param {object|null} error
   * @param {ProtocolInfoResult} result
   */

  /**
   * Establishes a hidden service on the given target
   * @param {array} ports - Array containing optional virtualPort (defaults to 80) and target ip:port string
   * @param {object} [options] - {@link module:commands#ADD_ONION}
   * @param {TorController~createHiddenServiceCallback} callback
   */
  createHiddenService(ports, options, callback) {
    /* istanbul ignore if */
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._send(commands.ADD_ONION(ports, options), callback);
  }
  /**
   * @callback TorController~createHiddenServiceCallback
   * @param {object|null} error
   * @param {AddOnionResult} result
   */

  /**
   * Takes down a running hidden service owned by this controller
   * @param {string} serviceId - Tor hidden service ID
   * @param {TorController~destroyHiddenServiceCallback} callback
   */
  destroyHiddenService(serviceId, callback) {
    this._send(commands.DEL_ONION(serviceId), callback);
  }
  /**
   * @callback TorController~destroyHiddenServiceCallback
   * @param {object|null} error
   */

  /**
   * Change the value for a configuration variable
   * @param {string} keyword - Configuration key
   * @param {string} value - New value to set
   * @param {TorController~setConfigCallback} callback
   */
  setConfig(keyword, value, callback) {
    this._send(commands.SETCONF(keyword, value), callback);
  }
  /**
   * @callback TorController~setConfigCallback
   * @param {object|null} error
   */

  /**
   * Change the value for a configuration variable to it's default
   * @param {string} keyword - Configuration key
   * @param {TorController~resetConfigCallback} callback
   */
  resetConfig(keyword, callback) {
    this._send(commands.RESETCONF(keyword), callback);
  }
  /**
   * @callback TorController~resetConfigCallback
   * @param {object|null} error
   */

  /**
   * Return the values for the given configuration key
   * @param {string} keyword - Configuration key
   * @param {TorController~getConfigCallback} callback
   */
  getConfig(keyword, callback) {
    this._send(commands.GETCONF(keyword), callback);
  }
  /**
   * @callback TorController~getConfigCallback
   * @param {object|null} error
   * @param {GetConfigResult} result
   */

  /**
   * Tell Tor to write out it's config value to it's torrc
   * @param {TorController~saveConfigCallback} callback
   */
  saveConfig(callback) {
    this._send(commands.SAVECONF(), callback);
  }
  /**
   * @callback TorController~saveConfigCallback
   * @param {object|null} error
   */

  /**
   * Reloads the config values set
   * @param {TorController~reloadConfigCallback} callback
   */
  reloadConfig(callback) {
    this.signal('RELOAD', callback);
  }
  /**
   * @callback TorController~reloadConfigCallback
   * @param {object|null} error
   */

  /**
   * Controlled shutdown signal
   * @param {TorController~shutdownCallback} callback
   */
  shutdown(callback) {
    this.signal('SHUTDOWN', callback);
  }
  /**
   * @callback TorController~shutdownCallback
   * @param {object|null} error
   */

  /**
   * Dump stats to tor log file
   * @param {TorController~dumpStatsCallback} callback
   */
  dumpStats(callback) {
    this.signal('DUMP', callback);
  }
  /**
   * @callback TorController~dumpStatsCallback
   * @param {object|null} error
   */

  /**
   * Set open logs to debug level
   * @param {TorController~enableDebugCallback} callback
   */
  enableDebug(callback) {
    this.signal('DEBUG', callback);
  }
  /**
   * @callback TorController~enableDebugCallback
   * @param {object|null} error
   */

  /**
   * Shutdown tor immediately
   * @param {TorController~haltCallback} callback
   */
  halt(callback) {
    this.signal('HALT', callback);
  }
  /**
   * @callback TorController~haltCallback
   * @param {object|null} error
   */

  /**
   * Forget client side hostname->ip cache
   * @param {TorController~clearDnsCacheCallback} callback
   */
  clearDnsCache(callback) {
    this.signal('CLEARDNSCACHE', callback);
  }
  /**
   * @callback TorController~clearDnsCacheCallback
   * @param {object|null} error
   */

  /**
   * Clears DNS cache and establishes new clean circuits
   * @param {TorController~cleanCircuitsCallback} callback
   */
  cleanCircuits(callback) {
    this.signal('NEWNYM', callback);
  }
  /**
   * @callback TorController~cleanCircuitsCallback
   * @param {object|null} error
   */

  /**
   * Dumps a heartbeat message to the logs
   * @param {TorController~dumpHeartbeatCallback} callback
   */
  dumpHeartbeat(callback) {
    this.signal('HEARTBEAT', callback);
  }
  /**
   * @callback TorController~dumpHeartbeatCallback
   * @param {object|null} error
   */

  /**
   * Sends a signal to the control port
   * @param {string} signal
   * @param {TorController~signalCallback} callback
   */
  signal(sig, callback) {
    this._send(commands.SIGNAL(sig), callback);
  }
  /**
   * @callback TorController~signalCallback
   * @param {object|null} error
   */

  /**
   * Instruct Tor to route requests to the target to the replacement
   * @param {string} target - Original address to map
   * @param {string} replacement - New address to route request to target
   * @param {TorController~createAddressMappingCallback} callback
   */
  createAddressMapping(target, replacement, callback) {
    this._send(commands.MAPADDRESS(target, replacement), callback);
  }
  /**
   * @callback TorController~createAddressMappingCallback
   * @param {object|null} error
   */

  /**
   * Creates a new circuit, returning the newly created circuit ID
   * @param {string} [purpose="general"] - The circuit purpose, either general|controller
   * @param {TorController~createCircuitCallback}
   */
  createCircuit(purpose, callback) {
    /* istanbul ignore if */
    if (typeof purpose === 'function') {
      callback = purpose;
      purpose = null;
    }

    this._send(commands.EXTENDCIRCUIT('0', purpose), callback);
  }
  /**
   * @callback TorController~createCircuitCallback
   * @param {object|null} error
   * @param {string[]} result
   */

  /**
   * Extends the existing circuit
   * @param {string} circuitId - The circuit ID to extend
   * @param {TorController~extendCircuitCallback}
   */
  extendCircuit(id, callback) {
    this._send(commands.EXTENDCIRCUIT(id), callback);
  }
  /**
   * @callback TorController~extendCircuitCallback
   * @param {object|null} error
   * @param {string[]} result
   */

  /**
   * Sets the purpose of the given circuit
   * @param {string} circuitId - The identifier for the circuit
   * @param {string} purpose - One of general|controller
   * @param {TorController~setCircuitPurposeCallback} callback
   */
  setCircuitPurpose(circuitId, purpose, callback) {
    this._send(commands.SETCIRCUITPURPOSE(circuitId, purpose), callback);
  }
  /**
   * @callback TorController~setCircuitPurposeCallback
   * @param {object|null} error
   */

  /**
   * Attaches the specified stream to the given circuit
   * @param {string} streamId - ID for the stream to attach
   * @param {string} [circuitId=0] - Circuit to attach stream
   * @param {number} [hopNumber] - Which hop to exit circuit
   * @param {TorController~attachStreamCallback} callback
   */
  attachStream(streamId, options, callback) {
    /* istanbul ignore if */
    if (typeof options === 'function') {
      callback = options;
      options = { circuitId: '0', hopNumber: null };
    }

    this._send(commands.ATTACHSTREAM(streamId, options), callback);
  }
  /**
   * @callback TorController~attachStreamCallback
   * @param {object|null} error
   */

  /**
   * Inform the server about a new descriptor
   * @param {object} descriptor - Key-value pairs for server descriptor
   * @param {object} [options]
   * @param {string} [options.purpose="general"] - general|controller|bridge
   * @param {boolean} [options.cache=true] - Flag for caching descriptor
   * @param {TorController~postDescriptorCallback} callback
   */
  postDescriptor(descriptor, options, callback) {
    /* istanbul ignore if */
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._send(commands.POSTDESCRIPTOR(descriptor, options), callback);
  }
  /**
   * @callback TorController~postDescriptorCallback
   * @param {object|null} error
   */

  /**
   * Change the exit address on a given stream
   * @param {string} streamId - ID for stream to redirect
   * @param {string} address - Exit address for the given stream
   * @param {number} [port] - Exit port for the given stream
   * @param {TorController~redirectStreamCallback} callback
   */
  redirectStream(streamId, address, port, callback) {
    /* istanbul ignore if */
    if (typeof port === 'function') {
      callback = port;
      port = null;
    }

    this._send(commands.REDIRECTSTREAM(streamId, address, port), callback);
  }
  /**
   * @callback TorController~redirectStreamCallback
   * @param {object|null} error
   */

  /**
   * Closes the exit for the given stream
   * @param {string} streamId - ID for the stream to close
   * @param {number} [reason=1] - Reason code for closing stream
   * @param {TorController~closeStreamCallback} callback
   * @see https://gitweb.torproject.org/torspec.git/tree/tor-spec.txt#n1404
   */
  closeStream(streamId, reason, callback) {
    /* istanbul ignore if */
    if (typeof reason === 'function') {
      callback = reason;
      reason = 1;
    }

    this._send(commands.CLOSESTREAM(streamId, reason), callback);
  }
  /**
   * @callback TorController~closeStreamCallback
   * @param {object|null} error
   */

  /**
   * Closes the given circuit
   * @param {string} circuitId - ID for the circuit to close
   * @param {object} [options]
   * @param {boolean} [options.ifUnused=false] - Only close if not in use
   * @param {TorController~closeCircuitCallback} callback
   */
  closeCicuit(circuitId, options, callback) {
    /* istanbul ignore if */
    if (typeof options === 'function') {
      callback = options;
      options = { ifUnused: false };
    }

    this._send(commands.CLOSECIRCUIT(circuitId, options), callback);
  }
  /**
   * @callback TorController~closeCircuitCallback
   * @param {object|null} error
   */

  /**
   * Tells Tor to hang up on the controller
   * @param {TorController~quitCallback} callback
   */
  quit(callback) {
    this._send(commands.QUIT(), callback);
  }
  /**
   * @callback TorController~quitCallback
   * @param {object|null} error
   */

  /**
   * Launch remote hostname lookup - answer returnd as async ADDRMAP event
   * @param {string} address - Address to lookup
   * @param {object} [options]
   * @param {boolean} [options.reverse=false] - Perform reverse lookup
   * @param {TorController~resolveCallback} callback
   */
  resolve(address, options, callback) {
    /* istanbul ignore if */
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._send(commands.RESOLVE(address, options.reverse), callback);
  }
  /**
   * @callback TorController~resolveCallback
   * @param {object|null} error
   */

  /**
   * Instruct Tor to load the configuration file from the given text
   * @param {string} configText - Complete torrc config text to load
   * @param {TorController~loadConfigCallback} callback
   */
  loadConfig(configText, callback) {
    this._send(commands.LOADCONF(configText), callback);
  }
  /**
   * @callback TorController~loadConfigCallback
   * @param {object|null} error
   */

  /**
   * Take ownership of the tor process - will close tor when the connection
   * closes
   * @param {TorController~takeOwnershipCallback} callback
   */
  takeOwnership(callback) {
    this._send(commands.TAKEOWNERSHIP(), (err) => {
      /* istanbul ignore if */
      if (err) {
        return callback(err);
      }

      this.resetConfig('__OwningControllerProcess', callback);
    });
  }
  /**
   * @callback TorController~takeOwnershipCallback
   * @param {object|null} error
   */

  /**
   * Tells the server to drop all guard nodes. Do not invoke this command
   * lightly; it can increase vulnerability to tracking attacks over time.
   * @param {TorController~dropGuardsCallback} callback
   */
  dropGuards(callback) {
    this._send(commands.DROPGUARDS(), callback);
  }
  /**
   * @callback TorController~dropGuardsCallback
   * @param {object|null} error
   */

  /**
   * Fetches descriptors for the given hidden service
   * @param {string} serviceId - ID for the hidden service
   * @param {string} [serverLongName] - Long name for specific server to use
   * @param {TorController~fetchHiddenServiceDescriptorCallback} callback
   */
  fetchHiddenServiceDescriptor(serviceId, serverLongName, callback) {
    /* istanbul ignore if */
    if (typeof serverLongName === 'function') {
      callback = serverLongName;
      serverLongName = '';
    }

    this._send(commands.HSFETCH(serviceId, serverLongName), callback);
  }
  /**
   * @callback TorController~fetchHiddenServiceDescriptorCallback
   * @param {object|null} error
   */

  /**
   * Launch a hidden service descriptor upload
   * @param {string} descriptor
   * @param {string} [serverLongName] - Long name for specific server to use
   * @param {TorController~postHiddenServiceDescriptorCallback} callback
   * @see https://gitweb.torproject.org/torspec.git/tree/rend-spec.txt#n193
   */
  postHiddenServiceDescriptor(descriptor, serverLongName, callback) {
    /* istanbul ignore if */
    if (typeof serverLongName === 'function') {
      callback = serverLongName;
      serverLongName = '';
    }

    this._send(commands.HSPOST(descriptor, serverLongName), callback);
  }
  /**
   * @callback TorController~postHiddenServiceDescriptorCallback
   * @param {object|null} error
   */

  /**
   * Get information from Tor not stored in configuration
   * @param {string} keyword - Keyword for info to fetch
   * @param {TorController~getInfoCallback} callback
   * @see https://gitweb.torproject.org/torspec.git/tree/control-spec.txt#n500
   */
  getInfo(keyword, callback) {
    this._send(commands.GETINFO(keyword), callback);
  }
  /**
   * @callback TorController~getInfoCallback
   * @param {object|null} error
   * @param {string} result
   */

  /**
   * Instructs Tor to send asynchronous events for the given types - these
   * events will be emitted from the controller. Calling this method resets
   * previously set event listeners
   * @param {string[]} events - List of event types to listen for
   * @param {TorController~addEventListenersCallback} callback
   * @see https://gitweb.torproject.org/torspec.git/tree/control-spec.txt#n1708
   */
  addEventListeners(events, callback) {
    this._send(commands.SETEVENTS(events), callback);
  }
  /**
   * @callback TorController~addEventListenersCallback
   * @param {object|null} error
   */

  /**
   * Instructs Tor to stop listening for events
   * @param {TorController~removeEventListenersCallback} callback
   */
  removeEventListeners(callback) {
    this._send(commands.SETEVENTS([]), callback);
  }
  /**
   * @callback TorController~removeEventListenersCallback
   * @param {object|null} error
   */

}

module.exports = TorController;
