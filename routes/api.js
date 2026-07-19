const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();

const baseUrl = 'https://api.unsplash.com';
const headers = {
  Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
};
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
  const unsplashIdPattern = /^[\w-]{5,20}$/;

  if (!unsplashIdPattern.test(unsplashId)) {
    return res
      .status(400)
      .json({ status: 'error', message: '無效的 unsplashId 格式' });
  }

  try {
    const response = await fetch(`${baseUrl}/photos/${unsplashId}`, {
      headers
    });

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
      `${baseUrl}/search/photos?page=${page}&query=${encodeURIComponent(q)}`,
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

module.exports = router;
