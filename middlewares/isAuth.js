const jwt = require('jsonwebtoken');
const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');

async function isAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(appError(401, '請先登入'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({ id: decoded.id });
    if (!user) return next(appError(401, '無效的 token'));

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return next(appError(401, 'Token 已過期'));

    next(appError(401, '無效的 token'));
  }
}

module.exports = isAuth;
