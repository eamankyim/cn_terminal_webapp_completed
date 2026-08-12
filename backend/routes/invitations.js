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

    res.json({ invitation });
  } catch (error) {

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
 *                         enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, ENTRY_OFFICER, TRANSPORT_COORDINATOR, RELEASE_OFFICER, PREINVOICE_OFFICER, INVOICE_OFFICER, SUPERVISOR, REVIEW_OFFICER, VETTING_OFFICER, CLEARING_OFFICER, STAFF, DRIVER, ACCOUNTANT]
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

    // Log all invitation links for easy access

    invitations.forEach(inv => {
      const baseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/accept-invitation/${inv.id}`;

    });

    res.json({ invitations });
  } catch (error) {

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
*                 enum: [ADMIN, IT_CONSULTANT, ENQUIRY_OFFICER, ENTRY_OFFICER, TRANSPORT_COORDINATOR, RELEASE_OFFICER, PREINVOICE_OFFICER, SUPERVISOR, REVIEW_OFFICER, INVOICE_OFFICER, CLEARING_OFFICER, STAFF, DRIVER, ACCOUNTANT]
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

    const { email, role } = req.body;

    if (!email || !role) {

      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'IT_CONSULTANT', 'ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'TRANSPORT_COORDINATOR', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'INVOICE_OFFICER', 'SUPERVISOR', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER', 'STAFF', 'DRIVER', 'ACCOUNTANT'];
    if (!validRoles.includes(role)) {

      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {

      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await prisma.invitation.findFirst({
      where: { 
        email,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {

      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

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

    // Generate invite link
    const baseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/accept-invitation/${invitation.id}`;
    
    // Send email notification

    try {
      const emailService = require('../services/emailService');

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

      } catch (fileError) {

      }

      const emailResult = await emailService.sendInvitationEmail({
        ...invitation,
        inviteLink,
        invitedByUser: invitation.invitedByUser
      });

    } catch (emailError) {

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

      return res.status(410).json({ error: 'Invitation has expired' });
    }

    res.json({ invitation });
  } catch (error) {

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

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expiresAt)) {

      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {

      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    res.json({ invitation });
  } catch (error) {

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

    if (!name || !password) {

      return res.status(400).json({ error: 'Name and password are required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {

      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id }
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

      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {

      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password

    const hashedPassword = await bcrypt.hash(password, 12);

    // Find the Role ID for the invitation role
    const role = await prisma.role.findUnique({
      where: { name: invitation.role }
    });

    // Create user and update invitation in a transaction

    const result = await prisma.$transaction(async (tx) => {
      // Create user

      const user = await tx.user.create({
        data: {
          name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
          roleId: role?.id || null,
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

    try {
      const emailService = require('../services/emailService');
      const welcomeData = {
        name: result.name,
        email: result.email,
        role: result.role
      };

      const emailResult = await emailService.sendWelcomeEmail(welcomeData);

    } catch (emailError) {

      // Don't fail the account creation if email fails
    }

    res.status(201).json({
      message: 'Account created successfully',
      user: result,
      token
    });
  } catch (error) {

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

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {

      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {

      return res.status(400).json({ error: 'Can only resend pending invitations' });
    }

    // Send email notification

    try {
      const emailService = require('../services/emailService');
      const baseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/accept-invitation/${invitation.id}`;

      const emailResult = await emailService.sendInvitationEmail({
        ...invitation,
        inviteLink,
        invitedByUser: invitation.invitedByUser
      });

    } catch (emailError) {

      // Don't fail the resend if email fails
    }

    res.json({ message: 'Invitation email resent successfully' });
  } catch (error) {

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

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation) {

      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {

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

    if (!fs.existsSync(logFile)) {

      return res.status(404).json({ 
        error: 'No invitation links found',
        message: 'No invitations have been created yet'
      });
    }
    
    const fileContent = fs.readFileSync(logFile, 'utf8');

    res.setHeader('Content-Type', 'text/plain');
    res.send(fileContent);
  } catch (error) {

    res.status(500).json({ error: 'Failed to read invitation links file' });
  }
});

module.exports = router;

