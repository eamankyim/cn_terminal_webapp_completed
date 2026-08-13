import { ETA_FILTER, isValidEtaFilter } from './statusUtils';

const prefsKey = (userId) => `cn_terminal_user_prefs_${userId}`;

/**
 * Per-user UI preferences (localStorage).
 * Shape: { defaultEtaFilter: 'ALL' | 'OVERDUE' | 'DUE_3' | 'DUE_7' }
 */
export function getUserPreferences(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(prefsKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function setUserPreferences(userId, patch) {
  if (!userId) return;
  const next = { ...getUserPreferences(userId), ...patch };
  localStorage.setItem(prefsKey(userId), JSON.stringify(next));
  return next;
}

export function getDefaultEtaFilter(userId) {
  const value = getUserPreferences(userId).defaultEtaFilter;
  return isValidEtaFilter(value) ? value : ETA_FILTER.ALL;
}

export function setDefaultEtaFilter(userId, filter) {
  const value = isValidEtaFilter(filter) ? filter : ETA_FILTER.ALL;
  setUserPreferences(userId, { defaultEtaFilter: value });
  return value;
}
