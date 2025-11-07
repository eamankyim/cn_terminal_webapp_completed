const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../utils/permissions');
const { seedUIPermissions } = require('../utils/uiPermissionSeeder');

const prisma = new PrismaClient();

async function setupPermissions() {

  try {
    // Create all permissions

    const permissionEntries = Object.entries(PERMISSIONS).map(([key, value]) => {
      const module = key.split('_')[0]; // Extract module from permission key
      return {
        name: value,
        description: `Permission for ${key.replace(/_/g, ' ').toLowerCase()}`,
        module: module.charAt(0).toUpperCase() + module.slice(1).toLowerCase()
      };
    });

    const createdPermissions = await Promise.all(
      permissionEntries.map(permission => 
        prisma.permission.upsert({
          where: { name: permission.name },
          update: permission,
          create: permission
        })
      )
    );

    // Create admin role

    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Administrator with full access to all features',
        isSystem: true,
        isActive: true
      }
    });

    // Get the first admin user (the one just created via init endpoint)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Please create an admin user first via /api/init/super-admin');
    }

    // Assign all permissions to admin role

    const adminPermissions = ROLE_PERMISSIONS.ADMIN;
    
    for (const permissionName of adminPermissions) {
      const permission = createdPermissions.find(p => p.name === permissionName);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id,
            createdBy: adminUser.id
          }
        });
      }
    }

    // Update admin user to use the new role

    const updatedAdmin = await prisma.user.update({
      where: { id: adminUser.id },
      data: { roleId: adminRole.id }
    });

    await seedUIPermissions(updatedAdmin.id);

  } catch (error) {

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupPermissions()
  .catch((e) => {

    process.exit(1);
  });
