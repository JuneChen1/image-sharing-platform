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
    source_type: {
      type: 'varchar',
      length: 20,
      nullable: false,
      default: 'unsplash'
    },
    file_key: {
      type: 'varchar',
      length: 255,
      nullable: true,
      unique: true
    },
    is_original: {
      type: 'boolean',
      nullable: true
    },
    origin_url: {
      type: 'varchar',
      length: 2048,
      nullable: true
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
    image_url: {
      type: 'varchar',
      length: 2048,
      nullable: false
    },
    photographer_name: {
      type: 'varchar',
      length: 255,
      nullable: true
    },
    photographer_url: {
      type: 'varchar',
      length: 2048,
      nullable: true
    },
    note: {
      type: 'varchar',
      length: 500,
      nullable: true
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
    }
  },
  uniques: [
    {
      name: 'UQ_unsplash_id_user_pair',
      columns: ['unsplash_id', 'user']
    }
  ],
  checks: [
    {
      name: 'CHK_shared_photos_source_type',
      expression: `"source_type" IN ('unsplash', 'upload')`
    },
    {
      // Unsplash 來源：Unsplash 相關欄位都要有
      name: 'CHK_shared_photos_unsplash_fields',
      expression: `"source_type" <> 'unsplash' OR ("unsplash_id" IS NOT NULL AND "unsplash_page_url" IS NOT NULL AND "photographer_name" IS NOT NULL AND "photographer_url" IS NOT NULL)`
    },
    {
      // 上傳來源：要有檔案位置，並且標明是否原創
      name: 'CHK_shared_photos_upload_fields',
      expression: `"source_type" <> 'upload' OR ("file_key" IS NOT NULL AND "is_original" IS NOT NULL)`
    },
    {
      // 非原創必須有出處連結；is_original 是 NULL（Unsplash 來源）時不受限，所以用 IS DISTINCT FROM
      name: 'CHK_shared_photos_origin_url',
      expression: `"is_original" IS DISTINCT FROM false OR "origin_url" IS NOT NULL`
    }
  ]
});
