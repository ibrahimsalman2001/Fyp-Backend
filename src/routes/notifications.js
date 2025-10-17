const express = require('express');
const { query, param, validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('type').optional().isIn(['goal', 'alert', 'achievement', 'family', 'system']).withMessage('Invalid notification type'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        unreadOnly = false
      } = req.query;

      const result = await notificationService.getUserNotifications(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        unreadOnly: unreadOnly === 'true'
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }
);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user._id);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: { notification }
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(error.message === 'Notification not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read'
      });
    }
  }
);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const modifiedCount = await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: `${modifiedCount} notifications marked as read`,
      data: { modifiedCount }
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      await notificationService.deleteNotification(req.params.id, req.user._id);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(error.message === 'Notification not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete notification'
      });
    }
  }
);

module.exports = router;