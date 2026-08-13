/**
 * Prisma where fragments for ETA urgency filters.
 * Aligned with frontend ETA color windows (≤3 / ≤7 days).
 */

const ETA_FILTER = {
  ALL: 'ALL',
  OVERDUE: 'OVERDUE',
  DUE_3: 'DUE_3',
  DUE_7: 'DUE_7',
};

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @param {string|undefined} etaFilter
 * @returns {{ eta: object, status: object } | null}
 */
function buildEtaFilterConditions(etaFilter) {
  if (!etaFilter || etaFilter === ETA_FILTER.ALL) {
    return null;
  }

  const startOfToday = startOfLocalDay();
  const terminalStatus = { notIn: ['CLEARED', 'DELIVERED'] };

  if (etaFilter === ETA_FILTER.OVERDUE) {
    return {
      eta: { not: null, lt: startOfToday },
      status: terminalStatus,
    };
  }

  if (etaFilter === ETA_FILTER.DUE_3 || etaFilter === ETA_FILTER.DUE_7) {
    const days = etaFilter === ETA_FILTER.DUE_3 ? 3 : 7;
    const endInclusive = startOfLocalDay();
    endInclusive.setDate(endInclusive.getDate() + days);
    endInclusive.setHours(23, 59, 59, 999);
    return {
      eta: { not: null, lte: endInclusive },
      status: terminalStatus,
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

  const extra = [{ eta: conditions.eta }];

  if (where.status) {
    // Keep caller status and also require non-terminal (AND both).
    const existingStatus = where.status;
    delete where.status;
    extra.push({ status: existingStatus }, { status: conditions.status });
  } else {
    extra.push({ status: conditions.status });
  }

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
