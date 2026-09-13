const bcrypt = require('bcrypt');
const {
  isValidString,
  isValidPassword,
  isValidUUID,
  isPositiveInteger
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const { attachCategories } = require('../utils/sharedPhotosUtils');
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
  },
  async getPhotos(req, res, next) {
    try {
      const { userId } = req.params;
      if (!isValidUUID(userId)) return next(appError(400, '欄位未填寫正確'));

      const pageNumber =
        req.query.page === undefined ? 1 : Number(req.query.page);
      const limitNumber =
        req.query.limit === undefined ? 20 : Number(req.query.limit);

      if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
        return next(appError(400, '頁數(page)和每頁筆數(limit)只能是正整數'));
      }

      if (limitNumber > 100) {
        return next(appError(400, '每頁筆數(limit)不能大於100'));
      }

      const skip = (pageNumber - 1) * limitNumber;
      const take = limitNumber;

      const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
      const [rawData, total] = await sharePhotosRepo.findAndCount({
        where: { user: { id: userId } },
        skip,
        take,
        order: { created_at: 'DESC' }
      });

      const data = await attachCategories(rawData);

      res.status(200).json({
        status: 'success',
        data,
        pagination: { page: pageNumber, limit: limitNumber, total }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
