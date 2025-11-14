/**
 * Meeting Proposal Repository
 * Handles all database operations for meeting proposals and responses
 */

const db = require('../db');

/**
 * Create a meeting proposal with responses
 * @param {Object} proposalData - Proposal data
 * @param {Array} responses - Array of response objects
 * @returns {Promise<Object>} - Created proposal with responses
 */
async function createProposal(proposalData, responses) {
  return await db.transaction(async (client) => {
    // Create proposal
    const proposalQuery = `
      INSERT INTO meeting_proposals (group_id, proposed_by, title, description, proposed_date, proposed_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING
        id, group_id as "groupId", proposed_by as "proposedBy",
        title, description, proposed_date as "proposedDate",
        proposed_time as "proposedTime", status,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const proposalValues = [
      proposalData.groupId,
      proposalData.proposedBy,
      proposalData.title,
      proposalData.description || null,
      proposalData.proposedDate,
      proposalData.proposedTime,
    ];

    const proposalResult = await client.query(proposalQuery, proposalValues);
    const proposal = proposalResult.rows[0];

    // Create responses
    const responseValues = [];
    const responsePlaceholders = [];

    responses.forEach((response, index) => {
      const baseIndex = index * 5 + 1;
      responsePlaceholders.push(
        `($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
      );
      responseValues.push(
        proposal.id,
        response.userId,
        response.userName,
        response.userEmail,
        response.responseToken
      );
    });

    if (responses.length > 0) {
      const responseQuery = `
        INSERT INTO proposal_responses (proposal_id, user_id, user_name, user_email, response_token)
        VALUES ${responsePlaceholders.join(', ')}
        RETURNING
          id, proposal_id as "proposalId", user_id as "userId",
          user_name as "userName", user_email as "userEmail",
          response, alternate_date as "alternateDate",
          alternate_time as "alternateTime", alternate_message as "alternateMessage",
          response_token as "responseToken", responded_at as "respondedAt",
          created_at as "createdAt"
      `;

      const responseResult = await client.query(responseQuery, responseValues);
      proposal.responses = responseResult.rows;
    } else {
      proposal.responses = [];
    }

    return proposal;
  });
}

/**
 * Get proposals by group ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Array>} - Array of proposals with responses
 */
async function getProposalsByGroupId(groupId) {
  const query = `
    SELECT
      mp.id, mp.group_id as "groupId", mp.proposed_by as "proposedBy",
      mp.title, mp.description, mp.proposed_date as "proposedDate",
      mp.proposed_time as "proposedTime", mp.status,
      mp.created_at as "createdAt", mp.updated_at as "updatedAt",
      u.name as "proposedByName",
      g.name as "groupName"
    FROM meeting_proposals mp
    INNER JOIN users u ON mp.proposed_by = u.id
    INNER JOIN groups g ON mp.group_id = g.id
    WHERE mp.group_id = $1 AND g.deleted_at IS NULL
    ORDER BY mp.created_at DESC
  `;

  const result = await db.query(query, [groupId]);
  const proposals = result.rows;

  // Get responses for each proposal
  for (const proposal of proposals) {
    proposal.responses = await getResponsesByProposalId(proposal.id);
  }

  return proposals;
}

/**
 * Get proposal by ID
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object|null>} - Proposal with responses or null
 */
async function getProposalById(proposalId) {
  const query = `
    SELECT
      mp.id, mp.group_id as "groupId", mp.proposed_by as "proposedBy",
      mp.title, mp.description, mp.proposed_date as "proposedDate",
      mp.proposed_time as "proposedTime", mp.status,
      mp.created_at as "createdAt", mp.updated_at as "updatedAt",
      u.name as "proposedByName",
      g.name as "groupName"
    FROM meeting_proposals mp
    INNER JOIN users u ON mp.proposed_by = u.id
    INNER JOIN groups g ON mp.group_id = g.id
    WHERE mp.id = $1 AND g.deleted_at IS NULL
  `;

  const result = await db.query(query, [proposalId]);

  if (result.rows.length === 0) {
    return null;
  }

  const proposal = result.rows[0];
  proposal.responses = await getResponsesByProposalId(proposal.id);

  return proposal;
}

