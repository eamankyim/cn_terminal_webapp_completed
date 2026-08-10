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
        url: process.env.PRODUCTION_URL || process.env.FRONTEND_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
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
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { 
              type: 'string', 
              enum: ['ADMIN', 'IT_CONSULTANT', 'ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'TRANSPORT_COORDINATOR', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER', 'STAFF', 'DRIVER', 'ACCOUNTANT']
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
            email: { type: 'string', format: 'email', nullable: true },
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
        },
        CashflowSummary: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'The time period for the summary' },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' }
              }
            },
            summary: {
              type: 'object',
              properties: {
                totalInflows: { type: 'number' },
                totalOutflows: { type: 'number' },
                netCashflow: { type: 'number' },
                inflowCount: { type: 'integer' },
                outflowCount: { type: 'integer' }
              }
            },
            inflowBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sourceType: { type: 'string' },
                  amount: { type: 'number' },
                  count: { type: 'integer' }
                }
              }
            },
            outflowBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sourceType: { type: 'string' },
                  amount: { type: 'number' },
                  count: { type: 'integer' }
                }
              }
            },
            dailyTrends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  type: { type: 'string', enum: ['INFLOW', 'OUTFLOW'] },
                  amount: { type: 'number' },
                  count: { type: 'integer' }
                }
              }
            }
          }
        },
        ExpenseStats: {
          type: 'object',
          properties: {
            totalAmount: { type: 'number', description: 'Total amount of all expenses' },
            totalCount: { type: 'integer', description: 'Total number of expense requests' },
            pendingRequests: { type: 'integer', description: 'Number of pending expense requests' },
            approvedRequests: { type: 'integer', description: 'Number of approved expense requests' },
            rejectedRequests: { type: 'integer', description: 'Number of rejected expense requests' },
            categoryBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['FUEL', 'MATERIALS', 'OPERATIONS', 'MISCELLANEOUS'] },
                  amount: { type: 'number' },
                  count: { type: 'integer' }
                }
              }
            }
          }
        },
        PayoutStats: {
          type: 'object',
          properties: {
            totalAmount: { type: 'number', description: 'Total amount of all payouts' },
            totalCount: { type: 'integer', description: 'Total number of payout requests' },
            pendingRequests: { type: 'integer', description: 'Number of pending payout requests' },
            approvedRequests: { type: 'integer', description: 'Number of approved payout requests' },
            rejectedRequests: { type: 'integer', description: 'Number of rejected payout requests' },
            categoryBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['DRIVER_PAYMENT', 'VENDOR_PAYMENT', 'OPERATIONS', 'MISCELLANEOUS'] },
                  amount: { type: 'number' },
                  count: { type: 'integer' }
                }
              }
            }
          }
        },
        ExpenseRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            jobId: { type: 'string', format: 'uuid' },
            category: { 
              type: 'string', 
              enum: ['FUEL', 'MATERIALS', 'OPERATIONS', 'MISCELLANEOUS'] 
            },
            description: { type: 'string' },
            amount: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] 
            },
            approvedBy: { type: 'string', format: 'uuid' },
            approvedAt: { type: 'string', format: 'date-time' },
            rejectionReason: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PayoutRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            jobId: { type: 'string', format: 'uuid' },
            category: { 
              type: 'string', 
              enum: ['DRIVER_PAYMENT', 'VENDOR_PAYMENT', 'OPERATIONS', 'MISCELLANEOUS'] 
            },
            recipientName: { type: 'string' },
            recipientAccount: { type: 'string' },
            amount: { type: 'number' },
            paymentMethod: { 
              type: 'string', 
              enum: ['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH'] 
            },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] 
            },
            approvedBy: { type: 'string', format: 'uuid' },
            approvedAt: { type: 'string', format: 'date-time' },
            rejectionReason: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CashflowTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { 
              type: 'string', 
              enum: ['INFLOW', 'OUTFLOW'] 
            },
            sourceType: { 
              type: 'string', 
              enum: ['PAYMENT', 'EXPENSE', 'PAYOUT', 'ADJUSTMENT'] 
            },
            amount: { type: 'number' },
            description: { type: 'string' },
            referenceId: { type: 'string' },
            referenceType: { type: 'string' },
            transactionDate: { type: 'string', format: 'date-time' },
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

