const express = require('express');
const sharedPhotosController = require('../controllers/sharedPhotos');
const limiter = require('../middlewares/limiter');
const isAuth = require('../middlewares/isAuth');
const router = express.Router();

router.post('/', isAuth, limiter, sharedPhotosController.shareImageWithUrl);
router.delete('/:sharedId', isAuth, sharedPhotosController.cancelSharedPhoto);
router.get('/', sharedPhotosController.getSharedImages);

module.exports = router;
