const express = require('express');
const sharedPhotosController = require('../controllers/sharedPhotos');
const { shareLimiter } = require('../middlewares/limiter');
const isAuth = require('../middlewares/isAuth');
const optionalAuth = require('../middlewares/optionalAuth');
const router = express.Router();

router.post(
  '/',
  isAuth,
  shareLimiter,
  sharedPhotosController.shareImageWithUrl
);
router.delete('/:sharedId', isAuth, sharedPhotosController.cancelSharedPhoto);
router.get('/', optionalAuth, sharedPhotosController.getSharedImages);

module.exports = router;
