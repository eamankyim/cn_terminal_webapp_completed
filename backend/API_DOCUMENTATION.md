# CN Terminal API Documentation

## Overview

The CN Terminal API is a comprehensive REST API for managing logistics operations including customers, consignments, jobs, enquiries, shipments, invoices, and payments.

## Base URL

- **Development**: `http://localhost:5000`
- **API Documentation**: `http://localhost:5000/api-docs`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@cnterminal.com",
  "password": "admin123"
}
```

## API Endpoints

### Authentication

#### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "admin@cnterminal.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Super Administrator",
    "email": "admin@cnterminal.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-08-28T17:00:00.000Z",
    "updatedAt": "2025-08-28T17:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/register
Register a new user (Admin only).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@cnterminal.com",
  "password": "password123",
  "role": "STAFF"
}
```

### Customers

#### GET /api/customers
Get all customers with pagination and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or email
- `status` (optional): Filter by status (ACTIVE, INACTIVE, BLOCKED)
- `type` (optional): Filter by type (INDIVIDUAL, CORPORATE)

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+233241234567",
      "address": "123 Main Street, Accra",
      "type": "INDIVIDUAL",
      "status": "ACTIVE",
      "ghanaCard": "GHA-123456789-1",
      "tin": "TIN12345678",
      "createdAt": "2025-08-28T17:00:00.000Z",
      "updatedAt": "2025-08-28T17:00:00.000Z",
      "_count": {
        "consignments": 5,
        "enquiries": 2,
        "jobs": 3
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50,
    "limit": 10
  }
}
```

#### POST /api/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+233241234567",
  "address": "123 Main Street, Accra",
  "type": "INDIVIDUAL",
  "ghanaCard": "GHA-123456789-1",
  "tin": "TIN12345678"
}
```

### Consignments

