(function () {
  const TOKEN_KEY = 'picshare_token';
  const USER_NAME_KEY = 'picshare_user_name';
  // 登出後不該再停留的頁面
  const LOGIN_REQUIRED_PAGES = [
    '/auth.html',
    '/collections.html',
    '/profile.html',
    '/change-password.html',
    '/admin.html'
  ];

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUserName() {
    return localStorage.getItem(USER_NAME_KEY);
  }

  function decodeTokenPayload() {
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
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  function getUserId() {
    return decodeTokenPayload()?.id ?? null;
  }

  function getUserRole() {
    return decodeTokenPayload()?.role ?? null;
  }

  function isAdmin() {
    return getUserRole() === 'ADMIN';
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

  // 被停權的用戶：後端對每個需要登入的請求都回 403 ACCOUNT_BANNED。
  // 在這裡統一攔截 fetch：清掉 session、導去登入頁並顯示停權訊息，各頁就不必各自處理。
  // 沒登入時的 403（例如停權帳號直接在登入頁登入）不攔截，照原本由登入頁顯示錯誤。
  let handlingBan = false;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (response.status !== 403 || !isLoggedIn()) return response;

    let code = null;
    try {
      code = (await response.clone().json()).code;
    } catch (error) {
      // 不是 JSON 就不是停權回應，照常回傳
    }
    if (code !== 'ACCOUNT_BANNED') return response;

    if (!handlingBan) {
      handlingBan = true;
      clearSession();
      window.location.replace('/auth.html?reason=banned');
    }
    // 頁面即將離開，讓呼叫端不要繼續往下跑，避免在跳轉前閃出舊的錯誤畫面
    return new Promise(() => {});
  };

  // 導向登入頁，並記下目前的位置，登入成功後再回來
  function redirectToLogin() {
    const back = window.location.pathname + window.location.search;
    window.location.href = `/auth.html?redirect=${encodeURIComponent(back)}`;
  }

  window.auth = {
    getToken,
    getUserName,
    getUserId,
    getUserRole,
    isAdmin,
    isLoggedIn,
    setSession,
    clearSession,
    redirectToLogin,
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
    const adminPanelLink = document.getElementById('admin-panel-link');
    const langSwitchNav = document.getElementById('lang-switch-nav');

    function renderAuthUI() {
      const loggedIn = isLoggedIn();
      const onAuthPage = window.location.pathname === '/auth.html';
      const onSearchPage = window.location.pathname === '/search.html';
      guestEl.classList.toggle('d-none', loggedIn || onAuthPage);
      userEl.classList.toggle('d-none', !loggedIn);
      shareBtn.classList.toggle('d-none', !loggedIn);
      searchLink.classList.toggle('d-none', onAuthPage || onSearchPage);
      adminPanelLink.classList.toggle('d-none', !loggedIn || !isAdmin());
      langSwitchNav.classList.toggle('d-none', loggedIn);
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
      if (LOGIN_REQUIRED_PAGES.includes(window.location.pathname)) {
        window.location.href = '/';
        return;
      }
      document.dispatchEvent(new CustomEvent('authchange'));
    });

    renderAuthUI();
  })();
})();
