require('dotenv').config();
const { DataSource } = require('typeorm');
const Categories = require('./entities/categories');
const SharePhotos = require('./entities/shared_photos');
const SharePhotosCategories = require('./entities/shared_photo_categories');

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  poolSize: Number(process.env.DATABASE_POOL_SIZE) || 10,
  entities: [Categories, SharePhotos, SharePhotosCategories],
  migrations: ['db/migrations/*.js']
});

module.exports = { dataSource };
