// 載入 data-include 指定的共用片段（導覽列、頁尾等）。
// 所有頁面腳本都在 await partialsReady，所以這裡一律不 reject：
// 片段載入失敗時只在原位置顯示提示，其餘腳本照常執行，不會整頁沒反應
window.partialsReady = (async function loadPartials() {
  const nodes = document.querySelectorAll('[data-include]');
  await Promise.all(
    Array.from(nodes).map(async (node) => {
      try {
        const response = await fetch(node.dataset.include);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        node.outerHTML = await response.text();
      } catch (error) {
        console.error(`載入 ${node.dataset.include} 失敗：`, error);
        const notice = document.createElement('div');
        notice.className = 'alert alert-danger m-2';
        notice.setAttribute('role', 'alert');
        notice.dataset.i18n = 'common.partialLoadFailed';
        node.replaceWith(notice);
      }
    })
  );
  i18n.applyI18n();
  i18n.renderLangControls();
})();
