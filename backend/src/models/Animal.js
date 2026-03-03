const db = require('../config/database');

/**
 * Animal Model
 * Handles animal listing data operations for adoption
 */

/**
 * Create new animal listing
 * @param {Object} animalData - Animal data
 * @returns {Promise<number>} Animal ID
 */
async function create(animalData) {
  const {
    ngoId,
    name,
    species,
    breed,
    ageYears,
    ageMonths,
    gender,
    healthStatus,
    description
  } = animalData;

  const query = `
    INSERT INTO animals (
      ngo_id, name, species, breed, age_years, age_months,
      gender, health_status, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
  `;

  const [result] = await db.execute(query, [
    ngoId,
    name,
    species,
    breed || null,
    ageYears || null,
    ageMonths || null,
    gender,
    healthStatus,
    description
  ]);

  return result.insertId;
}

/**
 * Find animal by ID
 * @param {number} id - Animal ID
 * @returns {Promise<Object|null>} Animal data
 */
async function findById(id) {
  const query = `
    SELECT a.*, n.organization_name as ngo_name, n.user_id as ngo_user_id,
           u.name as ngo_contact_name, u.phone as ngo_contact_phone
    FROM animals a
    JOIN ngos n ON a.ngo_id = n.id
    JOIN users u ON n.user_id = u.id
    WHERE a.id = ?
  `;

  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}

/**
 * Find all available animals with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of animals
 */
async function findAvailable(filters = {}) {
  let query = `
    SELECT a.*, n.organization_name as ngo_name
    FROM animals a
    JOIN ngos n ON a.ngo_id = n.id
    WHERE a.status = 'available'
  `;

  const params = [];

  if (filters.species) {
    query += ' AND a.species = ?';
    params.push(filters.species);
  }

  if (filters.gender) {
    query += ' AND a.gender = ?';
    params.push(filters.gender);
  }

  if (filters.maxAge) {
    query += ' AND (a.age_years IS NULL OR a.age_years <= ?)';
    params.push(filters.maxAge);
  }

  if (filters.ngoId) {
    query += ' AND a.ngo_id = ?';
    params.push(filters.ngoId);
  }

  query += ' ORDER BY a.created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(parseInt(filters.limit));
  }

  const [rows] = await db.execute(query, params);
  return rows;
}

/**
 * Find animals by NGO ID
 * @param {number} ngoId - NGO ID
 * @returns {Promise<Array>} Array of animals
 */
async function findByNGOId(ngoId) {
  const query = `
    SELECT * FROM animals 
    WHERE ngo_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(query, [ngoId]);
  return rows;
}

/**
 * Update animal
 * @param {number} id - Animal ID
 * @param {Object} updateData - Update data
 * @returns {Promise<void>}
 */
async function update(id, updateData) {
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

  const query = `UPDATE animals SET ${fields.join(', ')} WHERE id = ?`;
  await db.execute(query, params);
}

/**
 * Update animal status
 * @param {number} id - Animal ID
 * @param {string} status - New status ('available', 'pending', 'adopted')
 * @returns {Promise<void>}
 */
async function updateStatus(id, status) {
  const query = `
    UPDATE animals 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(query, [status, id]);
}

/**
 * Delete animal
 * @param {number} id - Animal ID
 * @returns {Promise<void>}
 */
async function deleteById(id) {
  const query = 'DELETE FROM animals WHERE id = ?';
  await db.execute(query, [id]);
}

/**
 * Add image to animal
 * @param {number} animalId - Animal ID
 * @param {string} imagePath - Image path/URL
 * @param {boolean} isPrimary - Is primary image
 * @returns {Promise<void>}
 */
async function addImage(animalId, imagePath, isPrimary = false) {
  // If setting as primary, unset other primary images first
  if (isPrimary) {
    await db.execute(
      'UPDATE animal_images SET is_primary = FALSE WHERE animal_id = ?',
      [animalId]
    );
  }

  const query = `
    INSERT INTO animal_images (animal_id, image_path, is_primary)
    VALUES (?, ?, ?)
  `;

  await db.execute(query, [animalId, imagePath, isPrimary]);
}

/**
 * Get images for animal
 * @param {number} animalId - Animal ID
 * @returns {Promise<Array>} Array of images
 */
async function getImages(animalId) {
  const query = `
    SELECT * FROM animal_images 
    WHERE animal_id = ?
    ORDER BY is_primary DESC, uploaded_at ASC
  `;

  const [rows] = await db.execute(query, [animalId]);
  return rows;
}

/**
 * Remove image from animal
 * @param {number} imageId - Image ID
 * @returns {Promise<void>}
 */
async function removeImage(imageId) {
  const query = 'DELETE FROM animal_images WHERE id = ?';
  await db.execute(query, [imageId]);
}

/**
 * Search animals by text
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of animals
 */
async function search(searchTerm) {
  const query = `
    SELECT a.*, n.organization_name as ngo_name
    FROM animals a
    JOIN ngos n ON a.ngo_id = n.id
    WHERE a.status = 'available' 
    AND (
      a.name LIKE ? OR 
      a.breed LIKE ? OR 
      a.description LIKE ? OR
      n.organization_name LIKE ?
    )
    ORDER BY a.created_at DESC
  `;

  const searchPattern = `%${searchTerm}%`;
  const [rows] = await db.execute(query, [
    searchPattern, searchPattern, searchPattern, searchPattern
  ]);
  
  return rows;
}

module.exports = {
  create,
  findById,
  findAvailable,
  findByNGOId,
  update,
  updateStatus,
  deleteById,
  addImage,
  getImages,
  removeImage,
  search
};