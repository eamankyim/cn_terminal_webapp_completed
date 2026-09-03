/**
 * Periodic SMS scans for ETA, stuck jobs, demurrage, release schedule,
 * release money, and escalations. Runs every 20 minutes via node-cron.
 *
 * lastAssignedAt: set on assignment/reassign. Fallback for older jobs:
 *   JobStatusHistory date for current status, then updatedAt.
 */
const cron = require('node-cron');
const { prisma } = require('../config/database');
const smsService = require('../services/smsService');
const SmsNotificationService = require('../services/smsNotificationService');
const {
  TERMINAL_JOB_STATUSES,
  parseNumber
} = require('../services/smsConfig');

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

function hoursSince(date) {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / MS_HOUR;
}

function daysUntil(date) {
  if (!date) return null;
  return (new Date(date).getTime() - Date.now()) / MS_DAY;
}

function dayBucket(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function getActiveJobs(extraWhere = {}) {
  return prisma.job.findMany({
    where: {
      isDraft: false,
      status: { notIn: ['DELIVERED'] },
      ...extraWhere
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      assignedTo: { select: { id: true, name: true, phone: true, role: true } },
      statusHistory: {
        orderBy: { date: 'desc' },
        take: 5
      }
    },
    take: 500
  });
}

function statusEnteredAt(job) {
  const match = (job.statusHistory || []).find((h) => h.status === job.status);
  return match?.date || job.updatedAt || job.createdAt;
}

function assignedSince(job) {
  return job.lastAssignedAt || statusEnteredAt(job) || job.updatedAt;
}

async function sendStaff(job, message, eventKey, rolesExtra = [], dedupeKey) {
  const results = [];
  if (job.assignedTo?.phone) {
    results.push(
      await smsService.sendSms({
        to: job.assignedTo.phone,
        message,
        eventKey,
        jobId: job.id,
        userId: job.assignedTo.id,
        dedupeKey: `${dedupeKey}:assignee`
      })
    );
  }
  if (rolesExtra.length) {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { in: rolesExtra }, phone: { not: null } },
      select: { id: true, phone: true }
    });
    for (const u of users) {
      if (u.id === job.assignedToId) continue;
      results.push(
        await smsService.sendSms({
          to: u.phone,
          message,
          eventKey,
          jobId: job.id,
          userId: u.id,
          dedupeKey: `${dedupeKey}:role:${u.id}`
        })
      );
    }
  }
  return results;
}

async function processEtaApproaching(jobs, map) {
  const staffOn = smsService.isEventEnabled(map, 'SMS_ETA_APPROACHING');
  const customerOn = smsService.isEventEnabled(map, 'SMS_CUSTOMER_ETA_APPROACHING');
  if (!staffOn && !customerOn) return;

  const warnRaw = smsService.getConfigValue(map, 'SMS_ETA_WARN_DAYS', '7,3');
  const thresholds = String(warnRaw)
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a); // 7 then 3

  for (const job of jobs) {
    if (!job.eta) continue;
    const days = daysUntil(job.eta);
    if (days === null || days < 0) continue;

    for (const threshold of thresholds) {
      // Fire when within threshold days and not more than 1 day past the window start
      if (days <= threshold && days > threshold - 1) {
        if (staffOn) {
          const msg = `CN Terminal: Job ${job.trackingId} ETA in ~${Math.ceil(days)}d.`;
          const roles = threshold <= 3 ? ['SUPERVISOR'] : [];
          await sendStaff(
            job,
            msg,
            'SMS_ETA_APPROACHING',
            roles,
            `SMS_ETA_APPROACHING:${job.id}:${threshold}d:${dayBucket(job.eta)}`
          );
        }

        // Customer ETA approaching (default OFF) — independent of staff toggle
        if (customerOn && job.customer?.phone) {
          await smsService.sendSms({
            to: job.customer.phone,
            message: `CN Terminal: Your shipment ${job.trackingId} ETA is in ~${Math.ceil(days)} day(s).`,
            eventKey: 'SMS_CUSTOMER_ETA_APPROACHING',
            jobId: job.id,
            dedupeKey: `SMS_CUSTOMER_ETA_APPROACHING:${job.id}:${threshold}d:${dayBucket(job.eta)}`
          });
        }
      }
    }
  }
}

