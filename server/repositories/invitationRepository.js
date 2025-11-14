/**
 * Invitation Repository
 * Handles all database operations for group invitations
 */

const db = require('../db');

/**
 * Create an invitation
 * @param {Object} invitationData - Invitation data
 * @returns {Promise<Object>} - Created invitation
 */
async function createInvitation({ fromUserId, toUserId, groupId }) {
  const query = `
    INSERT INTO invitations (from_user_id, to_user_id, group_id, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING
      id,
      from_user_id as "fromUserId",
      to_user_id as "toUserId",
      group_id as "groupId",
      status,
      created_at as "createdAt",
      responded_at as "respondedAt"
  `;

  const result = await db.query(query, [fromUserId, toUserId, groupId]);
  return result.rows[0];
}

/**
 * Get invitations for a user
 * @param {string} userId - User ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} - Array of invitations
 */
async function getInvitationsByUserId(userId, status = null) {
  let query = `
    SELECT
      i.id,
      i.from_user_id as "fromUserId",
      i.to_user_id as "toUserId",
      i.group_id as "groupId",
      i.status,
      i.created_at as "createdAt",
      i.responded_at as "respondedAt",
      u.name as "fromUserName",
      u.email as "fromUserEmail",
      g.name as "groupName",
      g.type as "groupType"
    FROM invitations i
    INNER JOIN users u ON i.from_user_id = u.id
    INNER JOIN groups g ON i.group_id = g.id
    WHERE i.to_user_id = $1 AND g.deleted_at IS NULL
  `;

  const values = [userId];

  if (status) {
    query += ` AND i.status = $2`;
    values.push(status);
  }

  query += ` ORDER BY i.created_at DESC`;

  const result = await db.query(query, values);
  return result.rows;
}

/**
 * Get invitation by ID
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<Object|null>} - Invitation or null
 */
async function getInvitationById(invitationId) {
  const query = `
    SELECT
      i.id,
      i.from_user_id as "fromUserId",
      i.to_user_id as "toUserId",
      i.group_id as "groupId",
      i.status,
      i.created_at as "createdAt",
      i.responded_at as "respondedAt",
      u.name as "fromUserName",
      g.name as "groupName"
    FROM invitations i
    INNER JOIN users u ON i.from_user_id = u.id
    INNER JOIN groups g ON i.group_id = g.id
    WHERE i.id = $1 AND g.deleted_at IS NULL
  `;

  const result = await db.query(query, [invitationId]);
  return result.rows[0] || null;
}

/**
 * Update invitation status
 * @param {string} invitationId - Invitation ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated invitation
 */
async function updateInvitationStatus(invitationId, status) {
  const query = `
    UPDATE invitations
    SET status = $1, responded_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      from_user_id as "fromUserId",
      to_user_id as "toUserId",
      group_id as "groupId",
      status,
      created_at as "createdAt",
      responded_at as "respondedAt"
  `;

  const result = await db.query(query, [status, invitationId]);
  return result.rows[0];
}

/**
 * Check if invitation exists
 * @param {string} groupId - Group ID
 * @param {string} toUserId - To user ID
 * @param {string} status - Status to check
 * @returns {Promise<boolean>} - Exists
 */
async function invitationExists(groupId, toUserId, status = 'pending') {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM invitations
      WHERE group_id = $1 AND to_user_id = $2 AND status = $3
    )
  `;

  const result = await db.query(query, [groupId, toUserId, status]);
  return result.rows[0].exists;
}

/**
 * Delete invitation
 * @param {string} invitationId - Invitation ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteInvitation(invitationId) {
  const query = `
    DELETE FROM invitations
    WHERE id = $1
  `;

  const result = await db.query(query, [invitationId]);
  return result.rowCount > 0;
}

/**
 * Get pending invitations count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Count
 */
async function getPendingInvitationsCount(userId) {
  const query = `
    SELECT COUNT(*)::int as count
    FROM invitations i
    INNER JOIN groups g ON i.group_id = g.id
    WHERE i.to_user_id = $1 AND i.status = 'pending' AND g.deleted_at IS NULL
  `;

  const result = await db.query(query, [userId]);
  return result.rows[0].count;
}

module.exports = {
  createInvitation,
  getInvitationsByUserId,
  getInvitationById,
  updateInvitationStatus,
  invitationExists,
  deleteInvitation,
  getPendingInvitationsCount,
};
