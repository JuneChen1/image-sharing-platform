const { rateLimit } = require('express-rate-limit');
const errors = require('../config/errors');
const errorBody = require('../utils/errorBody');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  statusCode: errors.TOO_MANY_REQUESTS.status,
  message: errorBody('TOO_MANY_REQUESTS')
});

const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  statusCode: errors.TOO_MANY_REQUESTS.status,
  message: errorBody('TOO_MANY_REQUESTS')
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  statusCode: errors.TOO_MANY_ATTEMPTS.status,
  message: errorBody('TOO_MANY_ATTEMPTS')
});

module.exports = { globalLimiter, shareLimiter, authLimiter };
