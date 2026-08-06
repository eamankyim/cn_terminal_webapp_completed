/**
 * Reset CN Terminal DB: wipe business data, keep RBAC + one superadmin.
 *
 * Usage (from backend/):
 *   npm run db:reset-keep-admin -- --yes
 *   CONFIRM_RESET=yes npm run db:reset-keep-admin
 *
 * Optional env:
 *   ADMIN_PASSWORD  – only used if recreating admin@cnterminal.com (existing hash is kept)
 *
 * Safety: refuses to run unless --yes is passed or CONFIRM_RESET=yes.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@cnterminal.com';
const DEFAULT_ADMIN_PASSWORD = '111111@1A';
const DEFAULT_ADMIN_NAME = 'System Administrator';

function isConfirmed() {
  const args = process.argv.slice(2);
  if (args.includes('--yes') || args.includes('-y')) return true;
  const env = (process.env.CONFIRM_RESET || '').trim().toLowerCase();
  return env === 'yes' || env === 'true' || env === '1';
}

async function resolveSuperadmin() {
  const byEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  if (byEmail) {
    return { user: byEmail, source: 'email', created: false };
  }

  const byEnum = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });
  if (byEnum) {
    return { user: byEnum, source: 'role-enum', created: false };
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const byRoleId = await prisma.user.findFirst({
      where: { roleId: adminRole.id },
      orderBy: { createdAt: 'asc' },
    });
    if (byRoleId) {
      return { user: byRoleId, source: 'role-id', created: false };
    }
  }

  return { user: null, source: null, created: false };
}

async function ensureSuperadmin() {
  const resolved = await resolveSuperadmin();
  if (resolved.user) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const updates = {};
    if (resolved.user.role !== 'ADMIN') updates.role = 'ADMIN';
    if (adminRole && resolved.user.roleId !== adminRole.id) updates.roleId = adminRole.id;
    if (!resolved.user.isActive) updates.isActive = true;

    let user = resolved.user;
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: resolved.user.id },
        data: updates,
      });
      console.log('  Updated superadmin fields:', updates);
    }
    return { user, source: resolved.source, created: false };
  }

  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 12);
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

  const user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: DEFAULT_ADMIN_NAME,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      roleId: adminRole?.id ?? null,
    },
  });

  console.log('  Created superadmin:', ADMIN_EMAIL);
  console.log('  Password set from', process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : 'default (create-admin.js)');
  return { user, source: 'created', created: true, passwordPlain: password };
}

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Ensure backend/.env is loaded.');
  }

  if (!isConfirmed()) {
    console.error('❌ Refusing to run without confirmation.');
    console.error('   Pass --yes or set CONFIRM_RESET=yes');
    console.error('');
    console.error('   Examples:');
    console.error('     npm run db:reset-keep-admin -- --yes');
    console.error('     CONFIRM_RESET=yes npm run db:reset-keep-admin');
    process.exit(1);
  }

  console.log('⚠️  Destructive reset starting…');
  console.log('   DATABASE_URL host:', (() => {
    try {
      return new URL(process.env.DATABASE_URL).host;
    } catch {
      return '(unparseable)';
    }
  })());
  console.log('');

  // Resolve / create admin BEFORE wiping so RolePermission.createdBy can be reassigned.
  console.log('Resolving superadmin…');
  const { user: admin, source, created, passwordPlain } = await ensureSuperadmin();
  console.log('  Keeping user:', admin.email, `(id=${admin.id}, via ${source})`);
  console.log('');

  const counts = {};

  await prisma.$transaction(
    async (tx) => {
      console.log('Deleting business data (FK-safe order)…');

      // Leaf / dependent tables first
      counts.notifications = (
        await tx.notification.deleteMany({})
      ).count;
      console.log(`  Deleted notifications: ${counts.notifications}`);

      counts.payments = (await tx.payment.deleteMany({})).count;
      console.log(`  Deleted payments: ${counts.payments}`);

      counts.invoices = (await tx.invoice.deleteMany({})).count;
      console.log(`  Deleted invoices: ${counts.invoices}`);

      counts.estimates = (await tx.estimate.deleteMany({})).count;
      console.log(`  Deleted estimates: ${counts.estimates}`);

      counts.jobDocuments = (await tx.jobDocument.deleteMany({})).count;
      console.log(`  Deleted job_documents: ${counts.jobDocuments}`);

      counts.jobComments = (await tx.jobComment.deleteMany({})).count;
      console.log(`  Deleted job_comments: ${counts.jobComments}`);

      counts.jobStatusHistory = (await tx.jobStatusHistory.deleteMany({})).count;
      console.log(`  Deleted job_status_history: ${counts.jobStatusHistory}`);

      counts.cashflowTransactions = (await tx.cashflowTransaction.deleteMany({})).count;
      console.log(`  Deleted cashflow_transactions: ${counts.cashflowTransactions}`);

      counts.expenses = (await tx.expense.deleteMany({})).count;
      console.log(`  Deleted expenses: ${counts.expenses}`);

      counts.expenseRequests = (await tx.expenseRequest.deleteMany({})).count;
      console.log(`  Deleted expense_requests: ${counts.expenseRequests}`);

      counts.payouts = (await tx.payout.deleteMany({})).count;
      console.log(`  Deleted payouts: ${counts.payouts}`);

      counts.payoutRequests = (await tx.payoutRequest.deleteMany({})).count;
      console.log(`  Deleted payout_requests: ${counts.payoutRequests}`);

      counts.jobs = (await tx.job.deleteMany({})).count;
      console.log(`  Deleted jobs: ${counts.jobs}`);

      counts.consignments = (await tx.consignment.deleteMany({})).count;
      console.log(`  Deleted consignments: ${counts.consignments}`);

      counts.enquiries = (await tx.enquiry.deleteMany({})).count;
      console.log(`  Deleted enquiries: ${counts.enquiries}`);

      counts.shipments = (await tx.shipment.deleteMany({})).count;
      console.log(`  Deleted shipments: ${counts.shipments}`);

      counts.customers = (await tx.customer.deleteMany({})).count;
      console.log(`  Deleted customers: ${counts.customers}`);

      counts.invitations = (await tx.invitation.deleteMany({})).count;
      console.log(`  Deleted invitations: ${counts.invitations}`);

      counts.files = (await tx.file.deleteMany({})).count;
      console.log(`  Deleted files: ${counts.files}`);

      counts.passwordResetTokens = (await tx.passwordResetToken.deleteMany({})).count;
      console.log(`  Deleted password_reset_tokens: ${counts.passwordResetTokens}`);

      counts.configurations = (await tx.configuration.deleteMany({})).count;
      console.log(`  Deleted configurations: ${counts.configurations}`);

      // Clear per-user permissions (role_permissions retained)
      counts.userPermissions = (await tx.userPermission.deleteMany({})).count;
      console.log(`  Deleted user_permissions: ${counts.userPermissions}`);

      // RolePermission.createdBy → users; reassign to kept admin so other users can be deleted
      const rpUpdated = await tx.rolePermission.updateMany({
        where: { createdBy: { not: admin.id } },
        data: { createdBy: admin.id },
      });
      console.log(`  Reassigned role_permissions.createdBy → admin: ${rpUpdated.count}`);

      counts.otherUsers = (
        await tx.user.deleteMany({
          where: { id: { not: admin.id } },
        })
      ).count;
      console.log(`  Deleted other users: ${counts.otherUsers}`);
    },
    {
      // Large Neon DBs may need a longer interactive timeout
      maxWait: 60_000,
      timeout: 300_000,
    }
  );

  const kept = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
  };

  console.log('');
  console.log('✅ Reset complete');
  console.log('-----------------------------------');
  console.log('KEPT:');
  console.log(`  users (superadmin):     ${kept.users} → ${admin.email}`);
  console.log(`  roles:                  ${kept.roles}`);
  console.log(`  permissions:            ${kept.permissions}`);
  console.log(`  role_permissions:       ${kept.rolePermissions}`);
  console.log('');
  console.log('DELETED (counts):');
  for (const [key, value] of Object.entries(counts)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('-----------------------------------');

  if (created) {
    console.log('');
    console.log('New superadmin credentials:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${passwordPlain}`);
  } else {
    console.log('');
    console.log(`Superadmin password hash left unchanged for ${admin.email}.`);
    console.log('Use reset-admin-password / ADMIN_PASSWORD recreate path if you need a new password.');
  }
}

resetDatabase()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Script failed:', error.message);
    if (error.stack) console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  });
