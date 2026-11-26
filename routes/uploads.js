const express = require('express');
const uploadsController = require('../controllers/uploads');
const router = express.Router();

// 回傳使用者上傳的圖片。在 app.js 掛在 globalLimiter 之前：一個頁面會同時載入很多張圖，
// 計入限流會讓正常瀏覽很快被擋下；圖片小、有快取標頭，前面還有 Cloudflare
router.get('/:userId/:file', uploadsController.getUploadedImage);

module.exports = router;
