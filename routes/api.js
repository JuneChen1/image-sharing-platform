const express = require('express');
const apiController = require('../controllers/api');
const limiter = require('../middlewares/limiter');
const router = express.Router();

router.get('/v1/photos/:unsplashId', limiter, apiController.getOneImageInfo);
router.get('/v1/photos', limiter, apiController.getImagesWithKeyword);
router.post('/v1/shared-photos', limiter, apiController.shareImageWithUrl);

module.exports = router;
