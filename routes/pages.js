const express = require('express');
const pagesController = require('../controllers/pages');
const router = express.Router();

// 回傳 HTML 頁面
router.get('/:id', pagesController.getPhotoPage);

module.exports = router;
