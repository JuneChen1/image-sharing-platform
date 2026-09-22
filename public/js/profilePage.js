(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }

  const profileForm = document.getElementById('profile-form');
  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-name');
  const alertEl = document.getElementById('profile-alert');
  const alertIconEl = document.getElementById('profile-alert-icon');
  const alertMessageEl = document.getElementById('profile-alert-message');

  const ALERT_ICON_PATHS = {
    success:
      '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
    danger:
      '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
  };

  function showAlert(message, type = 'danger') {
    alertIconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
    alertMessageEl.textContent = message;
    alertEl.className = `alert alert-dismissible d-flex align-items-center mb-3 alert-${type}`;
  }

  function hideAlert() {
    alertEl.classList.add('d-none');
  }

  alertEl.querySelector('.btn-close').addEventListener('click', hideAlert);

  async function loadProfile() {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        showAlert(body.message || '載入個人資料失敗');
        return;
      }

      emailInput.value = body.data.user.email;
      nameInput.value = body.data.user.name;
    } catch (error) {
      showAlert('連線錯誤，請確認伺服器是否啟動');
    }
  }

  loadProfile();

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (!name) {
      showAlert('暱稱為必填');
      return;
    }

    showAlert('儲存中...', 'secondary');
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ name })
      });
      const body = await response.json();

      if (!response.ok) {
        showAlert(body.message || '儲存失敗，請稍後再試');
        return;
      }

      window.auth.setSession(window.auth.getToken(), body.data.user.name);
      showAlert('儲存成功', 'success');
    } catch (error) {
      showAlert('連線錯誤，請確認伺服器是否啟動');
    }
  });

  const deleteAccountModalEl = document.getElementById('deleteAccountModal');
  const deleteAccountForm = document.getElementById('delete-account-form');
  const deleteAccountPasswordInput = document.getElementById('delete-account-password');
  const deleteAccountAlertEl = document.getElementById('delete-account-alert');
  const deleteAccountAlertIconEl = document.getElementById('delete-account-alert-icon');
  const deleteAccountAlertMessageEl = document.getElementById('delete-account-alert-message');
  const deleteAccountSubmitBtn = deleteAccountForm.querySelector('button[type="submit"]');

  function showDeleteAccountAlert(message, type = 'danger') {
    deleteAccountAlertIconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
    deleteAccountAlertMessageEl.textContent = message;
    deleteAccountAlertEl.className = `alert alert-dismissible d-flex align-items-center mb-3 alert-${type}`;
  }

  function hideDeleteAccountAlert() {
    deleteAccountAlertEl.classList.add('d-none');
  }

  deleteAccountAlertEl.querySelector('.btn-close').addEventListener('click', hideDeleteAccountAlert);

  deleteAccountModalEl.addEventListener('hidden.bs.modal', () => {
    deleteAccountForm.reset();
    hideDeleteAccountAlert();
  });

  let isDeletingAccount = false;

  deleteAccountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isDeletingAccount) return;

    const password = deleteAccountPasswordInput.value;
    if (!password) {
      showDeleteAccountAlert('請輸入密碼');
      return;
    }

    if (
      !window.confirm(
        '確定要刪除帳號嗎？此動作無法復原，所有分享、收藏庫、收藏紀錄都會被永久刪除。'
      )
    )
      return;

    isDeletingAccount = true;
    deleteAccountSubmitBtn.disabled = true;
    hideDeleteAccountAlert();
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ password })
      });
      const body = await response.json();

      if (!response.ok) {
        showDeleteAccountAlert(body.message || '刪除失敗，請稍後再試');
        isDeletingAccount = false;
        deleteAccountSubmitBtn.disabled = false;
        return;
      }

      window.auth.clearSession();
      showDeleteAccountAlert('帳號已刪除，即將導向首頁...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      showDeleteAccountAlert('連線錯誤，請確認伺服器是否啟動');
      isDeletingAccount = false;
      deleteAccountSubmitBtn.disabled = false;
    }
  });
})();
