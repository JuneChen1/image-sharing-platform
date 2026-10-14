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

async function trackUnsplashDownload(downloadLocation) {
  // 只接受 Unsplash API 回傳的網址
  if (!downloadLocation?.startsWith(`${unsplashBaseUrl}/`)) return;
  try {
    const response = await fetch(downloadLocation, { headers });
    if (!response.ok)
      console.error('Unsplash download tracking failed:', response.status);
  } catch (error) {
    console.error('Unsplash download tracking failed:', error.message);
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
