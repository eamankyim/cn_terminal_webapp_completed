const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');
const RealtimeNotificationService = require('../services/realtimeNotificationService');

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
 *               - assignedTo
 *               - goodsTypes
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               consignmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Consignment ID (optional)
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               assignedTo:
 *                 type: string
 *                 description: User ID of assigned staff member
 *                 example: 123e4567-e89b-12d3-a456-426614174002
 *               goodsTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of goods types
 *                 example: ["Electronics", "Machinery"]
 *               estimatedValue:
 *                 type: number
 *                 description: Estimated value of goods
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
router.get('/', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    console.log('🔷 [Jobs API] GET /jobs');
    console.log('  - User:', req.user?.email, 'Role:', req.user?.role);
    console.log('  - Query params:', req.query);

    const { page = 1, limit = 10, search = '', status, customerId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};
    
    // Special visibility rules for draft jobs
    // Draft jobs are only visible to:
    // 1. The person who created it (createdById)
    // 2. The person assigned to it (assignedToId) - but only if they created it themselves
    const visibilityConditions = [
      // Non-draft jobs are visible to everyone
      { isDraft: false },
      // Draft jobs are only visible to creator or assigned person (if they created it)
      {
        AND: [
          { isDraft: true },
          {
            OR: [
              { createdById: req.user.id }, // Creator can see their drafts
              { 
                AND: [
                  { assignedToId: req.user.id }, // Assigned person
                  { createdById: req.user.id }   // But only if they created it
                ]
              }
            ]
          }
        ]
      }
    ];
    
    // Role-based filtering: DRIVER only sees assigned jobs
    if (req.user.role === 'DRIVER') {
      // DRIVER only sees jobs where they are the assignee OR the driverName matches
      const driverFilter = {
        OR: [
          { assignedToId: req.user.id },
          { driverName: req.user.name }
        ]
      };
      
      // Merge driver filter with visibility conditions
      const conditionsWithDriver = visibilityConditions.map(condition => ({
        AND: [condition, driverFilter]
      }));
      
      visibilityConditions.splice(0, visibilityConditions.length, ...conditionsWithDriver);
      
      console.log('  - Applied DRIVER filtering: only assigned jobs or driver-matched jobs');
    }

    // Add search conditions if provided
    if (search) {
      const searchConditions = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
      
      where.AND = [
        { OR: visibilityConditions },
        { OR: searchConditions }
      ];
    } else {
      where.OR = visibilityConditions;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // Test query to check if fields exist in database
    const testJob = await prisma.job.findFirst({
      select: {
        id: true,
        trackingId: true,
        mediumOfEnquiry: true,
        documentsBrought: true,
        containerNumber: true,
        blNumber: true,
        vesselName: true,
        line: true,
        jobDescription: true
      }
    });

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          trackingId: true,
          customerId: true,
          consignmentId: true,
          createdById: true,
          updatedById: true,
          assignedToId: true,
          status: true,
          isDraft: true,
          submittedDate: true,
          eta: true,
          demurrageFreeDays: true,
          releaseMoneyReceived: true,
          shipperName: true,
          invoiceNumber: true,
          terminalName: true,
          scheduleTime: true,
          driverName: true,
          driverContact: true,
          createdAt: true,
          updatedAt: true,
          goodsTypes: true,
          mediumOfEnquiry: true,
          documentsBrought: true,
          containerNumber: true,
          blNumber: true,
          vesselName: true,
          line: true,
          jobDescription: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              ghanaCard: true,
              tin: true
            }
          },
          consignment: {
            select: {
              id: true,
              trackingId: true,
              consigneeName: true,
              consigneePhone: true,
              status: true,
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
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          statusHistory: {
            orderBy: { date: 'desc' },
            include: {
              updatedByUser: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
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

    // Log job status distribution
    const statusCounts = {};
    jobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    console.log('  - Jobs returned by status:', statusCounts);
    console.log('  - Total jobs:', jobs.length);
    
    const preinvoicedJobs = jobs.filter(job => job.status === 'PREINVOICED');
    console.log('  - PREINVOICED jobs:', preinvoicedJobs.length);
    preinvoicedJobs.forEach(job => {
      console.log('    -', job.trackingId, 'isDraft:', job.isDraft);
    });

    const response = {
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    };

    res.json(response);
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        trackingId: true,
        customerId: true,
        consignmentId: true,
        createdById: true,
        updatedById: true,
        assignedToId: true,
        status: true,
        isDraft: true,
        submittedDate: true,
        eta: true,
        demurrageFreeDays: true,
        releaseMoneyReceived: true,
        shipperName: true,
        invoiceNumber: true,
        createdAt: true,
        updatedAt: true,
        goodsTypes: true,
        mediumOfEnquiry: true,
        documentsBrought: true,
        containerNumber: true,
        blNumber: true,
        vesselName: true,
        line: true,
        jobDescription: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            ghanaCard: true,
            tin: true
          }
        },
        consignment: {
          select: {
            id: true,
            trackingId: true,
            consigneeName: true,
            consigneePhone: true,
            status: true,
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
        assignedTo: {
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

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate system job ID with format: YYYYMMDDNNNN
const generateJobId = async () => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    console.log('🔷 [Jobs] Generating job ID for date:', datePrefix);

    // Find the highest job number for today
    const lastJob = await prisma.job.findFirst({
      where: {
        trackingId: {
          startsWith: datePrefix
        }
      },
      orderBy: {
        trackingId: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastJob) {
      console.log('  - Last job today:', lastJob.trackingId);
      // Extract the last 4 digits (the sequential number)
      const lastNumber = parseInt(lastJob.trackingId.slice(-4)) || 0;
      nextNumber = lastNumber + 1;
      console.log('  - Next number:', nextNumber);
    } else {
      console.log('  - First job of the day');
    }

    // Format: YYYYMMDDNNNN (e.g., 202510210001)
    const generatedId = `${datePrefix}${nextNumber.toString().padStart(4, '0')}`;
    console.log('✅ Generated job ID:', generatedId);

    return generatedId;
  } catch (error) {
    console.error('❌ [Jobs] Error generating job ID:', error);
    throw error;
  }
};

// Create new job
router.post('/', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {

    const {
      customerId,
      consignmentId,
      assignedToId,
      status,
      isDraft = false,
      goodsTypes = [],
      eta,
      mediumOfEnquiry,
      documentsBrought = [],
      containerNumber,
      blNumber,
      vesselName,
      line,
      jobDescription
    } = req.body;

    // Validate required fields
    if (!customerId || !assignedToId) {

      return res.status(400).json({ 
        error: 'Customer and assigned to are required' 
      });
    }

    // Validate goods types
    if (!goodsTypes || goodsTypes.length === 0) {

      return res.status(400).json({ 
        error: 'At least one goods type is required' 
      });
    }

    // Check if customer exists

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {

      return res.status(400).json({ error: 'Customer not found' });
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

    // Generate system job ID

    const trackingId = await generateJobId();

    // Create job

    const jobData = {
      customerId,
      consignmentId,
      trackingId,
      assignedToId,
      status: status || 'NEW',
      isDraft,
      goodsTypes,
      eta: eta ? new Date(eta) : null,
      mediumOfEnquiry,
      documentsBrought,
      containerNumber,
      blNumber,
      vesselName,
      line,
      jobDescription,
      createdById: req.user.id,
      submittedDate: isDraft ? null : new Date() // Only set submittedDate if not a draft
    };

    const job = await prisma.job.create({
      data: jobData,
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
            consigneeName: true,
            consigneePhone: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create initial status history

    await prisma.jobStatusHistory.create({
      data: {
        jobId: job.id,
        status: jobData.status,
        updatedById: req.user.id
      }
    });

    // Create notifications for job creation and assignment with real-time updates
    try {
      // Notify the assigned user about the new job
      await RealtimeNotificationService.notifyJobAssignmentRealtime(job.id, job.assignedToId, req.user.id);

      // Notify all staff about new job creation (optional - for visibility)
      await NotificationService.createNotification({
        title: 'New Job Created',
        message: `New job ${job.trackingId} has been created for ${job.customer.name}`,
        type: 'INFO',
        category: 'JOB_CREATED',
        userId: req.user.id,
        jobId: job.id,
        metadata: {
          jobTrackingId: job.trackingId,
          customerName: job.customer.name,
          assignedTo: job.assignedToId,
          createdBy: req.user.name
        }
      });

    } catch (notificationError) {

      // Don't fail the job creation if notifications fail
    }

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {

    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update job
router.put('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consignmentId,
      assignedToId,
      status,
      isDraft,
      goodsTypes,
      eta,
      demurrageFreeDays,
      releaseMoneyReceived,
      mediumOfEnquiry,
      documentsBrought,
      containerNumber,
      blNumber,
      vesselName,
      line,
      jobDescription
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

    // Validate demurrage/free days and release money are required for RELEASED status
    if (status === 'RELEASED') {
      if (demurrageFreeDays === undefined || demurrageFreeDays === null) {
        return res.status(400).json({ 
          error: 'Demurrage/Free days is required when status is RELEASED' 
        });
      }
      if (releaseMoneyReceived === undefined || releaseMoneyReceived === null) {
        return res.status(400).json({ 
          error: 'Release money status is required when status is RELEASED' 
        });
      }
    }

    // Validate ETA is in the future if provided
    if (eta && new Date(eta) <= new Date()) {
      return res.status(400).json({ 
        error: 'ETA must be in the future' 
      });
    }

    // Prepare update data
    const updateData = {
      consignmentId,
      assignedToId,
      status,
      updatedById: req.user.id
    };

    // Add isDraft if provided
    if (isDraft !== undefined) {
      updateData.isDraft = isDraft;
      // Set submittedDate when moving from draft to submitted
      if (!isDraft && existingJob.isDraft) {
        updateData.submittedDate = new Date();
      }
    }

    // Add goods types if provided
    if (goodsTypes && goodsTypes.length > 0) {
      updateData.goodsTypes = goodsTypes;
    }

    // Add ETA if provided
    if (eta !== undefined) {
      updateData.eta = eta ? new Date(eta) : null;
    }

    // Add demurrage/free days if provided
    if (demurrageFreeDays !== undefined) {
      updateData.demurrageFreeDays = parseInt(demurrageFreeDays);
    }

    // Add release money status if provided
    if (releaseMoneyReceived !== undefined) {
      updateData.releaseMoneyReceived = releaseMoneyReceived;
    }

    // Add medium of enquiry if provided
    if (mediumOfEnquiry !== undefined) {
      updateData.mediumOfEnquiry = mediumOfEnquiry;
    }

    // Add documents brought if provided
    if (documentsBrought !== undefined) {
      updateData.documentsBrought = documentsBrought;
    }

    // Add container number if provided
    if (containerNumber !== undefined) {
      updateData.containerNumber = containerNumber;
    }

    // Add B/L number if provided
    if (blNumber !== undefined) {
      updateData.blNumber = blNumber;
    }

    // Add vessel name if provided
    if (vesselName !== undefined) {
      updateData.vesselName = vesselName;
    }

    // Add line if provided
    if (line !== undefined) {
      updateData.line = line;
    }

    // Add job description if provided
    if (jobDescription !== undefined) {
      updateData.jobDescription = jobDescription;
    }

    // Update job
    const updatedJob = await prisma.job.update({
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
        consignment: {
          select: {
            id: true,
            trackingId: true,
            consigneeName: true,
            status: true
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
          updatedById: req.user.id
        }
      });
    }

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status
router.put('/:id/status', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, boeNumber, demurrageType } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate BoE number is required for ENTRY_COMPLETED status
    if (status === 'ENTRY_COMPLETED') {
      if (!boeNumber || boeNumber.trim() === '') {
        return res.status(400).json({ 
          error: 'BoE number is required when status is ENTRY_COMPLETED' 
        });
      }
    }

    // Validate demurrage/free days and release money are required for RELEASED status
    if (status === 'RELEASED') {
      if (demurrageFreeDays === undefined || demurrageFreeDays === null || demurrageFreeDays === '') {
        return res.status(400).json({ 
          error: 'Demurrage/Free days is required when status is RELEASED' 
        });
      }
      if (isNaN(parseInt(demurrageFreeDays)) || parseInt(demurrageFreeDays) < 0) {
        return res.status(400).json({ 
          error: 'Demurrage/Free days must be a valid positive number' 
        });
      }
      if (releaseMoneyReceived === undefined || releaseMoneyReceived === null) {
        return res.status(400).json({ 
          error: 'Release money status is required when status is RELEASED' 
        });
      }
    }

    // Validate shipper name and invoice number are required for INVOICED status
    if (status === 'INVOICED') {
      if (!shipperName || shipperName.trim() === '') {
        return res.status(400).json({ 
          error: 'Shipper name is required when status is INVOICED' 
        });
      }
      if (!invoiceNumber || invoiceNumber.trim() === '') {
        return res.status(400).json({ 
          error: 'Invoice number is required when status is INVOICED' 
        });
      }
    }

    // Validate RELEASED status fields are required
    if (status === 'RELEASED') {
      if (!terminalName || terminalName.trim() === '') {
        return res.status(400).json({ 
          error: 'Terminal name is required when status is RELEASED' 
        });
      }
      if (!scheduleTime) {
        return res.status(400).json({ 
          error: 'Schedule time is required when status is RELEASED' 
        });
      }
      if (!driverName || driverName.trim() === '') {
        return res.status(400).json({ 
          error: 'Driver name is required when status is RELEASED' 
        });
      }
      if (!driverContact || driverContact.trim() === '') {
        return res.status(400).json({ 
          error: 'Driver contact is required when status is RELEASED' 
        });
      }
      if (demurrageFreeDays === undefined || demurrageFreeDays === null) {
        return res.status(400).json({ 
          error: 'Demurrage/Free days is required when status is RELEASED' 
        });
      }
      if (releaseMoneyReceived === undefined || releaseMoneyReceived === null) {
        return res.status(400).json({ 
          error: 'Release money received status is required when status is RELEASED' 
        });
      }
    }

    // Validate ETA is in the future if provided
    if (eta && new Date(eta) <= new Date()) {
      return res.status(400).json({ 
        error: 'ETA must be in the future' 
      });
    }

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Status hierarchy validation - jobs can only progress forward
    const STATUS_HIERARCHY = {
      'NEW': 1,
      'PREINVOICED': 2,
      'INVOICED': 3,           // Auto-set only when invoice is created
      'ENTRY_COMPLETED': 4,
      'READY_FOR_RELEASE': 5,  // Transport coordinator assigns and uploads docs
      'RELEASED': 6,
      'CLEARED': 7,
      'DELIVERED': 8           // Final status - no further changes
    };

    const currentLevel = STATUS_HIERARCHY[existingJob.status];
    const newLevel = STATUS_HIERARCHY[status];

    // Validate status exists in hierarchy
    if (!currentLevel || !newLevel) {
      return res.status(400).json({ 
        error: 'Invalid status provided' 
      });
    }

    // Validate forward progression only
    if (newLevel <= currentLevel) {
      return res.status(400).json({ 
        error: 'Jobs can only progress forward in the workflow. Cannot move to previous or same status.' 
      });
    }

    // INVOICED is now a regular status that can be set manually

    // DELIVERED is final status - no further changes allowed
    if (existingJob.status === 'DELIVERED') {
      return res.status(400).json({ 
        error: 'Cannot update status of delivered jobs' 
      });
    }

    // Prepare update data
    const updateData = {
      status,
      updatedById: req.user.id
    };

    // Add ETA if provided
    if (eta !== undefined) {
      updateData.eta = eta ? new Date(eta) : null;

    }

    // Add assignedToId if provided
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;

    }

    // Add demurrage/free days if provided
    if (demurrageFreeDays !== undefined) {
      updateData.demurrageFreeDays = parseInt(demurrageFreeDays);
    }

    // Add release money status if provided
    if (releaseMoneyReceived !== undefined) {
      updateData.releaseMoneyReceived = releaseMoneyReceived;
    }

    // Add shipper name and invoice number if provided (for INVOICED status)
    if (shipperName !== undefined) {
      updateData.shipperName = shipperName.trim();
    }
    if (invoiceNumber !== undefined) {
      updateData.invoiceNumber = invoiceNumber.trim();
    }

    // Add RELEASED status fields if provided
    if (terminalName !== undefined) {
      updateData.terminalName = terminalName.trim();
    }
    if (scheduleTime !== undefined) {
      updateData.scheduleTime = new Date(scheduleTime);
    }
    if (driverName !== undefined) {
      updateData.driverName = driverName.trim();
    }
    if (driverContact !== undefined) {
      updateData.driverContact = driverContact.trim();
    }

    // Add BoE number if provided (for ENTRY_COMPLETED status)
    if (boeNumber !== undefined) {
      updateData.boeNumber = boeNumber.trim();
    }

    // Add demurrage type if provided (for RELEASED status)
    if (demurrageType !== undefined) {
      updateData.demurrageType = demurrageType;
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData
    });

    // Create status history entry
    await prisma.jobStatusHistory.create({
      data: {
        jobId: id,
        status,
        comment,
        updatedById: req.user.id
      }
    });

    // Fetch the complete job data with relations
    const completeJob = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        trackingId: true,
        customerId: true,
        consignmentId: true,
        createdById: true,
        updatedById: true,
        assignedToId: true,
        status: true,
        isDraft: true,
        submittedDate: true,
        eta: true,
        demurrageFreeDays: true,
        releaseMoneyReceived: true,
        shipperName: true,
        invoiceNumber: true,
        createdAt: true,
        updatedAt: true,
        goodsTypes: true,
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
            consigneePhone: true,
            status: true,
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
        assignedTo: {
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

    // Create notification for job status change with real-time updates
    try {
      await RealtimeNotificationService.notifyJobStatusChangeRealtime(
        id, 
        existingJob.status, 
        status, 
        req.user.id
      );

    } catch (notificationError) {

      // Don't fail the status update if notification fails
    }

    res.json({
      message: 'Job status updated successfully',
      job: completeJob
    });
  } catch (error) {

    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
});

// Get consignments for a customer
router.get('/customer/:customerId/consignments', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
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
        consigneeName: true,
        consigneePhone: true,
        status: true,
        date: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ consignments });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job
router.delete('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
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

    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
