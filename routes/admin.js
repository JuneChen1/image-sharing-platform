const express = require('express');
const isAdmin = require('../middlewares/isAdmin');
const adminController = require('../controllers/admin');
const router = express.Router();

router.use(isAdmin);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/shared-photos/:id', adminController.forceDeleteSharedPhoto);
router.get(
  '/deleted-shared-photos/export',
  adminController.exportDeletedSharedPhotos
);

module.exports = router;
