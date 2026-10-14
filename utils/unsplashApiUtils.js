const { unsplashBaseUrl, headers } = require('../config/constants');
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

async function fetchUnsplashPhoto(unsplashId) {
  const response = await fetch(`${unsplashBaseUrl}/photos/${unsplashId}`, {
    headers
  });

  updateRateLimit(response);

  const data = await response.json();

  if (!response.ok)
    return {
      success: false,
      status: response.status,
      unsplashMessage: data?.errors?.[0]
    };

  return { success: true, data };
}

async function fetchImagesWithKeyword(page, q) {
  const response = await fetch(
    `${unsplashBaseUrl}/search/photos?page=${page}&query=${encodeURIComponent(q)}`,
    {
      headers
    }
  );

  updateRateLimit(response);

  const data = await response.json();

  if (!response.ok)
    return {
      success: false,
      status: response.status,
      unsplashMessage: data?.errors?.[0]
    };

  return { success: true, data };
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
    const response = await fetch(downloadLocation, { headers });
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
