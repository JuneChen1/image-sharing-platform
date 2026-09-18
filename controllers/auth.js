const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  isValidString,
  isValidEmail,
  isValidPassword
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');
const { sendResetPasswordEmail } = require('../utils/mailer');

function getResetPasswordSecret() {
  return (
    process.env.RESET_PASSWORD_SECRET ||
    crypto
      .createHash('sha256')
      .update(`${process.env.JWT_SECRET}:reset-password`)
      .digest('hex')
  );
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (
      !isValidString(name) ||
      !isValidEmail(email) ||
      !isValidPassword(password)
    )
      return next(appError(400, '欄位未填寫正確'));

    const userRepo = dataSource.getRepository('Users');
    const existing = await userRepo.findOneBy({
      email: email.trim().toLowerCase()
    });
    if (existing) return next(appError(409, 'Email 已被使用'));

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'USER'
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isValidString(password))
      return next(appError(400, '欄位未填寫正確'));

    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({
      email: email.trim().toLowerCase()
    });
    if (!user) return next(appError(400, '使用者不存在或密碼輸入錯誤'));

    const isMach = await bcrypt.compare(password, user.password);
    if (!isMach) return next(appError(400, '使用者不存在或密碼輸入錯誤'));

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_DAY }
    );

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          name: user.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '登出成功'
  });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!isValidEmail(email)) return next(appError(400, '欄位未填寫正確'));
  try {
    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({
      email: email.trim().toLowerCase()
    });

    if (user) {
      const resetToken = jwt.sign(
        { id: user.id, purpose: 'reset-password' },
        getResetPasswordSecret(),
        { expiresIn: process.env.RESET_PASSWORD_EXPIRES || '15m' }
      );
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

      try {
        await sendResetPasswordEmail(user.email, resetUrl);
      } catch (mailError) {
        console.error('寄送重設密碼信件失敗：', mailError);
      }
    }

    res.status(200).json({
      status: 'success',
      message: '若此 Email 已註冊，重設密碼信件已發送至您的信箱，請前往收信。'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token, new_password, confirm_password } = req.body;
  if (
    !isValidString(token) ||
    !isValidPassword(new_password) ||
    !isValidPassword(confirm_password)
  )
    return next(appError(400, '欄位未填寫正確'));

  if (new_password !== confirm_password)
    return next(appError(400, '兩次輸入的新密碼不一致'));

  let decoded;
  try {
    decoded = jwt.verify(token, getResetPasswordSecret());
  } catch (error) {
    return next(appError(400, '重設連結無效或已過期'));
  }

  try {
    if (decoded.purpose !== 'reset-password')
      return next(appError(400, '重設連結無效或已過期'));

    const userRepo = dataSource.getRepository('Users');
    const user = await userRepo.findOneBy({ id: decoded.id });
    if (!user) return next(appError(400, '重設連結無效或已過期'));

    const updatedAtSeconds = Math.floor(
      new Date(user.updated_at).getTime() / 1000
    );
    if (decoded.iat <= updatedAtSeconds)
      return next(appError(400, '重設連結無效或已過期'));

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await userRepo.save({ ...user, password: hashedPassword });

    res.status(200).json({
      status: 'success',
      message: '密碼重設成功，請重新登入'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
};
