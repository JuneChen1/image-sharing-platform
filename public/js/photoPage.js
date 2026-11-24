(async function () {
  await window.partialsReady;

  const statusEl = document.getElementById('status');
  const notFoundEl = document.getElementById('not-found');
  const detailEl = document.getElementById('photo-detail');

  // 網址是 /photos/<id>，id 是最後一段
  const photoId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');
  const BRAND = '圖個方便 | PicShare';

  let photo = null;
  // 登入狀態改變而重新載入時，舊請求比較晚回來不能蓋掉新結果
  let latestRequestId = 0;

  const SVG_ATTRS =
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const ICON_BOOKMARK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>';
  const ICON_SHARE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/></svg>';
  const ICON_DOWNLOAD =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/></svg>';

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  function showNotFound() {
    photo = null;
    detailEl.classList.add('d-none');
    notFoundEl.classList.remove('d-none');
    setStatus('', false);
    document.title = BRAND;
  }

  function render() {
    const isOwnPhoto = Boolean(photo.user_id) && photo.user_id === window.auth.getUserId();
    const loggedIn = window.auth.isLoggedIn();
    const name = photo.photographer_name;
    const initial = (name || '?').trim().charAt(0).toUpperCase();
    const photographerLink = escapeHtml(withUtm(photo.photographer_url));
    const favoritesCount = photo.favorites_count || 0;

    const categoriesHtml = (photo.categories || [])
      .map(
        (category) =>
          `<a class="tag-pill" href="/?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`
      )
      .join('');

    const collectTitle = loggedIn
      ? ''
      : ` title="${escapeHtml(i18n.t('lightbox.collectLogin'))}"`;

    document.title = `${name} | ${BRAND}`;

    detailEl.innerHTML = `
      <div class="photo-detail-credit">
        <a href="${photographerLink}" target="_blank" rel="noopener" class="lightbox-photographer-avatar" tabindex="-1" aria-hidden="true">${escapeHtml(initial)}</a>
        <div class="lightbox-credit-text">
          <a href="${photographerLink}" target="_blank" rel="noopener" class="lightbox-photographer-name">${escapeHtml(name)}</a>
          <span class="lightbox-credit-source">
            <svg class="lightbox-credit-icon" ${SVG_ATTRS}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            <span>${escapeHtml(i18n.t('lightbox.fromUnsplash'))}</span>
            <a href="${escapeHtml(withUtm('https://unsplash.com/'))}" target="_blank" rel="noopener">Unsplash<svg class="lightbox-credit-external" ${SVG_ATTRS}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>
          </span>
        </div>
      </div>
      <div class="photo-detail-image-wrap">
        <img src="${escapeHtml(photo.image_url)}" class="photo-detail-image" alt="${escapeHtml(i18n.t('common.photoAlt', { name }))}" />
      </div>
      ${categoriesHtml ? `<div class="d-flex flex-wrap gap-2 mt-3">${categoriesHtml}</div>` : ''}
      <div class="photo-detail-footer">
        <div class="d-flex flex-column gap-1">
          <span>${escapeHtml(i18n.t('lightbox.sharedBy'))}<a href="/user-shared-photos.html?userId=${encodeURIComponent(photo.user_id)}" class="person-link"><span class="person-name">${escapeHtml(photo.user_name)}</span></a></span>
          <span class="text-muted small">${escapeHtml(i18n.t('photo.savedBy', { count: favoritesCount }))} · ${escapeHtml(i18n.t('photo.sharedAt', { date: i18n.formatDate(photo.created_at) }))}</span>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" id="photo-collect" class="btn ${photo.is_collected ? 'btn-dark' : 'btn-outline-dark'} rounded-pill d-inline-flex align-items-center gap-1"${collectTitle}>
            ${ICON_BOOKMARK}<span>${escapeHtml(i18n.t('lightbox.collect'))}</span>
          </button>
          ${
            loggedIn && !isOwnPhoto
              ? `<button type="button" id="photo-share" class="btn btn-outline-dark rounded-pill d-inline-flex align-items-center gap-1">${ICON_SHARE}<span>${escapeHtml(i18n.t('common.share'))}</span></button>`
              : ''
          }
          ${
            isOwnPhoto
              ? `<button type="button" id="photo-unshare" class="btn btn-outline-danger rounded-pill">${escapeHtml(i18n.t('home.unshare'))}</button>`
              : ''
          }
          <a href="${escapeHtml(withUtm(photo.unsplash_page_url))}" target="_blank" rel="noopener" class="btn btn-dark rounded-pill d-inline-flex align-items-center gap-1">${ICON_DOWNLOAD}<span>${escapeHtml(i18n.t('common.download'))}</span></a>
        </div>
      </div>
    `;

    notFoundEl.classList.add('d-none');
    detailEl.classList.remove('d-none');
    setStatus('', false);
  }

  detailEl.addEventListener('click', async (event) => {
    if (event.target.closest('#photo-collect')) {
      window.openCollectModal(photo.id);
      return;
    }

    if (event.target.closest('#photo-share')) {
      window.openShareModal(photo.unsplash_page_url);
      return;
    }

    if (event.target.closest('#photo-unshare')) {
      if (!window.confirm(i18n.t('home.unshareConfirm'))) return;

      setStatus(i18n.t('home.unsharing'), false);
      try {
        const response = await fetch(`/api/v1/shared-photos/${encodeURIComponent(photo.id)}`, {
          method: 'DELETE',
          headers: window.auth.getAuthHeader()
        });
        const body = await response.json();

        if (!response.ok) {
          setStatus(i18n.apiMessage(body, 'home.unshareFailed'), true);
          return;
        }

        // 這張照片已經不存在，回首頁
        window.location.href = '/';
      } catch (error) {
        setStatus(i18n.t('common.networkError'), true);
      }
    }
  });

  // 收藏成功後就地更新：人數是「不重複的人」，已收藏過的人再放進別的收藏庫不增加
  document.addEventListener('photocollected', (event) => {
    if (!photo || event.detail.photoId !== photo.id) return;

    if (!photo.is_collected) {
      photo.favorites_count = (photo.favorites_count || 0) + 1;
    }
    photo.is_collected = true;
    render();
  });

  // 登出／登入後重新抓資料（is_collected 與按鈕會不同）；切換語言只要重繪
  document.addEventListener('authchange', () => loadPhoto());
  document.addEventListener('langchange', () => {
    if (photo) render();
  });

  async function loadPhoto() {
    const requestId = ++latestRequestId;
    const isStale = () => requestId !== latestRequestId;

    setStatus(i18n.t('common.loading'), false);
    try {
      const response = await fetch(`/api/v1/shared-photos/${encodeURIComponent(photoId)}`, {
        // 登入時帶 token，後端才會回傳自己是否已收藏（is_collected）；訪客不帶也能看
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();
      if (isStale()) return;

      // id 格式錯誤（400）和不存在（404）對使用者來說都是「找不到」
      if (response.status === 404 || body.code === 'INVALID_ID') {
        showNotFound();
        return;
      }

      if (!response.ok) {
        setStatus(i18n.apiMessage(body, 'common.networkError'), true);
        return;
      }

      photo = body.data;
      render();
    } catch (error) {
      if (isStale()) return;
      setStatus(i18n.t('common.networkError'), true);
    }
  }

  await loadPhoto();
})();
