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

// 卡片上的「來自 Unsplash」致謝連結（相機圖示 + 文字 + 外連箭頭，圖示是 Lucide 風格的內嵌 SVG）。
// 連到 Unsplash 首頁，一樣要帶 utm；文字依語言切換（卡片會在 langchange 時重新渲染）
const UNSPLASH_ICON_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const unsplashCreditHTML = () => `<a href="${escapeHtml(withUtm('https://unsplash.com/'))}" target="_blank" rel="noopener" class="photo-credit-source"><svg class="photo-credit-icon" ${UNSPLASH_ICON_ATTRS}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg><span>${escapeHtml(i18n.t('common.fromUnsplash'))}</span><svg class="photo-credit-external" ${UNSPLASH_ICON_ATTRS}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`;
