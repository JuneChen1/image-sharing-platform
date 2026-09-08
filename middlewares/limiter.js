const { rateLimit } = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { status: 'error', message: '請求過於頻繁，請稍後再試' }
});

const shareLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { status: 'error', message: '請求過於頻繁，請稍後再試' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { status: 'error', message: '嘗試次數過多，請稍後再試' }
});

module.exports = { globalLimiter, shareLimiter, authLimiter };
