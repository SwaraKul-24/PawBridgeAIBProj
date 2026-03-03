const { pool } = require('../config/database');

class NGO {
  /**
   * Create NGO profile
   */
  static async create(ngoData) {
    const {
      userId,
      organizationName,
      registrationNumber,
      address,
      latitude,
      longitude,
      state,
      description,
      website
    } = ngoData;
    
    const [result] = await pool.query(
      `INSERT INTO ngos 
       (user_id, organization_name, registration_number, address, latitude, longitude, state, description, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, organizationName, registrationNumber, address, latitude, longitude, state, description, website]
    );
    
    return result.insertId;
  }
  
  /**
   * Find NGO by user ID
   */
  static async findByUserId(userId) {
    const [ngos] = await pool.query(
      'SELECT * FROM ngos WHERE user_id = ?',
      [userId]
    );
    
    return ngos[0] || null;
  }
  
  /**
   * Find NGO by ID
   */
  static async findById(id) {
    const [ngos] = await pool.query(
      'SELECT * FROM ngos WHERE id = ?',
      [id]
    );
    
    return ngos[0] || null;
  }
  
  /**
   * Get all active NGOs
   */
  static async findAll() {
    const [ngos] = await pool.query(
      `SELECT n.*, u.email, u.phone 
       FROM ngos n
       JOIN users u ON n.user_id = u.id
       WHERE u.is_active = TRUE`
    );
    
    return ngos;
  }
  
  /**
   * Update NGO profile
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    
    const allowedFields = ['organization_name', 'address', 'latitude', 'longitude', 'state', 'description', 'website'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE ngos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }
  
  /**
   * Update total donations
   */
  static async updateDonations(id, amount) {
    const [result] = await pool.query(
      'UPDATE ngos SET total_donations = total_donations + ? WHERE id = ?',
      [amount, id]
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = NGO;
