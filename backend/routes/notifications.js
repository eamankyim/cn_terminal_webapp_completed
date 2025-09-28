const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const RealtimeNotificationService = require('../services/realtimeNotificationService');

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(unreadOnly === 'true' && { isRead: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: req.user.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Send real-time update
    await RealtimeNotificationService.sendNotificationReadUpdate(req.user.id, id, true);
    await RealtimeNotificationService.sendUnreadCountUpdate(req.user.id);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Delete all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 */
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    // First get all notifications to send individual delete updates
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      select: { id: true }
    });

    // Delete all notifications for the user
    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.user.id
      }
    });

    // Send real-time updates for notification deletions and unread count
    if (global.io) {
      // Send individual notification delete updates
      allNotifications.forEach(notification => {
        global.io.to(`user_${req.user.id}`).emit('notification_deleted', {
          notificationId: notification.id
        });
      });
      
      // Send unread count update (will be 0 since all notifications are deleted)
      global.io.to(`user_${req.user.id}`).emit('unread_count_update', {
        count: 0
      });
      
      console.log(`📡 Sent delete updates for ${allNotifications.length} notifications to user ${req.user.id}`);
    }

    res.json({
      success: true,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to delete all notifications' });
  }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id,
        userId: req.user.id
      }
    });

    // Send real-time update for unread count
    await RealtimeNotificationService.sendUnreadCountUpdate(req.user.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

/**
 * @swagger
 * /api/notifications/test-realtime:
 *   post:
 *     summary: Test real-time notification functionality
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 default: "Test Notification"
 *               message:
 *                 type: string
 *                 default: "This is a test real-time notification"
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, ERROR, URGENT]
 *                 default: INFO
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 */
router.post('/test-realtime', authenticateToken, async (req, res) => {
  try {
    const { title = 'Test Notification', message = 'This is a test real-time notification', type = 'INFO' } = req.body;

    await RealtimeNotificationService.sendRealtimeNotification(req.user.id, {
      title,
      message,
      type,
      category: 'TEST'
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

module.exports = router;
