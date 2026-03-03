const db = require('../config/database');

/**
 * Adoption Model
 * Handles adoption request data operations
 */

/**
 * Create new adoption request
 * @param {Object} adoptionData - Adoption request data
 * @returns {Promise<number>} Adoption request ID
 */
async function create(adoptionData) {
  const {
    animalId,
    citizenId,
    message
  } = adoptionData;

  const query = `
    INSERT INTO adoption_requests (animal_id, citizen_id, message, status)
    VALUES (?, ?, ?, 'pending')
  `;

  const [result] = await db.execute(query, [animalId, citizenId, message || null]);
  return result.insertId;
}

/**
 * Find adoption request by ID
 * @param {number} id - Adoption request ID
 * @returns {Promise<Object|null>} Adoption request data
 */
async function findById(id) {
  const query = `
    SELECT ar.*, 
           a.name as animal_name, a.species, a.breed, a.age_years, a.age_months,
           u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone,
           n.organization_name as ngo_name, n.user_id as ngo_user_id
    FROM adoption_requests ar
    JOIN animals a ON ar.animal_id = a.id
    JOIN users u ON ar.citizen_id = u.id
    JOIN ngos n ON a.ngo_id = n.id
    WHERE ar.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find adoption requests by citizen ID
 * @param {number} citizenId - Citizen user ID
 * @returns {Promise<Array>} Array of adoption requests
 */
async function findByCitizenId(citizenId) {
  const query = `
    SELECT ar.*, 
           a.name as animal_name, a.species, a.breed,
           n.organization_name as ngo_name
    FROM adoption_requests ar
    JOIN animals a ON ar.animal_id = a.id
    JOIN ngos n ON a.ngo_id = n.id
    WHERE ar.citizen_id = ?
    ORDER BY ar.created_at DESC
  `;

  const [rows] = await db.execute(query, [citizenId]);
  return rows;
}

/**
 * Find adoption requests by NGO ID
 * @param {number} ngoId - NGO ID
 * @returns {Promise<Array>} Array of adoption requests
 */
async function findByNGOId(ngoId) {
  const query = `
    SELECT ar.*, 
           a.name as animal_name, a.species, a.breed, a.age_years, a.age_months,
           u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone
    FROM adoption_requests ar
    JOIN animals a ON ar.animal_id = a.id
    JOIN users u ON ar.citizen_id = u.id
    WHERE a.ngo_id = ?
    ORDER BY ar.created_at DESC
  `;

  const [rows] = await db.execute(query, [ngoId]);
  return rows;
}

/**
 * Find adoption requests by animal ID
 * @param {number} animalId - Animal ID
 * @returns {Promise<Array>} Array of adoption requests
 */
async function findByAnimalId(animalId) {
  const query = `
    SELECT ar.*, 
           u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone
    FROM adoption_requests ar
    JOIN users u ON ar.citizen_id = u.id
    WHERE ar.animal_id = ?
    ORDER BY ar.created_at DESC
  `;

  const [rows] = await db.execute(query, [animalId]);
  return rows;
}

/**
 * Update adoption request status
 * @param {number} id - Adoption request ID
 * @param {string} status - New status ('pending', 'approved', 'rejected')
 * @param {string} ngoNotes - Optional NGO notes
 * @returns {Promise<void>}
 */
async function updateStatus(id, status, ngoNotes = null) {
  const query = `
    UPDATE adoption_requests 
    SET status = ?, ngo_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(query, [status, ngoNotes, id]);
}

/**
 * Check if citizen has pending request for animal
 * @param {number} citizenId - Citizen user ID
 * @param {number} animalId - Animal ID
 * @returns {Promise<boolean>} True if pending request exists
 */
async function hasPendingRequest(citizenId, animalId) {
  const query = `
    SELECT COUNT(*) as count
    FROM adoption_requests 
    WHERE citizen_id = ? AND animal_id = ? AND status = 'pending'
  `;

  const [rows] = await db.execute(query, [citizenId, animalId]);
  return rows[0].count > 0;
}

/**
 * Get adoption statistics
 * @returns {Promise<Object>} Adoption statistics
 */
async function getStatistics() {
  const queries = {
    totalRequests: 'SELECT COUNT(*) as count FROM adoption_requests',
    pendingRequests: 'SELECT COUNT(*) as count FROM adoption_requests WHERE status = "pending"',
    approvedRequests: 'SELECT COUNT(*) as count FROM adoption_requests WHERE status = "approved"',
    rejectedRequests: 'SELECT COUNT(*) as count FROM adoption_requests WHERE status = "rejected"',
    requestsThisMonth: `
      SELECT COUNT(*) as count 
      FROM adoption_requests 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `
  };

  const results = {};
  
  for (const [key, query] of Object.entries(queries)) {
    const [rows] = await db.execute(query);
    results[key] = rows[0].count;
  }

  return results;
}

/**
 * Delete adoption request
 * @param {number} id - Adoption request ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  const query = 'DELETE FROM adoption_requests WHERE id = ?';
  await db.execute(query, [id]);
}

module.exports = {
  create,
  findById,
  findByCitizenId,
  findByNGOId,
  findByAnimalId,
  updateStatus,
  hasPendingRequest,
  getStatistics,
  deleteById
};