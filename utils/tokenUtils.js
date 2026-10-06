const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 密碼指紋（password version）：用 JWT_SECRET 對目前的密碼雜湊做 HMAC，取前 16 碼。
// 改密碼或重設密碼後雜湊會變，指紋跟著變，所以舊的登入 token 會全部失效；
function getPasswordVersion(passwordHash) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(passwordHash)
    .digest('hex')
    .slice(0, 16);
}

function signAuthToken({ id, role, password }) {
  return jwt.sign(
    { id, role, pv: getPasswordVersion(password) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_DAY }
  );
}

module.exports = { getPasswordVersion, signAuthToken };
