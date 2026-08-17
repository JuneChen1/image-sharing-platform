(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');

  const LIMIT = 20;

  paginationEl.addEventListener('click', async (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();

    const pageItem = link.closest('.page-item');
    if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

    try {
      await fetchAndRenderPhotos(Number(link.dataset.page));
    } catch (error) {
      statusEl.textContent = error.message || '連線錯誤，請確認伺服器是否啟動';
    }
  });

  statusEl.textContent = '載入中...';
  try {
    await fetchAndRenderPhotos(1);
    statusEl.textContent = '';
  } catch (error) {
    statusEl.textContent = error.message || '連線錯誤，請確認伺服器是否啟動';
  }

  async function fetchAndRenderPhotos(page) {
    const response = await fetch(`/api/v1/shared-photos?page=${page}&limit=${LIMIT}`);
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message);
    }

    if (body.data.length === 0 && page === 1) {
      resultsEl.innerHTML = '';
      paginationEl.innerHTML = '';
      statusEl.textContent = '目前尚無分享照片，敬請期待！';
      return;
    }

    resultsEl.innerHTML = body.data.map(renderPhotoCard).join('');
    const totalPages = Math.ceil(body.pagination.total / body.pagination.limit);
    renderPagination(page, totalPages);
  }

  function renderPagination(currentPage, totalPages) {
    if (totalPages < 1) {
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
        <img src="${photo.image_url}" class="card-img-top" alt="${photo.photographer_name} 的照片" />
        <div class="card-body">
          <p class="card-text">
            Photo by
            <a href="${photo.photographer_url}" target="_blank" rel="noopener">${photo.photographer_name}</a>
          </p>
          <a href="${photo.unsplash_page_url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-dark w-100">下載</a>
        </div>
      </div>
    `;
  }
})();
