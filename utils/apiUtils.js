const { unsplashBaseUrl, headers } = require('../config/constants');

function getUnsplashImageId(url) {
  if (!url.startsWith('https://unsplash.com/photos/')) {
    return {
      success: false
    };
  }
  const imageId = url.slice(-11);

  return { success: true, imageId };
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

function getUnsplashImageInfo(result) {
  const { id, links, urls, user } = result.data;
  return {
    unsplash_id: id,
    unsplash_page_url: links.html,
    image_url: urls.regular,
    photographer_name: user.username,
    photographer_url: `https://unsplash.com/@${user.username}`
  };
}

module.exports = {
  getUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo
};
