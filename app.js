require('dotenv').config();

const { hasRequiredEnvs } = require('./utils/env');

if (!hasRequiredEnvs()) {
  console.error(`缺少必要環境變數：UNSPLASH_ACCESS_KEY 或 DATABASE_URL`);
  process.exit(1);
}

const { dataSource } = require('./db/data-source');

async function main() {
  try {
    await dataSource.initialize();
    console.log('資料庫連線成功');
  } catch (error) {
    console.error('資料庫連線失敗：', error);
    process.exit(1);
  }

  const express = require('express');
  const cors = require('cors');
  const healthRouter = require('./routes/health');
  const apiRouter = require('./routes/api');

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));
  app.use('/health', healthRouter);
  app.use('/api', apiRouter);

  app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Page Not Found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ status: 'error', message: '伺服器發生錯誤' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`伺服器啟動中：http://localhost:${PORT}`));
}

main();
