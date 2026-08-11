import type { User, UserRole } from '../types/api';

/**
 * Resource permissions (job:create, invoice:view, …) — mirrors
 * frontend/src/utils/permissions.js and backend/utils/permissions.js.
 */
export const PERMISSIONS = {
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',

  JOB_VIEW: 'job:view',
  JOB_CREATE: 'job:create',
  JOB_EDIT: 'job:edit',
  JOB_DELETE: 'job:delete',
  JOB_ASSIGN: 'job:assign',
  JOB_UPDATE_STATUS: 'job:update_status',
  JOB_VIEW_ALL: 'job:view_all',

  INVOICE_VIEW: 'invoice:view',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_EDIT: 'invoice:edit',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_APPROVE: 'invoice:approve',
  INVOICE_VIEW_ALL: 'invoice:view_all',

  ESTIMATE_VIEW: 'estimate:view',
  ESTIMATE_CREATE: 'estimate:create',
  ESTIMATE_EDIT: 'estimate:edit',
  ESTIMATE_DELETE: 'estimate:delete',
  ESTIMATE_SEND: 'estimate:send',
  ESTIMATE_VIEW_ALL: 'estimate:view_all',

  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_EDIT: 'customer:edit',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_VIEW_ALL: 'customer:view_all',

  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SYSTEM_CONFIG: 'system:config',

  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  FILE_DELETE: 'file:delete',

  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_SEND: 'notification:send',

  EXPENSE_VIEW: 'expense:view',
  EXPENSE_CREATE: 'expense:create',
  EXPENSE_REQUEST: 'expense:request',
  EXPENSE_APPROVE: 'expense:approve',
  EXPENSE_EDIT: 'expense:edit',
  EXPENSE_DELETE: 'expense:delete',

  PAYOUT_VIEW: 'payout:view',
  PAYOUT_CREATE: 'payout:create',
  PAYOUT_UPDATE: 'payout:update',
  PAYOUT_DELETE: 'payout:delete',

  CASHFLOW_VIEW: 'cashflow:view',
  CASHFLOW_CREATE: 'cashflow:create',
} as const;

/**
 * UI permissions (sidebar / settings) — mirrors
 * frontend/src/utils/uiPermissions.js and backend/utils/uiPermissions.js.
 * These are what GET /auth/me typically returns after UI permission seeding.
 */
export const UI_PERMISSIONS = {
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

  PROFILE_SETTINGS: 'ui:profile_settings',
  ROLES_PERMISSIONS: 'ui:roles_permissions',
  INVITE_USERS: 'ui:invite_users',
  TEAM_MEMBERS: 'ui:team_members',
  SYSTEM_PREFERENCES: 'ui:system_preferences',
  SECURITY_SETTINGS: 'ui:security_settings',

  CREATE_JOB: 'ui:create_job',
  EDIT_JOB: 'ui:edit_job',
  DELETE_JOB: 'ui:delete_job',
  ASSIGN_JOB: 'ui:assign_job',
  UPDATE_JOB_STATUS: 'ui:update_job_status',
  VIEW_ALL_JOBS: 'ui:view_all_jobs',

  CREATE_CUSTOMER: 'ui:create_customer',
  EDIT_CUSTOMER: 'ui:edit_customer',
  DELETE_CUSTOMER: 'ui:delete_customer',
  VIEW_ALL_CUSTOMERS: 'ui:view_all_customers',

  CREATE_INVOICE: 'ui:create_invoice',
  EDIT_INVOICE: 'ui:edit_invoice',
  DELETE_INVOICE: 'ui:delete_invoice',
  APPROVE_INVOICE: 'ui:approve_invoice',
  VIEW_ALL_INVOICES: 'ui:view_all_invoices',

  CREATE_ESTIMATE: 'ui:create_estimate',
  EDIT_ESTIMATE: 'ui:edit_estimate',
  DELETE_ESTIMATE: 'ui:delete_estimate',
  SEND_ESTIMATE: 'ui:send_estimate',
  VIEW_ALL_ESTIMATES: 'ui:view_all_estimates',

  CREATE_EXPENSE: 'ui:create_expense',
  APPROVE_EXPENSE: 'ui:approve_expense',
  EDIT_EXPENSE: 'ui:edit_expense',
  DELETE_EXPENSE: 'ui:delete_expense',
  CREATE_PAYOUT: 'ui:create_payout',
  EDIT_PAYOUT: 'ui:edit_payout',
  DELETE_PAYOUT: 'ui:delete_payout',
  VIEW_CASHFLOW: 'ui:view_cashflow',
  CREATE_CASHFLOW: 'ui:create_cashflow',

  VIEW_REPORTS: 'ui:view_reports',
  EXPORT_REPORTS: 'ui:export_reports',
  VIEW_ANALYTICS: 'ui:view_analytics',

  CREATE_USER: 'ui:create_user',
  EDIT_USER: 'ui:edit_user',
  DELETE_USER: 'ui:delete_user',
  MANAGE_ROLES: 'ui:manage_roles',
  INVITE_USER: 'ui:invite_user',

  UPLOAD_FILE: 'ui:upload_file',
  DOWNLOAD_FILE: 'ui:download_file',
  DELETE_FILE: 'ui:delete_file',
  SEND_NOTIFICATION: 'ui:send_notification',
  VIEW_NOTIFICATIONS: 'ui:view_notifications',
  EDIT_SYSTEM_SETTINGS: 'ui:edit_system_settings',
  CONFIGURE_SYSTEM: 'ui:configure_system',
} as const;