async function processEtaOverdue(jobs, map) {
  const staffOn = smsService.isEventEnabled(map, 'SMS_ETA_OVERDUE');
  const customerOn = smsService.isEventEnabled(map, 'SMS_CUSTOMER_ETA_OVERDUE');
  if (!staffOn && !customerOn) return;

  const repeatH = parseNumber(
    smsService.getConfigValue(map, 'SMS_ETA_OVERDUE_REPEAT_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    if (!job.eta) continue;
    if (daysUntil(job.eta) >= 0) continue;

    const overdueDays = Math.ceil(Math.abs(daysUntil(job.eta)));

    if (staffOn) {
      const last = await smsService.lastSentAt('SMS_ETA_OVERDUE', job.id);
      if (!(last && hoursSince(last) < repeatH)) {
        const msg = `CN Terminal: Job ${job.trackingId} ETA overdue by ${overdueDays}d.`;
        await sendStaff(
          job,
          msg,
          'SMS_ETA_OVERDUE',
          ['SUPERVISOR'],
          `SMS_ETA_OVERDUE:${job.id}:${dayBucket()}`
        );
      }
    }

    // Customer ETA overdue (default OFF) — independent of staff toggle
    if (customerOn && job.customer?.phone) {
      const lastCustomer = await smsService.lastSentAt('SMS_CUSTOMER_ETA_OVERDUE', job.id);
      if (!(lastCustomer && hoursSince(lastCustomer) < repeatH)) {
        await smsService.sendSms({
          to: job.customer.phone,
          message: `CN Terminal: Job ${job.trackingId} ETA has passed. We are following up.`,
          eventKey: 'SMS_CUSTOMER_ETA_OVERDUE',
          jobId: job.id,
          dedupeKey: `SMS_CUSTOMER_ETA_OVERDUE:${job.id}:${dayBucket()}`
        });
      }
    }
  }
}

async function processStuckAssignee(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_STUCK_ASSIGNEE')) return;
  const stuckH = parseNumber(
    smsService.getConfigValue(map, 'SMS_STUCK_ASSIGNEE_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    if (TERMINAL_JOB_STATUSES.has(job.status)) continue;
    const since = assignedSince(job);
    if (hoursSince(since) < stuckH) continue;

    const last = await smsService.lastSentAt('SMS_STUCK_ASSIGNEE', job.id);
    if (last && hoursSince(last) < stuckH) continue;

    const msg = `CN Terminal: Job ${job.trackingId} stuck with you >${stuckH}h. Please update.`;
    await sendStaff(
      job,
      msg,
      'SMS_STUCK_ASSIGNEE',
      ['SUPERVISOR'],
      `SMS_STUCK_ASSIGNEE:${job.id}:${dayBucket()}`
    );
  }
}

async function processStuckStatus(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_STUCK_STATUS')) return;
  let sla = {};
  try {
    const raw = smsService.getConfigValue(map, 'SMS_STATUS_SLA_HOURS', '{}');
    sla = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
  } catch {
    sla = {};
  }

  for (const job of jobs) {
    if (TERMINAL_JOB_STATUSES.has(job.status)) continue;
    const limit = parseNumber(sla[job.status], 0);
    if (!limit) continue;
    const entered = statusEnteredAt(job);
    if (hoursSince(entered) < limit) continue;

    const last = await smsService.lastSentAt('SMS_STUCK_STATUS', job.id);
    if (last && hoursSince(last) < 24) continue;

    const msg = `CN Terminal: Job ${job.trackingId} in ${job.status} >${limit}h (SLA).`;
    await sendStaff(
      job,
      msg,
      'SMS_STUCK_STATUS',
      ['SUPERVISOR'],
      `SMS_STUCK_STATUS:${job.id}:${job.status}:${dayBucket()}`
    );
  }
}

async function processEscalation(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_ESCALATION')) return;
  const escH = parseNumber(
    smsService.getConfigValue(map, 'SMS_ESCALATION_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    // Escalate if we already sent stuck or overdue SMS and enough time passed
    const stuckAt = await smsService.lastSentAt('SMS_STUCK_STATUS', job.id);
    const overdueAt = await smsService.lastSentAt('SMS_ETA_OVERDUE', job.id);
    const assigneeStuckAt = await smsService.lastSentAt('SMS_STUCK_ASSIGNEE', job.id);
    const triggerAt = [stuckAt, overdueAt, assigneeStuckAt]
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];
    if (!triggerAt) continue;
    if (hoursSince(triggerAt) < escH) continue;

    const lastEsc = await smsService.lastSentAt('SMS_ESCALATION', job.id);
    if (lastEsc && hoursSince(lastEsc) < escH) continue;

    // First escalation wave: SUPERVISOR; if already escalated to supervisor once, go ADMIN
    const priorEscCount = await prisma.smsDispatchLog.count({
      where: { eventKey: 'SMS_ESCALATION', jobId: job.id, status: 'sent' }
    });
    const roles = priorEscCount === 0 ? ['SUPERVISOR'] : ['ADMIN'];
    const msg = `CN Terminal: ESCALATION — Job ${job.trackingId} still stuck/overdue.`;
    await sendStaff(job, msg, 'SMS_ESCALATION', roles, `SMS_ESCALATION:${job.id}:${dayBucket()}:wave${priorEscCount}`);
  }
}

async function processDemurrage(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_DEMURRAGE')) return;

  for (const job of jobs) {
    const atRisk =
      job.demurrageType === 'PASSED_FREE_DAYS' ||
      job.demurrageType === 'DEMURRAGE' ||
      (job.demurrageFreeDays != null &&
        job.demurrageFreeDays <= 2 &&
        ['READY_FOR_RELEASE', 'RELEASED', 'CLEARED'].includes(job.status));

    if (!atRisk) continue;

    const last = await smsService.lastSentAt('SMS_DEMURRAGE', job.id);
    if (last && hoursSince(last) < 24) continue;

    const msg = `CN Terminal: Job ${job.trackingId} demurrage/free days at risk (${job.demurrageType || `${job.demurrageFreeDays}d`}).`;
    await sendStaff(
      job,
      msg,
      'SMS_DEMURRAGE',
      ['SUPERVISOR', 'TRANSPORT_COORDINATOR'],
      `SMS_DEMURRAGE:${job.id}:${dayBucket()}`
    );
  }
}

async function processReleaseScheduleSlipped(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_RELEASE_SCHEDULE_SLIPPED')) return;

  for (const job of jobs) {
    if (job.status !== 'RELEASED' || !job.scheduleTime) continue;
    if (new Date(job.scheduleTime).getTime() > Date.now()) continue;

    const last = await smsService.lastSentAt('SMS_RELEASE_SCHEDULE_SLIPPED', job.id);
    if (last && hoursSince(last) < 12) continue;

    const msg = `CN Terminal: Job ${job.trackingId} release schedule slipped.`;
    await sendStaff(
      job,
      msg,
      'SMS_RELEASE_SCHEDULE_SLIPPED',
      ['TRANSPORT_COORDINATOR'],
      `SMS_RELEASE_SCHEDULE_SLIPPED:${job.id}:${dayBucket()}`
    );
  }
}

async function processReleaseMoney(jobs, map) {
  if (!smsService.isEventEnabled(map, 'SMS_RELEASE_MONEY')) return;
  const delayH = parseNumber(
    smsService.getConfigValue(map, 'SMS_RELEASE_MONEY_DELAY_HOURS', '2'),
    2
  );

  for (const job of jobs) {
    if (!['READY_FOR_RELEASE', 'RELEASED'].includes(job.status)) continue;
    if (job.releaseMoneyReceived === true) continue;
    const entered = statusEnteredAt(job);
    if (hoursSince(entered) < delayH) continue;

    const last = await smsService.lastSentAt('SMS_RELEASE_MONEY', job.id);
    if (last && hoursSince(last) < 24) continue;

    await SmsNotificationService._sendReleaseMoneyAlert(job.id);
  }
}

async function processPaymentReminders(map) {
  if (!smsService.isEventEnabled(map, 'SMS_PAYMENT_REMINDER')) return;

  const overdue = await prisma.invoice.findMany({
    where: {
      status: 'OVERDUE',
      customer: { phone: { not: null } }
    },
    include: { customer: { select: { phone: true, name: true } } },
    take: 100
  });

  for (const inv of overdue) {
    await SmsNotificationService.notifyPaymentReminder(inv);
  }
}

async function runSmsScans() {
  const started = Date.now();
  console.log('📱 [SMS Scheduler] Starting scan…');
  try {
    const map = await smsService._loadConfigMap(true);
    if (!smsService.isMasterEnabled(map)) {
      console.log('📱 [SMS Scheduler] Master SMS_NOTIFICATIONS off — skip');
      return;
    }

    const jobs = await getActiveJobs();
    await processEtaApproaching(jobs, map);
    await processEtaOverdue(jobs, map);
    await processStuckAssignee(jobs, map);
    await processStuckStatus(jobs, map);
    await processEscalation(jobs, map);
    await processDemurrage(jobs, map);
    await processReleaseScheduleSlipped(jobs, map);
    await processReleaseMoney(jobs, map);
    await processPaymentReminders(map);

    console.log(`📱 [SMS Scheduler] Done in ${Date.now() - started}ms (${jobs.length} jobs)`);
  } catch (err) {
    console.error('❌ [SMS Scheduler] Scan failed:', err.message);
  }
}

let started = false;

function startSmsScheduler() {
  if (started) return;
  started = true;

  // Every 20 minutes
  cron.schedule('*/20 * * * *', () => {
    runSmsScans().catch((e) => console.error('❌ [SMS Scheduler]', e.message));
  });

  console.log('📱 [SMS Scheduler] Scheduled every 20 minutes');

  // Optional: light run shortly after boot (60s) so dev mode can be verified
  if (process.env.SMS_SCHEDULER_RUN_ON_BOOT === 'true') {
    setTimeout(() => runSmsScans(), 60_000);
  }
}

module.exports = {
  startSmsScheduler,
  runSmsScans
};
