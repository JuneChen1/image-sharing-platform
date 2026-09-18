(async function () {
  await window.partialsReady;

  if (!window.auth.isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }

  const profileForm = document.getElementById('profile-form');
  const emailInput = document.getElementById('profile-email');
  const nameInput = document.getElementById('profile-name');
  const statusEl = document.getElementById('profile-status');

  function setFormStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle('text-danger', isError);
    statusEl.classList.toggle('fw-bold', isError);
    statusEl.classList.toggle('text-muted', !isError);
  }

  async function loadProfile() {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: window.auth.getAuthHeader()
      });
      const body = await response.json();

      if (!response.ok) {
        setFormStatus(body.message || '載入個人資料失敗', true);
        return;
      }

      emailInput.value = body.data.user.email;
      nameInput.value = body.data.user.name;
    } catch (error) {
      setFormStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  }

  loadProfile();

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();

    if (!name) {
      setFormStatus('暱稱為必填', true);
      return;
    }

    setFormStatus('儲存中...', false);
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
        setFormStatus(body.message || '儲存失敗，請稍後再試', true);
        return;
      }

      window.auth.setSession(window.auth.getToken(), body.data.user.name);
      setFormStatus('儲存成功', false);
    } catch (error) {
      setFormStatus('連線錯誤，請確認伺服器是否啟動', true);
    }
  });
})();
