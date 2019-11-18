/**
 * Demonstrates how to authenticate with the control port with no defined
 * authentication strategy
 * @example
 */

'use strict';

// By default, the TorController will automatically authenticate with the
// control port via SAFECOOKIE is supported, else COOKIE.
//
// If you haven't enabled an authentication method, you can simple authenticate
// without supplying any credentials
const { connect } = require('net');
const { TorController } = require('..');
const tor = new TorController(connect(9051), { authOnConnect: false });

// At this point, we have an open socket to the control port, but we are not
// authenticated. This means any command sent will fail and cause the socket
// to be terminated. You'll first need to authenticate with your password.
//
// Note that you will not receive the "ready" event, as that is a function
// of the automatic authentication. You can know when the controller is ready
// simply by supplying a callback to the authenticate method.
tor.authenticate('', function(err) {
  if (err) {
    console.error(err);
  } else {
    console.info('authenticated!');
  }
});
