// UI-based permissions system
// Permissions are defined based on actual UI elements (sidebar items, tabs, etc.)

export const UI_PERMISSIONS = {
  // Sidebar Navigation Items
  DASHBOARD: 'ui:dashboard',
  JOBS: 'ui:jobs', 
  CLIENTS: 'ui:clients',
  INVOICES: 'ui:invoices',
  ESTIMATES: 'ui:estimates',
  ACCOUNTING: 'ui:accounting',
  REQUESTS: 'ui:requests',
  REPORTS: 'ui:reports',
  SETTINGS: 'ui:settings',
  CONFIGURATION: 'ui:configuration',
  
  // Settings Page Tabs
  PROFILE_SETTINGS: 'ui:profile_settings',
  ROLES_PERMISSIONS: 'ui:roles_permissions',
  INVITE_USERS: 'ui:invite_users',
  TEAM_MEMBERS: 'ui:team_members',
  SYSTEM_PREFERENCES: 'ui:system_preferences',
  SECURITY_SETTINGS: 'ui:security_settings',
  // WHATSAPP_WEB: 'ui:whatsapp_web',
  API_INTEGRATION_TEST: 'ui:api_integration_test',
  
  // Job Management Actions
  CREATE_JOB: 'ui:create_job',
  EDIT_JOB: 'ui:edit_job',
  DELETE_JOB: 'ui:delete_job',
  ASSIGN_JOB: 'ui:assign_job',
  UPDATE_JOB_STATUS: 'ui:update_job_status',
  VIEW_ALL_JOBS: 'ui:view_all_jobs',
  
  // Customer Management Actions
  CREATE_CUSTOMER: 'ui:create_customer',
  EDIT_CUSTOMER: 'ui:edit_customer',
  DELETE_CUSTOMER: 'ui:delete_customer',
  VIEW_ALL_CUSTOMERS: 'ui:view_all_customers',
  
  // Invoice Management Actions
  CREATE_INVOICE: 'ui:create_invoice',
  EDIT_INVOICE: 'ui:edit_invoice',
  DELETE_INVOICE: 'ui:delete_invoice',
  APPROVE_INVOICE: 'ui:approve_invoice',
  VIEW_ALL_INVOICES: 'ui:view_all_invoices',
  
  // Estimate Management Actions
  CREATE_ESTIMATE: 'ui:create_estimate',
  EDIT_ESTIMATE: 'ui:edit_estimate',
  DELETE_ESTIMATE: 'ui:delete_estimate',
  SEND_ESTIMATE: 'ui:send_estimate',
  VIEW_ALL_ESTIMATES: 'ui:view_all_estimates',
  
  // Accounting Actions
  CREATE_EXPENSE: 'ui:create_expense',
  APPROVE_EXPENSE: 'ui:approve_expense',
  EDIT_EXPENSE: 'ui:edit_expense',
  DELETE_EXPENSE: 'ui:delete_expense',
  CREATE_PAYOUT: 'ui:create_payout',
  EDIT_PAYOUT: 'ui:edit_payout',
  DELETE_PAYOUT: 'ui:delete_payout',
  VIEW_CASHFLOW: 'ui:view_cashflow',
  CREATE_CASHFLOW: 'ui:create_cashflow',
  
  // Reports Actions
  VIEW_REPORTS: 'ui:view_reports',
  EXPORT_REPORTS: 'ui:export_reports',
  VIEW_ANALYTICS: 'ui:view_analytics',
  
  // User Management Actions
  CREATE_USER: 'ui:create_user',
  EDIT_USER: 'ui:edit_user',
  DELETE_USER: 'ui:delete_user',
  MANAGE_ROLES: 'ui:manage_roles',
  INVITE_USER: 'ui:invite_user',
  
  // System Actions
  UPLOAD_FILE: 'ui:upload_file',
  DOWNLOAD_FILE: 'ui:download_file',
  DELETE_FILE: 'ui:delete_file',
  SEND_NOTIFICATION: 'ui:send_notification',
  VIEW_NOTIFICATIONS: 'ui:view_notifications',
  EDIT_SYSTEM_SETTINGS: 'ui:edit_system_settings',
  CONFIGURE_SYSTEM: 'ui:configure_system'
};

