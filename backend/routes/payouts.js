const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');
const RealtimeNotificationService = require('../services/realtimeNotificationService');

const router = express.Router();

// Get all payouts (with filtering and pagination)
router.get('/', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod, jobId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (jobId) where.jobId = jobId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          processedBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          job: {
            select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payout.count({ where })
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/**
 * @swagger
 * /api/payouts/stats/summary:
 *   get:
 *     summary: Get payout statistics for dashboard
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Time period for the statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Payout statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PayoutStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
// Get payout statistics (MUST come before /:id route)
router.get('/stats/summary', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      methodBreakdown
    ] = await Promise.all([
      prisma.payout.aggregate({
        where: dateFilter,
        _sum: { amount: true },
        _count: true
      }),
      prisma.payout.count({
        where: { ...dateFilter, status: 'PENDING' }
      }),
      prisma.payout.count({
        where: { ...dateFilter, status: 'COMPLETED' }
      }),
      prisma.payout.count({
        where: { ...dateFilter, status: 'FAILED' }
      }),
      prisma.payout.groupBy({
        by: ['paymentMethod'],
        where: dateFilter,
        _sum: { amount: true },
        _count: true
      })
    ]);

    res.json({
      totalAmount: totalPayouts._sum.amount || 0,
      totalCount: totalPayouts._count,
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      methodBreakdown: methodBreakdown.map(item => ({
        paymentMethod: item.paymentMethod,
        amount: item._sum.amount || 0,
        count: item._count
      }))
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch payout statistics' });
  }
});

// Get payout by ID
router.get('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
        }
      }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    res.json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch payout' });
  }
});

// Create new payout
router.post('/', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const {
      payee,
      amount,
      paymentMethod,
      purpose,
      jobId
    } = req.body;

    // Validate required fields
    if (!payee || !amount || !paymentMethod || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate payment method
    const validPaymentMethods = ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CARD'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Create payout
    const payout = await prisma.payout.create({
      data: {
        payee,
        amount: parseFloat(amount),
        paymentMethod,
        purpose,
        jobId: jobId || null,
        processedById: req.user.id,
        status: 'PENDING'
      },
      include: {
        processedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    // Create notification for accounting staff
    try {
      // Get all accounting staff (ACCOUNTANT, ADMIN roles)
      const accountingStaff = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ACCOUNTANT' },
            { role: 'ADMIN' }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });

      // Create notifications for all accounting staff
      const notifications = await Promise.all(
        accountingStaff.map(staff => 
          RealtimeNotificationService.sendRealtimeNotification(staff.id, {
            title: 'New Payout Created',
            message: `Payout of GH₵${amount.toFixed(2)} to ${payee} has been created by ${req.user.name}`,
            type: 'INFO',
            category: 'PAYOUT_CREATED',
            metadata: {
              payoutId: payout.id,
              amount: payout.amount,
              payee: payout.payee,
              paymentMethod: payout.paymentMethod,
              createdBy: req.user.name,
              createdById: req.user.id
            }
          })
        )
      );
    } catch (notificationError) {
      console.error('Failed to send payout creation notifications:', notificationError);
    }

    res.status(201).json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to create payout' });
  }
});

// Update payout status
router.patch('/:id/status', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if payout exists
    const existingPayout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!existingPayout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Update payout
    const updateData = { status };
    if (paymentDate && status === 'COMPLETED') {
      updateData.paymentDate = new Date(paymentDate);
    }

    const payout = await prisma.payout.update({
      where: { id },
      data: updateData,
      include: {
        processedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    // Create cashflow transaction if completed
    if (status === 'COMPLETED') {
      await prisma.cashflowTransaction.create({
        data: {
          type: 'OUTFLOW',
          amount: payout.amount,
          description: `Payout: ${payout.purpose}`,
          sourceType: 'PAYOUT',
          sourceId: payout.id,
          jobId: payout.jobId
        }
      });
    }

    // Create notification for accounting staff
    try {
      const notificationCategory = status === 'COMPLETED' ? 'PAYOUT_COMPLETED' : 'PAYOUT_FAILED';
      const notificationType = status === 'COMPLETED' ? 'SUCCESS' : 'ERROR';

      // Get all accounting staff (ACCOUNTANT, ADMIN roles)
      const accountingStaff = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'ACCOUNTANT' },
            { role: 'ADMIN' }
          ],
          isActive: true
        },
        select: { id: true, name: true }
      });

      // Create notifications for all accounting staff
      const notifications = await Promise.all(
        accountingStaff.map(staff => 
          RealtimeNotificationService.sendRealtimeNotification(staff.id, {
            title: `Payout ${status}`,
            message: `Payout of GH₵${payout.amount.toFixed(2)} to ${payout.payee} has been ${status.toLowerCase()}`,
            type: notificationType,
            category: notificationCategory,
            metadata: {
              payoutId: payout.id,
              amount: payout.amount,
              payee: payout.payee,
              status: payout.status,
              updatedBy: req.user.name,
              updatedById: req.user.id
            }
          })
        )
      );
    } catch (notificationError) {
      console.error('Failed to send payout status notifications:', notificationError);
    }

    res.json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to update payout status' });
  }
});

// Update payout details
router.patch('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { id } = req.params;
    const { payee, amount, paymentMethod, purpose, jobId } = req.body;

    // Check if payout exists and is not completed
    const existingPayout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!existingPayout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (existingPayout.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot update completed payout' });
    }

    // Build update data
    const updateData = {};
    if (payee) updateData.payee = payee;
    if (amount) {
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updateData.amount = parseFloat(amount);
    }
    if (paymentMethod) {
      const validPaymentMethods = ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'CARD'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      updateData.paymentMethod = paymentMethod;
    }
    if (purpose) updateData.purpose = purpose;
    if (jobId !== undefined) updateData.jobId = jobId;

    const payout = await prisma.payout.update({
      where: { id },
      data: updateData,
      include: {
        processedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    res.json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to update payout' });
  }
});

// Delete payout (only if pending)
router.delete('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payout exists and is pending
    const payout = await prisma.payout.findUnique({
      where: { id }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only delete pending payouts' });
    }

    await prisma.payout.delete({
      where: { id }
    });

    res.json({ message: 'Payout deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Failed to delete payout' });
  }
});

// ==================== DIRECT PAYOUTS ====================

/**
 * @swagger
 * /api/payouts/records:
 *   get:
 *     summary: Get all payout records
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [DRIVER_PAYMENT, VENDOR_PAYMENT, OPERATIONS, MISCELLANEOUS]
 *         description: Filter by category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Payout records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payouts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PayoutRecord'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/records', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          processedBy: {
            select: { id: true, name: true, email: true }
          },
          job: {
            select: { id: true, trackingId: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payout.count({ where })
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch payout records' });
  }
});

/**
 * @swagger
 * /api/payouts/records:
 *   post:
 *     summary: Create a new payout record
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
 *               - recipientName
 *               - recipientAccount
 *               - paymentMethod
 *               - description
 *               - paymentDate
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payout amount
 *               category:
 *                 type: string
 *                 enum: [DRIVER_PAYMENT, VENDOR_PAYMENT, OPERATIONS, MISCELLANEOUS]
 *                 description: Payout category
 *               recipientName:
 *                 type: string
 *                 description: Recipient name
 *               recipientAccount:
 *                 type: string
 *                 description: Recipient account details
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, MOBILE_MONEY, CASH]
 *                 description: Payment method
 *               description:
 *                 type: string
 *                 description: Payout description
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Payment date
 *               jobId:
 *                 type: string
 *                 description: Related job ID (optional)
 *     responses:
 *       201:
 *         description: Payout record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PayoutRecord'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/records', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const {
      amount,
      category,
      recipientName,
      recipientAccount,
      paymentMethod,
      description,
      paymentDate,
      jobId
    } = req.body;

    // Validate required fields
    if (!amount || !category || !recipientName || !recipientAccount || !paymentMethod || !description || !paymentDate) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const payout = await prisma.payout.create({
      data: {
        payee: recipientName,
        amount: parseFloat(amount),
        category,
        paymentMethod,
        purpose: description,
        paymentDate: new Date(paymentDate),
        jobId: jobId || null,
        status: 'COMPLETED',
        processedById: req.user.id
      },
      include: {
        processedBy: {
          select: { id: true, name: true, email: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    res.status(201).json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to create payout record' });
  }
});

/**
 * @swagger
 * /api/payouts/records/{id}:
 *   get:
 *     summary: Get payout record by ID
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payout record ID
 *     responses:
 *       200:
 *         description: Payout record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PayoutRecord'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payout record not found
 *       500:
 *         description: Internal server error
 */
router.get('/records/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        processedBy: {
          select: { id: true, name: true, email: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout record not found' });
    }

    res.json(payout);
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch payout record' });
  }
});

module.exports = router;
