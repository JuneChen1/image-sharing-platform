(async function () {
  await window.partialsReady;

  const form = document.getElementById('nav-search-form');
  const input = document.getElementById('nav-search-input');
  const modalEl = document.getElementById('searchModal');
  const navSearchBtn = document.getElementById('nav-search-btn');

  if (window.location.pathname === '/search.html') {
    navSearchBtn.disabled = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
  });
})();
