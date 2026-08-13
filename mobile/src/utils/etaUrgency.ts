/**
 * Calendar days from today until ETA (negative = overdue).
 * Uses local date-only comparison so timezone offsets don't shift the day.
 */
export function getDaysUntilEta(eta?: string | null): number | null {
  if (!eta) return null;
  const raw = typeof eta === 'string' ? eta.slice(0, 10) : null;
  let etaDay: Date;
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
}

/** 'critical' (≤3 days / overdue), 'warning' (≤7), 'normal', or 'none' */
export type EtaUrgency = 'critical' | 'warning' | 'normal' | 'none';

export function getEtaUrgency(eta?: string | null): EtaUrgency {
  const days = getDaysUntilEta(eta);
  if (days == null) return 'none';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'normal';
}

/** Text color for ETA urgency (mobile) */
export function getEtaTextColor(eta?: string | null): string {
  const urgency = getEtaUrgency(eta);
  if (urgency === 'critical') return '#CF1322';
  if (urgency === 'warning') return '#D46B08';
  return '#6B7280';
}

export const ETA_FILTER = {
  ALL: 'ALL',
  OVERDUE: 'OVERDUE',
  DUE_3: 'DUE_3',
  DUE_7: 'DUE_7',
} as const;

export type EtaFilterValue = (typeof ETA_FILTER)[keyof typeof ETA_FILTER];

export const ETA_FILTER_OPTIONS: Array<{ value: EtaFilterValue; label: string }> = [
  { value: ETA_FILTER.ALL, label: 'All ETAs' },
  { value: ETA_FILTER.OVERDUE, label: 'Overdue' },
  { value: ETA_FILTER.DUE_3, label: 'Due within 3 days' },
  { value: ETA_FILTER.DUE_7, label: 'Due within 7 days' },
];

const ETA_TERMINAL_STATUSES = ['CLEARED', 'DELIVERED'];

export function isValidEtaFilter(value: unknown): value is EtaFilterValue {
  return (
    typeof value === 'string' &&
    (Object.values(ETA_FILTER) as string[]).includes(value)
  );
}

export function jobMatchesEtaFilter(
  job: { eta?: string | null; status?: string } | null | undefined,
  filter?: string | null,
): boolean {
  if (!filter || filter === ETA_FILTER.ALL) return true;
  if (!job?.eta) return false;
  if (job.status && ETA_TERMINAL_STATUSES.includes(job.status)) return false;

  const days = getDaysUntilEta(job.eta);
  if (days == null) return false;

  if (filter === ETA_FILTER.OVERDUE) return days < 0;
  if (filter === ETA_FILTER.DUE_3) return days <= 3;
  if (filter === ETA_FILTER.DUE_7) return days <= 7;
  return true;
}
