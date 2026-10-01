(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.auth.redirectToLogin();
    return;
  }
  if (!window.auth.isAdmin()) {
    window.location.href = '/';
    return;
  }

  const ALERT_ICON_PATHS = {
    success:
      '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
    danger:
      '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
  };

  function makeAlert(prefix) {
    const el = document.getElementById(`${prefix}-alert`);
    const iconEl = document.getElementById(`${prefix}-alert-icon`);
    const messageEl = document.getElementById(`${prefix}-alert-message`);

    function hide() {
      el.classList.add('d-none');
    }

    el.querySelector('.btn-close').addEventListener('click', hide);

    return {
      show(message, type = 'danger') {
        iconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
        messageEl.textContent = message;
        el.className = `alert alert-dismissible d-flex align-items-center mb-3 alert-${type}`;
      },
      hide
    };
  }

  const { formatDate } = i18n;

  function buildPaginationHtml(currentPage, totalPages) {
    if (totalPages < 1) return '';

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

    return `
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

  // ---------- Tabs ----------
  const tabUsersBtn = document.getElementById('tab-users-btn');
  const tabPhotosBtn = document.getElementById('tab-photos-btn');
  const usersPane = document.getElementById('users-pane');
  const photosPane = document.getElementById('photos-pane');

  function showTab(tab) {
    tabUsersBtn.classList.toggle('btn-dark', tab === 'users');
    tabUsersBtn.classList.toggle('btn-outline-dark', tab !== 'users');
    tabPhotosBtn.classList.toggle('btn-dark', tab === 'photos');
    tabPhotosBtn.classList.toggle('btn-outline-dark', tab !== 'photos');
    usersPane.classList.toggle('d-none', tab !== 'users');
    photosPane.classList.toggle('d-none', tab !== 'photos');
  }

  tabUsersBtn.addEventListener('click', () => showTab('users'));
  tabPhotosBtn.addEventListener('click', () => showTab('photos'));

  // ---------- Users management ----------
  const usersSearchForm = document.getElementById('users-search-form');
  const usersKeywordInput = document.getElementById('users-keyword-input');
  const usersBannedFilter = document.getElementById('users-banned-filter');
  const usersStatusEl = document.getElementById('users-status');
  const usersTableBody = document.getElementById('users-table-body');
  const usersPaginationEl = document.getElementById('users-pagination');
  const usersPaginationInfoEl = document.getElementById('users-pagination-info');
  const usersAlert = makeAlert('users');

  const USERS_LIMIT = 10;
  let currentUsersKeyword = '';
  let currentUsersBanned = '';
  let currentUsersPage = 1;

  function setUsersStatus(text) {
    usersStatusEl.textContent = text;
  }

  function renderUsersTable(users) {
    const selfId = window.auth.getUserId();

    usersTableBody.innerHTML = users
      .map((user) => {
        const isSelf = user.id === selfId;
        const isAdminUser = user.role === 'ADMIN';
        const statusBadge = user.is_banned
          ? `<span class="admin-badge admin-badge-danger">${i18n.t('admin.badgeBanned')}</span>`
          : `<span class="admin-badge admin-badge-success">${i18n.t('admin.badgeActive')}</span>`;
        const roleCell = isAdminUser
          ? '<span class="admin-badge admin-badge-admin">ADMIN</span>'
          : user.role;

        let actionCell = '';
        if (!isAdminUser && !isSelf) {
          actionCell = user.is_banned
            ? `<button type="button" class="admin-action-btn text-dark" data-unban-id="${escapeHtml(user.id)}">${i18n.t('admin.unban')}</button>`
            : `<button type="button" class="admin-action-btn text-danger" data-ban-id="${escapeHtml(user.id)}">${i18n.t('admin.ban')}</button>`;
        }

        return `
          <tr>
            <td>${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${roleCell}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>${statusBadge}</td>
            <td>${actionCell}</td>
          </tr>
        `;
      })
      .join('');
  }

  async function fetchAndRenderUsers(page, keepAlert = false) {
    setUsersStatus(i18n.t('common.loading'));
    if (!keepAlert) usersAlert.hide();

    const params = new URLSearchParams({ page, limit: USERS_LIMIT });
    if (currentUsersKeyword) params.set('keyword', currentUsersKeyword);
    if (currentUsersBanned) params.set('banned', currentUsersBanned);

    try {
      const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        setUsersStatus('');
        usersAlert.show(i18n.apiMessage(body, 'admin.loadUsersFailed'));
        return;
      }

      currentUsersPage = page;

      if (body.data.users.length === 0) {
        usersTableBody.innerHTML = '';
        usersPaginationEl.innerHTML = '';
        usersPaginationInfoEl.textContent = i18n.t('admin.paginationInfo', { start: 0, end: 0, total: 0 });
        setUsersStatus(i18n.t('admin.noUsers'));
        return;
      }

      setUsersStatus('');
      renderUsersTable(body.data.users);
      const usersStart = (page - 1) * USERS_LIMIT + 1;
      const usersEnd = usersStart + body.data.users.length - 1;
      usersPaginationInfoEl.textContent = i18n.t('admin.paginationInfo', { start: usersStart, end: usersEnd, total: body.data.pagination.total });
      usersPaginationEl.innerHTML = buildPaginationHtml(page, body.data.pagination.total_pages);
    } catch (error) {
      setUsersStatus('');
      usersAlert.show(i18n.t('common.networkError'));
    }
  }

  usersSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentUsersKeyword = usersKeywordInput.value.trim();
    currentUsersBanned = usersBannedFilter.value;
    fetchAndRenderUsers(1);
  });

  usersTableBody.addEventListener('click', async (event) => {
    const banBtn = event.target.closest('button[data-ban-id]');
    const unbanBtn = event.target.closest('button[data-unban-id]');
    if (!banBtn && !unbanBtn) return;

    const id = banBtn ? banBtn.dataset.banId : unbanBtn.dataset.unbanId;
    const isBanAction = Boolean(banBtn);

    if (isBanAction && !window.confirm(i18n.t('admin.banConfirm'))) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${id}/${isBanAction ? 'ban' : 'unban'}`, {
        method: 'PATCH',
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        usersAlert.show(i18n.apiMessage(body, isBanAction ? 'admin.banFailed' : 'admin.unbanFailed'));
        return;
      }

      usersAlert.show(i18n.t(isBanAction ? 'admin.banned' : 'admin.unbanned'), 'success');
      await fetchAndRenderUsers(1, true);
    } catch (error) {
      usersAlert.show(i18n.t('common.networkError'));
    }
  });

  usersPaginationEl.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();

    const pageItem = link.closest('.page-item');
    if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

    fetchAndRenderUsers(Number(link.dataset.page));
  });

  // ---------- Shared photos management ----------
  const photosSearchForm = document.getElementById('photos-search-form');
  const photosKeywordInput = document.getElementById('photos-keyword-input');
  const photosCategoryFilter = document.getElementById('photos-category-filter');
  const photosStatusEl = document.getElementById('photos-status');
  const photosTableBody = document.getElementById('photos-table-body');
  const photosPaginationEl = document.getElementById('photos-pagination');
  const photosPaginationInfoEl = document.getElementById('photos-pagination-info');
  const exportDeletedPhotosBtn = document.getElementById('export-deleted-photos-btn');
  const photosAlert = makeAlert('photos');

  const PHOTOS_LIMIT = 10;
  let currentPhotosKeyword = '';
  let currentPhotosCategory = '';
  let currentPhotos = [];
  let currentPhotosPage = 1;

  function setPhotosStatus(text) {
    photosStatusEl.textContent = text;
  }

  async function loadCategoryFilter() {
    try {
      const response = await fetch('/api/v1/categories');
      const body = await response.json();
      if (!response.ok) return;

      photosCategoryFilter.innerHTML =
        `<option value="" data-i18n="admin.allCategories">${i18n.t('admin.allCategories')}</option>` +
        body.data.map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`).join('');
    } catch (error) {
      // 分類下拉選單載入失敗不影響主要列表功能
    }
  }

  function renderPhotosTable(photos) {
    photosTableBody.innerHTML = photos
      .map(
        (photo) => `
          <tr>
            <td>
              <img
                src="${escapeHtml(photo.image_url)}"
                alt="${escapeHtml(i18n.t('common.photoAlt', { name: photo.photographer_name }))}"
                data-photo-id="${escapeHtml(photo.id)}"
                class="lightbox-trigger"
                style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px;"
              />
            </td>
            <td>${(photo.categories || []).join(i18n.t('common.listSeparator'))}</td>
            <td>
              <a href="/user-shared-photos.html?userId=${escapeHtml(photo.user_id)}">${escapeHtml(photo.user_name)}</a>
            </td>
            <td>${formatDate(photo.created_at)}</td>
            <td>
              <button type="button" class="admin-action-btn text-danger" data-force-delete-id="${escapeHtml(photo.id)}">${i18n.t('admin.forceDelete')}</button>
            </td>
          </tr>
        `
      )
      .join('');
  }

  async function fetchAndRenderPhotos(page, keepAlert = false) {
    setPhotosStatus(i18n.t('common.loading'));
    if (!keepAlert) photosAlert.hide();

    const params = new URLSearchParams({ page, limit: PHOTOS_LIMIT });
    if (currentPhotosKeyword) params.set('q', currentPhotosKeyword);
    if (currentPhotosCategory) params.set('category', currentPhotosCategory);

    try {
      const response = await fetch(`/api/v1/shared-photos?${params.toString()}`);
      const body = await response.json();

      if (!response.ok) {
        setPhotosStatus('');
        photosAlert.show(i18n.apiMessage(body, 'admin.loadPhotosFailed'));
        return;
      }

      currentPhotosPage = page;

      if (body.data.length === 0) {
        photosTableBody.innerHTML = '';
        photosPaginationEl.innerHTML = '';
        photosPaginationInfoEl.textContent = i18n.t('admin.paginationInfo', { start: 0, end: 0, total: 0 });
        setPhotosStatus(i18n.t('common.noPhotoMatch'));
        return;
      }

      setPhotosStatus('');
      currentPhotos = body.data;
      renderPhotosTable(body.data);
      const photosStart = (page - 1) * PHOTOS_LIMIT + 1;
      const photosEnd = photosStart + body.data.length - 1;
      photosPaginationInfoEl.textContent = i18n.t('admin.paginationInfo', { start: photosStart, end: photosEnd, total: body.pagination.total });
      const totalPages = Math.ceil(body.pagination.total / body.pagination.limit);
      photosPaginationEl.innerHTML = buildPaginationHtml(page, totalPages);
    } catch (error) {
      setPhotosStatus('');
      photosAlert.show(i18n.t('common.networkError'));
    }
  }

  photosSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentPhotosKeyword = photosKeywordInput.value.trim();
    currentPhotosCategory = photosCategoryFilter.value;
    fetchAndRenderPhotos(1);
  });

  exportDeletedPhotosBtn.addEventListener('click', async () => {
    exportDeletedPhotosBtn.disabled = true;
    try {
      const response = await fetch('/api/v1/admin/deleted-shared-photos/export', {
        headers: window.auth.getAuthHeader()
      });

      if (!response.ok) {
        const body = await response.json();
        photosAlert.show(i18n.apiMessage(body, 'admin.exportFailed'));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deleted-shared-photos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      photosAlert.show(i18n.t('common.networkError'));
    } finally {
      exportDeletedPhotosBtn.disabled = false;
    }
  });

  photosTableBody.addEventListener('click', async (event) => {
    const img = event.target.closest('img[data-photo-id]');
    if (img) {
      const photo = currentPhotos.find((p) => p.id === img.dataset.photoId);
      if (!photo) return;

      window.openLightbox({
        imageUrl: photo.image_url,
        photographerName: photo.photographer_name,
        photographerUrl: photo.photographer_url,
        downloadUrl: photo.unsplash_page_url,
        categories: photo.categories,
        sharerId: photo.user_id,
        sharerName: photo.user_name
      });
      return;
    }

    const deleteBtn = event.target.closest('button[data-force-delete-id]');
    if (!deleteBtn) return;

    forceDeleteTargetId = deleteBtn.dataset.forceDeleteId;
    forceDeleteReasonInput.value = '';
    bootstrap.Modal.getOrCreateInstance(forceDeleteReasonModalEl).show();
  });

  const forceDeleteReasonModalEl = document.getElementById('forceDeleteReasonModal');
  const forceDeleteReasonForm = document.getElementById('force-delete-reason-form');
  const forceDeleteReasonInput = document.getElementById('force-delete-reason-input');
  let forceDeleteTargetId = null;

  forceDeleteReasonForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!forceDeleteTargetId) return;

    if (!window.confirm(i18n.t('admin.forceDeleteConfirm'))) return;

    try {
      const response = await fetch(`/api/v1/admin/shared-photos/${forceDeleteTargetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ reason: forceDeleteReasonInput.value.trim() })
      });
      const body = await response.json();

      if (!response.ok) {
        photosAlert.show(i18n.apiMessage(body, 'admin.forceDeleteFailed'));
        return;
      }

      bootstrap.Modal.getOrCreateInstance(forceDeleteReasonModalEl).hide();
      photosAlert.show(i18n.t('admin.forceDeleted'), 'success');
      await fetchAndRenderPhotos(1, true);
    } catch (error) {
      photosAlert.show(i18n.t('common.networkError'));
    }
  });

  forceDeleteReasonModalEl.addEventListener('hidden.bs.modal', () => {
    forceDeleteReasonForm.reset();
    forceDeleteTargetId = null;
  });

  photosPaginationEl.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();

    const pageItem = link.closest('.page-item');
    if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;

    fetchAndRenderPhotos(Number(link.dataset.page));
  });

  // ---------- Init ----------
  document.addEventListener('langchange', () => {
    fetchAndRenderUsers(currentUsersPage, true);
    fetchAndRenderPhotos(currentPhotosPage, true);
  });

  await fetchAndRenderUsers(1);
  await loadCategoryFilter();
  await fetchAndRenderPhotos(1);
})();
