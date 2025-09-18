const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CN Terminal API',
      version: '1.0.0',
      description: 'Comprehensive API for CN Terminal Logistics Management System',
      contact: {
        name: 'CN Terminal Support',
        email: 'support@cnterminal.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['ADMIN', 'STAFF', 'DRIVER', 'WAREHOUSE'] 
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['INDIVIDUAL', 'CORPORATE'] 
            },
            status: { 
              type: 'string', 
              enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] 
            },
            ghanaCard: { type: 'string' },
            tin: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Consignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            trackingId: { type: 'string' },
            goodsType: { type: 'string' },
            value: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] 
            },
            ghanaCard: { type: 'string' },
            tin: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            consignmentId: { type: 'string', format: 'uuid' },
            trackingId: { type: 'string' },
            goodsType: { type: 'string' },
            estimatedValue: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Enquiry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            subject: { type: 'string' },
            message: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Shipment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            trackingNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            serviceType: { 
              type: 'string', 
              enum: ['EXPRESS', 'STANDARD', 'ECONOMY'] 
            },
            origin: { type: 'string' },
            destination: { type: 'string' },
            weight: { type: 'number' },
            dimensions: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            customerId: { type: 'string', format: 'uuid' },
            jobId: { type: 'string', format: 'uuid' },
            shipmentId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] 
            },
            dueDate: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            method: { 
              type: 'string', 
              enum: ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD'] 
            },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] 
            },
            transactionId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;












