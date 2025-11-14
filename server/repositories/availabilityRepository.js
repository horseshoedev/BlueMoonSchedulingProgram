/**
 * Availability Repository
 * Handles all database operations for user availability blocks
 */

const db = require('../db');

/**
 * Create an availability block
 * @param {Object} blockData - Availability block data
 * @returns {Promise<Object>} - Created availability block
 */
async function createAvailabilityBlock(blockData) {
  const query = `
    INSERT INTO availability_blocks (
      user_id, type, date, start_time, end_time,
      day_of_week, recurring_start_time, recurring_end_time, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING
      id, user_id as "userId", type, date, start_time as "startTime", end_time as "endTime",
      day_of_week as "dayOfWeek", recurring_start_time as "recurringStartTime",
      recurring_end_time as "recurringEndTime", is_active as "isActive",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    blockData.userId,
    blockData.type,
    blockData.date || null,
    blockData.startTime || null,
    blockData.endTime || null,
    blockData.dayOfWeek || null,
    blockData.recurringStartTime || null,
    blockData.recurringEndTime || null,
    blockData.isActive !== undefined ? blockData.isActive : true,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Get availability blocks by user ID
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters (type, startDate, endDate, isActive)
 * @returns {Promise<Object>} - Categorized availability blocks
 */
async function getAvailabilityByUserId(userId, filters = {}) {
  let query = `
    SELECT
      id, user_id as "userId", type, date, start_time as "startTime", end_time as "endTime",
      day_of_week as "dayOfWeek", recurring_start_time as "recurringStartTime",
      recurring_end_time as "recurringEndTime", is_active as "isActive",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM availability_blocks
    WHERE user_id = $1
  `;

  const values = [userId];
  let paramCount = 2;

  if (filters.type) {
    query += ` AND type = $${paramCount}`;
    values.push(filters.type);
    paramCount++;
  }

  if (filters.startDate) {
    query += ` AND (date IS NULL OR date >= $${paramCount})`;
    values.push(filters.startDate);
    paramCount++;
  }

  if (filters.endDate) {
    query += ` AND (date IS NULL OR date <= $${paramCount})`;
    values.push(filters.endDate);
    paramCount++;
  }

  if (filters.isActive !== undefined) {
    query += ` AND is_active = $${paramCount}`;
    values.push(filters.isActive);
    paramCount++;
  }

  query += ` ORDER BY date NULLS LAST, start_time NULLS LAST`;

  const result = await db.query(query, values);

  // Categorize by type
  const categorized = {
    fullyFree: [],
    partiallyFree: [],
    recurring: [],
  };

  result.rows.forEach((block) => {
    if (block.type === 'fully_free') {
      categorized.fullyFree.push(block);
    } else if (block.type === 'partially_free') {
      categorized.partiallyFree.push(block);
    } else if (block.type === 'recurring') {
      categorized.recurring.push(block);
    }
  });

  return categorized;
}

/**
 * Get availability block by ID
 * @param {string} blockId - Block ID
 * @returns {Promise<Object|null>} - Availability block or null
 */
async function getAvailabilityBlockById(blockId) {
  const query = `
    SELECT
      id, user_id as "userId", type, date, start_time as "startTime", end_time as "endTime",
      day_of_week as "dayOfWeek", recurring_start_time as "recurringStartTime",
      recurring_end_time as "recurringEndTime", is_active as "isActive",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM availability_blocks
    WHERE id = $1
  `;

  const result = await db.query(query, [blockId]);
  return result.rows[0] || null;
}

/**
 * Update availability block
 * @param {string} blockId - Block ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated block
 */
async function updateAvailabilityBlock(blockId, updates) {
  const allowedFields = [
    'date',
    'start_time',
    'end_time',
    'day_of_week',
    'recurring_start_time',
    'recurring_end_time',
    'is_active',
  ];

  const fieldMap = {
    date: 'date',
    startTime: 'start_time',
    start_time: 'start_time',
    endTime: 'end_time',
    end_time: 'end_time',
    dayOfWeek: 'day_of_week',
    day_of_week: 'day_of_week',
    recurringStartTime: 'recurring_start_time',
    recurring_start_time: 'recurring_start_time',
    recurringEndTime: 'recurring_end_time',
    recurring_end_time: 'recurring_end_time',
    isActive: 'is_active',
    is_active: 'is_active',
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

  values.push(blockId);

  const query = `
    UPDATE availability_blocks
    SET ${updateParts.join(', ')}
    WHERE id = $${paramCount}
    RETURNING
      id, user_id as "userId", type, date, start_time as "startTime", end_time as "endTime",
      day_of_week as "dayOfWeek", recurring_start_time as "recurringStartTime",
      recurring_end_time as "recurringEndTime", is_active as "isActive",
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Delete availability block
 * @param {string} blockId - Block ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteAvailabilityBlock(blockId) {
  const query = `
    DELETE FROM availability_blocks
    WHERE id = $1
  `;

  const result = await db.query(query, [blockId]);
  return result.rowCount > 0;
}

/**
 * Delete all availability blocks for a user
 * @param {string} userId - User ID
 * @param {string} type - Optional type filter
 * @returns {Promise<number>} - Number of deleted blocks
 */
async function deleteAllForUser(userId, type = null) {
  let query = `
    DELETE FROM availability_blocks
    WHERE user_id = $1
  `;

  const values = [userId];

  if (type) {
    query += ` AND type = $2`;
    values.push(type);
  }

  const result = await db.query(query, values);
  return result.rowCount;
}

/**
 * Get availability for a specific date range
 * @param {string} userId - User ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} - Array of availability blocks
 */
async function getAvailabilityForDateRange(userId, startDate, endDate) {
  const query = `
    SELECT
      id, user_id as "userId", type, date, start_time as "startTime", end_time as "endTime",
      day_of_week as "dayOfWeek", recurring_start_time as "recurringStartTime",
      recurring_end_time as "recurringEndTime", is_active as "isActive",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM availability_blocks
    WHERE user_id = $1 AND is_active = true
      AND (
        (type IN ('fully_free', 'partially_free') AND date BETWEEN $2 AND $3)
        OR type = 'recurring'
      )
    ORDER BY date NULLS LAST, start_time NULLS LAST
  `;

  const result = await db.query(query, [userId, startDate, endDate]);
  return result.rows;
}

module.exports = {
  createAvailabilityBlock,
  getAvailabilityByUserId,
  getAvailabilityBlockById,
  updateAvailabilityBlock,
  deleteAvailabilityBlock,
  deleteAllForUser,
  getAvailabilityForDateRange,
};
