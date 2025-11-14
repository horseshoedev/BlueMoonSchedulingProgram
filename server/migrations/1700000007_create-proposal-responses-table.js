/**
 * Migration: Create Proposal Responses Table
 */

exports.up = (pgm) => {
  // Create response type enum
  pgm.sql(`
    CREATE TYPE response_type AS ENUM ('pending', 'yes', 'no', 'alternate');
  `);

  // Create proposal_responses table
  pgm.createTable('proposal_responses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    proposal_id: {
      type: 'uuid',
      notNull: true,
      references: 'meeting_proposals',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: false, // Can be null for email-only responses
      references: 'users',
      onDelete: 'SET NULL',
    },
    user_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    user_email: {
      type: 'varchar(255)',
      notNull: true,
    },
    response: {
      type: 'response_type',
      notNull: true,
      default: 'pending',
    },
    alternate_date: {
      type: 'date',
      notNull: false,
    },
    alternate_time: {
      type: 'time',
      notNull: false,
    },
    alternate_message: {
      type: 'text',
      notNull: false,
    },
    response_token: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    responded_at: {
      type: 'timestamp',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create indexes
  pgm.createIndex('proposal_responses', 'proposal_id');
  pgm.createIndex('proposal_responses', 'user_id');
  pgm.createIndex('proposal_responses', 'user_email');
  pgm.createIndex('proposal_responses', 'response');
  pgm.createIndex('proposal_responses', 'response_token');

  // Unique constraint for user + proposal
  pgm.addConstraint('proposal_responses', 'unique_user_proposal', {
    unique: ['proposal_id', 'user_email'],
  });

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE proposal_responses IS 'Stores individual responses to meeting proposals';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('proposal_responses');
  pgm.sql('DROP TYPE IF EXISTS response_type');
};
