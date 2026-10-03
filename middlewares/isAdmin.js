const isAuth = require('./isAuth');
const appError = require('../utils/appError');

function isAdmin(req, res, next) {
  isAuth(req, res, (err) => {
    if (err) return next(err);

    if (req.user.role !== 'ADMIN') {
      return next(appError('FORBIDDEN'));
    }

    next();
  });
}

module.exports = isAdmin;
