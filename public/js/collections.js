(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }

  const listViewEl = document.getElementById('collections-list-view');
  const detailViewEl = document.getElementById('collection-detail-view');
  const collectionsStatusEl = document.getElementById('collections-status');
  const collectionsGridEl = document.getElementById('collections-grid');
  const newCollectionBtn = document.getElementById('new-collection-btn');
  const newCollectionModalEl = document.getElementById('newCollectionModal');
  const newCollectionForm = document.getElementById('new-collection-form');
  const newCollectionNameEl = document.getElementById('new-collection-name');
  const newCollectionAlertEl = document.getElementById('new-collection-alert');
  const newCollectionAlertIconEl = document.getElementById('new-collection-alert-icon');
  const newCollectionAlertMessageEl = document.getElementById('new-collection-alert-message');

  const backToCollectionsBtn = document.getElementById('back-to-collections-btn');
  const collectionDetailTitleEl = document.getElementById('collection-detail-title');
  const deleteCollectionBtn = document.getElementById('delete-collection-btn');
  const collectionPhotosStatusEl = document.getElementById('collection-photos-status');
  const collectionPhotosGridEl = document.getElementById('collection-photos-grid');

  let currentCollection = null;
  let currentPhotos = [];

  function setListStatus(text, isError) {
    collectionsStatusEl.textContent = text;
    collectionsStatusEl.classList.toggle('text-danger', isError);
    collectionsStatusEl.classList.toggle('fw-bold', isError);
    collectionsStatusEl.classList.toggle('text-muted', !isError);
  }

  function setPhotosStatus(text, isError) {
    collectionPhotosStatusEl.textContent = text;
    collectionPhotosStatusEl.classList.toggle('text-danger', isError);
    collectionPhotosStatusEl.classList.toggle('fw-bold', isError);
    collectionPhotosStatusEl.classList.toggle('text-muted', !isError);
  }

  const ALERT_ICON_PATHS = {
    success:
      '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
    danger:
      '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
  };

  function showNewCollectionAlert(message, type = 'danger') {
    newCollectionAlertIconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
    newCollectionAlertMessageEl.textContent = message;
    newCollectionAlertEl.className = `alert alert-dismissible d-flex align-items-center mt-2 mb-0 alert-${type}`;
  }

  function hideNewCollectionAlert() {
    newCollectionAlertEl.classList.add('d-none');
  }

  newCollectionAlertEl.querySelector('.btn-close').addEventListener('click', hideNewCollectionAlert);

  async function handleUnauthorized(response) {
    if (response.status !== 401) return false;
    window.auth.clearSession();
    window.location.href = '/auth.html';
    return true;
  }

  function renderCollectionPreview(previewImageUrl) {
    if (!previewImageUrl) {
      return `<div class="collection-preview-empty">${i18n.t('collections.noPhotos')}</div>`;
    }

    return `<img src="${previewImageUrl}" alt="" />`;
  }

  async function loadCollections() {
    setListStatus(i18n.t('common.loading'), false);
    try {
      const response = await fetch('/api/v1/users/me/collections', {
        headers: { ...window.auth.getAuthHeader() }
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setListStatus(body.message || i18n.t('collections.loadFailed'), true);
        return;
      }

      if (body.data.length === 0) {
        collectionsGridEl.innerHTML = '';
        setListStatus(i18n.t('collections.emptyList'), false);
        return;
      }

      setListStatus('', false);
      collectionsGridEl.innerHTML = body.data
        .map(
          (collection) => `
            <div class="col-md-4 col-6">
              <button
                type="button"
                class="collection-card"
                data-collection-id="${collection.id}"
                data-collection-name="${collection.name}"
              >
                <div class="collection-preview">
                  ${renderCollectionPreview(collection.previewImageUrl)}
                </div>
                <div class="collection-info">
                  <div class="collection-name text-truncate">${collection.name}</div>
                  <div class="text-muted small">${i18n.t('collections.photoCount', { count: collection.photoCount ?? 0 })}</div>
                </div>
              </button>
            </div>
          `
        )
        .join('');
    } catch (error) {
      setListStatus(i18n.t('common.networkError'), true);
    }
  }

  async function openCollectionDetail(collectionId, collectionName) {
    currentCollection = { id: collectionId, name: collectionName };
    collectionDetailTitleEl.textContent = collectionName;
    listViewEl.classList.add('d-none');
    detailViewEl.classList.remove('d-none');
    await loadCollectionPhotos();
  }

  function closeCollectionDetail() {
    currentCollection = null;
    detailViewEl.classList.add('d-none');
    listViewEl.classList.remove('d-none');
  }

  async function loadCollectionPhotos() {
    setPhotosStatus(i18n.t('common.loading'), false);
    collectionPhotosGridEl.innerHTML = '';
    try {
      const response = await fetch(
        `/api/v1/users/me/collections/${currentCollection.id}/favorites`,
        { headers: { ...window.auth.getAuthHeader() } }
      );
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setPhotosStatus(body.message || i18n.t('collections.loadPhotosFailed'), true);
        return;
      }

      currentPhotos = body.data;
      if (currentPhotos.length === 0) {
        setPhotosStatus(i18n.t('collections.emptyCollection'), false);
        return;
      }

      setPhotosStatus('', false);
      renderPhotosGrid();
    } catch (error) {
      setPhotosStatus(i18n.t('common.networkError'), true);
    }
  }

  function renderPhotosGrid() {
    collectionPhotosGridEl.innerHTML = currentPhotos
      .map((photo) => {
        const initial = (photo.photographer_name || '?').trim().charAt(0).toUpperCase();
        return `
          <div class="col-md-3 col-6">
            <div class="card h-100">
              <img
                src="${photo.image_url}"
                class="card-img-top lightbox-trigger"
                data-photo-id="${photo.id}"
                alt="${i18n.t('common.photoAlt', { name: photo.photographer_name })}"
                style="height: 180px; object-fit: cover;"
              />
              <div class="card-body">
                <p class="card-text">
                  <a href="${photo.photographer_url}" target="_blank" rel="noopener" class="person-avatar-link">
                    <span class="photo-author-avatar">${initial}</span>
                    <span class="photo-author-name">${photo.photographer_name}</span>
                  </a>
                </p>
                <button type="button" class="btn btn-sm btn-outline-danger rounded-pill w-100" data-remove-photo-id="${photo.id}">
                  ${i18n.t('collections.removePhoto')}
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  async function removePhotoFromCollection(photoId) {
    if (!window.confirm(i18n.t('collections.removeConfirm'))) return;
    try {
      const response = await fetch(
        `/api/v1/users/me/collections/${currentCollection.id}/favorites/${photoId}`,
        {
          method: 'DELETE',
          headers: { ...window.auth.getAuthHeader() }
        }
      );
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setPhotosStatus(body.message || i18n.t('common.removeFailed'), true);
        return;
      }

      await loadCollectionPhotos();
    } catch (error) {
      setPhotosStatus(i18n.t('common.networkError'), true);
    }
  }

  async function deleteCurrentCollection() {
    if (!window.confirm(i18n.t('collections.deleteConfirm', { name: currentCollection.name }))) return;
    try {
      const response = await fetch(`/api/v1/users/me/collections/${currentCollection.id}`, {
        method: 'DELETE',
        headers: { ...window.auth.getAuthHeader() }
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setPhotosStatus(body.message || i18n.t('common.deleteFailed'), true);
        return;
      }

      closeCollectionDetail();
      await loadCollections();
    } catch (error) {
      setPhotosStatus(i18n.t('common.networkError'), true);
    }
  }

  collectionsGridEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-collection-id]');
    if (!button) return;
    openCollectionDetail(button.dataset.collectionId, button.dataset.collectionName);
  });

  backToCollectionsBtn.addEventListener('click', closeCollectionDetail);
  deleteCollectionBtn.addEventListener('click', deleteCurrentCollection);

  collectionPhotosGridEl.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('button[data-remove-photo-id]');
    if (removeBtn) {
      removePhotoFromCollection(removeBtn.dataset.removePhotoId);
      return;
    }

    const img = event.target.closest('img[data-photo-id]');
    if (!img) return;

    const photo = currentPhotos.find((p) => p.id === img.dataset.photoId);
    if (!photo) return;

    window.openLightbox({
      imageUrl: photo.image_url,
      photographerName: photo.photographer_name,
      photographerUrl: photo.photographer_url,
      downloadUrl: photo.unsplash_page_url,
      categories: photo.categories,
      collectId: photo.id,
      onRemoveFromCollection: () => removePhotoFromCollection(photo.id)
    });
  });

  newCollectionBtn.addEventListener('click', () => {
    bootstrap.Modal.getOrCreateInstance(newCollectionModalEl).show();
  });

  newCollectionModalEl.addEventListener('hidden.bs.modal', () => {
    newCollectionForm.reset();
    hideNewCollectionAlert();
  });

  let isCreatingCollection = false;
  const newCollectionSubmitBtn = newCollectionForm.querySelector('button[type="submit"]');

  newCollectionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isCreatingCollection) return;
    const name = newCollectionNameEl.value.trim();
    if (!name) return;

    isCreatingCollection = true;
    newCollectionSubmitBtn.disabled = true;
    hideNewCollectionAlert();
    try {
      const response = await fetch('/api/v1/users/me/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ name })
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        showNewCollectionAlert(body.message || i18n.t('common.createFailed'));
        return;
      }

      bootstrap.Modal.getOrCreateInstance(newCollectionModalEl).hide();
      await loadCollections();
    } catch (error) {
      showNewCollectionAlert(i18n.t('common.networkError'));
    } finally {
      isCreatingCollection = false;
      newCollectionSubmitBtn.disabled = false;
    }
  });

  document.addEventListener('langchange', () => {
    if (currentCollection) {
      loadCollectionPhotos();
    } else {
      loadCollections();
    }
  });

  await loadCollections();
})();
