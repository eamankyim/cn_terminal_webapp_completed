/**
 * Ensure SUPERVISOR role exists with restricted permissions, then assign a user to it.
 *
 * Usage:
 *   node scripts/set-supervisor-user.js
 *   node scripts/set-supervisor-user.js mdotse@cn.com
 *   EMAIL=mdotse@cn.com node scripts/set-supervisor-user.js
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { ROLE_PERMISSIONS } = require('../utils/permissions');
const { ROLE_UI_PERMISSIONS } = require('../utils/uiPermissions');

const prisma = new PrismaClient();
const ROLE_NAME = 'SUPERVISOR';
const DEFAULT_EMAIL = process.env.EMAIL || process.argv[2] || 'mdotse@cn.com';

async function ensureSupervisorRole(adminUserId) {
  const role = await prisma.role.upsert({
    where: { name: ROLE_NAME },
    update: {
      displayName: 'Supervisor',
      description:
        'Assigns/reassigns jobs, comments, and attaches documents without changing status',
      isSystem: true,
      isActive: true,
    },
    create: {
      name: ROLE_NAME,
      displayName: 'Supervisor',
      description:
        'Assigns/reassigns jobs, comments, and attaches documents without changing status',
      isSystem: true,
      isActive: true,
    },
  });

  const desiredNames = [
    ...new Set([
      ...(ROLE_PERMISSIONS[ROLE_NAME] || []),
      ...(ROLE_UI_PERMISSIONS[ROLE_NAME] || []),
    ]),
  ];

  const permissions = await prisma.permission.findMany({
    where: { name: { in: desiredNames } },
    select: { id: true, name: true },
  });

  // Replace role permissions so Supervisor never keeps status-update grants
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
        createdBy: adminUserId,
      })),
      skipDuplicates: true,
    });
  }

  const permissionCount = await prisma.rolePermission.count({
    where: { roleId: role.id },
  });

  return { role, permissionCount, desiredCount: desiredNames.length };
}

async function main() {
  const email = String(DEFAULT_EMAIL).trim().toLowerCase();
  console.log(`Setting ${email} → ${ROLE_NAME}`);

  const admin =
    (await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } })) ||
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } }));
  if (!admin) throw new Error('No ADMIN user found');

  const ensured = await ensureSupervisorRole(admin.id);
  console.log(
    `Role ready: id=${ensured.role.id}, permissions=${ensured.permissionCount}/${ensured.desiredCount}`,
  );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: ROLE_NAME,
      roleId: ensured.role.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleId: true,
    },
  });

  console.log('Updated user:', updated);
  console.log('Ask the user to log out and log back in.');
}

main()
  .catch((error) => {
    console.error('Failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
