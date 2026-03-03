const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Create a new user
   */
  static async create(email, password, role, name, phone = null) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, name, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, hashedPassword, role, name, phone]
    );
    
    return result.insertId;
  }
  
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return users[0] || null;
  }
  
  /**
   * Find user by ID
   */
  static async findById(id) {
    const [users] = await pool.query(
      'SELECT id, email, role, name, phone, created_at, is_active FROM users WHERE id = ?',
      [id]
    );
    
    return users[0] || null;
  }
  
  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  /**
   * Update user profile
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.phone) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = User;
