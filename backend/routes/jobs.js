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
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📋 GET JOBS REQUEST');
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

    console.log(`🔍 Where condition:`, JSON.stringify(where, null, 2));

    console.log('🔍 Executing Prisma queries...');
    
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
    console.log('🔍 Test job query result:', testJob);
    
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
          submittedDate: true,
          eta: true,
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

    console.log(`✅ Prisma queries completed successfully`);
    console.log(`📊 Found ${jobs.length} jobs out of ${totalCount} total`);
    console.log(`📄 Pagination: page ${page}/${Math.ceil(totalCount / limit)}`);

    const response = {
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    };

    console.log('✅ Sending successful response');
    console.log('🔍 First job data being sent:', jobs[0]);
    if (jobs[0]) {
      console.log('🔍 First job fields check:');
      console.log('  - mediumOfEnquiry:', jobs[0].mediumOfEnquiry);
      console.log('  - documentsBrought:', jobs[0].documentsBrought);
      console.log('  - containerNumber:', jobs[0].containerNumber);
      console.log('  - blNumber:', jobs[0].blNumber);
      console.log('  - vesselName:', jobs[0].vesselName);
      console.log('  - line:', jobs[0].line);
      console.log('  - jobDescription:', jobs[0].jobDescription);
    }
    console.log('='.repeat(60) + '\n');

    res.json(response);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('💥 GET JOBS ERROR');
    console.log('='.repeat(60));
    console.error('Error details:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
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
        submittedDate: true,
        eta: true,
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

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate system job ID
const generateJobId = async () => {
  try {
    console.log('🔢 Starting job ID generation...');
    const year = new Date().getFullYear();
    const prefix = `JOB-${year}`;
    console.log(`📅 Year: ${year}, Prefix: ${prefix}`);
    
    // Find the highest job number for this year
    console.log('🔍 Searching for last job with current year prefix...');
    const lastJob = await prisma.job.findFirst({
      where: {
        trackingId: {
          startsWith: prefix
        }
      },
      orderBy: {
        trackingId: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastJob) {
      console.log(`📋 Found last job: ${lastJob.trackingId}`);
      const lastNumber = parseInt(lastJob.trackingId.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
      console.log(`🔢 Last number: ${lastNumber}, Next number: ${nextNumber}`);
    } else {
      console.log('📋 No previous jobs found for this year, starting with 1');
    }

    const generatedId = `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
    console.log(`✅ Generated job ID: ${generatedId}`);
    return generatedId;
  } catch (error) {
    console.error('💥 Error generating job ID:', error);
    throw error;
  }
};

// Create new job
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📋 CREATE JOB REQUEST');
    console.log('='.repeat(60));
    console.log(`👤 User: ${req.user.name} (${req.user.email})`);
    console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`⏰ Request time: ${new Date().toISOString()}`);

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

    console.log(`🔍 Extracted data:`);
    console.log(`  - customerId: ${customerId}`);
    console.log(`  - consignmentId: ${consignmentId}`);
    console.log(`  - assignedToId: ${assignedToId}`);
    console.log(`  - status: ${status}`);
    console.log(`  - isDraft: ${isDraft}`);
    console.log(`  - goodsTypes:`, goodsTypes);
    console.log(`  - eta: ${eta}`);
    console.log(`  - mediumOfEnquiry: ${mediumOfEnquiry}`);
    console.log(`  - documentsBrought:`, documentsBrought);
    console.log(`  - containerNumber: ${containerNumber}`);
    console.log(`  - blNumber: ${blNumber}`);
    console.log(`  - vesselName: ${vesselName}`);
    console.log(`  - line: ${line}`);
    console.log(`  - jobDescription: ${jobDescription}`);

    // Validate required fields
    if (!customerId || !assignedToId) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        error: 'Customer and assigned to are required' 
      });
    }

    // Validate goods types
    if (!goodsTypes || goodsTypes.length === 0) {
      console.log('❌ Validation failed: No goods types provided');
      return res.status(400).json({ 
        error: 'At least one goods type is required' 
      });
    }

    console.log('✅ Validation passed');

    // Check if customer exists
    console.log('🔍 Checking if customer exists...');
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      console.log('❌ Customer not found:', customerId);
      return res.status(400).json({ error: 'Customer not found' });
    }
    console.log('✅ Customer found:', customer.name);

    // Check if consignment exists and belongs to customer (if provided)
    if (consignmentId) {
      console.log('🔍 Checking if consignment exists...');
      const consignment = await prisma.consignment.findFirst({
        where: {
          id: consignmentId,
          customerId
        }
      });

      if (!consignment) {
        console.log('❌ Consignment not found or does not belong to customer');
        return res.status(400).json({ error: 'Consignment not found or does not belong to this customer' });
      }
      console.log('✅ Consignment found:', consignment.trackingId);
    }

    // Generate system job ID
    console.log('🔢 Generating system job ID...');
    const trackingId = await generateJobId();
    console.log('✅ Generated job ID:', trackingId);

    // Create job
    console.log('💾 Creating job in database...');
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
    console.log('📝 Job data to create:', JSON.stringify(jobData, null, 2));
    console.log('🔍 Individual field values:');
    console.log('  - mediumOfEnquiry:', mediumOfEnquiry);
    console.log('  - documentsBrought:', documentsBrought);
    console.log('  - containerNumber:', containerNumber);
    console.log('  - blNumber:', blNumber);
    console.log('  - vesselName:', vesselName);
    console.log('  - line:', line);
    console.log('  - jobDescription:', jobDescription);

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

    console.log('✅ Job created successfully:', job.id);
    console.log('🔍 Created job data:', JSON.stringify(job, null, 2));

    // Create initial status history
    console.log('📝 Creating initial status history...');
    await prisma.jobStatusHistory.create({
      data: {
        jobId: job.id,
        status: jobData.status,
        updatedById: req.user.id
      }
    });
    console.log('✅ Status history created');

    console.log('🎉 Job creation completed successfully');
    console.log('='.repeat(60) + '\n');

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('💥 CREATE JOB ERROR');
    console.log('='.repeat(60));
    console.error('Error details:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('Error code:', error.code);
    console.log('Error meta:', error.meta);
    console.log('='.repeat(60) + '\n');
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update job
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consignmentId,
      assignedToId,
      status,
      isDraft,
      goodsTypes,
      eta,
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

    // Validate ETA is required for RELEASE status
    if (status === 'RELEASE' && !eta) {
      return res.status(400).json({ 
        error: 'ETA is required when status is RELEASE' 
      });
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
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, eta } = req.body;

    console.log('🔍 Status update request:');
    console.log('  - Job ID:', id);
    console.log('  - Status:', status);
    console.log('  - Comment:', comment);
    console.log('  - ETA:', eta);
    console.log('  - ETA type:', typeof eta);

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate ETA is required for RELEASE status
    if (status === 'RELEASE' && !eta) {
      return res.status(400).json({ 
        error: 'ETA is required when status is RELEASE' 
      });
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

    // Prepare update data
    const updateData = {
      status,
      updatedById: req.user.id
    };

    // Add ETA if provided
    if (eta !== undefined) {
      updateData.eta = eta ? new Date(eta) : null;
      console.log('🔍 ETA being saved:', updateData.eta);
    }

    console.log('🔍 Update data:', updateData);

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData
    });

    console.log('🔍 Updated job ETA:', updatedJob.eta);

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
        submittedDate: true,
        eta: true,
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

    console.log('🔍 Complete job ETA:', completeJob?.eta);

    res.json({
      message: 'Job status updated successfully',
      job: completeJob
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
        consigneeName: true,
        consigneePhone: true,
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
