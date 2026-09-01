// Centralized status utilities for consistent colors and icons across the app

// Job Status Color Progression (NEW → DELIVERED)
export const getJobStatusColor = (status, isDraft = false) => {
  if (isDraft) {
    return 'default';
  }
  
  const statusColors = {
    'NEW': 'blue',                  // Fresh start - blue for new beginnings
    'PREINVOICED': 'cyan',          // Preparation phase - cyan for preparation
    'INVOICED': 'processing',       // Invoice created - processing blue
    'VETTED': 'purple',             // RETIRED (vetting removed): kept for legacy jobs
    'ENTRY_COMPLETED': 'orange',    // Entry completed - orange for active work
    'DUTY_PAID': 'gold',            // Duty paid - gold for payment
    'READY_FOR_RELEASE': 'geekblue', // Ready for release - geekblue for coordination
    'RELEASED': 'lime',             // Almost complete - lime for near completion
    'CLEARED': 'green',             // Successfully processed - green for success
    'DELIVERED': 'success'          // Final completion - success green for delivery
  };
  
  return statusColors[status] || 'default';
};

// Friendly display labels for job statuses (reports, charts, exports)
export const JOB_STATUS_LABELS = {
  'NEW': 'New',
  'PREINVOICED': 'Pre-invoiced',
  'INVOICED': 'Invoiced',
  'VETTED': 'Vetted (Legacy)',   // RETIRED: legacy jobs only
  'ENTRY_COMPLETED': 'Entry Completed',
  'DUTY_PAID': 'Duty Paid',
  'READY_FOR_RELEASE': 'Ready for Release',
  'RELEASED': 'Released',
  'CLEARED': 'Cleared',
  'DELIVERED': 'Delivered'
};

