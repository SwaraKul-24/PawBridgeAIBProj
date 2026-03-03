const db = require('../config/database');

/**
 * Donation Model
 * Handles donation and distribution data operations
 */

/**
 * Create new donation
 * @param {Object} donationData - Donation data
 * @returns {Promise<number>} Donation ID
 */
async function create(donationData) {
  const {
    citizenId,
    totalAmount,
    donorLatitude,
    donorLongitude,
    donorState,
    searchRadius,
    transactionId
  } = donationData;

  const query = `
    INSERT INTO donations (
      citizen_id, total_amount, donor_latitude, donor_longitude,
      donor_state, search_radius, transaction_id, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const [result] = await db.execute(query, [
    citizenId,
    totalAmount,
    donorLatitude,
    donorLongitude,
    donorState || null,
    searchRadius,
    transactionId || null
  ]);

  return result.insertId;
}

/**
 * Find donation by ID
 * @param {number} id - Donation ID
 * @returns {Promise<Object|null>} Donation data
 */
async function findById(id) {
  const query = `
    SELECT d.*, u.name as donor_name, u.email as donor_email
    FROM donations d
    JOIN users u ON d.citizen_id = u.id
    WHERE d.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find donations by citizen ID
 * @param {number} citizenId - Citizen user ID
 * @returns {Promise<Array>} Array of donations
 */
async function findByCitizenId(citizenId) {
  const query = `
    SELECT * FROM donations 
    WHERE citizen_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(query, [citizenId]);
  return rows;
}

/**
 * Update donation payment status
 * @param {number} id - Donation ID
 * @param {string} status - Payment status ('pending', 'completed', 'failed')
 * @param {string} transactionId - Transaction ID from payment gateway
 * @returns {Promise<void>}
 */
async function updatePaymentStatus(id, status, transactionId = null) {
  const query = `
    UPDATE donations 
    SET payment_status = ?, transaction_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(query, [status, transactionId, id]);
}

/**
 * Create donation distribution record
 * @param {number} donationId - Donation ID
 * @param {number} ngoId - NGO ID
 * @param {number} distributedAmount - Amount distributed to this NGO
 * @returns {Promise<void>}
 */
async function createDistribution(donationId, ngoId, distributedAmount) {
  const query = `
    INSERT INTO donation_distributions (donation_id, ngo_id, distributed_amount)
    VALUES (?, ?, ?)
  `;

  await db.execute(query, [donationId, ngoId, distributedAmount]);
}

/**
 * Get distribution details for donation
 * @param {number} donationId - Donation ID
 * @returns {Promise<Array>} Array of distribution records
 */
async function getDistributions(donationId) {
  const query = `
    SELECT dd.*, n.organization_name as ngo_name, n.user_id as ngo_user_id
    FROM donation_distributions dd
    JOIN ngos n ON dd.ngo_id = n.id
    WHERE dd.donation_id = ?
    ORDER BY dd.created_at ASC
  `;

  const [rows] = await db.execute(query, [donationId]);
  return rows;
}

/**
 * Get donations received by NGO
 * @param {number} ngoId - NGO ID
 * @returns {Promise<Array>} Array of received donations
 */
async function findByNGOId(ngoId) {
  const query = `
    SELECT dd.*, d.total_amount, d.created_at as donation_date,
           u.name as donor_name
    FROM donation_distributions dd
    JOIN donations d ON dd.donation_id = d.id
    JOIN users u ON d.citizen_id = u.id
    WHERE dd.ngo_id = ? AND d.payment_status = 'completed'
    ORDER BY d.created_at DESC
  `;

  const [rows] = await db.execute(query, [ngoId]);
  return rows;
}

/**
 * Update NGO total donations
 * @param {number} ngoId - NGO ID
 * @param {number} amount - Amount to add
 * @returns {Promise<void>}
 */
async function updateNGOTotalDonations(ngoId, amount) {
  const query = `
    UPDATE ngos 
    SET total_donations = total_donations + ?
    WHERE id = ?
  `;

  await db.execute(query, [amount, ngoId]);
}

/**
 * Get donation statistics
 * @returns {Promise<Object>} Donation statistics
 */
async function getStatistics() {
  const queries = {
    totalDonations: 'SELECT COUNT(*) as count, SUM(total_amount) as total FROM donations WHERE payment_status = "completed"',
    totalNGOsReceived: 'SELECT COUNT(DISTINCT ngo_id) as count FROM donation_distributions',
    avgDonationAmount: 'SELECT AVG(total_amount) as avg FROM donations WHERE payment_status = "completed"',
    donationsThisMonth: `
      SELECT COUNT(*) as count, SUM(total_amount) as total 
      FROM donations 
      WHERE payment_status = "completed" 
      AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `
  };

  const results = {};
  
  for (const [key, query] of Object.entries(queries)) {
    const [rows] = await db.execute(query);
    results[key] = rows[0];
  }

  return results;
}

/**
 * Get top NGOs by donations received
 * @param {number} limit - Number of NGOs to return
 * @returns {Promise<Array>} Array of NGOs with donation totals
 */
async function getTopNGOsByDonations(limit = 10) {
  const query = `
    SELECT n.id, n.organization_name, n.total_donations,
           COUNT(dd.id) as donation_count
    FROM ngos n
    LEFT JOIN donation_distributions dd ON n.id = dd.ngo_id
    WHERE n.total_donations > 0
    GROUP BY n.id, n.organization_name, n.total_donations
    ORDER BY n.total_donations DESC
    LIMIT ?
  `;

  const [rows] = await db.execute(query, [limit]);
  return rows;
}

/**
 * Find donation by transaction ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object|null>} Donation data
 */
async function findByTransactionId(transactionId) {
  const query = `
    SELECT * FROM donations 
    WHERE transaction_id = ?
  `;

  const [rows] = await db.execute(query, [transactionId]);
  return rows[0] || null;
}

module.exports = {
  create,
  findById,
  findByCitizenId,
  updatePaymentStatus,
  createDistribution,
  getDistributions,
  findByNGOId,
  updateNGOTotalDonations,
  getStatistics,
  getTopNGOsByDonations,
  findByTransactionId
};