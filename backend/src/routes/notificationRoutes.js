const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

/**
 * Get user notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await notificationService.getUserNotifications(
      req.user.userId,
      page,
      limit
    );
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * Get unread count
 */
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const success = await notificationService.markAsRead(
      parseInt(req.params.id),
      req.user.userId
    );
    
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * Mark all as read
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true, message: `${count} notifications marked as read` });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * Delete notification
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const success = await notificationService.deleteNotification(
      parseInt(req.params.id),
      req.user.userId
    );
    
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
