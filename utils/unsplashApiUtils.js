const { unsplashBaseUrl, headers } = require('../config/constants');
const appError = require('./appError');

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
    throw appError(502, '這張照片目前的資料不完整，暫時無法分享，請稍後再試');
  }

  return {
    unsplash_id: id,
    unsplash_page_url: links.html,
    image_url: urls.regular,
    photographer_name: user.username,
    photographer_url: `https://unsplash.com/@${user.username}`
  };
}

async function fetchUnsplashPhoto(unsplashId) {
  const response = await fetch(`${unsplashBaseUrl}/photos/${unsplashId}`, {
    headers
  });

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

  const data = await response.json();

  if (!response.ok)
    return {
      success: false,
      status: response.status,
      unsplashMessage: data?.errors?.[0]
    };

  return { success: true, data };
}

module.exports = {
  getUnsplashImageId,
  getUnsplashImageInfo,
  fetchUnsplashPhoto,
  fetchImagesWithKeyword
};
