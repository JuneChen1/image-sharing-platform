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

  const ALERT_ICON_PATHS = {
    success:
      '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
    danger:
      '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
  };

  function makeAlert(prefix) {
    const el = document.getElementById(`${prefix}-alert`);
    const iconEl = document.getElementById(`${prefix}-alert-icon`);
    const messageEl = document.getElementById(`${prefix}-alert-message`);

    function hide() {
      el.classList.add('d-none');
    }

    el.querySelector('.btn-close').addEventListener('click', hide);

    return {
      show(message, type = 'danger') {
        iconEl.innerHTML = ALERT_ICON_PATHS[type] || '';
        messageEl.textContent = message;
        el.className = `alert alert-dismissible d-flex align-items-center mb-3 alert-${type}`;
      },
      hide
    };
  }

  const loginAlert = makeAlert('login');
  const registerAlert = makeAlert('register');
  const forgotAlert = makeAlert('forgot');

  function showTab(tab) {
    loginPane.classList.toggle('d-none', tab !== 'login');
    registerPane.classList.toggle('d-none', tab !== 'register');
    forgotPane.classList.toggle('d-none', tab !== 'forgot');
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

  function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  function isValidPassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!isValidEmail(email)) {
      loginAlert.show('Email 格式不正確');
      return;
    }
    if (!password) {
      loginAlert.show('密碼為必填');
      return;
    }

    loginAlert.show('登入中...', 'secondary');
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        loginAlert.show(body.message || '登入失敗');
        return;
      }

      window.auth.setSession(body.data.token, body.data.user.name);
      window.location.href = '/';
    } catch (error) {
      loginAlert.show('連線錯誤，請確認伺服器是否啟動');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name) {
      registerAlert.show('暱稱為必填');
      return;
    }
    if (!isValidEmail(email)) {
      registerAlert.show('Email 格式不正確');
      return;
    }
    if (!isValidPassword(password)) {
      registerAlert.show('密碼至少 8 碼，需同時包含英文字母與數字');
      return;
    }

    registerAlert.show('註冊中...', 'secondary');
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        registerAlert.show(body.message || '註冊失敗');
        return;
      }

      registerForm.reset();
      registerAlert.hide();
      showTab('login');
      loginAlert.show('註冊成功', 'success');
    } catch (error) {
      registerAlert.show('連線錯誤，請確認伺服器是否啟動');
    }
  });

  forgotForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();

    if (!isValidEmail(email)) {
      forgotAlert.show('Email 格式不正確');
      return;
    }

    forgotAlert.show('寄送中...', 'secondary');
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const body = await response.json();

      if (!response.ok) {
        forgotAlert.show(body.message || '寄送失敗，請稍後再試');
        return;
      }

      forgotForm.reset();
      forgotAlert.show(body.message, 'success');
    } catch (error) {
      forgotAlert.show('連線錯誤，請確認伺服器是否啟動');
    }
  });
})();
