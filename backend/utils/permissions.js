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
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    // ❌ REMOVED: CUSTOMER_CREATE, CUSTOMER_EDIT, CUSTOMER_DELETE
    
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
    
    // Accounting & Finance - IT Consultant can record expenses directly
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,        // Record expenses directly (no approval needed)
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.EXPENSE_EDIT,
    PERMISSIONS.EXPENSE_DELETE,
    
    PERMISSIONS.PAYOUT_VIEW,
    PERMISSIONS.PAYOUT_CREATE,
    PERMISSIONS.PAYOUT_UPDATE,
    PERMISSIONS.PAYOUT_DELETE,
    
    PERMISSIONS.CASHFLOW_VIEW,
    PERMISSIONS.CASHFLOW_CREATE,
    
  ],
  
  ENQUIRY_OFFICER: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,          // ✅ General reports access
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  RELEASE_OFFICER: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,          // ✅ General reports access
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  REVIEW_OFFICER: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,          // ✅ General reports access
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  INVOICE_OFFICER: [
    // FINANCE ROLE - Can create invoices and view finance reports
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ INVOICE_OFFICER can create invoices
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_VIEW,
    // ✅ Finance reports access (same as general reports for now)
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Finance Officer - can view expenses and manage payouts
    PERMISSIONS.EXPENSE_VIEW,
    // ❌ REMOVED: EXPENSE_APPROVE (only ACCOUNTANT can approve)
    PERMISSIONS.PAYOUT_VIEW,
    PERMISSIONS.PAYOUT_CREATE,
    PERMISSIONS.PAYOUT_UPDATE,
    PERMISSIONS.CASHFLOW_VIEW,
  ],
  
  CLEARING_OFFICER: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,          // ✅ General reports access
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  STAFF: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_VIEW,
    
    PERMISSIONS.SETTINGS_VIEW,
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  DRIVER: [
    // EMPLOYEE - Can CREATE jobs, customers, invoices, requests
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,        // ✅ EMPLOYEES can create invoices
    PERMISSIONS.INVOICE_VIEW_ALL,
    
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW,          // ✅ General reports access
    
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,           // ✅ Can delete files
    
    PERMISSIONS.NOTIFICATION_VIEW,
    
    // Can request expenses (requires approval)
    PERMISSIONS.EXPENSE_REQUEST,
    PERMISSIONS.EXPENSE_VIEW,
  ],
  
  ACCOUNTANT: [
    // ACCOUNTANT - ONLY role that can record and approve expenses
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_VIEW_ALL,
    
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_VIEW_ALL,
    
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
