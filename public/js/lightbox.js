(async function () {
  await window.partialsReady;

  const lightboxModalEl = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxPhotographer = document.getElementById('lightbox-photographer');
  const lightboxDownload = document.getElementById('lightbox-download');
  const lightboxShare = document.getElementById('lightbox-share');
  const lightboxCollect = document.getElementById('lightbox-collect');
  const lightboxCategories = document.getElementById('lightbox-categories');
  const lightboxSharer = document.getElementById('lightbox-sharer');
  const lightboxSharerLink = document.getElementById('lightbox-sharer-link');
  const lightboxRemoveFromCollection = document.getElementById('lightbox-remove-from-collection');

  let currentShareUrl = '';
  let currentCollectId = null;
  let currentOnRemoveFromCollection = null;

  function personLinkHTML(name) {
    return `<span class="person-name">${escapeHtml(name)}</span>`;
  }

  function avatarLinkHTML(name) {
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    return `
      <span class="lightbox-photographer-avatar">${escapeHtml(initial)}</span>
      <span class="person-name">${escapeHtml(name)}</span>
    `;
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
    onRemoveFromCollection
  }) => {
    lightboxImage.src = imageUrl;
    lightboxImage.alt = i18n.t('common.photoAlt', { name: photographerName });
    lightboxPhotographer.innerHTML = avatarLinkHTML(photographerName);
    lightboxPhotographer.href = withUtm(photographerUrl);
    lightboxDownload.href = withUtm(downloadUrl);
    // 分享視窗要原始網址：後端用網址最後 11 個字元當照片 ID，不能帶 utm
    currentShareUrl = downloadUrl;
    currentCollectId = collectId || null;
    // 訪客也看得到收藏鈕，點下去會導向登入頁（openCollectModal 處理）
    lightboxCollect.classList.toggle('d-none', !currentCollectId);
    if (window.auth.isLoggedIn()) lightboxCollect.removeAttribute('title');
    else lightboxCollect.title = i18n.t('lightbox.collectLogin');
    // 自己分享的照片不能再分享一次（後端會回「已經分享過」），不顯示分享鈕
    lightboxShare.classList.toggle('d-none', !window.auth.isLoggedIn() || Boolean(isOwnPhoto));
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
