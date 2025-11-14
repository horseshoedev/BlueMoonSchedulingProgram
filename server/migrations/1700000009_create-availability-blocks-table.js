/**
 * Migration: Create Availability Blocks Table
 * NEW FEATURE: Persists user availability data (currently only in React Context)
 */

exports.up = (pgm) => {
  // Create availability type enum
  pgm.sql(`
    CREATE TYPE availability_type AS ENUM ('fully_free', 'partially_free', 'recurring');
  `);

  // Create day of week enum
  pgm.sql(`
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  `);

  // Create availability_blocks table
  pgm.createTable('availability_blocks', {
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
    type: {
      type: 'availability_type',
      notNull: true,
    },
    // For fully_free and partially_free types
    date: {
      type: 'date',
      notNull: false,
    },
    start_time: {
      type: 'time',
      notNull: false,
    },
    end_time: {
      type: 'time',
      notNull: false,
    },
    // For recurring type
    day_of_week: {
      type: 'day_of_week',
      notNull: false,
    },
    recurring_start_time: {
      type: 'time',
      notNull: false,
    },
    recurring_end_time: {
      type: 'time',
      notNull: false,
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
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
  pgm.createIndex('availability_blocks', 'user_id');
  pgm.createIndex('availability_blocks', 'type');
  pgm.createIndex('availability_blocks', 'date');
  pgm.createIndex('availability_blocks', 'day_of_week');
  pgm.createIndex('availability_blocks', ['user_id', 'type']);
  pgm.createIndex('availability_blocks', ['user_id', 'date']);

  // Create trigger for updated_at
  pgm.sql(`
    CREATE TRIGGER update_availability_blocks_updated_at
    BEFORE UPDATE ON availability_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Add check constraints
  pgm.sql(`
    ALTER TABLE availability_blocks
    ADD CONSTRAINT check_date_fields
    CHECK (
      (type IN ('fully_free', 'partially_free') AND date IS NOT NULL) OR
      (type = 'recurring' AND day_of_week IS NOT NULL)
    );
  `);

  pgm.sql(`
    ALTER TABLE availability_blocks
    ADD CONSTRAINT check_time_fields
    CHECK (
      (type IN ('fully_free', 'partially_free') AND start_time IS NOT NULL AND end_time IS NOT NULL) OR
      (type = 'recurring' AND recurring_start_time IS NOT NULL AND recurring_end_time IS NOT NULL)
    );
  `);

  // Add comment to table
  pgm.sql(`
    COMMENT ON TABLE availability_blocks IS 'Stores user availability blocks (fully free, partially free, and recurring patterns)';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS update_availability_blocks_updated_at ON availability_blocks');
  pgm.dropTable('availability_blocks');
  pgm.sql('DROP TYPE IF EXISTS availability_type');
  pgm.sql('DROP TYPE IF EXISTS day_of_week');
};
