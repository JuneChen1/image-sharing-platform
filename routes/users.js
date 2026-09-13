const express = require('express');
const userController = require('../controllers/users');
const isAuth = require('../middlewares/isAuth');
const { authLimiter } = require('../middlewares/limiter');
const router = express.Router();

router.use(isAuth);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.patch('/me/password', authLimiter, userController.updatePassword);

module.exports = router;