/** Human-friendly job status label; falls back to Title Case of the raw enum. */
export const formatJobStatusLabel = (status) => {
  if (!status) return 'N/A';
  if (JOB_STATUS_LABELS[status]) return JOB_STATUS_LABELS[status];
  return String(status)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Hex colors for Chart.js canvases (AntD tag names like 'processing' are not valid CSS colors)
const JOB_STATUS_HEX_COLORS = {
  'NEW': '#1890ff',              // blue
  'PREINVOICED': '#13c2c2',      // cyan
  'INVOICED': '#1677ff',         // processing blue
  'VETTED': '#722ed1',           // purple (legacy)
  'ENTRY_COMPLETED': '#fa8c16',  // orange
  'DUTY_PAID': '#faad14',        // gold
  'READY_FOR_RELEASE': '#2f54eb',// geekblue
  'RELEASED': '#a0d911',         // lime
  'CLEARED': '#52c41a',          // green
  'DELIVERED': '#389e0d'         // success green
};

const FALLBACK_CHART_PALETTE = [
  '#1890ff', '#13c2c2', '#722ed1', '#fa8c16', '#52c41a',
  '#eb2f96', '#2f54eb', '#a0d911', '#faad14', '#ff4d4f'
];

/**
 * Chart.js-ready color for a job status. Known statuses use their workflow
 * color; unknown statuses cycle through the fallback palette.
 */
export const getJobStatusHexColor = (status, index = 0) => {
  if (status && JOB_STATUS_HEX_COLORS[status]) return JOB_STATUS_HEX_COLORS[status];
  return FALLBACK_CHART_PALETTE[index % FALLBACK_CHART_PALETTE.length];
};

// Invoice Status Colors
export const getInvoiceStatusColor = (status) => {
  const statusColors = {
    'PENDING': 'orange',     // Waiting for payment
    'PARTIALLY_PAID': 'blue',
    'PAID': 'green',         // Payment received
    'OVERDUE': 'red',        // Payment overdue
    'CANCELLED': 'default',  // Cancelled invoice
    'DRAFT': 'default'       // Draft invoice
  };
  
  return statusColors[status] || 'default';
};

// Customer Status Colors
export const getCustomerStatusColor = (status) => {
  const statusColors = {
    'ACTIVE': 'green',       // Active customer
    'INACTIVE': 'default',   // Inactive customer
    'SUSPENDED': 'red'       // Suspended customer
  };
  
  return statusColors[status] || 'default';
};

// Enquiry Status Colors
export const getEnquiryStatusColor = (status) => {
  const statusColors = {
    'SUBMITTED': 'blue',     // New enquiry
    'UNDER_REVIEW': 'orange', // Being reviewed
    'QUOTED': 'purple',      // Quote provided
    'CLOSED': 'default'      // Closed enquiry
  };
  
  return statusColors[status] || 'default';
};

// Invitation Status Colors
export const getInvitationStatusColor = (status) => {
  const statusColors = {
    'PENDING': 'orange',     // Waiting for response
    'ACCEPTED': 'green',     // Invitation accepted
    'EXPIRED': 'red',        // Invitation expired
    'CANCELLED': 'default'   // Invitation cancelled
  };
  
  return statusColors[status] || 'default';
};

// Job Status Icons
export const getJobStatusIcon = (status, isDraft = false) => {
  if (isDraft) {
    return '📄';
  }
  
  const statusIcons = {
    'NEW': '➕',                     // Plus for new
    'PREINVOICED': '📋',            // Clipboard for preparation
    'INVOICED': '🧾',               // Receipt for invoiced
    'VETTED': '✅',                 // RETIRED (vetting removed): kept for legacy jobs
    'ENTRY_COMPLETED': '📦',        // Package for entry completed
    'DUTY_PAID': '💰',              // Money for duty paid
    'READY_FOR_RELEASE': '🚗',     // Car for transport coordination
    'RELEASED': '🔓',               // Unlock for released
    'CLEARED': '✅',                // Check for cleared
    'DELIVERED': '🚚'               // Truck for delivered
  };
  
  return statusIcons[status] || '📄';
};

// Status Priority (for sorting)
export const getJobStatusPriority = (status) => {
  const priorities = {
    'NEW': 1,
    'PREINVOICED': 2,
    'INVOICED': 3,
    'VETTED': 4,               // RETIRED rank (vetting removed): legacy jobs only
    'ENTRY_COMPLETED': 5,
    'DUTY_PAID': 6,
    'READY_FOR_RELEASE': 7,
    'RELEASED': 8,
    'CLEARED': 9,
    'DELIVERED': 10
  };
  
  return priorities[status] || 0;
};

// Status Description
export const getJobStatusDescription = (status) => {
  const descriptions = {
    'NEW': 'New job created',
    'PREINVOICED': 'Ready for invoicing',
    'INVOICED': 'Invoice issued for the job',
    'VETTED': 'Job has been vetted and reviewed', // RETIRED: legacy jobs only
    'ENTRY_COMPLETED': 'Customs entry completed',
    'DUTY_PAID': 'Duty payment completed',
    'READY_FOR_RELEASE': 'Assigned to release officer with documentation',
    'RELEASED': 'Released from customs',
    'CLEARED': 'Cleared and ready for delivery',
    'DELIVERED': 'Successfully delivered'
  };
  
  return descriptions[status] || 'Unknown status';
};

// Get all job statuses in order
export const getJobStatusesInOrder = () => {
  // VETTED is retired (vetting removed): excluded from the active workflow order.
  return ['NEW', 'PREINVOICED', 'INVOICED', 'ENTRY_COMPLETED', 'DUTY_PAID', 'READY_FOR_RELEASE', 'RELEASED', 'CLEARED', 'DELIVERED'];
};

// Check if status is terminal (final state)
export const isTerminalStatus = (status) => {
  return ['DELIVERED', 'CANCELLED'].includes(status);
};

// Check if status allows editing
export const canEditJob = (status) => {
  return !['DELIVERED', 'CANCELLED'].includes(status);
};

/**
 * Calendar days from today until ETA (negative = overdue).
 * Uses local date-only comparison so timezone offsets don't shift the day.
 */
export const getDaysUntilEta = (eta) => {
  if (!eta) return null;
  const raw = typeof eta === 'string' ? eta.slice(0, 10) : null;
  let etaDay;
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    etaDay = new Date(y, m - 1, d);
  } else {
    const parsed = new Date(eta);
    if (Number.isNaN(parsed.getTime())) return null;
    etaDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((etaDay.getTime() - today.getTime()) / 86400000);
};

const ETA_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Display ETA as "15 Aug 2026" */
export const formatEtaDate = (eta) => {
  if (!eta) return '';
  const raw = typeof eta === 'string' ? eta.slice(0, 10) : null;
  let etaDay;
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    etaDay = new Date(y, m - 1, d);
  } else {
    const parsed = new Date(eta);
    if (Number.isNaN(parsed.getTime())) return '';
    etaDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  return `${etaDay.getDate()} ${ETA_MONTHS[etaDay.getMonth()]} ${etaDay.getFullYear()}`;
};

const ETA_TERMINAL_STATUSES = ['CLEARED', 'DELIVERED'];

export const isEtaTerminalStatus = (status) =>
  Boolean(status && ETA_TERMINAL_STATUSES.includes(status));

/** 'critical' (≤3 days / overdue), 'warning' (≤7), 'normal', or 'none' */
export const getEtaUrgency = (eta, status) => {
  // Cleared/delivered jobs no longer need ETA attention
  if (isEtaTerminalStatus(status)) return 'none';
  const days = getDaysUntilEta(eta);
  if (days == null) return 'none';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'normal';
};

/** Ant Design Tag color for ETA urgency */
export const getEtaAntColor = (eta, status) => {
  if (isEtaTerminalStatus(status)) return 'green';
  const urgency = getEtaUrgency(eta, status);
  if (urgency === 'critical') return 'red';
  if (urgency === 'warning') return 'orange';
  return 'default';
};

/** ETA urgency filter values (Jobs / Dashboard) */
export const ETA_FILTER = {
  ALL: 'ALL',
  OVERDUE: 'OVERDUE',
  DUE_3: 'DUE_3',
  DUE_7: 'DUE_7',
};

export const ETA_FILTER_OPTIONS = [
  { value: ETA_FILTER.ALL, label: 'All ETAs' },
  { value: ETA_FILTER.OVERDUE, label: 'Overdue' },
  { value: ETA_FILTER.DUE_3, label: 'Due within 3 days' },
  { value: ETA_FILTER.DUE_7, label: 'Due within 7 days' },
];

export const isValidEtaFilter = (value) =>
  Object.values(ETA_FILTER).includes(value);

/**
 * Whether a job matches the selected ETA urgency filter.
 * Missing ETA is excluded when a date window is active.
 * CLEARED/DELIVERED always match — they are done and must stay visible
 * in status counts and when filtering by those statuses.
 */
export const jobMatchesEtaFilter = (job, filter) => {
  if (!filter || filter === ETA_FILTER.ALL) return true;
  if (isEtaTerminalStatus(job?.status)) return true;
  if (!job?.eta) return false;

  const days = getDaysUntilEta(job.eta);
  if (days == null) return false;

  if (filter === ETA_FILTER.OVERDUE) return days < 0;
  if (filter === ETA_FILTER.DUE_3) return days <= 3;
  if (filter === ETA_FILTER.DUE_7) return days <= 7;
  return true;
};

