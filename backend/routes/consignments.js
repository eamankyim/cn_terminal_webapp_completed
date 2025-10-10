const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all consignments (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const consignments = await prisma.consignment.findMany({
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ consignments });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch consignments' });
  }
});

// Get consignments by customer ID
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const consignments = await prisma.consignment.findMany({
      where: {
        customerId: customerId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ consignments });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch customer consignments' });
  }
});

// Get consignment by ID
router.get('/:id', authenticateToken, async (req, res) => {
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
            phone: true
          }
        }
      }
    });

    if (!consignment) {
      return res.status(404).json({ error: 'Consignment not found' });
    }

    res.json({ consignment });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch consignment' });
  }
});

// Create new consignment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customerId,
      consigneeName,
      consigneePhone,
      consigneeAddress,
      ghanaCard,
      tin,
      date
    } = req.body;

    // Validate required fields
    if (!customerId || !consigneeName || !consigneePhone || !consigneeAddress || !ghanaCard || !tin) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Generate unique tracking ID
    const generateTrackingId = () => {
      const prefix = 'CN';
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      return `${prefix}${timestamp}${random}`.toUpperCase();
    };

    const trackingId = generateTrackingId();

    const consignment = await prisma.consignment.create({
      data: {
        trackingId,
        customerId,
        consigneeName,
        consigneePhone,
        consigneeAddress,
        ghanaCard,
        tin,
        date: date ? new Date(date) : new Date(),
        status: 'PENDING'
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

    res.status(500).json({ error: 'Failed to create consignment' });
  }
});

// Update consignment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert date to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const consignment = await prisma.consignment.update({
      where: { id },
      data: updateData,
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
      consignment 
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to update consignment' });
  }
});

// Update consignment status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const consignment = await prisma.consignment.update({
      where: { id },
      data: { status },
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
      message: 'Consignment status updated successfully', 
      consignment 
    });
  } catch (error) {

    res.status(500).json({ error: 'Failed to update consignment status' });
  }
});

// Delete consignment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.consignment.delete({
      where: { id }
    });

    res.json({ message: 'Consignment deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Failed to delete consignment' });
  }
});

module.exports = router;