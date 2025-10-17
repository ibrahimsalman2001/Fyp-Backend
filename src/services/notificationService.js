const Notification = require('../models/Notification');

class NotificationService {
  
  // Create a new notification
  async createNotification(userId, type, title, message, options = {}) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        priority: options.priority || 'medium',
        actionUrl: options.actionUrl || null,
        metadata: options.metadata || {}
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      unreadOnly = false
    } = options;

    const query = { userId };
    
    if (type) query.type = type;
    if (unreadOnly) query.read = false;

    const notifications = await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    return result.modifiedCount;
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  // Create goal achievement notification
  async createGoalAchievementNotification(userId, goalType, achievedMinutes, targetMinutes) {
    const title = `🎉 ${goalType} Goal Achieved!`;
    const message = `Congratulations! You've reached your ${goalType.toLowerCase()} goal of ${targetMinutes} minutes today (${achievedMinutes} minutes watched).`;

    return this.createNotification(userId, 'achievement', title, message, {
      priority: 'medium',
      metadata: { goalType, achievedMinutes, targetMinutes }
    });
  }

  // Create content warning notification
  async createContentWarningNotification(userId, videoTitle, flags) {
    const title = '⚠️ Content Warning';
    const message = `The video "${videoTitle}" contains potentially inappropriate content: ${flags.join(', ')}.`;

    return this.createNotification(userId, 'alert', title, message, {
      priority: 'high',
      metadata: { videoTitle, flags }
    });
  }

  // Create productivity reminder notification
  async createProductivityReminder(userId, currentScore, suggestion) {
    const title = '📊 Productivity Update';
    const message = `Your productivity score today is ${currentScore}%. ${suggestion}`;

    return this.createNotification(userId, 'goal', title, message, {
      priority: 'low',
      metadata: { currentScore, suggestion }
    });
  }

  // Create family alert notification (for parents)
  async createFamilyAlert(parentId, childName, alertType, details) {
    const title = `👨‍👩‍👧‍👦 Family Alert - ${childName}`;
    let message = '';

    switch (alertType) {
      case 'inappropriate_content':
        message = `${childName} watched content that may be inappropriate: ${details.videoTitle}`;
        break;
      case 'goal_exceeded':
        message = `${childName} exceeded their ${details.goalType} limit by ${details.exceededBy} minutes`;
        break;
      case 'bedtime_violation':
        message = `${childName} was active on YouTube during bedtime hours`;
        break;
      default:
        message = `${childName} requires attention: ${details.reason}`;
    }

    return this.createNotification(parentId, 'family', title, message, {
      priority: 'high',
      actionUrl: '/parental',
      metadata: { childName, alertType, details }
    });
  }

  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, read: false });
  }

  // Clean old notifications (older than 30 days)
  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      read: true
    });

    console.log(`Cleaned ${result.deletedCount} old notifications`);
    return result.deletedCount;
  }
}

module.exports = new NotificationService();