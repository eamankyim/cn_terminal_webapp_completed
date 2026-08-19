// Comprehensive permissions system for role-based access control
import React from 'react';
import {
  CrownOutlined,
  SettingOutlined,
  FileAddOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FlagOutlined,
  UserOutlined,
  ContainerOutlined,
  CarOutlined,
  TeamOutlined
} from '@ant-design/icons';

// Define all available permissions
export const PERMISSIONS = {
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
  EXPENSE_ENDORSE: 'expense:endorse',      // Per-user extra: view/endorse/reject requests
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

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // ADMIN - Full access to everything
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
    
    // Accounting & Finance - Full access
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.EXPENSE_EDIT,
    PERMISSIONS.EXPENSE_DELETE,
    // ❌ REMOVED: EXPENSE_REQUEST (admin should not create expense requests)
    
    PERMISSIONS.PAYOUT_VIEW,
    PERMISSIONS.PAYOUT_CREATE,
    PERMISSIONS.PAYOUT_UPDATE,
    PERMISSIONS.PAYOUT_DELETE,
    
    PERMISSIONS.CASHFLOW_VIEW,
    PERMISSIONS.CASHFLOW_CREATE,
  ],
  
  // All roles except ADMIN and ACCOUNTANT share the same permissions
  IT_CONSULTANT: COMMON_EMPLOYEE_PERMISSIONS,
  ENQUIRY_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  ENTRY_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  TRANSPORT_COORDINATOR: COMMON_EMPLOYEE_PERMISSIONS,
  RELEASE_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  PREINVOICE_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  INVOICE_OFFICER: COMMON_EMPLOYEE_PERMISSIONS,
  SUPERVISOR: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_VIEW_ALL,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
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
    PERMISSIONS.ESTIMATE_CREATE,
    PERMISSIONS.ESTIMATE_EDIT,
    PERMISSIONS.ESTIMATE_SEND,
    
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

