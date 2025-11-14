/**
 * Group Repository
 * Handles all database operations for groups and group members
 */

const db = require('../db');

/**
 * Create a new group with owner
 * @param {Object} groupData - Group data
 * @param {string} userId - Creator user ID
 * @returns {Promise<Object>} - Created group with owner info
 */
async function createGroup({ name, description, type }, userId) {
  return await db.transaction(async (client) => {
    // Create group
    const groupQuery = `
      INSERT INTO groups (name, description, type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, type, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const groupResult = await client.query(groupQuery, [name, description || null, type || 'regular', userId]);
    const group = groupResult.rows[0];

    // Add creator as owner
    const memberQuery = `
      INSERT INTO group_members (group_id, user_id, role)
      VALUES ($1, $2, $3)
    `;

    await client.query(memberQuery, [group.id, userId, 'owner']);

    return group;
  });
}

/**
 * Get groups for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of groups with member info
 */
async function getGroupsByUserId(userId) {
  const query = `
    SELECT
      g.id,
      g.name,
      g.description,
      g.type,
      g.created_by as "createdBy",
      g.created_at as "createdAt",
      g.updated_at as "updatedAt",
      gm.role,
      COUNT(DISTINCT gm2.user_id)::int as "memberCount"
    FROM groups g
    INNER JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN group_members gm2 ON g.id = gm2.group_id
    WHERE gm.user_id = $1 AND g.deleted_at IS NULL
    GROUP BY g.id, g.name, g.description, g.type, g.created_by, g.created_at, g.updated_at, gm.role
    ORDER BY g.updated_at DESC
  `;

  const result = await db.query(query, [userId]);
  return result.rows;
}

/**
 * Get group by ID with member details
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID (to check membership)
 * @returns {Promise<Object|null>} - Group with members
 */
async function getGroupById(groupId, userId = null) {
  const query = `
    SELECT
      g.id,
      g.name,
      g.description,
      g.type,
      g.created_by as "createdBy",
      g.created_at as "createdAt",
      g.updated_at as "updatedAt"
    FROM groups g
    WHERE g.id = $1 AND g.deleted_at IS NULL
  `;

  const result = await db.query(query, [groupId]);

  if (result.rows.length === 0) {
    return null;
  }

  const group = result.rows[0];

  // Get members
  const membersQuery = `
    SELECT
      gm.user_id as "userId",
      gm.role,
      gm.joined_at as "joinedAt",
      u.name,
      u.email,
      u.profile_icon as "profileIcon"
    FROM group_members gm
    INNER JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = $1 AND u.deleted_at IS NULL
    ORDER BY
      CASE gm.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END,
      gm.joined_at
  `;

  const membersResult = await db.query(membersQuery, [groupId]);
  group.members = membersResult.rows;

  // Check if user is a member and add their role
  if (userId) {
    const userMember = group.members.find((m) => m.userId === userId);
    group.userRole = userMember ? userMember.role : null;
    group.isMember = !!userMember;
  }

  return group;
}

/**
 * Update group
 * @param {string} groupId - Group ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated group
 */
async function updateGroup(groupId, updates) {
  const allowedFields = ['name', 'description', 'type'];
  const updateParts = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateParts.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (updateParts.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(groupId);

  const query = `
    UPDATE groups
    SET ${updateParts.join(', ')}
    WHERE id = $${paramCount} AND deleted_at IS NULL
    RETURNING id, name, description, type, created_by as "createdBy", created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Soft delete group
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} - Success
 */
async function softDeleteGroup(groupId) {
  const query = `
    UPDATE groups
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
  `;

  const result = await db.query(query, [groupId]);
  return result.rowCount > 0;
}

/**
 * Add member to group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} role - Role (member, admin, owner)
 * @returns {Promise<Object>} - Membership record
 */
async function addMember(groupId, userId, role = 'member') {
  const query = `
    INSERT INTO group_members (group_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT unique_group_member DO NOTHING
    RETURNING id, group_id as "groupId", user_id as "userId", role, joined_at as "joinedAt"
  `;

  const result = await db.query(query, [groupId, userId, role]);
  return result.rows[0];
}

/**
 * Remove member from group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
async function removeMember(groupId, userId) {
  const query = `
    DELETE FROM group_members
    WHERE group_id = $1 AND user_id = $2
  `;

  const result = await db.query(query, [groupId, userId]);
  return result.rowCount > 0;
}

/**
 * Update member role
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} - Updated membership
 */
async function updateMemberRole(groupId, userId, role) {
  const query = `
    UPDATE group_members
    SET role = $3
    WHERE group_id = $1 AND user_id = $2
    RETURNING id, group_id as "groupId", user_id as "userId", role, joined_at as "joinedAt"
  `;

  const result = await db.query(query, [groupId, userId, role]);
  return result.rows[0];
}

/**
 * Get member role in group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} - Role or null
 */
async function getMemberRole(groupId, userId) {
  const query = `
    SELECT role
    FROM group_members
    WHERE group_id = $1 AND user_id = $2
  `;

  const result = await db.query(query, [groupId, userId]);
  return result.rows[0]?.role || null;
}

/**
 * Check if user is member of group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Is member
 */
async function isMember(groupId, userId) {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM group_members
      WHERE group_id = $1 AND user_id = $2
    )
  `;

  const result = await db.query(query, [groupId, userId]);
  return result.rows[0].exists;
}

module.exports = {
  createGroup,
  getGroupsByUserId,
  getGroupById,
  updateGroup,
  softDeleteGroup,
  addMember,
  removeMember,
  updateMemberRole,
  getMemberRole,
  isMember,
};
