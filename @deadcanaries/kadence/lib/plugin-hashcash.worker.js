'use strict';

const [,, sender, target, method, bits] = process.argv;
const { HashCashPlugin: hc } = require('./plugin-hashcash');

function _err(msg) {
  process.send({ error: msg });
  process.exit(1);
}

try {
  hc._worker(sender, target, method, parseInt(bits), function(err, result) {
    if (err) {
      return _err(err.message);
    }

    process.send(result);
    process.exit(0);
  });
} catch (err) {
  _err(err.message);
}
