const { ILike } = require('typeorm');
const {
  isValidString,
  isPositiveInteger,
  isValidUUID
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

const adminController = {
  async getUsers(req, res, next) {
    try {
      const { keyword, banned, page, limit } = req.query;

      if (keyword !== undefined && typeof keyword !== 'string')
        return next(appError(400, '欄位未填寫正確'));

      if (banned !== undefined && banned !== 'true' && banned !== 'false')
        return next(appError(400, '欄位未填寫正確'));

      const pageNum = page !== undefined ? Number(page) : 1;
      const limitNum = limit !== undefined ? Number(limit) : 20;
      if (
        !isPositiveInteger(pageNum) ||
        !isPositiveInteger(limitNum) ||
        limitNum > 100
      )
        return next(appError(400, '欄位未填寫正確'));

      const userRepo = dataSource.getRepository('Users');
      const where = {};
      if (keyword !== undefined && isValidString(keyword))
        where.name = ILike(`%${keyword.trim()}%`);
      if (banned !== undefined) where.is_banned = banned === 'true';

      const [users, total] = await userRepo.findAndCount({
        where,
        order: { name: 'ASC' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      });

      res.status(200).json({
        status: 'success',
        data: {
          users: users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            is_banned: user.is_banned
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async banUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) return next(appError(400, '欄位未填寫正確'));

      if (id === req.user.id) return next(appError(403, '無法停權自己的帳號'));

      const userRepo = dataSource.getRepository('Users');
      const user = await userRepo.findOneBy({ id });

      if (!user) return next(appError(404, '找不到使用者'));
      if (user.role === 'ADMIN')
        return next(appError(403, '無法停權管理者帳號'));

      await userRepo.update(id, { is_banned: true });

      res.status(200).json({
        status: 'success',
        data: {
          user: { id: user.id, name: user.name, is_banned: true }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async unbanUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) return next(appError(400, '欄位未填寫正確'));

      const userRepo = dataSource.getRepository('Users');
      const user = await userRepo.findOneBy({ id });
      if (!user) return next(appError(404, '找不到使用者'));

      await userRepo.update(id, { is_banned: false });

      res.status(200).json({
        status: 'success',
        data: {
          user: { id: user.id, name: user.name, is_banned: false }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async forceDeleteSharedPhoto(req, res, next) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) return next(appError(400, '欄位未填寫正確'));

      let deleted = false;
      await dataSource.transaction(async (manager) => {
        await manager
          .getRepository('SharedPhotoCategories')
          .delete({ sharedPhotos: { id } });
        await manager
          .getRepository('Favorites')
          .delete({ sharedPhotos: { id } });
        const result = await manager
          .getRepository('SharedPhotos')
          .delete({ id });
        deleted = result.affected > 0;
      });

      if (!deleted) return next(appError(404, '查無資料'));

      res.status(200).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
