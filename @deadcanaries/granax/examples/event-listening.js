/**
 * Demonstrates how to listen for events from the tor controller
 * @example
 */

'use strict';

const granax = require('..');
const tor = granax();

tor.on('ready', function() {
  console.log('Listening for SIGNAL and ADDRMAP events...');
  console.log('Sending DEBUG signal...');
  console.log('Browse in Tor browswer to see ADDRMAP events!')
  tor.addEventListeners(['SIGNAL', 'ADDRMAP'], () => tor.enableDebug());
});

tor.on('SIGNAL', function(data) {
  console.log('Got SIGNAL event:', data);
});

tor.on('ADDRMAP', function(data) {
  console.log('Got ADDRMAP event:', data);
});

tor.on('error', function(err) {
  console.error(err);
});
