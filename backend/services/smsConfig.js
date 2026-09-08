/**
 * SMS event configuration keys, defaults, and helpers.
 *
 * Safety model (fail-closed): nothing sends unless the master switch
 * SMS_NOTIFICATIONS is explicitly stored as "true" and the kill switch
 * SMS_MASTER_KILL is off. Missing, blank, or unparseable values always mean
 * DISABLED — never "fall back to the product default".
 */

const SMS_CATEGORY = 'SMS';

/** Master switch. Must be explicitly "true" in the DB for any event SMS to send. */
const SMS_MASTER_KEY = 'SMS_NOTIFICATIONS';

/** Hard kill switch. When on, every send path is denied — including admin tests. */
const SMS_KILL_SWITCH_KEY = 'SMS_MASTER_KILL';

/** Global throughput guards (circuit breaker). Conservative by design. */
const SMS_RATE_LIMIT_KEYS = {
  perMinute: 'SMS_MAX_PER_MINUTE',
  perHour: 'SMS_MAX_PER_HOUR',
  perSchedulerRun: 'SMS_MAX_PER_SCHEDULER_RUN'
};

const SMS_RATE_LIMIT_DEFAULTS = {
  perMinute: 10,
  perHour: 60,
  perSchedulerRun: 50
};

/** Events that respect quiet hours (SLA / ETA nudges). Assignment & customer milestones do not. */
const QUIET_HOURS_EVENTS = new Set([
  'SMS_ETA_APPROACHING',
  'SMS_ETA_OVERDUE',
  'SMS_DEMURRAGE',
  'SMS_RELEASE_SCHEDULE_SLIPPED',
  'SMS_STUCK_ASSIGNEE',
  'SMS_STUCK_STATUS',
  'SMS_ESCALATION',
  'SMS_RELEASE_MONEY',
  'SMS_CUSTOMER_ETA_APPROACHING',
  'SMS_CUSTOMER_ETA_OVERDUE',
  'SMS_PAYMENT_REMINDER'
]);

/** MNotify credential keys stored in configurations (Admin UI is source of truth). */
const MNOTIFY_CONFIG_KEYS = ['MNOTIFY_API_KEY', 'MNOTIFY_SENDER_ID', 'MNOTIFY_API_URL'];

const SENSITIVE_CONFIG_KEYS = new Set(['MNOTIFY_API_KEY']);

/**
 * Default SMS configurations seeded via /configurations/init.
 * Defaults match product requirements:
 * - Master: false (existing AdminDashboard default)
 * - Staff assignment / ops alerts: ON
 * - Customer milestones (incl. job-created ETA, READY_FOR_RELEASE): ON
 * - Risky (customer ETA approaching/overdue, comments, payment reminder): OFF
 * - MNotify credentials: empty (enter in Admin → SMS Settings)
 */
