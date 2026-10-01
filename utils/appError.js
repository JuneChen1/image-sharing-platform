function appError(statusCode, message, errorCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  error.isOperational = true;
  return error;
}

module.exports = appError;
