/**
 * High-level SMS event handlers for CN Terminal jobs / invoices.
 * Additive to in-app notifications — never throws into job update flows.
 */
const { prisma } = require('../config/database');
const smsService = require('./smsService');
const {
  CUSTOMER_STATUS_EVENT_MAP,
  CONSIGNEE_COPY_STATUSES,
  parseBoolean,
  parseNumber
} = require('./smsConfig');

const STATUS_LABELS = {
  NEW: 'created',
  PREINVOICED: 'ready for invoicing',
  INVOICED: 'invoiced',
  ENTRY_COMPLETED: 'customs entry completed',
  DUTY_PAID: 'duty paid',
  READY_FOR_RELEASE: 'ready for release',
  RELEASED: 'released from customs',
  CLEARED: 'cleared',
  DELIVERED: 'delivered'
};

function trunc(msg, max = 160) {
  if (!msg) return '';
  return msg.length > max ? `${msg.slice(0, max - 3)}...` : msg;
}

function shortName(value, max = 22) {
  const s = String(value || '').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, Math.max(1, max - 3))}...` : s;
}

/**
 * Compact SMS identity: customer / consignee · container.
 * Does not lead with trackingId unless names and container are all missing.
 */
function formatJobSmsRef(job) {
  const customer = shortName(job?.customer?.name);
  const consignee = shortName(job?.consignment?.consigneeName);
  const container = String(job?.containerNumber || '').trim();

  let parties = customer;
  if (consignee && (!customer || consignee.toLowerCase() !== customer.toLowerCase())) {
    parties = customer ? `${customer} / ${consignee}` : consignee;
  }

  if (parties && container) return `${parties} · ${container}`;
  if (parties) return `${parties} · No container`;
  if (container) return container;
  return job?.trackingId || 'job';
}

function jobHasSmsRelations(job) {
  if (!job || typeof job !== 'object') return false;
  if (job.customer === undefined) return false;
  if (job.consignmentId && job.consignment === undefined) return false;
  return true;
}

async function ensureJobForSms(jobOrId) {
  if (!jobOrId) return null;
  if (typeof jobOrId === 'string') return loadJob(jobOrId);
  if (jobHasSmsRelations(jobOrId)) return jobOrId;
  return jobOrId.id ? loadJob(jobOrId.id) : null;
}

function track(job) {
  return job?.trackingId || job?.id || 'job';
}

/** Short ETA for SMS (Africa/Accra), e.g. "03 Sep 2026". */
function formatEtaForSms(eta) {
  if (!eta) return null;
  try {
    return new Date(eta).toLocaleDateString('en-GB', {
      timeZone: 'Africa/Accra',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return null;
  }
}

async function safe(fn, label) {
  try {
    return await fn();
  } catch (err) {
    console.error(`❌ [SMS:${label}]`, err.message);
    return { success: false, error: err.message };
  }
}

async function getUsersByRoles(roles) {
  if (!roles?.length) return [];
  return prisma.user.findMany({
    where: { isActive: true, role: { in: roles }, phone: { not: null } },
    select: { id: true, name: true, phone: true, role: true }
  });
}

async function getUser(userId) {
  if (!userId) return null;
  return prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, name: true, phone: true, role: true }
  });
}

async function loadJob(jobId) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      consignment: {
        select: { id: true, consigneeName: true, consigneePhone: true }
      },
      assignedTo: { select: { id: true, name: true, phone: true, role: true } }
    }
  });
}

async function sendToPhone({ phone, message, eventKey, jobId, userId, dedupeKey, metadata, skipQuietHours }) {
  if (!phone) {
    console.log(
      `📱 [SMS] skipped — no phone (event=${eventKey || 'n/a'}, job=${jobId || 'n/a'}, user=${userId || 'n/a'})`
    );
    return { success: false, reason: 'No phone', skipped: true };
  }
  return smsService.sendSms({
    to: phone,
    message: trunc(message),
    eventKey,
    jobId,
    userId,
    dedupeKey,
    metadata,
    skipQuietHours
  });
}

async function sendToUser(user, message, eventKey, opts = {}) {
  if (!user) {
    console.log(
      `📱 [SMS] skipped — user not found/inactive (event=${eventKey || 'n/a'}, job=${opts.jobId || 'n/a'})`
    );
    return { success: false, reason: 'User not found or inactive', skipped: true };
  }
  if (!user.phone) {
    console.log(
      `📱 [SMS] skipped — user has no phone (user=${user.id}, name=${user.name || '?'}, event=${eventKey || 'n/a'}, job=${opts.jobId || 'n/a'}). Staff must set phone on their profile (Settings) for assignment SMS.`
    );
    // Persist skip so Admin → SMS Statistics can explain missing assignee SMS
    try {
      await smsService._writeDispatchLog({
        eventKey,
        jobId: opts.jobId || null,
        userId: user.id,
        phone: null,
        dedupeKey:
          opts.dedupeKey ||
          `skip:nophone:${eventKey || 'custom'}:${user.id}:${opts.jobId || 'na'}:${Date.now()}`,
        message: trunc(message),
        status: 'skipped',
        errorMessage: 'User has no phone on profile',
        metadata: {
          ...(opts.metadata && typeof opts.metadata === 'object' ? opts.metadata : {}),
          skipReason: 'User has no phone',
          userName: user.name || null
        }
      });
    } catch (e) {
      // ignore log failures
    }
    return { success: false, reason: 'User has no phone', skipped: true };
  }
  return sendToPhone({
    phone: user.phone,
    message,
    eventKey,
    userId: user.id,
    jobId: opts.jobId,
    dedupeKey: opts.dedupeKey,
    metadata: opts.metadata,
    skipQuietHours: opts.skipQuietHours
  });
}

async function sendToRoles(roles, message, eventKey, opts = {}) {
  const users = await getUsersByRoles(roles);
  const results = [];
  for (const user of users) {
    const dedupeKey = opts.dedupeKey
      ? `${opts.dedupeKey}:user:${user.id}`
      : undefined;
    results.push(await sendToUser(user, message, eventKey, { ...opts, dedupeKey }));
  }
  return results;
}

class SmsNotificationService {
  /**
   * 1. Job assigned — new assignee (skip self-assign)
   */
  static async notifyJobAssigned({ jobId, assignedToId, assignedById }) {
    return safe(async () => {
      if (!assignedToId || assignedToId === assignedById) {
        console.log(
          `📱 [SMS:job-assigned] skipped — self-assign (job=${jobId}, user=${assignedToId})`
        );
        return { skipped: true, reason: 'self-assign' };
      }
      const job = await loadJob(jobId);
      if (!job) {
        console.log(`📱 [SMS:job-assigned] skipped — job not found (${jobId})`);
        return { skipped: true, reason: 'Job not found' };
      }
      const user = await getUser(assignedToId);
      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} assigned to you.`;
      return sendToUser(user, msg, 'SMS_JOB_ASSIGNED', {
        jobId,
        dedupeKey: `SMS_JOB_ASSIGNED:${jobId}:${assignedToId}:${Date.now()}`,
        skipQuietHours: true
      });
    }, 'job-assigned');
  }

  /**
   * 2. Job reassigned — new + previous assignee
   */
  static async notifyJobReassigned({
    jobId,
    newAssigneeId,
    previousAssigneeId,
    assignedById
  }) {
    return safe(async () => {
      const job = await loadJob(jobId);
      if (!job) {
        console.log(`📱 [SMS:job-reassigned] skipped — job not found (${jobId})`);
        return { skipped: true, reason: 'Job not found' };
      }
      const results = [];

      if (newAssigneeId && newAssigneeId !== assignedById) {
        const neu = await getUser(newAssigneeId);
        results.push(
          await sendToUser(
            neu,
            `CN Terminal: Job for ${formatJobSmsRef(job)} reassigned to you.`,
            'SMS_JOB_REASSIGNED',
            {
              jobId,
              dedupeKey: `SMS_JOB_REASSIGNED:new:${jobId}:${newAssigneeId}:${Date.now()}`,
              skipQuietHours: true,
              metadata: { role: 'new_assignee' }
            }
          )
        );
      } else if (newAssigneeId && newAssigneeId === assignedById) {
        console.log(
          `📱 [SMS:job-reassigned] skipped new-assignee SMS — self-reassign (job=${jobId}, user=${newAssigneeId})`
        );
        results.push({ skipped: true, reason: 'self-reassign' });
      } else if (!newAssigneeId) {
        console.log(`📱 [SMS:job-reassigned] skipped new-assignee SMS — no newAssigneeId (job=${jobId})`);
      }

      if (previousAssigneeId && previousAssigneeId !== newAssigneeId) {
        const prev = await getUser(previousAssigneeId);
        results.push(
          await sendToUser(
            prev,
            `CN Terminal: Job for ${formatJobSmsRef(job)} reassigned away from you.`,
            'SMS_JOB_REASSIGNED',
            {
              jobId,
              dedupeKey: `SMS_JOB_REASSIGNED:prev:${jobId}:${previousAssigneeId}:${Date.now()}`,
              skipQuietHours: true,
              metadata: { role: 'previous_assignee' }
            }
          )
        );
      }

      // Churn check (≥N reassigns / 24h)
      await this.checkReassignChurn(jobId);

      console.log(
        `📱 [SMS:job-reassigned] done job=${track(job)} results=${JSON.stringify(
          results.map((r) => ({
            success: r?.success,
            skipped: r?.skipped,
            reason: r?.reason || r?.error || null
          }))
        )}`
      );
      return results;
    }, 'job-reassigned');
  }

  /**
   * 3. Staff stage handoff — status advanced AND assignee changed → new assignee
   */
  static async notifyStageHandoff({ jobId, newStatus, newAssigneeId, assignedById }) {
    return safe(async () => {
      if (!newAssigneeId || newAssigneeId === assignedById) return { skipped: true };
      const job = await loadJob(jobId);
      if (!job) return { skipped: true };
      const user = await getUser(newAssigneeId);
      const label = STATUS_LABELS[newStatus] || newStatus;
      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} → ${label}. Now assigned to you.`;
      return sendToUser(user, msg, 'SMS_STAFF_STAGE_HANDOFF', {
        jobId,
        dedupeKey: `SMS_STAFF_STAGE_HANDOFF:${jobId}:${newStatus}:${newAssigneeId}`,
        skipQuietHours: true
      });
    }, 'stage-handoff');
  }

  /**
   * 4. Status reverted — assignee + SUPERVISOR (+ ADMIN optional)
   */
  static async notifyStatusReverted({ jobId, oldStatus, newStatus }) {
    return safe(async () => {
      const job = await loadJob(jobId);
      if (!job) return { skipped: true };
      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} reverted ${oldStatus}→${newStatus}.`;
      const results = [];

      if (job.assignedTo) {
        results.push(
          await sendToUser(job.assignedTo, msg, 'SMS_STATUS_REVERTED', {
            jobId,
            dedupeKey: `SMS_STATUS_REVERTED:${jobId}:${oldStatus}:${newStatus}:${Date.now()}`,
            skipQuietHours: true
          })
        );
      }

      const roles = ['SUPERVISOR'];
      const map = await smsService._loadConfigMap();
      if (parseBoolean(smsService.getConfigValue(map, 'SMS_INCLUDE_ADMIN_ON_REVERT', 'true'), true)) {
        roles.push('ADMIN');
      }
      results.push(
        ...(await sendToRoles(roles, msg, 'SMS_STATUS_REVERTED', {
          jobId,
          dedupeKey: `SMS_STATUS_REVERTED:roles:${jobId}:${oldStatus}:${newStatus}:${Date.now()}`,
          skipQuietHours: true
        }))
      );
      return results;
    }, 'status-reverted');
  }

  /**
   * Job created → customer SMS with ETA (skip drafts / missing ETA / missing phone).
   * Fired on real job create and when a draft is submitted — not on later ETA edits.
   */
  static async notifyCustomerJobCreatedWithEta(jobOrId) {
    return safe(async () => {
      const job = await ensureJobForSms(jobOrId);

      if (!job) {
        console.log('📱 [SMS:job-created-eta] skipped — job not found');
        return { skipped: true, reason: 'Job not found' };
      }
      if (job.isDraft) {
        console.log(`📱 [SMS:job-created-eta] skipped — draft ${track(job)}`);
        return { skipped: true, reason: 'Draft job' };
      }
      if (!job.eta) {
        console.log(`📱 [SMS:job-created-eta] skipped — no ETA on ${track(job)}`);
        return { skipped: true, reason: 'No ETA' };
      }
      if (!job.customer?.phone) {
        console.log(`📱 [SMS:job-created-eta] skipped — no customer phone on ${track(job)}`);
        return { skipped: true, reason: 'No customer phone' };
      }

      const etaLabel = formatEtaForSms(job.eta);
      if (!etaLabel) {
        console.log(`📱 [SMS:job-created-eta] skipped — invalid ETA on ${track(job)}`);
        return { skipped: true, reason: 'Invalid ETA' };
      }

      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)}: created. ETA: ${etaLabel}.`;
      return sendToPhone({
        phone: job.customer.phone,
        message: msg,
        eventKey: 'SMS_CUSTOMER_JOB_CREATED_ETA',
        jobId: job.id,
        dedupeKey: `SMS_CUSTOMER_JOB_CREATED_ETA:${job.id}`,
        skipQuietHours: true
      });
    }, 'job-created-eta');
  }

  /**
   * 15–16. Customer milestone (+ optional consignee copy)
   */
  static async notifyCustomerMilestone(jobOrId, newStatus) {
    return safe(async () => {
      const eventKey = CUSTOMER_STATUS_EVENT_MAP[newStatus];
      if (!eventKey) return { skipped: true, reason: 'Not a customer SMS status' };

      const job = await ensureJobForSms(jobOrId);

      if (!job?.customer?.phone) {
        return { success: false, reason: 'No customer phone' };
      }

      const label = STATUS_LABELS[newStatus] || newStatus;
      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} - ${label}. Thank you.`;
      const results = [];

      results.push(
        await sendToPhone({
          phone: job.customer.phone,
          message: msg,
          eventKey,
          jobId: job.id,
          dedupeKey: `${eventKey}:${job.id}:${newStatus}`,
          skipQuietHours: true
        })
      );

      if (CONSIGNEE_COPY_STATUSES.has(newStatus) && job.consignment?.consigneePhone) {
        const consigneeMsg = `CN Terminal: Shipment for ${formatJobSmsRef(job)} - ${label}.`;
        results.push(
          await sendToPhone({
            phone: job.consignment.consigneePhone,
            message: consigneeMsg,
            eventKey: 'SMS_CUSTOMER_CONSIGNEE_COPY',
            jobId: job.id,
            dedupeKey: `SMS_CUSTOMER_CONSIGNEE_COPY:${job.id}:${newStatus}`,
            skipQuietHours: true
          })
        );
      }

      return results;
    }, 'customer-milestone');
  }

  /**
   * 14. Comment to assignee (opt-in)
   */
  static async notifyCommentToAssignee({ jobId, commenterId, commentPreview }) {
    return safe(async () => {
      const job = await loadJob(jobId);
      if (!job?.assignedToId) return { skipped: true };
      if (job.assignedToId === commenterId) return { skipped: true, reason: 'self-comment' };
      const snippet = (commentPreview || '').trim().slice(0, 60);
      const msg = `CN Terminal: New comment on job for ${formatJobSmsRef(job)}${snippet ? `: ${snippet}` : ''}`;
      return sendToUser(job.assignedTo, msg, 'SMS_COMMENT_ASSIGNEE', {
        jobId,
        dedupeKey: `SMS_COMMENT_ASSIGNEE:${jobId}:${commenterId}:${Date.now()}`,
        skipQuietHours: true
      });
    }, 'comment-assignee');
  }

  /**
   * 12. Reassignment churn — ≥N reassigns / 24h → SUPERVISOR
   */
  static async checkReassignChurn(jobId) {
    return safe(async () => {
      const map = await smsService._loadConfigMap();
      if (!smsService.isEventEnabled(map, 'SMS_REASSIGN_CHURN')) {
        return { skipped: true };
      }
      const threshold = parseNumber(
        smsService.getConfigValue(map, 'SMS_REASSIGN_CHURN_COUNT', '3'),
        3
      );
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await prisma.jobComment.count({
        where: {
          jobId,
          createdAt: { gte: since },
          comment: { startsWith: 'Reassigned from' }
        }
      });
      if (count < threshold) return { skipped: true, count };

      const job = await loadJob(jobId);
      if (!job) return { skipped: true };
      const dayKey = new Date().toISOString().slice(0, 10);
      const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} reassigned ${count}x in 24h. Review.`;
      return sendToRoles(['SUPERVISOR'], msg, 'SMS_REASSIGN_CHURN', {
        jobId,
        dedupeKey: `SMS_REASSIGN_CHURN:${jobId}:${dayKey}`,
        skipQuietHours: true
      });
    }, 'reassign-churn');
  }

  /**
   * 13. Immediate release-money hint when entering READY_FOR_RELEASE/RELEASED with money not received.
   * Cron also handles delayed nudges.
   */
  static async notifyReleaseMoneyImmediate({ jobId, releaseMoneyReceived }) {
    return safe(async () => {
      if (releaseMoneyReceived === true) return { skipped: true };
      // Immediate path is optional — cron owns the delay. No-op here unless delay is 0.
      const map = await smsService._loadConfigMap();
      const delayH = parseNumber(
        smsService.getConfigValue(map, 'SMS_RELEASE_MONEY_DELAY_HOURS', '2'),
        2
      );
      if (delayH > 0) return { skipped: true, reason: 'Handled by cron' };
      return this._sendReleaseMoneyAlert(jobId);
    }, 'release-money-immediate');
  }

  static async _sendReleaseMoneyAlert(jobId) {
    const job = await loadJob(jobId);
    if (!job || job.releaseMoneyReceived === true) return { skipped: true };
    if (!['READY_FOR_RELEASE', 'RELEASED'].includes(job.status)) return { skipped: true };

    const msg = `CN Terminal: Job for ${formatJobSmsRef(job)} — release money not marked received.`;
    const results = [];
    if (job.assignedTo) {
      results.push(
        await sendToUser(job.assignedTo, msg, 'SMS_RELEASE_MONEY', {
          jobId,
          dedupeKey: `SMS_RELEASE_MONEY:assignee:${jobId}:${new Date().toISOString().slice(0, 10)}`
        })
      );
    }
    results.push(
      ...(await sendToRoles(
        ['ACCOUNTANT', 'INVOICE_OFFICER', 'SUPERVISOR'],
        msg,
        'SMS_RELEASE_MONEY',
        {
          jobId,
          dedupeKey: `SMS_RELEASE_MONEY:roles:${jobId}:${new Date().toISOString().slice(0, 10)}`
        }
      ))
    );
    return results;
  }

  /**
   * 18. Payment reminder
   */
  static async notifyPaymentReminder(invoice) {
    return safe(async () => {
      if (!invoice?.customer?.phone) {
        return { success: false, reason: 'No phone' };
      }
      const amount =
        typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount;
      const msg = `CN Terminal: Reminder — Invoice ${invoice.invoiceNumber} GHS ${amount} pending.`;
      return sendToPhone({
        phone: invoice.customer.phone,
        message: msg,
        eventKey: 'SMS_PAYMENT_REMINDER',
        dedupeKey: `SMS_PAYMENT_REMINDER:${invoice.id}:${new Date().toISOString().slice(0, 10)}`
      });
    }, 'payment-reminder');
  }

  /**
   * Orchestrate SMS for a status update (customer + handoff + revert + release money).
   */
  static async handleStatusUpdate({
    jobId,
    oldStatus,
    newStatus,
    isRevert,
    previousAssigneeId,
    newAssigneeId,
    updatedById,
    releaseMoneyReceived,
    assigneeChanged
  }) {
    return safe(async () => {
      const results = [];

      if (isRevert) {
        results.push(
          await this.notifyStatusReverted({ jobId, oldStatus, newStatus })
        );
      } else {
        results.push(await this.notifyCustomerMilestone(jobId, newStatus));

        if (assigneeChanged && newAssigneeId) {
          results.push(
            await this.notifyStageHandoff({
              jobId,
              newStatus,
              newAssigneeId,
              assignedById: updatedById
            })
          );
        }

        if (
          ['READY_FOR_RELEASE', 'RELEASED'].includes(newStatus) &&
          releaseMoneyReceived !== true
        ) {
          results.push(
            await this.notifyReleaseMoneyImmediate({ jobId, releaseMoneyReceived })
          );
        }
      }

      // Pure assignment change without stage handoff already covered above;
      // if assignee changed on revert, still notify reassign
      if (assigneeChanged && previousAssigneeId && newAssigneeId && !isRevert) {
        // Stage handoff covers new assignee; also notify previous if different event desired
        // Reassign SMS is for dedicated reassign endpoint; handoff is enough here.
      }

      return results;
    }, 'status-update');
  }

  /**
   * Orchestrate assignment (create / update without status change).
   */
  static async handleAssignment({
    jobId,
    newAssigneeId,
    previousAssigneeId,
    assignedById,
    isReassign
  }) {
    return safe(async () => {
      // Stamp lastAssignedAt
      try {
        await prisma.job.update({
          where: { id: jobId },
          data: { lastAssignedAt: new Date() }
        });
      } catch (e) {
        console.error('❌ [SMS] lastAssignedAt update failed:', e.message);
      }

      if (isReassign || (previousAssigneeId && previousAssigneeId !== newAssigneeId)) {
        return this.notifyJobReassigned({
          jobId,
          newAssigneeId,
          previousAssigneeId,
          assignedById
        });
      }
      return this.notifyJobAssigned({
        jobId,
        assignedToId: newAssigneeId,
        assignedById
      });
    }, 'assignment');
  }
}

SmsNotificationService.formatJobSmsRef = formatJobSmsRef;

module.exports = SmsNotificationService;
