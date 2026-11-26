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
      nullable: true
    },
    unsplash_page_url: {
      type: 'varchar',
      length: 2048,
      nullable: true
    },
    photographer_name: {
      type: 'varchar',
      length: 255,
      nullable: true
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
    source_type: {
      type: 'varchar',
      length: 20,
      nullable: false,
      default: 'unsplash'
    },
    deleted_at: {
      type: 'timestamp',
      createDate: true
    }
  },
  checks: [
    {
      name: 'CHK_deleted_shared_photos_source_type',
      expression: `"source_type" IN ('unsplash', 'upload')`
    },
    {
      name: 'CHK_deleted_shared_photos_unsplash_fields',
      expression: `"source_type" <> 'unsplash' OR ("unsplash_id" IS NOT NULL AND "unsplash_page_url" IS NOT NULL AND "photographer_name" IS NOT NULL)`
    }
  ]
});
