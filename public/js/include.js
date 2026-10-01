window.partialsReady = (async function loadPartials() {
  const nodes = document.querySelectorAll('[data-include]');
  await Promise.all(
    Array.from(nodes).map(async (node) => {
      const response = await fetch(node.dataset.include);
      node.outerHTML = await response.text();
    })
  );
  i18n.applyI18n();
  i18n.renderLangControls();
})();
