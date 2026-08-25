(async function () {
  await window.partialsReady;

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');

  let currentQuery = '';
  let currentPhotos = [];
  const MAX_PAGES = 20;
  const CARD_TEXT_HEIGHT = 100;

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    setStatus('搜尋中...', false);

    try {
      await fetchAndRenderPhotos(query, 1);
      setStatus('', false);
    } catch (error) {
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
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
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
    }
  });

  resultsEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-share-url]');
    if (!button) return;
    window.openShareModal(button.dataset.shareUrl);
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    setStatus('搜尋中...', false);
    try {
      await fetchAndRenderPhotos(initialQuery, 1);
      setStatus('', false);
    } catch (error) {
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
    }
  }

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
          <button type="button" class="btn btn-sm btn-dark w-100" data-share-url="${photo.links.html}">分享</button>
        </div>
      </div>
    `;
  }
})();
