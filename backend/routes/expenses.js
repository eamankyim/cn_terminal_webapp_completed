const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const { PERMISSIONS } = require('../utils/permissions');
const NotificationService = require('../services/notificationService');
const RealtimeNotificationService = require('../services/realtimeNotificationService');

const router = express.Router();

// Get user's own expense requests (no special permission required)
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {

    const { page = 1, limit = 10, status, category } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause - only user's own requests
    const where = {
      requestedById: req.user.id
    };
    if (status) where.status = status;
    if (category) where.category = category;

    const [requests, total] = await Promise.all([
      prisma.expenseRequest.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true, role: true }
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

    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get user's own expense statistics (no special permission required)
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      let start;
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      dateFilter = {
        createdAt: {
          gte: start,
          lte: now
        }
      };
    }

    // Only user's own requests
    const where = {
      requestedById: req.user.id,
      ...dateFilter
    };

    const [totalRequests, totalAmount, statusCounts, categoryCounts] = await Promise.all([
      prisma.expenseRequest.count({ where }),
      prisma.expenseRequest.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expenseRequest.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      prisma.expenseRequest.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
        _sum: { amount: true }
      })
    ]);

    const stats = {
      totalRequests,
      totalAmount: totalAmount._sum.amount || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      categoryBreakdown: categoryCounts.reduce((acc, item) => {
        acc[item.category] = {
          count: item._count.category,
          amount: item._sum.amount || 0
        };
        return acc;
      }, {})
    };

    res.json(stats);
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all expense requests (with filtering and pagination)
router.get('/requests', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
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

    res.status(500).json({ error: 'Failed to fetch expense requests' });
  }
});

// Get expense request by ID
router.get('/requests/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
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

    res.status(500).json({ error: 'Failed to fetch expense request' });
  }
});

// Record expense directly (for admins/accountants)
router.post('/record', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_CREATE), async (req, res) => {
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

    // Create expense request with APPROVED status (no approval needed)
    const expenseRequest = await prisma.expenseRequest.create({
      data: {
        amount: parseFloat(amount),
        category,
        description,
        expenseDate: new Date(expenseDate),
        jobId: jobId || null,
        receiptUrl: receiptUrl || null,
        requestedById: req.user.id,
        status: 'APPROVED',  // Direct recording - auto-approved
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
        ...(jobId && {
          job: {
            select: { id: true, trackingId: true, jobDescription: true }
          }
        })
      }
    });

    // Create corresponding expense record
    const expense = await prisma.expense.create({
      data: {
        requestId: expenseRequest.id,
        amount: expenseRequest.amount,
        category: expenseRequest.category,
        description: expenseRequest.description,
        expenseDate: expenseRequest.expenseDate,
        jobId: expenseRequest.jobId,
        receiptUrl: expenseRequest.receiptUrl
      }
    });

    res.status(201).json({
      message: 'Expense recorded successfully',
      expenseRequest,
      expense
    });
  } catch (error) {

    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Create new expense request (for employees)
router.post('/requests', authenticateToken, requirePermission(PERMISSIONS.EXPENSE_REQUEST), async (req, res) => {
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

    // Create notification for accounting staff
    try {
      console.log('🔔 Creating expense request notifications...');
      console.log('🔍 Global.io available:', !!global.io);
      
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

      console.log('👥 Accounting staff found:', accountingStaff.length);
      accountingStaff.forEach(staff => console.log(`  - ${staff.name} (${staff.id})`));

      // Create notifications for all accounting staff
      const notifications = await Promise.all(
        accountingStaff.map(staff => {
          console.log(`📤 Sending notification to ${staff.name}...`);
          return RealtimeNotificationService.sendRealtimeNotification(staff.id, {
            title: 'New Expense Request',
            message: `${req.user.name} submitted an expense request for GH₵${amount.toFixed(2)} - ${category}`,
            type: 'INFO',
            category: 'EXPENSE_REQUEST',
            metadata: {
              expenseRequestId: expenseRequest.id,
              amount: expenseRequest.amount,
              category: expenseRequest.category,
              requestedBy: req.user.name,
              requestedById: req.user.id
            }
          });
        })
      );
      
      console.log('✅ Notifications sent:', notifications.length);
    } catch (notificationError) {
      console.error('❌ Failed to send expense request notifications:', notificationError);
    }

    res.status(201).json(expenseRequest);
  } catch (error) {

    res.status(500).json({ error: 'Failed to create expense request' });
  }
});

