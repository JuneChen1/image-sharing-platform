const {
  getUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo
} = require('../utils/apiUtils');
const {
  verifyUnsplashImageId,
  verifyCustomCategories,
  isPositiveInteger,
  isValidString
} = require('../utils/validUtils');
const { unsplashBaseUrl, headers } = require('../config/constants');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');
const { In, IsNull } = require('typeorm');

const getOneImageInfo = async (req, res, next) => {
  const { unsplashId } = req.params;

  if (!verifyUnsplashImageId(unsplashId)) {
    next(appError(400, '無效的 unsplashId 格式'));
    return;
  }

  try {
    const result = await fetchUnsplashPhoto(unsplashId);
    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      next(appError(status, 'Unsplash API error'));
      return;
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    next(error);
  }
};

const getImagesWithKeyword = async (req, res, next) => {
  const { q, page = 1 } = req.query;
  if (!isValidString(q)) {
    next(appError(400, '搜尋關鍵字(q)為必填'));
    return;
  }

  const pageNumber = Number(page);
  if (!isPositiveInteger(pageNumber)) {
    next(appError(400, '頁數(page)只能是正整數'));
    return;
  }

  try {
    const response = await fetch(
      `${unsplashBaseUrl}/search/photos?page=${page}&query=${encodeURIComponent(q)}`,
      {
        headers
      }
    );

    if (!response.ok) {
      const status = response.status === 404 ? 404 : 502;
      console.error(
        'Unsplash API error:',
        response.status,
        response.unsplashMessage
      );

      next(appError(status, 'Unsplash API error'));
      return;
    }

    const data = await response.json();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const shareImageWithUrl = async (req, res, next) => {
  const { url, customCategories } = req.body;
  if (!isValidString(url)) {
    next(appError(400, '網址(url)為必填'));
    return;
  }
  if (!verifyCustomCategories(customCategories)) {
    next(appError(400, 'customCategories 格式錯誤'));
    return;
  }

  const { success, imageId } = getUnsplashImageId(url);
  if (!success || !verifyUnsplashImageId(imageId)) {
    next(appError(400, '網址錯誤，或無效的 unsplashId 格式'));
    return;
  }

  try {
    const result = await fetchUnsplashPhoto(imageId);
    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      next(appError(status, 'Unsplash API error'));
      return;
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
        createdCategories = await categoriesRepo.save(notExist);
      }

      const savedPhoto = await sharePhotosRepo.save(shareInfo);

      const links = [...foundCategories, ...createdCategories].map((category) =>
        joinRepo.create({ sharePhotos: savedPhoto, categories: category })
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

  if (!isPositiveInteger(pageNumber) || !isPositiveInteger(limitNumber)) {
    return next(appError(400, '頁數(page)和每頁筆數(limit)只能是正整數'));
  }

  if (limitNumber > 100) {
    return next(appError(400, '每頁筆數(limit)不能大於100'));
  }

  try {
    const sharePhotosRepo = dataSource.getRepository('SharedPhotos');
    const [data, total] = await sharePhotosRepo.findAndCount({
      where: { canceled_at: IsNull() },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: { created_at: 'DESC' }
    });

    res.status(200).json({
      status: 'success',
      data,
      pagination: { page: pageNumber, limit: limitNumber, total }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOneImageInfo,
  getImagesWithKeyword,
  shareImageWithUrl,
  getSharedImages
};
