const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SharedPhotos',
  tableName: 'shared_photos',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    unsplash_id: {
      type: 'varchar',
      length: 100
    },
    unsplash_page_url: {
      type: 'varchar',
      length: 2048,
      nullable: false
    },
    image_url: {
      type: 'varchar',
      length: 2048,
      nullable: false
    },
    photographer_name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    photographer_url: {
      type: 'varchar',
      length: 2048,
      nullable: false
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    }
  }
});
