const db = require('../config/database');

/**
 * AbuseReport Model
 * Handles abuse report data operations
 */

/**
 * Create new abuse report
 * @param {Object} reportData - Abuse report data
 * @returns {Promise<number>} Report ID
 */
async function create(reportData) {
  const {
    reporterId,
    trackingId,
    isAnonymous,
    latitude,
    longitude,
    stateDetails,
    aiGeneratedDescription,
    userEditedDescription,
    abuseType,
    abuseSeverity,
    aiConfidence
  } = reportData;

  const query = `
    INSERT INTO abuse_reports (
      reporter_id, tracking_id, is_anonymous, latitude, longitude, 
      state_details, ai_generated_description, user_edited_description,
      abuse_type, abuse_severity, ai_confidence, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
  `;

  const [result] = await db.execute(query, [
    reporterId || null,
    trackingId,
    isAnonymous,
    latitude,
    longitude,
    stateDetails,
    aiGeneratedDescription,
    userEditedDescription,
    abuseType,
    abuseSeverity,
    aiConfidence
  ]);

  return result.insertId;
}

/**
 * Find abuse report by ID
 * @param {number} id - Report ID
 * @returns {Promise<Object|null>} Report data
 */
async function findById(id) {
  const query = `
    SELECT ar.*, n.organization_name as ngo_name, n.user_id as ngo_user_id
    FROM abuse_reports ar
    LEFT JOIN ngos n ON ar.assigned_ngo_id = n.id
    WHERE ar.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find abuse report by tracking ID
 * @param {string} trackingId - Tracking ID
 * @returns {Promise<Object|null>} Report data
 */
async function findByTrackingId(trackingId) {
  const query = `
    SELECT ar.*, n.organization_name as ngo_name
    FROM abuse_reports ar
    LEFT JOIN ngos n ON ar.assigned_ngo_id = n.id
    WHERE ar.tracking_id = ?
  `;

  const [rows] = await db.execute(query, [trackingId]);
  return rows[0] || null;
}

/**
 * Find abuse reports by reporter ID
 * @param {number} reporterId - Reporter user ID
 * @returns {Promise<Array>} Array of reports
 */
async function findByReporterId(reporterId) {
  const query = `
    SELECT ar.*, n.organization_name as ngo_name
    FROM abuse_reports ar
    LEFT JOIN ngos n ON ar.assigned_ngo_id = n.id
    WHERE ar.reporter_id = ?
    ORDER BY ar.created_at DESC
  `;

  const [rows] = await db.execute(query, [reporterId]);
  return rows;
}

/**
 * Find abuse reports by NGO ID
 * @param {number} ngoId - NGO ID
 * @returns {Promise<Array>} Array of reports
 */
async function findByNGOId(ngoId) {
  const query = `
    SELECT ar.*, u.name as reporter_name, u.phone as reporter_phone
    FROM abuse_reports ar
    LEFT JOIN users u ON ar.reporter_id = u.id
    WHERE ar.assigned_ngo_id = ?
    ORDER BY ar.created_at DESC
  `;

  const [rows] = await db.execute(query, [ngoId]);
  return rows;
}

/**
 * Assign abuse report to NGO
 * @param {number} reportId - Report ID
 * @param {number} ngoId - NGO ID
 * @returns {Promise<void>}
 */
async function assignToNGO(reportId, ngoId) {
  const query = `
    UPDATE abuse_reports 
    SET assigned_ngo_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(query, [ngoId, reportId]);
}

/**
 * Update abuse report status
 * @param {number} reportId - Report ID
 * @param {string} status - New status
 * @param {string} notes - Optional notes
 * @returns {Promise<void>}
 */
async function updateStatus(reportId, status, notes = null) {
  const updateQuery = `
    UPDATE abuse_reports 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const historyQuery = `
    INSERT INTO abuse_status_history (abuse_report_id, status, notes)
    VALUES (?, ?, ?)
  `;

  await db.execute(updateQuery, [status, reportId]);
  await db.execute(historyQuery, [reportId, status, notes]);
}

/**
 * Add media to abuse report
 * @param {number} reportId - Report ID
 * @param {string} mediaType - 'image' or 'video'
 * @param {string} s3Url - S3 URL
 * @param {string} s3Key - S3 key
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<void>}
 */
async function addMedia(reportId, mediaType, s3Url, s3Key, fileSize) {
  const query = `
    INSERT INTO abuse_media (abuse_report_id, media_type, s3_url, s3_key, file_size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `;

  await db.execute(query, [reportId, mediaType, s3Url, s3Key, fileSize]);
}

/**
 * Get media files for abuse report
 * @param {number} reportId - Report ID
 * @returns {Promise<Array>} Array of media files
 */
async function getMedia(reportId) {
  const query = `
    SELECT * FROM abuse_media 
    WHERE abuse_report_id = ?
    ORDER BY uploaded_at ASC
  `;

  const [rows] = await db.execute(query, [reportId]);
  return rows;
}

/**
 * Get status history for abuse report
 * @param {number} reportId - Report ID
 * @returns {Promise<Array>} Array of status history
 */
async function getStatusHistory(reportId) {
  const query = `
    SELECT * FROM abuse_status_history 
    WHERE abuse_report_id = ?
    ORDER BY created_at ASC
  `;

  const [rows] = await db.execute(query, [reportId]);
  return rows;
}

/**
 * Generate unique tracking ID
 * @returns {string} Tracking ID
 */
function generateTrackingId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ABU-${year}-${random}-${suffix}`;
}

module.exports = {
  create,
  findById,
  findByTrackingId,
  findByReporterId,
  findByNGOId,
  assignToNGO,
  updateStatus,
  addMedia,
  getMedia,
  getStatusHistory,
  generateTrackingId
};