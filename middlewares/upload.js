const multer = require('multer');
const appError = require('../utils/appError');
const { uploadMaxBytes, uploadMaxFields } = require('../config/constants');

// 檔案放記憶體（不落地到暫存檔）：上限 5 MB，之後由 sharp 處理，再交給 utils/storage 存。
// 只收欄位名稱叫 image 的一個檔案；文字欄位的長度另外限制（fieldSize），備註與連結不會超過這個
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadMaxBytes,
    files: 1,
    fields: uploadMaxFields,
    fieldSize: 10 * 1024
  }
}).single('image');

// multer 丟的是 MulterError（不是 appError），不轉換的話 app.js 的錯誤處理會當成 500
function uploadImage(req, res, next) {
  upload(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return next(appError('FILE_TOO_LARGE'));
      // 多送檔案、欄位名稱不對、欄位太多或太長
      return next(appError('INVALID_FIELDS'));
    }

    // 表單格式本身壞掉（busboy 丟的一般 Error）是請求的問題，不是伺服器的問題
    if (/^(Multipart|Unexpected end of form)/.test(error.message)) {
      return next(appError('INVALID_FIELDS'));
    }

    next(error);
  });
}

module.exports = uploadImage;
