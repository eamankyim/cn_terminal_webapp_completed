const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');
const RealtimeNotificationService = require('../services/realtimeNotificationService');
const { recordInvoicePayment } = require('../utils/invoicePayments');

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: Get all invoices with pagination and filters
 *     tags: [Invoices]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for invoice number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, OVERDUE, CANCELLED]
 *         description: Filter by invoice status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
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
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               jobId:
 *                 type: string
 *                 format: uuid
 *                 description: Job ID (optional)
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               shipmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Shipment ID (optional)
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               amount:
 *                 type: number
 *                 description: Invoice amount in GHS
 *                 example: 500
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for payment
 *                 example: 2025-09-28T00:00:00.000Z
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invoice created successfully
 *                 invoice:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all invoices
router.get('/', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {

    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};

    if (search) {
      const term = String(search).trim();
      where.OR = [
        { invoiceNumber: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { email: { contains: term, mode: 'insensitive' } } },
        { customer: { phone: { contains: term, mode: 'insensitive' } } },
        { job: { trackingId: { contains: term, mode: 'insensitive' } } },
        { job: { containerNumber: { contains: term, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;

    }

    if (customerId) {
      where.customerId = customerId;

    }

    await prisma.$connect();

    const startTime = Date.now();
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true
          }
        },
        job: {
          select: {
            id: true,
            trackingId: true,
            goodsTypes: true,
            status: true,
            consignment: {
              select: {
                id: true,
                consigneeName: true,
                consigneePhone: true,
                consigneeAddress: true
              }
            }
          }
        },
        shipment: {
          select: {
            id: true,
            trackingId: true,
            customerName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        payments: {
          select: { id: true, amount: true, status: true }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const countStartTime = Date.now();
    const totalCount = await prisma.invoice.count({ where });

    const response = {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    };

    res.json(response);
  } catch (error) {

    if (error.meta) {

    }
    
    if (error.cause) {

    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get jobs for invoice creation dropdown (only jobs without invoices)
router.get('/jobs', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {

    const { search = '', limit = 50 } = req.query;

    // Build search conditions
    const searchConditions = search ? [
      { trackingId: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } }
    ] : [];

    // Find jobs that don't have invoices
    const jobs = await prisma.job.findMany({
      where: {
        AND: [
          // Only non-draft jobs
          { isDraft: false },
          // Jobs without invoices
          {
            invoices: {
              none: {}
            }
          },
          // Search conditions if provided
          ...(searchConditions.length > 0 ? [{ OR: searchConditions }] : [])
        ]
      },
      select: {
        id: true,
        trackingId: true,
        status: true,
        goodsTypes: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ jobs });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice by ID
router.get('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true
          }
        },
        job: {
          select: {
            id: true,
            trackingId: true,
            goodsTypes: true,
            status: true,
            consignment: {
              select: {
                id: true,
                consigneeName: true,
                consigneePhone: true,
                consigneeAddress: true
              }
            }
          }
        },
        shipment: {
          select: {
            id: true,
            trackingId: true,
            customerName: true,
            packageType: true,
            packageValue: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Transform the invoice data to include all expected fields
    const transformedInvoice = {
      ...invoice,
      // Ensure charges is an object with default values
      charges: invoice.charges || {
        customDuty: 0,
        shippingCharges: 0,
        terminalCharges: 0,
        miscellaneous: 0,
        clearanceCharges: 0,
        serviceCharge: 0,
        vat: 0
      }
    };

    res.json({ invoice: transformedInvoice });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new invoice
router.post('/', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const {
      jobId,
      shipmentId,
      customerId,
      amount,
      issueDate,
      dueDate,
      blAmendment,
      charges,
      comments,
      transactionReference,
      paymentNotes
    } = req.body;

    // Validate required fields
    if (!jobId || !amount || !issueDate || !dueDate) {
      return res.status(400).json({ 
        error: 'Job, amount, issue date, and due date are required' 
      });
    }

    // Check if job exists and get customer from job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true
      }
    });

    if (!job) {
      return res.status(400).json({ error: 'Job not found' });
    }

    // Use customer from job
    const customer = job.customer;

    // Check if shipment exists (if provided)
    if (shipmentId) {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });

      if (!shipment) {
        return res.status(400).json({ error: 'Shipment not found' });
      }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoiceData = {
      invoiceNumber,
      jobId,
      shipmentId,
      customerId: customer.id,
      amount: parseFloat(amount),
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      blAmendment: blAmendment || 'no',
      charges: charges || {},
      comments: comments || null,
      transactionReference: transactionReference || null,
      paymentNotes: paymentNotes || null,
      createdById: req.user.id
    };

    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true
          }
        },
        job: {
          select: {
            id: true,
            trackingId: true,
            goodsTypes: true,
            status: true,
            consignment: {
              select: {
                id: true,
                consigneeName: true,
                consigneePhone: true,
                consigneeAddress: true
              }
            }
          }
        },
        shipment: {
          select: {
            id: true,
            trackingId: true,
            customerName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Invoice creation is now independent - no automatic status update

    // Create notification for invoice creation with real-time updates
    try {
      await RealtimeNotificationService.notifyInvoiceCreatedRealtime(invoice.id, req.user.id);

    } catch (notificationError) {

      // Don't fail the invoice creation if notification fails
    }

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      issueDate,
      dueDate,
      status,
      paymentDate,
      paymentMethod
    } = req.body;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        job: {
          select: {
            id: true,
            trackingId: true,
            goodsTypes: true,
            status: true
          }
        },
        shipment: {
          select: {
            id: true,
            trackingId: true,
            customerName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice status
router.put('/:id/status', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, paymentMethod } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod
      }
    });

    // Create notification for invoice status change
    try {
      await NotificationService.notifyInvoiceStatusChange(
        id, 
        existingInvoice.status, 
        status, 
        req.user.id
      );

    } catch (notificationError) {

      // Don't fail the status update if notification fails
    }

    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment for invoice
router.post('/:id/payments', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, gatewayRef, receiptUrl, payer, accountName } = req.body;

    const result = await recordInvoicePayment({
      invoiceId: id,
      amount,
      paymentMethod,
      accountName,
      payer,
      createdById: req.user.id,
      receiptUrl,
      gatewayRef
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error, remaining: result.remaining });
    }

    try {
      await RealtimeNotificationService.notifyPaymentReceivedRealtime(result.payment.id, req.user.id);
    } catch (notificationError) {
      // Don't fail the payment creation if notification fails
    }

    res.status(201).json({
      message: 'Payment created successfully',
      payment: result.payment,
      remaining: result.remaining,
      paymentType: result.paymentType
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.INVOICES), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            payments: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice has related payments
    if (invoice._count.payments > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete invoice with existing payments' 
      });
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