/** Bidirectional aliases so ui:* and resource:* checks both work. */
const PERMISSION_ALIASES: Record<string, string[]> = {
  [UI_PERMISSIONS.CREATE_JOB]: [PERMISSIONS.JOB_CREATE],
  [PERMISSIONS.JOB_CREATE]: [UI_PERMISSIONS.CREATE_JOB],
  [UI_PERMISSIONS.EDIT_JOB]: [PERMISSIONS.JOB_EDIT],
  [PERMISSIONS.JOB_EDIT]: [UI_PERMISSIONS.EDIT_JOB],
  [UI_PERMISSIONS.DELETE_JOB]: [PERMISSIONS.JOB_DELETE],
  [PERMISSIONS.JOB_DELETE]: [UI_PERMISSIONS.DELETE_JOB],
  [UI_PERMISSIONS.ASSIGN_JOB]: [PERMISSIONS.JOB_ASSIGN],
  [PERMISSIONS.JOB_ASSIGN]: [UI_PERMISSIONS.ASSIGN_JOB],
  [UI_PERMISSIONS.UPDATE_JOB_STATUS]: [PERMISSIONS.JOB_UPDATE_STATUS],
  [PERMISSIONS.JOB_UPDATE_STATUS]: [UI_PERMISSIONS.UPDATE_JOB_STATUS],
  [UI_PERMISSIONS.VIEW_ALL_JOBS]: [PERMISSIONS.JOB_VIEW_ALL],
  [PERMISSIONS.JOB_VIEW_ALL]: [UI_PERMISSIONS.VIEW_ALL_JOBS],

  [UI_PERMISSIONS.CREATE_CUSTOMER]: [PERMISSIONS.CUSTOMER_CREATE],
  [PERMISSIONS.CUSTOMER_CREATE]: [UI_PERMISSIONS.CREATE_CUSTOMER],
  [UI_PERMISSIONS.EDIT_CUSTOMER]: [PERMISSIONS.CUSTOMER_EDIT],
  [PERMISSIONS.CUSTOMER_EDIT]: [UI_PERMISSIONS.EDIT_CUSTOMER],
  [UI_PERMISSIONS.DELETE_CUSTOMER]: [PERMISSIONS.CUSTOMER_DELETE],
  [PERMISSIONS.CUSTOMER_DELETE]: [UI_PERMISSIONS.DELETE_CUSTOMER],
  [UI_PERMISSIONS.VIEW_ALL_CUSTOMERS]: [PERMISSIONS.CUSTOMER_VIEW_ALL],
  [PERMISSIONS.CUSTOMER_VIEW_ALL]: [UI_PERMISSIONS.VIEW_ALL_CUSTOMERS],

  [UI_PERMISSIONS.CREATE_INVOICE]: [PERMISSIONS.INVOICE_CREATE],
  [PERMISSIONS.INVOICE_CREATE]: [UI_PERMISSIONS.CREATE_INVOICE],
  [UI_PERMISSIONS.EDIT_INVOICE]: [PERMISSIONS.INVOICE_EDIT],
  [PERMISSIONS.INVOICE_EDIT]: [UI_PERMISSIONS.EDIT_INVOICE],
  [UI_PERMISSIONS.DELETE_INVOICE]: [PERMISSIONS.INVOICE_DELETE],
  [PERMISSIONS.INVOICE_DELETE]: [UI_PERMISSIONS.DELETE_INVOICE],
  [UI_PERMISSIONS.APPROVE_INVOICE]: [PERMISSIONS.INVOICE_APPROVE],
  [PERMISSIONS.INVOICE_APPROVE]: [UI_PERMISSIONS.APPROVE_INVOICE],
  [UI_PERMISSIONS.VIEW_ALL_INVOICES]: [PERMISSIONS.INVOICE_VIEW_ALL],
  [PERMISSIONS.INVOICE_VIEW_ALL]: [UI_PERMISSIONS.VIEW_ALL_INVOICES],

  [UI_PERMISSIONS.CREATE_ESTIMATE]: [PERMISSIONS.ESTIMATE_CREATE],
  [PERMISSIONS.ESTIMATE_CREATE]: [UI_PERMISSIONS.CREATE_ESTIMATE],
  [UI_PERMISSIONS.EDIT_ESTIMATE]: [PERMISSIONS.ESTIMATE_EDIT],
  [PERMISSIONS.ESTIMATE_EDIT]: [UI_PERMISSIONS.EDIT_ESTIMATE],
  [UI_PERMISSIONS.DELETE_ESTIMATE]: [PERMISSIONS.ESTIMATE_DELETE],
  [PERMISSIONS.ESTIMATE_DELETE]: [UI_PERMISSIONS.DELETE_ESTIMATE],
  [UI_PERMISSIONS.SEND_ESTIMATE]: [PERMISSIONS.ESTIMATE_SEND],
  [PERMISSIONS.ESTIMATE_SEND]: [UI_PERMISSIONS.SEND_ESTIMATE],
  [UI_PERMISSIONS.VIEW_ALL_ESTIMATES]: [PERMISSIONS.ESTIMATE_VIEW_ALL],
  [PERMISSIONS.ESTIMATE_VIEW_ALL]: [UI_PERMISSIONS.VIEW_ALL_ESTIMATES],

  [UI_PERMISSIONS.DASHBOARD]: [PERMISSIONS.DASHBOARD_VIEW],
  [PERMISSIONS.DASHBOARD_VIEW]: [UI_PERMISSIONS.DASHBOARD],
  [UI_PERMISSIONS.REPORTS]: [PERMISSIONS.REPORTS_VIEW, UI_PERMISSIONS.VIEW_REPORTS],
  [UI_PERMISSIONS.VIEW_REPORTS]: [PERMISSIONS.REPORTS_VIEW, UI_PERMISSIONS.REPORTS],
  [PERMISSIONS.REPORTS_VIEW]: [UI_PERMISSIONS.REPORTS, UI_PERMISSIONS.VIEW_REPORTS],

  [UI_PERMISSIONS.CREATE_EXPENSE]: [PERMISSIONS.EXPENSE_CREATE],
  [PERMISSIONS.EXPENSE_CREATE]: [UI_PERMISSIONS.CREATE_EXPENSE],
  [UI_PERMISSIONS.APPROVE_EXPENSE]: [PERMISSIONS.EXPENSE_APPROVE],
  [PERMISSIONS.EXPENSE_APPROVE]: [UI_PERMISSIONS.APPROVE_EXPENSE],
  [UI_PERMISSIONS.VIEW_CASHFLOW]: [PERMISSIONS.CASHFLOW_VIEW],
  [PERMISSIONS.CASHFLOW_VIEW]: [UI_PERMISSIONS.VIEW_CASHFLOW],

  [UI_PERMISSIONS.VIEW_NOTIFICATIONS]: [PERMISSIONS.NOTIFICATION_VIEW],
  [PERMISSIONS.NOTIFICATION_VIEW]: [UI_PERMISSIONS.VIEW_NOTIFICATIONS],
  [UI_PERMISSIONS.MANAGE_ROLES]: [PERMISSIONS.USER_MANAGE_ROLES, UI_PERMISSIONS.ROLES_PERMISSIONS],
  [UI_PERMISSIONS.ROLES_PERMISSIONS]: [UI_PERMISSIONS.MANAGE_ROLES, PERMISSIONS.USER_MANAGE_ROLES],
  [PERMISSIONS.USER_MANAGE_ROLES]: [UI_PERMISSIONS.MANAGE_ROLES, UI_PERMISSIONS.ROLES_PERMISSIONS],
  [UI_PERMISSIONS.INVITE_USER]: [UI_PERMISSIONS.INVITE_USERS],
  [UI_PERMISSIONS.INVITE_USERS]: [UI_PERMISSIONS.INVITE_USER],
  [UI_PERMISSIONS.CONFIGURATION]: [PERMISSIONS.SYSTEM_CONFIG, UI_PERMISSIONS.CONFIGURE_SYSTEM],
  [UI_PERMISSIONS.CONFIGURE_SYSTEM]: [UI_PERMISSIONS.CONFIGURATION, PERMISSIONS.SYSTEM_CONFIG],
  [PERMISSIONS.SYSTEM_CONFIG]: [UI_PERMISSIONS.CONFIGURATION, UI_PERMISSIONS.CONFIGURE_SYSTEM],
};

