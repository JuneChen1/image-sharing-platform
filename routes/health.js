const express = require('express');
const { dataSource } = require('../db/data-source');
const appError = require('../utils/appError');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await dataSource.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('health check failed:', err);
    next(appError(503, 'Service Unavailable'));
  }
});

module.exports = router;
