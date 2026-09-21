(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');
  const categoryBarEl = document.getElementById('category-bar');
  const searchFormEl = document.getElementById('home-search-form');
  const searchInputEl = document.getElementById('home-search-input');

  const LIMIT = 20;
  const CARD_TEXT_HEIGHT = 16;
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

  resultsEl.addEventListener('click', async (event) => {
    const collectBtn = event.target.closest('button[data-collect-id]');
    if (collectBtn) {
      window.openCollectModal(collectBtn.dataset.collectId);
      return;
    }

    const shareBtn = event.target.closest('button[data-share-id]');
    if (shareBtn) {
      const photo = currentPhotos.find((p) => p.id === shareBtn.dataset.shareId);
      if (photo) window.openShareModal(photo.unsplash_page_url);
      return;
    }

    const cancelBtn = event.target.closest('button[data-cancel-id]');
    if (cancelBtn) {
      if (!window.confirm('確定要取消分享這張照片嗎？此動作無法復原。')) return;

      setStatus('取消中...', false);
      try {
        const response = await fetch(
          `/api/v1/shared-photos/${cancelBtn.dataset.cancelId}`,
          { method: 'DELETE', headers: window.auth.getAuthHeader() }
        );
        const body = await response.json();

        if (!response.ok) {
          setStatus(body.message || '取消分享失敗', true);
          return;
        }

        await fetchAndRenderPhotos(1);
      } catch (error) {
        setStatus('連線錯誤，請確認伺服器是否啟動', true);
      }
      return;
    }

    const img = event.target.closest('img[data-photo-id]');
    if (!img) return;

    const photo = currentPhotos.find((p) => p.id === img.dataset.photoId);
    if (!photo) return;

    window.openLightbox({
      imageUrl: photo.image_url,
      photographerName: photo.photographer_name,
      photographerUrl: photo.photographer_url,
      downloadUrl: photo.unsplash_page_url,
      categories: photo.categories,
      collectId: photo.id,
      sharerId: photo.user_id,
      sharerName: photo.user_name
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
    const initial = (photo.photographer_name || '?').trim().charAt(0).toUpperCase();
    return `
      <div class="card">
        <div class="photo-media">
          <img
            src="${photo.image_url}"
            class="card-img-top lightbox-trigger"
            data-photo-id="${photo.id}"
            alt="${photo.photographer_name} 的照片"
          />
          <div class="photo-overlay-top">
            ${
              window.auth.isLoggedIn()
                ? `<button type="button" class="btn-icon" data-share-id="${photo.id}" title="分享" aria-label="分享">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
                    </svg>
                  </button>
                  <button type="button" class="btn-icon" data-collect-id="${photo.id}" title="收藏" aria-label="收藏">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                  </button>`
                : ''
            }
          </div>
          <div class="photo-overlay-bottom">
            <a href="${photo.photographer_url}" target="_blank" rel="noopener" class="photo-author">
              <span class="photo-author-avatar">${initial}</span>
              <span class="photo-author-name">${photo.photographer_name}</span>
            </a>
            <a href="${photo.unsplash_page_url}" target="_blank" rel="noopener" class="btn-download">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
              </svg>
              下載
            </a>
          </div>
        </div>
        ${
          photo.user_id && photo.user_id === window.auth.getUserId()
            ? `<button type="button" class="btn btn-sm btn-outline-danger w-100 mt-2" data-cancel-id="${photo.id}">取消分享</button>`
            : ''
        }
      </div>
    `;
  }
})();
