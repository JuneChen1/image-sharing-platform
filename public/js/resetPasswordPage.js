(async function () {
  await window.partialsReady;

  const resetForm = document.getElementById('reset-form');
  const resetSubmitBtn = document.getElementById('reset-submit-btn');
  const newPasswordInput = document.getElementById('reset-new-password');
  const confirmPasswordInput = document.getElementById('reset-confirm-password');
  const { show: showAlert } = createAlert('reset');

  const token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    showAlert(i18n.t('resetPassword.invalidLink'));
    newPasswordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    resetSubmitBtn.disabled = true;
    return;
  }

  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!isValidPassword(newPassword)) {
      showAlert(i18n.t('password.rule'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert(i18n.t('password.mismatch'));
      return;
    }

    showAlert(i18n.t('resetPassword.resetting'), 'secondary');
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const body = await response.json();

      if (!response.ok) {
        showAlert(i18n.apiMessage(body, 'resetPassword.resetFailed'));
        return;
      }

      resetForm.reset();
      resetSubmitBtn.disabled = true;
      showAlert(i18n.t('resetPassword.successRedirect'), 'success');
      setTimeout(() => {
        window.location.href = '/auth.html';
      }, 2000);
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    }
  });
})();
