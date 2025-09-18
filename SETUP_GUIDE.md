# CN Terminal Web App - Quick Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (or use the provided Neon cloud database)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and configure your database URL
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Start the backend server
npm start
# OR for development with auto-reload
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

**Frontend runs on:** `http://localhost:3000`

## 📚 API Documentation

### Swagger UI
- **URL:** `http://localhost:5000/api-docs`
- **Description:** Interactive API documentation with testing capabilities

### API Endpoints
- **Base URL:** `http://localhost:5000/api`
- **Authentication:** Bearer token required for most endpoints

#### Main API Routes:
- `/api/auth` - Authentication (login, register, profile)
- `/api/customers` - Customer management
- `/api/jobs` - Job management
- `/api/consignments` - Consignment tracking
- `/api/invoices` - Invoice management
- `/api/shipments` - Shipment tracking
- `/api/enquiries` - Customer enquiries
- `/api/dashboard` - Dashboard statistics
- `/api/reports` - Reports and analytics
- `/api/files` - File upload/download

## 🔧 Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## 🌐 Access Points

- **Frontend App:** http://localhost:3000
- **API Documentation:** http://localhost:5000/api-docs
- **Database Studio:** Run `npm run db:studio` in backend directory

## 🔑 Default Login Credentials

Check `LOGIN_CREDENTIALS.md` for default admin credentials.

## 📁 Project Structure

```
cn_terminal_web_app/
├── backend/           # Node.js/Express API
│   ├── routes/        # API route handlers
│   ├── config/        # Database & Swagger config
│   ├── middleware/    # Authentication middleware
│   └── prisma/        # Database schema & migrations
├── frontend/          # React.js frontend
│   ├── src/
│   │   ├── pages/     # React pages
│   │   ├── components/ # Reusable components
│   │   └── services/  # API service calls
└── SETUP_GUIDE.md     # This file
```

## 🆘 Troubleshooting

1. **Database connection issues:** Check your `.env` file for correct `DATABASE_URL`
2. **Port conflicts:** Change ports in package.json scripts if needed
3. **CORS issues:** Backend is configured to allow all origins in development
4. **Missing dependencies:** Run `npm install` in both backend and frontend directories

## 📞 Support

For issues or questions, check the API documentation at `http://localhost:5000/api-docs` or review the source code in the respective directories.
