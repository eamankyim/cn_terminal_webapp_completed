const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

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
 *                         enum: [ADMIN, STAFF, DRIVER, WAREHOUSE]
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
 *                 enum: [ADMIN, STAFF, DRIVER, WAREHOUSE]
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

    // Send email notification
    console.log('📧 Starting email send process for invitation:', invitation.id);
    try {
      const emailService = require('../services/emailService');
      const inviteLink = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/accept-invitation/${invitation.id}`;
      
      console.log('📧 Generated invite link:', inviteLink);
      console.log('📧 === NEW INVITATION LINK ===');
      console.log('📧 🔗 INVITATION LINK:', inviteLink);
      console.log('📧 📧 Email:', invitation.email);
      console.log('📧 👤 Role:', invitation.role);
      console.log('📧 ⏰ Expires:', invitation.expiresAt);
      console.log('📧 === END NEW INVITATION LINK ===');
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
      invitation
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
      // Mark as expired
      await prisma.invitation.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });

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
      // Mark as expired
      await prisma.invitation.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });

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
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and update invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
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

    console.log('📧 Account created successfully for:', result.email);
    console.log('📧 User ID:', result.id);
    console.log('📧 Role:', result.role);
    
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

module.exports = router;

