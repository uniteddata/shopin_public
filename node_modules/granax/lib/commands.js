/**
 * @module granax/commands
 */

'use strict';

const merge = require('merge');


/**
 * @param {string} [token=""] - The auth token
 * @returns {string}
 */
exports.AUTHENTICATE = function(token = '') {
  return `AUTHENTICATE ${token}`;
};

/**
 * @param {string} [nonce=""] - Client nonce for challenge
 * @param {string} [type="SAFECOOKIE"] - The type of challenge
 * @returns {string}
 */
exports.AUTHCHALLENGE = function(nonce = '', type = 'SAFECOOKIE') {
  return `AUTHCHALLENGE ${type} ${nonce}`;
};

/**
 * @returns {string}
 */
exports.PROTOCOLINFO = function() {
  return 'PROTOCOLINFO';
};

const defaultOnionVirtualPort = 80;
/**
 * @param {array} ports
 * @param {object} options
 * @param {array} command
 */
const _addOnionPortsStringToCommand = function(ports, opts, command) {
  if (opts.virtualPort) {
    command.push(`Port=${opts.virtualPort},${ports}`);
  } else {
    command.push(`Port=${defaultOnionVirtualPort},${ports}`);
  }
}

/**
 * @param {array} ports
 * @param {object} options
 * @param {array} command
 */
const _addOnionPortsToCommand = function(ports, opts, command) {
  if (typeof ports === 'string') {
    _addOnionPortsStringToCommand(ports, opts, command);
    return;
  }
  if (!ports.length) {
    command.push(`Port=${defaultOnionVirtualPort}`);
    return;
  }

  for (let port of ports) {
    let _portsString
    if (port.virtualPort) {
      _portsString = `Port=${port.virtualPort}`;
    } else {
      _portsString = `Port=${defaultOnionVirtualPort}`;
    }
    if (port.target) {
      _portsString += `,${port.target}`;
    }
    command.push(_portsString);
  }
}

/**
 * @param {array} ports - Array containing optional virtualPort (defaults to 80) and target ip:port string
 * @param {object} [options]
 * @param {string} [options.clientName] - Client auth identifier
 * @param {string} [options.clientBlob] - Arbitrary auth data
 * @param {string} [options.keyType="NEW"] - Create a new key or use RSA1024
 * @param {string} [options.keyBlob="BEST"] - Key type to create or serialized
 * @param {boolean} [options.discardPrivateKey=false] - Do not return key
 * @param {boolean} [options.detach=false] - Keep service running after close
 * @param {boolean} [options.basicAuth=false] - Use client name and blob auth
 * @param {boolean} [options.nonAnonymous=false] - Non-anononymous mode
 */
exports.ADD_ONION = function(ports, opts = {}) {
  let options = merge({
    clientName: null,
    clientBlob: null,
    keyType: 'NEW',
    keyBlob: 'BEST',
    discardPrivateKey: false,
    detach: false,
    basicAuth: false,
    nonAnonymous: false
  }, opts);
  let command = ['ADD_ONION', `${options.keyType}:${options.keyBlob}`];
  let flagMap = [
    ['discardPrivateKey', 'DiscardPK'],
    ['detach', 'Detach'],
    ['basicAuth', 'BasicAuth'],
    ['nonAnonymous', 'NonAnonymous']
  ];
  let flags = [];

  for (let flag of flagMap) {
    if (options[flag[0]]) {
      flags.push(flag[1]);
    }
  }

  if (flags.length) {
    command.push('Flags=' + flags.join(','));
  }

  _addOnionPortsToCommand(ports, opts, command);

  if (options.clientName && options.clientBlob) {
    command.push(`ClientAuth=${options.clientName}:${options.clientBlob}`);
  }

  return command.join(' ');
};

/**
 * @param {string} serviceId
 * @returns {string}
 */
exports.DEL_ONION = function(serviceId) {
  return `DEL_ONION ${serviceId}`;
};

/**
 * @param {string} keyword
 * @param {string} value
 * @returns {string}
 */
exports.SETCONF = function(keyword, value) {
  return `SETCONF ${keyword}="${value}"`;
};

/**
 * @param {string} keyword
 * @returns {string}
 */
exports.RESETCONF = function(keyword) {
  return `RESETCONF ${keyword}`;
};

/**
 * @param {string} keyword
 * @returns {string}
 */
exports.GETCONF = function(keyword) {
  return `GETCONF ${keyword}`;
};

/**
 * @returns {string}
 */
exports.SAVECONF = function() {
  return 'SAVECONF';
};

/**
 * @returns {string}
 */
