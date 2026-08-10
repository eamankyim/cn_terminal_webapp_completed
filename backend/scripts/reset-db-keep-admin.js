/**
 * Reset CN Terminal DB: wipe business data, keep RBAC + one superadmin.
 *
 * Usage (from backend/):
 *   npm run db:reset-keep-admin -- --yes
 *   CONFIRM_RESET=yes npm run db:reset-keep-admin
 *
 * Database URL (first match wins):
 *   1. DATABASE_URL already set in the process environment (export before npm)
 *   2. DATABASE_URL_UNPOOLED / DIRECT_URL from backend/.env (preferred for Neon
 *      interactive transactions — avoids PgBouncer pooler)
 *   3. DATABASE_URL from backend/.env
 *
 * Point at production explicitly:
 *   DATABASE_URL='postgresql://…' npm run db:reset-keep-admin -- --yes
 *   # or set DATABASE_URL_UNPOOLED in backend/.env to the Neon direct (non-pooler) URL
 *
 * Optional env:
 *   ADMIN_PASSWORD  – only used if recreating admin@cnterminal.com (existing hash is kept)
 *
 * Safety: refuses to run unless --yes is passed or CONFIRM_RESET=yes.
 */
const path = require('path');

// Capture shell exports before dotenv (dotenv does not override existing keys by default,
// but we still need to know whether DATABASE_URL came from the shell vs .env).
const shellDatabaseUrl = process.env.DATABASE_URL;
const shellUnpooledUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || undefined;
const shellResetUrl = process.env.RESET_DATABASE_URL;

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@cnterminal.com';
const DEFAULT_ADMIN_PASSWORD = '111111@1A';
const DEFAULT_ADMIN_NAME = 'System Administrator';

const CONNECT_ATTEMPTS = 5;
const CONNECT_RETRY_MS = 3000;

function isPoolerUrl(url) {
  return /(-pooler\.|pgbouncer=true)/i.test(url || '');
}

/**
 * Prefer a direct (non-pooler) Neon URL for long interactive transactions.
 *
 * Priority:
 *   1. RESET_DATABASE_URL (shell or .env)
 *   2. Shell-exported DATABASE_URL (optionally swapped to matching shell unpooled)
 *   3. .env DATABASE_URL_UNPOOLED / DIRECT_URL when DATABASE_URL is a Neon pooler
 *   4. .env DATABASE_URL
 *   5. .env DATABASE_URL_UNPOOLED / DIRECT_URL
 */
function resolveDatabaseUrl() {
  if (shellResetUrl || process.env.RESET_DATABASE_URL) {
    return {
      url: shellResetUrl || process.env.RESET_DATABASE_URL,
      source: 'RESET_DATABASE_URL',
    };
  }

  if (shellDatabaseUrl) {
    if (shellUnpooledUrl && isPoolerUrl(shellDatabaseUrl)) {
      return { url: shellUnpooledUrl, source: 'shell DATABASE_URL_UNPOOLED/DIRECT_URL' };
    }
    return { url: shellDatabaseUrl, source: 'shell DATABASE_URL' };
  }

  const pooled = process.env.DATABASE_URL || '';
  const unpooled =
    process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || '';

  if (pooled && unpooled && isPoolerUrl(pooled)) {
    return {
      url: unpooled,
      source: process.env.DATABASE_URL_UNPOOLED
        ? 'DATABASE_URL_UNPOOLED (.env)'
        : 'DIRECT_URL (.env)',
    };
  }

  if (pooled) {
    return { url: pooled, source: 'DATABASE_URL (.env)' };
  }

  if (unpooled) {
    return {
      url: unpooled,
      source: process.env.DATABASE_URL_UNPOOLED
        ? 'DATABASE_URL_UNPOOLED (.env)'
        : 'DIRECT_URL (.env)',
    };
  }

  return { url: '', source: '(none)' };
}

function redactHost(databaseUrl) {
  try {
    return new URL(databaseUrl).host;
  } catch {
    return '(unparseable)';
  }
}

