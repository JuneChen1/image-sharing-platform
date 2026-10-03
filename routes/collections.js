const express = require('express');
const collectionsController = require('../controllers/collections');
const isAuth = require('../middlewares/isAuth');
const router = express.Router();

router.use(isAuth);

router.delete(
  '/:collectionId/favorites/:photoId',
  collectionsController.deletePhotoInCollection
);
router.get(
  '/:collectionId/favorites',
  collectionsController.getPhotosInCollection
);
router.post('/:collectionId/favorites', collectionsController.addToCollection);

router.delete('/:collectionId', collectionsController.deleteCollection);
router.get('/', collectionsController.getCollections);
router.post('/', collectionsController.addCollection);

module.exports = router;
