const isAuth = require('./isAuth');

function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();

  // isAuth 驗證失敗會呼叫 next(error)，這裡刻意吞掉錯誤、當訪客繼續
  isAuth(req, res, () => next());
}

module.exports = optionalAuth;
