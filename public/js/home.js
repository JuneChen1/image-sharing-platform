(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');
  const categoryBarEl = document.getElementById('category-bar');
  const searchFormEl = document.getElementById('home-search-form');
  const searchInputEl = document.getElementById('home-search-input');

  const LIMIT = 20;
  const CARD_TEXT_HEIGHT = 100;
  let currentCategory = undefined;
  let currentQuery = '';
  let currentPhotos = [];

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  searchFormEl.addEventListener('submit', async (event) => {
    event.preventDefault();
    currentQuery = searchInputEl.value.trim();

    setStatus('搜尋中...', false);
    try {
      await fetchAndRenderPhotos(1);
    } catch (error) {
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
    }
  });

  categoryBarEl.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button || button.classList.contains('active')) return;

    currentCategory = button.dataset.category || undefined;
    renderCategoryBarActive();

    setStatus('載入中...', false);
    try {
      await fetchAndRenderPhotos(1);
    } catch (error) {
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
    }
  });

  resultsEl.addEventListener('click', (event) => {
    const img = event.target.closest('img[data-photo-id]');
    if (!img) return;

    const photo = currentPhotos.find((p) => p.id === img.dataset.photoId);
    if (!photo) return;

    window.openLightbox({
      imageUrl: photo.image_url,
      photographerName: photo.photographer_name,
      photographerUrl: photo.photographer_url,
      downloadUrl: photo.unsplash_page_url,
      categories: photo.categories
    });
  });

  paginationEl.addEventListener('click', async (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();

    const pageItem = link.closest('.page-item');
    if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

    try {
      await fetchAndRenderPhotos(Number(link.dataset.page));
    } catch (error) {
      setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
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

  setStatus('載入中...', false);
  try {
    await loadCategories();
    await fetchAndRenderPhotos(1);
  } catch (error) {
    setStatus(error.message || '連線錯誤，請確認伺服器是否啟動', true);
  }

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  async function loadCategories() {
    const response = await fetch('/api/v1/categories');
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message);
    }

    categoryBarEl.innerHTML = [{ name: '全部' }, ...body.data]
      .map(
        (category) => `
          <button
            type="button"
            class="btn btn-sm ${category.name === '全部' ? 'btn-dark active' : 'btn-outline-dark'}"
            data-category="${category.name === '全部' ? '' : category.name}"
          >
            ${category.name}
          </button>
        `
      )
      .join('');
  }

  function renderCategoryBarActive() {
    categoryBarEl.querySelectorAll('button[data-category]').forEach((button) => {
      const isActive = (button.dataset.category || undefined) === currentCategory;
      button.classList.toggle('active', isActive);
      button.classList.toggle('btn-dark', isActive);
      button.classList.toggle('btn-outline-dark', !isActive);
    });
  }

  async function fetchAndRenderPhotos(page) {
    const categoryParam = currentCategory
      ? `&category=${encodeURIComponent(currentCategory)}`
      : '';
    const queryParam = currentQuery
      ? `&q=${encodeURIComponent(currentQuery)}`
      : '';
    const response = await fetch(
      `/api/v1/shared-photos?page=${page}&limit=${LIMIT}${categoryParam}${queryParam}`
    );
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message);
    }

    if (body.data.length === 0 && page === 1) {
      resultsEl.innerHTML = '';
      paginationEl.innerHTML = '';
      setStatus(
        currentCategory || currentQuery
          ? '找不到符合條件的照片'
          : '目前尚無分享照片，敬請期待！',
        false
      );
      return;
    }

    currentPhotos = await Promise.all(body.data.map(withDimensions));
    renderMasonry(currentPhotos);
    const totalPages = Math.ceil(body.pagination.total / body.pagination.limit);
    renderPagination(page, totalPages);
    setStatus('', false);
  }

  function withDimensions(photo) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ ...photo, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ ...photo, width: 4, height: 3 });
      img.src = photo.image_url;
    });
  }

  function getColumnCount() {
    return window.innerWidth >= 768 ? 4 : 2;
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
        <img
          src="${photo.image_url}"
          class="card-img-top lightbox-trigger"
          data-photo-id="${photo.id}"
          alt="${photo.photographer_name} 的照片"
        />
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
