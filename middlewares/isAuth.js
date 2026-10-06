const jwt = require('jsonwebtoken');
const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');
const { getPasswordVersion } = require('../utils/tokenUtils');

async function isAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(appError('UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({ id: decoded.id });

    if (!user) return next(appError('TOKEN_INVALID'));
    if (user.is_banned) return next(appError('ACCOUNT_BANNED'));

    // 密碼改過（含忘記密碼重設）之後，用舊密碼簽發的 token 一律失效；沒帶 pv 的 token 也視為無效
    if (decoded.pv !== getPasswordVersion(user.password))
      return next(appError('TOKEN_INVALID'));

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return next(appError('TOKEN_EXPIRED'));

    next(appError('TOKEN_INVALID'));
  }
}

module.exports = isAuth;
