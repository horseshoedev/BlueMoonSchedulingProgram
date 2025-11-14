/**
 * Migration: Create Users Table
 */

exports.up = (pgm) => {
  // Create UUID extension if not exists
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password: {
      type: 'varchar(255)',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    profile_icon: {
      type: 'text',
      notNull: false,
    },
    // User preferences as JSONB for flexibility
    preferences: {
      type: 'jsonb',
      notNull: true,
      default: pgm.func(`'{
        "workingHours": {"start": "09:00", "end": "17:00"},
        "timeZone": "UTC",
        "preferredTimes": [],
        "eventTypes": [],
        "timeFormat": "12",
        "theme": "light"
      }'::jsonb`),
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
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'created_at');

  // Create trigger to automatically update updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE users IS 'Stores user account information and preferences';
  `);
};

exports.down = (pgm) => {
  // Drop trigger and function
  pgm.sql('DROP TRIGGER IF EXISTS update_users_updated_at ON users');

  // Drop table (this will also drop indexes)
  pgm.dropTable('users');

  // Note: We don't drop the update_updated_at_column function here
  // as other tables might be using it
};
