(async function () {
  await window.partialsReady;

  const loginPane = document.getElementById('login-pane');
  const registerPane = document.getElementById('register-pane');
  const forgotPane = document.getElementById('forgot-pane');
  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');
  const showForgotLink = document.getElementById('show-forgot-link');
  const showLoginFromForgotLink = document.getElementById('show-login-from-forgot-link');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  const loginAlert = createAlert('login');
  const registerAlert = createAlert('register');
  const forgotAlert = createAlert('forgot');

  function showTab(tab) {
    loginPane.classList.toggle('d-none', tab !== 'login');
    registerPane.classList.toggle('d-none', tab !== 'register');
    forgotPane.classList.toggle('d-none', tab !== 'forgot');

    // 網址的 ?tab= 跟著目前顯示的畫面走（登入是預設，不帶參數），其他參數如 redirect 保留
    const url = new URL(window.location.href);
    if (tab === 'login') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url);
  }

  showRegisterLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('register');
  });
  showLoginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('login');
  });
  showForgotLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('forgot');
  });
  showLoginFromForgotLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('login');
  });

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab');
  showTab(initialTab === 'register' || initialTab === 'forgot' ? initialTab : 'login');

  // 使用中被停權會被導來這裡（見 auth.js）：用跟其他提示一致的卡片樣式說明原因
  if (params.get('reason') === 'banned') {
    loginAlert.show(i18n.t('error.ACCOUNT_BANNED'));
    // 重新整理時不要再顯示一次
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('reason');
    window.history.replaceState(null, '', cleanUrl);
  }

  // 登入後要回去的頁面：只接受站內路徑，避免被導去外部網站（open redirect）。
  // 不能只比對開頭字元：瀏覽器解析網址時會刪掉 Tab／換行（例如 "/\t/evil.com" 會變成 "//evil.com"），
  // 所以改用 URL 解析後比對 origin，並回傳解析後的路徑
  function getRedirectTarget() {
    const target = params.get('redirect');
    if (!target) return '/';

    try {
      const url = new URL(target, window.location.origin);
      if (url.origin !== window.location.origin) return '/';
      if (url.pathname.startsWith('/auth.html')) return '/';
      return url.pathname + url.search + url.hash;
    } catch (error) {
      return '/';
    }
  }

  // 瀏覽器原生驗證（必填、Email 格式）擋下送出時不會觸發 submit，上一次的提示會一直留著，
  // 和原生的氣泡訊息並存；invalid 事件不會冒泡，所以用 capture 在表單上接，把舊提示收掉
  [
    [loginForm, loginAlert],
    [registerForm, registerAlert],
    [forgotForm, forgotAlert]
  ].forEach(([form, alert]) => form.addEventListener('invalid', alert.hide, true));

  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) {
      loginAlert.show(i18n.t('auth.emailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      loginAlert.show(i18n.t('auth.invalidEmail'));
      return;
    }
    if (!password) {
      loginAlert.show(i18n.t('auth.passwordRequired'));
      return;
    }

    loginAlert.show(i18n.t('auth.loggingIn'), 'secondary');
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        loginAlert.show(i18n.apiMessage(body, 'auth.loginFailed'));
        return;
      }

      window.auth.setSession(body.data.token, body.data.user.name);
      window.location.href = getRedirectTarget();
    } catch (error) {
      loginAlert.show(i18n.t('common.networkError'));
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!name) {
      registerAlert.show(i18n.t('auth.nameRequired'));
      return;
    }
    if (/[<>]/.test(name)) {
      registerAlert.show(i18n.t('auth.nameInvalidChars'));
      return;
    }
    if (!email) {
      registerAlert.show(i18n.t('auth.emailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      registerAlert.show(i18n.t('auth.invalidEmail'));
      return;
    }
    if (!isValidPassword(password)) {
      registerAlert.show(i18n.t('password.rule'));
      return;
    }
    if (password !== confirmPassword) {
      registerAlert.show(i18n.t('auth.passwordMismatch'));
      return;
    }

    registerAlert.show(i18n.t('auth.registering'), 'secondary');
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirm_password: confirmPassword
        })
      });
      const body = await response.json();

      if (!response.ok) {
        registerAlert.show(i18n.apiMessage(body, 'auth.registerFailed'));
        return;
      }

      registerForm.reset();
      registerAlert.hide();
      showTab('login');
      loginAlert.show(i18n.t('auth.registerSuccess'), 'success');
    } catch (error) {
      registerAlert.show(i18n.t('common.networkError'));
    }
  });

  forgotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();

    if (!email) {
      forgotAlert.show(i18n.t('auth.emailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      forgotAlert.show(i18n.t('auth.invalidEmail'));
      return;
    }

    forgotAlert.show(i18n.t('auth.sending'), 'secondary');
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await response.json();

      if (!response.ok) {
        forgotAlert.show(i18n.apiMessage(body, 'auth.sendFailed'));
        return;
      }

      forgotForm.reset();
      forgotAlert.show(i18n.t('auth.resetEmailSent'), 'success');
    } catch (error) {
      forgotAlert.show(i18n.t('common.networkError'));
    }
  });
})();
