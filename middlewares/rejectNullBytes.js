const appError = require('../utils/appError');

// Postgres 的文字欄位不能存 NUL（\0）：含 NUL 的字串一進查詢或寫入就會丟 22001／22021，變成 500
// 在請求一進來（body 解析之後、路由之前）統一擋掉，回 400。
// 用迭代而不是遞迴走訪，避免很深的巢狀 JSON 把呼叫堆疊撐爆
function hasNullByte(root) {
  const stack = [root];
  while (stack.length > 0) {
    const value = stack.pop();

    if (typeof value === 'string') {
      if (value.includes('\0')) return true;
    } else if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (key.includes('\0')) return true;
        stack.push(value[key]);
      }
    }
  }
  return false;
}

function rejectNullBytes(req, res, next) {
  if (hasNullByte(req.query) || hasNullByte(req.body)) {
    return next(appError('INVALID_FIELDS'));
  }
  next();
}

module.exports = rejectNullBytes;
