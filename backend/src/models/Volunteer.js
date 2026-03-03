const db = require('../config/database');

/**
 * Volunteer Model
 * Handles volunteer profile and opportunity data operations
 */

/**
 * Create or update volunteer profile
 * @param {Object} volunteerData - Volunteer data
 * @returns {Promise<number>} Volunteer ID
 */
async function createOrUpdate(volunteerData) {
  const {
    userId,
    skills,
    availability,
    latitude,
    longitude,
    bio
  } = volunteerData;

  // Check if volunteer profile already exists
  const existing = await findByUserId(userId);
  
  if (existing) {
    // Update existing profile
    const query = `
      UPDATE volunteers 
      SET skills = ?, availability = ?, latitude = ?, longitude = ?, bio = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;

    await db.execute(query, [skills, availability, latitude, longitude, bio, userId]);
    return existing.id;
  } else {
    // Create new profile
    const query = `
      INSERT INTO volunteers (user_id, skills, availability, latitude, longitude, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [userId, skills, availability, latitude, longitude, bio]);
    return result.insertId;
  }
}

/**
 * Find volunteer by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Volunteer data
 */
async function findByUserId(userId) {
  const query = `
    SELECT v.*, u.name, u.email, u.phone
    FROM volunteers v
    JOIN users u ON v.user_id = u.id
    WHERE v.user_id = ?
  `;

  const [rows] = await db.execute(query, [userId]);
  return rows[0] || null;
}

/**
 * Find volunteer by ID
 * @param {number} id - Volunteer ID
 * @returns {Promise<Object|null>} Volunteer data
 */
async function findById(id) {
  const query = `
    SELECT v.*, u.name, u.email, u.phone
    FROM volunteers v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find all volunteers with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of volunteers
 */
async function findAll(filters = {}) {
  let query = `
    SELECT v.*, u.name, u.email, u.phone
    FROM volunteers v
    JOIN users u ON v.user_id = u.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.skills) {
    query += ' AND v.skills LIKE ?';
    params.push(`%${filters.skills}%`);
  }

  if (filters.availability) {
    query += ' AND v.availability LIKE ?';
    params.push(`%${filters.availability}%`);
  }

  if (filters.location && filters.radius) {
    // Add distance calculation if location filtering is needed
    query += ` AND (
      6371 * acos(
        cos(radians(?)) * cos(radians(v.latitude)) * 
        cos(radians(v.longitude) - radians(?)) + 
        sin(radians(?)) * sin(radians(v.latitude))
      )
    ) <= ?`;
    params.push(filters.location.lat, filters.location.lng, filters.location.lat, filters.radius);
  }

  query += ' ORDER BY v.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  const [rows] = await db.execute(query, params);
  return rows;
}

/**
 * Delete volunteer profile
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteByUserId(userId) {
  const query = 'DELETE FROM volunteers WHERE user_id = ?';
  await db.execute(query, [userId]);
}

/**
 * Create volunteering opportunity
 * @param {Object} opportunityData - Opportunity data
 * @returns {Promise<number>} Opportunity ID
 */
async function createOpportunity(opportunityData) {
  const {
    ngoId,
    title,
    description,
    requiredSkills,
    location,
    latitude,
    longitude,
    date,
    time
  } = opportunityData;

  const query = `
    INSERT INTO volunteering_opportunities (
      ngo_id, title, description, required_skills, location,
      latitude, longitude, date, time, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `;

  const [result] = await db.execute(query, [
    ngoId,
    title,
    description,
    requiredSkills || null,
    location || null,
    latitude || null,
    longitude || null,
    date || null,
    time || null
  ]);

  return result.insertId;
}

/**
 * Find opportunity by ID
 * @param {number} id - Opportunity ID
 * @returns {Promise<Object|null>} Opportunity data
 */
