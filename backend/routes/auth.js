const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrIT, PERMISSIONS } = require('../middleware/auth');
const { mergeUserPermissions } = require('../utils/permissions');
const { getDirectUserPermissionNames } = require('../utils/databasePermissions');
const { validatePassword } = require('../utils/passwordValidation');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: admin@cnterminal.com
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email and password are required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 */
// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email received:', email);
    console.log('Password received:', password ? '***' + password.slice(-4) : 'NONE');
    console.log('Password length:', password ? password.length : 0);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email with permissions
    console.log('🔍 Looking up user with email:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assignedRole: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('Checking all users in database...');
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, isActive: true }
      });
      console.log('Available users:', allUsers);
      return res.status(401).json({ error: 'Invalid credentials or inactive user' });
    }

    console.log('✅ User found:');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Active:', user.isActive);
    console.log('  - Hashed password (first 20 chars):', user.password.substring(0, 20) + '...');

    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return res.status(401).json({ error: 'Invalid credentials or inactive user' });
    }

    // Check password
    console.log('🔐 Comparing passwords...');
    console.log('  - Input password:', password);
    console.log('  - Stored hash:', user.password);

    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log('Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Password does not match');
      console.log('=== LOGIN FAILED ===\n');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password matches!');

    // Create JWT token

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const extraPermissions = await getDirectUserPermissionNames(user.id);
    const permissions = mergeUserPermissions(
      user.role,
      [
        ...(user.assignedRole?.rolePermissions?.map(rp => rp.permission.name) || []),
        ...extraPermissions
      ]
    );
    
    console.log('✅ Login successful!');
    console.log('  - Permissions count:', permissions.length);
    console.log('=== LOGIN SUCCESSFUL ===\n');
    
    // Return user data (without password) and token
    const { password: _, assignedRole, ...userData } = user;
    res.json({
      message: 'Login successful',
      user: {
        ...userData,
        permissions
      },
      token
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== LOGIN ERROR ===\n');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (Admin only)
 *     tags: [Authentication]
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
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@cnterminal.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
 *                 description: User's password (must be at least 8 characters with uppercase, lowercase, and number)
 *                 example: Password123
 *               role:
 *                 type: string
 *                 enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, ENTRY_OFFICER, TRANSPORT_COORDINATOR, RELEASE_OFFICER, PREINVOICE_OFFICER, INVOICE_OFFICER, SUPERVISOR, REVIEW_OFFICER, VETTING_OFFICER, CLEARING_OFFICER, STAFF, DRIVER, ACCOUNTANT]
 *                 default: STAFF
 *                 description: User's role in the system
 *                 example: STAFF
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User with this email already exists
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Register route (admin only)
router.post('/register', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const { name, email, password, role = 'STAFF' } = req.body;
    
    // Validate role
    const validRoles = ['ADMIN', 'IT_CONSULTANT', 'ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'TRANSPORT_COORDINATOR', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'INVOICE_OFFICER', 'SUPERVISOR', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER', 'STAFF', 'DRIVER', 'ACCOUNTANT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find the Role ID for the specified role
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        roleId: roleRecord?.id || null
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

    await prisma.invitation.updateMany({
      where: {
        email,
        status: { in: ['PENDING', 'EXPIRED'] }
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });


    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    res.json({ user });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john.doe@cnterminal.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already in use
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, profilePicture, firstName, lastName } = req.body;

    // Combine firstName and lastName if provided separately
    let finalName = name;
    if (firstName || lastName) {
      finalName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (finalName) updateData.name = finalName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information with permissions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Get current user with permissions
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's permissions from their assigned role
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        assignedRole: {
          include: {
            rolePermissions: {
              include: {
                permission: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    const extraPermissions = await getDirectUserPermissionNames(user.id);
    const permissions = mergeUserPermissions(
      user.role,
      [
        ...(userWithRole?.assignedRole?.rolePermissions?.map(rp => rp.permission.name) || []),
        ...extraPermissions
      ]
    );

    res.json({
      user: {
        ...user,
        permissions
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
 *                 description: New password (must be at least 8 characters with uppercase, lowercase, and number)
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Current password is incorrect or missing fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('=== PASSWORD CHANGE ATTEMPT ===');
    console.log('User ID:', req.user.id);
    console.log('User Email:', req.user.email);
    console.log('Current Password provided:', currentPassword ? 'Yes (***' + currentPassword.slice(-4) + ')' : 'No');
    console.log('New Password provided:', newPassword ? 'Yes (***' + newPassword.slice(-4) + ')' : 'No');
    console.log('New Password length:', newPassword ? newPassword.length : 0);

    if (!currentPassword || !newPassword) {
      console.log('❌ Missing current or new password');
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password strength
    console.log('🔍 Validating new password strength...');
    const passwordValidation = validatePassword(newPassword);
    console.log('Password validation result:', passwordValidation);
    
    if (!passwordValidation.isValid) {
      console.log('❌ Password validation failed:', passwordValidation.errors);
      return res.status(400).json({ 
        error: 'New password validation failed',
        details: passwordValidation.errors
      });
    }

    // Get user with password
    console.log('🔍 Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.name, user.email);
    console.log('Stored password hash (first 20 chars):', user.password.substring(0, 20) + '...');

    // Verify current password
    console.log('🔐 Verifying current password...');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    console.log('Current password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Current password is incorrect');
      console.log('=== PASSWORD CHANGE FAILED ===\n');
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    console.log('✅ Current password verified!');

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('New password hashed (first 20 chars):', hashedPassword.substring(0, 20) + '...');

    // Update password
    console.log('💾 Updating password in database...');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password updated successfully!');
    console.log('=== PASSWORD CHANGE SUCCESSFUL ===\n');

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ PASSWORD CHANGE ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== PASSWORD CHANGE ERROR ===\n');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
// Get all users (all authenticated users can view, only admins can edit)
router.get('/users', authenticateToken, async (req, res) => {
  console.log('\n🔷 [API] GET /auth/users called');
  console.log('  - Timestamp:', new Date().toISOString());
  console.log('  - Requesting user ID:', req.user?.id);
  console.log('  - Requesting user email:', req.user?.email);
  console.log('  - Requesting user role:', req.user?.role);
  console.log('  - Request headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? 'Bearer ***' : 'MISSING'
  });
  
  try {
    // Check if user is authenticated
    if (!req.user) {
      console.error('❌ [API] Authentication failed - req.user is missing');
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }
    
    console.log('  - User authenticated successfully');
    console.log('  - Checking database connection...');
    
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('  - Database connection: OK');
    } catch (dbError) {
      console.error('❌ [API] Database connection failed:', dbError.message);
      console.error('  - Database error stack:', dbError.stack);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    console.log('  - Fetching users from database...');
    const startTime = Date.now();
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const queryTime = Date.now() - startTime;
    console.log('  - Database query completed in', queryTime, 'ms');
    console.log('✅ [API] Found', users.length, 'users');
    
    if (users.length > 0) {
      console.log('  - Sample user:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        isActive: users[0].isActive
      });
    } else {
      console.warn('⚠️ [API] No users found in database');
    }
    
    console.log('  - Preparing response...');
    const response = { users };
    console.log('  - Response structure:', {
      hasUsers: !!response.users,
      usersCount: response.users?.length || 0,
      usersType: Array.isArray(response.users) ? 'array' : typeof response.users
    });
    
    console.log('  - Sending response...');
    res.json(response);
    console.log('✅ [API] GET /auth/users completed successfully\n');
  } catch (error) {
    console.error('\n❌ [API] GET /auth/users ERROR:');
    console.error('  - Error name:', error.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Error stack:', error.stack);
    
    // Check for specific error types
    if (error.code === 'P2002') {
      console.error('  - Prisma error: Unique constraint violation');
    } else if (error.code === 'P2025') {
      console.error('  - Prisma error: Record not found');
    } else if (error.code === 'P1001') {
      console.error('  - Prisma error: Cannot reach database server');
    } else if (error.code === 'P1008') {
      console.error('  - Prisma error: Operations timed out');
    }
    
    console.error('  - Request user:', req.user?.email);
    console.error('  - Request timestamp:', new Date().toISOString());
    
    const errorResponse = {
      error: 'Internal server error',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    res.status(500).json(errorResponse);
    console.error('❌ [API] GET /auth/users failed\n');
  }
});

/**
 * @swagger
 * /api/auth/assignable-users:
 *   get:
 *     summary: Get assignable users for job assignment
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignable users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// Get assignable users for job assignment (excludes IT_CONSULTANT)
router.get('/assignable-users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          not: 'IT_CONSULTANT' // Exclude IT consultants from job assignment
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ users });
  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch assignable users' });
  }
});

/**
 * @swagger
 * /api/auth/users/{id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: User active status
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User status updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Update user status (admin only)
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
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

    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     summary: Update user details (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, ENTRY_OFFICER, TRANSPORT_COORDINATOR, RELEASE_OFFICER, PREINVOICE_OFFICER, INVOICE_OFFICER, SUPERVISOR, REVIEW_OFFICER, VETTING_OFFICER, CLEARING_OFFICER, STAFF, DRIVER, ACCOUNTANT]
 *                 description: User's role
 *                 example: STAFF
 *               isActive:
 *                 type: boolean
 *                 description: User active status
 *                 example: true
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Update user details (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    console.log('=== ADMIN USER UPDATE ATTEMPT ===');
    console.log('Admin User:', req.user.email);
    console.log('Target User ID:', id);
    console.log('Request Body:', JSON.stringify({ name, email, role, isActive, password: password ? '***PROVIDED***' : 'NOT PROVIDED' }));

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', existingUser.name, existingUser.email);

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      console.log('🔍 Checking if new email already exists...');
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        console.log('❌ Email already exists:', email);
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Prepare update data
    const updateData = {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive })
    };

    // Keep roleId in sync so login returns the correct RolePermission set
    if (role) {
      const roleRecord = await prisma.role.findUnique({ where: { name: role } });
      updateData.roleId = roleRecord?.id || null;
    }

    // Handle password update if provided
    if (password) {
      console.log('🔐 Password provided - hashing...');
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
      console.log('✅ Password hashed and will be updated');
    }

    console.log('💾 Updating user in database...');
    console.log('Update data:', JSON.stringify({ ...updateData, password: updateData.password ? '***HASHED***' : undefined }));

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    console.log('✅ User updated successfully!');
    console.log('=== ADMIN USER UPDATE SUCCESSFUL ===\n');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ ADMIN USER UPDATE ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== ADMIN USER UPDATE ERROR ===\n');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/users/{id}/reset-password:
 *   put:
 *     summary: Reset user password (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
 *                 description: New password for the user
 *                 example: NewPassword123@
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid password or missing fields
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Reset user password (admin only)
router.put('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('=== ADMIN PASSWORD RESET ATTEMPT ===');
    console.log('Admin User:', req.user.email);
    console.log('Target User ID:', id);
    console.log('New Password provided:', newPassword ? 'Yes (***' + newPassword.slice(-4) + ')' : 'No');
    console.log('New Password length:', newPassword ? newPassword.length : 0);

    if (!newPassword) {
      console.log('❌ Missing new password');
      return res.status(400).json({ error: 'New password is required' });
    }

    // Validate new password strength
    console.log('🔍 Validating new password strength...');
    const passwordValidation = validatePassword(newPassword);
    console.log('Password validation result:', passwordValidation);
    
    if (!passwordValidation.isValid) {
      console.log('❌ Password validation failed:', passwordValidation.errors);
      return res.status(400).json({ 
        error: 'New password validation failed',
        details: passwordValidation.errors
      });
    }

    // Check if user exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:');
    console.log('  - Name:', existingUser.name);
    console.log('  - Email:', existingUser.email);
    console.log('  - Role:', existingUser.role);

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('New password hashed (first 20 chars):', hashedPassword.substring(0, 20) + '...');

    // Update password
    console.log('💾 Updating password in database...');
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password reset successfully by admin!');
    console.log('=== ADMIN PASSWORD RESET SUCCESSFUL ===\n');

    res.json({ 
      message: 'Password reset successfully',
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    });
  } catch (error) {
    console.error('❌ ADMIN PASSWORD RESET ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== ADMIN PASSWORD RESET ERROR ===\n');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the current user
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Reassign required FK references to the acting admin so delete can succeed
    const reassignToId = req.user.id;

    await prisma.$transaction(async (tx) => {
      await tx.job.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: reassignToId }
      });
      await tx.job.updateMany({
        where: { createdById: id },
        data: { createdById: reassignToId }
      });
      await tx.job.updateMany({
        where: { updatedById: id },
        data: { updatedById: reassignToId }
      });
      await tx.jobStatusHistory.updateMany({
        where: { updatedById: id },
        data: { updatedById: reassignToId }
      });
      await tx.jobComment.updateMany({
        where: { createdById: id },
        data: { createdById: reassignToId }
      });
      await tx.invoice.updateMany({
        where: { createdById: id },
        data: { createdById: reassignToId }
      });
      await tx.estimate.updateMany({
        where: { createdById: id },
        data: { createdById: reassignToId }
      });
      await tx.payment.updateMany({
        where: { createdById: id },
        data: { createdById: reassignToId }
      });
      await tx.file.updateMany({
        where: { uploadedBy: id },
        data: { uploadedBy: reassignToId }
      });
      await tx.invitation.updateMany({
        where: { invitedBy: id },
        data: { invitedBy: reassignToId }
      });
      await tx.rolePermission.updateMany({
        where: { createdBy: id },
        data: { createdBy: reassignToId }
      });
      await tx.userPermission.updateMany({
        where: { grantedBy: id },
        data: { grantedBy: reassignToId }
      });
      await tx.userPermission.deleteMany({
        where: { userId: id }
      });
      await tx.notification.deleteMany({
        where: { userId: id }
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId: id }
      });
      await tx.expenseRequest.updateMany({
        where: { requestedById: id },
        data: { requestedById: reassignToId }
      });
      await tx.expenseRequest.updateMany({
        where: { approvedById: id },
        data: { approvedById: reassignToId }
      });
      await tx.payoutRequest.updateMany({
        where: { userId: id },
        data: { userId: reassignToId }
      });
      await tx.payoutRequest.updateMany({
        where: { approvedBy: id },
        data: { approvedBy: reassignToId }
      });
      await tx.payout.updateMany({
        where: { processedById: id },
        data: { processedById: reassignToId }
      });

      await tx.user.delete({
        where: { id }
      });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@cnterminal.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If the email exists, a password reset link has been sent
 *       400:
 *         description: Email is required
 *       500:
 *         description: Internal server error
 */
// Forgot password - request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success message for security (don't reveal if email exists)
    if (!user || !user.isActive) {
      return res.json({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    });

    // TODO: Send email with reset link
    // For now, we'll log the reset link (in production, send via email)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Also write to the same log file as invitations
    try {
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(__dirname, '..', 'invitation-links.txt');
      
      // Create header if file doesn't exist
      if (!fs.existsSync(logFile)) {
        const header = `CN TERMINAL - INVITATION & PASSWORD RESET LINKS LOG\nCreated: ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`;
        fs.writeFileSync(logFile, header);
      }
      
      const logEntry = `🔑 PASSWORD RESET REQUEST - ${new Date().toISOString()}\n${'='.repeat(60)}\n🔗 RESET LINK: ${resetLink}\n👤 User: ${user.name} (${user.email})\n🎭 Role: ${user.role}\n⏰ Expires: ${expiresAt.toLocaleString()}\n🆔 Token: ${resetToken.substring(0, 8)}...\n${'='.repeat(60)}\n\n`;
      fs.appendFileSync(logFile, logEntry);

    } catch (fileError) {

    }

    // In a real application, you would send an email here
    // await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({ 
      message: 'If the email exists, a password reset link has been sent' 
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: abc123def456...
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)"
 *                 description: New password (must be at least 8 characters with uppercase, lowercase, and number)
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid or expired token, or missing fields
 *       500:
 *         description: Internal server error
 */
// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {

      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {

      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {

      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    const now = new Date();
    if (resetToken.expiresAt < now) {

      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });

      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token has already been used
    if (resetToken.used) {

      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    // Hash new password

    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and mark token as used

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: abc123def456...
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                 type: string
 *                 example: user@cnterminal.com
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {

      return res.status(400).json({ error: 'Token is required' });
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {

      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    const now = new Date();
    if (resetToken.expiresAt < now) {

      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });

      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token has already been used
    if (resetToken.used) {

      return res.status(400).json({ error: 'Reset token has already been used' });
    }

    res.json({ 
      valid: true,
      email: resetToken.user.email
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/debug-user:
 *   get:
 *     summary: Debug user information (development only)
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User email to debug
 *     responses:
 *       200:
 *         description: User debug information
 *       404:
 *         description: User not found
 */
// Debug endpoint to check user information (development only)
router.get('/debug-user', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {

      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        passwordHashLength: user.password.length,
        passwordHashPreview: user.password.substring(0, 20) + '...'
      }
    });
  } catch (error) {

    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
