const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin, requireAdminOrIT, PERMISSIONS } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidation');

const router = express.Router();

/**
 * @swagger
 * /api/invitations/{id}:
 *   get:
 *     summary: Get invitation details by ID
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Invitation not found
 */
// Get invitation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📧 GET /api/invitations/:id - Getting invitation details for ID:', id);
    
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      console.log('📧 Invitation not found for ID:', id);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    console.log('📧 Found invitation:', {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    res.json({ invitation });
  } catch (error) {
    console.error('📧 Get invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get all pending invitations (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       email:
 *                         type: string
 *                         format: email
 *                       role:
 *                         type: string
 *                         enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, RELEASE_OFFICER, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF]
 *                       invitedBy:
 *                         type: string
 *                       invitedAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [PENDING, ACCEPTED, EXPIRED, CANCELLED]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
// Get all invitations
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📧 GET /api/invitations - Fetching all invitations');
    console.log('📧 User making request:', req.user);
    
    const invitations = await prisma.invitation.findMany({
      orderBy: { invitedAt: 'desc' },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('📧 Found invitations:', invitations.length);
    console.log('📧 Invitation statuses:', invitations.map(inv => ({ id: inv.id, email: inv.email, status: inv.status })));
    
    // Log all invitation links for easy access
    console.log('📧 === INVITATION LINKS ===');
    invitations.forEach(inv => {
      const inviteLink = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/accept-invitation/${inv.id}`;
      console.log(`📧 ${inv.email} (${inv.status}): ${inviteLink}`);
    });
    console.log('📧 === END INVITATION LINKS ===');

    res.json({ invitations });
  } catch (error) {
    console.error('📧 Get invitations error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/stats:
 *   get:
 *     summary: Get invitation statistics (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 pending:
 *                   type: number
 *                 accepted:
 *                   type: number
 *                 expired:
 *                   type: number
 *                 cancelled:
 *                   type: number
 */
// Get invitation statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [total, pending, accepted, expired, cancelled] = await Promise.all([
      prisma.invitation.count(),
      prisma.invitation.count({ where: { status: 'PENDING' } }),
      prisma.invitation.count({ where: { status: 'ACCEPTED' } }),
      prisma.invitation.count({ where: { status: 'EXPIRED' } }),
      prisma.invitation.count({ where: { status: 'CANCELLED' } })
    ]);

    res.json({
      total,
      pending,
      accepted,
      expired,
      cancelled
    });
  } catch (error) {
    console.error('Get invitation stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Send invitation to new user (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to invite
 *                 example: john.doe@cnterminal.com
 *               role:
 *                 type: string
 *                 enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, RELEASE_OFFICER, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF]
 *                 description: Role for the new user
 *                 example: STAFF
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation sent successfully
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                     invitedBy:
 *                       type: string
 *                     invitedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *       400:
 *         description: User already exists or invitation already sent
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
// Send invitation
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📧 POST /api/invitations - Starting invitation creation');
    console.log('📧 Request body:', req.body);
    console.log('📧 User making request:', req.user);
    
    const { email, role } = req.body;

    if (!email || !role) {
      console.log('📧 Validation failed: Missing email or role');
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'IT_CONSULTANT', 'ENQUIRY_OFFICER', 'RELEASE_OFFICER', 'REVIEW_OFFICER', 'INVOICE_OFFICER', 'CLEARING_OFFICER', 'STAFF'];
    if (!validRoles.includes(role)) {
      console.log('📧 Validation failed: Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    console.log('📧 Checking if user already exists for email:', email);
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('📧 User already exists:', existingUser.id);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    console.log('📧 Checking for existing pending invitations for email:', email);
    // Check if invitation already exists and is pending
    const existingInvitation = await prisma.invitation.findFirst({
      where: { 
        email,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      console.log('📧 Pending invitation already exists:', existingInvitation.id);
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    console.log('📧 Creating invitation with data:', {
      email,
      role,
      invitedBy: req.user.id,
      expiresAt,
      status: 'PENDING'
    });

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        invitedBy: req.user.id,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log('📧 Invitation created successfully:', invitation.id);

    // Generate invite link
    const inviteLink = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/accept-invitation/${invitation.id}`;
    
    // Send email notification
    console.log('📧 Starting email send process for invitation:', invitation.id);
    try {
      const emailService = require('../services/emailService');
      
      console.log('📧 Generated invite link:', inviteLink);
      console.log('\n' + '='.repeat(80));
      console.log('📧 🎉 NEW INVITATION CREATED - COPY LINK BELOW 🎉');
      console.log('='.repeat(80));
      console.log('📧 🔗 INVITATION LINK (COPY THIS):');
      console.log('📧 ' + inviteLink);
      console.log('📧 📧 Email:', invitation.email);
      console.log('📧 👤 Role:', invitation.role);
      console.log('📧 ⏰ Expires:', invitation.expiresAt);
      console.log('📧 🆔 Invitation ID:', invitation.id);
      console.log('='.repeat(80));
      console.log('📧 💡 TIP: Copy the link above and paste it in your browser to accept the invitation');
      console.log('='.repeat(80) + '\n');
      
      // Also write to a simple text file for easy access
      try {
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(__dirname, '..', 'invitation-links.txt');
        
        // Create header if file doesn't exist
        if (!fs.existsSync(logFile)) {
          const header = `CN TERMINAL - INVITATION LINKS LOG\nCreated: ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`;
          fs.writeFileSync(logFile, header);
        }
        
        const logEntry = `🎉 NEW INVITATION CREATED - ${new Date().toISOString()}\n${'='.repeat(60)}\n🔗 INVITATION LINK: ${inviteLink}\n📧 Email: ${invitation.email}\n👤 Role: ${invitation.role}\n⏰ Expires: ${invitation.expiresAt}\n🆔 ID: ${invitation.id}\n${'='.repeat(60)}\n\n`;
        fs.appendFileSync(logFile, logEntry);
        console.log('📧 💾 Invitation link saved to: invitation-links.txt');
        console.log('📧 📁 File location:', logFile);
      } catch (fileError) {
        console.log('📧 ⚠️ Could not save to file:', fileError.message);
      }
      console.log('📧 Invitation data:', {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt
      });
      
      const emailResult = await emailService.sendInvitationEmail({
        ...invitation,
        inviteLink,
        invitedByUser: invitation.invitedByUser
      });
      
      console.log('📧 Invitation email sent successfully to:', email);
      console.log('📧 Email result:', emailResult);
    } catch (emailError) {
      console.error('📧 Failed to send invitation email:', emailError);
      console.error('📧 Email error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      // Don't fail the invitation creation if email fails
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation,
      inviteLink: inviteLink,
      instructions: {
        copyLink: inviteLink,
        expiresAt: invitation.expiresAt,
        note: 'Copy the inviteLink above and paste it in your browser to accept the invitation'
      }
    });
  } catch (error) {
    console.error('📧 Send invitation error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/{id}:
 *   get:
 *     summary: Get invitation by ID (for accepting)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation details
 *       404:
 *         description: Invitation not found
 *       410:
 *         description: Invitation expired
 */
// Get invitation by ID (public endpoint for accepting)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Invitation is no longer valid',
        status: invitation.status
      });
    }

    if (new Date() > invitation.expiresAt) {
      console.log('📧 Invitation expired:', invitation.expiresAt);
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    res.json({ invitation });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/invitations/{id}/validate:
 *  get:
 *    summary: Validate invitation (public endpoint)
 *    tags: [Invitations]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: Invitation ID
 *    responses:
 *      200:
 *        description: Invitation is valid
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                invitation:
 *                  $ref: '#/components/schemas/Invitation'
 *      400:
 *        description: Invalid or expired invitation
 *      404:
 *        description: Invitation not found
 */
// Validate invitation (public endpoint - no auth required)
router.get('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📧 GET /api/invitations/:id/validate - Validating invitation');
    console.log('📧 Invitation ID:', id);
    console.log('📧 Request timestamp:', new Date().toISOString());

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      console.log('📧 Invitation not found for ID:', id);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    console.log('📧 Found invitation:', {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expiresAt)) {
      console.log('📧 Invitation expired:', invitation.expiresAt);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      console.log('📧 Invitation not pending:', invitation.status);
      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    console.log('📧 Invitation is valid');
    res.json({ invitation });
  } catch (error) {
    console.error('📧 Validate invitation error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/{id}/accept:
 *   post:
 *     summary: Accept invitation and create user account
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: Invalid invitation or missing fields
 *       404:
 *         description: Invitation not found
 *       410:
 *         description: Invitation expired
 */
// Accept invitation
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password } = req.body;

    console.log('📧 POST /api/invitations/:id/accept - Starting invitation acceptance');
    console.log('📧 Invitation ID:', id);
    console.log('📧 User data:', { name, email: '***' });

    if (!name || !password) {
      console.log('📧 Validation failed: Missing name or password');
      return res.status(400).json({ error: 'Name and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('📧 Password validation failed:', passwordValidation.errors);
      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      console.log('📧 Invitation not found for ID:', id);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    console.log('📧 Found invitation:', {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    if (invitation.status !== 'PENDING') {
      console.log('📧 Invitation not pending:', invitation.status);
      return res.status(400).json({ 
        error: 'Invitation is no longer valid',
        status: invitation.status
      });
    }

    if (new Date() > invitation.expiresAt) {
      console.log('📧 Invitation expired:', invitation.expiresAt);
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      console.log('📧 User already exists for email:', invitation.email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    console.log('📧 Creating user account for:', invitation.email);
    console.log('🔐 Password details:', {
      length: password.length,
      preview: password.substring(0, 3) + '...',
      meetsRequirements: password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    });
    
    // Hash password
    console.log('🔐 Hashing password with bcrypt...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('🔐 Password hashed successfully, hash length:', hashedPassword.length);

    // Create user and update invitation in a transaction
    console.log('💾 Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      console.log('👤 Creating user in database...');
      const user = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
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
      
      console.log('✅ User created successfully:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });

      return user;
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: result.id, 
        email: result.email, 
        role: result.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send welcome email
    console.log('📧 Starting welcome email send for new user:', result.email);
    try {
      const emailService = require('../services/emailService');
      const welcomeData = {
        name: result.name,
        email: result.email,
        role: result.role
      };
      
      console.log('📧 Welcome email data:', welcomeData);
      
      const emailResult = await emailService.sendWelcomeEmail(welcomeData);
      
      console.log('📧 Welcome email sent successfully to:', result.email);
      console.log('📧 Welcome email result:', emailResult);
    } catch (emailError) {
      console.error('📧 Failed to send welcome email:', emailError);
      console.error('📧 Welcome email error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      // Don't fail the account creation if email fails
    }

    console.log('\n' + '='.repeat(80));
    console.log('📧 🎉 INVITATION ACCEPTED SUCCESSFULLY! 🎉');
    console.log('='.repeat(80));
    console.log('📧 👤 New User Created:');
    console.log('📧 📧 Email:', result.email);
    console.log('📧 👤 Name:', result.name);
    console.log('📧 🎭 Role:', result.role);
    console.log('📧 🆔 User ID:', result.id);
    console.log('📧 ✅ Status: ACTIVE');
    console.log('📧 🔑 JWT Token: Generated');
    console.log('='.repeat(80));
    console.log('📧 💡 User can now log in with their email and password');
    console.log('='.repeat(80) + '\n');
    
    res.status(201).json({
      message: 'Account created successfully',
      user: result,
      token
    });
  } catch (error) {
    console.error('📧 Accept invitation error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation email (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation email resent successfully
 *       400:
 *         description: Invitation is not pending
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Invitation not found
 */
// Resend invitation
router.post('/:id/resend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📧 POST /api/invitations/:id/resend - Starting resend process');
    console.log('📧 Invitation ID:', id);
    console.log('📧 User making request:', req.user);

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      console.log('📧 Invitation not found for ID:', id);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    console.log('📧 Found invitation:', {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    });

    if (invitation.status !== 'PENDING') {
      console.log('📧 Cannot resend invitation - status is not PENDING:', invitation.status);
      return res.status(400).json({ error: 'Can only resend pending invitations' });
    }

    // Send email notification
    console.log('📧 Starting email resend process for invitation:', invitation.id);
    try {
      const emailService = require('../services/emailService');
      const inviteLink = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/accept-invitation/${invitation.id}`;
      
      console.log('📧 Resending to email:', invitation.email);
      console.log('📧 Generated invite link:', inviteLink);
      console.log('📧 === RESEND INVITATION LINK ===');
      console.log('📧 🔗 RESEND LINK:', inviteLink);
      console.log('📧 📧 Email:', invitation.email);
      console.log('📧 👤 Role:', invitation.role);
      console.log('📧 ⏰ Expires:', invitation.expiresAt);
      console.log('📧 === END RESEND INVITATION LINK ===');
      
      const emailResult = await emailService.sendInvitationEmail({
        ...invitation,
        inviteLink,
        invitedByUser: invitation.invitedByUser
      });
      
      console.log('📧 Invitation email resent successfully to:', invitation.email);
      console.log('📧 Resend email result:', emailResult);
    } catch (emailError) {
      console.error('📧 Failed to resend invitation email:', emailError);
      console.error('📧 Resend email error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      // Don't fail the resend if email fails
    }

    res.json({ message: 'Invitation email resent successfully' });
  } catch (error) {
    console.error('📧 Resend invitation error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Cancel/delete invitation (Admin only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Invitation not found
 */
// Cancel invitation
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📧 DELETE /api/invitations/:id - Starting cancel process');
    console.log('📧 Invitation ID:', id);
    console.log('📧 User making request:', req.user);

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      console.log('📧 Invitation not found for ID:', id);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    console.log('📧 Found invitation to cancel:', {
      id: invitation.id,
      email: invitation.email,
      status: invitation.status
    });

    await prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    console.log('📧 Invitation cancelled successfully:', id);
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('📧 Cancel invitation error:', error);
    console.error('📧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @swagger
 * /api/invitations/logs/file:
 *   get:
 *     summary: Get invitation links from log file
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitation links log file content
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Log file not found
 *       500:
 *         description: Internal server error
 */
// Get invitation links from log file
router.get('/logs/file', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '..', 'invitation-links.txt');
    
    console.log('📧 GET /api/invitations/logs/file - Reading invitation links file');
    console.log('📧 File path:', logFile);
    
    if (!fs.existsSync(logFile)) {
      console.log('📧 Log file does not exist yet');
      return res.status(404).json({ 
        error: 'No invitation links found',
        message: 'No invitations have been created yet'
      });
    }
    
    const fileContent = fs.readFileSync(logFile, 'utf8');
    console.log('📧 File content length:', fileContent.length);
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(fileContent);
  } catch (error) {
    console.error('📧 Error reading invitation links file:', error);
    res.status(500).json({ error: 'Failed to read invitation links file' });
  }
});

module.exports = router;