const DASHBOARD_ROLES: UserRole[] = ['ADMIN', 'ACCOUNTANT', 'IT_CONSULTANT'];

const EMPLOYEE_ROLES: UserRole[] = [
  'STAFF',
  'DRIVER',
  'ENQUIRY_OFFICER',
  'ENTRY_OFFICER',
  'TRANSPORT_COORDINATOR',
  'RELEASE_OFFICER',
  'PREINVOICE_OFFICER',
  'INVOICE_OFFICER',
  'REVIEW_OFFICER',
  'VETTING_OFFICER',
  'CLEARING_OFFICER',
];

export function hasRole(
  userOrRole: User | UserRole | null | undefined,
  targetRole: UserRole | UserRole[],
): boolean {
  const role =
    typeof userOrRole === 'string'
      ? userOrRole
      : userOrRole?.role ?? null;

  if (!role) return false;

  if (Array.isArray(targetRole)) {
    return targetRole.includes(role);
  }

  return role === targetRole;
}

export function isEmployeeRole(role?: UserRole | null): boolean {
  if (!role) return false;
  return EMPLOYEE_ROLES.includes(role);
}

/** Matches web Sidebar: admins/accountants/IT don't use the Requests tab. */
export function shouldHideRequestsTab(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'ACCOUNTANT' || role === 'IT_CONSULTANT';
}

