const { pool } = require('../config/database');

class Report {
  /**
   * Create a new injury report
   */
  static async create(reportData) {
    const {
      citizenId,
      latitude,
      longitude,
      aiGeneratedDescription,
      userEditedDescription,
      animalType,
      injurySeverity,
      aiConfidence
    } = reportData;
    
    const [result] = await pool.query(
      `INSERT INTO reports 
       (citizen_id, latitude, longitude, ai_generated_description, user_edited_description, 
        animal_type, injury_severity, ai_confidence, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [citizenId, latitude, longitude, aiGeneratedDescription, userEditedDescription,
       animalType, injurySeverity, aiConfidence]
    );
    
    return result.insertId;
  }
  
  /**
   * Find report by ID
   */
  static async findById(id) {
    const [reports] = await pool.query(
      `SELECT r.*, u.name as citizen_name, u.email as citizen_email,
              n.organization_name as ngo_name
       FROM reports r
       LEFT JOIN users u ON r.citizen_id = u.id
       LEFT JOIN ngos n ON r.assigned_ngo_id = n.id
       WHERE r.id = ?`,
      [id]
    );
    
    return reports[0] || null;
  }
  
  /**
   * Get reports by citizen ID
   */
  static async findByCitizenId(citizenId) {
    const [reports] = await pool.query(
      `SELECT r.*, n.organization_name as ngo_name
       FROM reports r
       LEFT JOIN ngos n ON r.assigned_ngo_id = n.id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC`,
      [citizenId]
    );
    
    return reports;
  }
  
  /**
   * Get reports by NGO ID
   */
  static async findByNGOId(ngoId) {
    const [reports] = await pool.query(
      `SELECT r.*, u.name as citizen_name, u.phone as citizen_phone
       FROM reports r
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.assigned_ngo_id = ?
       ORDER BY r.created_at DESC`,
      [ngoId]
    );
    
    return reports;
  }
  
  /**
   * Update report status
   */
  static async updateStatus(id, status, notes = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update report status
      await connection.query(
        'UPDATE reports SET status = ? WHERE id = ?',
        [status, id]
      );
      
      // Add to status history
      await connection.query(
        'INSERT INTO report_status_history (report_id, status, notes) VALUES (?, ?, ?)',
        [id, status, notes]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Assign report to NGO
   */
  static async assignToNGO(reportId, ngoId) {
    const [result] = await pool.query(
      `UPDATE reports 
       SET assigned_ngo_id = ?, status = 'assigned', allocation_attempts = allocation_attempts + 1
       WHERE id = ?`,
      [ngoId, reportId]
    );
    
    return result.affectedRows > 0;
  }
  
  /**
   * Get status history
   */
  static async getStatusHistory(reportId) {
    const [history] = await pool.query(
      `SELECT * FROM report_status_history 
       WHERE report_id = ? 
       ORDER BY created_at ASC`,
      [reportId]
    );
    
    return history;
  }
  
  /**
   * Add report image
   */
  static async addImage(reportId, imagePath) {
    const [result] = await pool.query(
      'INSERT INTO report_images (report_id, image_path) VALUES (?, ?)',
      [reportId, imagePath]
    );
    
    return result.insertId;
  }
  
  /**
   * Get report images
   */
  static async getImages(reportId) {
    const [images] = await pool.query(
      'SELECT * FROM report_images WHERE report_id = ?',
      [reportId]
    );
    
    return images;
  }
}

module.exports = Report;
