const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: integer
 *                       description: Total number of jobs
 *                     activeShipments:
 *                       type: integer
 *                       description: Number of active shipments
 *                     totalClients:
 *                       type: integer
 *                       description: Total number of clients
 *                     revenueThisMonth:
 *                       type: number
 *                       description: Revenue for current month
 *                     workflowStatuses:
 *                       type: object
 *                       description: Count of jobs by status
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get dashboard statistics
router.get('/stats', authenticateToken, requirePermission(UI_PERMISSIONS.DASHBOARD), async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get total counts
    const [
      totalJobs,
      totalClients,
      totalShipments,
      totalConsignments,
      totalInvoices,
      totalPayments,
      jobsDelivered
    ] = await Promise.all([
      prisma.job.count(),
      prisma.customer.count(), // This is actually clients in your system
      prisma.shipment.count(),
      prisma.consignment.count(),
      prisma.invoice.count(),
      prisma.payment.count(),
      prisma.job.count({
        where: {
          status: 'DELIVERED'
        }
      })
    ]);

    // Get jobs in progress (excluding NEW, CLEARED, DELIVERED)
    const jobsInProgress = await prisma.job.count({
      where: {
        status: {
          notIn: ['NEW', 'CLEARED', 'DELIVERED']
        }
      }
    });

    // Get revenue this month
    const revenueThisMonth = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get workflow status counts
    const workflowStatuses = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const workflowStatusCounts = workflowStatuses.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // Get recent activities (last 10 activities from different tables)
    const [recentJobs, recentPayments, recentInvoices] = await Promise.all([
      // Recent jobs - using only fields that exist in current schema
      prisma.job.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          trackingId: true,
          status: true,
          createdAt: true,
          customer: {
            select: { name: true }
          }
        }
      }),
      // Recent payments
      prisma.payment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            include: {
              customer: {
                select: { name: true }
              }
            }
          }
        }
      }),
      // Recent invoices
      prisma.invoice.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          }
        }
      })
    ]);

    // Format recent activities
    const activities = [
      ...recentJobs.map(job => ({
        type: 'job',
        action: `New job ${job.trackingId} created`,
        time: job.createdAt,
        user: job.customer.name,
        id: job.id
      })),
      ...recentPayments.map(payment => ({
        type: 'payment',
        action: `Payment of GHS ${payment.amount} received`,
        time: payment.createdAt,
        user: payment.invoice.customer.name,
        id: payment.id
      })),
      ...recentInvoices.map(invoice => ({
        type: 'invoice',
        action: `Invoice ${invoice.invoiceNumber} generated`,
        time: invoice.createdAt,
        user: invoice.customer.name,
        id: invoice.id
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({
      stats: {
        totalJobs,
        jobsInProgress,
        totalClients, // Keep for backward compatibility if needed elsewhere
        jobsDelivered, // New stat for delivered jobs
        revenueThisMonth: revenueThisMonth._sum.amount || 0,
        workflowStatuses: workflowStatusCounts,
        totalShipments,
        totalConsignments,
        totalInvoices,
        totalPayments
      },
      recentActivities: activities
    });
  } catch (error) {
    console.error('[Dashboard] /stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-shipments:
 *   get:
 *     summary: Get recent shipments for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent shipments to return
 *     responses:
 *       200:
 *         description: Recent shipments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shipments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shipment'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get recent shipments
router.get('/recent-shipments', authenticateToken, requirePermission(UI_PERMISSIONS.DASHBOARD), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const shipments = await prisma.shipment.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Format shipments to include client information in the expected format
    const formattedShipments = shipments.map(shipment => ({
      ...shipment,
      customer: {
        name: shipment.customerName,
        email: shipment.customerEmail
      }
    }));

    res.json({ shipments: formattedShipments });
  } catch (error) {
    console.error('[Dashboard] /recent-shipments error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-jobs:
 *   get:
 *     summary: Get recent jobs for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent jobs to return
 *     responses:
 *       200:
 *         description: Recent jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get jobs in progress (excludes NEW, CLEARED, DELIVERED)
router.get('/recent-jobs', authenticateToken, requirePermission(UI_PERMISSIONS.DASHBOARD), async (req, res) => {
  try {
    console.log('🔷 [Dashboard] GET /recent-jobs - User:', req.user?.email, 'Role:', req.user?.role);
    const { limit = 10 } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        status: {
          notIn: ['NEW', 'CLEARED', 'DELIVERED']
        }
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ [Dashboard] /recent-jobs - Found ${jobs.length} jobs`);
    res.json({ jobs });
  } catch (error) {
    console.error('❌ [Dashboard] /recent-jobs error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/dashboard/assigned-jobs:
 *   get:
 *     summary: Get jobs assigned to current user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of assigned jobs to return
 *     responses:
 *       200:
 *         description: Assigned jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get jobs assigned to current user
router.get('/assigned-jobs', authenticateToken, requirePermission(UI_PERMISSIONS.DASHBOARD), async (req, res) => {
  try {
    console.log('🔷 [Dashboard] GET /assigned-jobs - User:', req.user?.email, 'Role:', req.user?.role, 'ID:', req.user?.id);
    const { limit = 10 } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        assignedToId: req.user.id
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ [Dashboard] /assigned-jobs - Found ${jobs.length} jobs for user ${req.user.id}`);
    res.json({ jobs });
  } catch (error) {
    console.error('❌ [Dashboard] /assigned-jobs error:', error);
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
