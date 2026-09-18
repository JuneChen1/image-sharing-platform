(function () {
  const TOKEN_KEY = 'picshare_token';
  const USER_NAME_KEY = 'picshare_user_name';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUserName() {
    return localStorage.getItem(USER_NAME_KEY);
  }

  function getUserId() {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json).id;
    } catch (error) {
      return null;
    }
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function setSession(token, userName) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_NAME_KEY, userName);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
  }

  function getAuthHeader() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  window.auth = {
    getToken,
    getUserName,
    getUserId,
    isLoggedIn,
    setSession,
    clearSession,
    getAuthHeader
  };

  (async function init() {
    await window.partialsReady;

    const guestEl = document.getElementById('auth-guest');
    const userEl = document.getElementById('auth-user');
    const userNameEl = document.getElementById('auth-user-name');
    const shareBtn = document.getElementById('share-btn');
    const searchLink = document.getElementById('search-link');
    const logoutBtn = document.getElementById('logout-btn');
    const mySharedPhotosLink = document.getElementById('my-shared-photos-link');

    function renderAuthUI() {
      const loggedIn = isLoggedIn();
      const onAuthPage = window.location.pathname === '/auth.html';
      guestEl.classList.toggle('d-none', loggedIn || onAuthPage);
      userEl.classList.toggle('d-none', !loggedIn);
      shareBtn.classList.toggle('d-none', !loggedIn);
      searchLink.classList.toggle('d-none', onAuthPage);
      if (loggedIn) {
        userNameEl.textContent = getUserName();
        mySharedPhotosLink.href = `/user-shared-photos.html?userId=${getUserId()}`;
      }
    }

    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/v1/auth/logout', { method: 'POST' });
      } catch (error) {
        // 登出時網路失敗不影響前端清除 session
      }
      clearSession();
      renderAuthUI();
      if (window.location.pathname === '/auth.html') {
        window.location.href = '/';
      }
    });

    renderAuthUI();
  })();
})();
