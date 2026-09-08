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
const smsRateLimiter = require('../services/smsRateLimiter');
const SmsNotificationService = require('../services/smsNotificationService');
const {
  TERMINAL_JOB_STATUSES,
  parseSlaHours
} = require('../services/smsConfig');

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

/**
 * Per-run send budget. A single scan must never be able to blast the whole job
 * list: when the cap is hit the run stops immediately and logs loudly.
 */
function createRunBudget(cap) {
  return { cap, sent: 0, attempts: 0, stopped: false, blocked: 0 };
}

/**
 * Threshold hours from config, clamped to a sane minimum.
 * A stored 0 (or a blank / non-numeric value) would otherwise mean "no waiting
 * period", i.e. re-alert every single job on every 20-minute scan.
 */
function thresholdHours(raw, fallback, min = 1) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
      console.warn(
        `📱 [SMS Scheduler] Invalid threshold "${raw}" — using ${fallback}h instead`
      );
    }
    return fallback;
  }
  return Math.max(n, min);
}

function countSuccesses(result) {
  if (!result) return 0;
  if (Array.isArray(result)) return result.reduce((n, r) => n + countSuccesses(r), 0);
  return result.success ? 1 : 0;
}

/**
 * Anything that actually reached the provider — delivered or not. Gated results
 * (toggle off, dedupe, rate limited) carry `skipped` and are not attempts.
 */
function countAttempts(result) {
  if (!result) return 0;
  if (Array.isArray(result)) return result.reduce((n, r) => n + countAttempts(r), 0);
  return result.success || !result.skipped ? 1 : 0;
}

function recordResult(budget, result) {
  budget.sent += countSuccesses(result);
  budget.attempts += countAttempts(result);
  return result;
}

function budgetExhausted(budget) {
  if (!budget || budget.cap <= 0) return false;
  if (budget.stopped) return true;
  if (budget.attempts >= budget.cap) {
    budget.stopped = true;
    console.error(
      `🛑 [SMS Scheduler] Per-run cap reached (${budget.attempts}/${budget.cap} messages attempted, ` +
        `${budget.sent} delivered). Stopping this scan. Remaining alerts will be retried next run — ` +
        'raise SMS_MAX_PER_SCHEDULER_RUN only after confirming this is expected.'
    );
    return true;
  }
  return false;
}

/** Send through the run budget so every scheduler message is counted. */
async function budgetedSend(budget, opts) {
  if (budgetExhausted(budget)) {
    budget.blocked += 1;
    return { success: false, skipped: true, reason: 'Scheduler per-run cap reached' };
  }
  return recordResult(budget, await smsService.sendSms(opts));
}

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

