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

  let currentShareUrl = '';
  let currentCollectId = null;

  function personLinkHTML(name) {
    return `<span class="person-name">${name}</span>`;
  }

  window.openLightbox = ({
    imageUrl,
    photographerName,
    photographerUrl,
    downloadUrl,
    categories,
    collectId,
    sharerId,
    sharerName
  }) => {
    lightboxImage.src = imageUrl;
    lightboxImage.alt = `${photographerName} 的照片`;
    lightboxPhotographer.innerHTML = personLinkHTML(photographerName);
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
      .map((name) => `<span class="tag-pill">${name}</span>`)
      .join('');
    lightboxSharer.classList.toggle('d-none', !sharerId || !sharerName);
    if (sharerId && sharerName) {
      lightboxSharerLink.innerHTML = personLinkHTML(sharerName);
      lightboxSharerLink.href = `/user-shared-photos.html?userId=${sharerId}`;
    }
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).show();
  };

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
