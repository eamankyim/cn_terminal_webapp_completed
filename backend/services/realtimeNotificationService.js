const NotificationService = require('./notificationService');

class RealtimeNotificationService {
  /**
   * Send real-time notification to user
   * @param {string} userId - Target user ID
   * @param {Object} notificationData - Notification data
   */
  static async sendRealtimeNotification(userId, notificationData) {
    try {
      // Create notification in database
      const notification = await NotificationService.createNotification({
        ...notificationData,
        userId
      });

      // Send real-time notification via WebSocket
      if (global.io) {
        console.log(`🌐 Sending WebSocket notification to user_${userId}`);
        global.io.to(`user_${userId}`).emit('new_notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
          job: notification.job,
          invoice: notification.invoice,
          payment: notification.payment
        });
        console.log(`✅ WebSocket notification sent to user_${userId}`);
      } else {
        console.log('⚠️ Global.io not available - notification saved to database only');
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send real-time notification to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   */
  static async sendRealtimeNotificationToMultiple(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.sendRealtimeNotification(userId, notificationData);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send real-time notification to all users (system-wide)
   * @param {Object} notificationData - Notification data
   */
  static async sendRealtimeNotificationToAll(notificationData) {
    try {
      // Create notifications for all users in database
      const notifications = await NotificationService.notifySystemAlert(
        notificationData.title,
        notificationData.message,
        notificationData.type,
        notificationData.metadata
      );

      // Send real-time notification to all connected users
      if (global.io) {
        global.io.emit('system_notification', {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          category: notificationData.category || 'SYSTEM_ALERT',
          createdAt: new Date().toISOString(),
          metadata: notificationData.metadata
        });
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify job assignment with real-time updates
   */
  static async notifyJobAssignmentRealtime(jobId, assignedToUserId, assignedByUserId) {
    try {
      // Create database notification
      const notification = await NotificationService.notifyJobAssignment(jobId, assignedToUserId, assignedByUserId);
      
      // Send real-time notification
      if (global.io && notification) {
        global.io.to(`user_${assignedToUserId}`).emit('new_notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
          job: notification.job
        });
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify job status change with real-time updates
   */
  static async notifyJobStatusChangeRealtime(jobId, oldStatus, newStatus, updatedByUserId) {
    try {
      // Create database notification
      const notification = await NotificationService.notifyJobStatusChange(jobId, oldStatus, newStatus, updatedByUserId);
      
      // Send real-time notification
      if (global.io && notification) {
        global.io.to(`user_${notification.userId}`).emit('new_notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
          job: notification.job
        });
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify invoice creation with real-time updates
   */
  static async notifyInvoiceCreatedRealtime(invoiceId, createdByUserId) {
    try {
      // Create database notification
      const notification = await NotificationService.notifyInvoiceCreated(invoiceId, createdByUserId);
      
      // Send real-time notification
      if (global.io && notification) {
        global.io.to(`user_${createdByUserId}`).emit('new_notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
          invoice: notification.invoice
        });
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Notify payment received with real-time updates
   */
  static async notifyPaymentReceivedRealtime(paymentId, createdByUserId) {
    try {
      // Create database notification
      const notification = await NotificationService.notifyPaymentReceived(paymentId, createdByUserId);
      
      // Send real-time notification
      if (global.io && notification) {
        global.io.to(`user_${createdByUserId}`).emit('new_notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          createdAt: notification.createdAt,
          isRead: notification.isRead,
          metadata: notification.metadata,
          payment: notification.payment
        });
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send real-time unread count update
   */
  static async sendUnreadCountUpdate(userId) {
    try {
      if (global.io) {
        // Get current unread count
        const { prisma } = require('../config/database');
        const count = await prisma.notification.count({
          where: {
            userId: userId,
            isRead: false
          }
        });

        // Send real-time update
        global.io.to(`user_${userId}`).emit('unread_count_update', {
          count: count
        });
      }
    } catch (error) {
    }
  }

  /**
   * Send real-time notification read status update
   */
  static async sendNotificationReadUpdate(userId, notificationId, isRead) {
    try {
      if (global.io) {
        global.io.to(`user_${userId}`).emit('notification_read_update', {
          notificationId: notificationId,
          isRead: isRead,
          readAt: isRead ? new Date().toISOString() : null
        });
      }
    } catch (error) {
    }
  }
}

module.exports = RealtimeNotificationService;
