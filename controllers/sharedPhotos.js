const {
  getUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo
} = require('../utils/unsplashApiUtils');
const {
  verifyUnsplashImageId,
  verifyCustomCategories,
  isPositiveInteger,
  isValidString,
  isValidUUID
} = require('../utils/validUtils');
const appError = require('../utils/appError');
const {
  attachCategories,
  attachFavoritesCount,
  buildPhotoFilter
} = require('../utils/sharedPhotosUtils');
const { dataSource } = require('../db/data-source');
const { In } = require('typeorm');

const shareImageWithUrl = async (req, res, next) => {
  const { url, customCategories } = req.body;
  if (!isValidString(url)) {
    next(appError('URL_REQUIRED'));
    return;
  }
  if (!verifyCustomCategories(customCategories)) {
    next(appError('INVALID_CATEGORIES'));
    return;
  }

  const { success, imageId } = getUnsplashImageId(url);
  if (!success || !verifyUnsplashImageId(imageId)) {
    next(appError('INVALID_URL'));
    return;
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const existing = await sharePhotosRepo.findOneBy({
      unsplash_id: imageId,
      user: { id: user.id }
    });

    if (existing) return next(appError('ALREADY_SHARED'));

    const result = await fetchUnsplashPhoto(imageId);

    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError('UNSPLASH_API_ERROR', { status }));
    }

    const uniqueNames = [
      ...new Map(
        customCategories.map((name) => [name.trim().toLowerCase(), name.trim()])
      ).values()
    ];
    const shareInfo = getUnsplashImageInfo(result);

    // save to the database
    await dataSource.transaction(async (manager) => {
      const sharePhotosRepo = manager.getRepository('SharedPhotos');
      const categoriesRepo = manager.getRepository('Categories');
      const joinRepo = manager.getRepository('SharedPhotoCategories');

      const foundCategories = await categoriesRepo.find({
        where: { name: In(uniqueNames) }
      });
      const exist = foundCategories.map((c) => c.name.toLowerCase());

      const notExist = uniqueNames
        .filter((c) => !exist.includes(c.toLowerCase()))
        .map((n) => ({
          name: n
        }));

      let createdCategories = [];
      if (notExist.length > 0) {
        createdCategories = await categoriesRepo.save(notExist).catch((err) => {
          // 避免使用者連點兩次分享按鈕產生的 race condition
          if (err.code === '23505') {
            return categoriesRepo.find({
              where: { name: In(notExist.map((n) => n.name)) }
            });
          }
          throw err;
        });
      }

      const savedPhoto = await sharePhotosRepo
        .save({
          ...shareInfo,
          user: { id: user.id }
        })
        .catch((err) => {
          // 避免使用者連點兩次分享按鈕產生的 race condition
          if (err.code === '23505') {
            throw appError('ALREADY_SHARED');
          }
          throw err;
        });

      const links = [...foundCategories, ...createdCategories].map((category) =>
        joinRepo.create({ sharedPhotos: savedPhoto, categories: category })
      );
      await joinRepo.save(links);
    });

    res.status(200).json({ status: 'success', data: shareInfo });
  } catch (error) {
    next(error);
  }
};

const getSharedImages = async (req, res, next) => {
  const pageNumber = req.query.page === undefined ? 1 : Number(req.query.page);
  const limitNumber =
    req.query.limit === undefined ? 20 : Number(req.query.limit);
  const category = req.query.category;
  const q = req.query.q;
  const sort = req.query.sort === undefined ? 'latest' : req.query.sort;

  const ALLOWED_SORTS = ['latest', 'popular'];

  if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
    return next(appError('INVALID_PAGINATION'));
  }

  if (limitNumber > 100) {
    return next(appError('LIMIT_TOO_LARGE'));
  }

  if (!ALLOWED_SORTS.includes(sort)) {
    return next(appError('INVALID_SORT'));
  }

  const skip = (pageNumber - 1) * limitNumber;
  const take = limitNumber;

  let data, total;
  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    if (sort === 'latest') {
      // 創建時間排序
      if (!category && !q) {
        let rawData;
        [rawData, total] = await sharePhotosRepo.findAndCount({
          relations: { user: true },
          skip,
          take,
          order: { created_at: 'DESC' }
        });
        data = rawData.map(({ user, ...photo }) => ({
          ...photo,
          user_id: user.id,
          user_name: user.name
        }));

        data = await attachFavoritesCount(data);
      } else {
        // 有帶 category 或 q 參數
        const { params, whereClause } = buildPhotoFilter(category, q);
        const countResult = await dataSource.query(
          `SELECT COUNT(*) FROM shared_photos sp ${whereClause}`,
          params
        );
        total = Number(countResult[0].count);

        const result = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          ${whereClause}
          ORDER BY sp.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
          `,
          [...params, take, skip]
        );

        data = await attachFavoritesCount(result);
      }
    } else if (sort === 'popular') {
      // 收藏數排序
      if (!category && !q) {
        const countResult = await sharePhotosRepo.count();
        total = countResult;

        data = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name, COUNT(f.id)::int AS favorites_count
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          LEFT JOIN favorites AS f ON f.shared_photo_id = sp.id
          GROUP BY sp.id, u.name
          ORDER BY favorites_count DESC, sp.created_at DESC
          LIMIT $1 OFFSET $2
          `,
          [take, skip]
        );
      } else {
        // 有帶 category 或 q 參數
        const { params, whereClause } = buildPhotoFilter(category, q);
        const countResult = await dataSource.query(
          `SELECT COUNT(*) FROM shared_photos sp ${whereClause}`,
          params
        );
        total = Number(countResult[0].count);

        data = await dataSource.query(
          `
          SELECT sp.*, u.name AS user_name, COUNT(f.id)::int AS favorites_count
          FROM shared_photos sp
          JOIN users AS u ON u.id = sp.user_id
          LEFT JOIN favorites AS f ON f.shared_photo_id = sp.id
          ${whereClause}
          GROUP BY sp.id, u.name
          ORDER BY favorites_count DESC, sp.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
          `,
          [...params, take, skip]
        );
      }
    }

    data = await attachCategories(data);

    res.status(200).json({
      status: 'success',
      data,
      pagination: { page: pageNumber, limit: limitNumber, total }
    });
  } catch (error) {
    next(error);
  }
};

const cancelSharedPhoto = async (req, res, next) => {
  const { sharedId } = req.params;
  if (!isValidUUID(sharedId)) {
    return next(appError('INVALID_ID'));
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const data = await sharePhotosRepo.findOneBy({
      id: sharedId,
      user: { id: user.id }
    });

    if (!data) {
      return next(appError('NOT_FOUND'));
    }

    await dataSource.transaction(async (manager) => {
      await manager
        .getRepository('SharedPhotoCategories')
        .delete({ sharedPhotos: { id: data.id } });

      await manager
        .getRepository('Favorites')
        .delete({ sharedPhotos: { id: data.id } });

      await manager.getRepository('SharedPhotos').delete({ id: data.id });
    });

    res.status(200).json({
      status: 'success',
      message: '刪除成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareImageWithUrl,
  getSharedImages,
  cancelSharedPhoto
};
