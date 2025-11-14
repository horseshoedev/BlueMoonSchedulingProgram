/**
 * Migration: Create Schedule Events Table
 * NEW FEATURE: Persists schedule events (currently only mock data)
 */

exports.up = (pgm) => {
  // Create event type enum
  pgm.sql(`
    CREATE TYPE event_type AS ENUM ('work', 'personal', 'social');
  `);

  // Create event status enum
  pgm.sql(`
    CREATE TYPE event_status AS ENUM ('scheduled', 'pending', 'cancelled');
  `);

  // Create schedule_events table
  pgm.createTable('schedule_events', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: false,
    },
    start_time: {
      type: 'time',
      notNull: true,
    },
    end_time: {
      type: 'time',
      notNull: true,
    },
    date: {
      type: 'date',
      notNull: true,
    },
    type: {
      type: 'event_type',
      notNull: true,
      default: 'personal',
    },
    group_id: {
      type: 'uuid',
      notNull: false,
      references: 'groups',
      onDelete: 'SET NULL',
    },
    location: {
      type: 'varchar(255)',
      notNull: false,
    },
    is_recurring: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    recurring_pattern: {
      type: 'jsonb',
      notNull: false,
    },
    status: {
      type: 'event_status',
      notNull: true,
      default: 'scheduled',
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
  });

  // Create attendees junction table
  pgm.createTable('event_attendees', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    event_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedule_events',
      onDelete: 'CASCADE',
    },
    user_id: {
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
  });

  // Create indexes for schedule_events
  pgm.createIndex('schedule_events', 'created_by');
  pgm.createIndex('schedule_events', 'group_id');
  pgm.createIndex('schedule_events', 'date');
  pgm.createIndex('schedule_events', 'type');
  pgm.createIndex('schedule_events', 'status');
  pgm.createIndex('schedule_events', ['date', 'created_by']);
  pgm.createIndex('schedule_events', ['date', 'group_id']);

  // Create indexes for event_attendees
  pgm.createIndex('event_attendees', 'event_id');
  pgm.createIndex('event_attendees', 'user_id');

  // Unique constraint for event attendees
  pgm.addConstraint('event_attendees', 'unique_event_attendee', {
    unique: ['event_id', 'user_id'],
  });

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_schedule_events_updated_at
    BEFORE UPDATE ON schedule_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add comments to tables
  pgm.sql(`
    COMMENT ON TABLE schedule_events IS 'Stores scheduled events for users and groups';
    COMMENT ON TABLE event_attendees IS 'Junction table for event attendees';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_schedule_events_updated_at ON schedule_events');
  pgm.dropTable('event_attendees');
  pgm.dropTable('schedule_events');
  pgm.sql('DROP TYPE IF EXISTS event_type');
  pgm.sql('DROP TYPE IF EXISTS event_status');
};
