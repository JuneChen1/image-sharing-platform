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
const paginationEl = document.getElementById('pagination');

let currentQuery = '';
let currentPhotos = [];
const MAX_PAGES = 20;

searchModalEl.addEventListener('hidden.bs.modal', () => {
  form.reset();
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
    await fetchAndRenderPhotos(query, 1);
    bootstrap.Modal.getOrCreateInstance(searchModalEl).hide();
  } catch (error) {
    searchModalStatusEl.textContent = error.message || '連線錯誤，請確認伺服器是否啟動';
  }
});

paginationEl.addEventListener('click', async (event) => {
  const link = event.target.closest('a[data-page]');
  if (!link) return;
  event.preventDefault();

  const pageItem = link.closest('.page-item');
  if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

  try {
    await fetchAndRenderPhotos(currentQuery, Number(link.dataset.page));
  } catch (error) {
    statusEl.textContent = error.message || '連線錯誤，請確認伺服器是否啟動';
  }
});

window.addEventListener(
  'resize',
  debounce(() => {
    if (currentPhotos.length > 0) {
      renderMasonry(currentPhotos);
    }
  }, 200)
);

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

async function fetchAndRenderPhotos(query, page) {
  const response = await fetch(
    `/api/v1/photos?q=${encodeURIComponent(query)}&page=${page}`
  );
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message);
  }

  currentQuery = query;
  currentPhotos = body.data.results;
  renderMasonry(currentPhotos);
  renderPagination(page, Math.min(body.data.total_pages, MAX_PAGES));
}

const CARD_TEXT_HEIGHT = 70;

function getColumnCount() {
  if (window.innerWidth >= 992) return 5;
  if (window.innerWidth >= 768) return 4;
  return 2;
}

function renderMasonry(photos) {
  const columnCount = getColumnCount();
  const columnWidth = resultsEl.clientWidth / columnCount;
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    photos: []
  }));

  photos.forEach((photo) => {
    const estimatedHeight =
      (columnWidth * photo.height) / photo.width + CARD_TEXT_HEIGHT;
    const shortestColumn = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest
    );
    shortestColumn.photos.push(photo);
    shortestColumn.height += estimatedHeight;
  });

  resultsEl.innerHTML = columns
    .map(
      (column) =>
        `<div class="masonry-column">${column.photos.map(renderPhotoCard).join('')}</div>`
    )
    .join('');
}

function renderPagination(currentPage, totalPages) {
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pageItems = [];
  for (let page = start; page <= end; page++) {
    pageItems.push(`
      <li class="page-item ${page === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${page}">${page}</a>
      </li>
    `);
  }

  paginationEl.innerHTML = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
    ${pageItems.join('')}
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `;
}

function renderPhotoCard(photo) {
  return `
    <div class="card">
      <img src="${photo.urls.small}" class="card-img-top" alt="${photo.alt_description ?? ''}" />
      <div class="card-body">
        <p class="card-text">
          Photo by
          <a href="${photo.user.links.html}" target="_blank" rel="noopener">${photo.user.name}</a>
        </p>
      </div>
    </div>
  `;
}
