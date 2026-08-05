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

function verifyUnsplashImageId(unsplashId) {
  const unsplashIdPattern = /^[\w-]{5,20}$/;
  return unsplashIdPattern.test(unsplashId);
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

function verifyCustomCategories(customCategories) {
  if (!Array.isArray(customCategories) || customCategories.length === 0) {
    return false;
  }

  const isValid = customCategories.every(
    (name) => typeof name === 'string' && name.trim().length > 0
  );

  return isValid;
}

module.exports = {
  getUnsplashImageId,
  verifyUnsplashImageId,
  fetchUnsplashPhoto,
  getUnsplashImageInfo,
  verifyCustomCategories
};
