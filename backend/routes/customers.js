const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');
const NotificationService = require('../services/notificationService');

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
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: searchCondition,
        include: {
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

    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerType: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
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

    // Normalize empty/whitespace email to null so unique constraint is not hit by ""
    const normalizedEmail =
      typeof email === 'string' && email.trim() ? email.trim() : null;

    // Validate required fields (email is optional)
    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'Company name, phone, and address are required' });
    }

    // Check if customer with email already exists (only when email provided)
    if (normalizedEmail) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingCustomer) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }

    const consigneeAddress = [address, city, country].filter(Boolean).join(', ');

    // Create customer with themselves as the first consignee
    const customer = await prisma.customer.create({
      data: {
        name,
        contactPerson,
        email: normalizedEmail,
        phone,
        address,
        city,
        country,
        tin,
        ghanaCard,
        customerType: String(customerType).toUpperCase(),
        consignments: {
          create: {
            consigneeName: name,
            consigneePhone: phone,
            consigneeAddress,
            ghanaCard: ghanaCard || null,
            tin: tin || null,
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

    // Normalize empty/whitespace email to null so unique constraint is not hit by ""
    const normalizedEmail =
      email === undefined
        ? undefined
        : typeof email === 'string' && email.trim()
          ? email.trim()
          : null;

    // Check if email is already taken by another customer
    if (normalizedEmail && normalizedEmail !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email: normalizedEmail }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use by another customer' });
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        contactPerson,
        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        phone,
        address,
        city,
        country,
        tin,
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
 *         description: Cannot delete customer with existing consignments, enquiries, or jobs
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
            jobs: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has related data
    if (customer._count.consignments > 0 || customer._count.enquiries > 0 || customer._count.jobs > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing consignments, enquiries, or jobs' 
      });
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {

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
