const errors = require('../config/errors');

// 錯誤回應的 JSON 格式：{ status, code, message }
function errorBody(errorCode, status = 'error') {
  return { status, code: errorCode, message: errors[errorCode].message };
}

module.exports = errorBody;
