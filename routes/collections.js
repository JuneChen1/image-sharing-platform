const express = require('express');
const collectionsController = require('../controllers/collections');
const isAuth = require('../middlewares/isAuth');
const router = express.Router();

router.post('/', isAuth, collectionsController.addCollection);

module.exports = router;
