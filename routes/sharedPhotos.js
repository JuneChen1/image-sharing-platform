const express = require('express');
const sharedPhotosController = require('../controllers/sharedPhotos');
const limiter = require('../middlewares/limiter');
const router = express.Router();

router.post('/', limiter, sharedPhotosController.shareImageWithUrl);
router.delete('/:sharedId', sharedPhotosController.cancelSharedPhoto);
router.get('/', sharedPhotosController.getSharedImages);

module.exports = router;
