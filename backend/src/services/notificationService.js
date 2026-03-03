/**
 * Notification Service
 * Handles in-app notifications stored in database
 */

const { pool } = require('../config/database');

/**
 * Create in-app notification
 * @param {number} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} relatedEntityType - Type of related entity
 * @param {number} relatedEntityId - ID of related entity
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(userId, type, title, message, relatedEntityType = null, relatedEntityId = null) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedEntityType, relatedEntityId]
    );
    
    console.log(`[Notification Service] Created notification for user ${userId}: ${title}`);
    
    return {
      id: result.insertId,
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user notifications
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Array>} Notifications
 */
async function getUserNotifications(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const [notifications] = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  
  return notifications;
}

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
async function getUnreadCount(userId) {
  const [result] = await pool.query(
    `SELECT COUNT(*) as count FROM notifications 
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  
  return result[0].count;
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security)
 * @returns {Promise<boolean>} Success status
 */
async function markAsRead(notificationId, userId) {
  const [result] = await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  
  return result.affectedRows > 0;
}

/**
 * Mark all notifications as read
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of notifications marked as read
 */
async function markAllAsRead(userId) {
  const [result] = await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  
  return result.affectedRows;
}

/**
 * Delete notification
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security)
 * @returns {Promise<boolean>} Success status
 */
async function deleteNotification(notificationId, userId) {
  const [result] = await pool.query(
    `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  
  return result.affectedRows > 0;
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
