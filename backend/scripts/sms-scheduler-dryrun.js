#!/usr/bin/env node
/**
 * Dry-run the SMS scheduler against real data. Sends NOTHING and writes NOTHING —
 * the MNotify call, the dispatch log, and the rate limiter are all stubbed.
 *
 *   node scripts/sms-scheduler-dryrun.js
 *       what the current configuration would send on the next scan
 *
 *   node scripts/sms-scheduler-dryrun.js --assume-all-on
 *       blast-radius estimate: pretend master + every event toggle are ON.
 *       Use this to size what an accidental "everything enabled" state costs.
 *
 * Options: --cap N (per-run cap for the simulation, default 100000)
 */
const smsService = require('../services/smsService');
const smsRateLimiter = require('../services/smsRateLimiter');
const { prisma } = require('../config/database');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const assumeAllOn = process.argv.includes('--assume-all-on');
const cap = Number(arg('cap', '100000')) || 100000;

// --- Stubs: nothing may leave the process or hit the log table ---
const wouldSend = [];
smsService._sendViaMNotify = async (phone, message) => ({
  success: true,
  messageId: 'dry-run',
  phoneNumber: phone,
  message,
  provider: 'dry-run'
});
smsService._writeDispatchLog = async () => {};
smsService.devMode = false;

const originalSendSms = smsService.sendSms.bind(smsService);
smsService.sendSms = async (opts) => {
  const result = await originalSendSms(opts);
  if (result?.success) {
    wouldSend.push({
      eventKey: opts.eventKey || 'CUSTOM',
      jobId: opts.jobId || null,
      userId: opts.userId || null,
      phone: opts.to
    });
  }
  return result;
};

// The breaker would mask the true blast radius in a simulation.
smsRateLimiter.check = async () => ({
  allowed: true,
  counts: { minute: 0, hour: 0 },
  limits: { perMinute: cap, perHour: cap, perSchedulerRun: cap }
});
smsRateLimiter.record = () => {};
const originalResolveLimits = smsRateLimiter.resolveLimits.bind(smsRateLimiter);
smsRateLimiter.resolveLimits = (map) => ({
  ...originalResolveLimits(map),
  perSchedulerRun: cap
});

if (assumeAllOn) {
  smsService.killSwitchState = () => ({ killed: false });
  smsService.masterState = () => ({ enabled: true, reason: 'simulated master ON' });
  smsService.eventState = () => ({ enabled: true, reason: 'simulated event ON' });
  smsService.isEventEnabled = () => true;
  smsService.isMasterEnabled = () => true;
}

const { runSmsScans } = require('../jobs/smsScheduler');

async function main() {
  console.log(
    `\nSMS scheduler dry run — ${
      assumeAllOn ? 'SIMULATING master + all toggles ON' : 'using the CURRENT configuration'
    }. No SMS will be sent.\n`
  );

  await runSmsScans();

  console.log(`\nWould send ${wouldSend.length} message(s).`);
  if (wouldSend.length) {
    const byEvent = new Map();
    for (const entry of wouldSend) {
      const bucket = byEvent.get(entry.eventKey) || { count: 0, jobs: new Set(), phones: new Set() };
      bucket.count += 1;
      if (entry.jobId) bucket.jobs.add(entry.jobId);
      if (entry.phone) bucket.phones.add(entry.phone);
      byEvent.set(entry.eventKey, bucket);
    }
    console.log('\n  event                                   count   jobs  phones');
    for (const [event, b] of [...byEvent.entries()].sort((a, b2) => b2[1].count - a[1].count)) {
      console.log(
        `  ${event.padEnd(38)}${String(b.count).padStart(7)}${String(b.jobs.size).padStart(7)}${String(
          b.phones.size
        ).padStart(8)}`
      );
    }
  }
  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Dry run failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
