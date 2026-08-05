const {
  getUnsplashImageId,
  verifyUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo,
  verifyCustomCategories
} = require('../utils/apiUtils');
const { unsplashBaseUrl, headers } = require('../config/constants');
const { dataSource } = require('../db/data-source');
const { In } = require('typeorm');

const getOneImageInfo = async (req, res, next) => {
  const { unsplashId } = req.params;

  if (!verifyUnsplashImageId(unsplashId)) {
    return res
      .status(400)
      .json({ status: 'error', message: '無效的 unsplashId 格式' });
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

      return res
        .status(status)
        .json({ status: 'error', message: 'Unsplash API error' });
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    next(error);
  }
};

const getImagesWithKeyword = async (req, res, next) => {
  const { q, page = 1 } = req.query;
  if (!q) {
    return res
      .status(400)
      .json({ status: 'error', message: '搜尋關鍵字(q)為必填' });
  }

  const pageNumber = Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return res
      .status(400)
      .json({ status: 'error', message: '頁數(page)只能是正整數' });
  }

  try {
    const response = await fetch(
      `${unsplashBaseUrl}/search/photos?page=${page}&query=${encodeURIComponent(q)}`,
      {
        headers
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ status: 'error', message: 'Unsplash API error' });
    }

    const data = await response.json();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const shareImageWithUrl = async (req, res, next) => {
  const { url, customCategories } = req.body;
  if (typeof url !== 'string' || !url.trim()) {
    return res
      .status(400)
      .json({ status: 'error', message: '網址(url)為必填' });
  }
  if (!verifyCustomCategories(customCategories)) {
    return res.status(400).json({
      status: 'error',
      message: 'customCategories 需為陣列，且至少包含一個分類，分類皆須為字串'
    });
  }

  const { success, imageId } = getUnsplashImageId(url);
  if (!success || !verifyUnsplashImageId(imageId)) {
    return res.status(400).json({
      status: 'error',
      message: '網址錯誤，或無效的 unsplashId 格式'
    });
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

      return res
        .status(status)
        .json({ status: 'error', message: 'Unsplash API error' });
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

module.exports = { getOneImageInfo, getImagesWithKeyword, shareImageWithUrl };
