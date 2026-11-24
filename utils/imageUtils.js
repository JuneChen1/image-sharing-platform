const sharp = require('sharp');
const appError = require('./appError');
const { uploadMaxPixels, uploadMaxEdge } = require('../config/constants');

// 只收這三種。判斷依據是 sharp 讀到的實際格式，不信副檔名與 Content-Type；
// svg（可夾 script）、gif、tiff、heif 等一律拒絕
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

const isPixelLimitError = (error) => /pixel limit/i.test(error.message);

// 驗證並處理使用者上傳的圖片，回傳處理後的 WebP buffer：
// 1. 確認真的是圖片、格式在白名單內、像素不超過上限（先看檔頭，不用整張解開）
// 2. 依 EXIF 方向轉正（要在清除 EXIF 之前）
// 3. 長邊縮到最多 uploadMaxEdge（不放大小圖）
// 4. 輸出 WebP。sharp 預設輸出不帶 EXIF／metadata，所以 GPS 位置等資訊會被清掉（不要呼叫 withMetadata）
async function processUploadedImage(buffer) {
  let metadata;
  try {
    metadata = await sharp(buffer, { limitInputPixels: false }).metadata();
  } catch {
    throw appError('INVALID_FILE_TYPE');
  }

  if (!ALLOWED_FORMATS.includes(metadata.format)) {
    throw appError('INVALID_FILE_TYPE');
  }

  if (!metadata.width || !metadata.height) {
    throw appError('INVALID_FILE_TYPE');
  }

  if (metadata.width * metadata.height > uploadMaxPixels) {
    throw appError('IMAGE_DIMENSIONS_TOO_LARGE');
  }

  try {
    return await sharp(buffer, { limitInputPixels: uploadMaxPixels })
      .rotate()
      .resize({
        width: uploadMaxEdge,
        height: uploadMaxEdge,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    if (isPixelLimitError(error)) throw appError('IMAGE_DIMENSIONS_TOO_LARGE');
    // 檔頭正常但內容損毀，解碼時失敗
    throw appError('INVALID_FILE_TYPE');
  }
}

module.exports = { processUploadedImage };
