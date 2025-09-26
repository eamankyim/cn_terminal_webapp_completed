const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../utils/permissions');

const router = express.Router();


// Get all expense requests (with filtering and pagination)
router.get('/requests', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_VIEW), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, userId, jobId } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (userId) where.requestedById = userId;
    if (jobId) where.jobId = jobId;

    const [requests, total] = await Promise.all([
      prisma.expenseRequest.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          approvedBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          job: {
            select: { id: true, trackingId: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.expenseRequest.count({ where })
    ]);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expense requests:', error);
    res.status(500).json({ error: 'Failed to fetch expense requests' });
  }
});

// Get expense request by ID
router.get('/requests/:id', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_VIEW), async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.expenseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
        },
        expense: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Expense request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching expense request:', error);
    res.status(500).json({ error: 'Failed to fetch expense request' });
  }
});

// Create new expense request
router.post('/requests', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_CREATE), async (req, res) => {
  try {
    const {
      amount,
      category,
      description,
      expenseDate,
      jobId,
      receiptUrl
    } = req.body;

    // Validate required fields
    if (!amount || !category || !description || !expenseDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate category
    const validCategories = ['FUEL', 'MATERIALS', 'OPERATIONS', 'MISCELLANEOUS'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Create expense request
    const expenseRequest = await prisma.expenseRequest.create({
      data: {
        amount: parseFloat(amount),
        category,
        description,
        expenseDate: new Date(expenseDate),
        jobId: jobId || null,
        receiptUrl: receiptUrl || null,
        requestedById: req.user.id,
        status: 'PENDING'
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    // Create notification for finance officers/admins
    await prisma.notification.create({
      data: {
        title: 'New Expense Request',
        message: `${req.user.name} submitted an expense request for ${amount} GHS`,
        type: 'INFO',
        category: 'EXPENSE_REQUEST',
        metadata: {
          expenseRequestId: expenseRequest.id,
          amount: expenseRequest.amount,
          category: expenseRequest.category
        }
      }
    });

    res.status(201).json(expenseRequest);
  } catch (error) {
    console.error('Error creating expense request:', error);
    res.status(500).json({ error: 'Failed to create expense request' });
  }
});

// Approve expense request
router.patch('/requests/:id/approve', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_APPROVE), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if request exists and is pending
    const request = await prisma.expenseRequest.findUnique({
      where: { id },
      include: { requestedBy: { select: { name: true, email: true } } }
    });

    if (!request) {
      return res.status(404).json({ error: 'Expense request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update request status
    const updatedRequest = await prisma.expenseRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date()
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        requestId: id,
        amount: request.amount,
        category: request.category,
        description: request.description,
        expenseDate: request.expenseDate,
        jobId: request.jobId,
        receiptUrl: request.receiptUrl
      }
    });

    // Create cashflow transaction
    await prisma.cashflowTransaction.create({
      data: {
        type: 'OUTFLOW',
        amount: request.amount,
        description: `Expense: ${request.description}`,
        sourceType: 'EXPENSE',
        sourceId: expense.id,
        jobId: request.jobId
      }
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        title: 'Expense Request Approved',
        message: `Your expense request for ${request.amount} GHS has been approved`,
        type: 'SUCCESS',
        category: 'EXPENSE_APPROVED',
        userId: request.requestedById,
        metadata: {
          expenseRequestId: id,
          amount: request.amount,
          category: request.category
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error approving expense request:', error);
    res.status(500).json({ error: 'Failed to approve expense request' });
  }
});

// Reject expense request
router.patch('/requests/:id/reject', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_APPROVE), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    // Check if request exists and is pending
    const request = await prisma.expenseRequest.findUnique({
      where: { id },
      include: { requestedBy: { select: { name: true, email: true } } }
    });

    if (!request) {
      return res.status(404).json({ error: 'Expense request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update request status
    const updatedRequest = await prisma.expenseRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || 'No reason provided'
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    // Create notification for requester
    await prisma.notification.create({
      data: {
        title: 'Expense Request Rejected',
        message: `Your expense request for ${request.amount} GHS has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
        type: 'WARNING',
        category: 'EXPENSE_REJECTED',
        userId: request.requestedById,
        metadata: {
          expenseRequestId: id,
          amount: request.amount,
          category: request.category,
          rejectionReason: rejectionReason || 'No reason provided'
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error rejecting expense request:', error);
    res.status(500).json({ error: 'Failed to reject expense request' });
  }
});

// Get all expenses (approved requests)
router.get('/', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_VIEW), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, jobId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (jobId) where.jobId = jobId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          request: {
            include: {
              requestedBy: {
                select: { id: true, name: true, email: true, role: true }
              },
              approvedBy: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          },
          job: {
            select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * @swagger
 * /api/expenses/stats/summary:
 *   get:
 *     summary: Get expense statistics for dashboard
 *     tags: [Expenses]
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
 *         description: Expense statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExpenseStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
// Get expense statistics (MUST come before /:id route)
router.get('/stats/summary', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_VIEW), async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 EXPENSE STATS ROUTE HIT');
    console.log('='.repeat(60));
    console.log('📡 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('🌐 Full URL:', req.originalUrl);
    console.log('📋 Headers:', req.headers);
    console.log('📊 Query params:', req.query);
    console.log('👤 User:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'No user');
    console.log('='.repeat(60));
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Get total expenses
    const totalExpenses = await prisma.expenseRequest.aggregate({
      where: dateFilter,
      _sum: { amount: true },
      _count: true
    });

    // Get pending requests count
    const pendingRequests = await prisma.expenseRequest.count({
      where: { ...dateFilter, status: 'PENDING' }
    });

    // Get approved requests count
    const approvedRequests = await prisma.expenseRequest.count({
      where: { ...dateFilter, status: 'APPROVED' }
    });

    // Get rejected requests count
    const rejectedRequests = await prisma.expenseRequest.count({
      where: { ...dateFilter, status: 'REJECTED' }
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.expenseRequest.groupBy({
      by: ['category'],
      where: dateFilter,
      _sum: { amount: true },
      _count: true
    });

    res.json({
      totalAmount: totalExpenses._sum.amount || 0,
      totalCount: totalExpenses._count,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        count: item._count
      }))
    });
  } catch (error) {
    console.error('Error fetching expense statistics:', error);
    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_VIEW), async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            requestedBy: {
              select: { id: true, name: true, email: true, role: true }
            },
            approvedBy: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        job: {
          select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});


module.exports = router;
