(async function () {
  await window.partialsReady;

  const shareForm = document.getElementById('share-form');
  const shareInput = document.getElementById('share-input');
  const shareModalEl = document.getElementById('shareModal');
  const shareSubmitBtn = document.getElementById('share-submit-btn');
  const categoryInput = document.getElementById('category-input');
  const categoryAddBtn = document.getElementById('category-add-btn');
  const categoryListEl = document.getElementById('category-list');
  const alertEl = document.getElementById('share-alert');
  const alertIconEl = document.getElementById('share-alert-icon');
  const alertMessageEl = document.getElementById('share-alert-message');

  let categories = [];
  let isSubmitting = false;

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

  alertEl.querySelector('.btn-close').addEventListener('click', hideAlert);

  function renderCategories() {
    categoryListEl.innerHTML = categories
      .map(
        (name) => `
          <span class="badge text-bg-secondary d-flex align-items-center gap-1">
            ${escapeHtml(name)}
            <button type="button" class="btn-close btn-close-white" style="font-size: 0.6rem" data-category="${escapeHtml(name)}" aria-label="${i18n.t('share.removeCategory')}"></button>
          </span>
        `
      )
      .join('');
  }

  // 回傳 false 代表輸入的分類不合法（已顯示提示、文字保留在輸入框讓使用者修改），呼叫端不該繼續往下走
  function addCategory() {
    const name = categoryInput.value.trim();
    if (/[<>]/.test(name)) {
      showAlert(i18n.t('share.categoryInvalidChars'));
      return false;
    }

    categoryInput.value = '';
    // 後端以不分大小寫去重，前端同步，避免出現 Animal 與 animal 兩個標籤
    const lowerName = name.toLowerCase();
    if (!name || categories.some((c) => c.toLowerCase() === lowerName)) return true;

    categories.push(name);
    renderCategories();
    hideAlert();
    return true;
  }

  categoryAddBtn.addEventListener('click', addCategory);
  categoryInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addCategory();
  });

  categoryListEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    categories = categories.filter((name) => name !== button.dataset.category);
    renderCategories();
  });

  shareModalEl.addEventListener('hidden.bs.modal', () => {
    shareForm.reset();
    hideAlert();
    categories = [];
    renderCategories();
  });

  shareForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const url = shareInput.value.trim();
    if (!url) return;

    // 依表單由上而下的順序驗證：網址在分類上面，所以先擋格式錯誤的網址。
    // 規則和後端 getUnsplashImageId 一致（開頭必須是這串）；照片是否真的存在只有後端問得到，仍由後端回傳
    if (!url.startsWith('https://unsplash.com/photos/')) {
      showAlert(i18n.t('error.INVALID_URL'));
      return;
    }

    // 輸入框裡打了字但還沒按「新增」，送出時一併視為要加入的分類
    if (!addCategory()) return;

    if (categories.length === 0) {
      showAlert(i18n.t('share.needCategory'));
      return;
    }

    isSubmitting = true;
    shareSubmitBtn.disabled = true;
    showAlert(i18n.t('share.sharing'), 'secondary');

    try {
      const response = await fetch('/api/v1/shared-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ url, customCategories: categories })
      });
      const body = await response.json();

      if (response.ok) {
        shareInput.value = '';
        categories = [];
        renderCategories();
        showAlert(i18n.t('share.success'), 'success');
      } else if (response.status === 401) {
        window.auth.clearSession();
        window.auth.redirectToLogin();
      } else {
        showAlert(i18n.apiMessage(body, 'share.failed'));
      }
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    } finally {
      isSubmitting = false;
      shareSubmitBtn.disabled = false;
    }
  });

  window.openShareModal = (url) => {
    if (!window.auth.isLoggedIn()) {
      window.auth.redirectToLogin();
      return;
    }
    shareInput.value = url;
    bootstrap.Modal.getOrCreateInstance(shareModalEl).show();
  };
})();
