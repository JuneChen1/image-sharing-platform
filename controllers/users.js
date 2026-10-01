const bcrypt = require('bcrypt');
const { In } = require('typeorm');
const {
  isSafeText,
  isValidPassword,
  isValidUUID,
  isPositiveInteger
} = require('../utils/validUtils');
const { nameMaxLength } = require('../config/constants');
const appError = require('../utils/appError');
const {
  attachCategories,
  attachFavoritesCount
} = require('../utils/sharedPhotosUtils');
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

      if (email !== undefined)
        return next(appError(400, 'Email 不可修改', 'EMAIL_IMMUTABLE'));

      if (name === undefined)
        return next(appError(400, '沒有可更新的欄位', 'NOTHING_TO_UPDATE'));

      if (!isSafeText(name, nameMaxLength))
        return next(appError(400, '欄位未填寫正確', 'INVALID_FIELDS'));

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
        return next(appError(400, '欄位未填寫正確', 'INVALID_FIELDS'));

      if (new_password !== confirm_password)
        return next(
          appError(400, '兩次輸入的新密碼不一致', 'PASSWORD_MISMATCH')
        );

      const isMatch = await bcrypt.compare(old_password, req.user.password);
      if (!isMatch)
        return next(appError(400, '舊密碼錯誤', 'OLD_PASSWORD_WRONG'));

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
  async deleteMe(req, res, next) {
    try {
      if (req.user.role === 'ADMIN')
        return next(appError(403, '不可刪除管理者帳號', 'CANNOT_DELETE_ADMIN'));

      const { password } = req.body;

      if (!isValidPassword(password))
        return next(appError(400, '欄位未填寫正確', 'INVALID_FIELDS'));

      const isMatch = await bcrypt.compare(password, req.user.password);
      if (!isMatch) return next(appError(400, '密碼錯誤', 'PASSWORD_WRONG'));

      const userId = req.user.id;

      await dataSource.transaction(async (manager) => {
        const ownPhotos = await manager.getRepository('SharedPhotos').find({
          where: { user: { id: userId } },
          select: { id: true }
        });

        if (ownPhotos.length > 0) {
          const ownPhotoIds = ownPhotos.map((photo) => photo.id);
          await manager
            .getRepository('SharedPhotoCategories')
            .delete({ sharedPhotos: { id: In(ownPhotoIds) } });

          // 刪除"其他使用者"收藏此作者分享的照片的紀錄
          await manager
            .getRepository('Favorites')
            .delete({ sharedPhotos: { id: In(ownPhotoIds) } });
        }

        await manager
          .getRepository('Favorites')
          .delete({ user: { id: userId } });
        await manager
          .getRepository('Collections')
          .delete({ user: { id: userId } });
        await manager
          .getRepository('SharedPhotos')
          .delete({ user: { id: userId } });
        await manager.getRepository('Users').delete({ id: userId });
      });

      res.status(200).json({
        status: 'success',
        message: '帳號已刪除'
      });
    } catch (error) {
      next(error);
    }
  },

  async getPhotos(req, res, next) {
    try {
      const { userId } = req.params;
      if (!isValidUUID(userId))
        return next(appError(400, '欄位未填寫正確', 'INVALID_FIELDS'));

      const usersRepo = dataSource.getRepository('Users');
      const user = await usersRepo.findOneBy({ id: userId });
      if (!user) return next(appError(404, '查無此使用者', 'USER_NOT_FOUND'));

      const pageNumber =
        req.query.page === undefined ? 1 : Number(req.query.page);
      const limitNumber =
        req.query.limit === undefined ? 20 : Number(req.query.limit);

      if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
        return next(
          appError(
            400,
            '頁數(page)和每頁筆數(limit)只能是正整數',
            'INVALID_PAGINATION'
          )
        );
      }

      if (limitNumber > 100) {
        return next(
          appError(400, '每頁筆數(limit)不能大於100', 'LIMIT_TOO_LARGE')
        );
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

      const dataWithCategories = await attachCategories(rawData);
      const data = await attachFavoritesCount(dataWithCategories);

      res.status(200).json({
        status: 'success',
        data,
        pagination: { page: pageNumber, limit: limitNumber, total },
        user: { id: user.id, name: user.name }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
