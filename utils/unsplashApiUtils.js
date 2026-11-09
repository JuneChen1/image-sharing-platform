const {
  unsplashBaseUrl,
  unsplashTimeoutMs,
  headers
} = require('../config/constants');
const appError = require('./appError');

let lastRateLimit = { limit: null, remaining: null, checkedAt: null };

function updateRateLimit(response) {
  const limit = response.headers.get('X-Ratelimit-Limit');
  const remaining = response.headers.get('X-Ratelimit-Remaining');
  if (limit === null || remaining === null) return;

  lastRateLimit = {
    limit: Number(limit),
    remaining: Number(remaining),
    checkedAt: new Date().toISOString()
  };
}

function getRateLimit() {
  return lastRateLimit;
}

function getUnsplashImageId(url) {
  if (!url.startsWith('https://unsplash.com/photos/')) {
    return {
      success: false
    };
  }
  const imageId = url.slice(-11);

  return { success: true, imageId };
}

function getUnsplashImageInfo(result) {
  const { id, links, urls, user } = result.data;

  if (!links?.html || !urls?.regular || !user?.username) {
    throw appError('PHOTO_DATA_INCOMPLETE');
  }

  return {
    unsplash_id: id,
    unsplash_page_url: links.html,
    image_url: urls.regular,
    photographer_name: user.name || user.username,
    photographer_url: `https://unsplash.com/@${user.username}`
  };
}

// 對 Unsplash 發請求並整理結果。所有失敗（逾時、連不上、回應不是 JSON、HTTP 錯誤）
// 都轉成 { success: false, status, unsplashMessage }，不丟例外，呼叫端只要看 success 與 status：
// status 為 0 代表沒有收到任何回應（逾時或連不上），其餘是 Unsplash 回的 HTTP 狀態碼
async function requestUnsplash(url) {
  let response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(unsplashTimeoutMs)
    });
  } catch (error) {
    return { success: false, status: 0, unsplashMessage: error.name };
  }

  updateRateLimit(response);

  // 讀取內容也在逾時範圍內；回應不是 JSON（例如上游回 HTML 錯誤頁）時 data 維持 null
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // 交給下面依 response.ok 判斷
  }

  if (!response.ok)
    return {
      success: false,
      status: response.status,
      unsplashMessage: data?.errors?.[0]
    };

  if (data === null)
    return {
      success: false,
      status: response.status,
      unsplashMessage: 'invalid JSON'
    };

  return { success: true, data };
}

function fetchUnsplashPhoto(unsplashId) {
  return requestUnsplash(`${unsplashBaseUrl}/photos/${unsplashId}`);
}

function fetchImagesWithKeyword(page, q) {
  return requestUnsplash(
    `${unsplashBaseUrl}/search/photos?page=${page}&query=${encodeURIComponent(q)}`
  );
}

async function trackUnsplashDownload(downloadLocation, photo = {}) {
  // 只接受 Unsplash API 回傳的網址
  if (!downloadLocation?.startsWith(`${unsplashBaseUrl}/`)) return;

  // 失敗時要能查到是哪一張照片：記下 unsplash_id 與圖片主機（plus.unsplash.com 是 Unsplash+ 的圖片主機）
  const context = {
    unsplash_id: photo.unsplash_id,
    image_host: photo.image_url ? new URL(photo.image_url).host : undefined
  };

  try {
    const response = await fetch(downloadLocation, {
      headers,
      signal: AbortSignal.timeout(unsplashTimeoutMs)
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // 單行 JSON：上 AWS 後 CloudWatch Logs Insights 才會自動解析出欄位
      console.error(
        JSON.stringify({
          event: 'unsplash_download_tracking_failed',
          status: response.status,
          ...context,
          body: body.slice(0, 200)
        })
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'unsplash_download_tracking_failed',
        error: error.message,
        ...context
      })
    );
  }
}

module.exports = {
  getUnsplashImageId,
  getUnsplashImageInfo,
  fetchUnsplashPhoto,
  fetchImagesWithKeyword,
  getRateLimit,
  trackUnsplashDownload
};
