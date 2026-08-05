(async function () {
  await window.partialsReady;

  const shareForm = document.getElementById('share-form');
  const shareInput = document.getElementById('share-input');
  const shareStatusEl = document.getElementById('share-status');
  const shareModalEl = document.getElementById('shareModal');
  const categoryInput = document.getElementById('category-input');
  const categoryAddBtn = document.getElementById('category-add-btn');
  const categoryListEl = document.getElementById('category-list');

  let categories = [];

  function renderCategories() {
    categoryListEl.innerHTML = categories
      .map(
        (name) => `
          <span class="badge text-bg-secondary d-flex align-items-center gap-1">
            ${name}
            <button type="button" class="btn-close btn-close-white" style="font-size: 0.6rem" data-category="${name}" aria-label="移除分類"></button>
          </span>
        `
      )
      .join('');
  }

  function addCategory() {
    const name = categoryInput.value.trim();
    categoryInput.value = '';
    if (!name || categories.includes(name)) return;

    categories.push(name);
    renderCategories();
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
    shareStatusEl.textContent = '';
    categories = [];
    renderCategories();
  });

  shareForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = shareInput.value.trim();
    if (!url) return;

    if (categories.length === 0) {
      shareStatusEl.textContent = '請至少選擇一個分類';
      return;
    }

    shareStatusEl.textContent = '分享中...';

    try {
      const response = await fetch('/api/v1/shared-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customCategories: categories })
      });
      const body = await response.json();

      shareStatusEl.textContent = response.ok ? '分享成功！' : body.message || '分享失敗';
    } catch (error) {
      shareStatusEl.textContent = '連線錯誤，請確認伺服器是否啟動';
    }
  });

  window.openShareModal = (url) => {
    shareInput.value = url;
    bootstrap.Modal.getOrCreateInstance(shareModalEl).show();
  };
})();
