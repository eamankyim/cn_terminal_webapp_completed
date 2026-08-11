// UI-based permissions for backend to mirror frontend UI restrictions
const UI_PERMISSIONS = {
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

const ALL_UI_PERMISSIONS = Object.values(UI_PERMISSIONS);

// Role-based UI permission defaults (mirrors frontend logic)
const ROLE_UI_PERMISSIONS = {
  ADMIN: [...ALL_UI_PERMISSIONS],
};

// All roles except ADMIN and ACCOUNTANT get full UI access
// ADMIN already has full access defined above
// ACCOUNTANT has restricted access (defined separately if needed)
const FULL_ACCESS_ROLES = [
  'IT_CONSULTANT',
  'ENQUIRY_OFFICER',
  'ENTRY_OFFICER',
  'TRANSPORT_COORDINATOR',
  'RELEASE_OFFICER',
  'PREINVOICE_OFFICER',
  'REVIEW_OFFICER',
  'VETTING_OFFICER',
  'CLEARING_OFFICER',
  'DRIVER',
  'STAFF'
];

for (const roleName of FULL_ACCESS_ROLES) {
  ROLE_UI_PERMISSIONS[roleName] = [...ALL_UI_PERMISSIONS];
}

// ACCOUNTANT has restricted UI access (view-only for most features)
ROLE_UI_PERMISSIONS.ACCOUNTANT = [
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
  UI_PERMISSIONS.VIEW_REPORTS,
  UI_PERMISSIONS.EXPORT_REPORTS,
  UI_PERMISSIONS.VIEW_ANALYTICS,
  UI_PERMISSIONS.PROFILE_SETTINGS,
  UI_PERMISSIONS.TEAM_MEMBERS,
  UI_PERMISSIONS.UPLOAD_FILE,
  UI_PERMISSIONS.DOWNLOAD_FILE,
  UI_PERMISSIONS.DELETE_FILE,
  UI_PERMISSIONS.VIEW_NOTIFICATIONS,
  // Accounting-specific permissions
  UI_PERMISSIONS.CREATE_EXPENSE,
  UI_PERMISSIONS.APPROVE_EXPENSE,
  UI_PERMISSIONS.EDIT_EXPENSE,
  UI_PERMISSIONS.DELETE_EXPENSE,
  UI_PERMISSIONS.CREATE_PAYOUT,
  UI_PERMISSIONS.EDIT_PAYOUT,
  UI_PERMISSIONS.DELETE_PAYOUT,
  UI_PERMISSIONS.VIEW_CASHFLOW,
  UI_PERMISSIONS.CREATE_CASHFLOW
];

module.exports = { UI_PERMISSIONS, ROLE_UI_PERMISSIONS, ALL_UI_PERMISSIONS };
