const { prisma } = require('../config/database');
const { UI_PERMISSIONS, ROLE_UI_PERMISSIONS, ALL_UI_PERMISSIONS } = require('./uiPermissions');

function formatPermissionDescription(name) {
  return name
    .replace('ui:', '')
    .split('_')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

async function seedUIPermissions(creatorId) {
  const permissionNames = ALL_UI_PERMISSIONS;
  const permissionMap = {};

  for (const permissionName of permissionNames) {
    const description = formatPermissionDescription(permissionName);

    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {
        description,
        module: 'UI'
      },
      create: {
        name: permissionName,
        description,
        module: 'UI'
      }
    });

    permissionMap[permissionName] = permission;
  }

  let assignmentsCreated = 0;

  if (creatorId) {
    const roleNames = Object.keys(ROLE_UI_PERMISSIONS);
    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames } }
    });

    const roleMap = roles.reduce((acc, role) => {
      acc[role.name] = role;
      return acc;
    }, {});

    for (const roleName of roleNames) {
      const role = roleMap[roleName];
      if (!role) {
        continue;
      }

      const rolePermissions = ROLE_UI_PERMISSIONS[roleName] || permissionNames;

      for (const permissionName of rolePermissions) {
        const permission = permissionMap[permissionName];
        if (!permission) {
          continue;
        }

        try {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
              createdBy: creatorId
            }
          });
          assignmentsCreated += 1;
        } catch (error) {
          if (error.code !== 'P2002') {
            throw error;
          }
        }
      }
    }
  }

  return {
    permissionCount: permissionNames.length,
    assignmentsCreated
  };
}

module.exports = { seedUIPermissions };
