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

  return emailRegex.test(email);
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
  isValidUUID,
  isValidEmail,
  isValidPassword
};