// Role information with descriptions
export const ROLE_INFO = {
  ADMIN: {
    name: 'Administrator',
    description: 'Full system access including user management and system configuration',
    color: 'red',
    icon: <CrownOutlined />,
    level: 4
  },
  IT_CONSULTANT: {
    name: 'IT Consultant',
    description: 'Full system access including user management and system configuration',
    color: 'orange',
    icon: <SettingOutlined />,
    level: 4
  },
  ENQUIRY_OFFICER: {
    name: 'Enquiry Officer',
    description: 'Creates jobs and manages customer enquiries',
    color: 'blue',
    icon: <FileAddOutlined />,
    level: 3
  },
  ENTRY_OFFICER: {
    name: 'Entry Officer',
    description: 'Updates jobs to entry status and manages entry process',
    color: 'orange',
    icon: <ContainerOutlined />,
    level: 3
  },
  TRANSPORT_COORDINATOR: {
    name: 'Transport Coordinator',
    description: 'Assigns jobs to release officers and uploads documentation',
    color: 'blue',
    icon: <CarOutlined />,
    level: 3
  },
  RELEASE_OFFICER: {
    name: 'Release Officer',
    description: 'Updates jobs to released status, only sees assigned jobs',
    color: 'green',
    icon: <CheckCircleOutlined />,
    level: 3
  },
  PREINVOICE_OFFICER: {
    name: 'Preinvoice Officer',
    description: 'Handles pre-invoicing tasks and prepares billing information',
    color: 'magenta',
    icon: <FileTextOutlined />,
    level: 3
  },
  INVOICE_OFFICER: {
    name: 'Invoice Officer',
    description: 'Issues invoices after pre-invoice and moves jobs to invoiced',
    color: 'blue',
    icon: <FileTextOutlined />,
    level: 3
  },
  SUPERVISOR: {
    name: 'Supervisor',
    description: 'Assigns/reassigns jobs, comments, and attaches documents without changing status',
    color: 'orange',
    icon: <TeamOutlined />,
    level: 3
  },
  REVIEW_OFFICER: {
    name: 'Review Officer',
    description: 'Reviews and preinvoices jobs',
    color: 'purple',
    icon: <EyeOutlined />,
    level: 3
  },
  VETTING_OFFICER: {
    name: 'Vetting Officer',
    description: 'Vets jobs and prepares them for invoicing',
    color: 'cyan',
    icon: <FileTextOutlined />,
    level: 3
  },
  CLEARING_OFFICER: {
    name: 'Clearing Officer',
    description: 'Sets jobs to cleared status',
    color: 'gold',
    icon: <FlagOutlined />,
    level: 3
  },
  DRIVER: {
    name: 'Driver',
    description: 'Manages delivery jobs and updates location',
    color: 'lime',
    icon: <FileAddOutlined />,
    level: 2
  },
  STAFF: {
    name: 'Staff',
    description: 'General staff member with basic access',
    color: 'blue',
    icon: <UserOutlined />,
    level: 1
  },
  ACCOUNTANT: {
    name: 'Accountant',
    description: 'Manages expenses, payouts, and financial records',
    color: 'green',
    icon: <FileTextOutlined />,
    level: 3
  }
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  'User Management': [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
  ],
  'Job Management': [
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_DELETE,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_VIEW_ALL,
  ],
  'Invoice Management': [
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_EDIT,
    PERMISSIONS.INVOICE_DELETE,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW_ALL,
  ],
  'Customer Management': [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_VIEW_ALL,
  ],
  'Dashboard & Analytics': [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  'Reports': [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  'System Settings': [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SYSTEM_CONFIG,
  ],
  'File Management': [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
  ],
  'Notifications': [
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_SEND,
  ],
  'Accounting & Finance': [
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
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
};

// Helper functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has a specific role
 */
export const hasRole = (userRole, targetRole) => {
  if (!userRole || !targetRole) return false;
  
  // Support checking against multiple roles
  if (Array.isArray(targetRole)) {
    return targetRole.includes(userRole);
  }
  
  return userRole === targetRole;
};

export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

export const getRoleInfo = (role) => {
  return ROLE_INFO[role] || { name: role, description: 'Unknown role', color: 'default', icon: '❓', level: 0 };
};

/**
 * Get the default dashboard route for a user based on their role
 */
export const getDashboardRoute = (userRole) => {
  if (!userRole) return '/login';
  
  // ACCOUNTANT goes to accounting dashboard
  if (userRole === 'ACCOUNTANT') {
    return '/accounting';
  }
  
  // ADMIN and IT_CONSULTANT go to main dashboard
  if (userRole === 'ADMIN' || userRole === 'IT_CONSULTANT') {
    return '/dashboard';
  }
  
  // All other roles (employees) go to enquiries (jobs page)
  return '/enquiries';
};

/**
 * Check if a role is considered an "employee" role (non-admin, non-accountant)
 */
export const isEmployeeRole = (role) => {
  const employeeRoles = [
    'STAFF', 
    'DRIVER', 
    'ENQUIRY_OFFICER', 
    'ENTRY_OFFICER', 
    'TRANSPORT_COORDINATOR', 
    'RELEASE_OFFICER',
    'PREINVOICE_OFFICER',
    'INVOICE_OFFICER',
    'SUPERVISOR',
    'REVIEW_OFFICER', 
    'VETTING_OFFICER',
    'CLEARING_OFFICER'
  ];
  return employeeRoles.includes(role);
};

/**
 * Check if a role should not see the accounting/dashboard tabs
 */
export const shouldHideRequestsTab = (role) => {
  return role === 'ADMIN' || role === 'ACCOUNTANT' || role === 'IT_CONSULTANT';
};

export const canManageRole = (currentUserRole, targetRole) => {
  const currentLevel = ROLE_INFO[currentUserRole]?.level || 0;
  const targetLevel = ROLE_INFO[targetRole]?.level || 0;
  return currentLevel > targetLevel;
};

export const getAvailableRoles = (currentUserRole) => {
  const currentLevel = ROLE_INFO[currentUserRole]?.level || 0;
  return Object.keys(ROLE_INFO).filter(role => 
    ROLE_INFO[role].level < currentLevel
  );
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.USER_VIEW]: 'View user accounts and profiles',
  [PERMISSIONS.USER_CREATE]: 'Create new user accounts',
  [PERMISSIONS.USER_EDIT]: 'Edit existing user accounts',
  [PERMISSIONS.USER_DELETE]: 'Delete user accounts',
  [PERMISSIONS.USER_MANAGE_ROLES]: 'Assign and modify user roles',
  
  [PERMISSIONS.JOB_VIEW]: 'View job details and status',
  [PERMISSIONS.JOB_CREATE]: 'Create new jobs',
  [PERMISSIONS.JOB_EDIT]: 'Edit job information',
  [PERMISSIONS.JOB_DELETE]: 'Delete jobs',
  [PERMISSIONS.JOB_ASSIGN]: 'Assign jobs to users',
  [PERMISSIONS.JOB_UPDATE_STATUS]: 'Update job status',
  [PERMISSIONS.JOB_VIEW_ALL]: 'View all jobs (not just assigned)',
  
  [PERMISSIONS.INVOICE_VIEW]: 'View invoices',
  [PERMISSIONS.INVOICE_CREATE]: 'Create new invoices',
  [PERMISSIONS.INVOICE_EDIT]: 'Edit invoices',
  [PERMISSIONS.INVOICE_DELETE]: 'Delete invoices',
  [PERMISSIONS.INVOICE_APPROVE]: 'Approve invoices',
  [PERMISSIONS.INVOICE_VIEW_ALL]: 'View all invoices',
  
  [PERMISSIONS.CUSTOMER_VIEW]: 'View customer information',
  [PERMISSIONS.CUSTOMER_CREATE]: 'Create new customers',
  [PERMISSIONS.CUSTOMER_EDIT]: 'Edit customer information',
  [PERMISSIONS.CUSTOMER_DELETE]: 'Delete customers',
  [PERMISSIONS.CUSTOMER_VIEW_ALL]: 'View all customers',
  
  [PERMISSIONS.REPORTS_VIEW]: 'View reports and analytics',
  [PERMISSIONS.REPORTS_EXPORT]: 'Export reports',
  [PERMISSIONS.ANALYTICS_VIEW]: 'View analytics dashboard',
  [PERMISSIONS.DASHBOARD_VIEW]: 'View main dashboard',
  
  [PERMISSIONS.SETTINGS_VIEW]: 'View system settings',
  [PERMISSIONS.SETTINGS_EDIT]: 'Edit system settings',
  [PERMISSIONS.SYSTEM_CONFIG]: 'Configure system parameters',
  
  [PERMISSIONS.FILE_UPLOAD]: 'Upload files',
  [PERMISSIONS.FILE_DOWNLOAD]: 'Download files',
  [PERMISSIONS.FILE_DELETE]: 'Delete files',
  
  [PERMISSIONS.NOTIFICATION_VIEW]: 'View notifications',
  [PERMISSIONS.NOTIFICATION_SEND]: 'Send notifications',
  
  // Accounting & Finance
  [PERMISSIONS.EXPENSE_VIEW]: 'View expense requests and expenses',
  [PERMISSIONS.EXPENSE_CREATE]: 'Record expenses directly (no approval needed)',
  [PERMISSIONS.EXPENSE_REQUEST]: 'Request expenses (requires approval)',
  [PERMISSIONS.EXPENSE_ENDORSE]: 'View, endorse, or reject expense requests',
  [PERMISSIONS.EXPENSE_APPROVE]: 'Approve or reject expense requests',
  [PERMISSIONS.EXPENSE_EDIT]: 'Edit expense requests',
  [PERMISSIONS.EXPENSE_DELETE]: 'Delete expense requests',
  
  [PERMISSIONS.PAYOUT_VIEW]: 'View payouts',
  [PERMISSIONS.PAYOUT_CREATE]: 'Create new payouts',
  [PERMISSIONS.PAYOUT_UPDATE]: 'Update payout details and status',
  [PERMISSIONS.PAYOUT_DELETE]: 'Delete payouts',
  
  [PERMISSIONS.CASHFLOW_VIEW]: 'View cashflow data and reports',
  [PERMISSIONS.CASHFLOW_CREATE]: 'Create manual cashflow transactions',
  
};
