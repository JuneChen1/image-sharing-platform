// 照片的「來源」（Unsplash 或使用者上傳）怎麼顯示：作者、致謝、下載連結。
// 首頁、使用者分享紀錄、收藏庫、照片詳情頁、管理後台共用。要先載入 escapeHtml.js 與 unsplashLink.js；
// 用到 i18n 的地方是被呼叫時才讀，所以放在 i18n.js 前後都可以
//
// 照片資料的來源欄位（後端 shared_photos）：
//   source_type：'unsplash' 或 'upload'
//   unsplash 來源：photographer_name、photographer_url、unsplash_page_url
//   upload 來源：is_original、origin_url（出處連結，非原創必填）、note（備註）；作者就是上傳的人（user_id、user_name）

const isUploadPhoto = (photo) => photo.source_type === 'upload';

// 顯示用的作者名稱：Unsplash 來源是攝影師，上傳來源是上傳的人
const photoAuthorName = (photo) =>
  (isUploadPhoto(photo) ? photo.user_name : photo.photographer_name) || '';

// 作者連結：Unsplash 來源連到攝影師的 Unsplash 頁面（帶 utm、另開分頁）；上傳來源連到站內上傳者的分享紀錄頁
const photoAuthorHref = (photo) =>
  isUploadPhoto(photo)
    ? `/user-shared-photos.html?userId=${encodeURIComponent(photo.user_id)}`
    : withUtm(photo.photographer_url);

const photoAuthorLinkAttrs = (photo) =>
  isUploadPhoto(photo) ? '' : 'target="_blank" rel="noopener"';

// 下載：Unsplash 來源連到 Unsplash 的照片頁（帶 utm）；上傳來源直接下載我們自己的檔案
const photoDownloadHref = (photo) =>
  isUploadPhoto(photo) ? photo.image_url : withUtm(photo.unsplash_page_url);

const photoDownloadAttrs = (photo) =>
  isUploadPhoto(photo) ? 'download' : 'target="_blank" rel="noopener"';

// 上傳照片的出處連結：使用者填的，一律另開分頁，並帶 noopener、noreferrer、nofollow
const originLinkAttrs = 'target="_blank" rel="noopener noreferrer nofollow"';

// 卡片作者下面那一行：Unsplash 來源是「來自 Unsplash」（API 規定要標示）；
// 上傳來源是「原創作品」，非原創則是指向出處的「來源」連結
const photoSourceLineHTML = (photo) => {
  if (!isUploadPhoto(photo)) return unsplashCreditHTML();

  if (photo.is_original) {
    return `<span class="photo-credit-source photo-credit-plain">${escapeHtml(i18n.t('common.originalWork'))}</span>`;
  }

  return `<a href="${escapeHtml(photo.origin_url)}" ${originLinkAttrs} class="photo-credit-source"><svg class="photo-credit-icon" ${UNSPLASH_ICON_ATTRS}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>${escapeHtml(i18n.t('common.source'))}</span><svg class="photo-credit-external" ${UNSPLASH_ICON_ATTRS}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`;
};
