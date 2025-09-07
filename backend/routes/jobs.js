const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with pagination and filters
 *     tags: [Jobs]
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
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by job status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *     responses:
 *       200:
 *         description: List of jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
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
 *     summary: Create a new job
 *     tags: [Jobs]
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
 *               - consignmentId
 *               - trackingId
 *               - goodsType
 *               - estimatedValue
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               consignmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Consignment ID
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               trackingId:
 *                 type: string
 *                 description: Job tracking ID
 *                 example: JOB-2025-001
 *               goodsType:
 *                 type: string
 *                 description: Type of goods
 *                 example: Electronics
 *               estimatedValue:
 *                 type: number
 *                 description: Estimated value in GHS
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job created successfully
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

// Get all jobs
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { goodsType: { contains: search, mode: 'insensitive' } },
        { port: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
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
          consignment: {
            select: {
              id: true,
              trackingId: true,
              goodsType: true,
              value: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true
            }
          },
          statusHistory: {
            orderBy: { date: 'desc' },
            take: 5
          },
          _count: {
            select: {
              documents: true,
              invoices: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
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
        consignment: {
          select: {
            id: true,
            trackingId: true,
            consigneeName: true,
            goodsType: true,
            value: true,
            ghanaCard: true,
            tin: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        statusHistory: {
          orderBy: { date: 'desc' }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        invoices: {
          include: {
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new job
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      customerId,
      consignmentId,
      trackingId,
      goodsType,
      port,
      assignedTo,
      estimatedValue
    } = req.body;

    // Validate required fields
    if (!customerId || !trackingId || !goodsType || !port || !assignedTo || !estimatedValue) {
      return res.status(400).json({ 
        error: 'Customer, tracking ID, goods type, port, assigned to, and estimated value are required' 
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
    const existingJob = await prisma.job.findUnique({
      where: { trackingId }
    });

    if (existingJob) {
      return res.status(400).json({ error: 'Job with this tracking ID already exists' });
    }

    // Check if consignment exists and belongs to customer (if provided)
    if (consignmentId) {
      const consignment = await prisma.consignment.findFirst({
        where: {
          id: consignmentId,
          customerId
        }
      });

      if (!consignment) {
        return res.status(400).json({ error: 'Consignment not found or does not belong to this customer' });
      }
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        customerId,
        consignmentId,
        trackingId,
        goodsType,
        port,
        assignedTo,
        estimatedValue: parseFloat(estimatedValue),
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
        consignment: {
          select: {
            id: true,
            trackingId: true,
            goodsType: true,
            value: true
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

    // Create initial status history
    await prisma.jobStatusHistory.create({
      data: {
        jobId: job.id,
        status: 'SUBMITTED',
        updatedBy: req.user.id
      }
    });

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consignmentId,
      goodsType,
      port,
      assignedTo,
      status,
      estimatedValue
    } = req.body;

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if consignment exists and belongs to job's customer (if provided)
    if (consignmentId && consignmentId !== existingJob.consignmentId) {
      const consignment = await prisma.consignment.findFirst({
        where: {
          id: consignmentId,
          customerId: existingJob.customerId
        }
      });

      if (!consignment) {
        return res.status(400).json({ error: 'Consignment not found or does not belong to this job\'s customer' });
      }
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        consignmentId,
        goodsType,
        port,
        assignedTo,
        status,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        updatedById: req.user.id
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
        consignment: {
          select: {
            id: true,
            trackingId: true,
            goodsType: true,
            value: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create status history entry if status changed
    if (status && status !== existingJob.status) {
      await prisma.jobStatusHistory.create({
        data: {
          jobId: id,
          status,
          updatedBy: req.user.id
        }
      });
    }

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status,
        updatedById: req.user.id
      }
    });

    // Create status history entry
    await prisma.jobStatusHistory.create({
      data: {
        jobId: id,
        status,
        comment,
        updatedBy: req.user.id
      }
    });

    res.json({
      message: 'Job status updated successfully',
      job: updatedJob
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get consignments for a customer
router.get('/customer/:customerId/consignments', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get consignments for the customer
    const consignments = await prisma.consignment.findMany({
      where: { customerId },
      select: {
        id: true,
        trackingId: true,
        goodsType: true,
        value: true,
        status: true,
        date: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ consignments });
  } catch (error) {
    console.error('Get customer consignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
            invoices: true,
            statusHistory: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if job has related data
    if (job._count.documents > 0 || job._count.invoices > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete job with existing documents or invoices' 
      });
    }

    // Delete job (status history will be deleted automatically due to cascade)
    await prisma.job.delete({
      where: { id }
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
