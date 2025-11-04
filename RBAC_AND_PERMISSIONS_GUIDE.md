# Role-Based Access Control (RBAC) & Permissions Implementation Guide

This comprehensive guide documents the complete strategy for implementing RBAC (Role-Based Access Control) and permissions in a production application. This guide can be applied to any Node.js application with React frontend.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema Design](#database-schema-design)
3. [Auto-Seeding Strategy](#auto-seeding-strategy)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Role-Based Dashboards](#role-based-dashboards)
7. [Permission Checks](#permission-checks)
8. [Integration with Swagger](#integration-with-swagger)
9. [Testing Strategy](#testing-strategy)
10. [Best Practices](#best-practices)

---

## Architecture Overview

### RBAC System Components

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JWT Token      │
│  (includes role)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Authentication │────▶│   Database   │
│   Middleware    │     │   (User)     │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Authorization  │────▶│   Database   │
│   Middleware    │     │   (Role)     │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │
│   (filtered)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend UI    │
│  (permissions)  │
└─────────────────┘
```

### Key Concepts

1. **Roles**: Predefined user types (superadmin, admin, finance, etc.)
2. **Permissions**: Granular actions users can perform (`users:create`, `jobs:view`, etc.)
3. **Wildcard Permissions**: Special permission (`*`) grants all access
4. **Ownership Checks**: Users can only access their own resources (e.g., drivers see only assigned jobs)
5. **Dashboard Routing**: Different dashboards for different roles

---

## Database Schema Design

### 1. User Table

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  role          String   // Reference to Role.name (not FK for flexibility)
  avatarUrl     String?  @map("avatar_url")
  phone         String?
  warehouseLocation String? @map("warehouse_location") // For location-based access
  active        Boolean  @default(true)
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  lastLogin     DateTime? @map("last_login")

  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Key Design Decisions:**
- `role` is a String, not a foreign key, for flexibility
- `warehouseLocation` allows location-based access control
- Indexes on `email` and `role` for fast lookups

### 2. Role Table

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique  // 'superadmin', 'admin', 'finance', etc.
  displayName String   @map("display_name")  // 'Super Administrator'
  description String?
  permissions Json     // Array of permission strings stored as JSON
  color       String?  // For UI display: '#f5222d'
  isSystem    Boolean  @default(false) @map("is_system")  // Cannot be deleted
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([name])
  @@map("roles")
}
```

**Key Design Decisions:**
- `permissions` stored as JSON array for flexibility
- `isSystem` flag prevents deletion of system roles
- `color` stored for consistent UI theming

### 3. Permission Structure

Permissions are stored as an array of strings in the `permissions` JSON field:

```json
[
  "dashboard",
  "users:view",
  "users:create",
  "users:update",
  "users:delete",
  "jobs:view_all",
  "jobs:create",
  "financial:view"
]
```

**Permission Naming Convention:**
- Format: `resource:action` or `resource:action_scope`
- Examples:
  - `users:create` - Create users
  - `jobs:view_all` - View all jobs (unrestricted)
  - `jobs:view_own` - View only own jobs
  - `financial:view` - View financial data

### 4. Example Role Definitions

```javascript
const roles = [
  {
    name: 'superadmin',
    displayName: 'Super Administrator',
    description: 'Full system access with all privileges',
    color: '#f5222d',
    isSystem: true,
    permissions: JSON.stringify(['*']), // Wildcard = all permissions
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access and management',
    color: '#1890ff',
    isSystem: true,
    permissions: JSON.stringify([
      'dashboard',
      'users:view', 'users:create', 'users:update', 'users:delete',
      'jobs:view_all', 'jobs:create', 'jobs:update', 'jobs:delete',
      'customers:view', 'customers:create', 'customers:update',
      'batches:view', 'batches:create', 'batches:update',
      'invoices:view', 'invoices:create', 'invoices:update',
      'invitations:send', 'invitations:view',
      'reports:view_all',
      'financial:view',
    ]),
  },
  {
    name: 'finance',
    displayName: 'Finance Manager',
    description: 'Manage invoices, payments, and financial reports',
    color: '#faad14',
    isSystem: true,
    permissions: JSON.stringify([
      'dashboard',
      'invoices:view', 'invoices:create', 'invoices:update',
      'jobs:view_all', // Read-only for pricing
      'customers:view', // Read-only for billing
      'reports:view_all', 'reports:financial',
      'financial:view',
    ]),
  },
  {
    name: 'driver',
    displayName: 'Driver',
    description: 'Collection and delivery operations',
    color: '#fa8c16',
    isSystem: true,
    permissions: JSON.stringify([
      'dashboard',
      'driver-dashboard',
      'jobs:view_own', // Only assigned jobs
      'jobs:update_status', // Can update status of assigned jobs
      'jobs:add_notes',
      'customers:view', // Read-only
      'upload-documents',
      'reports:view_own',
    ]),
  },
  // ... more roles
];
```

---

## Auto-Seeding Strategy

### Concept

When the first superadmin is created via Swagger, automatically seed all roles and settings if they don't exist. This ensures:
1. No manual seeding required
2. Production-ready setup in one step
3. Idempotent operation (can run multiple times safely)

### Implementation

#### 1. Seed Utility Functions (`backend/src/utils/seedUtils.js`)

```javascript
const prisma = require('../config/database');

/**
 * Check if roles are already seeded
 */
async function rolesExist() {
  const roleCount = await prisma.role.count({
    where: { isSystem: true },
  });
  return roleCount > 0;
}

/**
 * Seed all system roles
 */
async function seedRoles() {
  const roles = [
    // ... role definitions from above
  ];

  let seededCount = 0;

  for (const role of roles) {
    const result = await prisma.role.upsert({
      where: { name: role.name },
      update: {}, // Don't update existing roles
      create: role,
    });
    if (result) seededCount++;
  }

  return {
    success: true,
    count: seededCount,
    total: roles.length,
  };
}

/**
 * Seed system settings
 */
async function seedSettings() {
  const settings = [
    {
      key: 'company_name',
      value: 'Best Deal App',
      description: 'Company name',
      type: 'string',
    },
    {
      key: 'company_email',
      value: 'info@bestdeal.com',
      description: 'Company contact email',
      type: 'string',
    },
    {
      key: 'default_currency',
      value: 'USD',
      description: 'Default currency for pricing',
      type: 'string',
    },
    // ... more settings
  ];

  let seededCount = 0;

  for (const setting of settings) {
    const result = await prisma.setting.upsert({
      where: { key: setting.key },
      update: {}, // Don't update existing settings
      create: setting,
    });
    if (result) seededCount++;
  }

  return {
    success: true,
    count: seededCount,
    total: settings.length,
  };
}

/**
 * Auto-seed roles and settings if they don't exist
 */
async function autoSeedIfNeeded() {
  const rolesAlreadyExist = await rolesExist();
  
  if (rolesAlreadyExist) {
    return {
      rolesSeeded: false,
      settingsSeeded: false,
      message: 'Roles and settings already exist',
    };
  }

  console.log('🌱 Auto-seeding roles and settings...');
  
  const rolesResult = await seedRoles();
  const settingsResult = await seedSettings();

  console.log(`✅ Seeded ${rolesResult.count} roles and ${settingsResult.count} settings`);

  return {
    rolesSeeded: true,
    settingsSeeded: true,
    rolesCount: rolesResult.count,
    settingsCount: settingsResult.count,
    message: `Successfully seeded ${rolesResult.count} roles and ${settingsResult.count} settings`,
  };
}

module.exports = {
  seedRoles,
  seedSettings,
  rolesExist,
  autoSeedIfNeeded,
};
```

#### 2. Integration with Superadmin Creation (`backend/src/controllers/authController.js`)

```javascript
const { autoSeedIfNeeded } = require('../utils/seedUtils');

/**
 * Create first superadmin (one-time only)
 * Auto-seeds roles and settings if they don't exist
 */
exports.createSuperadmin = asyncHandler(async (req, res) => {
  // Check if admin/superadmin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'admin' },
        { role: 'superadmin' },
      ],
    },
  });

  if (existingAdmin) {
    return sendError(res, 403, 'Admin already exists. Cannot create another superadmin.');
  }

  // Auto-seed roles and settings if they don't exist
  const seedResult = await autoSeedIfNeeded();
  
  if (seedResult.rolesSeeded) {
    console.log('✅ Auto-seeded roles and settings during superadmin creation');
  }

  // Create superadmin user
  const { email, password, name } = req.body;
  
  const passwordHash = await hashPassword(password);
  
  const superadmin = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: 'superadmin',
      active: true,
      emailVerified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const token = generateToken({ id: superadmin.id, email: superadmin.email, role: superadmin.role });
  const refreshToken = generateRefreshToken({ id: superadmin.id });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: superadmin.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return sendSuccess(res, 201, 'Superadmin created successfully. Roles and settings auto-seeded.', {
    user: superadmin,
    token,
    refreshToken,
    seedInfo: seedResult,
  });
});
```

### Benefits

- **One-Step Setup**: Create superadmin via Swagger, and everything is ready
- **Idempotent**: Safe to run multiple times
- **Production Ready**: No manual database seeding required
- **Flexible**: Easy to add new roles/settings later

---

## Backend Implementation

### 1. Authentication Middleware (`backend/src/middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { sendError } = require('../utils/responseUtils');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendError(res, 401, 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to get latest role/permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        emailVerified: true,
        warehouseLocation: true, // For location-based access
      },
    });

    if (!user || !user.active) {
      return sendError(res, 401, 'User not found or inactive');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Invalid token');
  }
};
```

### 2. Authorization Middleware (`backend/src/middleware/auth.js`)

```javascript
/**
 * Check if user has one of the required roles
 * @param {...string} allowedRoles - Roles allowed to access
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    // Superadmin bypasses all role checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied. Insufficient permissions.');
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    // Superadmin has all permissions
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Fetch role with permissions
    const role = await prisma.role.findUnique({
      where: { name: req.user.role },
      select: { permissions: true },
    });

    if (!role) {
      return sendError(res, 403, 'Role not found');
    }

    const permissions = role.permissions;

    // Check wildcard permission
    if (permissions.includes('*')) {
      return next();
    }

    // Check specific permission
    if (!permissions.includes(permission)) {
      return sendError(res, 403, `Access denied. Required permission: ${permission}`);
    }

    next();
  };
};
```

### 3. Route Protection Examples

```javascript
// Role-based protection
router.post('/jobs', authenticate, authorize('admin', 'customer-service'), createJob);
router.get('/jobs', authenticate, authorize('admin', 'driver', 'warehouse'), getJobs);
router.delete('/jobs/:id', authenticate, authorize('admin'), deleteJob);

// Permission-based protection
router.get('/reports/financial', authenticate, requirePermission('financial:view'), getFinancialReports);
router.post('/users', authenticate, requirePermission('users:create'), createUser);

// Combined with ownership checks in controller
router.get('/jobs/:id', authenticate, authorize('admin', 'driver', 'delivery-agent'), getJobById);
// In controller:
// if (user.role === 'driver' && job.assignedDriverId !== user.id) {
//   return sendError(res, 403, 'Access denied');
// }
```

### 4. Controller-Level Data Filtering

```javascript
/**
 * Get all jobs (filtered by role)
 */
exports.getAllJobs = asyncHandler(async (req, res) => {
  const { role, id } = req.user;

  let where = {};

  // Filter by role
  switch (role) {
    case 'driver':
      // Drivers only see jobs assigned to them
      where.assignedDriverId = id;
      break;
    
    case 'delivery-agent':
      // Delivery agents only see jobs assigned to them
      where.assignedDeliveryAgentId = id;
      break;
    
    case 'warehouse':
      // Warehouse users see all jobs (no filter)
      break;
    
    case 'admin':
    case 'superadmin':
      // Admins see all jobs (no filter)
      break;
    
    default:
      // Other roles see no jobs
      where.id = 'impossible-id'; // Return empty result
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      customer: true,
      assignedDriver: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return sendSuccess(res, 200, 'Jobs retrieved successfully', { jobs });
});
```

### 5. Ownership Validation in Controllers

```javascript
/**
 * Update job status (with ownership check)
 */
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { role, id: userId } = req.user;

  // Find job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  // Ownership check for non-admin roles
  if (role === 'driver' && job.assignedDriverId !== userId) {
    return sendError(res, 403, 'Access denied. You can only update your assigned jobs.');
  }

  if (role === 'delivery-agent' && job.assignedDeliveryAgentId !== userId) {
    return sendError(res, 403, 'Access denied. You can only update your assigned deliveries.');
  }

  // Update job
  const updatedJob = await prisma.job.update({
    where: { id },
    data: { status },
  });

  return sendSuccess(res, 200, 'Job status updated', { job: updatedJob });
});
```

---

## Frontend Implementation

### 1. Permission Utility (`frontend/src/utils/permissions.js`)

```javascript
/**
 * Check if user has permission for a specific action
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  // Superadmin has all permissions
  if (user.role === 'superadmin') return true;

  const rolePermissions = {
    admin: [
      'users:view', 'users:create', 'users:update', 'users:delete',
      'jobs:view_all', 'jobs:create', 'jobs:update', 'jobs:delete',
      'customers:view', 'customers:create', 'customers:update',
      'batches:view', 'batches:create', 'batches:update',
      'invoices:view', 'invoices:create', 'invoices:update',
      'reports:view_all',
      'financial:view',
    ],
    driver: [
      'jobs:view_own',
      'jobs:update_status',
      'customers:view',
      'upload-documents',
      'reports:view_own',
    ],
    finance: [
      'invoices:view', 'invoices:create', 'invoices:update',
      'jobs:view_all',
      'customers:view',
      'reports:view_all', 'reports:financial',
      'financial:view',
    ],
    // ... more roles
  };

  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = (user, ...roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

/**
 * Get dashboard route based on user role
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) return '/login';

  // Handle location-based routing for warehouse users
  if (user.role === 'warehouse' && user.warehouseLocation === 'Ghana Warehouse') {
    return '/ghana-warehouse';
  }

  const dashboardRoutes = {
    superadmin: '/dashboard',
    admin: '/dashboard',
    driver: '/driver-dashboard',
    warehouse: '/warehouse-dashboard',
    'delivery-agent': '/delivery-agent-dashboard',
    'customer-service': '/dashboard',
    finance: '/dashboard',
  };

  return dashboardRoutes[user.role] || '/dashboard';
};
```

### 2. Route Protection (`frontend/src/App.js`)

```javascript
import { hasRole, getDashboardRoute } from './utils/permissions';

function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tracking/:trackingId" element={<PublicTrackingPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute />}>
        {/* Role-based dashboard routing */}
        <Route index element={<Navigate to={getDashboardRoute(currentUser)} replace />} />
        
        {/* Admin/General Dashboard */}
        {hasRole(currentUser, 'superadmin', 'admin', 'customer-service', 'finance') && (
          <Route path="/dashboard" element={<DashboardPage />} />
        )}

        {/* Role-specific dashboards */}
        {hasRole(currentUser, 'driver') && (
          <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
        )}
        
        {hasRole(currentUser, 'warehouse') && (
          <>
            <Route path="/warehouse-dashboard" element={<WarehouseDashboardPage />} />
            {currentUser?.warehouseLocation === 'Ghana Warehouse' && (
              <Route path="/ghana-warehouse" element={<GhanaWarehouseDashboardPage />} />
            )}
          </>
        )}
        
        {hasRole(currentUser, 'delivery-agent') && (
          <Route path="/delivery-agent-dashboard" element={<DeliveryAgentDashboardPage />} />
        )}

        {/* Feature pages with role checks */}
        {hasRole(currentUser, 'superadmin', 'admin', 'customer-service', 'warehouse') && (
          <Route path="/jobs" element={<JobsPage />} />
        )}
        
        {hasRole(currentUser, 'superadmin', 'admin', 'warehouse') && (
          <Route path="/batches" element={<BatchManagementPage />} />
        )}
        
        {hasRole(currentUser, 'superadmin', 'admin', 'finance') && (
          <Route path="/invoices" element={<InvoiceManagementPage />} />
        )}
      </Route>
    </Routes>
  );
}
```

### 3. Component-Level Permission Checks

```javascript
import { hasPermission } from '../utils/permissions';

