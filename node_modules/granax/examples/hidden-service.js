/**
 * Demonstrates how to take an ordinary node http server and expose it to the
 * Tor network as a hidden service!
 * @example
 */

'use strict';

const http = require('http');
const granax = require('..');
const tor = granax();
const server = http.createServer((req, res) => res.end('hello, tor!'));

server.listen(0, '127.0.0.1');

tor.on('ready', function() {
  tor.createHiddenService(`127.0.0.1:${server.address().port}`, (e, data) => {
    if (e) {
      console.error(e);
    } else {
      console.info(
        `service online! navigate to ${data.serviceId}.onion in tor browser!`
      );
    }
  });
});

tor.on('error', function(err) {
  console.error(err);
});
