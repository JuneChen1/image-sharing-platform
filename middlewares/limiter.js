const { rateLimit } = require('express-rate-limit');
const errors = require('../config/errors');
const errorBody = require('../utils/errorBody');
const { uploadRequestsPerHourDefault } = require('../config/constants');
const { getPositiveIntEnv } = require('../utils/env');

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

// 上傳圖片：每個使用者每小時的請求次數（含失敗的），保護伺服器的 CPU 與記憶體（sharp 處理圖片很吃資源）。
// 和「每天最多幾張」是兩回事：那個在控制器裡查資料庫。放在 isAuth 之後，所以用使用者 id 計數
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: getPositiveIntEnv(
    'UPLOAD_REQUESTS_PER_HOUR',
    uploadRequestsPerHourDefault
  ),
  keyGenerator: (req) => req.user.id,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
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
  uploadLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  accountLimiter
};
