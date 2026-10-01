// 組 HTML 字串（innerHTML / insertAdjacentHTML）時，凡是來自使用者或外部 API 的值都要先跳脫。
// 同時適用於文字節點與屬性值（含 " 與 '）。
const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
