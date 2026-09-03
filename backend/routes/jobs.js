const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission, checkUserPermission, PERMISSIONS } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');
const RealtimeNotificationService = require('../services/realtimeNotificationService');
const SocketService = require('../services/socketService');
const SmsNotificationService = require('../services/smsNotificationService');
const { getJobSelect } = require('../utils/jobSelect');
const { applyEtaFilterToWhere, shouldOrderByEta } = require('../utils/etaFilter');

const router = express.Router();

const buildJobSearchConditions = (search) => {
  const term = typeof search === 'string' ? search.trim() : '';
  if (!term) return [];
  return [
    { trackingId: { contains: term, mode: 'insensitive' } },
    { containerNumber: { contains: term, mode: 'insensitive' } },
    { blNumber: { contains: term, mode: 'insensitive' } },
    { vesselName: { contains: term, mode: 'insensitive' } },
    { line: { contains: term, mode: 'insensitive' } },
    { jobDescription: { contains: term, mode: 'insensitive' } },
    { boeNumber: { contains: term, mode: 'insensitive' } },
    { invoiceNumber: { contains: term, mode: 'insensitive' } },
    { driverName: { contains: term, mode: 'insensitive' } },
    { shipperName: { contains: term, mode: 'insensitive' } },
    { terminalName: { contains: term, mode: 'insensitive' } },
    { assignedTo: { name: { contains: term, mode: 'insensitive' } } },
    { customer: { name: { contains: term, mode: 'insensitive' } } },
    { customer: { email: { contains: term, mode: 'insensitive' } } },
    { customer: { phone: { contains: term, mode: 'insensitive' } } },
    { consignment: { consigneeName: { contains: term, mode: 'insensitive' } } }
  ];
};

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
 *         description: Search by tracking ID, container number, BL number, assignee, customer, or consignee name
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

    const { page = 1, limit = 10, search = '', status, customerId, etaFilter, assignedToId } = req.query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where = {};

    // ADMIN / IT_CONSULTANT see all jobs including everyone else's drafts.
    // Others: non-drafts are public; drafts only for creator or assignee.
    const canSeeAllDrafts = ['ADMIN', 'IT_CONSULTANT'].includes(req.user.role);

    if (!canSeeAllDrafts) {
      const visibilityConditions = [
        { isDraft: false },
        {
          AND: [
            { isDraft: true },
            {
              OR: [
                { createdById: req.user.id },
                { assignedToId: req.user.id }
              ]
            }
          ]
        }
      ];

      // Role-based filtering: DRIVER only sees assigned jobs
      if (req.user.role === 'DRIVER') {
        const driverFilter = {
          OR: [
            { assignedToId: req.user.id },
            { driverName: req.user.name }
          ]
        };

        const conditionsWithDriver = visibilityConditions.map(condition => ({
          AND: [condition, driverFilter]
        }));

        visibilityConditions.splice(0, visibilityConditions.length, ...conditionsWithDriver);

        console.log('  - Applied DRIVER filtering: only assigned jobs or driver-matched jobs');
      }

      if (search) {
        where.AND = [
          { OR: visibilityConditions },
          { OR: buildJobSearchConditions(search) }
        ];
      } else {
        where.OR = visibilityConditions;
      }
    } else if (search) {
      where.OR = buildJobSearchConditions(search);
    }

    if (status) {
      // Virtual filter used by dashboard "Jobs in Progress"
      // (submitted jobs that are past NEW and not yet CLEARED/DELIVERED)
      if (status === 'IN_PROGRESS') {
        where.status = {
          notIn: ['NEW', 'CLEARED', 'DELIVERED']
        };
      } else if (status === 'ASSIGNED_TO_ME') {
        // Virtual filter: only jobs assigned to the requesting user
        where.assignedToId = req.user.id;
      } else {
        where.status = status;
      }
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (assignedToId === 'unassigned') {
      where.assignedToId = null;
    } else if (assignedToId && assignedToId !== 'ASSIGNED_TO_ME') {
      where.assignedToId = assignedToId;
    }

    applyEtaFilterToWhere(where, etaFilter);

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

    const orderBy = shouldOrderByEta(etaFilter)
      ? [{ eta: 'asc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        select: getJobSelect({ includeCounts: true }),
        orderBy,
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
      select: getJobSelect({ includeDocuments: true, includeInvoices: true })
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Shared readable ID format: YYYY-MM-DD-NNNN (e.g. 2026-08-10-0001)
const getReadableDatePrefix = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}-`;
};

const nextDailySequence = (lastTrackingId) => {
  if (!lastTrackingId) return 1;
  const lastNumber = parseInt(String(lastTrackingId).slice(-4), 10) || 0;
  return lastNumber + 1;
};

// Generate system job ID with format: YYYY-MM-DD-NNNN
const generateJobId = async () => {
  try {
    const datePrefix = getReadableDatePrefix();

    console.log('🔷 [Jobs] Generating job ID for date:', datePrefix);

    // Prefer new readable format; also consider legacy YYYYMMDDNNNN for same calendar day
    const legacyPrefix = datePrefix.replace(/-/g, '');
    const [lastReadableJob, lastLegacyJob] = await Promise.all([
      prisma.job.findFirst({
        where: { trackingId: { startsWith: datePrefix } },
        orderBy: { trackingId: 'desc' }
      }),
      prisma.job.findFirst({
        where: {
          AND: [
            { trackingId: { startsWith: legacyPrefix } },
            { NOT: { trackingId: { contains: '-' } } }
          ]
        },
        orderBy: { trackingId: 'desc' }
      })
    ]);

    const nextFromReadable = nextDailySequence(lastReadableJob?.trackingId);
    const nextFromLegacy = nextDailySequence(lastLegacyJob?.trackingId);
    const nextNumber = Math.max(nextFromReadable, nextFromLegacy);

    const generatedId = `${datePrefix}${String(nextNumber).padStart(4, '0')}`;
    console.log('✅ Generated job ID:', generatedId);

    return generatedId;
  } catch (error) {
    console.error('❌ [Jobs] Error generating job ID:', error);
    throw error;
  }
};

// Consignee/consignment ID uses the SAME readable format as jobs (own daily sequence)
const generateConsignmentTrackingId = async () => {
  const datePrefix = getReadableDatePrefix();

  const lastConsignment = await prisma.consignment.findFirst({
    where: {
      trackingId: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      trackingId: 'desc'
    }
  });

  const nextNumber = nextDailySequence(lastConsignment?.trackingId);
  return `${datePrefix}${String(nextNumber).padStart(4, '0')}`;
};

const ensureConsignmentTrackingId = async (consignmentId) => {
  if (!consignmentId) return null;

  const consignment = await prisma.consignment.findUnique({
    where: { id: consignmentId }
  });

  if (!consignment) return null;

  if (consignment.trackingId) {
    return consignment;
  }

  const trackingId = await generateConsignmentTrackingId();
  return prisma.consignment.update({
    where: { id: consignmentId },
    data: { trackingId }
  });
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

    if (isDraft) {
      // Drafts only need a client so the row can be owned/listed.
      if (!customerId) {
        return res.status(400).json({
          error: 'Select a client to save a draft'
        });
      }
    } else {
      // Validate required fields for submitted jobs
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
    }

    // Check if customer exists

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {

      return res.status(400).json({ error: 'Customer not found' });
    }

    // Check if consignment exists and belongs to customer (if provided)
    let consignment = null;
    if (consignmentId) {

      consignment = await prisma.consignment.findFirst({
        where: {
          id: consignmentId,
          customerId
        }
      });

      if (!consignment) {

        return res.status(400).json({ error: 'Consignment not found or does not belong to this customer' });
      }

    }

    // Ghana Card / TIN required only when submitting (not for drafts)
    if (!isDraft) {
      const hasGhanaCard = customer.ghanaCard || (consignment && consignment.ghanaCard);
      const hasTin = customer.tin || (consignment && consignment.tin);

      if (!hasGhanaCard && !hasTin) {
        return res.status(400).json({
          error: 'At least one of Ghana Card or TIN must be provided for the customer/consignee'
        });
      }
    }

    // Validate BL number is unique (if provided)
    if (blNumber && blNumber.trim() !== '') {
      const existingJobWithBL = await prisma.job.findFirst({
        where: {
          blNumber: blNumber.trim()
        }
      });

      if (existingJobWithBL) {
        return res.status(400).json({ 
          error: `BL number "${blNumber.trim()}" is already in use by another job (Job ID: ${existingJobWithBL.trackingId})` 
        });
      }
    }

    // Assign readable consignee ID only when creating a job for that consignee
    if (consignmentId) {
      consignment = await ensureConsignmentTrackingId(consignmentId);
    }

    // Generate system job ID

    const trackingId = await generateJobId();

    // Create job

    const effectiveAssigneeId = assignedToId || req.user.id;
    const jobData = {
      customerId,
      consignmentId: consignmentId || null,
      trackingId,
      assignedToId: effectiveAssigneeId,
      lastAssignedAt: new Date(),
      status: status || 'NEW',
      isDraft,
      goodsTypes: Array.isArray(goodsTypes) ? goodsTypes : [],
      eta: eta ? new Date(eta) : null,
      mediumOfEnquiry: mediumOfEnquiry || null,
      documentsBrought: Array.isArray(documentsBrought) ? documentsBrought : [],
      containerNumber: containerNumber || null,
      blNumber: blNumber && blNumber.trim() !== '' ? blNumber.trim() : null, // Trim and store BL number
      vesselName: vesselName || null,
      line: line || null,
      jobDescription: jobDescription || null,
      createdById: req.user.id,
      submittedDate: isDraft ? null : new Date() // Only set submittedDate if not a draft
    };

    const job = await prisma.job.create({
      data: jobData,
      select: getJobSelect({ includeCounts: true })
    });

    // Create initial status history

    await prisma.jobStatusHistory.create({
      data: {
        jobId: job.id,
        status: jobData.status,
        updatedById: req.user.id
      }
    });

    // Re-fetch so statusHistory (with author) is present in the response
    const completeJob = await prisma.job.findUnique({
      where: { id: job.id },
      select: getJobSelect({ includeCounts: true })
    });

    // Create notifications for job creation and assignment with real-time updates
    try {
      // Notify all users about the new job assignment
      await RealtimeNotificationService.notifyJobAssignmentRealtime(
        completeJob.id,
        completeJob.assignedToId,
        req.user.id
      );

      // Notify all users about new job creation
      await NotificationService.createNotificationForAllUsers({
        title: 'New Job Created',
        message: `New job ${completeJob.trackingId} has been created for ${completeJob.customer.name}`,
        type: 'INFO',
        category: 'JOB_CREATED',
        jobId: completeJob.id,
        metadata: {
          jobTrackingId: completeJob.trackingId,
          customerName: completeJob.customer.name,
          assignedTo: completeJob.assignedToId,
          createdBy: req.user.name
        }
      });

    } catch (notificationError) {
      console.error('❌ [Jobs API] Error creating notifications:', notificationError);
      // Don't fail the job creation if notifications fail
    }

    // Staff SMS on assignment (skip self-assign; no all-staff blast)
    try {
      await SmsNotificationService.handleAssignment({
        jobId: completeJob.id,
        newAssigneeId: completeJob.assignedToId,
        previousAssigneeId: null,
        assignedById: req.user.id,
        isReassign: false
      });
    } catch (smsError) {
      console.error('❌ [Jobs API] Assignment SMS failed:', smsError.message);
    }

    // Customer SMS with ETA on real (non-draft) job create
    if (!isDraft) {
      try {
        await SmsNotificationService.notifyCustomerJobCreatedWithEta(completeJob.id);
      } catch (smsError) {
        console.error('❌ [Jobs API] Customer job-created ETA SMS failed:', smsError.message);
      }
    }

    // Emit socket event for real-time update
    SocketService.emitJobCreated(completeJob);

    res.status(201).json({
      message: 'Job created successfully',
      job: completeJob
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
    const nextConsignmentId =
      consignmentId !== undefined ? consignmentId : existingJob.consignmentId;

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

    // When submitting a draft, enforce the same required fields as create
    const submittingDraft = isDraft === false && existingJob.isDraft;
    if (submittingDraft) {
      const effectiveAssignedToId = assignedToId || existingJob.assignedToId;
      const effectiveGoodsTypes =
        goodsTypes && goodsTypes.length > 0 ? goodsTypes : existingJob.goodsTypes;

      if (!effectiveAssignedToId) {
        return res.status(400).json({ error: 'Assigned to is required to submit a job' });
      }
      if (!effectiveGoodsTypes || effectiveGoodsTypes.length === 0) {
        return res.status(400).json({ error: 'At least one goods type is required to submit a job' });
      }

      const customer = await prisma.customer.findUnique({
        where: { id: existingJob.customerId }
      });
      const consignment = nextConsignmentId
        ? await prisma.consignment.findUnique({ where: { id: nextConsignmentId } })
        : null;
      const hasGhanaCard = customer?.ghanaCard || consignment?.ghanaCard;
      const hasTin = customer?.tin || consignment?.tin;
      if (!hasGhanaCard && !hasTin) {
        return res.status(400).json({
          error: 'At least one of Ghana Card or TIN must be provided for the customer/consignee'
        });
      }
    }

    // Assign readable consignee ID when a job is linked to a consignee
    if (nextConsignmentId) {
      await ensureConsignmentTrackingId(nextConsignmentId);
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

    // Prepare update data
    const updateData = {
      consignmentId,
      assignedToId,
      status,
      updatedById: req.user.id
    };

    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      updateData.lastAssignedAt = new Date();
    }

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
      // Validate BL number is unique (if provided and not empty)
      if (blNumber && blNumber.trim() !== '') {
        const trimmedBlNumber = blNumber.trim();
        const existingJobWithBL = await prisma.job.findFirst({
          where: {
            blNumber: trimmedBlNumber,
            id: { not: id } // Exclude current job
          }
        });

        if (existingJobWithBL) {
          return res.status(400).json({ 
            error: `BL number "${trimmedBlNumber}" is already in use by another job (Job ID: ${existingJobWithBL.trackingId})` 
          });
        }
        updateData.blNumber = trimmedBlNumber;
      } else {
        // Allow clearing BL number by setting to null
        updateData.blNumber = null;
      }
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
    await prisma.job.update({
      where: { id },
      data: updateData
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

    const updatedJob = await prisma.job.findUnique({
      where: { id },
      select: getJobSelect({ includeCounts: true })
    });

    // Emit socket event for real-time update
    SocketService.emitJobUpdated(updatedJob);

    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      try {
        await RealtimeNotificationService.notifyJobAssignmentRealtime(
          id,
          assignedToId,
          req.user.id
        );
      } catch (notifyError) {
        console.error('Assignment notification failed:', notifyError);
      }
      try {
        await SmsNotificationService.handleAssignment({
          jobId: id,
          newAssigneeId: assignedToId,
          previousAssigneeId: existingJob.assignedToId,
          assignedById: req.user.id,
          isReassign: true
        });
      } catch (smsError) {
        console.error('Assignment SMS failed:', smsError.message);
      }
    }

    // Draft → submitted: same customer ETA SMS as create (skip if no ETA / no phone)
    if (submittingDraft) {
      try {
        await SmsNotificationService.notifyCustomerJobCreatedWithEta(id);
      } catch (smsError) {
        console.error('Customer job-created ETA SMS failed:', smsError.message);
      }
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
    // Supervisors and other roles without status permission cannot advance workflow
    const canUpdateStatus =
      ['ADMIN', 'IT_CONSULTANT'].includes(req.user.role) ||
      (await checkUserPermission(req.user.id, PERMISSIONS.JOB_UPDATE_STATUS));
    if (!canUpdateStatus) {
      return res.status(403).json({
        error: 'You do not have permission to update job status',
        required: PERMISSIONS.JOB_UPDATE_STATUS
      });
    }

    const { id } = req.params;
    const { status, comment, eta, assignedToId, demurrageFreeDays, releaseMoneyReceived, shipperName, invoiceNumber, terminalName, scheduleTime, driverName, driverContact, boeNumber, demurrageType } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const STATUS_HIERARCHY = {
      'NEW': 1,
      'PREINVOICED': 2,
      'INVOICED': 3,
      // VETTED is retired (vetting removed): rank kept only so legacy jobs
      // already at VETTED can still progress or be reverted.
      'VETTED': 4,
      'ENTRY_COMPLETED': 5,
      'DUTY_PAID': 6,
      'READY_FOR_RELEASE': 7,
      'RELEASED': 8,
      'CLEARED': 9,
      'DELIVERED': 10
    };

    const canRevertStatus = ['ADMIN', 'IT_CONSULTANT'].includes(req.user.role);

    // Check if job exists (needed to know if this is a revert)
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const currentLevel = STATUS_HIERARCHY[existingJob.status];
    const newLevel = STATUS_HIERARCHY[status];

    if (!currentLevel || !newLevel) {
      return res.status(400).json({
        error: 'Invalid status provided'
      });
    }

    const isRevert = newLevel < currentLevel;

    // Vetting has been retired: jobs can no longer move INTO VETTED.
    // Legacy jobs already at VETTED may still progress or be reverted.
    if (!isRevert && status === 'VETTED') {
      return res.status(400).json({
        error: 'The vetting step has been removed. Progress from INVOICED directly to ENTRY_COMPLETED.'
      });
    }

    if (isRevert) {
      if (!canRevertStatus) {
        return res.status(400).json({
          error: 'Jobs can only progress forward in the workflow. Cannot move to previous or same status.'
        });
      }
      if (!comment || String(comment).trim() === '') {
        return res.status(400).json({
          error: 'A comment is required when reverting job status'
        });
      }
    }

    // Validate BoE number is required for ENTRY_COMPLETED status (forward only)
    if (!isRevert && status === 'ENTRY_COMPLETED') {
      if (!boeNumber || boeNumber.trim() === '') {
        return res.status(400).json({ 
          error: 'BoE number is required when status is ENTRY_COMPLETED' 
        });
      }
      
      const trimmedBoeNumber = boeNumber.trim();
      
      // Validate BoE number is exactly 11 characters
      if (trimmedBoeNumber.length !== 11) {
        return res.status(400).json({ 
          error: 'BoE number must be exactly 11 characters' 
        });
      }
      
      // Validate BoE number contains only numeric digits
      if (!/^\d{11}$/.test(trimmedBoeNumber)) {
        return res.status(400).json({ 
          error: 'BoE number must contain only numeric digits (0-9)' 
        });
      }
    }

    // Validate demurrage/free days and release money are required for RELEASED status
    if (!isRevert && status === 'RELEASED') {
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

    // Validate RELEASED status fields are required
    if (!isRevert && status === 'RELEASED') {
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

    if (newLevel === currentLevel) {
      return res.status(400).json({
        error: 'Job is already at this status'
      });
    }

    if (!isRevert) {
      // DELIVERED can only be set from CLEARED status (final stage)
      if (status === 'DELIVERED' && existingJob.status !== 'CLEARED') {
        return res.status(400).json({
          error: 'DELIVERED status can only be set from CLEARED status'
        });
      }

      if (existingJob.status === 'DELIVERED') {
        return res.status(400).json({
          error: 'Cannot update status of delivered jobs'
        });
      }
    }

    const historyComment = isRevert
      ? `Status reverted from ${existingJob.status} to ${status}: ${String(comment).trim()}`
      : comment;

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
      if (assignedToId !== existingJob.assignedToId) {
        updateData.lastAssignedAt = new Date();
      }
    }

    // Add demurrage/free days if provided
    if (demurrageFreeDays !== undefined) {
      updateData.demurrageFreeDays = parseInt(demurrageFreeDays);
    }

    // Add release money status if provided
    if (releaseMoneyReceived !== undefined) {
      updateData.releaseMoneyReceived = releaseMoneyReceived;
    }

    // Add shipper name and invoice number if provided (legacy VETTED data)
    if (shipperName !== undefined && shipperName !== null) {
      const trimmedShipperName = shipperName.trim();
      if (trimmedShipperName !== '') {
        updateData.shipperName = trimmedShipperName;
      }
    }
    if (invoiceNumber !== undefined && invoiceNumber !== null) {
      const trimmedInvoiceNumber = invoiceNumber.trim();
      if (trimmedInvoiceNumber !== '') {
        updateData.invoiceNumber = trimmedInvoiceNumber;
      }
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
    if (boeNumber !== undefined && boeNumber !== null) {
      const trimmedBoeNumber = boeNumber.trim();
      if (trimmedBoeNumber !== '') {
        updateData.boeNumber = trimmedBoeNumber;
      }
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
        comment: historyComment,
        updatedById: req.user.id
      }
    });

    // Fetch the complete job data with relations
    const completeJob = await prisma.job.findUnique({
      where: { id },
      select: getJobSelect({ includeDocuments: true, includeInvoices: true })
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

    if (assignedToId && assignedToId !== existingJob.assignedToId) {
      try {
        await RealtimeNotificationService.notifyJobAssignmentRealtime(
          id,
          assignedToId,
          req.user.id
        );
      } catch (notifyError) {
        console.error('Assignment notification failed:', notifyError);
      }
    }

    // SMS: customer milestones, handoff, revert, release-money (never all-staff blast)
    try {
      const assigneeChanged = !!(assignedToId && assignedToId !== existingJob.assignedToId);
      await SmsNotificationService.handleStatusUpdate({
        jobId: id,
        oldStatus: existingJob.status,
        newStatus: status,
        isRevert,
        previousAssigneeId: existingJob.assignedToId,
        newAssigneeId: assigneeChanged ? assignedToId : existingJob.assignedToId,
        updatedById: req.user.id,
        releaseMoneyReceived:
          releaseMoneyReceived !== undefined
            ? releaseMoneyReceived
            : existingJob.releaseMoneyReceived,
        assigneeChanged
      });

      // On status+assignee change: handoff covers the new assignee; notify previous only
      if (assigneeChanged && !isRevert && existingJob.assignedToId) {
        const prev = await prisma.user.findFirst({
          where: { id: existingJob.assignedToId, isActive: true },
          select: { id: true, name: true, phone: true, role: true }
        });
        if (prev?.phone) {
          const smsService = require('../services/smsService');
          await smsService.sendSms({
            to: prev.phone,
            message: `CN Terminal: Job ${completeJob.trackingId} reassigned away from you.`,
            eventKey: 'SMS_JOB_REASSIGNED',
            jobId: id,
            userId: prev.id,
            dedupeKey: `SMS_JOB_REASSIGNED:prev:${id}:${prev.id}:${status}`,
            skipQuietHours: true,
            metadata: { role: 'previous_assignee', via: 'status-update' }
          });
        } else {
          console.log(
            `📱 [SMS] skipped previous-assignee SMS on status update — ${
              prev ? 'user has no phone' : 'previous user not found'
            } (user=${existingJob.assignedToId}, job=${id})`
          );
        }
        await SmsNotificationService.checkReassignChurn(id);
      }
    } catch (smsError) {
      console.error('❌ Failed to send SMS notification:', smsError.message);
      // Don't fail the status update if SMS fails
    }

    // Emit socket event for real-time update
    SocketService.emitJobStatusUpdated(completeJob);

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

    // Emit socket event for real-time update
    SocketService.emitJobDeleted(id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reassign job to another team member (no status change) with a required comment.
// Anyone with jobs access may reassign — reassignment is decoupled from
// status-update permissions.
router.post('/:id/reassign', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToId, comment } = req.body;

    if (!assignedToId) {
      return res.status(400).json({ error: 'Assignee is required' });
    }
    if (!comment || String(comment).trim() === '') {
      return res.status(400).json({ error: 'Comment is required when reassigning a job' });
    }

    const existingJob = await prisma.job.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.assignedToId === assignedToId) {
      return res.status(400).json({ error: 'Job is already assigned to this user' });
    }

    const assignee = await prisma.user.findFirst({
      where: { id: assignedToId, isActive: true },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!assignee) {
      return res.status(400).json({ error: 'Selected assignee not found or inactive' });
    }

    const previousAssigneeName = existingJob.assignedTo?.name || 'Unassigned';
    const trimmedComment = String(comment).trim();
    const reassignmentNote = `Reassigned from ${previousAssigneeName} to ${assignee.name}: ${trimmedComment}`;

    const [updatedJob, jobComment] = await prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id },
        data: {
          assignedToId,
          lastAssignedAt: new Date(),
          updatedById: req.user.id
        }
      });

      const createdComment = await tx.jobComment.create({
        data: {
          jobId: id,
          comment: reassignmentNote,
          createdById: req.user.id
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      const job = await tx.job.findUnique({
        where: { id },
        select: getJobSelect({ includeCounts: true })
      });

      return [job, createdComment];
    });

    try {
      await RealtimeNotificationService.notifyJobAssignmentRealtime(
        updatedJob.id,
        assignedToId,
        req.user.id
      );
    } catch (notifyError) {
      console.error('Reassign notification failed:', notifyError);
    }

    try {
      await SmsNotificationService.handleAssignment({
        jobId: id,
        newAssigneeId: assignedToId,
        previousAssigneeId: existingJob.assignedToId,
        assignedById: req.user.id,
        isReassign: true
      });
    } catch (smsError) {
      console.error('Reassign SMS failed:', smsError.message);
    }

    SocketService.emitJobUpdated(updatedJob);
    SocketService.emitJobCommentAdded(id, jobComment);

    res.json({
      message: 'Job reassigned successfully',
      job: updatedJob,
      comment: jobComment
    });
  } catch (error) {
    console.error('Error reassigning job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to job (doesn't change status)
router.post('/:id/comments', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create comment
    const jobComment = await prisma.jobComment.create({
      data: {
        jobId: id,
        comment: comment.trim(),
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Emit socket event for real-time update
    SocketService.emitJobCommentAdded(id, jobComment);

    // Opt-in SMS to assignee when someone else comments
    try {
      await SmsNotificationService.notifyCommentToAssignee({
        jobId: id,
        commenterId: req.user.id,
        commentPreview: comment.trim()
      });
    } catch (smsError) {
      console.error('Comment SMS failed:', smsError.message);
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: jobComment
    });
  } catch (error) {
    console.error('Error adding job comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all comments for a job
router.get('/:id/comments', authenticateToken, requirePermission(UI_PERMISSIONS.JOBS), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get all comments
    const comments = await prisma.jobComment.findMany({
      where: { jobId: id },
      include: {
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

    res.json({
      comments
    });
  } catch (error) {
    console.error('Error fetching job comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
