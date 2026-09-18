(async function () {
  await window.partialsReady;

  const resetForm = document.getElementById('reset-form');
  const resetStatusEl = document.getElementById('reset-status');
  const resetSubmitBtn = document.getElementById('reset-submit-btn');
  const newPasswordInput = document.getElementById('reset-new-password');
  const confirmPasswordInput = document.getElementById('reset-confirm-password');

  function setFormStatus(text, isError) {
    resetStatusEl.textContent = text;
    resetStatusEl.classList.toggle('text-danger', isError);
    resetStatusEl.classList.toggle('fw-bold', isError);
    resetStatusEl.classList.toggle('text-muted', !isError);
  }

  function isValidPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  }

  const token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    setFormStatus('連結無效，請重新申請忘記密碼', true);
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
      setFormStatus('密碼至少 8 碼，需同時包含英文字母與數字', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormStatus('兩次輸入的新密碼不一致', true);
      return;
    }

    setFormStatus('重設中...', false);
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
        setFormStatus(body.message || '重設失敗，請重新申請忘記密碼', true);
        return;
      }

      resetForm.reset();
      resetSubmitBtn.disabled = true;
      setFormStatus(`${body.message}，即將導向登入頁...`, false);
      setTimeout(() => {
        window.location.href = '/auth.html';
      }, 2000);
    } catch (error) {
      setFormStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  });
})();
