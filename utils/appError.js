const errors = require('../config/errors');

// 用法：appError('EMAIL_TAKEN')
// 需要覆寫時：appError('UNSPLASH_API_ERROR', { status: 404 })
function appError(errorCode, overrides = {}) {
  const defaults = errors[errorCode];
  if (!defaults) throw new Error(`未定義的錯誤碼：${errorCode}`);

  const error = new Error(overrides.message ?? defaults.message);
  error.statusCode = overrides.status ?? defaults.status;
  error.errorCode = errorCode;
  error.isOperational = true;
  return error;
}

module.exports = appError;
