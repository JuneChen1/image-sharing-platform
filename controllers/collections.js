const {
  isSafeText,
  isValidString,
  isValidUUID
} = require('../utils/validUtils');
const { collectionNameMaxLength } = require('../config/constants');
const appError = require('../utils/appError');
const { attachCategories } = require('../utils/sharedPhotosUtils');
const { dataSource } = require('../db/data-source');

const collectionsController = {
  async getCollections(req, res, next) {
    const { photoId } = req.query;
    if (photoId !== undefined && !isValidUUID(photoId)) {
      return next(appError('INVALID_PHOTO_ID'));
    }

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const collections = await collectionsRepo.find({
        where: { user: { id: req.user.id } }
      });

      const favoritesRepo = dataSource.getRepository('Favorites');
      const data = await Promise.all(
        collections.map(async (collection) => {
          const [[latestFavorite], photoCount] =
            await favoritesRepo.findAndCount({
              where: { collections: { id: collection.id } },
              relations: { sharedPhotos: true },
              order: { created_at: 'DESC' },
              take: 1
            });

          let hasPhoto;
          if (photoId) {
            const count = await favoritesRepo.count({
              where: {
                collections: { id: collection.id },
                sharedPhotos: { id: photoId }
              }
            });
            hasPhoto = count > 0;
          }

          return {
            ...collection,
            photoCount,
            previewImageUrl: latestFavorite
              ? latestFavorite.sharedPhotos.image_url
              : null,
            ...(photoId !== undefined ? { hasPhoto } : {})
          };
        })
      );

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },
  async addCollection(req, res, next) {
    const { name } = req.body;
    if (isValidString(name) && name.trim().length > collectionNameMaxLength)
      return next(appError('NAME_TOO_LONG'));
    if (!isSafeText(name, collectionNameMaxLength))
      return next(appError('INVALID_NAME'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');

      const collectCount = await collectionsRepo.count({
        where: { user: { id: req.user.id } }
      });
      if (collectCount >= 10) return next(appError('COLLECTION_LIMIT_REACHED'));

      const existing = await collectionsRepo.findOneBy({
        name: name.trim(),
        user: { id: req.user.id }
      });
      if (existing) return next(appError('COLLECTION_NAME_TAKEN'));

      const data = await collectionsRepo.save({
        name: name.trim(),
        user: { id: req.user.id }
      });

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      if (error.code === '23505')
        return next(appError('COLLECTION_NAME_TAKEN'));

      next(error);
    }
  },
  async updateCollection(req, res, next) {
    const { collectionId } = req.params;
    if (!isValidUUID(collectionId))
      return next(appError('INVALID_COLLECTION_ID'));
    const { name } = req.body;
    if (isValidString(name) && name.trim().length > collectionNameMaxLength)
      return next(appError('NAME_TOO_LONG'));
    if (!isSafeText(name, collectionNameMaxLength))
      return next(appError('INVALID_NAME'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const findCollection = await collectionsRepo.findOneBy({
        id: collectionId,
        user: { id: req.user.id }
      });

      if (!findCollection) return next(appError('NOT_FOUND'));
      if (findCollection.name === name.trim())
        return res
          .status(200)
          .json({ status: 'success', data: findCollection });

      const existing = await collectionsRepo.findOneBy({
        name: name.trim(),
        user: { id: req.user.id }
      });
      if (existing) return next(appError('COLLECTION_NAME_TAKEN'));

      const data = await collectionsRepo.save({
        ...findCollection,
        name: name.trim()
      });

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      if (error.code === '23505')
        return next(appError('COLLECTION_NAME_TAKEN'));

      next(error);
    }
  },
  async deleteCollection(req, res, next) {
    const { collectionId } = req.params;
    if (!isValidUUID(collectionId))
      return next(appError('INVALID_COLLECTION_ID'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const data = await collectionsRepo.findOneBy({
        id: collectionId,
        user: { id: req.user.id }
      });

      if (!data) return next(appError('NOT_FOUND'));

      await collectionsRepo.delete(collectionId);

      res.status(200).json({
        status: 'success',
        message: '刪除成功'
      });
    } catch (error) {
      next(error);
    }
  },
  async addToCollection(req, res, next) {
    const { collectionId } = req.params;
    const { photoId } = req.body;
    if (!isValidUUID(collectionId))
      return next(appError('INVALID_COLLECTION_ID'));
    if (!isValidUUID(photoId)) return next(appError('INVALID_PHOTO_ID'));

    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const collection = await collectionsRepo.findOneBy({
        id: collectionId,
        user: { id: req.user.id }
      });

      if (!collection) return next(appError('NOT_FOUND'));

      const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
      const photo = await sharePhotosRepo.findOneBy({
        id: photoId
      });

      if (!photo) return next(appError('NOT_FOUND'));

      const favoritesRepo = dataSource.getRepository('Favorites');
      const data = await favoritesRepo
        .save({
          user: { id: req.user.id },
          collections: { id: collectionId },
          sharedPhotos: { id: photoId }
        })
        .catch((err) => {
          if (err.code === '23505') {
            throw appError('ALREADY_IN_COLLECTION');
          }
          throw err;
        });

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },
  async getPhotosInCollection(req, res, next) {
    const { collectionId } = req.params;
    if (!isValidUUID(collectionId))
      return next(appError('INVALID_COLLECTION_ID'));
    try {
      const collectionsRepo = dataSource.getRepository('Collections');
      const collection = await collectionsRepo.findOneBy({
        id: collectionId,
        user: { id: req.user.id }
      });

      if (!collection) return next(appError('NOT_FOUND'));

      const favoritesRepo = dataSource.getRepository('Favorites');
      const photos = await favoritesRepo.find({
        where: {
          user: { id: req.user.id },
          collections: { id: collectionId }
        },
        relations: { sharedPhotos: true }
      });

      const rawData = photos.map((item) => item.sharedPhotos);
      const data = await attachCategories(rawData);

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  },
  async deletePhotoInCollection(req, res, next) {
    const { collectionId, photoId } = req.params;
    if (!isValidUUID(collectionId))
      return next(appError('INVALID_COLLECTION_ID'));
    if (!isValidUUID(photoId)) return next(appError('INVALID_PHOTO_ID'));
    try {
      const favoritesRepo = dataSource.getRepository('Favorites');
      const result = await favoritesRepo.delete({
        collections: { id: collectionId },
        sharedPhotos: { id: photoId },
        user: { id: req.user.id }
      });

      if (result.affected === 0) return next(appError('NOT_FOUND'));

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
