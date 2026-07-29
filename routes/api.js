const express = require('express');
const { rateLimit } = require('express-rate-limit');
const {
  getUnsplashImageId,
  verifyUnsplashImageId,
  fetchUnsplashPhoto
} = require('../utils/apiUtils');
const { unsplashBaseUrl, headers } = require('../config/constants');
const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { status: 'error', message: '請求過於頻繁，請稍後再試' }
});

// get information of one image
router.get('/v1/photos/:unsplashId', limiter, async (req, res, next) => {
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
});

router.get('/v1/photos', limiter, async (req, res, next) => {
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
});

router.post('/v1/shared-photos', limiter, async (req, res, next) => {
  const { url } = req.body;
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

    console.log(result.data);
    // 後續再寫入資料庫
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
