const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../utils/permissions');

const prisma = new PrismaClient();

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
};

// Permission module mapping
const PERMISSION_MODULES = {
  'user:': 'User',
  'job:': 'Job',
  'invoice:': 'Invoice',
  'customer:': 'Customer',
  'reports:': 'Reports',
  'analytics:': 'Analytics',
  'dashboard:': 'Dashboard',
  'settings:': 'Settings',
  'system:': 'System',
  'file:': 'File',
  'notification:': 'Notification',
  'driver:': 'Driver'
};

async function migratePermissions() {
  try {
    console.log('🚀 Starting permissions migration...');
    
    // Step 1: Create all permissions
    console.log('📝 Creating permissions...');
    const permissionMap = {};
    
    for (const [key, permissionName] of Object.entries(PERMISSIONS)) {
      // Determine module based on permission name
      let module = 'System';
      for (const [prefix, moduleName] of Object.entries(PERMISSION_MODULES)) {
        if (permissionName.startsWith(prefix)) {
          module = moduleName;
          break;
        }
      }
      
      // Create permission description
      const description = permissionName.replace(':', ' ').replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const permission = await prisma.permission.upsert({
        where: { name: permissionName },
        update: {
          description,
          module
        },
        create: {
          name: permissionName,
          description,
          module
        }
      });
      
      permissionMap[permissionName] = permission.id;
      console.log(`  ✅ Created permission: ${permissionName}`);
    }
    
    // Step 2: Create all roles
    console.log('👥 Creating roles...');
    const roleMap = {};
    
    for (const [roleName, info] of Object.entries(ROLE_INFO)) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {
          displayName: info.displayName,
          description: info.description,
          isSystem: info.isSystem
        },
        create: {
          name: roleName,
          displayName: info.displayName,
          description: info.description,
          isSystem: info.isSystem
        }
      });
      
      roleMap[roleName] = role.id;
      console.log(`  ✅ Created role: ${roleName}`);
    }
    
    // Step 3: Create role-permission mappings
    console.log('🔗 Creating role-permission mappings...');
    
    // Get the first admin user to use as creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleName];
      
      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });
      
      // Add new permissions
      for (const permissionName of permissions) {
        const permissionId = permissionMap[permissionName];
        
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
            createdBy: adminUser.id
          }
        });
      }
      
      console.log(`  ✅ Mapped ${permissions.length} permissions to role: ${roleName}`);
    }
    
    console.log('🎉 Permissions migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - ${Object.keys(PERMISSIONS).length} permissions created`);
    console.log(`  - ${Object.keys(ROLE_INFO).length} roles created`);
    console.log(`  - ${Object.values(ROLE_PERMISSIONS).flat().length} role-permission mappings created`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePermissions()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePermissions };


