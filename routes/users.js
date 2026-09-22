const express = require('express');
const userController = require('../controllers/users');
const isAuth = require('../middlewares/isAuth');
const { authLimiter } = require('../middlewares/limiter');
const router = express.Router();

router.get('/:userId/shared-photos', userController.getPhotos);

router.use(isAuth);

router.get('/me', userController.getMe);
router.patch('/me/password', authLimiter, userController.updatePassword);
router.delete('/me', authLimiter, userController.deleteMe);
router.patch('/me', userController.updateMe);

module.exports = router;
