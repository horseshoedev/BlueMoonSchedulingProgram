/**
 * Migration: Create Invitations Table
 */

exports.up = (pgm) => {
  // Create invitation status enum type
  pgm.sql(`
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
  `);

  // Create invitations table
  pgm.createTable('invitations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    from_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    to_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    group_id: {
      type: 'uuid',
      notNull: true,
      references: 'groups',
      onDelete: 'CASCADE',
    },
    status: {
      type: 'invitation_status',
      notNull: true,
      default: 'pending',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    responded_at: {
      type: 'timestamp',
      notNull: false,
    },
  });

  // Create indexes
  pgm.createIndex('invitations', 'from_user_id');
  pgm.createIndex('invitations', 'to_user_id');
  pgm.createIndex('invitations', 'group_id');
  pgm.createIndex('invitations', 'status');
  pgm.createIndex('invitations', ['to_user_id', 'status']);

  // Prevent duplicate pending invitations
  pgm.addConstraint('invitations', 'unique_pending_invitation', {
    unique: ['group_id', 'to_user_id', 'status'],
    where: 'status = \'pending\'',
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE invitations IS 'Stores group invitation requests';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('invitations');
  pgm.sql('DROP TYPE IF EXISTS invitation_status');
};
