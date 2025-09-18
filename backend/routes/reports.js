const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/reports/overview:
 *   get:
 *     summary: Get reports overview statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *     responses:
 *       200:
 *         description: Reports overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalReports:
 *                       type: integer
 *                     thisMonth:
 *                       type: integer
 *                     readyForDownload:
 *                       type: integer
 *                     processing:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get reports overview
router.get('/overview', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get report statistics
    const [
      totalReports,
      thisMonthReports,
      readyForDownload,
      processing
    ] = await Promise.all([
      prisma.report.count({ where: dateFilter }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.report.count({
        where: {
          status: 'READY',
          ...dateFilter
        }
      }),
      prisma.report.count({
        where: {
          status: 'PROCESSING',
          ...dateFilter
        }
      })
    ]);

    res.json({
      overview: {
        totalReports,
        thisMonth: thisMonthReports,
        readyForDownload,
        processing
      }
    });
  } catch (error) {
    console.error('Get reports overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/shipment-volume:
 *   get:
 *     summary: Get shipment volume trends
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Time period for the report
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: Shipment volume data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       value:
 *                         type: number
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get shipment volume trends
router.get('/shipment-volume', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - parseInt(months));

    // This is a simplified implementation
    // In a real application, you would use more sophisticated date grouping
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        packageValue: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by period (simplified)
    const groupedData = {};
    shipments.forEach(shipment => {
      const date = new Date(shipment.createdAt);
      let key;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { count: 0, value: 0 };
      }
      groupedData[key].count += 1;
      groupedData[key].value += shipment.packageValue || 0;
    });

    const data = Object.entries(groupedData).map(([period, stats]) => ({
      period,
      count: stats.count,
      value: stats.value
    }));

    res.json({ data });
  } catch (error) {
    console.error('Get shipment volume error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/revenue-analysis:
 *   get:
 *     summary: Get revenue analysis
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Time period for the report
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: Revenue analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       revenue:
 *                         type: number
 *                       payments:
 *                         type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get revenue analysis
router.get('/revenue-analysis', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - parseInt(months));

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        amount: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by period
    const groupedData = {};
    payments.forEach(payment => {
      const date = new Date(payment.createdAt);
      let key;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, payments: 0 };
      }
      groupedData[key].revenue += payment.amount;
      groupedData[key].payments += 1;
    });

    const data = Object.entries(groupedData).map(([period, stats]) => ({
      period,
      revenue: stats.revenue,
      payments: stats.payments
    }));

    res.json({ data });
  } catch (error) {
    console.error('Get revenue analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/performance-metrics:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     onTimeDelivery:
 *                       type: number
 *                       description: Percentage of on-time deliveries
 *                     averageProcessingTime:
 *                       type: number
 *                       description: Average processing time in days
 *                     customerSatisfaction:
 *                       type: number
 *                       description: Customer satisfaction score
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get performance metrics
router.get('/performance-metrics', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get delivery performance
    const totalDeliveries = await prisma.shipment.count({
      where: {
        status: 'DELIVERED',
        ...dateFilter
      }
    });

    const onTimeDeliveries = await prisma.shipment.count({
      where: {
        status: 'DELIVERED',
        deliveredAt: {
          lte: prisma.shipment.fields.estimatedDeliveryDate
        },
        ...dateFilter
      }
    });

    // Calculate average processing time
    const jobs = await prisma.job.findMany({
      where: {
        status: 'COMPLETED',
        ...dateFilter
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const totalProcessingTime = jobs.reduce((sum, job) => {
      const processingTime = new Date(job.updatedAt) - new Date(job.createdAt);
      return sum + processingTime;
    }, 0);

    const averageProcessingTime = jobs.length > 0 ? totalProcessingTime / jobs.length / (1000 * 60 * 60 * 24) : 0;

    // Mock customer satisfaction (in real app, this would come from surveys/ratings)
    const customerSatisfaction = 4.2; // Mock value

    res.json({
      metrics: {
        onTimeDelivery: totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0,
        averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
        customerSatisfaction
      }
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shipment_volume, revenue_analysis, performance_metrics, customer_satisfaction]
 *                 description: Type of report to generate
 *               name:
 *                 type: string
 *                 description: Name of the report
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the report
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for the report
 *               parameters:
 *                 type: object
 *                 description: Additional parameters for the report
 *     responses:
 *       201:
 *         description: Report generation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report generation started successfully
 *                 report:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Generate new report
router.post('/generate', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { type, name, startDate, endDate, parameters = {} } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    // Create report record
    const report = await prisma.report.create({
      data: {
        name,
        type,
        status: 'PROCESSING',
        parameters: JSON.stringify(parameters),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: req.user.id
      }
    });

    // In a real application, you would queue the report generation job here
    // For now, we'll simulate immediate completion
    setTimeout(async () => {
      await prisma.report.update({
        where: { id: report.id },
        data: { 
          status: 'READY',
          fileUrl: `/reports/${report.id}.pdf` // Mock file URL
        }
      });
    }, 2000);

    res.status(201).json({
      message: 'Report generation started successfully',
      report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all generated reports
 *     tags: [Reports]
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PROCESSING, READY, FAILED]
 *         description: Filter by report status
 *     responses:
 *       200:
 *         description: List of reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       fileUrl:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all reports
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.report.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
