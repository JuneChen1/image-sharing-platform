const express = require('express');
const sharedPhotosController = require('../controllers/sharedPhotos');
const { shareLimiter, uploadLimiter } = require('../middlewares/limiter');
const isAuth = require('../middlewares/isAuth');
const optionalAuth = require('../middlewares/optionalAuth');
const uploadImage = require('../middlewares/upload');
const rejectNullBytes = require('../middlewares/rejectNullBytes');
const router = express.Router();

router.post(
  '/',
  isAuth,
  shareLimiter,
  sharedPhotosController.shareImageWithUrl
);
// 上傳圖片：multipart 的文字欄位要等 multer 解析完才進得了 req.body，
// 全域的 rejectNullBytes 跑在 multer 之前看不到它們，所以這裡再擋一次
router.post(
  '/upload',
  isAuth,
  uploadLimiter,
  uploadImage,
  rejectNullBytes,
  sharedPhotosController.uploadSharedPhoto
);
router.delete('/:sharedId', isAuth, sharedPhotosController.cancelSharedPhoto);
router.get('/', optionalAuth, sharedPhotosController.getSharedImages);
router.get(
  '/:sharedId',
  optionalAuth,
  sharedPhotosController.getSharedImageById
);

module.exports = router;
