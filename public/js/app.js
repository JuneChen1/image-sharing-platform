const shareForm = document.getElementById('share-form');
const shareInput = document.getElementById('share-input');
const shareStatusEl = document.getElementById('share-status');
const shareModalEl = document.getElementById('shareModal');

shareModalEl.addEventListener('hidden.bs.modal', () => {
  shareForm.reset();
  shareStatusEl.textContent = '';
});

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const searchModalStatusEl = document.getElementById('search-modal-status');
const searchModalEl = document.getElementById('searchModal');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

searchModalEl.addEventListener('hidden.bs.modal', () => {
  searchModalStatusEl.textContent = '';
});

shareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = shareInput.value.trim();
  if (!url) return;

  shareStatusEl.textContent = '分享中...';

  try {
    const response = await fetch('/api/v1/shared-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const body = await response.json();

    shareStatusEl.textContent = response.ok
      ? '分享成功！（目前尚未接資料庫，僅完成網址解析與 Unsplash API 驗證）'
      : body.message || '分享失敗';
  } catch (error) {
    shareStatusEl.textContent = '連線錯誤，請確認伺服器是否啟動';
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  searchModalStatusEl.textContent = '搜尋中...';

  try {
    const response = await fetch(`/api/v1/photos?q=${encodeURIComponent(query)}`);
    const body = await response.json();

    if (!response.ok) {
      searchModalStatusEl.textContent = body.message || '搜尋失敗';
      return;
    }

    const photos = body.data.results;
    statusEl.textContent = `共 ${body.data.total} 筆結果`;
    resultsEl.innerHTML = photos.map(renderPhotoCard).join('');
    bootstrap.Modal.getOrCreateInstance(searchModalEl).hide();
  } catch (error) {
    searchModalStatusEl.textContent = '連線錯誤，請確認伺服器是否啟動';
  }
});

function renderPhotoCard(photo) {
  return `
    <div class="col-md-4">
      <div class="card h-100">
        <img src="${photo.urls.small}" class="card-img-top" alt="${photo.alt_description ?? ''}" />
        <div class="card-body">
          <p class="card-text">
            Photo by
            <a href="${photo.user.links.html}" target="_blank" rel="noopener">${photo.user.name}</a>
            on
            <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>
          </p>
        </div>
      </div>
    </div>
  `;
}
