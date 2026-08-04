const express = require('express');
const { dataSource } = require('../db/data-source');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await dataSource.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('health check failed:', err);
    res.status(503).json({ status: 'error' });
  }
});

module.exports = router;
