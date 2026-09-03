(async function () {
  await window.partialsReady;

  const loginPane = document.getElementById('login-pane');
  const registerPane = document.getElementById('register-pane');
  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');
  const loginForm = document.getElementById('login-form');
  const loginStatusEl = document.getElementById('login-status');
  const registerForm = document.getElementById('register-form');
  const registerStatusEl = document.getElementById('register-status');

  function setFormStatus(el, text, isError) {
    el.textContent = text;
    el.classList.toggle('text-danger', isError);
    el.classList.toggle('fw-bold', isError);
    el.classList.toggle('text-muted', !isError);
  }

  function showTab(tab) {
    const isRegister = tab === 'register';
    loginPane.classList.toggle('d-none', isRegister);
    registerPane.classList.toggle('d-none', !isRegister);
  }

  showRegisterLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('register');
  });
  showLoginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showTab('login');
  });

  const params = new URLSearchParams(window.location.search);
  showTab(params.get('tab') === 'register' ? 'register' : 'login');

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
      setFormStatus(loginStatusEl, 'Email 格式不正確', true);
      return;
    }
    if (!password) {
      setFormStatus(loginStatusEl, '密碼為必填', true);
      return;
    }

    setFormStatus(loginStatusEl, '登入中...', false);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        setFormStatus(loginStatusEl, body.message || '登入失敗', true);
        return;
      }

      window.auth.setSession(body.data.token, body.data.user.name);
      window.location.href = '/';
    } catch (error) {
      setFormStatus(loginStatusEl, '連線錯誤，請確認伺服器是否啟動', true);
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name) {
      setFormStatus(registerStatusEl, '暱稱為必填', true);
      return;
    }
    if (!isValidEmail(email)) {
      setFormStatus(registerStatusEl, 'Email 格式不正確', true);
      return;
    }
    if (!isValidPassword(password)) {
      setFormStatus(registerStatusEl, '密碼至少 8 碼，需同時包含英文字母與數字', true);
      return;
    }

    setFormStatus(registerStatusEl, '註冊中...', false);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const body = await response.json();

      if (!response.ok) {
        setFormStatus(registerStatusEl, body.message || '註冊失敗', true);
        return;
      }

      registerForm.reset();
      setFormStatus(registerStatusEl, '', false);
      showTab('login');
      setFormStatus(loginStatusEl, '註冊成功，請登入', false);
    } catch (error) {
      setFormStatus(registerStatusEl, '連線錯誤，請確認伺服器是否啟動', true);
    }
  });
})();