#### GET /api/consignments
Get all consignments with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for tracking ID or goods type
- `status` (optional): Filter by status (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- `customerId` (optional): Filter by customer ID

**Response:**
```json
{
  "consignments": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "trackingId": "CONS-2025-001",
      "goodsType": "Electronics",
      "value": 10000,
      "status": "PENDING",
      "ghanaCard": "GHA-123456789-1",
      "tin": "TIN12345678",
      "createdAt": "2025-08-28T17:00:00.000Z",
      "updatedAt": "2025-08-28T17:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 25,
    "limit": 10
  }
}
```

#### POST /api/consignments
Create a new consignment.

**Request Body:**
```json
{
  "customerId": "uuid",
  "trackingId": "CONS-2025-001",
  "goodsType": "Electronics",
  "value": 10000,
  "ghanaCard": "GHA-123456789-1",
  "tin": "TIN12345678"
}
```

### Jobs

#### GET /api/jobs
Get all jobs with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for tracking ID or goods type
- `status` (optional): Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `customerId` (optional): Filter by customer ID

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "consignmentId": "uuid",
      "trackingId": "JOB-2025-001",
      "goodsType": "Electronics",
      "status": "PENDING",
      "createdAt": "2025-08-28T17:00:00.000Z",
      "updatedAt": "2025-08-28T17:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 15,
    "limit": 10
  }
}
```

#### POST /api/jobs
Create a new job.

**Request Body:**
```json
{
  "customerId": "uuid",
  "consignmentId": "uuid",
  "trackingId": "JOB-2025-001",
  "goodsType": "Electronics",
}
```

#### GET /api/jobs/customer/:customerId/consignments
Get consignments for a specific customer (for job creation).

**Response:**
```json
{
  "consignments": [
    {
      "id": "uuid",
      "trackingId": "CONS-2025-001",
      "goodsType": "Electronics",
      "value": 10000,
      "status": "PENDING"
    }
  ]
}
```

### Enquiries

#### GET /api/enquiries
Get all enquiries with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for subject or message
- `status` (optional): Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `customerId` (optional): Filter by customer ID

#### POST /api/enquiries
Create a new enquiry.

**Request Body:**
```json
{
  "customerId": "uuid",
  "subject": "Shipping inquiry",
  "message": "I would like to know about shipping rates to Kumasi"
}
```

### Shipments

#### GET /api/shipments
Get all shipments with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for tracking number
- `status` (optional): Filter by status (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- `serviceType` (optional): Filter by service type (EXPRESS, STANDARD, ECONOMY)

#### POST /api/shipments
Create a new shipment.

**Request Body:**
```json
{
  "customerId": "uuid",
  "serviceType": "STANDARD",
  "origin": "Accra, Ghana",
  "destination": "Kumasi, Ghana",
  "weight": 5.5,
  "dimensions": "20cm x 15cm x 10cm"
}
```

### Invoices

#### GET /api/invoices
Get all invoices with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for invoice number
- `status` (optional): Filter by status (PENDING, PAID, OVERDUE, CANCELLED)
- `customerId` (optional): Filter by customer ID

#### POST /api/invoices
Create a new invoice.

**Request Body:**
```json
{
  "customerId": "uuid",
  "jobId": "uuid",
  "shipmentId": "uuid",
  "amount": 500,
  "dueDate": "2025-09-28T00:00:00.000Z"
}
```

### Payments

#### GET /api/payments
Get all payments with pagination and filters.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for transaction ID
- `status` (optional): Filter by status (PENDING, COMPLETED, FAILED, REFUNDED)
- `method` (optional): Filter by payment method (CASH, BANK_TRANSFER, MOBILE_MONEY, CARD)
- `invoiceId` (optional): Filter by invoice ID

#### POST /api/payments
Create a new payment.

**Request Body:**
```json
{
  "invoiceId": "uuid",
  "amount": 500,
  "method": "MOBILE_MONEY",
  "transactionId": "TXN123456789"
}
```

## Data Models

### User
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "ADMIN | IT_CONSULTANT | ENQUIRY_OFFICER | RELEASE_OFFICER | REVIEW_OFFICER | INVOICE_OFFICER | CLEARING_OFFICER | STAFF",
  "isActive": "boolean",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Customer
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "type": "INDIVIDUAL | CORPORATE",
  "status": "ACTIVE | INACTIVE | BLOCKED",
  "ghanaCard": "string",
  "tin": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Consignment
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "trackingId": "string",
  "goodsType": "string",
  "value": "number",
  "status": "PENDING | IN_TRANSIT | DELIVERED | CANCELLED",
  "ghanaCard": "string",
  "tin": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Job
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "consignmentId": "uuid",
  "trackingId": "string",
  "goodsType": "string",
  "status": "PENDING | IN_PROGRESS | COMPLETED | CANCELLED",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Enquiry
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "subject": "string",
  "message": "string",
  "status": "OPEN | IN_PROGRESS | RESOLVED | CLOSED",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Shipment
```json
{
  "id": "uuid",
  "trackingNumber": "string",
  "customerId": "uuid",
  "serviceType": "EXPRESS | STANDARD | ECONOMY",
  "origin": "string",
  "destination": "string",
  "weight": "number",
  "dimensions": "string",
  "status": "PENDING | IN_TRANSIT | DELIVERED | CANCELLED",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Invoice
```json
{
  "id": "uuid",
  "invoiceNumber": "string",
  "customerId": "uuid",
  "jobId": "uuid",
  "shipmentId": "uuid",
  "amount": "number",
  "status": "PENDING | PAID | OVERDUE | CANCELLED",
  "dueDate": "date-time",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Payment
```json
{
  "id": "uuid",
  "invoiceId": "uuid",
  "amount": "number",
  "method": "CASH | BANK_TRANSFER | MOBILE_MONEY | CARD",
  "status": "PENDING | COMPLETED | FAILED | REFUNDED",
  "transactionId": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Usage Examples

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cnterminal.com",
    "password": "admin123"
  }'
```

#### Get Customers
```bash
curl -X GET "http://localhost:5000/api/customers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Customer
```bash
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+233241234567",
    "type": "INDIVIDUAL"
  }'
```

### JavaScript/Fetch Examples

#### Login
```javascript
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@cnterminal.com',
    password: 'admin123'
  })
});

const { token, user } = await loginResponse.json();
```

#### Get Customers
```javascript
const customersResponse = await fetch('http://localhost:5000/api/customers?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { customers, pagination } = await customersResponse.json();
```

## Rate Limiting

The API currently does not implement rate limiting. Consider implementing rate limiting for production use.

## Security

- All endpoints (except login) require JWT authentication
- Passwords are hashed using bcrypt
- CORS is enabled for cross-origin requests
- Input validation is implemented on all endpoints

## Support

For API support, contact:
- Email: support@cnterminal.com
- Documentation: http://localhost:5000/api-docs












