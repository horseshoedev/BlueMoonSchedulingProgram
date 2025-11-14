/**
 * Migration: Create Calendar Integrations Table
 */

exports.up = (pgm) => {
  // Create calendar provider enum type
  pgm.sql(`
    CREATE TYPE calendar_provider AS ENUM ('google', 'ical');
  `);

  // Create calendar_integrations table
  pgm.createTable('calendar_integrations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    provider: {
      type: 'calendar_provider',
      notNull: true,
    },
    account_email: {
      type: 'varchar(255)',
      notNull: true,
    },
    is_connected: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    // Store encrypted tokens
    access_token: {
      type: 'text',
      notNull: false,
    },
    refresh_token: {
      type: 'text',
      notNull: false,
    },
    expires_at: {
      type: 'timestamp',
      notNull: false,
    },
    calendar_id: {
      type: 'varchar(255)',
      notNull: false,
    },
    calendar_name: {
      type: 'varchar(255)',
      notNull: false,
    },
    last_sync: {
      type: 'timestamp',
      notNull: false,
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
  pgm.createIndex('calendar_integrations', 'user_id');
  pgm.createIndex('calendar_integrations', 'provider');
  pgm.createIndex('calendar_integrations', ['user_id', 'provider']);
  pgm.createIndex('calendar_integrations', 'is_connected');

  // Prevent duplicate integrations for same provider
  pgm.addConstraint('calendar_integrations', 'unique_user_provider_email', {
    unique: ['user_id', 'provider', 'account_email'],
  });

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_calendar_integrations_updated_at
    BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE calendar_integrations IS 'Stores external calendar integration credentials (tokens are encrypted)';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations');
  pgm.dropTable('calendar_integrations');
  pgm.sql('DROP TYPE IF EXISTS calendar_provider');
};
