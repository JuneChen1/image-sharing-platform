const { isValidString, isValidUUID } = require('../utils/validUtils');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

const collectionsController = {
  async addCollection(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name) || name.length > 100)
      return next(appError(400, '名稱格式錯誤'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const data = await collectionsRepo.save({
        name: name.trim(),
        user: { id: req.user.id }
      });

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },
  async deleteCollection(req, res, next) {
    const { collectionId } = req.params;
    if (!isValidUUID(collectionId))
      return next(appError(400, 'collection id 格式錯誤'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const data = await collectionsRepo.findOneBy({
        id: collectionId,
        user: { id: req.user.id }
      });

      if (!data) return next(appError(404, '查無此資料'));

      await collectionsRepo.delete(collectionId);

      res.status(200).json({
        status: 'success',
        message: '刪除成功'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = collectionsController;