function isConfirmed() {
  const args = process.argv.slice(2);
  if (args.includes('--yes') || args.includes('-y')) return true;
  const env = (process.env.CONFIRM_RESET || '').trim().toLowerCase();
  return env === 'yes' || env === 'true' || env === '1';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withConnectRetry(label, fn) {
  let lastError;
  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = error?.message || String(error);
      const unreachable =
        /Can't reach database server|P1001|ECONNREFUSED|ETIMEDOUT|connection.*timed out/i.test(
          msg
        );
      if (!unreachable || attempt === CONNECT_ATTEMPTS) {
        throw error;
      }
      console.warn(
        `  ${label}: connection failed (attempt ${attempt}/${CONNECT_ATTEMPTS}): ${msg.split('\n')[0]}`
      );
      console.warn(`  Retrying in ${CONNECT_RETRY_MS}ms (Neon may be waking)…`);
      await sleep(CONNECT_RETRY_MS);
    }
  }
  throw lastError;
}

async function resolveSuperadmin(prisma) {
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

async function ensureSuperadmin(prisma) {
  const resolved = await resolveSuperadmin(prisma);
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
  console.log(
    '  Password set from',
    process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : 'default (create-admin.js)'
  );
  return { user, source: 'created', created: true, passwordPlain: password };
}

async function resetDatabase() {
  const { url: databaseUrl, source: urlSource } = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      'No database URL found. Set DATABASE_URL (or DATABASE_URL_UNPOOLED / DIRECT_URL / RESET_DATABASE_URL).'
    );
  }

  // Ensure Prisma Client uses the resolved URL (unpooled when preferred).
  process.env.DATABASE_URL = databaseUrl;

  if (!isConfirmed()) {
    console.error('❌ Refusing to run without confirmation.');
    console.error('   Pass --yes or set CONFIRM_RESET=yes');
    console.error('');
    console.error('   Examples:');
    console.error('     npm run db:reset-keep-admin -- --yes');
    console.error('     CONFIRM_RESET=yes npm run db:reset-keep-admin');
    console.error(
      "     DATABASE_URL='postgresql://…' npm run db:reset-keep-admin -- --yes"
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  console.log('⚠️  Destructive reset starting…');
  console.log('   URL source:', urlSource);
  console.log('   DATABASE_URL host:', redactHost(databaseUrl));
  console.log('');

  try {
    console.log('Checking database connectivity…');
    await withConnectRetry('connect', () => prisma.$queryRaw`SELECT 1`);
    console.log('  Connected.');
    console.log('');

    // Resolve / create admin BEFORE wiping so RolePermission.createdBy can be reassigned.
    console.log('Resolving superadmin…');
    const { user: admin, source, created, passwordPlain } = await withConnectRetry(
      'resolve-admin',
      () => ensureSuperadmin(prisma)
    );
    console.log(`  Keeping user: ${admin.email} (id=${admin.id}, via ${source})`);
    console.log('');

    const counts = {};

    await prisma.$transaction(
      async (tx) => {
        console.log('Deleting business data (FK-safe order)…');

        // Leaf / dependent tables first
        counts.notifications = (await tx.notification.deleteMany({})).count;
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

        counts.cashflowTransactions = (await tx.cashflowTransaction.deleteMany({}))
          .count;
        console.log(
          `  Deleted cashflow_transactions: ${counts.cashflowTransactions}`
        );

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

        counts.passwordResetTokens = (await tx.passwordResetToken.deleteMany({}))
          .count;
        console.log(
          `  Deleted password_reset_tokens: ${counts.passwordResetTokens}`
        );

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
        console.log(
          `  Reassigned role_permissions.createdBy → admin: ${rpUpdated.count}`
        );

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

    const business = {
      customers: await prisma.customer.count(),
      jobs: await prisma.job.count(),
      invoices: await prisma.invoice.count(),
      estimates: await prisma.estimate.count(),
      consignments: await prisma.consignment.count(),
      enquiries: await prisma.enquiry.count(),
      payments: await prisma.payment.count(),
      notifications: await prisma.notification.count(),
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
    console.log('BUSINESS TABLES (should be 0):');
    for (const [key, value] of Object.entries(business)) {
      console.log(`  ${key}: ${value}`);
    }
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
      console.log(
        'Use reset-admin-password / ADMIN_PASSWORD recreate path if you need a new password.'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n❌ Script failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  });
