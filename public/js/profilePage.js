(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.auth.redirectToLogin();
    return;
  }

  const profileForm = document.getElementById('profile-form');
  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-name');
  const nameCountEl = document.getElementById('profile-name-count');
  const nameErrorEl = document.getElementById('profile-name-error');
  const { show: showAlert, hide: hideAlert } = createAlert('profile');

  function updateNameValidation() {
    const value = nameInput.value;
    nameCountEl.textContent = `${value.length}/50`;
    nameErrorEl.classList.toggle('d-none', value.trim().length > 0);
  }

  nameInput.addEventListener('input', updateNameValidation);

  // 原生驗證（required）擋下送出時不會觸發 submit，上一次的提示（例如「儲存成功」）會一直留著；
  // invalid 事件不會冒泡，所以用 capture 在表單上接
  profileForm.addEventListener('invalid', hideAlert, true);

  async function loadProfile() {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        showAlert(i18n.apiMessage(body, 'profile.loadFailed'));
        return;
      }

      emailInput.value = body.data.user.email;
      nameInput.value = body.data.user.name;
      updateNameValidation();
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    }
  }

  loadProfile();

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    // 空白時輸入框下方已經有「暱稱不可為空」，不要再跳一則重複的提示卡片
    if (!name) {
      hideAlert();
      updateNameValidation();
      nameInput.focus();
      return;
    }
    if (/[<>]/.test(name)) {
      showAlert(i18n.t('auth.nameInvalidChars'));
      return;
    }

    showAlert(i18n.t('profile.saving'), 'secondary');
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
        showAlert(i18n.apiMessage(body, 'profile.saveFailed'));
        return;
      }

      window.auth.setUserName(body.data.user.name);
      showAlert(i18n.t('profile.saved'), 'success');
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    }
  });

  const deleteAccountModalEl = document.getElementById('deleteAccountModal');
  const deleteAccountForm = document.getElementById('delete-account-form');
  const deleteAccountPasswordInput = document.getElementById('delete-account-password');
  const deleteAccountSubmitBtn = deleteAccountForm.querySelector('button[type="submit"]');
  const { show: showDeleteAccountAlert, hide: hideDeleteAccountAlert } =
    createAlert('delete-account');

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
      showDeleteAccountAlert(i18n.t('profile.enterPassword'));
      return;
    }

    if (!window.confirm(i18n.t('profile.deleteConfirm'))) return;

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
        showDeleteAccountAlert(i18n.apiMessage(body, 'profile.deleteFailed'));
        isDeletingAccount = false;
        deleteAccountSubmitBtn.disabled = false;
        return;
      }

      window.auth.clearSession();
      showDeleteAccountAlert(i18n.t('profile.deleted'), 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      showDeleteAccountAlert(i18n.t('common.networkError'));
      isDeletingAccount = false;
      deleteAccountSubmitBtn.disabled = false;
    }
  });
})();