async function findOpportunityById(id) {
  const query = `
    SELECT vo.*, n.organization_name as ngo_name, n.user_id as ngo_user_id,
           u.name as ngo_contact_name, u.phone as ngo_contact_phone, u.email as ngo_contact_email
    FROM volunteering_opportunities vo
    JOIN ngos n ON vo.ngo_id = n.id
    JOIN users u ON n.user_id = u.id
    WHERE vo.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find opportunities with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of opportunities
 */
async function findOpportunities(filters = {}) {
  let query = `
    SELECT vo.*, n.organization_name as ngo_name
    FROM volunteering_opportunities vo
    JOIN ngos n ON vo.ngo_id = n.id
    WHERE vo.status = 'open'
  `;

  const params = [];

  if (filters.ngoId) {
    query += ' AND vo.ngo_id = ?';
    params.push(filters.ngoId);
  }

  if (filters.skills) {
    query += ' AND vo.required_skills LIKE ?';
    params.push(`%${filters.skills}%`);
  }

  if (filters.date) {
    query += ' AND vo.date = ?';
    params.push(filters.date);
  }

  if (filters.location && filters.radius) {
    query += ` AND (
      6371 * acos(
        cos(radians(?)) * cos(radians(vo.latitude)) * 
        cos(radians(vo.longitude) - radians(?)) + 
        sin(radians(?)) * sin(radians(vo.latitude))
      )
    ) <= ?`;
    params.push(filters.location.lat, filters.location.lng, filters.location.lat, filters.radius);
  }

  query += ' ORDER BY vo.date ASC, vo.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  const [rows] = await db.execute(query, params);
  return rows;
}

/**
 * Find opportunities by NGO ID
 * @param {number} ngoId - NGO ID
 * @returns {Promise<Array>} Array of opportunities
 */
async function findOpportunitiesByNGOId(ngoId) {
  const query = `
    SELECT * FROM volunteering_opportunities 
    WHERE ngo_id = ?
    ORDER BY date ASC, created_at DESC
  `;

  const [rows] = await db.execute(query, [ngoId]);
  return rows;
}

/**
 * Update opportunity
 * @param {number} id - Opportunity ID
 * @param {Object} updateData - Update data
 * @returns {Promise<void>}
 */
async function updateOpportunity(id, updateData) {
  const fields = [];
  const params = [];

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      // Convert camelCase to snake_case for database
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbField} = ?`);
      params.push(updateData[key]);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const query = `UPDATE volunteering_opportunities SET ${fields.join(', ')} WHERE id = ?`;
  await db.execute(query, params);
}

/**
 * Update opportunity status
 * @param {number} id - Opportunity ID
 * @param {string} status - New status ('open', 'filled', 'completed')
 * @returns {Promise<void>}
 */
async function updateOpportunityStatus(id, status) {
  const query = `
    UPDATE volunteering_opportunities 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(query, [status, id]);
}

/**
 * Delete opportunity
 * @param {number} id - Opportunity ID
 * @returns {Promise<void>}
 */
async function deleteOpportunity(id) {
  const query = 'DELETE FROM volunteering_opportunities WHERE id = ?';
  await db.execute(query, [id]);
}

/**
 * Search volunteers by skills
 * @param {string} skillsQuery - Skills search query
 * @returns {Promise<Array>} Array of matching volunteers
 */
async function searchBySkills(skillsQuery) {
  const query = `
    SELECT v.*, u.name, u.email, u.phone
    FROM volunteers v
    JOIN users u ON v.user_id = u.id
    WHERE v.skills LIKE ?
    ORDER BY v.created_at DESC
  `;

  const [rows] = await db.execute(query, [`%${skillsQuery}%`]);
  return rows;
}

module.exports = {
  createOrUpdate,
  findByUserId,
  findById,
  findAll,
  deleteByUserId,
  createOpportunity,
  findOpportunityById,
  findOpportunities,
  findOpportunitiesByNGOId,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  searchBySkills
};