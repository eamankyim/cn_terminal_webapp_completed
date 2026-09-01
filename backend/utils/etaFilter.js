/**
 * Prisma where fragments for ETA urgency filters.
 * Aligned with frontend ETA color windows (≤3 / ≤7 days).
 * CLEARED/DELIVERED always remain visible (they match any ETA filter).
 */

const ETA_FILTER = {
  ALL: 'ALL',
  OVERDUE: 'OVERDUE',
  DUE_3: 'DUE_3',
  DUE_7: 'DUE_7',
};

const ETA_TERMINAL_STATUSES = ['CLEARED', 'DELIVERED'];

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isTerminalStatusConstraint(statusWhere) {
  if (!statusWhere) return false;
  if (typeof statusWhere === 'string') {
    return ETA_TERMINAL_STATUSES.includes(statusWhere);
  }
  if (statusWhere.equals && ETA_TERMINAL_STATUSES.includes(statusWhere.equals)) {
    return true;
  }
  if (Array.isArray(statusWhere.in) && statusWhere.in.length > 0) {
    return statusWhere.in.every((status) => ETA_TERMINAL_STATUSES.includes(status));
  }
  return false;
}

/**
 * @param {string|undefined} etaFilter
 * @returns {{ eta: object } | null}
 */
function buildEtaFilterConditions(etaFilter) {
  if (!etaFilter || etaFilter === ETA_FILTER.ALL) {
    return null;
  }

  const startOfToday = startOfLocalDay();

  if (etaFilter === ETA_FILTER.OVERDUE) {
    return {
      eta: { not: null, lt: startOfToday },
    };
  }

  if (etaFilter === ETA_FILTER.DUE_3 || etaFilter === ETA_FILTER.DUE_7) {
    const days = etaFilter === ETA_FILTER.DUE_3 ? 3 : 7;
    const endInclusive = startOfLocalDay();
    endInclusive.setDate(endInclusive.getDate() + days);
    endInclusive.setHours(23, 59, 59, 999);
    return {
      eta: { not: null, lte: endInclusive },
    };
  }

  return null;
}

/**
 * Merge ETA filter into an existing Prisma where object (mutates and returns it).
 */
function applyEtaFilterToWhere(where, etaFilter) {
  const conditions = buildEtaFilterConditions(etaFilter);
  if (!conditions) return where;

  // Selecting Cleared/Delivered must show those jobs regardless of ETA
  if (isTerminalStatusConstraint(where.status)) {
    return where;
  }

  const extra = [{
    OR: [
      { eta: conditions.eta },
      { status: { in: ETA_TERMINAL_STATUSES } },
    ],
  }];

  if (where.AND) {
    const existingAnd = Array.isArray(where.AND) ? where.AND : [where.AND];
    where.AND = [...existingAnd, ...extra];
  } else {
    where.AND = extra;
  }

  return where;
}

function shouldOrderByEta(etaFilter) {
  return Boolean(etaFilter && etaFilter !== ETA_FILTER.ALL);
}

module.exports = {
  ETA_FILTER,
  buildEtaFilterConditions,
  applyEtaFilterToWhere,
  shouldOrderByEta,
};
