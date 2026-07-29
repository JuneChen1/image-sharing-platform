const { unsplashBaseUrl, headers } = require('../config/constants');

function getUnsplashImageId(url) {
  if (!url.startsWith('https://unsplash.com/photos/')) {
    return {
      success: false
    };
  }
  const index = url.lastIndexOf('-');
  const imageId = url.slice(index + 1);

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

module.exports = {
  getUnsplashImageId,
  verifyUnsplashImageId,
  fetchUnsplashPhoto
};
