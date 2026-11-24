const { pipeline } = require('stream');
const storage = require('../utils/storage');
const appError = require('../utils/appError');
const {
  uploadBrowserCacheSeconds,
  uploadEdgeCacheSeconds
} = require('../config/constants');

// 讀取使用者上傳的圖片：網址是 /uploads/<使用者 id>/<uuid>.webp，由 App 從 storage 讀出來再回傳（不論 storage 是磁碟還是 S3，網址都一樣）。
// key 的格式由 storage 嚴格檢查，不合格（包含 ../ 之類的路徑穿越）和找不到一律回 404
const getUploadedImage = async (req, res, next) => {
  const key = `${req.params.userId}/${req.params.file}`;

  try {
    const file = await storage.read(key);
    if (!file) return next(appError('NOT_FOUND'));

    // 檔名是隨機 uuid、內容不會改，所以用檔名當 ETag：瀏覽器帶 If-None-Match 回來時直接回 304，不用再傳檔案。
    // 一定要先確認檔案存在（上面的 read）才回 304，檔案被刪掉之後就不會再回 304
    res.set({
      'Content-Type': storage.CONTENT_TYPE,
      ETag: `"${req.params.file}"`,
      // 瀏覽器快取 1 小時、Cloudflare 邊緣快取 1 天：照片被下架後，舊副本最多一天內消失，不另外做主動清除快取
      'Cache-Control': `public, max-age=${uploadBrowserCacheSeconds}, s-maxage=${uploadEdgeCacheSeconds}`,
      // 不讓瀏覽器猜內容類型，圖片就是圖片
      'X-Content-Type-Options': 'nosniff'
    });

    if (req.fresh) {
      file.stream.destroy();
      return res.status(304).end();
    }

    res.set('Content-Length', String(file.size));
    if (req.method === 'HEAD') {
      file.stream.destroy();
      return res.end();
    }

    pipeline(file.stream, res, (error) => {
      // 使用者中途關掉頁面（ERR_STREAM_PREMATURE_CLOSE）不是錯誤；其他錯誤在還沒開始回傳時交給錯誤處理
      if (
        error &&
        error.code !== 'ERR_STREAM_PREMATURE_CLOSE' &&
        !res.headersSent
      ) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUploadedImage };
