const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const { PERMISSIONS } = require('../utils/permissions');

const prisma = new PrismaClient();

// Generate unique estimate number
const generateEstimateNumber = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePrefix = `EST-${year}${month}`;

    console.log('🔷 [Estimates] Generating estimate number for:', datePrefix);

    const lastEstimate = await prisma.estimate.findFirst({
      where: {
        estimateNumber: {
          startsWith: datePrefix
        }
      },
      orderBy: {
        estimateNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastEstimate) {
      console.log('  - Last estimate this month:', lastEstimate.estimateNumber);
      const lastNumber = parseInt(lastEstimate.estimateNumber.split('-').pop()) || 0;
      nextNumber = lastNumber + 1;
      console.log('  - Next number:', nextNumber);
    } else {
      console.log('  - First estimate of the month');
    }

    const generatedNumber = `${datePrefix}-${nextNumber.toString().padStart(4, '0')}`;
    console.log('✅ Generated estimate number:', generatedNumber);

    return generatedNumber;
  } catch (error) {
    console.error('❌ [Estimates] Error generating estimate number:', error);
    throw error;
  }
};

// Get all estimates
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔷 [Estimates API] GET /estimates');
    console.log('  - User:', req.user?.email);

    const estimates = await prisma.estimate.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${estimates.length} estimates`);

    res.json({ 
      success: true,
      estimates 
    });
  } catch (error) {
    console.error('❌ [Estimates API] GET /estimates error:', error);
    res.status(500).json({ error: 'Failed to fetch estimates' });
  }
});

// Get single estimate
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔷 [Estimates API] GET /estimates/:id');
    console.log('  - Estimate ID:', id);

    const estimate = await prisma.estimate.findUnique({
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!estimate) {
      console.log('❌ Estimate not found');
      return res.status(404).json({ error: 'Estimate not found' });
    }

    console.log('✅ Estimate found:', estimate.estimateNumber);

    res.json({ 
      success: true,
      estimate 
    });
  } catch (error) {
    console.error('❌ [Estimates API] GET /estimates/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch estimate' });
  }
});

// Create new estimate
router.post('/', authenticateToken, requirePermission(PERMISSIONS.ESTIMATE_CREATE), async (req, res) => {
  try {
    console.log('🔷 [Estimates API] POST /estimates');
    console.log('  - User:', req.user?.email);
    console.log('  - Request body:', JSON.stringify(req.body, null, 2));

    const {
      customerId,
      amount,
      description,
      charges,
      comments,
      terms,
      issueDate,
      validUntil,
      status
    } = req.body;

    // Validate required fields
    if (!customerId || !amount) {
      return res.status(400).json({ 
        error: 'Customer and amount are required' 
      });
    }

    // Generate estimate number
    const estimateNumber = await generateEstimateNumber();

    // Create estimate
    const estimate = await prisma.estimate.create({
      data: {
        estimateNumber,
        customerId,
        createdById: req.user.id,
        amount: parseFloat(amount),
        description,
        charges: charges || null,
        comments,
        terms,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        status: status || 'DRAFT'
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Estimate created:', estimate.estimateNumber);

    res.status(201).json({ 
      success: true,
      message: 'Estimate created successfully',
      estimate 
    });
  } catch (error) {
    console.error('❌ [Estimates API] POST /estimates error:', error);
    res.status(500).json({ error: 'Failed to create estimate' });
  }
});

// Update estimate
router.put('/:id', authenticateToken, requirePermission(PERMISSIONS.ESTIMATE_EDIT), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔷 [Estimates API] PUT /estimates/:id');
    console.log('  - Estimate ID:', id);
    console.log('  - User:', req.user?.email);

    const {
      customerId,
      amount,
      description,
      charges,
      comments,
      terms,
      issueDate,
      validUntil,
      status
    } = req.body;

    // Check if estimate exists
    const existingEstimate = await prisma.estimate.findUnique({
      where: { id }
    });

    if (!existingEstimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    // Prepare update data
    const updateData = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (charges !== undefined) updateData.charges = charges;
    if (comments !== undefined) updateData.comments = comments;
    if (terms !== undefined) updateData.terms = terms;
    if (issueDate !== undefined) updateData.issueDate = new Date(issueDate);
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
    if (status !== undefined) updateData.status = status;

    // Update estimate
    const estimate = await prisma.estimate.update({
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Estimate updated:', estimate.estimateNumber);

    res.json({ 
      success: true,
      message: 'Estimate updated successfully',
      estimate 
    });
  } catch (error) {
    console.error('❌ [Estimates API] PUT /estimates/:id error:', error);
    res.status(500).json({ error: 'Failed to update estimate' });
  }
});

// Delete estimate
router.delete('/:id', authenticateToken, requirePermission(PERMISSIONS.ESTIMATE_DELETE), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔷 [Estimates API] DELETE /estimates/:id');
    console.log('  - Estimate ID:', id);

    const estimate = await prisma.estimate.findUnique({
      where: { id }
    });

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    // Don't allow deletion if converted to invoice
    if (estimate.convertedToInvoice) {
      return res.status(400).json({ 
        error: 'Cannot delete estimate that has been converted to an invoice' 
      });
    }

    await prisma.estimate.delete({
      where: { id }
    });

    console.log('✅ Estimate deleted:', estimate.estimateNumber);

    res.json({ 
      success: true,
      message: 'Estimate deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [Estimates API] DELETE /estimates/:id error:', error);
    res.status(500).json({ error: 'Failed to delete estimate' });
  }
});

// Send estimate (update status to SENT)
router.post('/:id/send', authenticateToken, requirePermission(PERMISSIONS.ESTIMATE_SEND), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔷 [Estimates API] POST /estimates/:id/send');
    console.log('  - Estimate ID:', id);

    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'SENT'
      },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Estimate sent:', estimate.estimateNumber);

    // TODO: Send email notification to customer

    res.json({ 
      success: true,
      message: 'Estimate sent successfully',
      estimate 
    });
  } catch (error) {
    console.error('❌ [Estimates API] POST /estimates/:id/send error:', error);
    res.status(500).json({ error: 'Failed to send estimate' });
  }
});

module.exports = router;

