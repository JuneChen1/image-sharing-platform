(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const emptyShareCtaEl = document.getElementById('empty-share-cta');
  const resultsEl = document.getElementById('results');
  const paginationEl = document.getElementById('pagination');
  const titleEl = document.querySelector('main h1');
  const crumbEl = document.getElementById('breadcrumb-current');

  const LIMIT = 20;
  const CARD_TEXT_HEIGHT = 100;
  let currentPhotos = [];
  let currentPage = 1;
  let sharerName = '';
  // 連續翻頁或觸發重新載入時，舊請求比較晚回來不能蓋掉新結果：每次請求領序號，過期的直接丟掉。
  // 要宣告在最上面：頁面載入時就會呼叫 fetchAndRenderPhotos
  let latestRequestId = 0;

  // 從照片詳情頁按「上一頁」回來時，自己還原捲動位置（見 uiHelpers.js 的 restoreListScroll）
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

  const initialParams = new URLSearchParams(window.location.search);
  const userId = initialParams.get('userId');
  const initialPage = Number(initialParams.get('page'));
  const isOwnPage = Boolean(userId) && userId === window.auth.getUserId();

  // 頁碼記在網址上（?userId=…&page=2），從詳情頁回來、重新整理才會停在同一頁；第 1 頁不寫
  function syncUrl(page) {
    const params = new URLSearchParams({ userId });
    if (page > 1) params.set('page', String(page));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

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

    openPhotoPage(photo.id, event);
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

  // 收藏鈕的提示文字：自己收藏過的照片要讓人看得出來（但仍可再加入其他收藏庫）
  function collectBadgeTitle(photo) {
    const key = photo.is_collected ? 'home.savedByCollectedTitle' : 'home.savedByTitle';
    return i18n.t(key, { count: photo.favorites_count || 0 });
  }

  document.addEventListener('photocollected', (event) => {
    const photo = currentPhotos.find((p) => p.id === event.detail.photoId);
    if (!photo) return;

    // 人數是「不重複的人」：已經收藏過的人再放進別的收藏庫，不增加人數
    if (!photo.is_collected) {
      photo.favorites_count = (photo.favorites_count || 0) + 1;
    }
    photo.is_collected = true;
    const badge = resultsEl.querySelector(
      `.photo-collect-badge[data-collect-id="${CSS.escape(photo.id)}"]`
    );
    if (!badge) return;
    badge.classList.add('is-collected');
    badge.title = collectBadgeTitle(photo);
    badge.setAttribute('aria-label', badge.title);
    badge.querySelector('span').textContent = photo.favorites_count;
  });

  // 在自己的分享紀錄頁分享成功並關閉彈窗後，回第 1 頁重新載入；別人的頁面不會多出自己的照片，不用更新
  document.addEventListener('photoshared', async () => {
    if (!isOwnPage) return;
    try {
      await fetchAndRenderPhotos(1);
    } catch (error) {
      setStatus(error.message || i18n.t('common.networkError'), true);
    }
  });

  document.getElementById('empty-share-btn').addEventListener('click', () => {
    window.openShareModal('');
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
    await fetchAndRenderPhotos(Number.isInteger(initialPage) && initialPage >= 1 ? initialPage : 1);
    restoreListScroll();
  } catch (error) {
    setStatus(error.message || i18n.t('common.networkError'), true);
  }

  async function fetchAndRenderPhotos(page) {
    const requestId = ++latestRequestId;
    const isStale = () => requestId !== latestRequestId;

    let body;
    try {
      const response = await fetch(
        `/api/v1/users/${encodeURIComponent(userId)}/shared-photos?page=${page}&limit=${LIMIT}`,
        { headers: window.auth.getAuthHeader() }
      );
      body = await response.json();
      if (isStale()) return;

      if (!response.ok) {
        throw new Error(i18n.apiMessage(body, 'common.networkError'));
      }
    } catch (error) {
      if (isStale()) return;
      throw error;
    }

    // 網址上的頁碼超過實際頁數（例如照片被取消分享而變少），退回第 1 頁
    if (body.data.length === 0 && page > 1) {
      return fetchAndRenderPhotos(1);
    }

    currentPage = page;
    syncUrl(page);

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
      // 自己的頁面還沒有任何分享時，給一個直接分享的入口；別人的頁面不需要
      emptyShareCtaEl.classList.toggle('d-none', !isOwnPage);
      return;
    }

    emptyShareCtaEl.classList.add('d-none');
    const photosWithDimensions = await Promise.all(body.data.map(withDimensions));
    if (isStale()) return;

    currentPhotos = photosWithDimensions;
    renderMasonry(currentPhotos);
    const totalPages = Math.ceil(body.pagination.total / body.pagination.limit);
    renderPagination(page, totalPages);
    setStatus('', false);
  }

  function renderMasonry(photos) {
    renderMasonryColumns(resultsEl, photos, {
      columnCount: getMasonryColumnCount(),
      cardTextHeight: CARD_TEXT_HEIGHT,
      renderCard: renderPhotoCard
    });
  }

  function renderPagination(currentPage, totalPages) {
    paginationEl.innerHTML = buildPaginationHtml(currentPage, totalPages);
  }

  function renderPhotoCard(photo) {
    const initial = (photoAuthorName(photo) || '?').trim().charAt(0).toUpperCase();
    const favoritesCount = photo.favorites_count || 0;
    return `
      <div class="card">
        <div class="photo-media">
          <img
            src="${escapeHtml(photo.image_url)}"
            class="card-img-top lightbox-trigger"
            data-photo-id="${escapeHtml(photo.id)}"
            alt="${escapeHtml(i18n.t('common.photoAlt', { name: photoAuthorName(photo) }))}"
          />
          <div class="photo-overlay-top">
            ${
              window.auth.isLoggedIn()
                ? `${
                    // 「分享別人的 Unsplash 照片」只在開放貼連結時才有；上傳的照片沒有 Unsplash 網址，不能這樣分享
                    isOwnPage || isUploadPhoto(photo) || !UNSPLASH_SHARE_ENABLED
                      ? ''
                      : `<button type="button" class="btn-icon" data-share-id="${escapeHtml(photo.id)}" title="${i18n.t('common.share')}" aria-label="${i18n.t('common.share')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
                    </svg>
                  </button>`
                  }
                  <button type="button" class="photo-collect-badge${photo.is_collected ? ' is-collected' : ''}" data-collect-id="${escapeHtml(photo.id)}" title="${collectBadgeTitle(photo)}" aria-label="${collectBadgeTitle(photo)}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </button>`
                : `<button type="button" class="photo-collect-badge" data-collect-id="${escapeHtml(photo.id)}" title="${i18n.t('home.savedByLoginTitle', { count: favoritesCount })}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    </svg>
                    <span>${favoritesCount}</span>
                  </button>`
            }
          </div>
          <div class="photo-overlay-bottom">
            <div class="photo-credit">
              <a href="${escapeHtml(photoAuthorHref(photo))}" ${photoAuthorLinkAttrs(photo)} class="photo-author">
                <span class="photo-author-avatar">${escapeHtml(initial)}</span>
                <span class="photo-author-name">${escapeHtml(photoAuthorName(photo))}</span>
              </a>
              ${photoSourceLineHTML(photo)}
            </div>
            <a href="${escapeHtml(photoDownloadHref(photo))}" ${photoDownloadAttrs(photo)} class="btn-download">
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
