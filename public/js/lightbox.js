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

  window.openLightbox = ({
    imageUrl,
    photographerName,
    photographerUrl,
    downloadUrl,
    categories,
    collectId,
    sharerId,
    sharerName,
    isOwnPhoto,
    alreadyShared,
    onRemoveFromCollection
  }) => {
    lightboxImage.src = imageUrl;
    lightboxImage.alt = i18n.t('common.photoAlt', { name: photographerName });
    const photographerLink = withUtm(photographerUrl);
    lightboxPhotographer.textContent = photographerName;
    lightboxPhotographer.href = photographerLink;
    lightboxPhotographerAvatar.textContent = (photographerName || '?').trim().charAt(0).toUpperCase();
    lightboxPhotographerAvatar.href = photographerLink;
    lightboxDownload.href = withUtm(downloadUrl);
    // 分享視窗帶原始網址（不加 utm）：utm 只用在顯示用的連結
    currentShareUrl = downloadUrl;
    currentCollectId = collectId || null;
    // 訪客也看得到收藏鈕，點下去會導向登入頁（openCollectModal 處理）
    lightboxCollect.classList.toggle('d-none', !currentCollectId);
    if (window.auth.isLoggedIn()) lightboxCollect.removeAttribute('title');
    else lightboxCollect.title = i18n.t('lightbox.collectLogin');
    // 自己分享的照片不能再分享一次（後端會回「已經分享過」），不顯示分享鈕
    lightboxShare.classList.toggle('d-none', !window.auth.isLoggedIn() || Boolean(isOwnPhoto));
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
