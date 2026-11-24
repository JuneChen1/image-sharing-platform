(async function () {
  await window.partialsReady;

  const shareForm = document.getElementById('share-form');
  const shareInput = document.getElementById('share-input');
  const shareModalEl = document.getElementById('shareModal');
  const shareSubmitBtn = document.getElementById('share-submit-btn');
  const categoryInput = document.getElementById('category-input');
  const categoryAddBtn = document.getElementById('category-add-btn');
  const categoryListEl = document.getElementById('category-list');

  // 上傳圖片的欄位
  const modeTabsEl = document.getElementById('share-mode-tabs');
  const uploadFieldsEl = document.getElementById('share-upload-fields');
  const unsplashFieldsEl = document.getElementById('share-unsplash-fields');
  const fileInput = document.getElementById('share-file');
  const dropzoneEl = document.getElementById('share-dropzone');
  const dropHintEl = document.getElementById('share-drop-hint');
  const dropActiveEl = document.getElementById('share-drop-active');
  const selectedEl = document.getElementById('share-selected');
  const fileNameEl = document.getElementById('share-file-name');
  const removeFileBtn = document.getElementById('share-remove-file');
  const previewEl = document.getElementById('share-preview');
  const originalCheckbox = document.getElementById('share-original');
  const originUrlInput = document.getElementById('share-origin-url');
  const originLabelRequiredEl = document.getElementById('origin-label-required');
  const originLabelOptionalEl = document.getElementById('origin-label-optional');
  const declarationEl = document.getElementById('share-declaration');
  const noteInput = document.getElementById('share-note');

  // 要和後端 config/constants.js 一致：單檔上限、備註長度、出處連結長度；格式要和 utils/imageUtils.js 的白名單一致
  const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
  const UPLOAD_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const NOTE_MAX_LENGTH = 500;
  const ORIGIN_URL_MAX_LENGTH = 2048;
  // 要和 config/constants.js 的 categoryMaxCount 一致
  const CATEGORY_MAX_COUNT = 10;
  // 單一分類的長度上限，要和 utils/validUtils.js 的 verifyCustomCategories 一致
  const CATEGORY_MAX_LENGTH = 100;
  let categories = [];
  let isSubmitting = false;
  // 這次開啟彈窗期間有沒有分享成功：關閉時才通知頁面重新載入清單，避免開著時背景一直跳動
  let hasShared = false;
  // 這次開著視窗期間成功分享的網址，視窗關閉時隨 photoshared 事件帶出去（搜尋頁用來把對應按鈕變灰）
  let sharedUrls = [];

  const { show: showAlert, hide: hideAlert } = createAlert('share', 'mt-2 mb-0');

  function renderCategories() {
    categoryListEl.innerHTML = categories
      .map(
        (name) => `
          <span class="badge text-bg-secondary d-flex align-items-center gap-1">
            ${escapeHtml(name)}
            <button type="button" class="btn-close btn-close-white btn-close-sm" data-category="${escapeHtml(name)}" aria-label="${i18n.t('share.removeCategory')}"></button>
          </span>
        `
      )
      .join('');
  }

  // 回傳 false 代表輸入的分類不合法（已顯示提示），呼叫端不該繼續往下走。
  // 一次可以輸入多個分類，用空白（含全形空白）分隔，所以分類名稱本身不能含空白。
  // 含 < > 或單一分類太長時，整批都不加入、文字保留在輸入框讓使用者修改；
  // 超過數量上限時修改也沒用，能加幾個加幾個，其餘丟掉並清空輸入框，之後才能直接按「分享」送出
  function addCategory() {
    const names = categoryInput.value.split(/\s+/).filter(Boolean);
    if (names.some((name) => /[<>]/.test(name))) {
      showAlert(i18n.t('share.categoryInvalidChars'));
      return false;
    }
    if (names.some((name) => name.length > CATEGORY_MAX_LENGTH)) {
      showAlert(i18n.t('share.categoryTooLong', { max: CATEGORY_MAX_LENGTH }));
      return false;
    }

    let added = false;
    let hitLimit = false;
    names.forEach((name) => {
      // 後端以不分大小寫去重，前端同步，避免出現 Animal 與 animal 兩個標籤
      const lowerName = name.toLowerCase();
      const isDuplicate = categories.some((c) => c.toLowerCase() === lowerName);
      if (isDuplicate) return;
      if (categories.length >= CATEGORY_MAX_COUNT) {
        hitLimit = true;
        return;
      }
      categories.push(name);
      added = true;
    });

    categoryInput.value = '';
    if (added) {
      renderCategories();
      hideAlert();
    }
    if (hitLimit) {
      showAlert(i18n.t('share.categoryLimit', { max: CATEGORY_MAX_COUNT }));
      return false;
    }
    return true;
  }

  categoryAddBtn.addEventListener('click', addCategory);
  categoryInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addCategory();
  });

  categoryListEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    categories = categories.filter((name) => name !== button.dataset.category);
    renderCategories();
  });

  // 分享方式：'upload'（上傳圖片）或 'unsplash'（貼 Unsplash 連結）。
  // 「貼連結」關閉時（UNSPLASH_SHARE_ENABLED = false）一律是上傳，也不顯示分頁
  let mode = 'upload';

  function setMode(nextMode) {
    mode = UNSPLASH_SHARE_ENABLED ? nextMode : 'upload';
    modeTabsEl.classList.toggle('d-none', !UNSPLASH_SHARE_ENABLED);
    uploadFieldsEl.classList.toggle('d-none', mode !== 'upload');
    unsplashFieldsEl.classList.toggle('d-none', mode !== 'unsplash');
    modeTabsEl.querySelectorAll('button[data-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });
    hideAlert();
  }

  modeTabsEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (button) setMode(button.dataset.mode);
  });

  // 原創：連結選填、不用授權聲明；非原創：連結必填，並顯示授權聲明
  function updateOriginUi() {
    const isOriginal = originalCheckbox.checked;
    originLabelRequiredEl.classList.toggle('d-none', isOriginal);
    originLabelOptionalEl.classList.toggle('d-none', !isOriginal);
    declarationEl.classList.toggle('d-none', isOriginal);
  }
  originalCheckbox.addEventListener('change', updateOriginUi);
  updateOriginUi();

  // 沒有選圖：顯示拖放框；選好圖：隱藏拖放框，改顯示預覽、檔名和「移除」鈕（只能傳一張，要換就先移除再選）
  let previewUrl = null;
  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    previewEl.removeAttribute('src');
    selectedEl.classList.add('d-none');
    dropzoneEl.classList.remove('d-none');
  }

  function showSelected(file) {
    previewUrl = URL.createObjectURL(file);
    previewEl.src = previewUrl;
    showFileName(file);
    selectedEl.classList.remove('d-none');
    dropzoneEl.classList.add('d-none');
  }

  // 檔名（切換語言時要重畫，所以是函式）
  function showFileName(file) {
    fileNameEl.textContent = i18n.t('share.fileSelected', { name: file.name });
  }
  document.addEventListener('langchange', () => {
    const file = fileInput.files[0];
    if (file && !selectedEl.classList.contains('d-none')) showFileName(file);
  });

  // 移除已選的圖片：回到拖放框，可以重新選別張
  removeFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    clearPreview();
    hideAlert();
  });

  // 檢查選到的檔案（有沒有、大小、格式），回傳錯誤訊息，沒有錯誤回傳 null。
  // 選檔當下和送出時都會用到；後端仍會完整驗證（格式看檔案內容，不看這裡的 type）
  function validateFile(file) {
    if (!file) return i18n.t('error.FILE_REQUIRED');
    if (file.size > UPLOAD_MAX_BYTES) return i18n.t('error.FILE_TOO_LARGE');
    if (!UPLOAD_ALLOWED_TYPES.includes(file.type)) return i18n.t('error.INVALID_FILE_TYPE');
    return null;
  }

  // 選檔當下就檢查：不合格馬上顯示原因並清掉選擇（也不顯示預覽），不用等填完整個表單、按「分享」才發現
  fileInput.addEventListener('change', () => {
    clearPreview();
    const file = fileInput.files[0];
    if (!file) return;

    const fileError = validateFile(file);
    if (fileError) {
      fileInput.value = '';
      showAlert(fileError);
      return;
    }

    showSelected(file);
    hideAlert();
  });

  // ---- 拖放：把圖片拖進虛線框，等同於用「選擇檔案」選了它（最後還是走上面的 change 事件，沿用同一套檢查與預覽）----
  const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

  function setDragOver(isOver) {
    dropzoneEl.classList.toggle('is-dragover', isOver);
    dropHintEl.classList.toggle('d-none', isOver);
    dropActiveEl.classList.toggle('d-none', !isOver);
  }

  ['dragenter', 'dragover'].forEach((type) => {
    dropzoneEl.addEventListener(type, (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault(); // 沒有這行，瀏覽器不允許在這裡放開
      event.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    });
  });

  dropzoneEl.addEventListener('dragleave', (event) => {
    // 滑鼠移到框裡面的子元素時也會觸發 dragleave，只有真的離開整個框才取消高亮
    if (!dropzoneEl.contains(event.relatedTarget)) setDragOver(false);
  });

  dropzoneEl.addEventListener('drop', (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;
    if (files.length > 1) {
      showAlert(i18n.t('share.oneFileOnly'));
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(files[0]);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change'));
  });

  // 視窗開著時，檔案拖到框外（視窗其他地方或背景）不該讓瀏覽器直接打開那張圖、把整個頁面換掉
  ['dragover', 'drop'].forEach((type) => {
    window.addEventListener(type, (event) => {
      if (!shareModalEl.classList.contains('show') || !hasFiles(event)) return;
      if (!dropzoneEl.contains(event.target)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'none';
      }
    });
  });

  // 前端先擋明顯的錯誤，省一次請求；後端仍會完整驗證。
  // 依表單由上而下的順序，回傳第一個錯誤訊息，沒有錯誤回傳 null
  function validateUploadFields() {
    const fileError = validateFile(fileInput.files[0]);
    if (fileError) return fileError;

    const originUrl = originUrlInput.value.trim();
    if (!originalCheckbox.checked && originUrl === '') return i18n.t('error.ORIGIN_URL_REQUIRED');
    if (originUrl !== '') {
      let isHttps = false;
      try {
        const url = new URL(originUrl);
        isHttps = url.protocol === 'https:' && !url.username && !url.password;
      } catch {
        isHttps = false;
      }
      if (!isHttps || originUrl.length > ORIGIN_URL_MAX_LENGTH) return i18n.t('error.INVALID_ORIGIN_URL');
    }

    const note = noteInput.value.trim();
    if (note.length > NOTE_MAX_LENGTH || /[<>]/.test(note)) return i18n.t('error.INVALID_NOTE');

    return null;
  }

  // 關閉視窗時把上傳欄位和預覽也清掉（shareForm.reset() 只清表單控制項的值，不管預覽圖與顯示狀態）
  function resetUploadFields() {
    clearPreview();
    updateOriginUi();
  }

  shareModalEl.addEventListener('hidden.bs.modal', () => {
    shareForm.reset();
    resetUploadFields();
    setMode('upload');
    hideAlert();
    categories = [];
    renderCategories();

    if (hasShared) {
      hasShared = false;
      const urls = sharedUrls;
      sharedUrls = [];
      document.dispatchEvent(new CustomEvent('photoshared', { detail: { urls } }));
    }
  });

  // 上傳圖片：multipart 送出（不要自己設 Content-Type，瀏覽器才會帶上 boundary）
  async function submitUpload() {
    // 先驗證檔案、連結、備註，再處理分類（輸入框裡還沒按「新增」的字也算）
    const fieldError = validateUploadFields();
    if (fieldError) {
      showAlert(fieldError);
      return;
    }
    if (!addCategory()) return;
    if (categories.length === 0) {
      showAlert(i18n.t('share.needCategory'));
      return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('isOriginal', String(originalCheckbox.checked));
    const originUrl = originUrlInput.value.trim();
    if (originUrl) formData.append('originUrl', originUrl);
    const note = noteInput.value.trim();
    if (note) formData.append('note', note);
    categories.forEach((name) => formData.append('customCategories', name));

    isSubmitting = true;
    shareSubmitBtn.disabled = true;
    showAlert(i18n.t('share.uploading'), 'secondary');

    try {
      const response = await fetch('/api/v1/shared-photos/upload', {
        method: 'POST',
        headers: window.auth.getAuthHeader(),
        body: formData
      });
      const body = await response.json();

      if (response.ok) {
        fileInput.value = '';
        originUrlInput.value = '';
        noteInput.value = '';
        categories = [];
        renderCategories();
        resetUploadFields();
        hasShared = true;
        showAlert(i18n.t('share.success'), 'success');
      } else {
        showAlert(i18n.apiMessage(body, 'share.failed'));
      }
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    } finally {
      isSubmitting = false;
      shareSubmitBtn.disabled = false;
    }
  }

  shareForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (mode === 'upload') {
      await submitUpload();
      return;
    }

    const url = shareInput.value.trim();
    if (!url) {
      showAlert(i18n.t('error.URL_REQUIRED'));
      return;
    }

    // 依表單由上而下的順序驗證：網址在分類上面，所以先擋格式錯誤的網址。
    // 這裡只做開頭的快速檢查，完整的網址格式與 ID 解析由後端 getUnsplashImageId 負責；
    // 照片是否真的存在只有後端問得到，仍由後端回傳
    if (!url.startsWith('https://unsplash.com/photos/')) {
      showAlert(i18n.t('error.INVALID_URL'));
      return;
    }

    // 輸入框裡打了字但還沒按「新增」，送出時一併視為要加入的分類
    if (!addCategory()) return;

    if (categories.length === 0) {
      showAlert(i18n.t('share.needCategory'));
      return;
    }

    isSubmitting = true;
    shareSubmitBtn.disabled = true;
    showAlert(i18n.t('share.sharing'), 'secondary');

    try {
      const response = await fetch('/api/v1/shared-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...window.auth.getAuthHeader()
        },
        body: JSON.stringify({ url, customCategories: categories })
      });
      const body = await response.json();

      if (response.ok) {
        shareInput.value = '';
        categories = [];
        renderCategories();
        hasShared = true;
        sharedUrls.push(url);
        showAlert(i18n.t('share.success'), 'success');
      } else {
        showAlert(i18n.apiMessage(body, 'share.failed'));
      }
    } catch (error) {
      showAlert(i18n.t('common.networkError'));
    } finally {
      isSubmitting = false;
      shareSubmitBtn.disabled = false;
    }
  });

  window.openShareModal = (url) => {
    if (!window.auth.isLoggedIn()) {
      window.auth.redirectToLogin();
      return;
    }
    // 帶了網址（分享別人的 Unsplash 照片）而且開放貼連結 → 用 Unsplash 模式；其他情況（導覽列的分享鈕、關閉貼連結時）→ 上傳
    if (url && UNSPLASH_SHARE_ENABLED) {
      setMode('unsplash');
      shareInput.value = url;
    } else {
      setMode('upload');
    }
    bootstrap.Modal.getOrCreateInstance(shareModalEl).show();
  };

  // 導覽列的「分享」鈕是用 data-bs-toggle 直接開視窗（沒經過 openShareModal）：
  // 一開始與每次關閉視窗時都會回到預設的「上傳」，所以這種開法也是上傳
  setMode('upload');
})();
