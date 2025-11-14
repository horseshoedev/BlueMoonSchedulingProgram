/**
 * Schedule Event Repository
 * Handles all database operations for schedule events
 */

const db = require('../db');

/**
 * Create a schedule event
 * @param {Object} eventData - Event data
 * @param {Array} attendeeIds - Array of attendee user IDs
 * @returns {Promise<Object>} - Created event with attendees
 */
async function createEvent(eventData, attendeeIds = []) {
  return await db.transaction(async (client) => {
    // Create event
    const eventQuery = `
      INSERT INTO schedule_events (
        title, description, start_time, end_time, date, type,
        group_id, location, is_recurring, recurring_pattern, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id, title, description, start_time as "startTime", end_time as "endTime",
        date, type, group_id as "groupId", location, is_recurring as "isRecurring",
        recurring_pattern as "recurringPattern", status, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const eventValues = [
      eventData.title,
      eventData.description || null,
      eventData.startTime,
      eventData.endTime,
      eventData.date,
      eventData.type || 'personal',
      eventData.groupId || null,
      eventData.location || null,
      eventData.isRecurring || false,
      eventData.recurringPattern ? JSON.stringify(eventData.recurringPattern) : null,
      eventData.status || 'scheduled',
      eventData.createdBy,
    ];

    const eventResult = await client.query(eventQuery, eventValues);
    const event = eventResult.rows[0];

    // Add attendees
    if (attendeeIds.length > 0) {
      const attendeeValues = [];
      const attendeePlaceholders = [];

      attendeeIds.forEach((userId, index) => {
        const baseIndex = index * 2 + 1;
        attendeePlaceholders.push(`($${baseIndex}, $${baseIndex + 1})`);
        attendeeValues.push(event.id, userId);
      });

      const attendeeQuery = `
        INSERT INTO event_attendees (event_id, user_id)
        VALUES ${attendeePlaceholders.join(', ')}
        ON CONFLICT ON CONSTRAINT unique_event_attendee DO NOTHING
      `;

      await client.query(attendeeQuery, attendeeValues);
    }

    event.attendees = attendeeIds;

    return event;
  });
}

/**
 * Get events by user ID
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters (startDate, endDate, type, status)
 * @returns {Promise<Array>} - Array of events
 */
async function getEventsByUserId(userId, filters = {}) {
  let query = `
    SELECT DISTINCT
      se.id, se.title, se.description, se.start_time as "startTime", se.end_time as "endTime",
      se.date, se.type, se.group_id as "groupId", se.location, se.is_recurring as "isRecurring",
      se.recurring_pattern as "recurringPattern", se.status, se.created_by as "createdBy",
      se.created_at as "createdAt", se.updated_at as "updatedAt",
      g.name as "groupName"
    FROM schedule_events se
    LEFT JOIN groups g ON se.group_id = g.id
    LEFT JOIN event_attendees ea ON se.id = ea.event_id
    WHERE (se.created_by = $1 OR ea.user_id = $1)
  `;

  const values = [userId];
  let paramCount = 2;

  if (filters.startDate) {
    query += ` AND se.date >= $${paramCount}`;
    values.push(filters.startDate);
    paramCount++;
  }

  if (filters.endDate) {
    query += ` AND se.date <= $${paramCount}`;
    values.push(filters.endDate);
    paramCount++;
  }

  if (filters.type) {
    query += ` AND se.type = $${paramCount}`;
    values.push(filters.type);
    paramCount++;
  }

  if (filters.status) {
    query += ` AND se.status = $${paramCount}`;
    values.push(filters.status);
    paramCount++;
  }

  query += ` ORDER BY se.date, se.start_time`;

  const result = await db.query(query, values);

  // Get attendees for each event
  for (const event of result.rows) {
    event.attendees = await getEventAttendees(event.id);
  }

  return result.rows;
}

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} - Event or null
 */
async function getEventById(eventId) {
  const query = `
    SELECT
      se.id, se.title, se.description, se.start_time as "startTime", se.end_time as "endTime",
      se.date, se.type, se.group_id as "groupId", se.location, se.is_recurring as "isRecurring",
      se.recurring_pattern as "recurringPattern", se.status, se.created_by as "createdBy",
      se.created_at as "createdAt", se.updated_at as "updatedAt",
      g.name as "groupName"
    FROM schedule_events se
    LEFT JOIN groups g ON se.group_id = g.id
    WHERE se.id = $1
  `;

  const result = await db.query(query, [eventId]);

  if (result.rows.length === 0) {
    return null;
  }

  const event = result.rows[0];
  event.attendees = await getEventAttendees(event.id);

  return event;
}

/**
 * Get event attendees
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} - Array of attendee user IDs
 */
async function getEventAttendees(eventId) {
  const query = `
    SELECT ea.user_id as "userId", u.name, u.email
    FROM event_attendees ea
    INNER JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = $1 AND u.deleted_at IS NULL
  `;

  const result = await db.query(query, [eventId]);
  return result.rows.map((row) => row.userId);
}

/**
 * Update event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated event
 */
async function updateEvent(eventId, updates) {
  const allowedFields = [
    'title',
    'description',
    'start_time',
    'end_time',
    'date',
    'type',
    'location',
    'status',
  ];

  const fieldMap = {
    title: 'title',
    description: 'description',
    startTime: 'start_time',
    start_time: 'start_time',
    endTime: 'end_time',
    end_time: 'end_time',
    date: 'date',
    type: 'type',
    location: 'location',
    status: 'status',
  };

  const updateParts = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    const dbField = fieldMap[key];
    if (dbField && allowedFields.includes(dbField)) {
      updateParts.push(`${dbField} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (updateParts.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(eventId);

  const query = `
    UPDATE schedule_events
    SET ${updateParts.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id, title, description, start_time as "startTime", end_time as "endTime",
      date, type, group_id as "groupId", location, is_recurring as "isRecurring",
      recurring_pattern as "recurringPattern", status, created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteEvent(eventId) {
  const query = `
    DELETE FROM schedule_events
    WHERE id = $1
  `;

  const result = await db.query(query, [eventId]);
  return result.rowCount > 0;
}

/**
 * Add attendee to event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
async function addAttendee(eventId, userId) {
  const query = `
    INSERT INTO event_attendees (event_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT ON CONSTRAINT unique_event_attendee DO NOTHING
  `;

  const result = await db.query(query, [eventId, userId]);
  return result.rowCount > 0;
}

/**
 * Remove attendee from event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
async function removeAttendee(eventId, userId) {
  const query = `
    DELETE FROM event_attendees
    WHERE event_id = $1 AND user_id = $2
  `;

  const result = await db.query(query, [eventId, userId]);
  return result.rowCount > 0;
}

module.exports = {
  createEvent,
  getEventsByUserId,
  getEventById,
  getEventAttendees,
  updateEvent,
  deleteEvent,
  addAttendee,
  removeAttendee,
};