function JobsPage() {
  const { currentUser } = useAuth();
  const canCreateJobs = hasPermission(currentUser, 'jobs:create');
  const canViewFinancial = hasPermission(currentUser, 'financial:view');

  return (
    <div>
      {canCreateJobs && (
        <Button onClick={handleCreateJob}>Create New Job</Button>
      )}

      <Table
        columns={columns}
        dataSource={jobs}
      />

      {canViewFinancial && (
        <Statistic title="Total Revenue" value={totalRevenue} />
      )}
    </div>
  );
}
```

### 4. Sidebar Menu Filtering (`frontend/src/components/layout/Sidebar.jsx`)

```javascript
import { getSidebarMenuItems } from '../../utils/permissions';

function Sidebar() {
  const { currentUser } = useAuth();

  const menuItems = useMemo(() => {
    const allMenuItems = [
      {
        key: 'dashboard',
        icon: 'DashboardOutlined',
        label: 'Dashboard',
        path: '/dashboard',
        roles: ['superadmin', 'admin', 'customer-service', 'finance'],
      },
      {
        key: 'driver-dashboard',
        icon: 'CarOutlined',
        label: 'My Jobs',
        path: '/driver-dashboard',
        roles: ['driver'],
      },
      {
        key: 'jobs',
        icon: 'FileTextOutlined',
        label: 'Jobs',
        path: '/jobs',
        roles: ['superadmin', 'admin', 'customer-service', 'warehouse'],
      },
      {
        key: 'batches',
        icon: 'InboxOutlined',
        label: 'Batches',
        path: '/batches',
        roles: ['superadmin', 'admin', 'warehouse'],
      },
      {
        key: 'invoices',
        icon: 'DollarOutlined',
        label: 'Invoices',
        path: '/invoices',
        roles: ['superadmin', 'admin', 'finance'],
      },
      // ... more items
    ];

    // Filter menu items based on user role
    return allMenuItems.filter(item => {
      // Handle location-based visibility
      if (item.key === 'warehouse-dashboard' && currentUser?.warehouseLocation) {
        return currentUser.warehouseLocation === 'Ghana Warehouse';
      }
      
      return item.roles.includes(currentUser?.role);
    });
  }, [currentUser]);

  return (
    <Menu items={menuItems} />
  );
}
```

---

## Role-Based Dashboards

### Strategy

Each role has a dedicated dashboard that shows:
- Relevant statistics
- Role-specific data
- Appropriate actions

### Implementation Example

#### 1. Admin Dashboard (`frontend/src/pages/DashboardPage.jsx`)

```javascript
function DashboardPage() {
  const { currentUser } = useAuth();

  // Redirect warehouse users to their specific dashboard
  useEffect(() => {
    if (currentUser?.role === 'warehouse') {
      if (currentUser.warehouseLocation === 'Ghana Warehouse') {
        navigate('/ghana-warehouse', { replace: true });
      } else {
        navigate('/warehouse-dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  // Admin dashboard shows all statistics
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="Total Jobs" value={stats.totalJobs} />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="Active Jobs" value={stats.activeJobs} />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="Total Customers" value={stats.totalCustomers} />
        </Col>
        {hasPermission(currentUser, 'financial:view') && (
          <Col xs={12} sm={12} md={6}>
            <Statistic title="Revenue This Month" value={stats.revenue} />
          </Col>
        )}
      </Row>
      {/* More admin-specific content */}
    </div>
  );
}
```

#### 2. Driver Dashboard (`frontend/src/pages/DriverDashboardPage.jsx`)

```javascript
function DriverDashboardPage() {
  const { currentUser } = useAuth();

  // Fetch only assigned jobs
  useEffect(() => {
    fetchAssignedJobs(currentUser.id);
  }, [currentUser]);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="My Jobs" value={myJobs.length} />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="Pending Collection" value={pendingJobs.length} />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="In Transit" value={inTransitJobs.length} />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Statistic title="Completed Today" value={completedToday.length} />
        </Col>
      </Row>
      {/* Driver-specific job list */}
    </div>
  );
}
```

#### 3. Warehouse Dashboard with Location-Based Access

```javascript
function WarehouseDashboardPage() {
  const { currentUser } = useAuth();

  // Redirect if user has specific warehouse location
  useEffect(() => {
    if (currentUser?.role === 'warehouse' && currentUser?.warehouseLocation === 'Ghana Warehouse') {
      navigate('/ghana-warehouse', { replace: true });
    }
  }, [currentUser, navigate]);

  // General warehouse dashboard
  return (
    <div>
      <Title>Warehouse Dashboard</Title>
      {/* General warehouse content */}
    </div>
  );
}

function GhanaWarehouseDashboardPage() {
  // Ghana-specific warehouse dashboard
  return (
    <div>
      <Title>Ghana Warehouse Dashboard</Title>
      {/* Ghana warehouse-specific content */}
    </div>
  );
}
```

---

## Permission Checks

### Backend Permission Check Flow

```javascript
// 1. Route-level permission check
router.get('/reports/financial', 
  authenticate,                    // Step 1: Verify token
  requirePermission('financial:view'), // Step 2: Check permission
  getFinancialReports              // Step 3: Execute controller
);

// 2. Controller-level ownership check
exports.getFinancialReports = asyncHandler(async (req, res) => {
  // Superadmin and admin see all
  // Finance sees all
  // Others see nothing
  
  let where = {};
  
  if (req.user.role !== 'superadmin' && 
      req.user.role !== 'admin' && 
      req.user.role !== 'finance') {
    where.id = 'impossible-id'; // Return empty
  }

  const reports = await prisma.invoice.findMany({ where });
  
  return sendSuccess(res, 200, 'Financial reports retrieved', { reports });
});
```

### Frontend Permission Check Flow

```javascript
// 1. Route protection (in App.js)
{hasRole(currentUser, 'superadmin', 'admin', 'finance') && (
  <Route path="/reports/financial" element={<FinancialReportsPage />} />
)}

// 2. Component-level checks
function FinancialReportsPage() {
  const { currentUser } = useAuth();
  const canViewFinancial = hasPermission(currentUser, 'financial:view');

  if (!canViewFinancial) {
    return <Navigate to="/dashboard" replace />;
  }

  // Component content
}

// 3. UI element checks
function ReportsPage() {
  const { currentUser } = useAuth();
  const canViewFinancial = hasPermission(currentUser, 'financial:view');

  return (
    <div>
      {canViewFinancial && (
        <Card>
          <Statistic title="Revenue This Month" value={revenue} />
        </Card>
      )}
    </div>
  );
}
```

---

## Integration with Swagger

### Swagger Route Documentation

```javascript
/**
 * @swagger
 * /api/auth/create-superadmin:
 *   post:
 *     summary: Create first superadmin (One-time setup)
 *     description: |
 *       Creates the first superadmin account. This endpoint:
 *       1. Auto-seeds all roles and permissions if they don't exist
 *       2. Auto-seeds system settings if they don't exist
 *       3. Creates the superadmin user
 *       4. Returns JWT tokens for immediate login
 *       
 *       **This endpoint only works if no admin/superadmin exists.**
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@bestdeal.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePassword123!
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: System Administrator
 *     responses:
 *       201:
 *         description: Superadmin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     seedInfo:
 *                       type: object
 *                       description: Information about auto-seeded roles and settings
 *       403:
 *         description: Admin already exists
 */
```

### Swagger Setup (`backend/src/config/swagger.js`)

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Best Deal API',
      version: '1.0.0',
      description: 'Complete API documentation with RBAC endpoints',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUi };
```

---

## Testing Strategy

### Backend Tests

```javascript
describe('RBAC Tests', () => {
  let adminToken;
  let driverToken;
  let financeToken;

  beforeAll(async () => {
    // Create test users with different roles
    adminToken = await createTestUser('admin');
    driverToken = await createTestUser('driver');
    financeToken = await createTestUser('finance');
  });

  test('Driver can only see assigned jobs', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${driverToken}`);
    
    expect(response.status).toBe(200);
    // Verify all jobs have assignedDriverId matching driver
    response.body.data.jobs.forEach(job => {
      expect(job.assignedDriverId).toBe(driverId);
    });
  });

  test('Driver cannot create jobs', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(jobData);
    
    expect(response.status).toBe(403);
  });

  test('Finance can view financial reports', async () => {
    const response = await request(app)
      .get('/api/reports/financial')
      .set('Authorization', `Bearer ${financeToken}`);
    
    expect(response.status).toBe(200);
  });

  test('Driver cannot view financial reports', async () => {
    const response = await request(app)
      .get('/api/reports/financial')
      .set('Authorization', `Bearer ${driverToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

---

## Best Practices

### 1. Security Principles

- **Principle of Least Privilege**: Users get minimum permissions needed
- **Defense in Depth**: Check permissions at multiple levels (route, controller, UI)
- **Fail Secure**: Default to denying access if permission check fails
- **Never Trust Client**: Always verify permissions on backend

### 2. Permission Naming

- Use consistent format: `resource:action` or `resource:action_scope`
- Examples:
  - `users:create`
  - `jobs:view_all`
  - `jobs:view_own`
  - `financial:view`

### 3. Role Design

- **Keep roles simple**: Don't create too many roles
- **Use permissions for granularity**: Use permissions for specific actions
- **System roles**: Mark system roles with `isSystem: true` to prevent deletion

### 4. Performance

- **Cache role permissions**: Consider caching role permissions in Redis
- **Index database fields**: Index `user.role` and `role.name`
- **Efficient queries**: Use database indexes for role-based filtering

### 5. Maintainability

- **Centralize permission definitions**: Keep all permissions in one place
- **Document permissions**: Document what each permission allows
- **Version control**: Track permission changes in version control

---

## Quick Reference

### Permission Check Patterns

```javascript
// Backend - Route level
router.get('/resource', authenticate, authorize('admin', 'finance'), getResource);
router.post('/resource', authenticate, requirePermission('resource:create'), createResource);

// Backend - Controller level
if (req.user.role === 'driver' && resource.assignedDriverId !== req.user.id) {
  return sendError(res, 403, 'Access denied');
}

// Frontend - Route protection
{hasRole(currentUser, 'admin', 'finance') && (
  <Route path="/resource" element={<ResourcePage />} />
)}

// Frontend - Component level
{hasPermission(currentUser, 'financial:view') && (
  <Statistic title="Revenue" value={revenue} />
)}
```

### Common Permission Patterns

```javascript
// View all vs view own
'jobs:view_all'      // Admin, warehouse
'jobs:view_own'      // Driver, delivery-agent

// Financial data
'financial:view'     // Admin, finance

// Location-based
warehouseLocation: 'Ghana Warehouse'  // Warehouse with specific location
```

---

**Last Updated**: 2024  
**Version**: 1.0.0

This guide provides a complete, production-ready RBAC implementation that can be adapted to any Node.js/React application.

