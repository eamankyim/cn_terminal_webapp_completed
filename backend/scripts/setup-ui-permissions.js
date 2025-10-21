const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// UI-based permissions for backend
const UI_PERMISSIONS = {
  // Sidebar Navigation Items
  DASHBOARD: 'ui:dashboard',
  JOBS: 'ui:jobs', 
  CLIENTS: 'ui:clients',
  INVOICES: 'ui:invoices',
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
const ROLE_UI_PERMISSIONS = {
  ADMIN: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  IT_CONSULTANT: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  ENQUIRY_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  ENTRY_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  TRANSPORT_COORDINATOR: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  RELEASE_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  REVIEW_OFFICER: [
    // Full access to everything
    ...Object.values(UI_PERMISSIONS)
  ],
  
  INVOICE_OFFICER: [
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
  ]
};

async function setupUIPermissions() {
  try {

    // Find admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    // Create all UI permissions

    const permissionPromises = Object.entries(UI_PERMISSIONS).map(async ([key, permissionName]) => {
      const [module, action] = permissionName.split(':');
      return prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          description: `UI permission for ${action} in ${module}`,
          module: module.charAt(0).toUpperCase() + module.slice(1)
        }
      });
    });
    
    await Promise.all(permissionPromises);

    // Assign permissions to roles

    for (const [roleName, permissions] of Object.entries(ROLE_UI_PERMISSIONS)) {

      // Find the role
      const role = await prisma.role.findFirst({
        where: { name: roleName }
      });
      
      if (!role) {

        continue;
      }
      
      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      
      // Add new permissions in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < permissions.length; i += batchSize) {
        const batch = permissions.slice(i, i + batchSize);
        
        const rolePermissionPromises = batch.map(async (permissionName) => {
          const permission = await prisma.permission.findUnique({
            where: { name: permissionName }
          });
          
          if (permission) {
            return prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id,
                createdBy: adminUser.id
              }
            });
          }
        });
        
        await Promise.all(rolePermissionPromises);
        
        // Small delay between batches to prevent database connection issues
        if (i + batchSize < permissions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    }

    // Summary
    const totalPermissions = await prisma.permission.count();
    const totalRoles = await prisma.role.count();
    const totalRolePermissions = await prisma.rolePermission.count();

  } catch (error) {

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupUIPermissions()
  .then(() => {

    process.exit(0);
  })
  .catch((error) => {

    process.exit(1);
  });