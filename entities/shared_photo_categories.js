const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SharedPhotoCategories',
  tableName: 'shared_photo_categories',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    }
  },
  relations: {
    categories: {
      type: 'many-to-one',
      target: 'Categories',
      joinColumn: { name: 'category_id' },
      nullable: false
    },
    sharePhotos: {
      type: 'many-to-one',
      target: 'SharedPhotos',
      joinColumn: { name: 'shared_photo_id' },
      nullable: false
    }
  },
  uniques: [
    {
      name: 'UQ_shared_photo_categories_pair',
      columns: ['categories', 'sharePhotos']
    }
  ]
});
