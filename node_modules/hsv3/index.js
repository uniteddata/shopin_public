/**
 * @module hsv3
 */

'use strict';

/**
 * Starts a Tor process with the given v3 hidden services configured
 * @param {array} services
 * @param {object} services[].dataDirectory - Data directory for hidden service
 * @param {number} services[].virtualPort - Hidden service virtual port
 * @param {string} services[].localMapping - Local service to map
 * @param {object} torrc - Additional torrc entries
 */
module.exports = function(services, torrc = {}) {
  return require('granax')({ authOnConnect: true }, services.map(block => {
    return {
      HiddenServiceDir: block.dataDirectory,
      HiddenServiceVersion: 3,
      HiddenServicePort: `${block.virtualPort} ${block.localMapping}`
    };
  }).concat([torrc]));
};
