/**
 * Migration: Create Meeting Proposals Table
 */

exports.up = (pgm) => {
  // Create proposal status enum type
  pgm.sql(`
    CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected');
  `);

  // Create meeting_proposals table
  pgm.createTable('meeting_proposals', {
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
    proposed_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    proposed_date: {
      type: 'date',
      notNull: true,
    },
    proposed_time: {
      type: 'time',
      notNull: true,
    },
    status: {
      type: 'proposal_status',
      notNull: true,
      default: 'pending',
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
  });

  // Create indexes
  pgm.createIndex('meeting_proposals', 'group_id');
  pgm.createIndex('meeting_proposals', 'proposed_by');
  pgm.createIndex('meeting_proposals', 'status');
  pgm.createIndex('meeting_proposals', 'proposed_date');
  pgm.createIndex('meeting_proposals', ['group_id', 'status']);

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_meeting_proposals_updated_at
    BEFORE UPDATE ON meeting_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE meeting_proposals IS 'Stores meeting time proposals for groups';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_meeting_proposals_updated_at ON meeting_proposals');
  pgm.dropTable('meeting_proposals');
  pgm.sql('DROP TYPE IF EXISTS proposal_status');
};