// Role-based UI permissions mapping
// ALL ROLES NOW HAVE ALL PERMISSIONS BY DEFAULT
// This allows granular control through the UI checkboxes
export const ROLE_UI_PERMISSIONS = {
  ADMIN: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  IT_CONSULTANT: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  ENQUIRY_OFFICER: [
    // NO REVENUE ACCESS - Only Jobs, Clients, Requests, Settings, Job Reports
    UI_PERMISSIONS.DASHBOARD,
    UI_PERMISSIONS.JOBS,
    UI_PERMISSIONS.CLIENTS,
    UI_PERMISSIONS.REQUESTS,
    UI_PERMISSIONS.SETTINGS,
    UI_PERMISSIONS.REPORTS,            // ✅ Can see job reports (revenue hidden in UI)
    
    // Job Management
    UI_PERMISSIONS.CREATE_JOB,
    UI_PERMISSIONS.EDIT_JOB,
    UI_PERMISSIONS.UPDATE_JOB_STATUS,
    UI_PERMISSIONS.VIEW_ALL_JOBS,
    
    // Customer Management
    UI_PERMISSIONS.CREATE_CUSTOMER,
    UI_PERMISSIONS.EDIT_CUSTOMER,
    UI_PERMISSIONS.VIEW_ALL_CUSTOMERS,
    
    // Reports (Job-related only, no revenue)
    UI_PERMISSIONS.VIEW_REPORTS,
    UI_PERMISSIONS.VIEW_ANALYTICS,
    
    // Settings Access
    UI_PERMISSIONS.PROFILE_SETTINGS,
    UI_PERMISSIONS.TEAM_MEMBERS,       // ✅ Can view team members (read-only)
    
    // File Management
    UI_PERMISSIONS.UPLOAD_FILE,
    UI_PERMISSIONS.DOWNLOAD_FILE,
    UI_PERMISSIONS.DELETE_FILE,
    
    // Notifications
    UI_PERMISSIONS.VIEW_NOTIFICATIONS,
    
    // NO INVOICE ACCESS
    // NO ACCOUNTING ACCESS
    // NO EXPORT_REPORTS (to prevent downloading revenue data)
  ],
  
  ENTRY_OFFICER: [
    // NO REVENUE ACCESS - Updates jobs to ENTRY status
    UI_PERMISSIONS.DASHBOARD,
    UI_PERMISSIONS.JOBS,
    UI_PERMISSIONS.CLIENTS,
    UI_PERMISSIONS.REQUESTS,
    UI_PERMISSIONS.SETTINGS,
    UI_PERMISSIONS.REPORTS,
    
    // Job Management
    UI_PERMISSIONS.EDIT_JOB,
    UI_PERMISSIONS.UPDATE_JOB_STATUS,
    UI_PERMISSIONS.VIEW_ALL_JOBS,
    
    // Customer Management
    UI_PERMISSIONS.CREATE_CUSTOMER,
    UI_PERMISSIONS.EDIT_CUSTOMER,
    UI_PERMISSIONS.VIEW_ALL_CUSTOMERS,
    
    // Reports
    UI_PERMISSIONS.VIEW_REPORTS,
    UI_PERMISSIONS.VIEW_ANALYTICS,
    
    // Settings
    UI_PERMISSIONS.PROFILE_SETTINGS,
    UI_PERMISSIONS.TEAM_MEMBERS,
    
    // File Management
    UI_PERMISSIONS.UPLOAD_FILE,
    UI_PERMISSIONS.DOWNLOAD_FILE,
    
    // Notifications
    UI_PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  
  RELEASE_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  PREINVOICE_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],

  INVOICE_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],

  SUPERVISOR: [
    UI_PERMISSIONS.JOBS,
    UI_PERMISSIONS.CLIENTS,
    UI_PERMISSIONS.SETTINGS,
    UI_PERMISSIONS.EDIT_JOB,
    UI_PERMISSIONS.ASSIGN_JOB,
    UI_PERMISSIONS.VIEW_ALL_JOBS,
    UI_PERMISSIONS.VIEW_ALL_CUSTOMERS,
    UI_PERMISSIONS.PROFILE_SETTINGS,
    UI_PERMISSIONS.TEAM_MEMBERS,
    UI_PERMISSIONS.UPLOAD_FILE,
    UI_PERMISSIONS.DOWNLOAD_FILE,
    UI_PERMISSIONS.DELETE_FILE,
    UI_PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  
  REVIEW_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  VETTING_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  CLEARING_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  DRIVER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  STAFF: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],

  ACCOUNTANT: [
    UI_PERMISSIONS.DASHBOARD,
    UI_PERMISSIONS.JOBS,
    UI_PERMISSIONS.CLIENTS,
    UI_PERMISSIONS.INVOICES,
    UI_PERMISSIONS.ESTIMATES,
    UI_PERMISSIONS.ACCOUNTING,
    UI_PERMISSIONS.REPORTS,
    UI_PERMISSIONS.SETTINGS,
    UI_PERMISSIONS.VIEW_ALL_JOBS,
    UI_PERMISSIONS.CREATE_CUSTOMER,
    UI_PERMISSIONS.EDIT_CUSTOMER,
    UI_PERMISSIONS.VIEW_ALL_CUSTOMERS,
    UI_PERMISSIONS.VIEW_ALL_INVOICES,
    UI_PERMISSIONS.VIEW_ALL_ESTIMATES,
    UI_PERMISSIONS.CREATE_ESTIMATE,
    UI_PERMISSIONS.EDIT_ESTIMATE,
    UI_PERMISSIONS.SEND_ESTIMATE,
    UI_PERMISSIONS.VIEW_REPORTS,
    UI_PERMISSIONS.EXPORT_REPORTS,
    UI_PERMISSIONS.VIEW_ANALYTICS,
    UI_PERMISSIONS.PROFILE_SETTINGS,
    UI_PERMISSIONS.TEAM_MEMBERS,
    UI_PERMISSIONS.UPLOAD_FILE,
    UI_PERMISSIONS.DOWNLOAD_FILE,
    UI_PERMISSIONS.DELETE_FILE,
    UI_PERMISSIONS.VIEW_NOTIFICATIONS,
    UI_PERMISSIONS.CREATE_EXPENSE,
    UI_PERMISSIONS.APPROVE_EXPENSE,
    UI_PERMISSIONS.EDIT_EXPENSE,
    UI_PERMISSIONS.DELETE_EXPENSE,
    UI_PERMISSIONS.CREATE_PAYOUT,
    UI_PERMISSIONS.EDIT_PAYOUT,
    UI_PERMISSIONS.DELETE_PAYOUT,
    UI_PERMISSIONS.VIEW_CASHFLOW,
    UI_PERMISSIONS.CREATE_CASHFLOW
  ]
};

