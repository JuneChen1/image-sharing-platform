const express = require('express');
const apiController = require('../controllers/api');
const { shareLimiter } = require('../middlewares/limiter');
const router = express.Router();

router.get('/photos/:unsplashId', shareLimiter, apiController.getOneImageInfo);
router.get('/photos', shareLimiter, apiController.getImagesWithKeyword);

router.get('/categories', apiController.getCategories);

module.exports = router;
