const { unsplashBaseUrl, headers } = require('../config/constants');

function verifyUnsplashImageId(unsplashId) {
  const unsplashIdPattern = /^[\w-]{5,20}$/;
  return unsplashIdPattern.test(unsplashId);
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
  verifyUnsplashImageId,
  verifyCustomCategories
};
