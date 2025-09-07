const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/consignments:
 *   get:
 *     summary: Get all consignments with pagination and filters
 *     tags: [Consignments]
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
 *         description: Search term for tracking ID or goods type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_TRANSIT, DELIVERED, CANCELLED]
 *         description: Filter by consignment status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of consignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 consignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Consignment'
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
 *     summary: Create a new consignment
 *     tags: [Consignments]
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
 *               - trackingId
 *               - goodsType
 *               - value
 *               - ghanaCard
 *               - tin
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               trackingId:
 *                 type: string
 *                 description: Consignment tracking ID
 *                 example: CONS-2025-001
 *               goodsType:
 *                 type: string
 *                 description: Type of goods
 *                 example: Electronics
 *               value:
 *                 type: number
 *                 description: Value in GHS
 *                 example: 10000
 *               ghanaCard:
 *                 type: string
 *                 description: Ghana Card number
 *                 example: GHA-123456789-1
 *               tin:
 *                 type: string
 *                 description: Tax Identification Number
 *                 example: TIN12345678
 *     responses:
 *       201:
 *         description: Consignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Consignment created successfully
 *                 consignment:
 *                   $ref: '#/components/schemas/Consignment'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all consignments
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { consigneeName: { contains: search, mode: 'insensitive' } },
        { goodsType: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [consignments, totalCount] = await Promise.all([
      prisma.consignment.findMany({
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
          _count: {
            select: {
              jobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.consignment.count({ where })
    ]);

    res.json({
      consignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get consignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get consignment by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const consignment = await prisma.consignment.findUnique({
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
        jobs: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!consignment) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    res.json({ consignment });
  } catch (error) {
    console.error('Get consignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new consignment
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      customerId,
      trackingId,
      consigneeName,
      consigneePhone,
      consigneeAddress,
      ghanaCard,
      tin,
      goodsType,
      value,
      date
    } = req.body;

    // Validate required fields
    if (!customerId || !trackingId || !consigneeName || !consigneePhone || 
        !consigneeAddress || !ghanaCard || !tin || !goodsType || !value || !date) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    // Check if tracking ID already exists
    const existingConsignment = await prisma.consignment.findUnique({
      where: { trackingId }
    });

    if (existingConsignment) {
      return res.status(400).json({ error: 'Consignment with this tracking ID already exists' });
    }

    // Create consignment
    const consignment = await prisma.consignment.create({
      data: {
        customerId,
        trackingId,
        consigneeName,
        consigneePhone,
        consigneeAddress,
        ghanaCard,
        tin,
        goodsType,
        value: parseFloat(value),
        date: new Date(date)
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
      message: 'Consignment created successfully',
      consignment
    });
  } catch (error) {
    console.error('Create consignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update consignment
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trackingId,
      consigneeName,
      consigneePhone,
      consigneeAddress,
      ghanaCard,
      tin,
      goodsType,
      value,
      status,
      date
    } = req.body;

    // Check if consignment exists
    const existingConsignment = await prisma.consignment.findUnique({
      where: { id }
    });

    if (!existingConsignment) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    // Check if tracking ID is already taken by another consignment
    if (trackingId && trackingId !== existingConsignment.trackingId) {
      const trackingIdExists = await prisma.consignment.findUnique({
        where: { trackingId }
      });

      if (trackingIdExists) {
        return res.status(400).json({ error: 'Tracking ID already in use by another consignment' });
      }
    }

    // Update consignment
    const updatedConsignment = await prisma.consignment.update({
      where: { id },
      data: {
        trackingId,
        consigneeName,
        consigneePhone,
        consigneeAddress,
        ghanaCard,
        tin,
        goodsType,
        value: value ? parseFloat(value) : undefined,
        status,
        date: date ? new Date(date) : undefined
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
      message: 'Consignment updated successfully',
      consignment: updatedConsignment
    });
  } catch (error) {
    console.error('Update consignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update consignment status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if consignment exists
    const existingConsignment = await prisma.consignment.findUnique({
      where: { id }
    });

    if (!existingConsignment) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    // Update consignment status
    const updatedConsignment = await prisma.consignment.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Consignment status updated successfully',
      consignment: updatedConsignment
    });
  } catch (error) {
    console.error('Update consignment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete consignment
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if consignment exists
    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    if (!consignment) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    // Check if consignment has related jobs
    if (consignment._count.jobs > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete consignment with existing jobs' 
      });
    }

    // Delete consignment
    await prisma.consignment.delete({
      where: { id }
    });

    res.json({ message: 'Consignment deleted successfully' });
  } catch (error) {
    console.error('Delete consignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
