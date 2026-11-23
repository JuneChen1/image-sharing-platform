const express = require('express');
const apiController = require('../controllers/api');
const { shareLimiter } = require('../middlewares/limiter');
const optionalAuth = require('../middlewares/optionalAuth');
const router = express.Router();

router.get('/photos/:unsplashId', shareLimiter, apiController.getOneImageInfo);
// 搜尋對訪客公開；登入時多回傳 already_shared，所以掛 optionalAuth
router.get(
  '/photos',
  optionalAuth,
  shareLimiter,
  apiController.getImagesWithKeyword
);

router.get('/categories', apiController.getCategories);

module.exports = router;
