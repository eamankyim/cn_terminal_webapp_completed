const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');

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
    console.log('🔧 Setting up permissions and roles for admin user...');
    
    try {
      // Import and run the permissions setup
      const setupPermissions = require('../scripts/setup-permissions');
      await setupPermissions();
      console.log('✅ Permissions and roles set up successfully');
    } catch (permissionError) {
      console.error('⚠️ Warning: Failed to set up permissions:', permissionError.message);
      // Don't fail the admin creation if permissions setup fails
    }

    res.status(201).json({
      message: 'Super admin created successfully with full permissions',
      user: superAdmin
    });

  } catch (error) {
    console.error('Create super admin error:', error);
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
    console.error('Check initialization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;








