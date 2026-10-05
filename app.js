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
  const { globalLimiter } = require('./middlewares/limiter');
  const healthRouter = require('./routes/health');
  const sharedPhotosRouter = require('./routes/sharedPhotos');
  const apiRouter = require('./routes/api');
  const authRouter = require('./routes/auth');
  const collectionsRouter = require('./routes/collections');
  const userRouter = require('./routes/users');
  const adminRouter = require('./routes/admin');
  const errors = require('./config/errors');
  const errorBody = require('./utils/errorBody');

  const app = express();
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));
  app.use(globalLimiter);

  app.use('/health', healthRouter);
  app.use('/api/v1/shared-photos', sharedPhotosRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users/me/collections', collectionsRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1', apiRouter);

  app.use((req, res) => {
    res
      .status(errors.ROUTE_NOT_FOUND.status)
      .json(errorBody('ROUTE_NOT_FOUND'));
  });

  app.use((err, req, res, next) => {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: 'error',
        code: err.errorCode,
        message: err.message
      });
    }

    if (err.type === 'entity.parse.failed') {
      return res
        .status(errors.INVALID_FIELDS.status)
        .json(errorBody('INVALID_FIELDS'));
    }

    console.error(err);
    res
      .status(errors.SERVER_ERROR.status)
      .json(errorBody('SERVER_ERROR', 'failed'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`伺服器啟動中：http://localhost:${PORT}`));
}

main();
