require('dotenv').config();

if (!process.env.UNSPLASH_ACCESS_KEY || !process.env.DATABASE_URL) {
  console.error(`缺少必要環境變數：UNSPLASH_ACCESS_KEY 或 DATABASE_URL`);
  process.exit(1);
}

const pool = require('./controllers/database');

async function main() {
  await pool.query('SELECT 1').catch((err) => {
    console.error('資料庫連線失敗：', err.message);
    process.exit(1);
  });

  const express = require('express');
  const cors = require('cors');
  const apiRouter = require('./routes/api');

  const app = express();

  app.use(cors());
  app.use('/api', apiRouter);

  app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Page Not Found' });
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ status: 'error', message: err.message });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`伺服器啟動中：http://localhost:${PORT}`));
}

main();
