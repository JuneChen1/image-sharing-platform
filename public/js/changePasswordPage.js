(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }

  const changePasswordForm = document.getElementById('change-password-form');
  const oldPasswordInput = document.getElementById('old-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const alertEl = document.getElementById('change-password-alert');
  const alertIconEl = document.getElementById('change-password-alert-icon');
  const alertMessageEl = document.getElementById('change-password-alert-message');

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

  function isValidPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  }

  changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!oldPassword) {
      showAlert('請輸入舊密碼');
      return;
    }
    if (!isValidPassword(newPassword)) {
      showAlert('新密碼至少 8 碼，需同時包含英文字母與數字');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('兩次輸入的新密碼不一致');
      return;
    }

    showAlert('更新中...', 'secondary');
    try {
      const response = await fetch('/api/v1/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const body = await response.json();

      if (!response.ok) {
        showAlert(body.message || '更新失敗，請稍後再試');
        return;
      }

      changePasswordForm.reset();
      showAlert(body.message, 'success');
    } catch (error) {
      showAlert('連線錯誤，請確認伺服器是否啟動');
    }
  });
})();
