(async function () {
  await window.partialsReady;

  const shareForm = document.getElementById('share-form');
  const shareInput = document.getElementById('share-input');
  const shareModalEl = document.getElementById('shareModal');
  const shareSubmitBtn = document.getElementById('share-submit-btn');
  const categoryInput = document.getElementById('category-input');
  const categoryAddBtn = document.getElementById('category-add-btn');
  const categoryListEl = document.getElementById('category-list');

  // 要和 config/constants.js 的 categoryMaxCount 一致
  const CATEGORY_MAX_COUNT = 10;
  let categories = [];
  let isSubmitting = false;
  // 這次開啟彈窗期間有沒有分享成功：關閉時才通知頁面重新載入清單，避免開著時背景一直跳動
  let hasShared = false;

  const { show: showAlert, hide: hideAlert } = createAlert('share', 'mt-2 mb-0');

  function renderCategories() {
    categoryListEl.innerHTML = categories
      .map(
        (name) => `
          <span class="badge text-bg-secondary d-flex align-items-center gap-1">
            ${escapeHtml(name)}
            <button type="button" class="btn-close btn-close-white btn-close-sm" data-category="${escapeHtml(name)}" aria-label="${i18n.t('share.removeCategory')}"></button>
          </span>
        `
      )
      .join('');
  }

  // 回傳 false 代表輸入的分類不合法（已顯示提示），呼叫端不該繼續往下走。
  // 含 < > 時文字保留在輸入框讓使用者修改；超過上限時修改也沒用，直接清掉，之後才能直接按「分享」送出
  function addCategory() {
    const name = categoryInput.value.trim();
    if (/[<>]/.test(name)) {
      showAlert(i18n.t('share.categoryInvalidChars'));
      return false;
    }

    // 後端以不分大小寫去重，前端同步，避免出現 Animal 與 animal 兩個標籤
    const lowerName = name.toLowerCase();
    const isDuplicate = categories.some((c) => c.toLowerCase() === lowerName);
    if (name && !isDuplicate && categories.length >= CATEGORY_MAX_COUNT) {
      categoryInput.value = '';
      showAlert(i18n.t('share.categoryLimit', { max: CATEGORY_MAX_COUNT }));
      return false;
    }

    categoryInput.value = '';
    if (!name || isDuplicate) return true;

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

    if (hasShared) {
      hasShared = false;
      document.dispatchEvent(new CustomEvent('photoshared'));
    }
  });

  shareForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const url = shareInput.value.trim();
    if (!url) {
      showAlert(i18n.t('error.URL_REQUIRED'));
      return;
    }

    // 依表單由上而下的順序驗證：網址在分類上面，所以先擋格式錯誤的網址。
    // 這裡只做開頭的快速檢查，完整的網址格式與 ID 解析由後端 getUnsplashImageId 負責；
    // 照片是否真的存在只有後端問得到，仍由後端回傳
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
        hasShared = true;
        showAlert(i18n.t('share.success'), 'success');
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
