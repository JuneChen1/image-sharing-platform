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

  async function handleUnauthorized(response) {
    if (response.status !== 401) return false;
    window.auth.clearSession();
    window.location.href = '/auth.html';
    return true;
  }

  function renderCollectionPreview(previewImageUrl) {
    if (!previewImageUrl) {
      return '<div class="collection-preview-empty">尚無照片</div>';
    }

    return `<img src="${previewImageUrl}" alt="" />`;
  }

  async function loadCollections() {
    setListStatus('載入中...', false);
    try {
      const response = await fetch('/api/v1/users/me/collections', {
        headers: { ...window.auth.getAuthHeader() }
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setListStatus(body.message || '載入收藏庫失敗', true);
        return;
      }

      if (body.data.length === 0) {
        collectionsGridEl.innerHTML = '';
        setListStatus('尚未建立任何收藏庫，點擊右上角「新增收藏庫」開始收藏照片吧！', false);
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
                  <div class="text-muted small">${collection.photoCount ?? 0} 張照片</div>
                </div>
              </button>
            </div>
          `
        )
        .join('');
    } catch (error) {
      setListStatus('連線錯誤，請確認伺服器是否啟動', true);
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
    setPhotosStatus('載入中...', false);
    collectionPhotosGridEl.innerHTML = '';
    try {
      const response = await fetch(
        `/api/v1/users/me/collections/${currentCollection.id}/favorites`,
        { headers: { ...window.auth.getAuthHeader() } }
      );
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setPhotosStatus(body.message || '載入照片失敗', true);
        return;
      }

      currentPhotos = body.data;
      if (currentPhotos.length === 0) {
        setPhotosStatus('這個收藏庫還沒有照片', false);
        return;
      }

      setPhotosStatus('', false);
      renderPhotosGrid();
    } catch (error) {
      setPhotosStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  }

  function renderPhotosGrid() {
    collectionPhotosGridEl.innerHTML = currentPhotos
      .map(
        (photo) => `
          <div class="col-md-3 col-6">
            <div class="card h-100">
              <img
                src="${photo.image_url}"
                class="card-img-top lightbox-trigger"
                data-photo-id="${photo.id}"
                alt="${photo.photographer_name} 的照片"
                style="height: 180px; object-fit: cover;"
              />
              <div class="card-body">
                <p class="card-text">
                  攝影師：<a href="${photo.photographer_url}" target="_blank" rel="noopener">${photo.photographer_name}</a>
                </p>
                <button type="button" class="btn btn-sm btn-outline-danger w-100" data-remove-photo-id="${photo.id}">
                  從收藏庫移除
                </button>
              </div>
            </div>
          </div>
        `
      )
      .join('');
  }

  async function removePhotoFromCollection(photoId) {
    if (!window.confirm('確定要從這個收藏庫移除這張照片嗎？')) return;
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
        setPhotosStatus(body.message || '移除失敗', true);
        return;
      }

      await loadCollectionPhotos();
    } catch (error) {
      setPhotosStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  }

  async function deleteCurrentCollection() {
    if (!window.confirm(`確定要刪除收藏庫「${currentCollection.name}」嗎？此動作無法復原。`)) return;
    try {
      const response = await fetch(`/api/v1/users/me/collections/${currentCollection.id}`, {
        method: 'DELETE',
        headers: { ...window.auth.getAuthHeader() }
      });
      const body = await response.json();

      if (await handleUnauthorized(response)) return;
      if (!response.ok) {
        setPhotosStatus(body.message || '刪除失敗', true);
        return;
      }

      closeCollectionDetail();
      await loadCollections();
    } catch (error) {
      setPhotosStatus('連線錯誤，請確認伺服器是否啟動', true);
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
      collectId: photo.id
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
        showNewCollectionAlert(body.message || '建立失敗');
        return;
      }

      bootstrap.Modal.getOrCreateInstance(newCollectionModalEl).hide();
      await loadCollections();
    } catch (error) {
      showNewCollectionAlert('連線錯誤，請確認伺服器是否啟動');
    } finally {
      isCreatingCollection = false;
      newCollectionSubmitBtn.disabled = false;
    }
  });

  await loadCollections();
})();
