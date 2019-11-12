/**
 * Demonstrates how to find the SOCKS5 port from the tor controller
 * @example
 */

'use strict';

const granax = require('..');
const tor = granax();

tor.on('ready', function() {
  tor.getInfo('net/listeners/socks', (err, result) => {
    let port = parseInt(result.split('"').join('').split(':')[1]);
    console.log(`TorSocks listening on ${port}!`);
  });
});

tor.on('error', function(err) {
  console.error(err);
});
