module.exports = {
  nameMaxLength: 50,
  emailMaxLength: 100,
  collectionNameMaxLength: 100,
  collectionMaxCount: 10,
  categoryMaxCount: 10,
  // 上傳圖片
  noteMaxLength: 500,
  originUrlMaxLength: 2048,
  uploadMaxBytes: 5 * 1024 * 1024, // 單檔上限
  uploadMaxPixels: 40 * 1000 * 1000, // 單張像素上限，防「檔案小、解開超大」的像素炸彈
  uploadMaxEdge: 4096, // 長邊最多幾像素，超過會縮小（不會放大小圖）
  uploadMaxFields: 30, // 表單文字欄位數量上限，擋一次送上百個欄位的濫用
  uploadRequestsPerHourDefault: 30, // 每人每小時最多幾次上傳請求（含失敗的）
  uploadDailyLimitDefault: 10, // 每人 24 小時內最多上傳幾張，可用 UPLOAD_DAILY_LIMIT 覆寫
  uploadTotalLimitDefault: 100, // 每人最多保留幾張上傳的照片，可用 UPLOAD_TOTAL_LIMIT 覆寫
  unsplashBaseUrl: 'https://api.unsplash.com',
  unsplashTimeoutMs: 10000, // 對 Unsplash 的請求最多等幾毫秒，超過就當成失敗
  headers: {
    Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
  }
};
