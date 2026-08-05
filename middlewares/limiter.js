const { rateLimit } = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { status: 'error', message: '請求過於頻繁，請稍後再試' }
});

module.exports = limiter;
