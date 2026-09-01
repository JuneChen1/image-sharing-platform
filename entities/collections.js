const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Collections',
  tableName: 'collections',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    }
  },
  relations: {
    users: {
      type: 'many-to-one',
      target: 'Users',
      joinColumn: { name: 'user_id' },
      nullable: false
    }
  }
});
