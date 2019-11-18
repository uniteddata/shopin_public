/**
* @module kadence/utils
*/

'use strict';

const secp256k1 = require('secp256k1');
const url = require('url');
const constants = require('./constants');
const semver = require('semver');
const ip = require('ip');
const crypto = require('crypto');
const assert = require('assert');
const { randomBytes, createHash } = crypto;
const ms = require('ms');
const equihash = require('equihash/lib/khovratovich');


/**
 * Tests if a string is valid hex
 * @param {string} str
 * @returns {boolean}
 */
module.exports.isHexaString = function(str) {
  return Buffer.from(str, 'hex').length === str.length / 2;
};

/**
 * Returns a random valid key/identity as a string
 * @returns {string}
 */
exports.getRandomKeyString = function() {
  return exports.getRandomKeyBuffer().toString('hex');
};

/**
 * Returns a random valid key/identity as a buffer
 * @returns {buffer}
 */
exports.getRandomKeyBuffer = function() {
  return crypto.randomBytes(constants.B / 8);
};

/**
 * Determines if the given string key is valid
 * @param {string} key - Node ID or item key
 * @returns {boolean}
 */
exports.keyStringIsValid = function(key) {
  let buf;

  try {
    buf = Buffer.from(key, 'hex');
  } catch (err) {
    return false;
  }

  return exports.keyBufferIsValid(buf);
};

/**
 * Determines if the given buffer key is valid
 * @param {buffer} key - Node ID or item key
 * @returns {boolean}
 */
exports.keyBufferIsValid = function(key) {
  return Buffer.isBuffer(key) && key.length === constants.B / 8;
};

/**
 * Calculate the distance between two keys
 * @param {string} key1 - Identity key to compare
 * @param {string} key2 - Identity key to compare
 * @returns {buffer}
 */
exports.getDistance = function(id1, id2) {
  id1 = !Buffer.isBuffer(id1)
    ? Buffer.from(id1, 'hex')
    : id1;
  id2 = !Buffer.isBuffer(id2)
    ? Buffer.from(id2, 'hex')
    : id2;

  assert(exports.keyBufferIsValid(id1), 'Invalid key supplied');
  assert(exports.keyBufferIsValid(id2), 'Invalid key supplied');

  return Buffer.alloc(constants.B / 8)
    .map((b, index) => id1[index] ^ id2[index]);
};

/**
 * Compare two buffers for sorting
 * @param {buffer} b1 - Buffer to compare
 * @param {buffer} b2 - Buffer to compare
 * @returns {number}
 */
exports.compareKeyBuffers = function(b1, b2) {
  assert(exports.keyBufferIsValid(b1), 'Invalid key supplied');
  assert(exports.keyBufferIsValid(b2), 'Invalid key supplied');

  for (let index = 0; index < b1.length; index++) {
    let bits = b1[index];

    if (bits !== b2[index]) {
      return bits < b2[index] ? -1 : 1;
    }
  }

  return 0;
};

/**
 * Calculate the index of the bucket that key would belong to
 * @param {string} referenceKey - Key to compare
 * @param {string} foreignKey - Key to compare
 * @returns {number}
 */
exports.getBucketIndex = function(referenceKey, foreignKey) {
  let distance = exports.getDistance(referenceKey, foreignKey);
  let bucketIndex = constants.B;

  for (let byteValue of distance) {
    if (byteValue === 0) {
      bucketIndex -= 8;
      continue;
    }

    for (let i = 0; i < 8; i++) {
      if (byteValue & (0x80 >> i)) {
        return --bucketIndex;
      } else {
        bucketIndex--;
      }
    }
  }

  return bucketIndex;
};

/**
 * Returns a buffer with a power-of-two value given a bucket index
 * @param {string|buffer} referenceKey - Key to find next power of two
 * @param {number} bucketIndex - Bucket index for key
 * @returns {buffer}
 */
exports.getPowerOfTwoBufferForIndex = function(referenceKey, exp) {
  assert(exp >= 0 && exp < constants.B, 'Index out of range');

  const buffer = Buffer.isBuffer(referenceKey)
    ? Buffer.from(referenceKey)
    : Buffer.from(referenceKey, 'hex');
  const byteValue = parseInt(exp / 8);

  // NB: We set the byte containing the bit to the right left shifted amount
  buffer[constants.K - byteValue - 1] = 1 << (exp % 8);

  return buffer;
};

