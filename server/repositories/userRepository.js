/**
 * User Repository
 * Handles all database operations for users
 */

const db = require('../db');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
async function createUser({ email, password, name, profileIcon, preferences }) {
  const query = `
    INSERT INTO users (email, password, name, profile_icon, preferences)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, name, profile_icon as "profileIcon", preferences, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    email,
    password, // Should be hashed before calling this function
    name,
    profileIcon || null,
    preferences || {},
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Find user by email
 * @param {string} email - User email
 * @param {boolean} includePassword - Whether to include password hash
 * @returns {Promise<Object|null>} - User or null
 */
async function findByEmail(email, includePassword = false) {
  const fields = includePassword
    ? 'id, email, password, name, profile_icon as "profileIcon", preferences, created_at as "createdAt", updated_at as "updatedAt"'
    : 'id, email, name, profile_icon as "profileIcon", preferences, created_at as "createdAt", updated_at as "updatedAt"';

  const query = `
    SELECT ${fields}
    FROM users
    WHERE email = $1 AND deleted_at IS NULL
  `;

  const result = await db.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User or null
 */
async function findById(userId) {
  const query = `
    SELECT id, email, name, profile_icon as "profileIcon", preferences, created_at as "createdAt", updated_at as "updatedAt"
    FROM users
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated user
 */
async function updateProfile(userId, updates) {
  const allowedFields = ['name', 'profileIcon', 'preferences'];
  const updateParts = [];
  const values = [];
  let paramCount = 1;

  // Map camelCase to snake_case
  const fieldMap = {
    name: 'name',
    profileIcon: 'profile_icon',
    preferences: 'preferences',
  };

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      const dbField = fieldMap[key];
      updateParts.push(`${dbField} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (updateParts.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${updateParts.join(', ')}
    WHERE id = $${paramCount} AND deleted_at IS NULL
    RETURNING id, email, name, profile_icon as "profileIcon", preferences, created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} hashedPassword - New hashed password
 * @returns {Promise<boolean>} - Success
 */
async function updatePassword(userId, hashedPassword) {
  const query = `
    UPDATE users
    SET password = $1
    WHERE id = $2 AND deleted_at IS NULL
  `;

  const result = await db.query(query, [hashedPassword, userId]);
  return result.rowCount > 0;
}

/**
 * Soft delete user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
async function softDeleteUser(userId) {
  const query = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const result = await db.query(query, [userId]);
  return result.rowCount > 0;
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if exists
 */
async function emailExists(email) {
  const query = `
    SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)
  `;

  const result = await db.query(query, [email]);
  return result.rows[0].exists;
}

/**
 * Search users by email or name
 * @param {string} searchTerm - Search term
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of users
 */
async function searchUsers(searchTerm, limit = 10) {
  const query = `
    SELECT id, email, name, profile_icon as "profileIcon"
    FROM users
    WHERE (email ILIKE $1 OR name ILIKE $1) AND deleted_at IS NULL
    ORDER BY name
    LIMIT $2
  `;

  const result = await db.query(query, [`%${searchTerm}%`, limit]);
  return result.rows;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateProfile,
  updatePassword,
  softDeleteUser,
  emailExists,
  searchUsers,
};
