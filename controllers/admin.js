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

      const reason = isValidString(req.body.reason)
        ? req.body.reason.trim()
        : null;

      let deleted = false;
      await dataSource.transaction(async (manager) => {
        const photo = await manager.getRepository('SharedPhotos').findOne({
          where: { id },
          relations: { user: true }
        });

        if (!photo) return;

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

        if (deleted) {
          await manager.getRepository('DeletedSharedPhotos').save({
            unsplash_id: photo.unsplash_id,
            unsplash_page_url: photo.unsplash_page_url,
            photographer_name: photo.photographer_name,
            original_sharer_id: photo.user.id,
            original_sharer_name: photo.user.name,
            deleted_by_admin_id: req.user.id,
            deleted_by_admin_name: req.user.name,
            reason
          });
        }
      });

      if (!deleted) return next(appError(404, '查無資料'));

      res.status(200).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  },

  async exportDeletedSharedPhotos(req, res, next) {
    try {
      const rows = await dataSource
        .getRepository('DeletedSharedPhotos')
        .find({ order: { deleted_at: 'DESC' } });

      const columns = [
        'unsplash_id',
        'unsplash_page_url',
        'photographer_name',
        'original_sharer_id',
        'original_sharer_name',
        'deleted_by_admin_id',
        'deleted_by_admin_name',
        'reason',
        'deleted_at'
      ];

      const csvEscape = (value) => {
        const raw = value instanceof Date ? value.toISOString() : value;
        const str = raw === null || raw === undefined ? '' : String(raw);
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const lines = [columns.join(',')];
      rows.forEach((row) => {
        lines.push(columns.map((key) => csvEscape(row[key])).join(','));
      });

      const csv = '﻿' + lines.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="deleted-shared-photos.csv"'
      );
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
