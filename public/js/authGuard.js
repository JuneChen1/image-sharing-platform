// 需要登入的頁面在 <head> 最前面引入：沒登入就在畫面繪出前直接導去登入頁，
// 不會先閃出目標頁的標題與骨架。用 replace，按上一頁才不會被卡回受保護頁。
// token 過期或被後端回 401 的情況，仍由各頁與 auth.js 原本的流程處理。
(function () {
  // 與 auth.js 的 TOKEN_KEY 一致
  if (localStorage.getItem('picshare_token')) return;

  const back = window.location.pathname + window.location.search;
  window.location.replace(`/auth.html?redirect=${encodeURIComponent(back)}`);
})();