/**
 * Generate a random number within the bucket's range
 * @param {buffer} referenceKey - Key for bucket distance reference
 * @param {number} index - Bucket index for random buffer selection
 */
exports.getRandomBufferInBucketRange = function(referenceKey, index) {
  let base = exports.getPowerOfTwoBufferForIndex(referenceKey, index);
  let byte = parseInt(index / 8); // NB: Randomize bytes below the power of two

  for (let i = constants.K - 1; i > (constants.K - byte - 1); i--) {
    base[i] = parseInt(Math.random() * 256);
  }

  // NB: Also randomize the bits below the number in that byte and remember
  // NB: arrays are off by 1
  for (let j = index - 1; j >= byte * 8; j--) {
    let one = Math.random() >= 0.5;
    let shiftAmount = j - byte * 8;

    base[constants.K - byte - 1] |= one ? (1 << shiftAmount) : 0;
  }

  return base;
};

/**
 * Validates the given object is a storage adapter
 * @param {AbstractNode~storage} storageAdapter
 */
exports.validateStorageAdapter = function(storage) {
  assert(typeof storage === 'object',
    'No storage adapter supplied');
  assert(typeof storage.get === 'function',
    'Store has no get method');
  assert(typeof storage.put === 'function',
    'Store has no put method');
  assert(typeof storage.del === 'function',
    'Store has no del method');
  assert(typeof storage.createReadStream === 'function',
    'Store has no createReadStream method');
};

/**
 * Validates the given object is a logger
 * @param {AbstractNode~logger} logger
 */
exports.validateLogger = function(logger) {
  assert(typeof logger === 'object',
    'No logger object supplied');
  assert(typeof logger.debug === 'function',
    'Logger has no debug method');
  assert(typeof logger.info === 'function',
    'Logger has no info method');
  assert(typeof logger.warn === 'function',
    'Logger has no warn method');
  assert(typeof logger.error === 'function',
    'Logger has no error method');
};

/**
 * Validates the given object is a transport
 * @param {AbstractNode~transport} transport
 */
exports.validateTransport = function(transport) {
  assert(typeof transport === 'object',
    'No transport adapter supplied');
  assert(typeof transport.read === 'function',
    'Transport has no read method');
  assert(typeof transport.write === 'function',
    'Transport has no write method');
};

/**
 * Returns the SHA-256 hash of the input
 * @param {buffer} input - Data to hash
 */
module.exports.hash256 = function(input) {
  return crypto.createHash('sha256').update(input).digest();
};

/**
 * @typedef EquihashProof
 * @type {object}
 * @property {number} n
 * @property {number} k
 * @property {number} nonce
 * @property {buffer} value
 */

/**
 * Performs an equihash solution using defaults
 * @param {buffer} input - Input hash to solve
 * @returns {Promise<EquihashProof>}
 */
module.exports.eqsolve = function(input, opts = constants.IDENTITY_DIFFICULTY) {
  assert(Buffer.isBuffer(input), 'Input must be a buffer');
  assert(input.length === 32, 'Input must be 256 bits');

  return new Promise(function(resolve, reject) {
    equihash.solve(input, opts, function(err, proof) {
      if (err) {
        return reject(err);
      }

      resolve(proof);
    });
  });
};

/**
 * Perform an equihash proof verification
 * @param {buffer} input - Input hash for proof
 * @param {buffer} proof - Equihash proof to verify
 * @returns {boolean}
 */
module.exports.eqverify = function(input, proof) {
  return equihash.verify(input, proof);
};

/**
 * Returns the RMD-160 hash of the input
 * @param {buffer} input - Data to hash
 */
module.exports.hash160 = function(input) {
  return crypto.createHash('ripemd160').update(input).digest();
};

/**
 * Returns a stringified URL from the supplied contact object
 * @param {Bucket~contact} contact
 * @returns {string}
 */
module.exports.getContactURL = function(contact) {
  const [id, info] = contact;

  return `${info.protocol}//${info.hostname}:${info.port}/#${id}`;
};

/**
 * Returns a parsed contact object from a URL
 * @returns {object}
 */
