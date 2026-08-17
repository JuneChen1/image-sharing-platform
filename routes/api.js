const express = require('express');
const apiController = require('../controllers/api');
const limiter = require('../middlewares/limiter');
const router = express.Router();

router.get('/photos/:unsplashId', limiter, apiController.getOneImageInfo);
router.get('/photos', limiter, apiController.getImagesWithKeyword);

router.post('/shared-photos', limiter, apiController.shareImageWithUrl);
router.delete('/shared-photos/:sharedId', apiController.cancelSharedPhoto);
router.get('/shared-photos', apiController.getSharedImages);

router.get('/categories', apiController.getCategories);

module.exports = router;
