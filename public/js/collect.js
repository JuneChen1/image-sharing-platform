(async function () {
  await window.partialsReady;

  const collectModalEl = document.getElementById('collectModal');
  const collectListEl = document.getElementById('collect-list');
  const collectNewNameEl = document.getElementById('collect-new-name');
  const collectNewBtn = document.getElementById('collect-new-btn');
  const collectStatusEl = document.getElementById('collect-status');

  let currentPhotoId = null;

  function setStatus(text, isError) {
    collectStatusEl.textContent = text;
    collectStatusEl.classList.toggle('text-danger', isError);
    collectStatusEl.classList.toggle('fw-bold', isError);
    collectStatusEl.classList.toggle('text-muted', !isError);
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
      setStatus(body.message || '載入收藏庫失敗', true);
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
    setStatus('加入中...', false);
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
        setStatus('已加入收藏庫！', false);
      } else if (response.status === 409) {
        setStatus('這張照片已經在這個收藏庫了', true);
      } else {
        setStatus(body.message || '加入失敗', true);
      }
    } catch (error) {
      setStatus('連線錯誤，請確認伺服器是否啟動', true);
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
    setStatus('建立中...', false);
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
        setStatus(body.message || '建立失敗', true);
        return;
      }

      collectNewNameEl.value = '';
      await loadCollections();
      await addPhotoToCollection(body.data.id);
    } catch (error) {
      setStatus('連線錯誤，請確認伺服器是否啟動', true);
    } finally {
      isCreatingCollection = false;
      collectNewBtn.disabled = false;
    }
  });

  collectModalEl.addEventListener('hidden.bs.modal', () => {
    setStatus('', false);
    collectNewNameEl.value = '';
    currentPhotoId = null;
  });

  window.openCollectModal = async (photoId) => {
    if (!window.auth.isLoggedIn()) {
      window.location.href = '/auth.html';
      return;
    }
    currentPhotoId = photoId;
    setStatus('', false);
    bootstrap.Modal.getOrCreateInstance(collectModalEl).show();
    await loadCollections();
  };
})();
