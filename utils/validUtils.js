function verifyUnsplashImageId(unsplashId) {
  const unsplashIdPattern = /^[\w-]{5,20}$/;
  return unsplashIdPattern.test(unsplashId);
}

function verifyCustomCategories(customCategories) {
  if (!Array.isArray(customCategories) || customCategories.length === 0) {
    return false;
  }

  const isValid = customCategories.every((name) => isSafeText(name, 100));

  return isValid;
}

function isPositiveInteger(number) {
  return Number.isSafeInteger(number) && number > 0;
}

function isValidString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// 使用者可自訂、會顯示在畫面上的文字（名稱、分類等）：非空、長度限制，且不可含 < >
function isSafeText(value, maxLength) {
  return (
    isValidString(value) &&
    value.trim().length <= maxLength &&
    !/[<>]/.test(value)
  );
}

function isValidUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return typeof email === 'string' && emailRegex.test(email);
}

function isValidPassword(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  return typeof password === 'string' && passwordRegex.test(password);
}

module.exports = {
  verifyUnsplashImageId,
  verifyCustomCategories,
  isPositiveInteger,
  isValidString,
  isSafeText,
  isValidUUID,
  isValidEmail,
  isValidPassword
};
