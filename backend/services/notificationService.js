const { prisma } = require('../config/database');

class NotificationService {
  /**
   * Helper method to create notifications for all active users
   */
  static async createNotificationForAllUsers(notificationData) {
    try {
      // Get all active users (including ADMIN)
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, role: true }
      });

      console.log(`🔔 [NotificationService] Creating notifications for ${allUsers.length} users`);
      console.log(`  - Users: ${allUsers.map(u => `${u.name} (${u.role})`).join(', ')}`);

      // Create notifications for all users
      const notifications = await Promise.all(
        allUsers.map(user => {
          console.log(`  📤 Creating notification for ${user.name} (${user.role}) - ID: ${user.id}`);
          return this.createNotification({
            ...notificationData,
            userId: user.id
          });
        })
      );

      console.log(`✅ [NotificationService] Created ${notifications.length} notifications`);
      return notifications;
    } catch (error) {
      console.error('❌ [NotificationService] Error creating notifications for all users:', error);
      throw error;
    }
  }
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {string} notificationData.type - Notification type (INFO, SUCCESS, WARNING, ERROR, URGENT)
   * @param {string} notificationData.category - Notification category
   * @param {string} notificationData.userId - Target user ID
   * @param {string} notificationData.jobId - Related job ID (optional)
   * @param {string} notificationData.invoiceId - Related invoice ID (optional)
   * @param {string} notificationData.paymentId - Related payment ID (optional)
   * @param {Object} notificationData.metadata - Additional metadata (optional)
   * @param {Date} notificationData.expiresAt - Expiration date (optional)
   */
  static async createNotification(notificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'INFO',
          category: notificationData.category,
          userId: notificationData.userId,
          jobId: notificationData.jobId,
          invoiceId: notificationData.invoiceId,
          paymentId: notificationData.paymentId,
          metadata: notificationData.metadata,
          expiresAt: notificationData.expiresAt
        },
        include: {
          job: {
            select: {
              id: true,
              trackingId: true,
              status: true
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              amount: true
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true
            }
          }
        }
      });

      // Emit real-time notification to ALL users (broadcast)
      if (global.io) {
        try {
          console.log(`🌐 [NotificationService] Broadcasting real-time notification to ALL users`);
          console.log(`  - Notification ID: ${notification.id}`);
          console.log(`  - Title: ${notification.title}`);
          console.log(`  - User ID: ${notification.userId || 'N/A'}`);
          
          const notificationPayload = {
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
          };
          
          // Broadcast to all connected users (this includes Admin)
          global.io.emit('new_notification', notificationPayload);
          console.log(`✅ [NotificationService] Real-time notification broadcasted to all connected users`);
          
          // Also send to specific user room if userId is provided (for targeted delivery)
          if (notification.userId) {
            global.io.to(`user_${notification.userId}`).emit('new_notification', notificationPayload);
            console.log(`✅ [NotificationService] Also sent to user room: user_${notification.userId}`);
            
            // Update unread count for the specific user
            const RealtimeNotificationService = require('./realtimeNotificationService');
            if (RealtimeNotificationService?.sendUnreadCountUpdate) {
              await RealtimeNotificationService.sendUnreadCountUpdate(notification.userId);
            }
        } catch (socketError) {
          console.error('❌ [NotificationService] Error emitting real-time notification:', socketError);
          // Don't fail the notification creation if socket emission fails
        }
      } else {
        console.warn('⚠️ [NotificationService] Global.io not available - notification saved to database only');
      }

      return notification;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Create job assignment notification (notifies all users)
   */
  static async notifyJobAssignment(jobId, assignedToUserId, assignedByUserId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } }
      }
    });

    if (!job) return;

    // Create notifications for ALL users
    return this.createNotificationForAllUsers({
      title: 'New Job Assignment',
      message: `Job ${job.trackingId} for ${job.customer.name} has been assigned to ${job.assignedTo?.name || 'a team member'}`,
      type: 'INFO',
      category: 'JOB_ASSIGNMENT',
      jobId: jobId,
      metadata: {
        jobTrackingId: job.trackingId,
        customerName: job.customer.name,
        assignedTo: assignedToUserId,
        assignedBy: assignedByUserId
      }
    });
  }

  /**
   * Create job status change notification
   */
  static async notifyJobStatusChange(jobId, oldStatus, newStatus, updatedByUserId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } }
      }
    });

    if (!job) return;

    const statusMessages = {
      'NEW': 'Job has been created',
      'PREINVOICED': 'Job is ready for invoicing',
      'VETTED': 'Job has been vetted and reviewed',
      'ENTRY': 'Job is being processed for entry',
      'RELEASED': 'Job has been released',
      'CLEARED': 'Job has been cleared',
      'DELIVERED': 'Job has been delivered'
    };

    // Create notifications for ALL users
    return this.createNotificationForAllUsers({
      title: 'Job Status Updated',
      message: `Job ${job.trackingId} for ${job.customer.name} status changed from ${oldStatus} to ${newStatus}`,
      type: 'INFO',
      category: 'JOB_STATUS_CHANGE',
      jobId: jobId,
      metadata: {
        jobTrackingId: job.trackingId,
        oldStatus,
        newStatus,
        customerName: job.customer.name,
        updatedBy: updatedByUserId
      }
    });
  }

  /**
   * Create invoice created notification
   */
  static async notifyInvoiceCreated(invoiceId, createdByUserId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { select: { name: true } },
        job: { select: { trackingId: true } }
      }
    });

    if (!invoice) return;

    // Create notifications for ALL users
    return this.createNotificationForAllUsers({
      title: 'New Invoice Created',
      message: `Invoice ${invoice.invoiceNumber} has been created for job ${invoice.job.trackingId} (${invoice.customer.name})`,
      type: 'SUCCESS',
      category: 'INVOICE_CREATED',
      invoiceId: invoiceId,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        customerName: invoice.customer.name,
        jobTrackingId: invoice.job.trackingId
      }
    });
  }

  /**
   * Create invoice status change notification
   */
  static async notifyInvoiceStatusChange(invoiceId, oldStatus, newStatus, updatedByUserId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { select: { name: true } },
        job: { select: { trackingId: true } }
      }
    });

    if (!invoice) return;

    const statusMessages = {
      'PENDING': 'Invoice is pending payment',
      'PAID': 'Invoice has been paid',
      'OVERDUE': 'Invoice is overdue',
      'CANCELLED': 'Invoice has been cancelled'
    };

    // Create notifications for ALL users
    return this.createNotificationForAllUsers({
      title: 'Invoice Status Updated',
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} status changed to ${newStatus}`,
      type: newStatus === 'PAID' ? 'SUCCESS' : 'WARNING',
      category: 'INVOICE_STATUS_CHANGE',
      invoiceId: invoiceId,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        oldStatus,
        newStatus,
        customerName: invoice.customer.name,
        jobTrackingId: invoice.job.trackingId
      }
    });
  }

  /**
   * Create payment received notification
   */
  static async notifyPaymentReceived(paymentId, createdByUserId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            customer: { select: { name: true } },
            job: { select: { trackingId: true } }
          }
        }
      }
    });

    if (!payment || !payment.invoice) return;

    // Create notifications for ALL users
    return this.createNotificationForAllUsers({
      title: 'Payment Received',
      message: `Payment of GHS ${payment.amount} received for invoice ${payment.invoice.invoiceNumber} (${payment.invoice.customer.name})`,
      type: 'SUCCESS',
      category: 'PAYMENT_RECEIVED',
      paymentId: paymentId,
      metadata: {
        amount: payment.amount,
        invoiceNumber: payment.invoice.invoiceNumber,
        customerName: payment.invoice.customer.name,
        jobTrackingId: payment.invoice.job.trackingId,
        paymentMethod: payment.paymentMethod
      }
    });
  }

  /**
   * Create user invitation notification
   */
  static async notifyUserInvitation(invitationId, invitedByUserId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        invitedByUser: { select: { name: true } }
      }
    });

    if (!invitation) return;

    // This would typically be sent via email, but we can also create an in-app notification
    // for the inviter to track invitation status
    return this.createNotification({
      title: 'User Invitation Sent',
      message: `Invitation sent to ${invitation.email} with ${invitation.role} role`,
      type: 'INFO',
      category: 'USER_INVITATION',
      userId: invitedByUserId,
      metadata: {
        invitedEmail: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      },
      expiresAt: invitation.expiresAt
    });
  }

  /**
   * Create system alert notification for all users
   */
  static async notifySystemAlert(title, message, type = 'INFO', metadata = {}) {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      // Create notifications for all users (each will emit real-time via createNotification)
      const notifications = await Promise.all(
        users.map(user => 
          this.createNotification({
            title,
            message,
            type,
            category: 'SYSTEM_ALERT',
            userId: user.id,
            metadata
          })
        )
      );

      // Also emit system-wide notification to all connected users
      if (global.io) {
        try {
          console.log('🌐 [NotificationService] Emitting system-wide notification to all connected users');
          global.io.emit('system_notification', {
            title,
            message,
            type,
            category: 'SYSTEM_ALERT',
            createdAt: new Date().toISOString(),
            metadata
          });
          console.log('✅ [NotificationService] System-wide notification emitted');
        } catch (socketError) {
          console.error('❌ [NotificationService] Error emitting system notification:', socketError);
        }
      }

      return notifications;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return result.count;
    } catch (error) {

      throw error;
    }
  }
}

module.exports = NotificationService;
