// Unsplash API 規定：所有連回 Unsplash 的連結都要帶 utm_source=<App 名稱>&utm_medium=referral。
// 只在「顯示連結」（href）時才加，資料庫與分享視窗用的網址維持原樣：
// 後端 getUnsplashImageId 是取網址最後 11 個字元當照片 ID，網址後面多了 utm 參數會解析出錯誤的 ID。
const UNSPLASH_UTM_SOURCE = 'picshare';

const withUtm = (url) => {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', UNSPLASH_UTM_SOURCE);
    u.searchParams.set('utm_medium', 'referral');
    return u.toString();
  } catch {
    return url;
  }
};
