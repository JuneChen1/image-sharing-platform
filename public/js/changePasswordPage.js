(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.auth.redirectToLogin();
    return;
  }

  const changePasswordForm = document.getElementById('change-password-form');
  const oldPasswordInput = document.getElementById('old-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const { show: showAlert } = createAlert('change-password');

  changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!oldPassword) {
      showAlert(i18n.t('changePassword.needOld'));
      return;
    }
    if (!isValidPassword(newPassword)) {
      showAlert(i18n.t('password.newRule'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert(i18n.t('password.mismatch'));
      return;
    }

    showAlert(i18n.t('changePassword.updating'), 'secondary');
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
        showAlert(i18n.apiMessage(body, 'changePassword.updateFailed'));
        return;
      }

      // 改密碼後舊 token 已失效，換成後端回傳的新 token，目前這個裝置才不會被登出
      if (body.data?.token) {
        window.auth.setSession(body.data.token, window.auth.getUserName());
      }

      changePasswordForm.reset();
      showAlert(i18n.t('changePassword.updateSuccess'), 'success');
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    }
  });
})();