exports.SIGNAL = function(signal) {
  return `SIGNAL ${signal}`;
};

/**
 * @param {string} targetAddr
 * @param {string} replaceAddr
 * @returns {string}
 */
exports.MAPADDRESS = function(targetAddr, replaceAddr) {
  return `MAPADDRESS ${targetAddr}=${replaceAddr}`;
};

/**
 * @param {string} circuitId
 * @returns {string}
 */
exports.EXTENDCIRCUIT = function(circuitId, purpose) {
  return `EXTENDCIRCUIT ${circuitId}` +
    (purpose ? ` purpose="${purpose}"` : '');
};

/**
 * @param {string} circuitId
 * @param {string} purpose
 *
 */
exports.SETCIRCUITPURPOSE = function(circuitId, purpose) {
  return `SETCIRCUITPURPOSE ${circuitId} purpose="${purpose}"`;
};

/**
 * @param {string} streamId
 * @param {object} options
 * @param {string} options.circuitId
 * @param {string|null} options.hopNumber
 * @returns {string}
 */
exports.ATTACHSTREAM = function(streamId, options) {
  return `ATTACHSTREAM ${streamId} ${options.circuitId}` +
    (options.hopNumber ? ` HOP=${options.hopNumber}` : '');
};

/**
 * @param {object} descriptor
 * @param {object} options
 * @param {string} [options.purpose="general"]
 * @param {boolean} [options.cache=true]
 * @returns {string}
 */
exports.POSTDESCRIPTOR = function(descriptor, options) {
  options = merge({
    purpose: 'general',
    cache: true
  }, options);

  let descStrings = [];

  for (let key in descriptor) {
    descStrings.push(`${key}=${descriptor[key]}`);
  }

  return [
    `+POSTDESCRIPTOR purpose=${options.purpose} ` +
      `cache=${options.cache ? 'yes' : 'no'}`,
    descStrings.join('\r\n'),
    '.'
  ].join('\r\n');
};

/**
 * @param {string} streamId
 * @param {string} address
 * @param {number} [port]
 * @returns {string}
 */
exports.REDIRECTSTREAM = function(streamId, address, port = '') {
  return `REDIRECTSTREAM ${streamId} ${address} ${port}`;
};

/**
 * @param {string} streamId
 * @param {number} [reason=1]
 * @returns {string}
 */
exports.CLOSESTREAM = function(streamId, reason = 1) {
  return `CLOSESTREAM ${streamId} ${reason}`;
};

/**
 * @param {string} circuitId
 * @param {object} [options]
 * @param {boolean} [options.ifUnused=false]
 * @returns {string}
 */
exports.CLOSECIRCUIT = function(circuitId, options = { ifUnused: false }) {
  return `CLOSECIRCUIT ${circuitId}` +
    (options.ifUnused ? ' IfUnused' : '');
};

/**
 * @returns {string}
 */
exports.QUIT = function() {
  return 'QUIT';
};

/**
 * @param {string} address
 * @param {boolean} [reverse=false]
 * @returns {string}
 */
exports.RESOLVE = function(address, reverse) {
  return 'RESOLVE ' + (reverse ? 'mode=reverse ' : '') + address;
};

/**
 * @param {string} configText
 * @returns {string}
 */
exports.LOADCONF = function(configText) {
  return `+LOADCONF\r\n${configText}\r\n.`;
};

/**
 * @returns {string}
 */
exports.TAKEOWNERSHIP = function() {
  return 'TAKEOWNERSHIP';
};

/**
 * @returns {string}
 */
exports.DROPGUARDS = function() {
  return 'DROPGUARDS';
};

/**
 * @param {string} serviceId
 * @param {string} [serverLongName]
 * @returns {string}
 */
exports.HSFETCH = function(serviceId, serverLongName) {
  return `HSFETCH ${serviceId}` +
    (serverLongName ? ` SERVER=${serverLongName}` : '');
};

/**
 * @param {string} descriptor
 * @param {string} [serverLongName]
 * @returns {string}
 */
exports.HSPOST = function(descriptor, serverLongName) {
  return '+HSPOST\r\n'+
    (serverLongName ? `SERVER=${serverLongName}\r\n` : '') +
    `${descriptor}\r\n.`;
};

/**
 * @param {string} keyword
 * @returns {string}
 */
exports.GETINFO = function(keyword) {
  return `GETINFO ${keyword}`;
};

/**
 * @param {string[]} events
 * @returns {string}
 */
exports.SETEVENTS = function(events) {
  return `SETEVENTS ${events.join(' ')}`;
};
