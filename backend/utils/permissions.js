// Backend permissions system matching frontend permissions
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
  
  // Estimate Management
  ESTIMATE_VIEW: 'estimate:view',
  ESTIMATE_CREATE: 'estimate:create',
  ESTIMATE_EDIT: 'estimate:edit',
  ESTIMATE_DELETE: 'estimate:delete',
  ESTIMATE_SEND: 'estimate:send',
  ESTIMATE_VIEW_ALL: 'estimate:view_all',
  
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
  
  // Accounting & Finance
  EXPENSE_VIEW: 'expense:view',
  EXPENSE_CREATE: 'expense:create',        // For recording expenses directly (admins/accountants)
  EXPENSE_REQUEST: 'expense:request',      // For requesting expenses (employees)
  EXPENSE_APPROVE: 'expense:approve',
  EXPENSE_EDIT: 'expense:edit',
  EXPENSE_DELETE: 'expense:delete',
  
  PAYOUT_VIEW: 'payout:view',
  PAYOUT_CREATE: 'payout:create',
  PAYOUT_UPDATE: 'payout:update',
  PAYOUT_DELETE: 'payout:delete',
  
  CASHFLOW_VIEW: 'cashflow:view',
  CASHFLOW_CREATE: 'cashflow:create',

};

// Common permissions for all roles except ADMIN and ACCOUNTANT
const COMMON_EMPLOYEE_PERMISSIONS = [
  // User Management - View only (for assignment purposes)
  PERMISSIONS.USER_VIEW,
  
  // Job Management - Full access
  PERMISSIONS.JOB_VIEW,
  PERMISSIONS.JOB_CREATE,
  PERMISSIONS.JOB_EDIT,
  PERMISSIONS.JOB_DELETE,
  PERMISSIONS.JOB_ASSIGN,
  PERMISSIONS.JOB_UPDATE_STATUS,
  PERMISSIONS.JOB_VIEW_ALL,
  
  // Invoice Management - Full access
  PERMISSIONS.INVOICE_VIEW,
  PERMISSIONS.INVOICE_CREATE,
  PERMISSIONS.INVOICE_EDIT,
  PERMISSIONS.INVOICE_DELETE,
  PERMISSIONS.INVOICE_APPROVE,
  PERMISSIONS.INVOICE_VIEW_ALL,
  
  // Estimate Management - Full access
  PERMISSIONS.ESTIMATE_VIEW,
  PERMISSIONS.ESTIMATE_CREATE,
  PERMISSIONS.ESTIMATE_EDIT,
  PERMISSIONS.ESTIMATE_DELETE,
  PERMISSIONS.ESTIMATE_SEND,
  PERMISSIONS.ESTIMATE_VIEW_ALL,
  
  // Customer Management - Full access
  PERMISSIONS.CUSTOMER_VIEW,
  PERMISSIONS.CUSTOMER_CREATE,
  PERMISSIONS.CUSTOMER_EDIT,
  PERMISSIONS.CUSTOMER_DELETE,
  PERMISSIONS.CUSTOMER_VIEW_ALL,
  
  // Reports & Analytics
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.REPORTS_EXPORT,
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.DASHBOARD_VIEW,
  
  // Settings - View only
  PERMISSIONS.SETTINGS_VIEW,
  
  // File Management - Full access
  PERMISSIONS.FILE_UPLOAD,
  PERMISSIONS.FILE_DOWNLOAD,
  PERMISSIONS.FILE_DELETE,
  
  // Notifications
  PERMISSIONS.NOTIFICATION_VIEW,
  PERMISSIONS.NOTIFICATION_SEND,
  
  // Expenses - Can request and view, but not approve/create/edit/delete
  PERMISSIONS.EXPENSE_REQUEST,
  PERMISSIONS.EXPENSE_VIEW,
];

// Role permissions mapping
const ROLE_PERMISSIONS = {
  ADMIN: [
    // VIEW-ONLY ACCESS (cannot create/edit)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_MANAGE_ROLES,        // Can change user roles
    
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_VIEW_ALL,
    // ❌ REMOVED: JOB_CREATE, JOB_EDIT, JOB_DELETE, JOB_ASSIGN, JOB_UPDATE_STATUS
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_VIEW_ALL,
    // ❌ REMOVED: INVOICE_CREATE, INVOICE_EDIT, INVOICE_DELETE, INVOICE_APPROVE
    
    PERMISSIONS.ESTIMATE_VIEW,
    PERMISSIONS.ESTIMATE_VIEW_ALL,
    // ❌ REMOVED: ESTIMATE_CREATE, ESTIMATE_EDIT, ESTIMATE_DELETE, ESTIMATE_SEND
    
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
    
    // Accounting & Finance - VIEW ONLY
    PERMISSIONS.EXPENSE_VIEW,
    // ❌ REMOVED: EXPENSE_CREATE, EXPENSE_APPROVE, EXPENSE_EDIT, EXPENSE_DELETE
    
    PERMISSIONS.PAYOUT_VIEW,
    PERMISSIONS.CASHFLOW_VIEW,
    // ❌ REMOVED: PAYOUT_CREATE, PAYOUT_UPDATE, PAYOUT_DELETE, CASHFLOW_CREATE
    
  ],
  
  // All roles except ADMIN and ACCOUNTANT share the same permissions
  IT_CONSULTANT: COMMON_EMPLOYEE_PERMISSIONS,
  ENQUIRY_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  ENTRY_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  TRANSPORT_COORDINATOR: COMMON_EMPLOYEE_PERMISSIONS,
  RELEASE_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  PREINVOICE_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  REVIEW_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  VETTING_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  CLEARING_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  STAFF: COMMON_EMPLOYEE_PERMISSIONS,
  DRIVER: COMMON_EMPLOYEE_PERMISSIONS,
  
  ACCOUNTANT: [
    // ACCOUNTANT - ONLY role that can record and approve expenses
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.ESTIMATE_VIEW,
    PERMISSIONS.ESTIMATE_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // ✅ ONLY ACCOUNTANT can record and approve expenses
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,        // Record expenses directly (no approval needed)
    PERMISSIONS.EXPENSE_APPROVE,       // Approve expense requests
    PERMISSIONS.EXPENSE_EDIT,
    PERMISSIONS.EXPENSE_DELETE,
    
    PERMISSIONS.PAYOUT_VIEW,
    PERMISSIONS.PAYOUT_CREATE,
    PERMISSIONS.PAYOUT_UPDATE,
    PERMISSIONS.PAYOUT_DELETE,
    
    PERMISSIONS.CASHFLOW_VIEW,
    PERMISSIONS.CASHFLOW_CREATE,
  ],
  
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
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
