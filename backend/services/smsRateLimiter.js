/**
 * Global SMS circuit breaker.
 *
 * Last line of defence against a runaway loop: no matter which code path asks
 * to send, the total number of messages accepted per rolling minute / hour is
 * capped. Counts come from both an in-process window and SmsDispatchLog, so a
 * restart (or a second app instance) cannot reset the budget to zero.
 *
 * Limits are configurable (SMS_MAX_PER_MINUTE / SMS_MAX_PER_HOUR, or env of the
 * same name) and default to deliberately conservative values.
 */
const { prisma } = require('../config/database');
const {
  SMS_RATE_LIMIT_KEYS,
  SMS_RATE_LIMIT_DEFAULTS,
  parsePositiveInt
} = require('./smsConfig');

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * MS_MINUTE;
const DB_SYNC_TTL_MS = 15 * 1000;
const TRIP_LOG_INTERVAL_MS = 60 * 1000;

class SmsRateLimiter {
  constructor() {
    /** @type {number[]} epoch ms of sends accepted by this process */
    this.sentAt = [];
    this.dbSync = { at: 0, minute: 0, hour: 0 };
    this.trip = null; // { at, reason, limit, window }
    this.lastTripLogAt = 0;
    this.totalBlocked = 0;
  }

  resolveLimits(map = null) {
    const fromConfig = (key) => {
      const row = map && map[key];
      return row && row.value !== undefined && row.value !== null ? row.value : undefined;
    };

    return {
      perMinute: parsePositiveInt(
        fromConfig(SMS_RATE_LIMIT_KEYS.perMinute) ?? process.env.SMS_MAX_PER_MINUTE,
        SMS_RATE_LIMIT_DEFAULTS.perMinute
      ),
      perHour: parsePositiveInt(
        fromConfig(SMS_RATE_LIMIT_KEYS.perHour) ?? process.env.SMS_MAX_PER_HOUR,
        SMS_RATE_LIMIT_DEFAULTS.perHour
      ),
      perSchedulerRun: parsePositiveInt(
        fromConfig(SMS_RATE_LIMIT_KEYS.perSchedulerRun) ?? process.env.SMS_MAX_PER_SCHEDULER_RUN,
        SMS_RATE_LIMIT_DEFAULTS.perSchedulerRun
      )
    };
  }

  _prune(now = Date.now()) {
    const cutoff = now - MS_HOUR;
    if (this.sentAt.length && this.sentAt[0] < cutoff) {
      this.sentAt = this.sentAt.filter((t) => t >= cutoff);
    }
  }

  /**
   * Reconcile against persisted sends so restarts don't hand out a fresh budget.
   * Cached briefly — this runs in front of every send.
   */
  async _syncFromDb(now = Date.now()) {
    if (now - this.dbSync.at < DB_SYNC_TTL_MS) return this.dbSync;
    try {
      const [minute, hour] = await Promise.all([
        prisma.smsDispatchLog.count({
          where: { status: 'sent', createdAt: { gte: new Date(now - MS_MINUTE) } }
        }),
        prisma.smsDispatchLog.count({
          where: { status: 'sent', createdAt: { gte: new Date(now - MS_HOUR) } }
        })
      ]);
      this.dbSync = { at: now, minute, hour };
    } catch (err) {
      // Cannot verify the budget → keep the previous (higher) reading rather
      // than assuming zero. Never open the gate because of a DB error.
      console.error('❌ [SMS RateLimit] Failed to read dispatch counts:', err.message);
      this.dbSync = { ...this.dbSync, at: now };
    }
    return this.dbSync;
  }

  async counts(now = Date.now()) {
    this._prune(now);
    const db = await this._syncFromDb(now);
    const memMinute = this.sentAt.filter((t) => t >= now - MS_MINUTE).length;
    const memHour = this.sentAt.length;
    return {
      // In-process sends are also persisted, so take the larger of the two
      // readings instead of adding them (which would double count).
      minute: Math.max(memMinute, db.minute),
      hour: Math.max(memHour, db.hour)
    };
  }

  /**
   * @returns {Promise<{allowed: boolean, reason?: string, counts: object, limits: object}>}
   */
  async check(map = null) {
    const now = Date.now();
    const limits = this.resolveLimits(map);
    const counts = await this.counts(now);

    let breach = null;
    if (limits.perMinute > 0 && counts.minute >= limits.perMinute) {
      breach = {
        window: 'minute',
        limit: limits.perMinute,
        observed: counts.minute
      };
    } else if (limits.perHour > 0 && counts.hour >= limits.perHour) {
      breach = { window: 'hour', limit: limits.perHour, observed: counts.hour };
    }

    if (!breach) {
      if (this.trip) {
        console.warn(
          `✅ [SMS RateLimit] Circuit breaker reset (${counts.minute}/min, ${counts.hour}/hr within limits)`
        );
        this.trip = null;
      }
      return { allowed: true, counts, limits };
    }

    const reason = `SMS rate limit reached: ${breach.observed} sent in the last ${breach.window} (max ${breach.limit})`;
    this.totalBlocked += 1;
    if (!this.trip) {
      this.trip = { at: now, reason, ...breach };
    }
    if (now - this.lastTripLogAt > TRIP_LOG_INTERVAL_MS) {
      this.lastTripLogAt = now;
      console.error(
        `🛑 [SMS RateLimit] CIRCUIT BREAKER OPEN — ${reason}. ` +
          `Blocked ${this.totalBlocked} message(s) so far. ` +
          'Investigate before raising SMS_MAX_PER_MINUTE / SMS_MAX_PER_HOUR.'
      );
    }
    return { allowed: false, reason, counts, limits };
  }

  /** Record an accepted send (call once per message handed to the provider). */
  record(now = Date.now()) {
    this.sentAt.push(now);
    this.dbSync.minute += 1;
    this.dbSync.hour += 1;
    this._prune(now);
  }

  async getState(map = null) {
    const limits = this.resolveLimits(map);
    const counts = await this.counts();
    return {
      limits,
      counts,
      tripped: !!this.trip,
      trippedAt: this.trip?.at ? new Date(this.trip.at) : null,
      tripReason: this.trip?.reason || null,
      blockedSinceBoot: this.totalBlocked
    };
  }

  /** Manual reset (admin). Counts still apply — this only clears the log state. */
  reset() {
    this.trip = null;
    this.lastTripLogAt = 0;
  }
}

module.exports = new SmsRateLimiter();
