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
const { attachCategories } = require('../utils/sharedPhotosUtils');
const { dataSource } = require('../db/data-source');
const { In } = require('typeorm');

const shareImageWithUrl = async (req, res, next) => {
  const { url, customCategories } = req.body;
  if (!isValidString(url)) {
    next(appError(400, '網址為必填'));
    return;
  }
  if (!verifyCustomCategories(customCategories)) {
    next(appError(400, '分類格式錯誤'));
    return;
  }

  const { success, imageId } = getUnsplashImageId(url);
  if (!success || !verifyUnsplashImageId(imageId)) {
    next(appError(400, '網址錯誤'));
    return;
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const existing = await sharePhotosRepo.findOneBy({
      unsplash_id: imageId,
      user: { id: user.id }
    });

    if (existing) return next(appError(409, '你已經分享過這張照片了'));

    const result = await fetchUnsplashPhoto(imageId);

    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(status, 'Unsplash API error'));
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
            throw appError(409, '你已經分享過這張照片了');
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

  if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
    return next(appError(400, '頁數(page)和每頁筆數(limit)只能是正整數'));
  }

  if (limitNumber > 100) {
    return next(appError(400, '每頁筆數(limit)不能大於100'));
  }

  const skip = (pageNumber - 1) * limitNumber;
  const take = limitNumber;

  try {
    let data, total;
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
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
    } else {
      const params = [];
      const conditions = [];
      if (category) {
        params.push(category);
        conditions.push('AND c.name = $1');
      }
      if (q) {
        params.push(q);
        conditions.push(`
          AND (c.name ILIKE '%' || $${params.length} || '%' OR sp.photographer_name ILIKE '%' || $${params.length} || '%')
        `);
      }

      const sqlQuery = `
        SELECT sp.*, u.name AS user_name FROM shared_photos sp
        JOIN shared_photo_categories AS spc
          ON spc.shared_photo_id = sp.id
        JOIN categories AS c
          ON spc.category_id = c.id
        JOIN users AS u
          ON u.id = sp.user_id
        WHERE TRUE
          ${conditions.join(' ')}
        ORDER BY sp.created_at DESC
        `;

      const result = await dataSource.query(sqlQuery, params);

      total = result.length;
      data = result.slice(skip, skip + take);
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
    return next(appError(400, 'ID格式錯誤'));
  }
  const user = req.user;

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const data = await sharePhotosRepo.findOneBy({
      id: sharedId,
      user: { id: user.id }
    });

    if (!data) {
      return next(appError(404, '查無此資料'));
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
