/**
 * SMS event configuration keys, defaults, and helpers.
 * Master toggle SMS_NOTIFICATIONS must be ON for any SMS to send.
 */

const SMS_CATEGORY = 'SMS';

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
 * - Customer milestones (incl. READY_FOR_RELEASE): ON
 * - Risky (customer ETA alerts, comments, payment reminder): OFF
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
  { key: 'SMS_ETA_OVERDUE', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee and supervisors when ETA is overdue (daily)' },
  { key: 'SMS_DEMURRAGE', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when demurrage / free days are at risk' },
  { key: 'SMS_RELEASE_SCHEDULE_SLIPPED', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when release schedule time has passed' },
  { key: 'SMS_STUCK_ASSIGNEE', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Nudge assignee when job stuck with them too long' },
  { key: 'SMS_STUCK_STATUS', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when job stuck in a status beyond SLA' },
  { key: 'SMS_ESCALATION', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Escalate stuck/overdue jobs to SUPERVISOR then ADMIN' },
  { key: 'SMS_REASSIGN_CHURN', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'Alert supervisors when a job is reassigned too often' },
  { key: 'SMS_RELEASE_MONEY', value: 'true', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS when release money has not been marked received' },
  { key: 'SMS_COMMENT_ASSIGNEE', value: 'false', type: 'BOOLEAN', category: SMS_CATEGORY, description: 'SMS assignee when someone else comments (opt-in)' },

  // Customer events
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

const CONSIGNEE_COPY_STATUSES = new Set(['RELEASED', 'CLEARED', 'DELIVERED']);

const TERMINAL_JOB_STATUSES = new Set(['DELIVERED']);

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

function parseNumber(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
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
  SMS_DEFAULT_CONFIGS,
  QUIET_HOURS_EVENTS,
  MNOTIFY_CONFIG_KEYS,
  SENSITIVE_CONFIG_KEYS,
  CUSTOMER_STATUS_EVENT_MAP,
  CONSIGNEE_COPY_STATUSES,
  TERMINAL_JOB_STATUSES,
  parseBoolean,
  parseNumber,
  parseQuietHours,
  getAccraHour,
  isWithinQuietHours,
  isAdminOrIT,
  isMnotifyCredentialKey,
  sanitizeConfigForResponse
};
