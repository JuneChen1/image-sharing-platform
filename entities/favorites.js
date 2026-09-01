const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Favorites',
  tableName: 'favorites',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'Users',
      joinColumn: { name: 'user_id' },
      nullable: false
    },
    collections: {
      type: 'many-to-one',
      target: 'Collections',
      joinColumn: { name: 'collection_id' },
      nullable: true
    },
    sharedPhotos: {
      type: 'many-to-one',
      target: 'SharedPhotos',
      joinColumn: { name: 'shared_photo_id' },
      nullable: false
    }
  },
  uniques: [
    {
      columns: ['user', 'sharedPhotos']
    }
  ]
});
