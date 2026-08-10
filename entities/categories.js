const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Categories',
  tableName: 'categories',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid'
    },
    name: {
      type: 'citext',
      unique: true,
      nullable: false
    },
    created_at: {
      type: 'timestamp',
      createDate: true
    }
  }
});
