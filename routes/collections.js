const express = require('express');
const collectionsController = require('../controllers/collections');
const isAuth = require('../middlewares/isAuth');
const router = express.Router();

router.delete(
  '/:collectionId/favorites/:photoId',
  isAuth,
  collectionsController.deletePhotoInCollection
);
router.get(
  '/:collectionId/favorites',
  isAuth,
  collectionsController.getPhotosInCollection
);
router.post(
  '/:collectionId/favorites',
  isAuth,
  collectionsController.addToCollection
);

router.delete('/:collectionId', isAuth, collectionsController.deleteCollection);
router.get('/', isAuth, collectionsController.getCollections);
router.post('/', isAuth, collectionsController.addCollection);

module.exports = router;
