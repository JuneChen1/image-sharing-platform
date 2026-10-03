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
    next(appError('INVALID_UNSPLASH_ID'));
    return;
  }

  try {
    const result = await fetchUnsplashPhoto(unsplashId);
    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      const errorCode =
        result.status === 403 ? 'UNSPLASH_BUSY' : 'UNSPLASH_API_ERROR';
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(errorCode, { status }));
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    next(error);
  }
};

const getImagesWithKeyword = async (req, res, next) => {
  const { q, page = 1 } = req.query;
  if (!isValidString(q)) {
    next(appError('SEARCH_KEYWORD_REQUIRED'));
    return;
  }

  const pageNumber = Number(page);
  if (!isPositiveInteger(pageNumber)) {
    next(appError('INVALID_PAGE'));
    return;
  }

  try {
    const result = await fetchImagesWithKeyword(page, q);

    if (!result.success) {
      const status = result.status === 404 ? 404 : 502;
      const errorCode =
        result.status === 403 ? 'UNSPLASH_BUSY' : 'UNSPLASH_API_ERROR';
      console.error(
        'Unsplash API error:',
        result.status,
        result.unsplashMessage
      );

      return next(appError(errorCode, { status }));
    }

    res.status(200).json({ status: 'success', data: result.data });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const data = await dataSource.query(`
      SELECT DISTINCT c.* 
      FROM categories c
      INNER JOIN shared_photo_categories spc ON spc.category_id = c.id
      ORDER BY c.name ASC
    `);

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
