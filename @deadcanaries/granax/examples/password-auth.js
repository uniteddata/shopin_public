/**
 * Demonstrates how to authenticate with the control port with the
 * HashedControlPassword option in your torrc
 * @example
 */

'use strict';

// By default, the TorController will automatically authenticate with the
// control port via SAFECOOKIE is supported, else COOKIE.
//
// If you would prefer to authenticate with a password (set in your torrc),
// you may instruct granax to not automatically authenticate.
const { TorController } = require('..');
const { connect } = require('net');
const tor = new TorController(connect(9051), { authOnConnect: false });

// At this point, we have an open socket to the control port, but we are not
// authenticated. This means any command sent will fail and cause the socket
// to be terminated. You'll first need to authenticate with your password.
//
// Note that you will not receive the "ready" event, as that is a function
// of the automatic authentication. You can know when the controller is ready
// simply by supplying a callback to the authenticate method.
//
// Password authentication also requires the password be wrapped in double
// quotes!
tor.authenticate('"mysupersecretpassword"', function(err) {
  if (err) {
    console.error(err);
  } else {
    console.info('authenticated with password!');
  }
});

// Note that this password must be defined in the HashedControlPassword field
// in your torrc. To get the value needed for that field for a given password:
//
//   $ tor --hash-password "mysupersecretpassword"
