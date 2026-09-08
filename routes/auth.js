const express = require('express');
const authController = require('../controllers/auth');
const { authLimiter } = require('../middlewares/limiter');
const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

module.exports = router;
