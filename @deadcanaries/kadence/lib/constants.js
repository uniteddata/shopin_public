/**
 * @module kadence/constants
 */

'use strict';

/**
 * @constant {number} ALPHA - Degree of parallelism
 */
exports.ALPHA = 3;

/**
 * @constant {number} B - Number of bits for nodeID creation
 */
exports.B = 160;

/**
 * @constant {number} K - Number of contacts held in a bucket
 */
exports.K = 20;

/**
 * @constant {number} T_REFRESH - Interval for performing router refresh
 */
exports.T_REFRESH = 3600000;

/**
 * @constant {number} T_REPLICATE - Interval for replicating local data
 */
exports.T_REPLICATE = 3600000;

/**
 * @constant {number} T_REPUBLISH - Interval for republishing data
 */
exports.T_REPUBLISH = 86400000;

/**
 * @constant {number} T_EXPIRE - Interval for expiring local data entries
 */
exports.T_EXPIRE = 86405000;

/**
 * @constant {number} T_RESPONSETIMEOUT - Time to wait for RPC response
 */
exports.T_RESPONSETIMEOUT = 10000;

/**
 * @constant {number} MAX_UNIMPROVED_REFRESHES - Quit refreshing no improvement
 */
exports.MAX_UNIMPROVED_REFRESHES = 3;

/**
 * @constant {number} IDENTITY_DIFFICULTY - Equihash params for identity proofs
 */
exports.IDENTITY_DIFFICULTY = { n: 126, k: 5 };

/**
 * @constant {number} TESTNET_DIFFICULTY - Testnet difficulty override
 */
exports.TESTNET_DIFFICULTY = { n: 90, k: 5 };

/**
 * @constant {number} LRU_CACHE_SIZE - Number of used hashcash stamps to track
 */
exports.LRU_CACHE_SIZE = 50;

/**
 * @constant {number} FILTER_DEPTH - Number of neighborhood hops to track
 * subsrciptions for
 */
exports.FILTER_DEPTH = 3;

/**
 * @constant {number} MAX_RELAY_HOPS - Maximum times a message instance will be
 * relayed when published
 */
exports.MAX_RELAY_HOPS = 6;

/**
 * @constant {number} SOFT_STATE_TIMEOUT - Time to wait before busting the
 * subscription cache
 */
exports.SOFT_STATE_TIMEOUT = 3600000;
