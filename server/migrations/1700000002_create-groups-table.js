/**
 * Migration: Create Groups Table
 */

exports.up = (pgm) => {
  // Create groups table
  pgm.createTable('groups', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
      default: 'regular',
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    deleted_at: {
      type: 'timestamp',
      notNull: false,
    },
  });

  // Create indexes
  pgm.createIndex('groups', 'created_by');
  pgm.createIndex('groups', 'created_at');
  pgm.createIndex('groups', 'name');

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE groups IS 'Stores group information for scheduling';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_groups_updated_at ON groups');
  pgm.dropTable('groups');
};