const SMS_DEFAULT_CONFIGS = [
  // Master
  {
    key: 'SMS_NOTIFICATIONS',
    value: 'false',
    type: 'BOOLEAN',
    category: 'NOTIFICATIONS',
    description: 'Master switch — enable outbound SMS via MNotify'
  },
  {
    key: SMS_KILL_SWITCH_KEY,
    value: 'false',
    type: 'BOOLEAN',
    category: 'NOTIFICATIONS',
    description:
      'Emergency kill switch — when ON, every SMS is blocked including admin tests'
  },

  // Global throughput guards
  {
    key: SMS_RATE_LIMIT_KEYS.perMinute,
    value: String(SMS_RATE_LIMIT_DEFAULTS.perMinute),
    type: 'NUMBER',
    category: SMS_CATEGORY,
    description: 'Hard cap on SMS sent per rolling minute (circuit breaker)'
  },
  {
    key: SMS_RATE_LIMIT_KEYS.perHour,
    value: String(SMS_RATE_LIMIT_DEFAULTS.perHour),
    type: 'NUMBER',
    category: SMS_CATEGORY,
    description: 'Hard cap on SMS sent per rolling hour (circuit breaker)'
  },
  {
    key: SMS_RATE_LIMIT_KEYS.perSchedulerRun,
    value: String(SMS_RATE_LIMIT_DEFAULTS.perSchedulerRun),
    type: 'NUMBER',
    category: SMS_CATEGORY,
    description: 'Hard cap on SMS sent by a single scheduler scan'
  },

  // MNotify provider credentials (Admin / IT Consultant only)
  {
    key: 'MNOTIFY_API_KEY',
    value: '',
    type: 'STRING',
    category: SMS_CATEGORY,
    description: 'MNotify API key (sensitive — set via Admin SMS Settings)'
  },
  {
    key: 'MNOTIFY_SENDER_ID',
    value: '',
    type: 'STRING',
    category: SMS_CATEGORY,
    description: 'MNotify sender ID (max 11 characters)'
  },
  {
    key: 'MNOTIFY_API_URL',
    value: 'https://api.mnotify.com/api/sms/quick',
    type: 'STRING',
    category: SMS_CATEGORY,
    description: 'MNotify quick SMS API URL'
  },

  // Staff events
  { key: 'SMS_JOB_ASSIGNED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS staff when a job is assigned (skip self-assign)' },
  { key: 'SMS_JOB_REASSIGNED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS new and previous assignee on reassignment' },
  { key: 'SMS_STAFF_STAGE_HANDOFF', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS new assignee when status advances and assignee changes' },
  { key: 'SMS_STATUS_REVERTED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee and supervisors when status is reverted' },
  { key: 'SMS_ETA_APPROACHING', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee (and supervisor at 3d) when ETA approaches' },
  { key: 'SMS_ETA_OVERDUE', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee and supervisors when ETA is overdue (daily) (default OFF — high-volume cron event)' },
  { key: 'SMS_DEMURRAGE', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when demurrage / free days are at risk' },
  { key: 'SMS_RELEASE_SCHEDULE_SLIPPED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when release schedule time has passed' },
  { key: 'SMS_STUCK_ASSIGNEE', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Nudge assignee when job stuck with them too long (default OFF — high-volume cron event)' },
  { key: 'SMS_STUCK_STATUS', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when job stuck in a status beyond SLA (default OFF — high-volume cron event)' },
  { key: 'SMS_ESCALATION', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Escalate stuck/overdue jobs to SUPERVISOR then ADMIN (default OFF — high-volume cron event)' },
  { key: 'SMS_REASSIGN_CHURN', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Alert supervisors when a job is reassigned too often' },
  { key: 'SMS_RELEASE_MONEY', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when release money has not been marked received' },
  { key: 'SMS_COMMENT_ASSIGNEE', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee when someone else comments (opt-in)' },

  // Customer events
  { key: 'SMS_CUSTOMER_JOB_CREATED_ETA', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Job created → customer SMS including ETA (skip if no ETA)' },
  { key: 'SMS_CUSTOMER_ENTRY_COMPLETED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on ENTRY_COMPLETED' },
  { key: 'SMS_CUSTOMER_DUTY_PAID', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on DUTY_PAID' },
  { key: 'SMS_CUSTOMER_READY_FOR_RELEASE', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on READY_FOR_RELEASE' },
  { key: 'SMS_CUSTOMER_RELEASED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on RELEASED' },
  { key: 'SMS_CUSTOMER_CLEARED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on CLEARED' },
  { key: 'SMS_CUSTOMER_DELIVERED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS on DELIVERED' },
  { key: 'SMS_CUSTOMER_CONSIGNEE_COPY', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Also SMS consignee on RELEASED/CLEARED/DELIVERED' },
  { key: 'SMS_CUSTOMER_ETA_APPROACHING', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'ETA approaching → customer (default OFF)' },
  { key: 'SMS_CUSTOMER_ETA_OVERDUE', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'ETA overdue → customer (default OFF — reputation risk)' },
  { key: 'SMS_PAYMENT_REMINDER', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Customer SMS payment reminders (default OFF)' },

  // Thresholds
  { key: 'SMS_ETA_WARN_DAYS', value: '7,3', type: 'STRING', category: SMS_CATEGORY, description: 'ETA approaching thresholds in days (comma-separated)' },
  { key: 'SMS_ETA_OVERDUE_REPEAT_HOURS', value: '24', type: 'NUMBER', category: SMS_CATEGORY, description: 'Hours between ETA overdue reminder SMS' },
  { key: 'SMS_STUCK_ASSIGNEE_HOURS', value: '24', type: 'NUMBER', category: SMS_CATEGORY, description: 'Hours before stuck-with-assignee nudge' },
  {
    key: 'SMS_STATUS_SLA_HOURS',
    value: JSON.stringify({
      NEW: 48,
      PREINVOICED: 48,
      INVOICED: 72,
      ENTRY_COMPLETED: 72,
      DUTY_PAID: 48,
      READY_FOR_RELEASE: 48,
      RELEASED: 48,
      CLEARED: 72
    }),
    type: 'JSON',
    category: SMS_CATEGORY,
    description: 'Per-status SLA hours before stuck-status SMS'
  },
  { key: 'SMS_ESCALATION_HOURS', value: '24', type: 'NUMBER', category: SMS_CATEGORY, description: 'Hours after first stuck/overdue nudge before escalation' },
  { key: 'SMS_REASSIGN_CHURN_COUNT', value: '3', type: 'NUMBER', category: SMS_CATEGORY, description: 'Reassignments in 24h that trigger churn alert' },
  { key: 'SMS_RELEASE_MONEY_DELAY_HOURS', value: '2', type: 'NUMBER', category: SMS_CATEGORY, description: 'Hours after READY_FOR_RELEASE/RELEASED before release-money SMS' },
  { key: 'SMS_QUIET_HOURS', value: '21-7', type: 'STRING', category: SMS_CATEGORY, description: 'Quiet hours in Africa/Accra (e.g. 21-7). Applies to SLA/ETA nudges only' },
  { key: 'SMS_INCLUDE_ADMIN_ON_REVERT', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Also SMS ADMIN on status revert (in addition to SUPERVISOR)' }
];

const CUSTOMER_STATUS_EVENT_MAP = {
  ENTRY_COMPLETED: 'SMS_CUSTOMER_ENTRY_COMPLETED',
  DUTY_PAID: 'SMS_CUSTOMER_DUTY_PAID',
  READY_FOR_RELEASE: 'SMS_CUSTOMER_READY_FOR_RELEASE',
  RELEASED: 'SMS_CUSTOMER_RELEASED',
  CLEARED: 'SMS_CUSTOMER_CLEARED',
  DELIVERED: 'SMS_CUSTOMER_DELIVERED'
};

/** Lookup map of seeded default values (string form, as stored in DB). */
const SMS_DEFAULT_VALUE_MAP = Object.fromEntries(
  SMS_DEFAULT_CONFIGS.map((c) => [c.key, c.value])
);

/**
 * Every BOOLEAN key that gates an outbound SMS. These are NEVER defaulted at
 * runtime: a missing row means "not configured" which means "do not send".
 * Only non-gating keys (thresholds, quiet hours, URLs) may fall back to defaults.
 */
const SMS_TOGGLE_KEYS = new Set(
  SMS_DEFAULT_CONFIGS.filter((c) => c.type === 'BOOLEAN').map((c) => c.key)
);

function isSmsToggleKey(key) {
  return SMS_TOGGLE_KEYS.has(key);
}

/**
 * Default config value for NON-GATING keys only (thresholds, quiet hours, URLs).
 * Returns the fallback for toggles so a missing toggle can never enable sending.
 */
function getSmsDefaultValue(key, fallback = null) {
  if (isSmsToggleKey(key)) return fallback;
  if (Object.prototype.hasOwnProperty.call(SMS_DEFAULT_VALUE_MAP, key)) {
    return SMS_DEFAULT_VALUE_MAP[key];
  }
  return fallback;
}

const CONSIGNEE_COPY_STATUSES = new Set(['RELEASED', 'CLEARED', 'DELIVERED']);

const TERMINAL_JOB_STATUSES = new Set(['DELIVERED']);

function parseBoolean(value, defaultValue = false) {
  const parsed = parseBooleanStrict(value);
  return parsed === null ? defaultValue : parsed;
}

const TRUE_TOKENS = new Set(['true', '1', 'yes', 'y', 'on', 'enabled']);
const FALSE_TOKENS = new Set(['false', '0', 'no', 'n', 'off', 'disabled']);

/**
 * Parse a stored config boolean.
 * Returns true / false, or null when the value is missing or not recognisable.
 * Callers decide what an unparseable value means — for send gating it means OFF.
 */
function parseBooleanStrict(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const s = String(value).toLowerCase().trim().replace(/^"+|"+$/g, '');
  if (s === '') return null;
  if (TRUE_TOKENS.has(s)) return true;
  if (FALSE_TOKENS.has(s)) return false;
  return null;
}

/**
 * Fail-closed gate for an SMS toggle row.
 * A row is enabled only when it exists, is active, and stores an explicit true.
 * Returns { enabled, reason } so callers can log exactly why a send was blocked.
 */
function evaluateToggleRow(row, key) {
  if (!row) {
    return { enabled: false, reason: `${key} not configured (missing row → disabled)` };
  }
  if (row.isActive === false) {
    return { enabled: false, reason: `${key} row is inactive` };
  }
  const parsed = parseBooleanStrict(row.value);
  if (parsed === null) {
    return {
      enabled: false,
      reason: `${key} has an unparseable value (${JSON.stringify(row.value)}) → disabled`
    };
  }
  return parsed
    ? { enabled: true, reason: `${key} enabled` }
    : { enabled: false, reason: `${key} disabled` };
}

function parseNumber(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

/**
 * Positive integer config value (rate limits, caps). Invalid → default.
 */
function parsePositiveInt(value, defaultValue) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 0) return defaultValue;
  return n;
}

/**
 * Parse per-status SLA hours defensively.
 *
 * Tolerates values that were stored double-encoded (a JSON string containing a
 * JSON string, e.g. "\"{\\n \\\"NEW\\\": 48}\"") by unwrapping repeatedly, and
 * drops any entry that is not a positive number so a corrupt row can never make
 * every job look like an SLA breach.
 */
function parseSlaHours(raw) {
  let current = raw;
  for (let i = 0; i < 5; i += 1) {
    if (current === null || current === undefined || current === '') return {};
    if (typeof current === 'object') break;
    try {
      current = JSON.parse(String(current));
    } catch {
      return {};
    }
  }
  if (!current || typeof current !== 'object' || Array.isArray(current)) return {};

  const out = {};
  for (const [status, value] of Object.entries(current)) {
    const hours = Number(value);
    if (Number.isFinite(hours) && hours > 0) {
      out[status] = hours;
    }
  }
  return out;
}

/**
 * Parse quiet hours string like "21-7" into { startHour, endHour } (0-23).
 * Cross-midnight ranges (start > end) are supported.
 */
function parseQuietHours(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) return null;
  const startHour = parseInt(m[1], 10);
  const endHour = parseInt(m[2], 10);
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) return null;
  return { startHour, endHour };
}

/**
 * Current hour in Africa/Accra (0-23).
 */
function getAccraHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    hour: 'numeric',
    hour12: false
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour');
  return parseInt(hourPart?.value || '0', 10);
}

function isWithinQuietHours(quietSpec, date = new Date()) {
  if (!quietSpec) return false;
  const hour = getAccraHour(date);
  const { startHour, endHour } = quietSpec;
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  // Cross midnight e.g. 21-7
  return hour >= startHour || hour < endHour;
}

function isAdminOrIT(user) {
  return user && ['ADMIN', 'IT_CONSULTANT'].includes(user.role);
}

function isMnotifyCredentialKey(key) {
  return MNOTIFY_CONFIG_KEYS.includes(key);
}

/**
 * Redact sensitive config values for API responses.
 * API key is never returned in cleartext — only isConfigured for admins.
 */
function sanitizeConfigForResponse(config, user) {
  if (!config || !SENSITIVE_CONFIG_KEYS.has(config.key)) return config;
  const hasValue = !!(config.value && String(config.value).trim());
  if (!isAdminOrIT(user)) {
    return { ...config, value: '', isConfigured: false };
  }
  return {
    ...config,
    value: '',
    isConfigured: hasValue
  };
}

module.exports = {
  SMS_CATEGORY,
  SMS_MASTER_KEY,
  SMS_KILL_SWITCH_KEY,
  SMS_RATE_LIMIT_KEYS,
  SMS_RATE_LIMIT_DEFAULTS,
  SMS_DEFAULT_CONFIGS,
  SMS_DEFAULT_VALUE_MAP,
  SMS_TOGGLE_KEYS,
  QUIET_HOURS_EVENTS,
  MNOTIFY_CONFIG_KEYS,
  SENSITIVE_CONFIG_KEYS,
  CUSTOMER_STATUS_EVENT_MAP,
  CONSIGNEE_COPY_STATUSES,
  TERMINAL_JOB_STATUSES,
  parseBoolean,
  parseBooleanStrict,
  evaluateToggleRow,
  parseNumber,
  parsePositiveInt,
  parseSlaHours,
  parseQuietHours,
  getAccraHour,
  isWithinQuietHours,
  isAdminOrIT,
  isMnotifyCredentialKey,
  isSmsToggleKey,
  sanitizeConfigForResponse,
  getSmsDefaultValue
};
