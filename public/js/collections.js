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

  const breadcrumbCollectionsLink = document.getElementById('breadcrumb-collections-link');
  const breadcrumbCollectionNameEl = document.getElementById('breadcrumb-collection-name');
  const collectionDetailTitleEl = document.getElementById('collection-detail-title');
  const deleteCollectionBtn = document.getElementById('delete-collection-btn');
  const deleteCollectionModalEl = document.getElementById('deleteCollectionModal');
  const deleteCollectionMessageEl = document.getElementById('delete-collection-message');
  const confirmDeleteCollectionBtn = document.getElementById('confirm-delete-collection-btn');
  const deleteCollectionAlertEl = document.getElementById('delete-collection-alert');
  const deleteCollectionAlertIconEl = document.getElementById('delete-collection-alert-icon');
  const deleteCollectionAlertMessageEl = document.getElementById('delete-collection-alert-message');
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

  function showDeleteCollectionAlert(message, type = 'danger') {
    deleteCollectionAlertIconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
    deleteCollectionAlertMessageEl.textContent = message;
    deleteCollectionAlertEl.className = `alert alert-dismissible d-flex align-items-center mt-3 mb-0 alert-${type}`;
  }

  function hideDeleteCollectionAlert() {
    deleteCollectionAlertEl.classList.add('d-none');
  }

  deleteCollectionAlertEl.querySelector('.btn-close').addEventListener('click', hideDeleteCollectionAlert);

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

    return `<img src="${escapeHtml(previewImageUrl)}" alt="" />`;
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
                data-collection-id="${escapeHtml(collection.id)}"
                data-collection-name="${escapeHtml(collection.name)}"
              >
                <div class="collection-preview">
                  ${renderCollectionPreview(collection.previewImageUrl)}
                </div>
                <div class="collection-info">
                  <div class="collection-name text-truncate">${escapeHtml(collection.name)}</div>
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
    breadcrumbCollectionNameEl.textContent = collectionName;
    listViewEl.classList.add('d-none');
    detailViewEl.classList.remove('d-none');
    await loadCollectionPhotos();
  }

  function closeCollectionDetail() {
    currentCollection = null;
    detailViewEl.classList.add('d-none');
    listViewEl.classList.remove('d-none');
    window.scrollTo({ top: 0 });
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
            <div class="card h-100 collection-photo-card">
              <div class="collection-photo-media">
                <img
                  src="${escapeHtml(photo.image_url)}"
                  class="card-img-top lightbox-trigger"
                  data-photo-id="${escapeHtml(photo.id)}"
                  alt="${escapeHtml(i18n.t('common.photoAlt', { name: photo.photographer_name }))}"
                  style="height: 180px; object-fit: cover;"
                />
                <button
                  type="button"
                  class="collection-remove-btn"
                  data-remove-photo-id="${escapeHtml(photo.id)}"
                  title="${i18n.t('collections.removePhoto')}"
                  aria-label="${i18n.t('collections.removePhoto')}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                  </svg>
                </button>
              </div>
              <div class="card-body">
                <p class="card-text mb-0">
                  <a href="${escapeHtml(photo.photographer_url)}" target="_blank" rel="noopener" class="person-avatar-link">
                    <span class="photo-author-avatar">${escapeHtml(initial)}</span>
                    <span class="photo-author-name">${escapeHtml(photo.photographer_name)}</span>
                  </a>
                </p>
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

  function openDeleteCollectionModal() {
    deleteCollectionMessageEl.textContent = i18n.t('collections.deleteConfirm', { name: currentCollection.name });
    hideDeleteCollectionAlert();
    bootstrap.Modal.getOrCreateInstance(deleteCollectionModalEl).show();
  }

  let isDeletingCollection = false;

  async function deleteCurrentCollection() {
    if (isDeletingCollection) return;
    isDeletingCollection = true;
    confirmDeleteCollectionBtn.disabled = true;
    hideDeleteCollectionAlert();
    try {
      const response = await fetch(`/api/v1/users/me/collections/${currentCollection.id}`, {
        method: 'DELETE',
        headers: { ...window.auth.getAuthHeader() }
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        showDeleteCollectionAlert(body.message || i18n.t('common.deleteFailed'));
        return;
      }

      bootstrap.Modal.getOrCreateInstance(deleteCollectionModalEl).hide();
      closeCollectionDetail();
      await loadCollections();
    } catch (error) {
      showDeleteCollectionAlert(i18n.t('common.networkError'));
    } finally {
      isDeletingCollection = false;
      confirmDeleteCollectionBtn.disabled = false;
    }
  }

  collectionsGridEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-collection-id]');
    if (!button) return;
    openCollectionDetail(button.dataset.collectionId, button.dataset.collectionName);
  });

  breadcrumbCollectionsLink.addEventListener('click', (event) => {
    event.preventDefault();
    closeCollectionDetail();
  });
  deleteCollectionBtn.addEventListener('click', openDeleteCollectionModal);
  confirmDeleteCollectionBtn.addEventListener('click', deleteCurrentCollection);
  deleteCollectionModalEl.addEventListener('hidden.bs.modal', hideDeleteCollectionAlert);

  collectionPhotosGridEl.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('button[data-remove-photo-id]');
    if (removeBtn) {
      removePhotoFromCollection(removeBtn.dataset.removePhotoId);
      // 滑鼠點擊後把焦點移開，避免確認框取消後按鈕一直停在圖片上；鍵盤操作（detail 為 0）保留焦點
      if (event.detail > 0) removeBtn.blur();
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
