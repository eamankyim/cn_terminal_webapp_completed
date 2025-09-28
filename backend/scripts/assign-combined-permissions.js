const { PrismaClient } = require('@prisma/client');
const { ROLE_PERMISSIONS } = require('../utils/permissions');
const { UI_PERMISSIONS } = require('../utils/uiPermissions');

const prisma = new PrismaClient();

// Combined permissions for each role (backend + UI)
const COMBINED_ROLE_PERMISSIONS = {
  ADMIN: [
    ...ROLE_PERMISSIONS.ADMIN,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  IT_CONSULTANT: [
    ...ROLE_PERMISSIONS.IT_CONSULTANT,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  ENQUIRY_OFFICER: [
    ...ROLE_PERMISSIONS.ENQUIRY_OFFICER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  RELEASE_OFFICER: [
    ...ROLE_PERMISSIONS.RELEASE_OFFICER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  REVIEW_OFFICER: [
    ...ROLE_PERMISSIONS.REVIEW_OFFICER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  INVOICE_OFFICER: [
    ...ROLE_PERMISSIONS.INVOICE_OFFICER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  CLEARING_OFFICER: [
    ...ROLE_PERMISSIONS.CLEARING_OFFICER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  DRIVER: [
    ...ROLE_PERMISSIONS.DRIVER,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  STAFF: [
    ...ROLE_PERMISSIONS.STAFF,
    ...Object.values(UI_PERMISSIONS)
  ],
  
  ACCOUNTANT: [
    ...ROLE_PERMISSIONS.ACCOUNTANT,
    ...Object.values(UI_PERMISSIONS)
  ]
};

async function assignCombinedPermissions() {
  try {
    console.log('🚀 Assigning combined permissions (backend + UI)...');
    
    // Find admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    
    console.log(`✅ Found admin user: ${adminUser.email}`);
    
    // Assign permissions to roles
    console.log('🔗 Assigning combined permissions to roles...');
    
    for (const [roleName, permissions] of Object.entries(COMBINED_ROLE_PERMISSIONS)) {
      console.log(`📋 Assigning ${permissions.length} permissions to ${roleName}...`);
      
      // Find the role
      const role = await prisma.role.findFirst({
        where: { name: roleName }
      });
      
      if (!role) {
        console.log(`⚠️  Role ${roleName} not found, skipping...`);
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
      
      console.log(`✅ Assigned ${permissions.length} permissions to ${roleName}`);
    }
    
    console.log('🎉 Combined permissions assignment completed successfully!');
    
    // Summary
    const totalPermissions = await prisma.permission.count();
    const totalRoles = await prisma.role.count();
    const totalRolePermissions = await prisma.rolePermission.count();
    
    console.log('\n📊 Summary:');
    console.log(`  - Total permissions: ${totalPermissions}`);
    console.log(`  - Total roles: ${totalRoles}`);
    console.log(`  - Total role-permission mappings: ${totalRolePermissions}`);
    
  } catch (error) {
    console.error('❌ Error assigning combined permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assignment
assignCombinedPermissions()
  .then(() => {
    console.log('✅ Combined permissions assignment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Combined permissions assignment failed:', error);
    process.exit(1);
  });
