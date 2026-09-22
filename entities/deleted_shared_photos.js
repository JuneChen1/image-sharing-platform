const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'DeletedSharedPhotos',
  tableName: 'deleted_shared_photos',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    unsplash_id: {
      type: 'varchar',
      length: 100,
      nullable: false
    },
    unsplash_page_url: {
      type: 'varchar',
      length: 2048,
      nullable: false
    },
    photographer_name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    original_sharer_id: {
      type: 'uuid',
      nullable: false
    },
    original_sharer_name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    deleted_by_admin_id: {
      type: 'uuid',
      nullable: false
    },
    deleted_by_admin_name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    reason: {
      type: 'text',
      nullable: true
    },
    deleted_at: {
      type: 'timestamp',
      createDate: true
    }
  }
});