/** Matches web Sidebar: Dashboard only for ADMIN / ACCOUNTANT / IT_CONSULTANT. */
export function canAccessDashboard(user?: User | null): boolean {
  if (!user?.role) return false;
  if (!DASHBOARD_ROLES.includes(user.role)) return false;
  return hasPermission(user, UI_PERMISSIONS.DASHBOARD);
}

function permissionInList(list: string[], permission: string): boolean {
  if (list.includes(permission)) return true;
  const aliases = PERMISSION_ALIASES[permission];
  if (!aliases?.length) return false;
  return aliases.some((alias) => list.includes(alias));
}

/**
 * Prefer server-provided `user.permissions` from GET /api/auth/me.
 * ADMIN / IT_CONSULTANT get all UI permissions (matches backend middleware).
 * Also accepts ui:* ↔ resource:* aliases so action checks work either way.
 */
export function hasPermission(
  user: User | null | undefined,
  permission: string,
): boolean {
  if (!user || !permission) return false;

  if (
    (user.role === 'ADMIN' || user.role === 'IT_CONSULTANT') &&
    permission.startsWith('ui:')
  ) {
    return true;
  }

  if (user.role === 'ADMIN' || user.role === 'IT_CONSULTANT') {
    return true;
  }

  if (Array.isArray(user.permissions)) {
    return permissionInList(user.permissions, permission);
  }

  return false;
}

