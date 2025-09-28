const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToRoleBasedPermissions() {
  console.log('🔄 Starting migration to role-based permissions...');
  
  try {
    // Step 1: Push schema changes to add ACCOUNTANT role
    console.log('📝 Step 1: Schema changes applied (ACCOUNTANT role added)');
    
    // Step 2: Update role permissions in database
    console.log('🔧 Step 2: Updating role permissions in database...');
    
    // Get all roles from database
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles in database`);
    
    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({});
    console.log('✅ Cleared existing role permissions');
    
    // Get all permissions
    const permissions = await prisma.permission.findMany();
    const permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.name] = p.id;
    });
    
    // Step 3: Create new role-permission mappings based on updated backend logic
    const rolePermissionMappings = {
      ADMIN: [
        'user:view', 'user:manage_roles',
        'job:view', 'job:view_all',
        'invoice:view', 'invoice:view_all',
        'customer:view', 'customer:view_all',
        'reports:view', 'reports:export', 'analytics:view', 'dashboard:view',
        'settings:view', 'settings:edit', 'system:config',
        'file:upload', 'file:download', 'file:delete',
        'notification:view', 'notification:send',
        'expense:view',
        'payout:view', 'cashflow:view'
      ],
      
      IT_CONSULTANT: [
        'user:view', 'user:create', 'user:edit', 'user:delete', 'user:manage_roles',
        'job:view', 'job:create', 'job:edit', 'job:delete', 'job:assign', 'job:update_status', 'job:view_all',
        'invoice:view', 'invoice:create', 'invoice:edit', 'invoice:delete', 'invoice:approve', 'invoice:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:delete', 'customer:view_all',
        'reports:view', 'reports:export', 'analytics:view', 'dashboard:view',
        'settings:view', 'settings:edit', 'system:config',
        'file:upload', 'file:download', 'file:delete',
        'notification:view', 'notification:send',
        'expense:view', 'expense:create', 'expense:approve', 'expense:edit', 'expense:delete',
        'payout:view', 'payout:create', 'payout:update', 'payout:delete',
        'cashflow:view', 'cashflow:create'
      ],
      
      ENQUIRY_OFFICER: [
        'job:view', 'job:create', 'job:edit', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:view_all',
        'dashboard:view', 'reports:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      RELEASE_OFFICER: [
        'job:view', 'job:create', 'job:edit', 'job:update_status', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:view_all',
        'dashboard:view', 'reports:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      REVIEW_OFFICER: [
        'job:view', 'job:create', 'job:edit', 'job:update_status', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:edit', 'invoice:view_all',
        'dashboard:view', 'reports:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      INVOICE_OFFICER: [
        'job:view', 'job:view_all',
        'customer:view', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:edit', 'invoice:approve', 'invoice:view_all',
        'reports:view', 'reports:export', 'dashboard:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:view',
        'payout:view', 'payout:create', 'payout:update', 'cashflow:view'
      ],
      
      CLEARING_OFFICER: [
        'job:view', 'job:create', 'job:edit', 'job:update_status', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:view_all',
        'dashboard:view', 'reports:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      STAFF: [
        'job:view', 'job:create', 'job:edit', 'job:assign', 'job:update_status', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:edit', 'invoice:view_all',
        'reports:view', 'reports:export', 'dashboard:view',
        'settings:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      DRIVER: [
        'job:view', 'job:create', 'job:edit', 'job:update_status', 'job:view_all',
        'customer:view', 'customer:create', 'customer:edit', 'customer:view_all',
        'invoice:view', 'invoice:create', 'invoice:view_all',
        'dashboard:view', 'reports:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:request', 'expense:view'
      ],
      
      ACCOUNTANT: [
        'job:view', 'job:view_all',
        'customer:view', 'customer:view_all',
        'invoice:view', 'invoice:view_all',
        'reports:view', 'reports:export', 'dashboard:view',
        'file:upload', 'file:download',
        'notification:view',
        'expense:view', 'expense:create', 'expense:approve', 'expense:edit', 'expense:delete',
        'payout:view', 'payout:create', 'payout:update', 'payout:delete',
        'cashflow:view', 'cashflow:create'
      ]
    };
    
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    
    // Create role permissions
    let totalPermissions = 0;
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const role = roles.find(r => r.name === roleName);
      if (!role) {
        console.log(`⚠️  Role ${roleName} not found in database, skipping...`);
        continue;
      }
      
      for (const permissionName of permissionNames) {
        const permissionId = permissionMap[permissionName];
        if (!permissionId) {
          console.log(`⚠️  Permission ${permissionName} not found in database, skipping...`);
          continue;
        }
        
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permissionId,
            createdBy: adminUser.id
          }
        });
        totalPermissions++;
      }
      
      console.log(`✅ Created ${permissionNames.length} permissions for ${roleName}`);
    }
    
    console.log(`🎉 Successfully created ${totalPermissions} role-permission mappings`);
    
    // Step 4: Create ACCOUNTANT role if it doesn't exist
    const accountantRole = await prisma.role.findFirst({
      where: { name: 'ACCOUNTANT' }
    });
    
    if (!accountantRole) {
      await prisma.role.create({
        data: {
          name: 'ACCOUNTANT',
          displayName: 'Accountant',
          description: 'Manages expenses, payouts, and financial records',
          isSystem: false
        }
      });
      console.log('✅ Created ACCOUNTANT role');
    }
    
    console.log('🎉 Migration to role-based permissions completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateToRoleBasedPermissions()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToRoleBasedPermissions };
