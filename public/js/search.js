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
  // 連續搜尋或翻頁時，舊請求比較晚回來不能蓋掉新結果：每次請求領序號，過期的直接丟掉。
  // 要宣告在最上面：網址帶 ?q= 時，頁面載入就會呼叫 fetchAndRenderPhotos
  let latestRequestId = 0;
  const CARD_TEXT_HEIGHT = 100;

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  // 搜尋、換頁、網址帶入關鍵字共用同一套狀態文字，無結果時才不會留下一片空白
  async function runSearch(query, page) {
    setStatus(i18n.t('common.searching'), false);

    try {
      const rendered = await fetchAndRenderPhotos(query, page);
      // 已經有更新的搜尋在跑，這次的結果和狀態文字都不用管，交給最新那次
      if (!rendered) return;
      if (currentPhotos.length === 0) {
        setStatus(i18n.t('search.noResults', { q: query }), false);
      } else {
        setStatus('', false);
      }
    } catch (error) {
      setStatus(error.message || i18n.t('common.networkError'), true);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      setStatus(i18n.t('search.keywordRequired'), true);
      return;
    }

    await runSearch(query, 1);
  });

  paginationEl.addEventListener('click', async (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();

    const pageItem = link.closest('.page-item');
    if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

    await runSearch(currentQuery, Number(link.dataset.page));
  });

  resultsEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-share-url]');
    if (button) {
      window.openShareModal(button.dataset.shareUrl);
      return;
    }

    const img = event.target.closest('img[data-photo-id]');
    if (!img) return;

    const photo = currentPhotos.find((p) => p.id === img.dataset.photoId);
    if (!photo) return;

    window.openLightbox({
      imageUrl: photo.urls.regular,
      photographerName: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.html
    });
  });

  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    await runSearch(initialQuery, 1);
  } else {
    // 還沒搜尋時給一句引導，進來才不會是一片空白；切換語言由 i18n 的 retranslateMessages 處理
    setStatus(i18n.t('search.idleHint'), false);
  }

  window.addEventListener(
    'resize',
    debounce(() => {
      if (currentPhotos.length > 0) {
        renderMasonry(currentPhotos);
      }
    }, 200)
  );

  document.addEventListener('langchange', () => {
    if (currentPhotos.length > 0) {
      renderMasonry(currentPhotos);
    }
  });

  // 回傳 true 代表這次的結果已渲染，false 代表已過期（有更新的請求）
  async function fetchAndRenderPhotos(query, page) {
    const requestId = ++latestRequestId;
    const isStale = () => requestId !== latestRequestId;

    let body;
    try {
      const response = await fetch(
        `/api/v1/photos?q=${encodeURIComponent(query)}&page=${page}`
      );
      body = await response.json();
      if (isStale()) return false;

      if (!response.ok) {
        throw new Error(i18n.apiMessage(body, 'common.networkError'));
      }
    } catch (error) {
      if (isStale()) return false;
      throw error;
    }

    currentQuery = query;
    currentPhotos = body.data.results;
    renderMasonry(currentPhotos);
    renderPagination(page, Math.min(body.data.total_pages, MAX_PAGES));
    return true;
  }

  function renderMasonry(photos) {
    renderMasonryColumns(resultsEl, photos, {
      columnCount: getMasonryColumnCount({ wide: true }),
      cardTextHeight: CARD_TEXT_HEIGHT,
      renderCard: renderPhotoCard
    });
  }

  // 搜尋結果只有一頁時不用顯示分頁
  function renderPagination(currentPage, totalPages) {
    paginationEl.innerHTML = totalPages <= 1 ? '' : buildPaginationHtml(currentPage, totalPages);
  }

  function renderPhotoCard(photo) {
    const initial = (photo.user.name || '?').trim().charAt(0).toUpperCase();
    return `
      <div class="card">
        <div class="photo-image-wrap">
          <img
            src="${escapeHtml(photo.urls.small)}"
            class="card-img-top lightbox-trigger"
            data-photo-id="${escapeHtml(photo.id)}"
            alt="${escapeHtml(photo.alt_description)}"
          />
          <div class="photo-credit">
            <a href="${escapeHtml(withUtm(photo.user.links.html))}" target="_blank" rel="noopener" class="person-avatar-link">
              <span class="photo-author-avatar">${escapeHtml(initial)}</span>
              <span class="photo-author-name">${escapeHtml(photo.user.name)}</span>
            </a>
            ${unsplashCreditHTML()}
          </div>
        </div>
        <div class="card-body">
          <button type="button" class="btn btn-sm btn-dark w-100" data-share-url="${escapeHtml(photo.links.html)}">${i18n.t('common.share')}</button>
        </div>
      </div>
    `;
  }
})();
