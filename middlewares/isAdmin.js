const isAuth = require('./isAuth');
const appError = require('../utils/appError');

function isAdmin(req, res, next) {
  isAuth(req, res, (err) => {
    if (err) return next(err);

    if (req.user.role !== 'ADMIN') {
      return next(appError(403, '您沒有權限執行此操作'));
    }

    next();
  });
}

module.exports = isAdmin;
