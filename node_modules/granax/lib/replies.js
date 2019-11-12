/**
 * @module granax/replies
 */

'use strict';

/**
 * @param {string[]} output
 * @returns {AuthChallengeResult}
 */
exports.AUTHCHALLENGE = function(output) {
  let result = output[0].split(' ');
  let [, hash, nonce] = result;
  return {
    hash: hash.split('=').pop(),
    nonce: nonce ? nonce.split('=').pop() : null
  };
};
/**
 * @typedef {object} AuthChallengeResult
 * @property {string} hash - The server hash
 * @property {string} nonce - The server nonce
 */

/**
 * @param {string[]} output
 * @returns {ProtocolInfoResult}
 */
exports.PROTOCOLINFO = function(output) {
  let [proto, auth, version] = output;
  proto = proto.split(' ');
  auth = auth.split(' ');
  version = version.split(' ');
  return {
    protocol: proto[1],
    auth: {
      methods: auth[1].split('=')[1].split(','),
      cookieFile: auth[2]
        ? auth[2].split('=')[1].split('"').join('')
        : null
    },
    version: {
      tor: version[1].split('=')[1].split('"').join('')
    }
  };
};
/**
 * @typedef {object} ProtocolInfoResult
 * @property {string} protocol
 * @property {object} auth
 * @property {string[]} auth.methods
 * @property {string} auth.cookieFile
 * @property {object} version
 * @property {string} version.tor
 */

/**
 * @param {string[]} output
 * @returns {AddOnionResult}
 */
exports.ADD_ONION = function(output) {
  return {
    serviceId: output[0].split('=')[1],
    privateKey: (output[1] && output[1].includes('PrivateKey'))
      ? output[1].split('=')[1]
      : null
  };
};
/**
 * @typedef {object} AddOnionResult
 * @property {string} serviceId - The hidden service url without .onion
 * @property {string} [privateKey] - The generated private key
 */

/**
 * @param {string[]} output
 * @returns {GetConfigResult}
 */
exports.GETCONF = function(output) {
  return output.map((line) => line.split('=')[1]);
};
/**
 * @typedef {string[]} GetConfigResult
 */

/**
 * @param {string[]} output
 * @returns {string}
 */
exports.GETINFO = function(output) {
  if (output.length > 1) {
    return output.map((line) => line.split('=')[1]).join('\n');
  }

  return output[0].split('=')[1];
};
