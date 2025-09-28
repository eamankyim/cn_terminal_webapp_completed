const { PrismaClient } = require('@prisma/client');
const { ROLE_PERMISSIONS } = require('../utils/permissions');

const prisma = new PrismaClient();

async function assignRolePermissions() {
  console.log('🔧 Assigning permissions to roles...\n');
  
  try {
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found! Cannot assign permissions.');
      return;
    }
    
    console.log(`👤 Using admin user: ${adminUser.email} (${adminUser.id})`);
    
    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`📋 Found ${roles.length} roles in database`);
    
    // Get all permissions
    const permissions = await prisma.permission.findMany();
    console.log(`📋 Found ${permissions.length} permissions in database`);
    
    // Create permission lookup map
    const permissionMap = new Map();
    permissions.forEach(perm => {
      permissionMap.set(perm.name, perm.id);
    });
    
    // Process each role
    for (const role of roles) {
      console.log(`\n🔍 Processing role: ${role.name}`);
      
      // Get permissions for this role from ROLE_PERMISSIONS
      const rolePermissionNames = ROLE_PERMISSIONS[role.name] || [];
      console.log(`  📝 Permissions to assign: ${rolePermissionNames.length}`);
      
      if (rolePermissionNames.length === 0) {
        console.log(`  ⚠️  No permissions defined for role ${role.name}`);
        continue;
      }
      
      // Find permission IDs
      const permissionIds = [];
      const missingPermissions = [];
      
      for (const permName of rolePermissionNames) {
        const permId = permissionMap.get(permName);
        if (permId) {
          permissionIds.push(permId);
        } else {
          missingPermissions.push(permName);
        }
      }
      
      if (missingPermissions.length > 0) {
        console.log(`  ⚠️  Missing permissions: ${missingPermissions.join(', ')}`);
      }
      
      console.log(`  📊 Found ${permissionIds.length} valid permissions`);
      
      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      console.log(`  🗑️  Cleared existing permissions`);
      
      // Create new role permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId,
          createdBy: adminUser.id // Use admin user ID as creator
        }));
        
        await prisma.rolePermission.createMany({
          data: rolePermissions
        });
        
        console.log(`  ✅ Assigned ${permissionIds.length} permissions`);
      }
    }
    
    console.log('\n🎉 Role permissions assigned successfully!');
    
    // Show summary
    console.log('\n📊 Role Permission Summary:');
    for (const role of roles) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });
      
      console.log(`  - ${role.name}: ${rolePermissions.length} permissions`);
    }
    
  } catch (error) {
    console.error('❌ Error assigning role permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignRolePermissions();
