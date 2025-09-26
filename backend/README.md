# CN Terminal Backend API

A Node.js backend API for the CN Terminal web application, built with Express.js, Prisma ORM, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Customer Management**: Complete CRUD operations for customer data
- **Consignment Management**: Track consignments with Ghana Card and TIN details
- **Job Management**: Handle clearing jobs with status tracking
- **Enquiry Management**: Process customer enquiries
- **Shipment Management**: Track domestic and international shipments
- **Invoice Management**: Generate and manage invoices
- **Payment Management**: Track payments and payment methods
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cn_terminal_db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations (if using migrations)
   npm run db:migrate
   ```

5. **Seed the database with sample data**:
   ```bash
   npm run db:seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in your .env file).

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get all users (Admin only)

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/statistics` - Get customer statistics

### Consignments
- `GET /api/consignments` - Get all consignments
- `GET /api/consignments/:id` - Get consignment by ID
- `POST /api/consignments` - Create new consignment
- `PUT /api/consignments/:id` - Update consignment
- `PUT /api/consignments/:id/status` - Update consignment status
- `DELETE /api/consignments/:id` - Delete consignment

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `PUT /api/jobs/:id/status` - Update job status
- `GET /api/jobs/customer/:customerId/consignments` - Get consignments for customer
- `DELETE /api/jobs/:id` - Delete job

### Enquiries
- `GET /api/enquiries` - Get all enquiries
- `GET /api/enquiries/:id` - Get enquiry by ID
- `POST /api/enquiries` - Create new enquiry
- `PUT /api/enquiries/:id` - Update enquiry
- `PUT /api/enquiries/:id/status` - Update enquiry status
- `DELETE /api/enquiries/:id` - Delete enquiry

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/:id` - Get shipment by ID
- `POST /api/shipments` - Create new shipment
- `PUT /api/shipments/:id` - Update shipment
- `PUT /api/shipments/:id/status` - Update shipment status
- `DELETE /api/shipments/:id` - Delete shipment

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `PUT /api/payments/:id/status` - Update payment status
- `DELETE /api/payments/:id` - Delete payment

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **ADMIN**: Full access to all features and user management
- **STAFF**: Access to all operational features

## 🗄️ Database Schema

The database includes the following main entities:

- **User**: Authentication and authorization
- **Customer**: Customer information and details
- **Consignment**: Consignment details with Ghana Card and TIN
- **Job**: Clearing jobs with status tracking
- **Enquiry**: Customer enquiries
- **Shipment**: Domestic and international shipments
- **Invoice**: Financial invoices
- **Payment**: Payment tracking

## 🛠️ Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## 🔍 API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cnterminal.com",
    "password": "admin123"
  }'
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CORS protection
- Input validation
- SQL injection protection (via Prisma)

## 📊 Database Seeding

The seed script creates:
- Admin user (email: `admin@cnterminal.com`, password: `admin123`)
- Sample customers
- Sample consignments
- Sample jobs
- Sample enquiries
- Sample shipments
- Sample invoices and payments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.












