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
    onRemoveFromCollection
  }) => {
    lightboxImage.src = imageUrl;
    lightboxImage.alt = i18n.t('common.photoAlt', { name: photographerName });
    lightboxPhotographer.innerHTML = avatarLinkHTML(photographerName);
    lightboxPhotographer.href = photographerUrl;
    lightboxDownload.href = downloadUrl;
    currentShareUrl = downloadUrl;
    currentCollectId = collectId || null;
    lightboxCollect.classList.toggle(
      'd-none',
      !currentCollectId || !window.auth.isLoggedIn()
    );
    lightboxShare.classList.toggle('d-none', !window.auth.isLoggedIn());
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