module.exports.parseContactURL = function(addr) {
  const { protocol, hostname, port, hash } = url.parse(addr);
  const contact = [
    (hash ? hash.substr(1) : null) ||
      Buffer.alloc(constants.B / 8).fill(0).toString('hex'),
    {
      protocol,
      hostname,
      port
    }
  ];

  return contact;
};

/**
 * Returns whether or not the supplied semver tag is compatible
 * @param {string} version - The semver tag from the contact
 * @returns {boolean}
 */
module.exports.isCompatibleVersion = function(version) {
  const local = require('./version').protocol;
  const remote = version;
  const sameMajor = semver.major(local) === semver.major(remote);
  const diffs = ['prerelease', 'prepatch', 'preminor', 'premajor'];

  if (diffs.indexOf(semver.diff(remote, local)) !== -1) {
    return false;
  } else {
    return sameMajor;
  }
};

/**
 * Determines if the supplied contact is valid
 * @param {Bucket~contact} contact - The contact information for a given peer
 * @param {boolean} loopback - Allows contacts that are localhost
 * @returns {boolean}
 */
module.exports.isValidContact = function(contact, loopback) {
  const [, info] = contact;
  const isValidAddr = ip.isV4Format(info.hostname) ||
                      ip.isV6Format(info.hostname) ||
                      ip.isPublic(info.hostname);
  const isValidPort = info.port > 0;
  const isAllowedAddr = ip.isLoopback(info.hostname) ? !!loopback : true;

  return isValidPort && isValidAddr && isAllowedAddr;
};

/**
 * Converts a buffer to a string representation of binary
 * @param {buffer} buffer - Byte array to convert to binary string
 * @returns {string}
 */
module.exports.toBinaryStringFromBuffer = function(buffer) {
  const mapping = {
    '0': '0000',
    '1': '0001',
    '2': '0010',
    '3': '0011',
    '4': '0100',
    '5': '0101',
    '6': '0110',
    '7': '0111',
    '8': '1000',
    '9': '1001',
    'a': '1010',
    'b': '1011',
    'c': '1100',
    'd': '1101',
    'e': '1110',
    'f': '1111'
  };
  const hexaString = buffer.toString('hex').toLowerCase();
  const bitmaps = [];

  for (let i = 0; i < hexaString.length; i++) {
    bitmaps.push(mapping[hexaString[i]]);
  }

  return bitmaps.join('');
};

/**
 * Returns a boolean indicating if the supplied buffer meets the given
 * difficulty requirement
 * @param {buffer} buffer - Buffer to check difficulty
 * @param {number} difficulty - Number of leading zeroes
 * @returns {boolean}
 */
module.exports.satisfiesDifficulty = function(buffer, difficulty) {
  const binString = module.exports.toBinaryStringFromBuffer(buffer);
  const prefix = Array(difficulty).fill('0').join('');

  return binString.substr(0, difficulty) === prefix;
};

/**
 * @private
 */
module.exports._sha256 = function(input) {
  return createHash('sha256').update(input).digest();
};

/**
 * @private
 */
module.exports._rmd160 = function(input) {
  return createHash('ripemd160').update(input).digest();
};

/**
 * Generates a private key
 * @returns {buffer}
 */
module.exports.generatePrivateKey = function() {
  let privKey

  do {
    privKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privKey))

  return privKey;
};

/**
 * Takes a public key are returns the identity
 * @param {buffer} publicKey - Raw public key bytes
 * @returns {buffer}
 */
module.exports.toPublicKeyHash = function(publicKey) {
  return exports._rmd160(exports._sha256(publicKey));
};

/**
 * Wraps the supplied function in a pseudo-random length timeout to help
 * prevent convoy effects. These occur when a number of processes need to use
 * a resource in turn. There is a tendency for such bursts of activity to
 * drift towards synchronization, which can be disasterous. In Kademlia all
 * nodes are requird to republish their contents every hour (T_REPLICATE). A
 * convoy effect might lead to this being synchronized across the network,
 * which would appear to users as the network dying every hour. The default
 * timeout will be between 0 and 30 minutes unless specified.
 * @param {function} func - Function to wrap to execution later
 * @param {number} [maxtime] - Maximum timeout
 * @returns {function}
 */
module.exports.preventConvoy = function(func, timeout) {
  return function() {
    let t = Math.ceil(
      Math.random() * (typeof timeout !== 'number' ? ms('30m') : timeout)
    );
    return setTimeout(func, t);
  };
};
