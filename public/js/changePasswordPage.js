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
  const statusEl = document.getElementById('change-password-status');

  function setFormStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
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
      setFormStatus('請輸入舊密碼', true);
      return;
    }
    if (!isValidPassword(newPassword)) {
      setFormStatus('新密碼至少 8 碼，需同時包含英文字母與數字', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormStatus('兩次輸入的新密碼不一致', true);
      return;
    }

    setFormStatus('更新中...', false);
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
        setFormStatus(body.message || '更新失敗，請稍後再試', true);
        return;
      }

      changePasswordForm.reset();
      setFormStatus(body.message, false);
    } catch (error) {
      setFormStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  });
})();
