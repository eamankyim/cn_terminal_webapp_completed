const { prisma } = require('../config/database');

class NotificationService {
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

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create job assignment notification
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

    return this.createNotification({
      title: 'New Job Assignment',
      message: `You have been assigned to job ${job.trackingId} for ${job.customer.name}`,
      type: 'INFO',
      category: 'JOB_ASSIGNMENT',
      userId: assignedToUserId,
      jobId: jobId,
      metadata: {
        jobTrackingId: job.trackingId,
        customerName: job.customer.name,
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
      'INVOICED': 'Invoice has been generated',
      'ENTRY': 'Job is being processed for entry',
      'RELEASE': 'Job is ready for release',
      'CLEARED': 'Job has been cleared',
      'DELIVERED': 'Job has been delivered'
    };

    return this.createNotification({
      title: 'Job Status Updated',
      message: `Job ${job.trackingId} status changed from ${oldStatus} to ${newStatus}`,
      type: 'INFO',
      category: 'JOB_STATUS_CHANGE',
      userId: job.assignedToId,
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

    return this.createNotification({
      title: 'New Invoice Created',
      message: `Invoice ${invoice.invoiceNumber} has been created for job ${invoice.job.trackingId}`,
      type: 'SUCCESS',
      category: 'INVOICE_CREATED',
      userId: createdByUserId,
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

    return this.createNotification({
      title: 'Invoice Status Updated',
      message: `Invoice ${invoice.invoiceNumber} status changed to ${newStatus}`,
      type: newStatus === 'PAID' ? 'SUCCESS' : 'WARNING',
      category: 'INVOICE_STATUS_CHANGE',
      userId: updatedByUserId,
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

    return this.createNotification({
      title: 'Payment Received',
      message: `Payment of GHS ${payment.amount} received for invoice ${payment.invoice.invoiceNumber}`,
      type: 'SUCCESS',
      category: 'PAYMENT_RECEIVED',
      userId: createdByUserId,
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

      // Create notifications for all users
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

      return notifications;
    } catch (error) {
      console.error('Error creating system alert:', error);
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

      console.log(`Cleaned up ${result.count} expired notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
