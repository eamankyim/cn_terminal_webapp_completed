const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const { recordInvoicePayment, OPEN_INVOICE_STATUSES } = require('../utils/invoicePayments');

const router = express.Router();

// Get cashflow transactions (with filtering and pagination)
router.get('/transactions', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, sourceType, jobId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (type) where.type = type;
    if (sourceType) where.sourceType = sourceType;
    if (jobId) where.jobId = jobId;
    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.cashflowTransaction.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          job: {
            select: { id: true, trackingId: true, status: true, customer: { select: { name: true } } }
          },
          expense: {
            include: {
              request: {
                include: {
                  requestedBy: { select: { name: true } }
                }
              }
            }
          },
          payout: {
            select: { payee: true, purpose: true }
          }
        },
        orderBy: { transactionDate: 'desc' }
      }),
      prisma.cashflowTransaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch cashflow transactions' });
  }
});

/**
 * @swagger
 * /api/cashflow/summary:
 *   get:
 *     summary: Get cashflow summary for dashboard
 *     tags: [Cashflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Time period for the summary
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
 *         description: Cashflow summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashflowSummary'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
// Get cashflow summary/dashboard data
router.get('/summary', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {

    const { period = 'month', startDate, endDate } = req.query;

    let dateFilter = {};
    
    // If custom date range provided, use it
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Otherwise use period-based filtering
      const now = new Date();
      let periodStart;

      switch (period) {
        case 'today':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      dateFilter.transactionDate = {
        gte: periodStart,
        lte: now
      };
    }

    const [
      totalInflows,
      totalOutflows,
      inflowBreakdown,
      outflowBreakdown,
      dailyTrends
    ] = await Promise.all([
      prisma.cashflowTransaction.aggregate({
        where: { ...dateFilter, type: 'INFLOW' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.cashflowTransaction.aggregate({
        where: { ...dateFilter, type: 'OUTFLOW' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.cashflowTransaction.groupBy({
        by: ['sourceType'],
        where: { ...dateFilter, type: 'INFLOW' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.cashflowTransaction.groupBy({
        by: ['sourceType'],
        where: { ...dateFilter, type: 'OUTFLOW' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.cashflowTransaction.findMany({
        where: dateFilter,
        select: {
          transactionDate: true,
          type: true,
          amount: true
        },
        orderBy: { transactionDate: 'desc' }
      }).then(transactions => {
        // Group by date and type
        const grouped = {};
        transactions.forEach(t => {
          const date = t.transactionDate.toISOString().split('T')[0];
          const key = `${date}_${t.type}`;
          if (!grouped[key]) {
            grouped[key] = {
              date: date,
              type: t.type,
              total_amount: 0,
              transaction_count: 0
            };
          }
          grouped[key].total_amount += t.amount;
          grouped[key].transaction_count += 1;
        });
        return Object.values(grouped);
      })
    ]);

    const netCashflow = (totalInflows._sum.amount || 0) - (totalOutflows._sum.amount || 0);

    res.json({
      period,
      dateRange: {
        start: dateFilter.transactionDate.gte,
        end: dateFilter.transactionDate.lte
      },
      summary: {
        totalInflows: totalInflows._sum.amount || 0,
        totalOutflows: totalOutflows._sum.amount || 0,
        netCashflow,
        inflowCount: totalInflows._count,
        outflowCount: totalOutflows._count
      },
      inflowBreakdown: inflowBreakdown.map(item => ({
        sourceType: item.sourceType,
        amount: item._sum.amount || 0,
        count: item._count
      })),
      outflowBreakdown: outflowBreakdown.map(item => ({
        sourceType: item.sourceType,
        amount: item._sum.amount || 0,
        count: item._count
      })),
      dailyTrends: dailyTrends.map(trend => ({
        date: trend.date,
        type: trend.type,
        amount: parseFloat(trend.total_amount),
        count: parseInt(trend.transaction_count)
      }))
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch cashflow summary' });
  }
});

// Get account balance (calculated running balance)
router.get('/balance', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all transactions up to the specified date (or current date)
    const endDateFilter = endDate ? new Date(endDate) : new Date();
    
    const transactions = await prisma.cashflowTransaction.findMany({
      where: {
        transactionDate: {
          lte: endDateFilter
        }
      },
      orderBy: { transactionDate: 'asc' }
    });

    // Calculate running balance
    let runningBalance = 0;
    const balanceHistory = transactions.map(transaction => {
      if (transaction.type === 'INFLOW') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }

      return {
        transactionId: transaction.id,
        date: transaction.transactionDate,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        runningBalance
      };
    });

    res.json({
      currentBalance: runningBalance,
      transactionCount: transactions.length,
      dateRange: {
        start: transactions.length > 0 ? transactions[0].transactionDate : null,
        end: endDateFilter
      },
      balanceHistory: balanceHistory.slice(-50) // Last 50 transactions
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to calculate account balance' });
  }
});

// Get job profitability
router.get('/job-profitability/:jobId', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { select: { name: true } },
        invoices: {
          select: { amount: true, status: true }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all cashflow transactions for this job
    const transactions = await prisma.cashflowTransaction.findMany({
      where: { jobId },
      include: {
        expense: {
          include: {
            request: {
              include: {
                requestedBy: { select: { name: true } }
              }
            }
          }
        },
        payout: {
          select: { payee: true, purpose: true }
        }
      },
      orderBy: { transactionDate: 'desc' }
    });

    // Calculate totals
    const revenue = job.invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'OUTFLOW' && t.sourceType === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const payouts = transactions
      .filter(t => t.type === 'OUTFLOW' && t.sourceType === 'PAYOUT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCosts = expenses + payouts;
    const profit = revenue - totalCosts;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    res.json({
      job: {
        id: job.id,
        trackingId: job.trackingId,
        status: job.status,
        customer: job.customer.name
      },
      financials: {
        revenue,
        expenses,
        payouts,
        totalCosts,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100
      },
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.transactionDate,
        type: t.type,
        amount: t.amount,
        description: t.description,
        sourceType: t.sourceType,
        expense: t.expense ? {
          category: t.expense.category,
          requestedBy: t.expense.request.requestedBy.name
        } : null,
        payout: t.payout ? {
          payee: t.payout.payee,
          purpose: t.payout.purpose
        } : null
      }))
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to calculate job profitability' });
  }
});

// Get cashflow trends (for charts)
router.get('/trends', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const { period = '30', type = 'daily' } = req.query;
    const days = parseInt(period);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    let groupByClause;
    let dateFormat;

    switch (type) {
      case 'daily':
        groupByClause = 'DATE(transaction_date)';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'weekly':
        groupByClause = 'DATE_TRUNC(\'week\', transaction_date)';
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'monthly':
        groupByClause = 'DATE_TRUNC(\'month\', transaction_date)';
        dateFormat = 'YYYY-MM';
        break;
      default:
        groupByClause = 'DATE(transaction_date)';
        dateFormat = 'YYYY-MM-DD';
    }

    const trends = await prisma.$queryRaw`
      SELECT 
        ${groupByClause} as period,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM cashflow_transactions 
      WHERE transaction_date >= ${startDate}
      AND transaction_date <= ${endDate}
      GROUP BY ${groupByClause}, type
      ORDER BY period DESC
    `;

    // Process trends data
    const processedTrends = trends.map(trend => ({
      period: trend.period,
      type: trend.type,
      amount: parseFloat(trend.total_amount),
      count: parseInt(trend.transaction_count)
    }));

    res.json({
      period,
      type,
      dateRange: {
        start: startDate,
        end: endDate
      },
      trends: processedTrends
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch cashflow trends' });
  }
});

// Create manual cashflow transaction (for adjustments)
router.post('/transactions', authenticateToken, requirePermission(UI_PERMISSIONS.ACCOUNTING), async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      sourceType,
      jobId,
      transactionDate
    } = req.body;

    // Validate required fields
    if (!type || !amount || !description || !sourceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate type
    if (!['INFLOW', 'OUTFLOW'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Validate source type
    if (!['INVOICE', 'EXPENSE', 'PAYOUT', 'OTHER'].includes(sourceType)) {
      return res.status(400).json({ error: 'Invalid source type' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const transaction = await prisma.cashflowTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description,
        sourceType,
        jobId: jobId || null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date()
      },
      include: {
        job: {
          select: { id: true, trackingId: true, status: true }
        }
      }
    });

    res.status(201).json(transaction);
  } catch (error) {

    res.status(500).json({ error: 'Failed to create cashflow transaction' });
  }
});

// Accountant cash in: customer payment against an invoice (partial or full)
router.post('/cash-in', authenticateToken, requirePermission(UI_PERMISSIONS.CREATE_CASHFLOW), async (req, res) => {
  try {
    if (!['ACCOUNTANT', 'ADMIN', 'IT_CONSULTANT'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only accountants can record cash in' });
    }

    const {
      customerId,
      newCustomer,
      invoiceId,
      amount,
      paymentMethod,
      accountName
    } = req.body;

    if (!invoiceId || !amount || !paymentMethod || !accountName || !String(accountName).trim()) {
      return res.status(400).json({
        error: 'Invoice, amount, payment method, and account name are required'
      });
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && newCustomer) {
      const name = newCustomer.name?.trim();
      const phone = newCustomer.phone?.trim();
      const address = newCustomer.address?.trim() || 'N/A';
      if (!name || !phone) {
        return res.status(400).json({ error: 'New customer name and phone are required' });
      }
      const customer = await prisma.customer.create({
        data: {
          name,
          phone,
          address,
          email: newCustomer.email?.trim() || null,
          customerType: newCustomer.customerType || 'INDIVIDUAL',
          consignments: {
            create: {
              consigneeName: name,
              consigneePhone: phone,
              consigneeAddress: address,
              date: new Date()
            }
          }
        }
      });
      resolvedCustomerId = customer.id;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({ error: 'Select or create a customer' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, customerId: true, status: true, invoiceNumber: true }
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.customerId !== resolvedCustomerId) {
      return res.status(400).json({ error: 'Invoice does not belong to the selected customer' });
    }
    if (!OPEN_INVOICE_STATUSES.includes(invoice.status) && invoice.status !== 'PAID') {
      return res.status(400).json({ error: 'This invoice cannot receive payments' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: resolvedCustomerId },
      select: { name: true }
    });

    const result = await recordInvoicePayment({
      invoiceId,
      amount,
      paymentMethod,
      accountName: String(accountName).trim(),
      payer: customer?.name || String(accountName).trim(),
      createdById: req.user.id
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error, remaining: result.remaining });
    }

    res.status(201).json({
      message: result.paymentType === 'FULL'
        ? 'Full payment recorded'
        : 'Partial payment recorded',
      ...result,
      customerId: resolvedCustomerId
    });
  } catch (error) {
    console.error('Cash in error:', error);
    res.status(500).json({ error: 'Failed to record cash in', details: error.message });
  }
});

module.exports = router;
