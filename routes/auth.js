const express = require('express');
const authController = require('../controllers/auth');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
} = require('../middlewares/limiter');
const router = express.Router();

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  authController.resetPassword
);

module.exports = router;
