const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before any modules that read process.env
dotenv.config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { prisma, testConnection } = require('./config/database');
const { Server } = require('socket.io');

// Initialize file logging (logs will be saved to backend/logs/)
require('./logger');
console.log('='.repeat(80));
console.log('SERVER STARTING - Logs will be saved to backend/logs/');
console.log('='.repeat(80));

// Test database connection on startup
testConnection();

const app = express();
const server = http.createServer(app);

// Shared CORS origins (comma-separated CORS_ORIGIN / FRONTEND_URL, or reflect any in dev)
const configuredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowAnyOrigin = configuredOrigins.length === 0 || process.env.NODE_ENV !== 'production';
const corsOrigin = allowAnyOrigin
  ? true
  : configuredOrigins;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available globally
global.io = io;

// Middleware - Configure CORS
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
  console.log('📁 [Static Files] Request for:', req.url);
  console.log('  - Full path:', path.join(__dirname, 'uploads', req.url));
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const consignmentRoutes = require('./routes/consignments');
const jobRoutes = require('./routes/jobs');
const enquiryRoutes = require('./routes/enquiries');
const shipmentRoutes = require('./routes/shipments');
const invoiceRoutes = require('./routes/invoices');
const estimateRoutes = require('./routes/estimates');
const invitationRoutes = require('./routes/invitations');
const initRoutes = require('./routes/init');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const fileRoutes = require('./routes/files');
const configurationRoutes = require('./routes/configurations');
const notificationRoutes = require('./routes/notifications');
const roleRoutes = require('./routes/roles');
const expenseRoutes = require('./routes/expenses');
const payoutRoutes = require('./routes/payouts');
const cashflowRoutes = require('./routes/cashflow');

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
app.use('/api/estimates', estimateRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/init', initRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);

app.use('/api/expenses', expenseRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/cashflow', cashflowRoutes);

// Add catch-all route for debugging
app.use('/api/*', (req, res, next) => {

  next();
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
// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CN Terminal API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      auth: '/api/auth',
      customers: '/api/customers',
      jobs: '/api/jobs',
      consignments: '/api/consignments',
      enquiries: '/api/enquiries',
      shipments: '/api/shipments',
      invoices: '/api/invoices'
    },
    timestamp: new Date().toISOString()
  });
});

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

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📡 [Socket.IO] New client connected:', socket.id);

  // Handle user authentication and join user room
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`✅ [Socket.IO] User ${userId} authenticated and joined room: user_${userId}`);
    } else {
      console.warn('⚠️ [Socket.IO] Authentication attempted without userId');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('📡 [Socket.IO] Client disconnected:', socket.id);
  });
});

// Default to 5001 — macOS AirPlay Receiver commonly binds port 5000
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Set PORT in backend/.env (e.g. PORT=5001) or free the port.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 CN Terminal Backend Server Started Successfully!');
  console.log('='.repeat(80));
  console.log(`📡 Server running on: ${BASE_URL}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('\n📚 API Documentation:');
  console.log(`   Swagger UI: ${BASE_URL}/api-docs`);
  console.log(`   API Root: ${BASE_URL}/api`);
  console.log(`   Health Check: ${BASE_URL}/api/health`);
  console.log('\n🔗 Key API Endpoints:');
  console.log(`   Authentication: ${BASE_URL}/api/auth`);
  console.log(`   Jobs: ${BASE_URL}/api/jobs`);
  console.log(`   Customers: ${BASE_URL}/api/customers`);
  console.log(`   Invoices: ${BASE_URL}/api/invoices`);
  console.log(`   Dashboard: ${BASE_URL}/api/dashboard`);
  console.log(`   Reports: ${BASE_URL}/api/reports`);
  console.log(`   Settings: ${BASE_URL}/api/configurations`);
  console.log('\n💡 Tip: Visit the Swagger UI to explore all available endpoints');
  console.log('='.repeat(80) + '\n');
});
