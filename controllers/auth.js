const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  isValidString,
  isValidEmail,
  isValidPassword
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

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

module.exports = {
  register,
  login,
  logout
};
