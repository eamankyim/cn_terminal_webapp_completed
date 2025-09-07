const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments with pagination and filters
 *     tags: [Payments]
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
 *         description: Search term for transaction ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, BANK_TRANSFER, MOBILE_MONEY, CARD]
 *         description: Filter by payment method
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by invoice ID
 *     responses:
 *       200:
 *         description: List of payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
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
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - method
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *                 description: Invoice ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               amount:
 *                 type: number
 *                 description: Payment amount in GHS
 *                 example: 500
 *               method:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, MOBILE_MONEY, CARD]
 *                 description: Payment method
 *                 example: MOBILE_MONEY
 *               transactionId:
 *                 type: string
 *                 description: External transaction ID
 *                 example: TXN123456789
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment created successfully
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all payments
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, invoiceId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { gatewayRef: { contains: search, mode: 'insensitive' } },
        { payer: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              amount: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
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
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
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
                goodsType: true
              }
            },
            shipment: {
              select: {
                id: true,
                trackingId: true,
                customerName: true
              }
            }
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

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new payment
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      invoiceId,
      gatewayRef,
      amount,
      currency = 'GHS',
      payer,
      paymentMethod,
      receiptUrl
    } = req.body;

    // Validate required fields
    if (!amount || !payer || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Amount, payer, and payment method are required' 
      });
    }

    // Check if invoice exists (if provided)
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        return res.status(400).json({ error: 'Invoice not found' });
      }
    }

    // Check if gateway reference already exists (if provided)
    if (gatewayRef) {
      const existingPayment = await prisma.payment.findUnique({
        where: { gatewayRef }
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'Payment with this gateway reference already exists' });
      }
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        gatewayRef,
        amount: parseFloat(amount),
        currency,
        payer,
        paymentMethod,
        receiptUrl,
        createdById: req.user.id
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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

    // Update invoice status to PAID if this payment completes the invoice
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true
        }
      });

      if (invoice) {
        const totalPaid = invoice.payments.reduce((sum, p) => {
          return p.status === 'COMPLETED' ? sum + p.amount : sum;
        }, 0);

        if (totalPaid >= invoice.amount) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { 
              status: 'PAID',
              paymentDate: new Date()
            }
          });
        }
      }
    }

    res.status(201).json({
      message: 'Payment created successfully',
      payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update payment
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      gatewayRef,
      amount,
      currency,
      payer,
      paymentMethod,
      status,
      receiptUrl
    } = req.body;

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if gateway reference is already taken by another payment
    if (gatewayRef && gatewayRef !== existingPayment.gatewayRef) {
      const gatewayRefExists = await prisma.payment.findUnique({
        where: { gatewayRef }
      });

      if (gatewayRefExists) {
        return res.status(400).json({ error: 'Gateway reference already in use by another payment' });
      }
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        gatewayRef,
        amount: amount ? parseFloat(amount) : undefined,
        currency,
        payer,
        paymentMethod,
        status,
        receiptUrl
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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
      message: 'Payment updated successfully',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update payment status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Payment status updated successfully',
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete payment
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete payment
    await prisma.payment.delete({
      where: { id }
    });

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
