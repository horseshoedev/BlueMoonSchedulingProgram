/**
 * Migration: Create Group Members Junction Table
 */

exports.up = (pgm) => {
  // Create role enum type
  pgm.sql(`
    CREATE TYPE group_member_role AS ENUM ('member', 'admin', 'owner');
  `);

  // Create group_members junction table
  pgm.createTable('group_members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    group_id: {
      type: 'uuid',
      notNull: true,
      references: 'groups',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    role: {
      type: 'group_member_role',
      notNull: true,
      default: 'member',
    },
    joined_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create unique constraint to prevent duplicate memberships
  pgm.addConstraint('group_members', 'unique_group_member', {
    unique: ['group_id', 'user_id'],
  });

  // Create indexes for common queries
  pgm.createIndex('group_members', 'group_id');
  pgm.createIndex('group_members', 'user_id');
  pgm.createIndex('group_members', ['group_id', 'user_id']);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE group_members IS 'Junction table for user group memberships with roles';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('group_members');
  pgm.sql('DROP TYPE IF EXISTS group_member_role');
};
