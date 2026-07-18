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

router.use(limiter);

// get information of one image
router.get('/v1/photos/:unsplashId', async (req, res, next) => {
  const { unsplashId } = req.params;
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
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
