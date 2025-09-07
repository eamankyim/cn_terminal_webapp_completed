const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     summary: Get all shipments with pagination and filters
 *     tags: [Shipments]
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
 *         description: Search term for tracking number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_TRANSIT, DELIVERED, CANCELLED]
 *         description: Filter by shipment status
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [EXPRESS, STANDARD, ECONOMY]
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of shipments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shipments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shipment'
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
 *     summary: Create a new shipment
 *     tags: [Shipments]
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
 *               - serviceType
 *               - origin
 *               - destination
 *               - weight
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               serviceType:
 *                 type: string
 *                 enum: [EXPRESS, STANDARD, ECONOMY]
 *                 description: Service type
 *                 example: STANDARD
 *               origin:
 *                 type: string
 *                 description: Origin address
 *                 example: Accra, Ghana
 *               destination:
 *                 type: string
 *                 description: Destination address
 *                 example: Kumasi, Ghana
 *               weight:
 *                 type: number
 *                 description: Weight in kg
 *                 example: 5.5
 *               dimensions:
 *                 type: string
 *                 description: Package dimensions
 *                 example: 20cm x 15cm x 10cm
 *     responses:
 *       201:
 *         description: Shipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Shipment created successfully
 *                 shipment:
 *                   $ref: '#/components/schemas/Shipment'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all shipments
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { packageType: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [shipments, totalCount] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          _count: {
            select: {
              invoices: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      shipments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shipment by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        invoices: {
          include: {
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ shipment });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new shipment
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      trackingId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      packageType,
      packageWeight,
      packageValue,
      packageDescription,
      collectionAddress,
      deliveryAddress,
      deliveryCity,
      recipientName,
      recipientPhone,
      serviceType,
      customerId
    } = req.body;

    // Validate required fields
    if (!trackingId || !customerName || !customerEmail || !customerPhone || 
        !customerAddress || !packageType || !packageWeight || !packageValue || 
        !packageDescription || !collectionAddress || !deliveryAddress || 
        !deliveryCity || !recipientName || !recipientPhone || !serviceType) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Check if tracking ID already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { trackingId }
    });

    if (existingShipment) {
      return res.status(400).json({ error: 'Shipment with this tracking ID already exists' });
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        trackingId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        packageType,
        packageWeight: parseFloat(packageWeight),
        packageValue: parseFloat(packageValue),
        packageDescription,
        collectionAddress,
        deliveryAddress,
        deliveryCity,
        recipientName,
        recipientPhone,
        serviceType
      }
    });

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shipment
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      trackingId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      packageType,
      packageWeight,
      packageValue,
      packageDescription,
      collectionAddress,
      deliveryAddress,
      deliveryCity,
      recipientName,
      recipientPhone,
      serviceType,
      status,
      collectionDate
    } = req.body;

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id }
    });

    if (!existingShipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if tracking ID is already taken by another shipment
    if (trackingId && trackingId !== existingShipment.trackingId) {
      const trackingIdExists = await prisma.shipment.findUnique({
        where: { trackingId }
      });

      if (trackingIdExists) {
        return res.status(400).json({ error: 'Tracking ID already in use by another shipment' });
      }
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: {
        trackingId,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        packageType,
        packageWeight: packageWeight ? parseFloat(packageWeight) : undefined,
        packageValue: packageValue ? parseFloat(packageValue) : undefined,
        packageDescription,
        collectionAddress,
        deliveryAddress,
        deliveryCity,
        recipientName,
        recipientPhone,
        serviceType,
        status,
        collectionDate: collectionDate ? new Date(collectionDate) : undefined
      }
    });

    res.json({
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shipment status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, collectionDate } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id }
    });

    if (!existingShipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update shipment status
    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        collectionDate: collectionDate ? new Date(collectionDate) : undefined
      }
    });

    res.json({
      message: 'Shipment status updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete shipment
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true
          }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if shipment has related invoices
    if (shipment._count.invoices > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shipment with existing invoices' 
      });
    }

    // Delete shipment
    await prisma.shipment.delete({
      where: { id }
    });

    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
