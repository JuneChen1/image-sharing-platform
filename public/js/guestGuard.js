// 登入／註冊頁在 <head> 最前面引入：已經登入就在畫面繪出前直接導回首頁，
// 不會先閃出登入與註冊表單。用 replace，按上一頁才不會又被彈回這裡。
// 登入成功後的導向、被停權或 401 時（都已先清掉 session）的流程不受影響。
(function () {
  // 與 auth.js 的 TOKEN_KEY 一致
  if (!localStorage.getItem('picshare_token')) return;

  window.location.replace('/');
})();
