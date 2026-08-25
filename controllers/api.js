const { fetchUnsplashPhoto } = require('../utils/apiUtils');
const {
  verifyUnsplashImageId,
  isPositiveInteger,
  isValidString
} = require('../utils/validUtils');
const { unsplashBaseUrl, headers } = require('../config/constants');
const appError = require('../utils/appError');
const { dataSource } = require('../db/data-source');

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
    next(appError(400, '搜尋關鍵字為必填'));
    return;
  }

  const pageNumber = Number(page);
  if (!isPositiveInteger(pageNumber)) {
    next(appError(400, '頁數只能是正整數'));
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

const getCategories = async (req, res, next) => {
  try {
    const categoriesRepo = dataSource.getRepository('Categories');
    const data = await categoriesRepo.find({
      order: { name: 'ASC' }
    });

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOneImageInfo,
  getImagesWithKeyword,
  getCategories
};
