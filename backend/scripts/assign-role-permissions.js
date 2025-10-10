const { PrismaClient } = require('@prisma/client');
const { ROLE_PERMISSIONS } = require('../utils/permissions');

const prisma = new PrismaClient();

async function assignRolePermissions() {

  try {
    // Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {

      return;
    }

    // Get all roles
    const roles = await prisma.role.findMany();

    // Get all permissions
    const permissions = await prisma.permission.findMany();

    // Create permission lookup map
    const permissionMap = new Map();
    permissions.forEach(perm => {
      permissionMap.set(perm.name, perm.id);
    });
    
    // Process each role
    for (const role of roles) {

      // Get permissions for this role from ROLE_PERMISSIONS
      const rolePermissionNames = ROLE_PERMISSIONS[role.name] || [];

      if (rolePermissionNames.length === 0) {

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

      }

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

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

      }
    }

    // Show summary

    for (const role of roles) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });

    }
    
  } catch (error) {

  } finally {
    await prisma.$disconnect();
  }
}

assignRolePermissions();