function truncSms(msg, max = 160) {
  if (!msg) return '';
  return msg.length > max ? `${msg.slice(0, max - 3)}...` : msg;
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
      consignment: {
        select: { id: true, consigneeName: true, consigneePhone: true }
      },
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

async function sendStaff(budget, job, message, eventKey, rolesExtra = [], dedupeKey) {
  const results = [];
  if (job.assignedTo?.phone) {
    results.push(
      await budgetedSend(budget, {
        to: job.assignedTo.phone,
        message: truncSms(message),
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
      if (budgetExhausted(budget)) break;
      results.push(
        await budgetedSend(budget, {
          to: u.phone,
          message: truncSms(message),
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

async function processEtaApproaching(jobs, map, budget) {
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
    if (budgetExhausted(budget)) return;
    if (!job.eta) continue;
    const days = daysUntil(job.eta);
    if (days === null || days < 0) continue;

    for (const threshold of thresholds) {
      // Fire when within threshold days and not more than 1 day past the window start
      if (days <= threshold && days > threshold - 1) {
        if (staffOn) {
          const ref = SmsNotificationService.formatJobSmsRef(job);
          const msg = `CN Terminal: Job for ${ref} ETA in ~${Math.ceil(days)}d.`;
          const roles = threshold <= 3 ? ['SUPERVISOR'] : [];
          await sendStaff(
            budget,
            job,
            msg,
            'SMS_ETA_APPROACHING',
            roles,
            `SMS_ETA_APPROACHING:${job.id}:${threshold}d:${dayBucket(job.eta)}`
          );
        }

        // Customer ETA approaching (default OFF) — independent of staff toggle
        if (customerOn && job.customer?.phone) {
          await budgetedSend(budget, {
            to: job.customer.phone,
            message: truncSms(
              `CN Terminal: Your shipment for ${SmsNotificationService.formatJobSmsRef(job)} ETA is in ~${Math.ceil(days)} day(s).`
            ),
            eventKey: 'SMS_CUSTOMER_ETA_APPROACHING',
            jobId: job.id,
            dedupeKey: `SMS_CUSTOMER_ETA_APPROACHING:${job.id}:${threshold}d:${dayBucket(job.eta)}`
          });
        }
      }
    }
  }
}

async function processEtaOverdue(jobs, map, budget) {
  const staffOn = smsService.isEventEnabled(map, 'SMS_ETA_OVERDUE');
  const customerOn = smsService.isEventEnabled(map, 'SMS_CUSTOMER_ETA_OVERDUE');
  if (!staffOn && !customerOn) return;

  const repeatH = thresholdHours(
    smsService.getConfigValue(map, 'SMS_ETA_OVERDUE_REPEAT_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    if (!job.eta) continue;
    if (daysUntil(job.eta) >= 0) continue;

    const overdueDays = Math.ceil(Math.abs(daysUntil(job.eta)));

    if (staffOn) {
      const last = await smsService.lastSentAt('SMS_ETA_OVERDUE', job.id);
      if (!(last && hoursSince(last) < repeatH)) {
        const msg = `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} ETA overdue by ${overdueDays}d.`;
        await sendStaff(
          budget,
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
        await budgetedSend(budget, {
          to: job.customer.phone,
          message: truncSms(
            `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} ETA has passed. We are following up.`
          ),
          eventKey: 'SMS_CUSTOMER_ETA_OVERDUE',
          jobId: job.id,
          dedupeKey: `SMS_CUSTOMER_ETA_OVERDUE:${job.id}:${dayBucket()}`
        });
      }
    }
  }
}

async function processStuckAssignee(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_STUCK_ASSIGNEE')) return;
  const stuckH = thresholdHours(
    smsService.getConfigValue(map, 'SMS_STUCK_ASSIGNEE_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    if (TERMINAL_JOB_STATUSES.has(job.status)) continue;
    const since = assignedSince(job);
    if (hoursSince(since) < stuckH) continue;

    const last = await smsService.lastSentAt('SMS_STUCK_ASSIGNEE', job.id);
    if (last && hoursSince(last) < stuckH) continue;

    const msg = `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} stuck with you >${stuckH}h. Please update.`;
    await sendStaff(
      budget,
      job,
      msg,
      'SMS_STUCK_ASSIGNEE',
      ['SUPERVISOR'],
      `SMS_STUCK_ASSIGNEE:${job.id}:${dayBucket()}`
    );
  }
}

async function processStuckStatus(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_STUCK_STATUS')) return;
  // Defensive parse: a corrupt or double-encoded value yields {} (no SLA), not 0.
  const raw = smsService.getConfigValue(map, 'SMS_STATUS_SLA_HOURS', null);
  const sla = parseSlaHours(raw);
  if (Object.keys(sla).length === 0) {
    console.warn(
      '📱 [SMS Scheduler] SMS_STATUS_SLA_HOURS is empty or unparseable — stuck-status SMS skipped'
    );
    return;
  }

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    if (TERMINAL_JOB_STATUSES.has(job.status)) continue;
    const limit = sla[job.status];
    if (!limit || limit <= 0) continue;
    const entered = statusEnteredAt(job);
    if (hoursSince(entered) < limit) continue;

    const last = await smsService.lastSentAt('SMS_STUCK_STATUS', job.id);
    if (last && hoursSince(last) < 24) continue;

    const msg = `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} in ${job.status} >${limit}h (SLA).`;
    await sendStaff(
      budget,
      job,
      msg,
      'SMS_STUCK_STATUS',
      ['SUPERVISOR'],
      `SMS_STUCK_STATUS:${job.id}:${job.status}:${dayBucket()}`
    );
  }
}

async function processEscalation(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_ESCALATION')) return;
  const escH = thresholdHours(
    smsService.getConfigValue(map, 'SMS_ESCALATION_HOURS', '24'),
    24
  );

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
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
    const msg = `CN Terminal: ESCALATION — Job for ${SmsNotificationService.formatJobSmsRef(job)} still stuck/overdue.`;
    await sendStaff(
      budget,
      job,
      msg,
      'SMS_ESCALATION',
      roles,
      `SMS_ESCALATION:${job.id}:${dayBucket()}:wave${priorEscCount}`
    );
  }
}

async function processDemurrage(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_DEMURRAGE')) return;

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    const atRisk =
      job.demurrageType === 'PASSED_FREE_DAYS' ||
      job.demurrageType === 'DEMURRAGE' ||
      (job.demurrageFreeDays != null &&
        job.demurrageFreeDays <= 2 &&
        ['READY_FOR_RELEASE', 'RELEASED', 'CLEARED'].includes(job.status));

    if (!atRisk) continue;

    const last = await smsService.lastSentAt('SMS_DEMURRAGE', job.id);
    if (last && hoursSince(last) < 24) continue;

    const msg = `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} demurrage/free days at risk (${job.demurrageType || `${job.demurrageFreeDays}d`}).`;
    await sendStaff(
      budget,
      job,
      msg,
      'SMS_DEMURRAGE',
      ['SUPERVISOR', 'TRANSPORT_COORDINATOR'],
      `SMS_DEMURRAGE:${job.id}:${dayBucket()}`
    );
  }
}

async function processReleaseScheduleSlipped(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_RELEASE_SCHEDULE_SLIPPED')) return;

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    if (job.status !== 'RELEASED' || !job.scheduleTime) continue;
    if (new Date(job.scheduleTime).getTime() > Date.now()) continue;

    const last = await smsService.lastSentAt('SMS_RELEASE_SCHEDULE_SLIPPED', job.id);
    if (last && hoursSince(last) < 12) continue;

    const msg = `CN Terminal: Job for ${SmsNotificationService.formatJobSmsRef(job)} release schedule slipped.`;
    await sendStaff(
      budget,
      job,
      msg,
      'SMS_RELEASE_SCHEDULE_SLIPPED',
      ['TRANSPORT_COORDINATOR'],
      `SMS_RELEASE_SCHEDULE_SLIPPED:${job.id}:${dayBucket()}`
    );
  }
}

async function processReleaseMoney(jobs, map, budget) {
  if (!smsService.isEventEnabled(map, 'SMS_RELEASE_MONEY')) return;
  const delayH = thresholdHours(
    smsService.getConfigValue(map, 'SMS_RELEASE_MONEY_DELAY_HOURS', '2'),
    2
  );

  for (const job of jobs) {
    if (budgetExhausted(budget)) return;
    if (!['READY_FOR_RELEASE', 'RELEASED'].includes(job.status)) continue;
    if (job.releaseMoneyReceived === true) continue;
    const entered = statusEnteredAt(job);
    if (hoursSince(entered) < delayH) continue;

    const last = await smsService.lastSentAt('SMS_RELEASE_MONEY', job.id);
    if (last && hoursSince(last) < 24) continue;

    recordResult(budget, await SmsNotificationService._sendReleaseMoneyAlert(job.id));
  }
}

async function processPaymentReminders(map, budget) {
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
    if (budgetExhausted(budget)) return;
    recordResult(budget, await SmsNotificationService.notifyPaymentReminder(inv));
  }
}

async function runSmsScans() {
  const started = Date.now();
  console.log('📱 [SMS Scheduler] Starting scan…');
  try {
    const map = await smsService._loadConfigMap(true);

    // Hard gates before touching any job: kill switch, then explicit master ON.
    const kill = smsService.killSwitchState(map);
    if (kill.killed) {
      console.warn(`📱 [SMS Scheduler] ${kill.reason} — scan aborted, nothing sent`);
      return;
    }

    const master = smsService.masterState(map);
    if (!master.enabled) {
      console.log(`📱 [SMS Scheduler] ${master.reason} — scan aborted, nothing sent`);
      return;
    }

    const budget = createRunBudget(smsRateLimiter.resolveLimits(map).perSchedulerRun);

    const jobs = await getActiveJobs();
    await processEtaApproaching(jobs, map, budget);
    await processEtaOverdue(jobs, map, budget);
    await processStuckAssignee(jobs, map, budget);
    await processStuckStatus(jobs, map, budget);
    await processEscalation(jobs, map, budget);
    await processDemurrage(jobs, map, budget);
    await processReleaseScheduleSlipped(jobs, map, budget);
    await processReleaseMoney(jobs, map, budget);
    await processPaymentReminders(map, budget);

    console.log(
      `📱 [SMS Scheduler] Done in ${Date.now() - started}ms — ${jobs.length} jobs scanned, ` +
        `${budget.sent} SMS sent, ${budget.attempts}/${budget.cap} of the per-run cap used` +
        (budget.stopped ? `, ${budget.blocked} blocked by the cap` : '')
    );
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
