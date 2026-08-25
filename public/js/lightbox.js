(async function () {
  await window.partialsReady;

  const lightboxModalEl = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxPhotographer = document.getElementById('lightbox-photographer');
  const lightboxDownload = document.getElementById('lightbox-download');
  const lightboxShare = document.getElementById('lightbox-share');

  let currentShareUrl = '';

  window.openLightbox = ({ imageUrl, photographerName, photographerUrl, downloadUrl }) => {
    lightboxImage.src = imageUrl;
    lightboxImage.alt = `${photographerName} 的照片`;
    lightboxPhotographer.textContent = photographerName;
    lightboxPhotographer.href = photographerUrl;
    lightboxDownload.href = downloadUrl;
    currentShareUrl = downloadUrl;
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).show();
  };

  lightboxShare.addEventListener('click', () => {
    bootstrap.Modal.getOrCreateInstance(lightboxModalEl).hide();
    window.openShareModal(currentShareUrl);
  });
})();
