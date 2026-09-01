const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');
const {
  normalizeOptional,
  findCustomerUniquenessConflicts,
  uniquenessConflictResponse,
  prismaUniqueConflictResponse
} = require('../utils/customerUniqueness');

const router = express.Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with pagination and search
 *     tags: [Customers]
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
 *         description: Search term for customer name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLOCKED]
 *         description: Filter by customer status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, CORPORATE]
 *         description: Filter by customer type
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
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
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Customer's email address (optional)
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: Customer's phone number
 *                 example: +233241234567
 *               address:
 *                 type: string
 *                 description: Customer's address
 *                 example: 123 Main Street, Accra
 *               type:
 *                 type: string
 *                 enum: [INDIVIDUAL, CORPORATE]
 *                 default: INDIVIDUAL
 *                 description: Customer type
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
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Customer created successfully
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Get all customers (available to every authenticated user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: searchCondition,
        include: {
          consignments: {
            select: {
              id: true,
              consigneeName: true
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              consignments: true,
              enquiries: true,
              jobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.customer.count({ where: searchCondition })
    ]);

    res.json({
      customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customer:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Customer'
 *                     - type: object
 *                       properties:
 *                         consignments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Consignment'
 *                         enquiries:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Enquiry'
 *                         jobs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Job'
 *                         _count:
 *                           type: object
 *                           properties:
 *                             consignments:
 *                               type: integer
 *                             enquiries:
 *                               type: integer
 *                             jobs:
 *                               type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// Customer selector for dropdowns (must be registered before /:id)
router.get('/selector', authenticateToken, async (req, res) => {
  try {
    const { search = '' } = req.query;

    const term = typeof search === 'string' ? search.trim() : '';
    const customers = await prisma.customer.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { phone: { contains: term, mode: 'insensitive' } },
              { contactPerson: { contains: term, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerType: true,
        contactPerson: true,
      },
      orderBy: { name: 'asc' },
      take: term ? 100 : 200,
    });

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID (available to every authenticated user)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        consignments: {
          orderBy: { createdAt: 'desc' }
        },
        enquiries: {
          orderBy: { createdAt: 'desc' }
        },
        jobs: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            consignments: true,
            enquiries: true,
            jobs: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer (available to every authenticated user)
router.post('/', authenticateToken, async (req, res) => {
  try {

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      country = 'Ghana',
      tin,
      ghanaCard,
      customerType = 'COMPANY'
    } = req.body;

    const normalizedEmail = normalizeOptional(email)?.toLowerCase() ?? null;
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : phone;
    const normalizedTin = normalizeOptional(tin) ?? null;

    // Validate required fields (email is optional)
    if (!name || !normalizedPhone || !address) {
      return res.status(400).json({ error: 'Company name, phone, and address are required' });
    }

    const conflicts = await findCustomerUniquenessConflicts({
      email: normalizedEmail,
      phone: normalizedPhone,
      tin: normalizedTin
    });
    const conflictBody = uniquenessConflictResponse(conflicts);
    if (conflictBody) {
      return res.status(400).json(conflictBody);
    }

    const consigneeAddress = [address, city, country].filter(Boolean).join(', ');

    // Create customer with themselves as the first consignee
    const customer = await prisma.customer.create({
      data: {
        name,
        contactPerson,
        email: normalizedEmail,
        phone: normalizedPhone,
        address,
        city,
        country,
        tin: normalizedTin,
        ghanaCard,
        customerType: String(customerType).toUpperCase(),
        consignments: {
          create: {
            consigneeName: name,
            consigneePhone: normalizedPhone,
            consigneeAddress,
            ghanaCard: ghanaCard || null,
            tin: normalizedTin,
            date: new Date(),
            status: 'PENDING'
          }
        }
      },
      include: {
        consignments: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            consignments: true,
            enquiries: true,
            jobs: true
          }
        }
      }
    });

    // Create notification for new customer
    try {
      await NotificationService.createNotification({
        title: 'New Customer Registered',
        message: `New customer "${customer.name}" has been registered in the system`,
        type: 'SUCCESS',
        category: 'CUSTOMER_UPDATE',
        userId: req.user.id,
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email,
          customerType: customer.customerType,
          createdBy: req.user.name
        }
      });

    } catch (notificationError) {

      // Don't fail the customer creation if notification fails
    }

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    const uniqueConflict = prismaUniqueConflictResponse(error);
    if (uniqueConflict) {
      return res.status(400).json(uniqueConflict);
    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *                 description: Customer's email address (optional; omit or null to clear)
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: Customer's phone number
 *                 example: +233241234567
 *               address:
 *                 type: string
 *                 description: Customer's address
 *                 example: 123 Main Street, Accra
 *               city:
 *                 type: string
 *                 description: Customer's city
 *                 example: Accra
 *               country:
 *                 type: string
 *                 description: Customer's country
 *                 example: Ghana
 *               customerType:
 *                 type: string
 *                 enum: [REGULAR, VIP, CORPORATE]
 *                 description: Customer type
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLOCKED]
 *                 description: Customer status
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Customer updated successfully
 *                 customer:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Customer'
 *                     - type: object
 *                       properties:
 *                         _count:
 *                           type: object
 *                           properties:
 *                             consignments:
 *                               type: integer
 *                             enquiries:
 *                               type: integer
 *                             jobs:
 *                               type: integer
 *       400:
 *         description: Email already in use by another customer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      country,
      tin,
      ghanaCard,
      customerType,
      status
    } = req.body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const normalizedEmail =
      email === undefined ? undefined : (normalizeOptional(email)?.toLowerCase() ?? null);
    const normalizedPhone =
      phone === undefined ? undefined : (typeof phone === 'string' ? phone.trim() : phone);
    const normalizedTin =
      tin === undefined ? undefined : (normalizeOptional(tin) ?? null);

    if (normalizedPhone === '') {
      return res.status(400).json({ error: 'Phone is required' });
    }

    const nextEmail = normalizedEmail === undefined ? existingCustomer.email : normalizedEmail;
    const nextPhone = normalizedPhone === undefined ? existingCustomer.phone : normalizedPhone;
    const nextTin = normalizedTin === undefined ? existingCustomer.tin : normalizedTin;

    const sameInsensitive = (a, b) =>
      (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase();
    const sameExact = (a, b) =>
      (a || '').toString().trim() === (b || '').toString().trim();

    // Skip uniqueness checks for values that already belong to this customer so
    // an unchanged email/phone/TIN cannot reject a valid edit of the same record.
    const conflicts = await findCustomerUniquenessConflicts({
      email: sameInsensitive(nextEmail, existingCustomer.email) ? null : nextEmail,
      phone: sameExact(nextPhone, existingCustomer.phone) ? null : nextPhone,
      tin: sameInsensitive(nextTin, existingCustomer.tin) ? null : nextTin,
      excludeId: id
    });
    const conflictBody = uniquenessConflictResponse(conflicts);
    if (conflictBody) {
      return res.status(400).json(conflictBody);
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        contactPerson,
        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        address,
        city,
        country,
        ...(normalizedTin !== undefined ? { tin: normalizedTin } : {}),
        ghanaCard,
        ...(customerType ? { customerType: String(customerType).toUpperCase() } : {}),
        status
      },
      include: {
        _count: {
          select: {
            consignments: true,
            enquiries: true,
            jobs: true
          }
        }
      }
    });

    // Create notification for customer update
    try {
      await NotificationService.createNotification({
        title: 'Customer Updated',
        message: `Customer "${updatedCustomer.name}" information has been updated`,
        type: 'INFO',
        category: 'CUSTOMER_UPDATE',
        userId: req.user.id,
        metadata: {
          customerName: updatedCustomer.name,
          customerEmail: updatedCustomer.email,
          updatedBy: req.user.name
        }
      });

    } catch (notificationError) {

      // Don't fail the customer update if notification fails
    }

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    const uniqueConflict = prismaUniqueConflictResponse(error);
    if (uniqueConflict) {
      return res.status(400).json(uniqueConflict);
    }

    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Customer deleted successfully
 *       400:
 *         description: Cannot delete customer with existing jobs, invoices, estimates, or enquiries
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// Delete customer
router.delete('/:id', authenticateToken, requirePermission(UI_PERMISSIONS.CLIENTS), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            consignments: true,
            enquiries: true,
            jobs: true,
            invoices: true,
            estimates: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Block only when jobs/invoices/estimates/enquiries exist. Every customer is
    // created with a default consignee, so consignments alone must not block delete
    // (they cascade). Jobs/invoices/estimates also cascade in Prisma — do not rely
    // on that; refuse so operational records are not silently destroyed.
    const blockers = [];
    if (customer._count.jobs > 0) {
      blockers.push(`${customer._count.jobs} job${customer._count.jobs === 1 ? '' : 's'}`);
    }
    if (customer._count.invoices > 0) {
      blockers.push(`${customer._count.invoices} invoice${customer._count.invoices === 1 ? '' : 's'}`);
    }
    if (customer._count.estimates > 0) {
      blockers.push(`${customer._count.estimates} estimate${customer._count.estimates === 1 ? '' : 's'}`);
    }
    if (customer._count.enquiries > 0) {
      blockers.push(`${customer._count.enquiries} ${customer._count.enquiries === 1 ? 'enquiry' : 'enquiries'}`);
    }

    if (blockers.length > 0) {
      return res.status(400).json({
        error: `Cannot delete this client because they have ${blockers.join(', ')}. Remove or reassign those records first.`
      });
    }

    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error?.code === 'P2003' || error?.code === 'P2014') {
      return res.status(400).json({
        error: 'Cannot delete this client because related records still exist (jobs, invoices, or estimates).'
      });
    }

    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/customers/{id}/statistics:
 *   get:
 *     summary: Get customer statistics
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalConsignments:
 *                       type: integer
 *                       description: Total number of consignments
 *                     totalEnquiries:
 *                       type: integer
 *                       description: Total number of enquiries
 *                     totalJobs:
 *                       type: integer
 *                       description: Total number of jobs
 *                     totalConsignmentValue:
 *                       type: number
 *                       description: Total value of all consignments
 *                     totalJobValue:
 *                       type: number
 *                       description: Total estimated value of all jobs
 *                     consignmentStatusCount:
 *                       type: object
 *                       description: Count of consignments by status
 *                       additionalProperties:
 *                         type: integer
 *                     jobStatusCount:
 *                       type: object
 *                       description: Count of jobs by status
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
// Get customer statistics
router.get('/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            consignments: true,
            enquiries: true,
            jobs: true
          }
        },
        consignments: {
          select: {
            status: true,
            value: true
          }
        },
        jobs: {
          select: {
            status: true,
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate statistics
    const totalConsignmentValue = customer.consignments.reduce((sum, c) => sum + c.value, 0);
    const totalJobValue = 0; // estimatedValue field removed

    const consignmentStatusCount = customer.consignments.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const jobStatusCount = customer.jobs.reduce((acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      statistics: {
        totalConsignments: customer._count.consignments,
        totalEnquiries: customer._count.enquiries,
        totalJobs: customer._count.jobs,
        totalConsignmentValue,
        totalJobValue,
        consignmentStatusCount,
        jobStatusCount
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/customers/selector:
 *   get:
 *     summary: Get customers for dropdown/selector
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for customer name or email
 *     responses:
 *       200:
 *         description: List of customers for selector
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       customerType:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
module.exports = router;
