(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.location.href = '/auth.html';
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

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-Hant', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

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
    tabUsersBtn.classList.toggle('active', tab === 'users');
    tabPhotosBtn.classList.toggle('active', tab === 'photos');
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
  const usersAlert = makeAlert('users');

  const USERS_LIMIT = 20;
  let currentUsersKeyword = '';
  let currentUsersBanned = '';

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
          ? '<span class="badge text-bg-danger">已停權</span>'
          : '<span class="badge text-bg-success">正常</span>';

        let actionCell = '<span class="text-muted">-</span>';
        if (!isAdminUser && !isSelf) {
          actionCell = user.is_banned
            ? `<button type="button" class="btn btn-sm btn-outline-dark" data-unban-id="${user.id}">解除停權</button>`
            : `<button type="button" class="btn btn-sm btn-outline-danger" data-ban-id="${user.id}">停權</button>`;
        }

        return `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>${statusBadge}</td>
            <td>${actionCell}</td>
          </tr>
        `;
      })
      .join('');
  }

  async function fetchAndRenderUsers(page, keepAlert = false) {
    setUsersStatus('載入中...');
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
        usersAlert.show(body.message || '載入使用者失敗');
        return;
      }

      if (body.data.users.length === 0) {
        usersTableBody.innerHTML = '';
        usersPaginationEl.innerHTML = '';
        setUsersStatus('找不到符合條件的使用者');
        return;
      }

      setUsersStatus('');
      renderUsersTable(body.data.users);
      usersPaginationEl.innerHTML = buildPaginationHtml(page, body.data.pagination.total_pages);
    } catch (error) {
      setUsersStatus('');
      usersAlert.show('連線錯誤，請確認伺服器是否啟動');
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

    if (isBanAction && !window.confirm('確定要停權這位使用者嗎？停權後對方將無法登入使用本站。')) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${id}/${isBanAction ? 'ban' : 'unban'}`, {
        method: 'PATCH',
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        usersAlert.show(body.message || (isBanAction ? '停權失敗' : '解除停權失敗'));
        return;
      }

      usersAlert.show(isBanAction ? '已停權該使用者' : '已解除停權', 'success');
      await fetchAndRenderUsers(1, true);
    } catch (error) {
      usersAlert.show('連線錯誤，請確認伺服器是否啟動');
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
  const photosAlert = makeAlert('photos');

  const PHOTOS_LIMIT = 20;
  let currentPhotosKeyword = '';
  let currentPhotosCategory = '';

  function setPhotosStatus(text) {
    photosStatusEl.textContent = text;
  }

  async function loadCategoryFilter() {
    try {
      const response = await fetch('/api/v1/categories');
      const body = await response.json();
      if (!response.ok) return;

      photosCategoryFilter.innerHTML =
        '<option value="">全部分類</option>' +
        body.data.map((category) => `<option value="${category.name}">${category.name}</option>`).join('');
    } catch (error) {
      // 分類下拉選單載入失敗不影響主要列表功能
    }
  }

  function renderPhotosTable(photos) {
    photosTableBody.innerHTML = photos
      .map(
        (photo) => `
          <tr>
            <td><img src="${photo.image_url}" alt="" style="width: 64px; height: 64px; object-fit: cover; border-radius: 4px;" /></td>
            <td>
              <a href="${photo.photographer_url}" target="_blank" rel="noopener">${photo.photographer_name}</a>
            </td>
            <td>${(photo.categories || []).join('、')}</td>
            <td>
              <a href="/user-shared-photos.html?userId=${photo.user_id}">${photo.user_name}</a>
            </td>
            <td>${formatDate(photo.created_at)}</td>
            <td>
              <button type="button" class="btn btn-sm btn-outline-danger" data-force-delete-id="${photo.id}">強制刪除</button>
            </td>
          </tr>
        `
      )
      .join('');
  }

  async function fetchAndRenderPhotos(page, keepAlert = false) {
    setPhotosStatus('載入中...');
    if (!keepAlert) photosAlert.hide();

    const params = new URLSearchParams({ page, limit: PHOTOS_LIMIT });
    if (currentPhotosKeyword) params.set('q', currentPhotosKeyword);
    if (currentPhotosCategory) params.set('category', currentPhotosCategory);

    try {
      const response = await fetch(`/api/v1/shared-photos?${params.toString()}`);
      const body = await response.json();

      if (!response.ok) {
        setPhotosStatus('');
        photosAlert.show(body.message || '載入照片失敗');
        return;
      }

      if (body.data.length === 0) {
        photosTableBody.innerHTML = '';
        photosPaginationEl.innerHTML = '';
        setPhotosStatus('找不到符合條件的照片');
        return;
      }

      setPhotosStatus('');
      renderPhotosTable(body.data);
      const totalPages = Math.ceil(body.pagination.total / body.pagination.limit);
      photosPaginationEl.innerHTML = buildPaginationHtml(page, totalPages);
    } catch (error) {
      setPhotosStatus('');
      photosAlert.show('連線錯誤，請確認伺服器是否啟動');
    }
  }

  photosSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentPhotosKeyword = photosKeywordInput.value.trim();
    currentPhotosCategory = photosCategoryFilter.value;
    fetchAndRenderPhotos(1);
  });

  photosTableBody.addEventListener('click', async (event) => {
    const deleteBtn = event.target.closest('button[data-force-delete-id]');
    if (!deleteBtn) return;

    if (!window.confirm('確定要強制刪除這張照片嗎？此動作無法復原，將一併移除相關的分類與收藏紀錄。')) return;

    try {
      const response = await fetch(`/api/v1/admin/shared-photos/${deleteBtn.dataset.forceDeleteId}`, {
        method: 'DELETE',
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        photosAlert.show(body.message || '強制刪除失敗');
        return;
      }

      photosAlert.show('已強制刪除該照片', 'success');
      await fetchAndRenderPhotos(1, true);
    } catch (error) {
      photosAlert.show('連線錯誤，請確認伺服器是否啟動');
    }
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
  await fetchAndRenderUsers(1);
  await loadCategoryFilter();
  await fetchAndRenderPhotos(1);
})();
