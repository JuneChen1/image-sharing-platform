// 各頁共用的小工具。和 escapeHtml.js 一樣用 <script> 載入，定義成全域函式；
// 載入時不執行任何東西，所以放在 i18n.js 前後都可以（用到 i18n 的函式是被呼叫時才讀）。

const ALERT_ICON_PATHS = {
  success:
    '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>',
  danger:
    '<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>'
};

// 提示卡片（icon + 彩色卡片）。標記需要有 #<prefix>-alert、#<prefix>-alert-icon、
// #<prefix>-alert-message，以及卡片裡的 .btn-close。
// 間距可由標記上的 data-alert-spacing 指定（例如放在送出鈕上方的提示要 mb-0），沒有就用 defaultSpacing
function createAlert(prefix, defaultSpacing = 'mb-3') {
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
      el.className = `alert alert-dismissible d-flex align-items-center ${el.dataset.alertSpacing || defaultSpacing} alert-${type}`;
    },
    hide
  };
}

// 要和後端 utils/validUtils.js 的 isValidPassword 規則一致（後端另外限制最長 72 bytes）
function isValidPassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// 分頁按鈕（含上一頁／下一頁）的 HTML，最多顯示 5 個頁碼；總頁數小於 1 時回傳空字串
function buildPaginationHtml(currentPage, totalPages) {
  if (totalPages < 1) return '';

  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pageItems = [];
  for (let page = start; page <= end; page++) {
    pageItems.push(`
        <li class="page-item ${page === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${page}</a>
        </li>
      `);
  }

  return `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="${i18n.t('common.previous')}">
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>
      ${pageItems.join('')}
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="${i18n.t('common.next')}">
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
    `;
}

// 瀑布流的欄數。搜尋頁的卡片比較小，寬螢幕（>= 992px）多一欄
function getMasonryColumnCount({ wide = false } = {}) {
  if (wide && window.innerWidth >= 992) return 5;
  if (window.innerWidth >= 768) return 4;
  if (window.innerWidth >= 576) return 2;
  return 1;
}

// 瀑布流：依預估高度（寬度依圖片比例換算，再加上卡片文字區高度）把每張卡片放進目前最矮的欄位。
// renderCard(photo) 回傳單張卡片的 HTML；photo 需要有 width、height
function renderMasonryColumns(container, photos, { columnCount, cardTextHeight, renderCard }) {
  const columnWidth = container.clientWidth / columnCount;
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    photos: []
  }));

  photos.forEach((photo) => {
    const estimatedHeight =
      (columnWidth * photo.height) / photo.width + cardTextHeight;
    const shortestColumn = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest
    );
    shortestColumn.photos.push(photo);
    shortestColumn.height += estimatedHeight;
  });

  container.innerHTML = columns
    .map(
      (column) =>
        `<div class="masonry-column">${column.photos.map(renderCard).join('')}</div>`
    )
    .join('');
}

// 先載入圖片取得實際寬高（瀑布流要用）；載入失敗就用 4:3 當預設
function withDimensions(photo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ ...photo, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ ...photo, width: 4, height: 3 });
    img.src = photo.image_url;
  });
}
