const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

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
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧾 GET INVOICES REQUEST');
    console.log('='.repeat(60));
    console.log(`👤 User: ${req.user.name} (${req.user.email})`);
    console.log(`📝 Query params:`, req.query);
    console.log(`⏰ Request time: ${new Date().toISOString()}`);

    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    console.log(`📊 Pagination: page=${page}, limit=${limit}, skip=${skip}`);
    console.log(`🔍 Search: "${search}"`);
    console.log(`📋 Status filter: ${status || 'none'}`);
    console.log(`👤 Customer filter: ${customerId || 'none'}`);

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    console.log(`🔍 Where condition:`, JSON.stringify(where, null, 2));

    console.log('🔍 Executing Prisma queries...');
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
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
              goodsType: true,
              port: true,
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
      }),
      prisma.invoice.count({ where })
    ]);

    console.log(`✅ Prisma queries completed successfully`);
    console.log(`📊 Found ${invoices.length} invoices out of ${totalCount} total`);
    console.log(`📄 Pagination: page ${page}/${Math.ceil(totalCount / limit)}`);

    const response = {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    };

    console.log('✅ Sending successful response');
    console.log('='.repeat(60) + '\n');

    res.json(response);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('💥 GET INVOICES ERROR');
    console.log('='.repeat(60));
    console.error('Error details:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
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
            address: true
          }
        },
        job: {
        select: {
          id: true,
          trackingId: true,
          goodsType: true,
          port: true,
          status: true
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

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new invoice
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      jobId,
      shipmentId,
      customerId,
      amount,
      issueDate,
      dueDate
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
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        jobId,
        shipmentId,
        customerId: customer.id,
        amount: parseFloat(amount),
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        createdById: req.user.id
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
            goodsType: true,
            port: true,
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

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
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
            goodsType: true,
            port: true,
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
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update invoice status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
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

    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
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
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get jobs for invoice creation dropdown
router.get('/jobs', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { search = '' } = req.query;

    const jobs = await prisma.job.findMany({
      where: {
        OR: [
          { trackingId: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } }
        ]
      },
      select: {
        id: true,
        trackingId: true,
        status: true,
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
      take: 50
    });

    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs for invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
