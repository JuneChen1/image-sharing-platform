(async function () {
  await window.partialsReady;

  const lightboxModalEl = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxPhotographer = document.getElementById('lightbox-photographer');
  const lightboxPhotographerAvatar = document.getElementById('lightbox-photographer-avatar');
  const lightboxDownload = document.getElementById('lightbox-download');
  const lightboxShare = document.getElementById('lightbox-share');
  const lightboxCollect = document.getElementById('lightbox-collect');
  const lightboxCategories = document.getElementById('lightbox-categories');
  const lightboxSharer = document.getElementById('lightbox-sharer');
  const lightboxSharerLink = document.getElementById('lightbox-sharer-link');
  const lightboxRemoveFromCollection = document.getElementById('lightbox-remove-from-collection');
  const lightboxCreditUnsplash = document.getElementById('lightbox-credit-unsplash');
  const lightboxCreditUpload = document.getElementById('lightbox-credit-upload');
  const lightboxNote = document.getElementById('lightbox-note');

  const lightboxShareLabel = lightboxShare.querySelector('span');

  let currentShareUrl = '';
  let currentCollectId = null;
  let currentOnRemoveFromCollection = null;

  function personLinkHTML(name) {
    return `<span class="person-name">${escapeHtml(name)}</span>`;
  }

  // 已經分享過的照片：分享鈕變灰、不能按，文字改成「已分享」。
  // 文字用 data-i18n 管理，切換語言時才會跟著翻
  function setShareButtonShared(shared) {
    lightboxShare.disabled = shared;
    lightboxShare.classList.toggle('btn-outline-dark', !shared);
    lightboxShare.classList.toggle('btn-outline-secondary', shared);
    const key = shared ? 'common.shared' : 'common.share';
    lightboxShareLabel.dataset.i18n = key;
    lightboxShareLabel.textContent = i18n.t(key);
  }

  // 作者連結：Unsplash 來源連到 Unsplash（另開分頁）；上傳來源連到站內的上傳者頁面（同一個分頁）
  function setExternalLink(el, isExternal) {
    if (isExternal) {
      el.target = '_blank';
      el.rel = 'noopener';
    } else {
      el.removeAttribute('target');
      el.removeAttribute('rel');
    }
  }

  // 上傳來源的致謝行（取代「來自 Unsplash」）：原創顯示「原創作品」，非原創顯示指向出處的「來源」連結
  function uploadSourceHTML(photo) {
    if (photo.is_original) {
      return `<span>${escapeHtml(i18n.t('common.originalWork'))}</span>`;
    }
    return `<a href="${escapeHtml(photo.origin_url)}" ${originLinkAttrs}>${escapeHtml(i18n.t('common.source'))}<svg class="lightbox-credit-external" ${UNSPLASH_ICON_ATTRS}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`;
  }

  // 傳 photo（一筆完整的照片資料）時，作者、致謝與下載都依來源（Unsplash 或上傳）自動決定，
  // 其餘舊的參數（photographerName 等）只給沒有完整資料的呼叫端用（例如搜尋頁的 Unsplash 搜尋結果）
  window.openLightbox = ({
    imageUrl,
    photographerName,
    photographerUrl,
    downloadUrl,
    photo,
    categories,
    collectId,
    sharerId,
    sharerName,
    isOwnPhoto,
    alreadyShared,
    onRemoveFromCollection
  }) => {
    const isUpload = Boolean(photo) && isUploadPhoto(photo);
    const authorName = photo ? photoAuthorName(photo) : photographerName;
    const photographerLink = photo ? photoAuthorHref(photo) : withUtm(photographerUrl);

    lightboxImage.src = imageUrl;
    lightboxImage.alt = i18n.t('common.photoAlt', { name: authorName });
    lightboxPhotographer.textContent = authorName;
    lightboxPhotographer.href = photographerLink;
    lightboxPhotographerAvatar.textContent = (authorName || '?').trim().charAt(0).toUpperCase();
    lightboxPhotographerAvatar.href = photographerLink;
    setExternalLink(lightboxPhotographer, !isUpload);
    setExternalLink(lightboxPhotographerAvatar, !isUpload);

    lightboxCreditUnsplash.classList.toggle('d-none', isUpload);
    lightboxCreditUpload.classList.toggle('d-none', !isUpload);
    lightboxCreditUpload.innerHTML = isUpload ? uploadSourceHTML(photo) : '';
    lightboxNote.classList.toggle('d-none', !(isUpload && photo.note));
    lightboxNote.textContent = isUpload && photo.note ? photo.note : '';

    // 下載：上傳來源直接下載我們自己的檔案；Unsplash 來源連到 Unsplash 的照片頁（帶 utm、另開分頁）
    lightboxDownload.href = photo ? photoDownloadHref(photo) : withUtm(downloadUrl);
    if (isUpload) {
      lightboxDownload.setAttribute('download', '');
      lightboxDownload.removeAttribute('target');
      lightboxDownload.removeAttribute('rel');
    } else {
      lightboxDownload.removeAttribute('download');
      setExternalLink(lightboxDownload, true);
    }
    // 分享視窗帶原始網址（不加 utm）：utm 只用在顯示用的連結
    currentShareUrl = photo ? photo.unsplash_page_url : downloadUrl;
    currentCollectId = collectId || null;
    // 訪客也看得到收藏鈕，點下去會導向登入頁（openCollectModal 處理）
    lightboxCollect.classList.toggle('d-none', !currentCollectId);
    if (window.auth.isLoggedIn()) lightboxCollect.removeAttribute('title');
    else lightboxCollect.title = i18n.t('lightbox.collectLogin');
    // 自己分享的照片不能再分享一次（後端會回「已經分享過」），不顯示分享鈕
    // 上傳的照片沒有 Unsplash 網址、不能這樣分享；「貼連結分享」關閉時也一律不顯示
    lightboxShare.classList.toggle(
      'd-none',
      !window.auth.isLoggedIn() || Boolean(isOwnPhoto) || isUpload || !UNSPLASH_SHARE_ENABLED
    );
    setShareButtonShared(Boolean(alreadyShared));
    lightboxCategories.innerHTML = (categories || [])
      .map((name) => `<span class="tag-pill">${escapeHtml(name)}</span>`)
      .join('');
    lightboxSharer.classList.toggle('d-none', !sharerId || !sharerName);
    if (sharerId && sharerName) {
      lightboxSharerLink.innerHTML = personLinkHTML(sharerName);
      lightboxSharerLink.href = `/user-shared-photos.html?userId=${sharerId}`;
    }
    currentOnRemoveFromCollection = onRemoveFromCollection || null;
    lightboxRemoveFromCollection.classList.toggle(
      'd-none',
      !currentOnRemoveFromCollection
    );
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).show();
  };

  lightboxRemoveFromCollection.addEventListener('click', () => {
    if (!currentOnRemoveFromCollection) return;
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).hide();
    currentOnRemoveFromCollection();
  });

  lightboxShare.addEventListener('click', () => {
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).hide();
    window.openShareModal(currentShareUrl);
  });

  lightboxCollect.addEventListener('click', () => {
    if (!currentCollectId) return;
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).hide();
    window.openCollectModal(currentCollectId);
  });
})();
