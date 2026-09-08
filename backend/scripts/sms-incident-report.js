#!/usr/bin/env node
/**
 * Forensic report over SmsDispatchLog — what fired, when, and why.
 *
 *   node scripts/sms-incident-report.js              # last 24 hours
 *   node scripts/sms-incident-report.js --hours 72
 *   node scripts/sms-incident-report.js --hours 6 --peaks
 *
 * Read-only: never sends or modifies anything.
 */
const { prisma } = require('../config/database');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function pad(value, width) {
  return String(value).padEnd(width);
}

function padStart(value, width) {
  return String(value).padStart(width);
}

async function main() {
  const hours = Number(arg('hours', '24')) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const showPeaks = process.argv.includes('--peaks');

  console.log(`\nSMS dispatch report — last ${hours}h (since ${since.toISOString()})\n`);

  const rows = await prisma.smsDispatchLog.findMany({
    where: { createdAt: { gte: since } },
    select: {
      eventKey: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      jobId: true,
      phone: true
    },
    orderBy: { createdAt: 'asc' }
  });

  if (rows.length === 0) {
    console.log('No dispatch log rows in this window.\n');
    return;
  }

  const byEvent = new Map();
  const byMinute = new Map();
  const skipReasons = new Map();
  const totals = { sent: 0, failed: 0, skipped: 0 };

  for (const row of rows) {
    const bucket = byEvent.get(row.eventKey) || {
      sent: 0,
      failed: 0,
      skipped: 0,
      jobs: new Set(),
      phones: new Set(),
      first: row.createdAt,
      last: row.createdAt
    };
    if (bucket[row.status] !== undefined) bucket[row.status] += 1;
    if (row.jobId) bucket.jobs.add(row.jobId);
    if (row.phone) bucket.phones.add(row.phone);
    bucket.last = row.createdAt;
    byEvent.set(row.eventKey, bucket);

    if (totals[row.status] !== undefined) totals[row.status] += 1;

    if (row.status === 'sent') {
      const minute = row.createdAt.toISOString().slice(0, 16);
      byMinute.set(minute, (byMinute.get(minute) || 0) + 1);
    }

    if (row.status === 'skipped' && row.errorMessage) {
      skipReasons.set(row.errorMessage, (skipReasons.get(row.errorMessage) || 0) + 1);
    }
  }

  console.log(
    `TOTALS  sent=${totals.sent}  failed=${totals.failed}  skipped=${totals.skipped}  rows=${rows.length}\n`
  );

  console.log('BY EVENT KEY (sorted by sent)');
  console.log(
    `  ${pad('event', 38)}${padStart('sent', 7)}${padStart('fail', 7)}${padStart('skip', 7)}${padStart('jobs', 7)}${padStart('phones', 8)}  window`
  );
  const sorted = [...byEvent.entries()].sort((a, b) => b[1].sent - a[1].sent);
  for (const [event, b] of sorted) {
    const window = `${b.first.toISOString().slice(11, 19)} → ${b.last.toISOString().slice(11, 19)}`;
    console.log(
      `  ${pad(event, 38)}${padStart(b.sent, 7)}${padStart(b.failed, 7)}${padStart(b.skipped, 7)}` +
        `${padStart(b.jobs.size, 7)}${padStart(b.phones.size, 8)}  ${window}`
    );
  }

  const busiest = [...byMinute.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (busiest.length) {
    console.log('\nBUSIEST MINUTES (sent)');
    for (const [minute, count] of busiest) {
      console.log(`  ${minute}Z  ${padStart(count, 5)}  ${'#'.repeat(Math.min(count, 60))}`);
    }
  }

  if (showPeaks) {
    console.log('\nPER-MINUTE TIMELINE (sent)');
    for (const [minute, count] of [...byMinute.entries()].sort()) {
      console.log(`  ${minute}Z  ${padStart(count, 5)}`);
    }
  }

  if (skipReasons.size) {
    console.log('\nSKIP REASONS');
    for (const [reason, count] of [...skipReasons.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${padStart(count, 6)}  ${reason}`);
    }
  }

  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Report failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