export function hasAnyPermission(
  user: User | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !permissions?.length) return false;
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(
  user: User | null | undefined,
  permissions: string[],
): boolean {
  if (!user || !permissions?.length) return false;
  return permissions.every((p) => hasPermission(user, p));
}

export type MoreMenuLinkKey =
  | 'notifications'
  | 'profile'
  | 'appearance'
  | 'password'
  | 'invoices'
  | 'estimates'
  | 'accounting'
  | 'reports'
  | 'my-requests'
  | 'expense-requests';

export type MoreMenuLink = {
  key: MoreMenuLinkKey;
  label: string;
  screen: string;
};

/** Ionicons glyph names for More menu rows (incl. Sign out). */
export const MORE_MENU_ICONS: Record<
  MoreMenuLinkKey | 'sign-out',
  string
> = {
  notifications: 'notifications-outline',
  profile: 'person-outline',
  appearance: 'color-palette-outline',
  password: 'key-outline',
  invoices: 'document-text-outline',
  estimates: 'document-outline',
  accounting: 'wallet-outline',
  reports: 'bar-chart-outline',
  'my-requests': 'receipt-outline',
  'expense-requests': 'receipt-outline',
  'sign-out': 'log-out-outline',
};

/**
 * More / Account hub links filtered like the web Sidebar + Settings tabs.
 */
export function getMoreMenuLinks(user: User | null | undefined): MoreMenuLink[] {
  const links: MoreMenuLink[] = [
    { key: 'notifications', label: 'Notifications', screen: 'Notifications' },
    { key: 'profile', label: 'Profile', screen: 'Profile' },
    { key: 'appearance', label: 'Appearance', screen: 'Appearance' },
    { key: 'password', label: 'Change password', screen: 'ChangePassword' },
  ];

  if (hasPermission(user, UI_PERMISSIONS.INVOICES)) {
    links.push({ key: 'invoices', label: 'Invoices', screen: 'Invoices' });
  }
  if (hasPermission(user, UI_PERMISSIONS.ESTIMATES)) {
    links.push({ key: 'estimates', label: 'Estimates', screen: 'Estimates' });
  }
  if (
    hasPermission(user, UI_PERMISSIONS.ACCOUNTING) &&
    !isEmployeeRole(user?.role)
  ) {
    links.push({
      key: 'accounting',
      label: 'Accounting',
      screen: 'AccountingOverview',
    });
  }
  if (hasPermission(user, UI_PERMISSIONS.REPORTS)) {
    links.push({ key: 'reports', label: 'Reports', screen: 'Reports' });
  }
  if (
    hasPermission(user, UI_PERMISSIONS.REQUESTS) &&
    !shouldHideRequestsTab(user?.role)
  ) {
    links.push({
      key: 'my-requests',
      label: 'My expense requests',
      screen: 'MyRequests',
    });
  }

  // Approve queue: backend /expenses/requests requires ui:accounting
  if (
    hasPermission(user, UI_PERMISSIONS.ACCOUNTING) ||
    hasPermission(user, UI_PERMISSIONS.APPROVE_EXPENSE)
  ) {
    links.push({
      key: 'expense-requests',
      label: 'Expense requests',
      screen: 'ExpenseRequests',
    });
  }

  return links;
}