/**
 * Get proposal by response token
 * @param {string} token - Response token
 * @returns {Promise<Object|null>} - Proposal with response or null
 */
async function getProposalByToken(token) {
  const query = `
    SELECT
      mp.id, mp.group_id as "groupId", mp.proposed_by as "proposedBy",
      mp.title, mp.description, mp.proposed_date as "proposedDate",
      mp.proposed_time as "proposedTime", mp.status,
      mp.created_at as "createdAt", mp.updated_at as "updatedAt",
      u.name as "proposedByName",
      g.name as "groupName",
      pr.id as "responseId", pr.user_email as "userEmail"
    FROM meeting_proposals mp
    INNER JOIN proposal_responses pr ON mp.id = pr.proposal_id
    INNER JOIN users u ON mp.proposed_by = u.id
    INNER JOIN groups g ON mp.group_id = g.id
    WHERE pr.response_token = $1 AND g.deleted_at IS NULL
  `;

  const result = await db.query(query, [token]);
  return result.rows[0] || null;
}

/**
 * Get responses by proposal ID
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Array>} - Array of responses
 */
async function getResponsesByProposalId(proposalId) {
  const query = `
    SELECT
      id, proposal_id as "proposalId", user_id as "userId",
      user_name as "userName", user_email as "userEmail",
      response, alternate_date as "alternateDate",
      alternate_time as "alternateTime", alternate_message as "alternateMessage",
      response_token as "responseToken", responded_at as "respondedAt",
      created_at as "createdAt"
    FROM proposal_responses
    WHERE proposal_id = $1
    ORDER BY created_at
  `;

  const result = await db.query(query, [proposalId]);
  return result.rows;
}

/**
 * Update proposal response
 * @param {string} token - Response token
 * @param {Object} responseData - Response data
 * @returns {Promise<Object>} - Updated response
 */
async function updateResponse(token, responseData) {
  const query = `
    UPDATE proposal_responses
    SET
      response = $1,
      alternate_date = $2,
      alternate_time = $3,
      alternate_message = $4,
      responded_at = CURRENT_TIMESTAMP
    WHERE response_token = $5
    RETURNING
      id, proposal_id as "proposalId", user_id as "userId",
      user_name as "userName", user_email as "userEmail",
      response, alternate_date as "alternateDate",
      alternate_time as "alternateTime", alternate_message as "alternateMessage",
      response_token as "responseToken", responded_at as "respondedAt",
      created_at as "createdAt"
  `;

  const values = [
    responseData.response,
    responseData.alternateDate || null,
    responseData.alternateTime || null,
    responseData.alternateMessage || null,
    token,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Update proposal status
 * @param {string} proposalId - Proposal ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated proposal
 */
async function updateProposalStatus(proposalId, status) {
  const query = `
    UPDATE meeting_proposals
    SET status = $1
    WHERE id = $2
    RETURNING
      id, group_id as "groupId", proposed_by as "proposedBy",
      title, description, proposed_date as "proposedDate",
      proposed_time as "proposedTime", status,
      created_at as "createdAt", updated_at as "updatedAt"
  `;

  const result = await db.query(query, [status, proposalId]);
  return result.rows[0];
}

/**
 * Delete proposal
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteProposal(proposalId) {
  const query = `
    DELETE FROM meeting_proposals
    WHERE id = $1
  `;

  const result = await db.query(query, [proposalId]);
  return result.rowCount > 0;
}

module.exports = {
  createProposal,
  getProposalsByGroupId,
  getProposalById,
  getProposalByToken,
  getResponsesByProposalId,
  updateResponse,
  updateProposalStatus,
  deleteProposal,
};
