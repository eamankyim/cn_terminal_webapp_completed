/**
 * Relink a user to the Invoice Officer role after UI/system permissions were seeded.
 *
 * Usage (inside backend container or with DATABASE_URL set):
 *   node scripts/relink-invoice-officer-user.js
 *   node scripts/relink-invoice-officer-user.js eofoe@cn.com
 *   EMAIL=eofoe@cn.com node scripts/relink-invoice-officer-user.js
 *
 * What it does:
 * 1. Ensures INVOICE_OFFICER role exists
 * 2. Ensures role has resource + UI permissions (same as Preinvoice Officer baseline)
 * 3. Sets the user's role + roleId so login returns the full permission set
 */
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { ROLE_PERMISSIONS } = require('../utils/permissions');
const { ROLE_UI_PERMISSIONS, ALL_UI_PERMISSIONS } = require('../utils/uiPermissions');

const prisma = new PrismaClient();

const ROLE_NAME = 'INVOICE_OFFICER';
const DEFAULT_EMAIL = process.env.EMAIL || process.argv[2] || 'eofoe@cn.com';

async function ensureInvoiceOfficerRole(adminUserId) {
  const role = await prisma.role.upsert({
    where: { name: ROLE_NAME },
    update: {
      displayName: 'Invoice Officer',
      description: 'Issues invoices after pre-invoice and moves jobs to invoiced',
      isSystem: true,
      isActive: true,
    },
    create: {
      name: ROLE_NAME,
      displayName: 'Invoice Officer',
      description: 'Issues invoices after pre-invoice and moves jobs to invoiced',
      isSystem: true,
      isActive: true,
    },
  });

  const desiredNames = [
    ...new Set([
      ...(ROLE_PERMISSIONS[ROLE_NAME] || []),
      ...(ROLE_UI_PERMISSIONS[ROLE_NAME] || ALL_UI_PERMISSIONS),
    ]),
  ];

  const permissions = await prisma.permission.findMany({
    where: { name: { in: desiredNames } },
    select: { id: true, name: true },
  });

  let added = 0;
  for (const permission of permissions) {
    try {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
          createdBy: adminUserId,
        },
      });
      added += 1;
    } catch (_) {
      // already assigned
    }
  }

  const permissionCount = await prisma.rolePermission.count({
    where: { roleId: role.id },
  });

  return { role, added, permissionCount, desiredCount: desiredNames.length };
}

async function relinkUser(email, roleId) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleId: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: ROLE_NAME,
      roleId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleId: true,
      isActive: true,
    },
  });

  return { before: user, after: updated };
}

async function main() {
  const email = String(DEFAULT_EMAIL).trim().toLowerCase();
  console.log(`Relinking ${email} → ${ROLE_NAME}`);

  const admin =
    (await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } })) ||
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } }));

  if (!admin) {
    throw new Error('No ADMIN user found (needed for rolePermission.createdBy)');
  }

  const ensured = await ensureInvoiceOfficerRole(admin.id);
  console.log(
    `Role ${ROLE_NAME}: id=${ensured.role.id}, permissions=${ensured.permissionCount}/${ensured.desiredCount} (added ${ensured.added})`,
  );

  const { before, after } = await relinkUser(email, ensured.role.id);
  console.log('Before:', {
    id: before.id,
    role: before.role,
    roleId: before.roleId,
    isActive: before.isActive,
  });
  console.log('After:', {
    id: after.id,
    name: after.name,
    email: after.email,
    role: after.role,
    roleId: after.roleId,
    isActive: after.isActive,
  });

  console.log(
    `\nDone. Ask ${email} to log out and log back in so the JWT/session picks up the permissions.`,
  );
}

main()
  .catch((error) => {
    console.error('Failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
