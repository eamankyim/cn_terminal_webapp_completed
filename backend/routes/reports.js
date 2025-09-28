const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const ReportService = require('../services/reportService');

const router = express.Router();

/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     summary: Get summary statistics for reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Summary statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobs:
 *                   type: integer
 *                 completedJobs:
 *                   type: integer
 *                 pendingJobs:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 activeCustomers:
 *                   type: integer
 *                 avgProcessingTime:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/summary', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTS SUMMARY REQUEST');
    console.log('='.repeat(80));
    console.log('📅 Raw startDate:', startDate);
    console.log('📅 Raw endDate:', endDate);
    console.log('⏰ Request time:', new Date().toISOString());
    
    if (!startDate || !endDate) {
      console.log('❌ Missing date parameters');
      console.log('='.repeat(80) + '\n');
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day (start at 00:00:00, end at 23:59:59.999)
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    console.log('🕐 Parsed startDateTime:', startDateTime.toISOString());
    console.log('🕐 Parsed endDateTime:', endDateTime.toISOString());
    console.log('📊 Date range span:', Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60 * 24)), 'days');
    
    const stats = await ReportService.getSummaryStats(
      startDateTime,
      endDateTime
    );

    console.log('📈 Summary stats result:', JSON.stringify(stats, null, 2));
    console.log('='.repeat(80));
    console.log('✅ REPORTS SUMMARY SUCCESS');
    console.log('='.repeat(80) + '\n');

    res.json(stats);
  } catch (error) {
    console.error('❌ Error getting summary stats:', error);
    console.log('='.repeat(80) + '\n');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/job-status:
 *   get:
 *     summary: Get job status summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Job status summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                   count:
 *                     type: integer
 *                   percentage:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/job-status', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getJobStatusSummary(
      startDateTime,
      endDateTime
    );

    res.json(data);
  } catch (error) {
    console.error('Error getting job status summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/daily-activity:
 *   get:
 *     summary: Get daily activity report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Daily activity report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   newJobs:
 *                     type: integer
 *                   completedJobs:
 *                     type: integer
 *                   revenue:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/daily-activity', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getDailyActivity(
      startDateTime,
      endDateTime
    );

    res.json(data);
  } catch (error) {
    console.error('Error getting daily activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Revenue summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 paidRevenue:
 *                   type: number
 *                 pendingRevenue:
 *                   type: number
 *                 revenueByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       percentage:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/revenue', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getRevenueSummary(
      startDateTime,
      endDateTime
    );

    res.json(data);
  } catch (error) {
    console.error('Error getting revenue summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/invoices:
 *   get:
 *     summary: Get invoice reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Invoice reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   customer:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/invoices', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getInvoiceReports(
      startDateTime,
      endDateTime
    );

    res.json(data);
  } catch (error) {
    console.error('Error getting invoice reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get customer activity report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Customer activity report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   jobs:
 *                     type: integer
 *                   revenue:
 *                     type: number
 *                   lastActivity:
 *                     type: string
 *                     format: date
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/customers', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getCustomerActivity(
      startDateTime,
      endDateTime
    );

    res.json(data);
  } catch (error) {
    console.error('Error getting customer activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/reports/processing-time:
 *   get:
 *     summary: Get processing time report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Processing time report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/processing-time', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getProcessingTimeReport(
      startDateTime,
      endDateTime
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching processing time report:', error);
    res.status(500).json({ error: 'Failed to fetch processing time report' });
  }
});

/**
 * @swagger
 * /api/reports/monthly-trends:
 *   get:
 *     summary: Get monthly trends report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Monthly trends report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/monthly-trends', authenticateToken, requirePermission(UI_PERMISSIONS.REPORTS), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Create dates that include the full day
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const data = await ReportService.getMonthlyTrendsReport(
      startDateTime,
      endDateTime
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching monthly trends report:', error);
    res.status(500).json({ error: 'Failed to fetch monthly trends report' });
  }
});

module.exports = router;