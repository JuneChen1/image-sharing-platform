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

    if (!isOwnPage && body.user) {
      titleEl.textContent = `${body.user.name} 的分享紀錄`;
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
    const initial = (photo.photographer_name || '?').trim().charAt(0).toUpperCase();
    const favoritesCount = photo.favorites_count || 0;
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
                  <button type="button" class="photo-collect-badge" data-collect-id="${photo.id}" title="${favoritesCount} 人收藏，點擊收藏">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </button>`
                : `<div class="photo-collect-badge" title="${favoritesCount} 人收藏">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </div>`
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
          isOwnPage
            ? `<button type="button" class="btn btn-sm btn-outline-danger w-100 mt-2" data-cancel-id="${photo.id}">取消分享</button>`
            : ''
        }
      </div>
    `;
  }
})();
