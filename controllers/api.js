const {
  fetchUnsplashPhoto,
  fetchImagesWithKeyword
} = require('../utils/unsplashApiUtils');
const {
  verifyUnsplashImageId,
  isPositiveInteger,
  isValidString
} = require('../utils/validUtils');
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
      let errorMessage;

      if (result.status === 403) {
        errorMessage = '圖片服務目前較忙碌，請稍後再試';
      } else {
        errorMessage = 'Unsplash API error';
      }
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(status, errorMessage));
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
    const result = await fetchImagesWithKeyword(page, q);

    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      let errorMessage;

      if (result.status === 403) {
        errorMessage = '圖片服務目前較忙碌，請稍後再試';
      } else {
        errorMessage = 'Unsplash API error';
      }
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(status, errorMessage));
    }

    res.status(200).json({ status: 'success', data: result.data });
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
