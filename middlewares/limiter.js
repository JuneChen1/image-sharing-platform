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

// 帳號相關的限流依用途拆開，避免登入、註冊、改密碼共用同一個計數器
function createAuthLimiter({
  windowMs,
  limit,
  skipSuccessfulRequests = false
}) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    statusCode: errors.TOO_MANY_ATTEMPTS.status,
    message: errorBody('TOO_MANY_ATTEMPTS')
  });
}

const loginLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true
});

const registerLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10
});

const passwordResetLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5
});

const accountLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true
});

module.exports = {
  globalLimiter,
  shareLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  accountLimiter
};
