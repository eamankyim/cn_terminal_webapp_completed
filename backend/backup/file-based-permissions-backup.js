// BACKUP: File-based permissions system
// This file contains the original file-based permissions system
// Use this to restore permissions when database is cleared

const PERMISSIONS = {
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',
  
  // Job Management
  JOB_VIEW: 'job:view',
  JOB_CREATE: 'job:create',
  JOB_EDIT: 'job:edit',
  JOB_DELETE: 'job:delete',
  JOB_ASSIGN: 'job:assign',
  JOB_UPDATE_STATUS: 'job:update_status',
  JOB_VIEW_ALL: 'job:view_all',
  
  // Invoice Management
  INVOICE_VIEW: 'invoice:view',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_EDIT: 'invoice:edit',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_APPROVE: 'invoice:approve',
  INVOICE_VIEW_ALL: 'invoice:view_all',
  
  // Customer Management
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_EDIT: 'customer:edit',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_VIEW_ALL: 'customer:view_all',
  
  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Settings & Configuration
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SYSTEM_CONFIG: 'system:config',
  
  // File Management
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  FILE_DELETE: 'file:delete',
  
  // Notifications
  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_SEND: 'notification:send',
  
  // Driver specific permissions
  DRIVER_JOBS_VIEW: 'driver:jobs_view',
  DRIVER_JOBS_UPDATE: 'driver:jobs_update',
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  
  // Warehouse specific permissions
  WAREHOUSE_JOBS_VIEW: 'warehouse:jobs_view',
  WAREHOUSE_JOBS_UPDATE: 'warehouse:jobs_update',
  WAREHOUSE_INVENTORY: 'warehouse:inventory',
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  ADMIN: [
    // Full access to everything
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_DELETE,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_DELETE,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SYSTEM_CONFIG,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
    
    PERMISSIONS.DRIVER_JOBS_VIEW,
    PERMISSIONS.DRIVER_JOBS_UPDATE,
    PERMISSIONS.DRIVER_LOCATION_UPDATE,
    
    PERMISSIONS.WAREHOUSE_JOBS_VIEW,
    PERMISSIONS.WAREHOUSE_JOBS_UPDATE,
    PERMISSIONS.WAREHOUSE_INVENTORY,
  ],
  
  IT_CONSULTANT: [
    // Same as ADMIN - full access to everything
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_DELETE,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_DELETE,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SYSTEM_CONFIG,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
    
    PERMISSIONS.DRIVER_JOBS_VIEW,
    PERMISSIONS.DRIVER_JOBS_UPDATE,
    PERMISSIONS.DRIVER_LOCATION_UPDATE,
    
    PERMISSIONS.WAREHOUSE_JOBS_VIEW,
    PERMISSIONS.WAREHOUSE_JOBS_UPDATE,
    PERMISSIONS.WAREHOUSE_INVENTORY,
  ],
  
  ENQUIRY_OFFICER: [
    // Creates jobs and manages customer enquiries
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  RELEASE_OFFICER: [
    // Updates jobs to released status, only sees assigned jobs
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_UPDATE_STATUS,
    
    PERMISSIONS.CUSTOMER_VIEW,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  REVIEW_OFFICER: [
    // Reviews and preinvoices jobs
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  INVOICE_OFFICER: [
    // Creates and manages invoices
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  CLEARING_OFFICER: [
    // Sets jobs to cleared status
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  STAFF: [
    // Staff can manage jobs, customers, and invoices but not users
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.SETTINGS_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  
  DRIVER: [
    // Drivers can only view and update their assigned jobs
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_UPDATE_STATUS,
    
    PERMISSIONS.CUSTOMER_VIEW,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Driver specific permissions
    PERMISSIONS.DRIVER_JOBS_VIEW,
    PERMISSIONS.DRIVER_JOBS_UPDATE,
    PERMISSIONS.DRIVER_LOCATION_UPDATE,
  ],
  
  WAREHOUSE: [
    // Warehouse staff can manage inventory and update job statuses
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_UPDATE_STATUS,
    
    PERMISSIONS.CUSTOMER_VIEW,
    
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Warehouse specific permissions
    PERMISSIONS.WAREHOUSE_JOBS_VIEW,
    PERMISSIONS.WAREHOUSE_JOBS_UPDATE,
    PERMISSIONS.WAREHOUSE_INVENTORY,
  ],
};

// Role information mapping
const ROLE_INFO = {
  ADMIN: {
    displayName: 'Administrator',
    description: 'Full system access including user management and system configuration',
    isSystem: true
  },
  IT_CONSULTANT: {
    displayName: 'IT Consultant',
    description: 'Full system access including user management and system configuration',
    isSystem: true
  },
  ENQUIRY_OFFICER: {
    displayName: 'Enquiry Officer',
    description: 'Creates jobs and manages customer enquiries',
    isSystem: true
  },
  RELEASE_OFFICER: {
    displayName: 'Release Officer',
    description: 'Updates jobs to released status, only sees assigned jobs',
    isSystem: true
  },
  REVIEW_OFFICER: {
    displayName: 'Review Officer',
    description: 'Reviews and preinvoices jobs',
    isSystem: true
  },
  INVOICE_OFFICER: {
    displayName: 'Invoice Officer',
    description: 'Creates and manages invoices',
    isSystem: true
  },
  CLEARING_OFFICER: {
    displayName: 'Clearing Officer',
    description: 'Sets jobs to cleared status',
    isSystem: true
  },
  STAFF: {
    displayName: 'Staff',
    description: 'General staff member with standard permissions',
    isSystem: true
  },
  DRIVER: {
    displayName: 'Driver',
    description: 'Driver with limited job access',
    isSystem: true
  },
  WAREHOUSE: {
    displayName: 'Warehouse Staff',
    description: 'Warehouse staff with inventory management',
    isSystem: true
  }
};

// Check if user has specific permission
const hasPermission = (userRole, requiredPermission) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(requiredPermission);
};

// Check if user has any of the required permissions
const hasAnyPermission = (userRole, requiredPermissions) => {
  if (!Array.isArray(requiredPermissions)) {
    return hasPermission(userRole, requiredPermissions);
  }
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all required permissions
const hasAllPermissions = (userRole, requiredPermissions) => {
  if (!Array.isArray(requiredPermissions)) {
    return hasPermission(userRole, requiredPermissions);
  }
  return requiredPermissions.every(permission => hasPermission(userRole, permission));
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_INFO,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};




