const express = require('express');
const userController = require('../controllers/users');
const isAuth = require('../middlewares/isAuth');
const optionalAuth = require('../middlewares/optionalAuth');
const { accountLimiter } = require('../middlewares/limiter');
const router = express.Router();

router.get('/:userId/shared-photos', optionalAuth, userController.getPhotos);

router.use(isAuth);

router.get('/me', userController.getMe);
router.patch('/me/password', accountLimiter, userController.updatePassword);
router.delete('/me', accountLimiter, userController.deleteMe);
router.patch('/me', userController.updateMe);

module.exports = router;
