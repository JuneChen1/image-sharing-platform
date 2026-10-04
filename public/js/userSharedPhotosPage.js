(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');
  const titleEl = document.querySelector('main h1');
  const crumbEl = document.getElementById('breadcrumb-current');

  const LIMIT = 20;
  const CARD_TEXT_HEIGHT = 100;
  let currentPhotos = [];
  let currentPage = 1;
  let sharerName = '';

  const userId = new URLSearchParams(window.location.search).get('userId');
  const isOwnPage = Boolean(userId) && userId === window.auth.getUserId();

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  function renderTitle() {
    [titleEl, crumbEl].forEach((el) => {
      if (isOwnPage) {
        el.dataset.i18n = 'userPhotos.own';
        el.textContent = i18n.t('userPhotos.own');
      } else if (sharerName) {
        el.removeAttribute('data-i18n');
        el.textContent = i18n.t('userPhotos.other', { name: sharerName });
      }
    });
  }

  if (!userId) {
    setStatus(i18n.t('userPhotos.missingUserId'), true);
    return;
  }

  renderTitle();

  resultsEl.addEventListener('click', async (event) => {
    // 滑鼠點擊卡片上的按鈕或連結後把焦點移開，避免圖示一直停在卡片上；鍵盤操作（detail 為 0）保留焦點
    if (event.detail > 0) event.target.closest('.photo-overlay-top button, .photo-overlay-bottom a')?.blur();

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
      if (!window.confirm(i18n.t('home.unshareConfirm'))) return;

      setStatus(i18n.t('home.unsharing'), false);
      try {
        const response = await fetch(
          `/api/v1/shared-photos/${cancelBtn.dataset.cancelId}`,
          { method: 'DELETE', headers: window.auth.getAuthHeader() }
        );
        const body = await response.json();

        if (!response.ok) {
          setStatus(i18n.apiMessage(body, 'home.unshareFailed'), true);
          return;
        }

        await fetchAndRenderPhotos(1);
      } catch (error) {
        setStatus(i18n.t('common.networkError'), true);
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
      setStatus(error.message || i18n.t('common.networkError'), true);
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

  document.addEventListener('photocollected', (event) => {
    const photo = currentPhotos.find((p) => p.id === event.detail.photoId);
    if (!photo) return;

    photo.favorites_count = (photo.favorites_count || 0) + 1;
    const badge = resultsEl.querySelector(
      `.photo-collect-badge[data-collect-id="${CSS.escape(photo.id)}"]`
    );
    if (!badge) return;
    badge.title = i18n.t('home.savedByTitle', { count: photo.favorites_count });
    badge.querySelector('span').textContent = photo.favorites_count;
  });

  document.addEventListener('authchange', async () => {
    try {
      await fetchAndRenderPhotos(currentPage);
    } catch (error) {
      setStatus(error.message || i18n.t('common.networkError'), true);
    }
  });

  document.addEventListener('langchange', async () => {
    renderTitle();
    try {
      await fetchAndRenderPhotos(currentPage);
    } catch (error) {
      setStatus(error.message || i18n.t('common.networkError'), true);
    }
  });

  setStatus(i18n.t('common.loading'), false);
  try {
    await fetchAndRenderPhotos(1);
  } catch (error) {
    setStatus(error.message || i18n.t('common.networkError'), true);
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
      throw new Error(i18n.apiMessage(body, 'common.networkError'));
    }

    currentPage = page;

    if (!isOwnPage && body.user) {
      sharerName = body.user.name;
      renderTitle();
    }

    if (body.data.length === 0 && page === 1) {
      resultsEl.innerHTML = '';
      paginationEl.innerHTML = '';
      setStatus(
        isOwnPage ? i18n.t('userPhotos.ownEmpty') : i18n.t('userPhotos.otherEmpty'),
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
            src="${escapeHtml(photo.image_url)}"
            class="card-img-top lightbox-trigger"
            data-photo-id="${escapeHtml(photo.id)}"
            alt="${escapeHtml(i18n.t('common.photoAlt', { name: photo.photographer_name }))}"
          />
          <div class="photo-overlay-top">
            ${
              window.auth.isLoggedIn()
                ? `<button type="button" class="btn-icon" data-share-id="${escapeHtml(photo.id)}" title="${i18n.t('common.share')}" aria-label="${i18n.t('common.share')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
                    </svg>
                  </button>
                  <button type="button" class="photo-collect-badge" data-collect-id="${escapeHtml(photo.id)}" title="${i18n.t('home.savedByTitle', { count: favoritesCount })}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </button>`
                : `<div class="photo-collect-badge" title="${i18n.t('home.savedBy', { count: favoritesCount })}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </div>`
            }
          </div>
          <div class="photo-overlay-bottom">
            <a href="${escapeHtml(photo.photographer_url)}" target="_blank" rel="noopener" class="photo-author">
              <span class="photo-author-avatar">${escapeHtml(initial)}</span>
              <span class="photo-author-name">${escapeHtml(photo.photographer_name)}</span>
            </a>
            <a href="${escapeHtml(photo.unsplash_page_url)}" target="_blank" rel="noopener" class="btn-download">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
              </svg>
              ${i18n.t('common.download')}
            </a>
          </div>
        </div>
        ${
          isOwnPage
            ? `<button type="button" class="btn btn-sm btn-outline-danger w-100 mt-2" data-cancel-id="${escapeHtml(photo.id)}">${i18n.t('home.unshare')}</button>`
            : ''
        }
      </div>
    `;
  }
})();
