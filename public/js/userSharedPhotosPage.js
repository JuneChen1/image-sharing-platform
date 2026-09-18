(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');
  const titleEl = document.querySelector('main h1');

  const LIMIT = 20;
  const CARD_TEXT_HEIGHT = 100;
  let currentPhotos = [];

  const userId = new URLSearchParams(window.location.search).get('userId');
  const isOwnPage = Boolean(userId) && userId === window.auth.getUserId();

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  if (!userId) {
    setStatus('缺少使用者 ID，無法載入分享紀錄', true);
    return;
  }

  if (isOwnPage) {
    titleEl.textContent = '我的分享紀錄';
  }

  resultsEl.addEventListener('click', async (event) => {
    const collectBtn = event.target.closest('button[data-collect-id]');
    if (collectBtn) {
      window.openCollectModal(collectBtn.dataset.collectId);
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
      collectId: photo.id
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

  async function fetchAndRenderPhotos(page) {
    const response = await fetch(
      `/api/v1/users/${userId}/shared-photos?page=${page}&limit=${LIMIT}`
    );
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message);
    }

    if (body.data.length === 0 && page === 1) {
      resultsEl.innerHTML = '';
      paginationEl.innerHTML = '';
      setStatus(
        isOwnPage ? '你還沒有分享過任何照片' : '這位使用者還沒有分享過任何照片',
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
            攝影師：<a href="${photo.photographer_url}" target="_blank" rel="noopener">${photo.photographer_name}</a>
          </p>
          <div class="d-flex gap-2">
            ${
              window.auth.isLoggedIn()
                ? `<button type="button" class="btn btn-sm btn-outline-dark" data-collect-id="${photo.id}">收藏</button>`
                : ''
            }
            <a href="${photo.unsplash_page_url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-dark flex-grow-1">下載</a>
          </div>
          ${
            isOwnPage
              ? `<button type="button" class="btn btn-sm btn-outline-danger w-100 mt-2" data-cancel-id="${photo.id}">取消分享</button>`
              : ''
          }
        </div>
      </div>
    `;
  }
})();
