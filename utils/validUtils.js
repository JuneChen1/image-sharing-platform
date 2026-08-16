const { unsplashBaseUrl, headers } = require('../config/constants');

function verifyUnsplashImageId(unsplashId) {
  const unsplashIdPattern = /^[\w-]{5,20}$/;
  return unsplashIdPattern.test(unsplashId);
}

function verifyCustomCategories(customCategories) {
  if (!Array.isArray(customCategories) || customCategories.length === 0) {
    return false;
  }

  const isValid = customCategories.every((name) => isValidString(name));

  return isValid;
}

function isPositiveInteger(number) {
  return Number.isInteger(number) && number > 0;
}

function isValidString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

module.exports = {
  verifyUnsplashImageId,
  verifyCustomCategories,
  isPositiveInteger,
  isValidString
};
