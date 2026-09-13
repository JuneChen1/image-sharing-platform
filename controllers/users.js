const bcrypt = require('bcrypt');
const { isValidString, isValidPassword } = require('../utils/validUtils');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

const userController = {
  getMe(req, res, next) {
    try {
      const { id, name, email, role } = req.user;

      res.status(200).json({
        status: 'success',
        data: {
          user: { id, name, email, role }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req, res, next) {
    try {
      const { name, email } = req.body;

      if (email !== undefined) return next(appError(400, 'Email 不可修改'));

      if (name === undefined) return next(appError(400, '沒有可更新的欄位'));

      if (!isValidString(name)) return next(appError(400, '欄位未填寫正確'));

      const userRepo = dataSource.getRepository('Users');
      const updateUser = await userRepo.save({
        ...req.user,
        name: name.trim()
      });

      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: updateUser.id,
            name: updateUser.name,
            email: updateUser.email
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePassword(req, res, next) {
    try {
      const { old_password, new_password, confirm_password } = req.body;

      if (
        !isValidPassword(old_password) ||
        !isValidPassword(new_password) ||
        !isValidPassword(confirm_password)
      )
        return next(appError(400, '欄位未填寫正確'));

      if (new_password !== confirm_password)
        return next(appError(400, '兩次輸入的新密碼不一致'));

      const isMatch = await bcrypt.compare(old_password, req.user.password);
      if (!isMatch) return next(appError(400, '舊密碼錯誤'));

      const hashedPassword = await bcrypt.hash(new_password, 10);
      const userRepo = dataSource.getRepository('Users');
      await userRepo.save({ ...req.user, password: hashedPassword });

      res.status(200).json({
        status: 'success',
        message: '密碼更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