// Approve expense request (Admin can approve, Accountant can also approve)
router.patch('/requests/:id/approve', authenticateToken, async (req, res) => {
  // Check if user is ADMIN or has EXPENSE_APPROVE permission
  if (req.user.role !== 'ADMIN' && !req.user.permissions?.some(p => p.permission === PERMISSIONS.EXPENSE_APPROVE)) {
    return res.status(403).json({ error: 'Only Admin or users with expense approval permission can approve requests' });
  }
  try {
    const { id } = req.params;
    const { approvalComment } = req.body;
    
    console.log('🔍 Approving expense request:', { id, approvalComment, userId: req.user?.id });

    // Check if request exists and is pending
    const request = await prisma.expenseRequest.findUnique({
      where: { id },
      include: { requestedBy: { select: { name: true, email: true } } }
    });

    if (!request) {
      console.log('❌ Expense request not found:', id);
      return res.status(404).json({ error: 'Expense request not found' });
    }

    console.log('📋 Found expense request:', { status: request.status, amount: request.amount });

    if (request.status !== 'PENDING') {
      console.log('❌ Request is not pending, current status:', request.status);
      
      // If already approved, return the existing request
      if (request.status === 'APPROVED') {
        console.log('✅ Request already approved, returning existing request');
        const existingRequest = await prisma.expenseRequest.findUnique({
          where: { id },
          include: {
            requestedBy: {
              select: { id: true, name: true, email: true, role: true }
            },
            approvedBy: {
              select: { id: true, name: true, email: true, role: true }
            },
            job: {
              select: { id: true, trackingId: true, status: true }
            },
            expense: true
          }
        });
        return res.json(existingRequest);
      }
      
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update request status
    const updatedRequest = await prisma.expenseRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        approvalComment: approvalComment
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

    // Create expense record (or get existing one)
    let expense = await prisma.expense.findUnique({
      where: { requestId: id }
    });

    if (!expense) {
      expense = await prisma.expense.create({
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
    }

    // Create cashflow transaction (check if one already exists)
    const existingCashflow = await prisma.cashflowTransaction.findFirst({
      where: {
        sourceType: 'EXPENSE',
        sourceId: expense.id
      }
    });

    if (!existingCashflow) {
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
    }

    // Create notification for requester
    try {
      const approvalMessage = approvalComment 
        ? `Your expense request for GH₵${request.amount.toFixed(2)} has been approved. Comment: ${approvalComment}`
        : `Your expense request for GH₵${request.amount.toFixed(2)} has been approved`;
        
      await RealtimeNotificationService.sendRealtimeNotification(request.requestedById, {
        title: 'Expense Request Approved',
        message: approvalMessage,
        type: 'SUCCESS',
        category: 'EXPENSE_APPROVED',
        metadata: {
          expenseRequestId: id,
          amount: request.amount,
          category: request.category,
          approvalComment: approvalComment,
          approvedBy: req.user.name,
          approvedById: req.user.id
        }
      });
    } catch (notificationError) {
      console.error('Failed to send expense approval notification:', notificationError);
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error approving expense request:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ 
      error: 'Failed to approve expense request',
      details: error.message 
    });
  }
});

// Mark expense request as paid (Accountant only, after approval)
router.patch('/requests/:id/mark-paid', authenticateToken, async (req, res) => {
  try {
    // Only ACCOUNTANT can mark as paid
    if (req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Only Accountant can mark expense requests as paid' });
    }

    const { id } = req.params;
    
    // Check if request exists and is approved
    const request = await prisma.expenseRequest.findUnique({
      where: { id },
      include: { 
        requestedBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Expense request not found' });
    }

    if (request.status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Only approved expense requests can be marked as paid' 
      });
    }

    // Update request status to PAID
    const updatedRequest = await prisma.expenseRequest.update({
      where: { id },
      data: {
        status: 'PAID'
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
        },
        expense: true
      }
    });

    // Create notification for requester
    try {
      await RealtimeNotificationService.sendRealtimeNotification(request.requestedById, {
        title: 'Expense Request Paid',
        message: `Your expense request for GH₵${request.amount.toFixed(2)} has been marked as paid`,
        type: 'SUCCESS',
        category: 'EXPENSE_APPROVED',
        metadata: {
          expenseRequestId: id,
          amount: request.amount,
          category: request.category,
          markedPaidBy: req.user.name,
          markedPaidById: req.user.id
        }
      });
    } catch (notificationError) {
      console.error('Failed to send expense paid notification:', notificationError);
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error marking expense request as paid:', error);
    res.status(500).json({ 
      error: 'Failed to mark expense request as paid',
      details: error.message 
    });
  }
});

// Reject expense request
router.patch('/requests/:id/reject', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
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
    try {
      await RealtimeNotificationService.sendRealtimeNotification(request.requestedById, {
        title: 'Expense Request Rejected',
        message: `Your expense request for GH₵${request.amount.toFixed(2)} has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
        type: 'WARNING',
        category: 'EXPENSE_REJECTED',
        metadata: {
          expenseRequestId: id,
          amount: request.amount,
          category: request.category,
          rejectionReason: rejectionReason || 'No reason provided',
          rejectedBy: req.user.name,
          rejectedById: req.user.id
        }
      });
    } catch (notificationError) {
      console.error('Failed to send expense rejection notification:', notificationError);
    }

    res.json(updatedRequest);
  } catch (error) {

    res.status(500).json({ error: 'Failed to reject expense request' });
  }
});

// Get all expenses (approved requests)
router.get('/', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
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

    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
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

    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

module.exports = router;