// Permission checking functions
export const hasUIPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  // Admin and IT Consultant always have all permissions
  if (userRole === 'ADMIN' || userRole === 'IT_CONSULTANT') {
    return true;
  }
  
  const rolePermissions = ROLE_UI_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyUIPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasUIPermission(userRole, permission));
};

export const hasAllUIPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasUIPermission(userRole, permission));
};

// UI Permission Categories for better organization
export const UI_PERMISSION_CATEGORIES = {
  'Sidebar Navigation': {
    [UI_PERMISSIONS.DASHBOARD]: 'Dashboard',
    [UI_PERMISSIONS.JOBS]: 'Jobs Management',
    [UI_PERMISSIONS.CLIENTS]: 'Clients Management',
    [UI_PERMISSIONS.INVOICES]: 'Invoices Management',
    [UI_PERMISSIONS.ACCOUNTING]: 'Accounting & Finance',
    [UI_PERMISSIONS.REQUESTS]: 'Requests Management',
    [UI_PERMISSIONS.REPORTS]: 'Reports & Analytics',
    [UI_PERMISSIONS.SETTINGS]: 'System Settings',
    [UI_PERMISSIONS.CONFIGURATION]: 'System Configuration'
  },
  
  'Settings Tabs': {
    [UI_PERMISSIONS.PROFILE_SETTINGS]: 'Profile Settings',
    [UI_PERMISSIONS.ROLES_PERMISSIONS]: 'Roles & Permissions',
    [UI_PERMISSIONS.INVITE_USERS]: 'Invite Users',
    [UI_PERMISSIONS.TEAM_MEMBERS]: 'Team Members',
    [UI_PERMISSIONS.SYSTEM_PREFERENCES]: 'System Preferences',
    [UI_PERMISSIONS.SECURITY_SETTINGS]: 'Security Settings',
    // [UI_PERMISSIONS.WHATSAPP_WEB]: 'WhatsApp Web',
    [UI_PERMISSIONS.API_INTEGRATION_TEST]: 'API Integration Test'
  },
  
  'Job Management': {
    [UI_PERMISSIONS.CREATE_JOB]: 'Create Job',
    [UI_PERMISSIONS.EDIT_JOB]: 'Edit Job',
    [UI_PERMISSIONS.DELETE_JOB]: 'Delete Job',
    [UI_PERMISSIONS.ASSIGN_JOB]: 'Assign Job',
    [UI_PERMISSIONS.UPDATE_JOB_STATUS]: 'Update Job Status',
    [UI_PERMISSIONS.VIEW_ALL_JOBS]: 'View All Jobs'
  },
  
  'Customer Management': {
    [UI_PERMISSIONS.CREATE_CUSTOMER]: 'Create Customer',
    [UI_PERMISSIONS.EDIT_CUSTOMER]: 'Edit Customer',
    [UI_PERMISSIONS.DELETE_CUSTOMER]: 'Delete Customer',
    [UI_PERMISSIONS.VIEW_ALL_CUSTOMERS]: 'View All Customers'
  },
  
  'Invoice Management': {
    [UI_PERMISSIONS.CREATE_INVOICE]: 'Create Invoice',
    [UI_PERMISSIONS.EDIT_INVOICE]: 'Edit Invoice',
    [UI_PERMISSIONS.DELETE_INVOICE]: 'Delete Invoice',
    [UI_PERMISSIONS.APPROVE_INVOICE]: 'Approve Invoice',
    [UI_PERMISSIONS.VIEW_ALL_INVOICES]: 'View All Invoices'
  },
  
  'Accounting & Finance': {
    [UI_PERMISSIONS.CREATE_EXPENSE]: 'Create Expense',
    [UI_PERMISSIONS.APPROVE_EXPENSE]: 'Approve Expense',
    [UI_PERMISSIONS.EDIT_EXPENSE]: 'Edit Expense',
    [UI_PERMISSIONS.DELETE_EXPENSE]: 'Delete Expense',
    [UI_PERMISSIONS.CREATE_PAYOUT]: 'Create Payout',
    [UI_PERMISSIONS.EDIT_PAYOUT]: 'Edit Payout',
    [UI_PERMISSIONS.DELETE_PAYOUT]: 'Delete Payout',
    [UI_PERMISSIONS.VIEW_CASHFLOW]: 'View Cashflow',
    [UI_PERMISSIONS.CREATE_CASHFLOW]: 'Create Cashflow'
  },
  
  'Reports & Analytics': {
    [UI_PERMISSIONS.VIEW_REPORTS]: 'View Reports',
    [UI_PERMISSIONS.EXPORT_REPORTS]: 'Export Reports',
    [UI_PERMISSIONS.VIEW_ANALYTICS]: 'View Analytics'
  },
  
  'User Management': {
    [UI_PERMISSIONS.CREATE_USER]: 'Create User',
    [UI_PERMISSIONS.EDIT_USER]: 'Edit User',
    [UI_PERMISSIONS.DELETE_USER]: 'Delete User',
    [UI_PERMISSIONS.MANAGE_ROLES]: 'Manage Roles',
    [UI_PERMISSIONS.INVITE_USER]: 'Invite User'
  },
  
  'System Operations': {
    [UI_PERMISSIONS.UPLOAD_FILE]: 'Upload File',
    [UI_PERMISSIONS.DOWNLOAD_FILE]: 'Download File',
    [UI_PERMISSIONS.DELETE_FILE]: 'Delete File',
    [UI_PERMISSIONS.SEND_NOTIFICATION]: 'Send Notification',
    [UI_PERMISSIONS.VIEW_NOTIFICATIONS]: 'View Notifications',
    [UI_PERMISSIONS.EDIT_SYSTEM_SETTINGS]: 'Edit System Settings',
    [UI_PERMISSIONS.CONFIGURE_SYSTEM]: 'Configure System'
  }
};