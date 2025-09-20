const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { prisma } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const consignmentRoutes = require('./routes/consignments');
const jobRoutes = require('./routes/jobs');
const enquiryRoutes = require('./routes/enquiries');
const shipmentRoutes = require('./routes/shipments');
const invoiceRoutes = require('./routes/invoices');
const invitationRoutes = require('./routes/invitations');
const initRoutes = require('./routes/init');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const fileRoutes = require('./routes/files');
const configurationRoutes = require('./routes/configurations');

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CN Terminal API Documentation'
}));

// Route middleware
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/consignments', consignmentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/init', initRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/configurations', configurationRoutes);

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
 *                 adminCount:
 *                   type: number
 *                   description: Number of admin users
 *       500:
 *         description: Internal server error
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Super admin already exists. Only one super admin can be created."
 *       500:
 *         description: Internal server error
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: CN Terminal API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-01-28T10:30:00.000Z
 * /api/track/{trackingId}:
 *   get:
 *     summary: Public tracking endpoint
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: trackingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tracking ID to search for
 *     responses:
 *       200:
 *         description: Tracking information found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trackingId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       location:
 *                         type: string
 *                       description:
 *                         type: string
 *       404:
 *         description: Tracking ID not found
 */
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CN Terminal API is running',
    timestamp: new Date().toISOString()
  });
});

// Public tracking endpoint (no authentication required)
app.get('/api/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Search in shipments first
    let trackingResult = await prisma.shipment.findUnique({
      where: { trackingId },
      select: {
        id: true,
        trackingId: true,
        customerName: true,
        packageType: true,
        packageWeight: true,
        packageValue: true,
        serviceType: true,
        status: true,
        collectionDate: true,
        createdAt: true,
        deliveryAddress: true,
        deliveryCity: true,
        recipientName: true,
        recipientPhone: true
      }
    });

    if (!trackingResult) {
      // Search in consignments
      trackingResult = await prisma.consignment.findUnique({
        where: { trackingId },
        select: {
          id: true,
          trackingId: true,
          consigneeName: true,
          goodsType: true,
          value: true,
          status: true,
          date: true,
          createdAt: true,
          consigneeAddress: true
        }
      });
    }

    if (!trackingResult) {
      return res.status(404).json({ 
        error: 'Tracking ID not found',
        trackingId 
      });
    }

    // Add mock timeline data
    const timeline = [
      {
        time: trackingResult.createdAt || trackingResult.date,
        status: 'Package Received',
        location: 'Origin Facility',
        description: 'Package received and processed'
      }
    ];

    if (trackingResult.status === 'IN_TRANSIT' || trackingResult.status === 'DELIVERED') {
      timeline.push({
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'In Transit',
        location: 'Transit Hub',
        description: 'Package is in transit to destination'
      });
    }

    if (trackingResult.status === 'DELIVERED') {
      timeline.push({
        time: new Date().toISOString(),
        status: 'Delivered',
        location: trackingResult.deliveryAddress || trackingResult.consigneeAddress,
        description: 'Package has been delivered'
      });
    }

    res.json({
      ...trackingResult,
      timeline,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
