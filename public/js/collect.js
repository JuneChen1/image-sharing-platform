(async function () {
  await window.partialsReady;

  const collectModalEl = document.getElementById('collectModal');
  const collectListEl = document.getElementById('collect-list');
  const collectNewNameEl = document.getElementById('collect-new-name');
  const collectNewBtn = document.getElementById('collect-new-btn');
  const alertEl = document.getElementById('collect-alert');
  const alertIconEl = document.getElementById('collect-alert-icon');
  const alertMessageEl = document.getElementById('collect-alert-message');

  let currentPhotoId = null;

  const ALERT_ICON_PATHS = {
    success:
      '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
    danger:
      '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
  };

  function showAlert(message, type = 'danger') {
    alertIconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
    alertMessageEl.textContent = message;
    alertEl.className = `alert alert-dismissible d-flex align-items-center mt-2 mb-0 alert-${type}`;
  }

  function hideAlert() {
    alertEl.classList.add('d-none');
  }

  async function loadCollections() {
    collectListEl.innerHTML = '<div class="text-muted small">載入中...</div>';
    const response = await fetch('/api/v1/users/me/collections', {
      headers: { ...window.auth.getAuthHeader() }
    });
    const body = await response.json();

    if (response.status === 401) {
      window.auth.clearSession();
      window.location.href = '/auth.html';
      return;
    }
    if (!response.ok) {
      collectListEl.innerHTML = '';
      showAlert(body.message || '載入收藏庫失敗');
      return;
    }

    if (body.data.length === 0) {
      collectListEl.innerHTML = '<div class="text-muted small">尚未建立任何收藏庫</div>';
      return;
    }

    collectListEl.innerHTML = body.data
      .map(
        (collection) => `
          <button
            type="button"
            class="list-group-item list-group-item-action"
            data-collection-id="${collection.id}"
          >
            ${collection.name}
          </button>
        `
      )
      .join('');
  }

  async function addPhotoToCollection(collectionId) {
    showAlert('加入中...', 'secondary');
    try {
      const response = await fetch(
        `/api/v1/users/me/collections/${collectionId}/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...window.auth.getAuthHeader()
          },
          body: JSON.stringify({ photoId: currentPhotoId })
        }
      );
      const body = await response.json();

      if (response.status === 401) {
        window.auth.clearSession();
        window.location.href = '/auth.html';
        return;
      }
      if (response.ok) {
        showAlert('已加入收藏庫！', 'success');
      } else if (response.status === 409) {
        showAlert('這張照片已經在這個收藏庫了');
      } else {
        showAlert(body.message || '加入失敗');
      }
    } catch (error) {
      showAlert('連線錯誤，請確認伺服器是否啟動');
    }
  }

  collectListEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-collection-id]');
    if (!button) return;
    addPhotoToCollection(button.dataset.collectionId);
  });

  let isCreatingCollection = false;

  collectNewBtn.addEventListener('click', async () => {
    if (isCreatingCollection) return;
    const name = collectNewNameEl.value.trim();
    if (!name) return;

    isCreatingCollection = true;
    collectNewBtn.disabled = true;
    showAlert('建立中...', 'secondary');
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

      if (response.status === 401) {
        window.auth.clearSession();
        window.location.href = '/auth.html';
        return;
      }
      if (!response.ok) {
        showAlert(body.message || '建立失敗');
        return;
      }

      collectNewNameEl.value = '';
      await loadCollections();
      await addPhotoToCollection(body.data.id);
    } catch (error) {
      showAlert('連線錯誤，請確認伺服器是否啟動');
    } finally {
      isCreatingCollection = false;
      collectNewBtn.disabled = false;
    }
  });

  collectModalEl.addEventListener('hidden.bs.modal', () => {
    hideAlert();
    collectNewNameEl.value = '';
    currentPhotoId = null;
  });

  window.openCollectModal = async (photoId) => {
    if (!window.auth.isLoggedIn()) {
      window.location.href = '/auth.html';
      return;
    }
    currentPhotoId = photoId;
    hideAlert();
    bootstrap.Modal.getOrCreateInstance(collectModalEl).show();
    await loadCollections();
  };
})();
