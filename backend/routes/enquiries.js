const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/enquiries:
 *   get:
 *     summary: Get all enquiries with pagination and filters
 *     tags: [Enquiries]
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
 *         description: Search term for subject or message
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter by enquiry status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of enquiries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enquiries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enquiry'
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
 *     summary: Create a new enquiry
 *     tags: [Enquiries]
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
 *               - subject
 *               - message
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               subject:
 *                 type: string
 *                 description: Enquiry subject
 *                 example: Shipping inquiry
 *               message:
 *                 type: string
 *                 description: Enquiry message
 *                 example: I would like to know about shipping rates to Kumasi
 *     responses:
 *       201:
 *         description: Enquiry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Enquiry created successfully
 *                 enquiry:
 *                   $ref: '#/components/schemas/Enquiry'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all enquiries
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { goodsType: { contains: search, mode: 'insensitive' } },
        { port: { contains: search, mode: 'insensitive' } },
        { goodsDescription: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [enquiries, totalCount] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: {
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
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.enquiry.count({ where })
    ]);

    res.json({
      enquiries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get enquiries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get enquiry by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await prisma.enquiry.findUnique({
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
        }
      }
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({ enquiry });
  } catch (error) {
    console.error('Get enquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new enquiry
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      customerId,
      commercialInvoice,
      goodsType,
      port,
      goodsDescription,
      estimatedValue,
      ghanaCard,
      tin
    } = req.body;

    // Validate required fields
    if (!customerId || !goodsType || !port || !goodsDescription || !estimatedValue) {
      return res.status(400).json({ 
        error: 'Customer, goods type, port, goods description, and estimated value are required' 
      });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    // Create enquiry
    const enquiry = await prisma.enquiry.create({
      data: {
        customerId,
        commercialInvoice,
        goodsType,
        port,
        goodsDescription,
        estimatedValue: parseFloat(estimatedValue),
        ghanaCard,
        tin
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Enquiry created successfully',
      enquiry
    });
  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update enquiry
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      commercialInvoice,
      goodsType,
      port,
      goodsDescription,
      estimatedValue,
      status
    } = req.body;

    // Check if enquiry exists
    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id }
    });

    if (!existingEnquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Update enquiry
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        commercialInvoice,
        goodsType,
        port,
        goodsDescription,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        status
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Enquiry updated successfully',
      enquiry: updatedEnquiry
    });
  } catch (error) {
    console.error('Update enquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update enquiry status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if enquiry exists
    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id }
    });

    if (!existingEnquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Update enquiry status
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Enquiry status updated successfully',
      enquiry: updatedEnquiry
    });
  } catch (error) {
    console.error('Update enquiry status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete enquiry
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if enquiry exists
    const enquiry = await prisma.enquiry.findUnique({
      where: { id }
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Delete enquiry
    await prisma.enquiry.delete({
      where: { id }
    });

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
