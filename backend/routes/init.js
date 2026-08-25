const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { autoSeedIfNeeded } = require('../utils/seedUtils');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/init/super-admin:
 *   post:
 *     summary: Create the first super admin user (one-time setup)
 *     tags: [Initialization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Admin's full name
 *                 example: "Super Administrator"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin's email address
 *                 example: "admin@cnterminal.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Admin's password
 *                 example: "admin123"
 *     responses:
 *       201:
 *         description: Super admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Super admin created successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Super admin already exists or validation error
 *       500:
 *         description: Internal server error
 */
router.post('/super-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      return res.status(400).json({
        error: 'Super admin already exists. Only one super admin can be created.'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Set up permissions and roles for the admin user

    try {
      // Auto-seed permissions, roles, and settings if they don't exist
      console.log('🌱 Auto-seeding system data...');
      const seedResult = await autoSeedIfNeeded(superAdmin.id);
      console.log('✅ Auto-seeding complete:', seedResult.message);

      // Link the super admin to the ADMIN role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
      });
      
      if (adminRole) {
        await prisma.user.update({
          where: { id: superAdmin.id },
          data: { roleId: adminRole.id }
        });
        console.log('✅ Linked super admin to ADMIN role');
      }

    } catch (permissionError) {
      console.error('⚠️ Error during auto-seeding:', permissionError.message);
      // Don't fail the admin creation if permissions setup fails
    }

    res.status(201).json({
      message: 'Super admin created successfully with full permissions',
      user: superAdmin
    });

  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/init/check:
 *   get:
 *     summary: Check if system is initialized (super admin exists)
 *     tags: [Initialization]
 *     responses:
 *       200:
 *         description: System initialization status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 initialized:
 *                   type: boolean
 *                   description: Whether the system has been initialized
 *                 hasAdmin:
 *                   type: boolean
 *                   description: Whether an admin user exists
 *       500:
 *         description: Internal server error
 */
router.get('/check', async (req, res) => {
  try {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });

    res.json({
      initialized: adminCount > 0,
      hasAdmin: adminCount > 0,
      adminCount
    });

  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/init/create-all-user-types:
 *   post:
 *     summary: Create users for all role types (Admin only)
 *     description: Creates one user for each role type in the system with a default password. Existing users are skipped.
 *     tags: [Initialization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 default: "Testpassword123"
 *                 description: Password to use for all created users
 *                 example: "Testpassword123"
 *     responses:
 *       200:
 *         description: Users created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully created users for all role types"
 *                 created:
 *                   type: integer
 *                   description: Number of users created
 *                   example: 12
 *                 skipped:
 *                   type: integer
 *                   description: Number of users skipped (already exist)
 *                   example: 1
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "it.consultant@cnterminal.com"
 *                       role:
 *                         type: string
 *                         example: "IT_CONSULTANT"
 *                       name:
 *                         type: string
 *                         example: "IT Consultant"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/create-all-user-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const password = req.body.password || 'Testpassword123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // All user roles in the system
    const USER_ROLES = [
      'ADMIN',
      'IT_CONSULTANT',
      'ENQUIRY_OFFICER',
      'ENTRY_OFFICER',
      'TRANSPORT_COORDINATOR',
      'RELEASE_OFFICER',
      'PREINVOICE_OFFICER',
      'INVOICE_OFFICER',
      'SUPERVISOR',
      'REVIEW_OFFICER',
      'CLEARING_OFFICER',
      'ACCOUNTANT',
      'STAFF',
      'DRIVER'
    ];

    // Role display names
    const ROLE_DISPLAY_NAMES = {
      'ADMIN': 'Administrator',
      'IT_CONSULTANT': 'IT Consultant',
      'ENQUIRY_OFFICER': 'Enquiry Officer',
      'ENTRY_OFFICER': 'Entry Officer',
      'TRANSPORT_COORDINATOR': 'Transport Coordinator',
      'RELEASE_OFFICER': 'Release Officer',
      'PREINVOICE_OFFICER': 'Preinvoice Officer',
      'INVOICE_OFFICER': 'Invoice Officer',
      'SUPERVISOR': 'Supervisor',
      'REVIEW_OFFICER': 'Review Officer',
      'CLEARING_OFFICER': 'Clearing Officer',
      'ACCOUNTANT': 'Accountant',
      'STAFF': 'Staff',
      'DRIVER': 'Driver'
    };

    const createdUsers = [];
    const skippedUsers = [];

    for (const role of USER_ROLES) {
      const email = `${role.toLowerCase().replace(/_/g, '.')}@cnterminal.com`;
      const name = ROLE_DISPLAY_NAMES[role] || role;

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          skippedUsers.push({ email, role, name });
          continue;
        }

        // Get the role from database to link it
        const roleRecord = await prisma.role.findUnique({
          where: { name: role }
        });

        // Create user
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role,
            isActive: true,
            roleId: roleRecord?.id || null
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        });

        createdUsers.push(user);
      } catch (error) {
        console.error(`❌ Failed to create ${role}:`, error.message);
        // Continue with other roles even if one fails
      }
    }

    res.json({
      success: true,
      message: 'Successfully created users for all role types',
      created: createdUsers.length,
      skipped: skippedUsers.length,
      users: createdUsers.map(u => ({
        email: u.email,
        role: u.role,
        name: u.name
      })),
      skipped: skippedUsers.map(u => ({
        email: u.email,
        role: u.role,
        name: u.name
      })),
      password: password
    });
  } catch (error) {
    console.error('❌ [Init API] POST /create-all-user-types error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

