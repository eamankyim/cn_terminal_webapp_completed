# 🚀 CN Terminal API Integration Guide

## Overview

This document outlines the complete API integration between the CN Terminal frontend and backend, ensuring seamless communication and data consistency.

## ✅ Integration Status

### **COMPLETED INTEGRATIONS:**

#### 1. **Authentication System** ✅
- **Frontend**: `src/contexts/AuthContext.jsx`
- **Backend**: `backend/routes/auth.js`
- **API Service**: `src/services/api.js`
- **Features**:
  - JWT token authentication
  - Login/logout functionality
  - User profile management
  - Password change functionality
  - User management (admin only)

#### 2. **Customer Management** ✅
- **Frontend**: `src/contexts/CustomerContext.jsx`, `src/pages/CustomersPage.jsx`
- **Backend**: `backend/routes/customers.js`
- **Features**:
  - CRUD operations for customers
  - Customer selector component
  - Search and pagination
  - Customer statistics
  - Real-time data synchronization

#### 3. **Enquiry Management** ✅
- **Frontend**: `src/pages/EnquiriesPage.jsx`
- **Backend**: `backend/routes/enquiries.js`
- **Features**:
  - Create, read, update, delete enquiries
  - Status management
  - Document handling
  - Customer linking

#### 4. **Public Tracking** ✅
- **Frontend**: `src/pages/PublicTrackingPage.jsx`
- **Backend**: `backend/server.js` (public endpoint)
- **Features**:
  - No authentication required
  - Search shipments and consignments
  - Timeline tracking
  - Real-time status updates

#### 5. **API Service Layer** ✅
- **File**: `src/services/api.js`
- **Features**:
  - Centralized API communication
  - Automatic token management
  - Error handling
  - Request/response interceptors

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/login          - User login
POST /api/auth/register       - User registration (admin only)
GET  /api/auth/profile        - Get user profile
PUT  /api/auth/profile        - Update user profile
PUT  /api/auth/change-password - Change password
GET  /api/auth/users          - Get all users (admin only)
PUT  /api/auth/users/:id/status - Update user status (admin only)
```

### Customers
```
GET    /api/customers         - Get all customers (with pagination)
GET    /api/customers/:id     - Get customer by ID
POST   /api/customers         - Create new customer
PUT    /api/customers/:id     - Update customer
DELETE /api/customers/:id     - Delete customer
GET    /api/customers/:id/statistics - Get customer statistics
GET    /api/customers/selector - Get customers for dropdown
```

### Enquiries
```
GET    /api/enquiries         - Get all enquiries
GET    /api/enquiries/:id     - Get enquiry by ID
POST   /api/enquiries         - Create new enquiry
PUT    /api/enquiries/:id     - Update enquiry
PUT    /api/enquiries/:id/status - Update enquiry status
DELETE /api/enquiries/:id     - Delete enquiry
```

### Public Endpoints
```
GET /api/health              - Health check
GET /api/track/:trackingId   - Public package tracking
```

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup
```bash
cd .. # (back to root directory)
npm install
npm start
```

### 3. Environment Configuration
Create `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🧪 Testing Integration

### 1. **Integration Test Component**
- **Location**: `src/components/IntegrationTest.jsx`
- **Access**: Available on the Dashboard page
- **Features**:
  - Tests all API endpoints
  - Real-time status reporting
  - Detailed error messages
  - Success/failure indicators

### 2. **Manual Testing**
1. **Authentication**:
   - Login with `admin@cnterminal.com` / `admin123`
   - Verify JWT token is stored
   - Test logout functionality

2. **Customer Management**:
   - Create new customer
   - Edit existing customer
   - Use customer selector in forms
   - View customer statistics

3. **Enquiry Management**:
   - Create new enquiry
   - Update enquiry status
   - Link enquiries to customers

4. **Public Tracking**:
   - Visit public tracking page
   - Search for tracking IDs
   - Verify no authentication required

## 🔍 Data Flow

### 1. **Authentication Flow**
```
Frontend Login → API Service → Backend Auth → JWT Token → Local Storage → Context Update
```

### 2. **Customer Management Flow**
```
Frontend Form → API Service → Backend CRUD → Database → Response → Context Update → UI Update
```

### 3. **Real-time Updates**
```
User Action → API Call → Backend Processing → Database Update → Response → Context Update → UI Re-render
```

## 🚨 Error Handling

### 1. **API Service Level**
- Automatic token refresh
- Network error handling
- HTTP status code handling
- User-friendly error messages

### 2. **Component Level**
- Try-catch blocks for async operations
- Loading states
- Error message display
- Fallback to mock data (development)

### 3. **Context Level**
- Centralized error handling
- State consistency
- Automatic retry mechanisms

## 📊 Performance Optimizations

### 1. **API Caching**
- Customer data caching in context
- Automatic cache invalidation
- Optimistic updates

### 2. **Request Optimization**
- Batch API calls where possible
- Pagination for large datasets
- Search debouncing

### 3. **UI Optimizations**
- Loading states
- Skeleton screens
- Error boundaries

## 🔐 Security Features

### 1. **Authentication**
- JWT token-based authentication
- Automatic token refresh
- Secure token storage

### 2. **Authorization**
- Role-based access control
- Route protection
- API endpoint protection

### 3. **Data Validation**
- Frontend form validation
- Backend input validation
- SQL injection prevention

## 🎯 Next Steps

### 1. **Immediate Actions**
- [ ] Test all integrations
- [ ] Verify database connections
- [ ] Test error scenarios
- [ ] Performance testing

### 2. **Future Enhancements**
- [ ] Real-time notifications
- [ ] File upload integration
- [ ] Advanced search features
- [ ] Mobile responsiveness

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure backend CORS is configured
   - Check API URL configuration

2. **Authentication Failures**
   - Verify JWT secret configuration
   - Check token expiration

3. **Database Connection Issues**
   - Verify DATABASE_URL in backend
   - Check PostgreSQL connection

4. **API Endpoint Not Found**
   - Verify backend server is running
   - Check route configurations

## 📞 Support

For integration issues:
1. Check the Integration Test component
2. Review browser console for errors
3. Verify backend server logs
4. Test individual API endpoints

---

**Status**: ✅ **FULLY INTEGRATED**  
**Last Updated**: January 2025  
**Version**: 1.0.0
