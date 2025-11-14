/**
 * Calendar Integration Repository
 * Handles all database operations for calendar integrations
 * Encrypts/decrypts OAuth tokens
 */

const db = require('../db');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Create a calendar integration
 * @param {Object} integrationData - Integration data
 * @returns {Promise<Object>} - Created integration
 */
async function createIntegration({
  userId,
  provider,
  accountEmail,
  accessToken,
  refreshToken,
  expiresAt,
  calendarId,
  calendarName,
}) {
  const query = `
    INSERT INTO calendar_integrations (
      user_id, provider, account_email, is_connected,
      access_token, refresh_token, expires_at,
      calendar_id, calendar_name, last_sync
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id, user_id as "userId", provider, account_email as "accountEmail",
      is_connected as "isConnected", expires_at as "expiresAt",
      calendar_id as "calendarId", calendar_name as "calendarName",
      last_sync as "lastSync", created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    userId,
    provider,
    accountEmail,
    true,
    accessToken ? encrypt(accessToken) : null,
    refreshToken ? encrypt(refreshToken) : null,
    expiresAt || null,
    calendarId || null,
    calendarName || null,
    null, // last_sync
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Get calendar integrations by user ID
 * @param {string} userId - User ID
 * @param {boolean} includeTokens - Whether to decrypt and include tokens
 * @returns {Promise<Array>} - Array of integrations
 */
async function getIntegrationsByUserId(userId, includeTokens = false) {
  const query = `
    SELECT
      id, user_id as "userId", provider, account_email as "accountEmail",
      is_connected as "isConnected",
      ${includeTokens ? 'access_token, refresh_token,' : ''}
      expires_at as "expiresAt",
      calendar_id as "calendarId", calendar_name as "calendarName",
      last_sync as "lastSync", created_at as "createdAt", updated_at as "updatedAt"
    FROM calendar_integrations
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await db.query(query, [userId]);

  if (includeTokens) {
    return result.rows.map((row) => ({
      ...row,
      accessToken: row.access_token ? decrypt(row.access_token) : null,
      refreshToken: row.refresh_token ? decrypt(row.refresh_token) : null,
      access_token: undefined,
      refresh_token: undefined,
    }));
  }

  return result.rows;
}

/**
 * Get integration by ID
 * @param {string} integrationId - Integration ID
 * @param {boolean} includeTokens - Whether to decrypt and include tokens
 * @returns {Promise<Object|null>} - Integration or null
 */
async function getIntegrationById(integrationId, includeTokens = false) {
  const query = `
    SELECT
      id, user_id as "userId", provider, account_email as "accountEmail",
      is_connected as "isConnected",
      ${includeTokens ? 'access_token, refresh_token,' : ''}
      expires_at as "expiresAt",
      calendar_id as "calendarId", calendar_name as "calendarName",
      last_sync as "lastSync", created_at as "createdAt", updated_at as "updatedAt"
    FROM calendar_integrations
    WHERE id = $1
  `;

  const result = await db.query(query, [integrationId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  if (includeTokens) {
    return {
      ...row,
      accessToken: row.access_token ? decrypt(row.access_token) : null,
      refreshToken: row.refresh_token ? decrypt(row.refresh_token) : null,
      access_token: undefined,
      refresh_token: undefined,
    };
  }

  return row;
}

/**
 * Update integration tokens
 * @param {string} integrationId - Integration ID
 * @param {Object} tokens - New tokens
 * @returns {Promise<Object>} - Updated integration
 */
async function updateTokens(integrationId, { accessToken, refreshToken, expiresAt }) {
  const query = `
    UPDATE calendar_integrations
    SET
      access_token = $1,
      refresh_token = COALESCE($2, refresh_token),
      expires_at = $3
    WHERE id = $4
    RETURNING
      id, user_id as "userId", provider, account_email as "accountEmail",
      is_connected as "isConnected", expires_at as "expiresAt",
      calendar_id as "calendarId", calendar_name as "calendarName",
      last_sync as "lastSync", created_at as "createdAt", updated_at as "updatedAt"
  `;

  const values = [
    encrypt(accessToken),
    refreshToken ? encrypt(refreshToken) : null,
    expiresAt || null,
    integrationId,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Update last sync time
 * @param {string} integrationId - Integration ID
 * @returns {Promise<boolean>} - Success
 */
async function updateLastSync(integrationId) {
  const query = `
    UPDATE calendar_integrations
    SET last_sync = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  const result = await db.query(query, [integrationId]);
  return result.rowCount > 0;
}

/**
 * Disconnect integration
 * @param {string} integrationId - Integration ID
 * @returns {Promise<boolean>} - Success
 */
async function disconnectIntegration(integrationId) {
  const query = `
    UPDATE calendar_integrations
    SET is_connected = false
    WHERE id = $1
  `;

  const result = await db.query(query, [integrationId]);
  return result.rowCount > 0;
}

/**
 * Delete integration
 * @param {string} integrationId - Integration ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteIntegration(integrationId) {
  const query = `
    DELETE FROM calendar_integrations
    WHERE id = $1
  `;

  const result = await db.query(query, [integrationId]);
  return result.rowCount > 0;
}

/**
 * Get integration by provider and user
 * @param {string} userId - User ID
 * @param {string} provider - Provider ('google' | 'ical')
 * @param {string} accountEmail - Account email
 * @returns {Promise<Object|null>} - Integration or null
 */
async function getIntegrationByProvider(userId, provider, accountEmail) {
  const query = `
    SELECT
      id, user_id as "userId", provider, account_email as "accountEmail",
      is_connected as "isConnected", access_token, refresh_token, expires_at as "expiresAt",
      calendar_id as "calendarId", calendar_name as "calendarName",
      last_sync as "lastSync", created_at as "createdAt", updated_at as "updatedAt"
    FROM calendar_integrations
    WHERE user_id = $1 AND provider = $2 AND account_email = $3
  `;

  const result = await db.query(query, [userId, provider, accountEmail]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    ...row,
    accessToken: row.access_token ? decrypt(row.access_token) : null,
    refreshToken: row.refresh_token ? decrypt(row.refresh_token) : null,
    access_token: undefined,
    refresh_token: undefined,
  };
}

module.exports = {
  createIntegration,
  getIntegrationsByUserId,
  getIntegrationById,
  updateTokens,
  updateLastSync,
  disconnectIntegration,
  deleteIntegration,
  getIntegrationByProvider,
};
