/**
 * SMS service via MNotify (Ghana).
 * Credentials: configurations table (Admin UI) with optional env fallback for local/dev.
 * Env: SMS_DEV_MODE; optional MNOTIFY_API_KEY / MNOTIFY_SENDER_ID / MNOTIFY_API_URL.
 */
const fetch = require('node-fetch');
const { prisma } = require('../config/database');
const {
  QUIET_HOURS_EVENTS,
  MNOTIFY_CONFIG_KEYS,
  parseBoolean,
  parseQuietHours,
  isWithinQuietHours
} = require('./smsConfig');

const DEFAULT_MNOTIFY_URL = 'https://api.mnotify.com/api/sms/quick';

class SmsService {
  constructor() {
    this.devMode = process.env.SMS_DEV_MODE === 'true';
    this._configCache = { at: 0, map: null };
    this._configTtlMs = 30_000;

    if (process.env.CLICKATELL_API_KEY && !process.env.MNOTIFY_API_KEY) {
      console.warn(
        '⚠️ CLICKATELL_API_KEY is deprecated. SMS now uses MNotify — set credentials in Admin → SMS Settings (or MNOTIFY_* env for local/dev).'
      );
    }
  }

  /**
   * Normalize Ghana numbers to 233XXXXXXXXX (no +).
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    let cleaned = String(phoneNumber).replace(/\D/g, '');
    if (!cleaned) return null;

    if (cleaned.startsWith('00233')) {
      cleaned = cleaned.slice(2);
    }
    if (cleaned.startsWith('233') && cleaned.length >= 12) {
      return cleaned.slice(0, 12);
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `233${cleaned.slice(1)}`;
    }
    if (cleaned.length === 9) {
      return `233${cleaned}`;
    }
    // Already international without 233 — leave as-is if long enough
    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }
    return null;
  }

  async _loadConfigMap(force = false) {
    const now = Date.now();
    if (!force && this._configCache.map && now - this._configCache.at < this._configTtlMs) {
      return this._configCache.map;
    }
    try {
      const rows = await prisma.configuration.findMany({
        where: {
          OR: [
            { key: 'SMS_NOTIFICATIONS' },
            { key: { startsWith: 'SMS_' } },
            { key: { in: MNOTIFY_CONFIG_KEYS } }
          ]
        }
      });
      const map = {};
      for (const row of rows) {
        map[row.key] = row;
      }
      this._configCache = { at: now, map };
      return map;
    } catch (err) {
      console.error('❌ [SMS] Failed to load SMS configs:', err.message);
      return this._configCache.map || {};
    }
  }

  invalidateConfigCache() {
    this._configCache = { at: 0, map: null };
  }

  getConfigValue(map, key, defaultValue = null) {
    const row = map[key];
    if (!row) return defaultValue;
    return row.value;
  }

  /**
   * Resolve MNotify credentials: config table first, then env (local/dev fallback).
   * Never log the API key.
   */
  resolveMnotifyCredentials(map) {
    const fromConfig = (key) => {
      const v = this.getConfigValue(map, key, null);
      if (v === null || v === undefined) return '';
      return String(v).trim();
    };

    const apiKey =
      fromConfig('MNOTIFY_API_KEY') ||
      (process.env.MNOTIFY_API_KEY || '').trim() ||
      '';
    const senderRaw =
      fromConfig('MNOTIFY_SENDER_ID') ||
      (process.env.MNOTIFY_SENDER_ID || '').trim() ||
      'CNTerminal';
    const apiUrl =
      fromConfig('MNOTIFY_API_URL') ||
      (process.env.MNOTIFY_API_URL || '').trim() ||
      DEFAULT_MNOTIFY_URL;

    return {
      apiKey,
      senderId: senderRaw.slice(0, 11),
      apiUrl
    };
  }

  isMasterEnabled(map) {
    return parseBoolean(this.getConfigValue(map, 'SMS_NOTIFICATIONS', 'false'), false);
  }

  isEventEnabled(map, eventKey) {
    if (!eventKey) return this.isMasterEnabled(map);
    if (!this.isMasterEnabled(map)) return false;
    // Missing key → treat as disabled for safety except we seed defaults on init
    const raw = this.getConfigValue(map, eventKey, null);
    if (raw === null) return false;
    return parseBoolean(raw, false);
  }

  /**
   * Strip API keys from provider payloads before storing or returning them.
   */
  sanitizeProviderPayload(raw, apiKey) {
    if (raw == null) return null;
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    if (apiKey) {
      text = text.split(apiKey).join('[redacted]');
    }
    text = text.replace(/([?&]key=)[^&"'\s]+/gi, '$1[redacted]');
    if (text.length > 500) text = `${text.slice(0, 500)}…`;
    return text;
  }

  maskPhone(phone) {
    if (!phone) return null;
    const s = String(phone);
    if (s.length <= 6) return '****';
    return `${s.slice(0, 3)}****${s.slice(-4)}`;
  }

  async _writeDispatchLog({
    eventKey,
    jobId,
    userId,
    phone,
    dedupeKey,
    message,
    status,
    errorMessage,
    metadata
  }) {
    if (!dedupeKey && !jobId && !eventKey) return;
    const key = dedupeKey || `oneshot:${eventKey || 'custom'}:${phone || 'unknown'}:${Date.now()}`;
    try {
      await prisma.smsDispatchLog.upsert({
        where: { dedupeKey: key },
        create: {
          eventKey: eventKey || 'CUSTOM',
          jobId,
          userId,
          phone,
          dedupeKey: key,
          message,
          status,
          errorMessage: errorMessage || null,
          metadata: metadata || undefined
        },
        update: {
          status,
          message,
          errorMessage: errorMessage || null,
          metadata: metadata || undefined
        }
      });
    } catch (logErr) {
      if (logErr.code !== 'P2002') {
        console.error('❌ [SMS] Failed to write dispatch log:', logErr.message);
      }
    }
  }

  /**
   * Central send entry — checks master + event toggle, quiet hours, formats number.
   * Never throws to callers for business flows; returns { success, ... }.
   *
   * @param {Object} opts
   * @param {string} opts.to - Phone number
   * @param {string} opts.message
   * @param {string} [opts.eventKey] - Config toggle key
   * @param {boolean} [opts.skipQuietHours]
   * @param {boolean} [opts.skipEventCheck] - Only check master (rare)
   * @param {boolean} [opts.bypassToggles] - Admin test: skip master, event, and quiet hours
   * @param {string} [opts.jobId]
   * @param {string} [opts.userId]
   * @param {string} [opts.dedupeKey] - Unique key; if already sent, skip
   * @param {Object} [opts.metadata]
   */
  async sendSms(opts) {
    const {
      to,
      message,
      eventKey = null,
      skipQuietHours = false,
      skipEventCheck = false,
      bypassToggles = false,
      jobId = null,
      userId = null,
      dedupeKey = null,
      metadata = null
    } = typeof opts === 'string'
      ? { to: arguments[0], message: arguments[1], eventKey: null } // legacy (phone, message)
      : opts;

    try {
      if (!to || !message) {
        return { success: false, reason: 'Phone number and message are required' };
      }

      const map = await this._loadConfigMap();

      if (!bypassToggles) {
        if (!skipEventCheck) {
          if (eventKey) {
            if (!this.isEventEnabled(map, eventKey)) {
              return { success: false, reason: `Event disabled: ${eventKey}`, skipped: true };
            }
          } else if (!this.isMasterEnabled(map)) {
            return { success: false, reason: 'SMS_NOTIFICATIONS disabled', skipped: true };
          }
        } else if (!this.isMasterEnabled(map)) {
          return { success: false, reason: 'SMS_NOTIFICATIONS disabled', skipped: true };
        }

        if (!skipQuietHours && eventKey && QUIET_HOURS_EVENTS.has(eventKey)) {
          const quietRaw = this.getConfigValue(map, 'SMS_QUIET_HOURS', '21-7');
          const quietSpec = parseQuietHours(quietRaw);
          if (isWithinQuietHours(quietSpec)) {
            return { success: false, reason: 'Quiet hours', skipped: true, quietHours: true };
          }
        }
      }

      if (dedupeKey) {
        const existing = await prisma.smsDispatchLog.findUnique({
          where: { dedupeKey }
        });
        if (existing && existing.status === 'sent') {
          return { success: false, reason: 'Already sent (dedupe)', skipped: true, deduped: true };
        }
      }

      const formattedPhone = this.formatPhoneNumber(to);
      if (!formattedPhone) {
        const invalid = { success: false, reason: 'Invalid phone number format' };
        await this._writeDispatchLog({
          eventKey,
          jobId,
          userId,
          phone: String(to).slice(0, 32),
          dedupeKey,
          message: String(message).slice(0, 160),
          status: 'failed',
          errorMessage: invalid.reason,
          metadata
        });
        return invalid;
      }

      const maxLength = 160;
      const truncatedMessage =
        message.length > maxLength ? `${message.substring(0, maxLength - 3)}...` : message;

      const { apiKey, senderId, apiUrl } = this.resolveMnotifyCredentials(map);

      let result;
      if (this.devMode) {
        console.log('📱 [SMS DEV MODE] SMS would be sent:');
        console.log(`   Event: ${eventKey || 'n/a'}`);
        console.log(`   To: ${formattedPhone}`);
        console.log(`   Message: ${truncatedMessage}`);
        result = {
          success: true,
          messageId: `dev-mode-${Date.now()}`,
          phoneNumber: formattedPhone,
          message: truncatedMessage,
          devMode: true
        };
      } else {
        if (!apiKey) {
          console.error(
            '❌ MNotify API key not configured (set in Admin → SMS Settings, or MNOTIFY_API_KEY env for local/dev)'
          );
          result = { success: false, reason: 'MNotify API key not configured' };
        } else {
          result = await this._sendViaMNotify(formattedPhone, truncatedMessage, {
            apiKey,
            senderId,
            apiUrl
          });
        }
      }

      const providerSnippet = this.sanitizeProviderPayload(result.raw, apiKey);
      const status = result.success ? 'sent' : result.skipped ? 'skipped' : 'failed';
      const errorMessage = result.success ? null : result.reason || result.error || null;

      await this._writeDispatchLog({
        eventKey,
        jobId,
        userId,
        phone: formattedPhone,
        dedupeKey,
        message: truncatedMessage,
        status,
        errorMessage,
        metadata: {
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
          ...(providerSnippet ? { providerResponse: providerSnippet } : {}),
          ...(result.devMode ? { devMode: true } : {}),
          ...(result.messageId ? { messageId: result.messageId } : {})
        }
      });

      return {
        ...result,
        raw: undefined,
        providerResponse: providerSnippet || undefined
      };
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      await this._writeDispatchLog({
        eventKey,
        jobId,
        userId,
        phone: to ? String(to).slice(0, 32) : null,
        dedupeKey,
        message: message ? String(message).slice(0, 160) : null,
        status: 'failed',
        errorMessage: error.message,
        metadata
      });
      return { success: false, error: error.message };
    }
  }

  async _sendViaMNotify(formattedPhone, truncatedMessage, credentials) {
    const { apiKey, senderId, apiUrl } = credentials;
    // MNotify quick SMS: POST with recipient array; accepts 0XXXXXXXXX or 233…
    // Prefer local 0-prefix for API examples compatibility, keep 233 in logs.
    const localRecipient =
      formattedPhone.startsWith('233') && formattedPhone.length === 12
        ? `0${formattedPhone.slice(3)}`
        : formattedPhone;

    const url = `${apiUrl}?key=${encodeURIComponent(apiKey)}`;
    const body = {
      recipient: [localRecipient],
      sender: senderId,
      message: truncatedMessage,
      is_schedule: false,
      schedule_date: ''
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error('❌ MNotify API error:', response.status, responseText);
      return {
        success: false,
        reason: `MNotify HTTP ${response.status}`,
        phoneNumber: formattedPhone,
        raw: responseText
      };
    }

    const ok =
      data &&
      (data.status === 'success' ||
        data.code === '2000' ||
        String(data.code) === '2000');

    if (!ok) {
      console.error('❌ MNotify send failed:', responseText);
      return {
        success: false,
        reason: data?.message || 'MNotify send failed',
        phoneNumber: formattedPhone,
        raw: data || responseText
      };
    }

    const messageId =
      data?.summary?._id || data?._id || `mnotify-${Date.now()}`;

    console.log(`✅ SMS sent via MNotify to ${formattedPhone}. ID: ${messageId}`);
    return {
      success: true,
      messageId,
      phoneNumber: formattedPhone,
      message: truncatedMessage,
      provider: 'mnotify'
    };
  }

  /**
   * Check whether a dedupe key was already successfully sent.
   */
  async wasSent(dedupeKey) {
    if (!dedupeKey) return false;
    const row = await prisma.smsDispatchLog.findUnique({ where: { dedupeKey } });
    return !!(row && row.status === 'sent');
  }

  /**
   * Last successful send time for an event+job (optional user).
   */
  async lastSentAt(eventKey, jobId, userId = null) {
    const where = { eventKey, jobId, status: 'sent' };
    if (userId) where.userId = userId;
    const row = await prisma.smsDispatchLog.findFirst({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return row?.createdAt || null;
  }

  // ---- Convenience helpers (backward compatible) ----

  async sendJobStatusUpdate(job, newStatus) {
    const SmsNotificationService = require('./smsNotificationService');
    return SmsNotificationService.notifyCustomerMilestone(job, newStatus);
  }

  async sendDeliveryNotification(job) {
    return this.sendJobStatusUpdate(job, 'DELIVERED');
  }

  async sendPaymentReminder(invoice) {
    const SmsNotificationService = require('./smsNotificationService');
    return SmsNotificationService.notifyPaymentReminder(invoice);
  }

  async sendCustomMessage(phoneNumber, message) {
    return this.sendSms({ to: phoneNumber, message, skipEventCheck: false });
  }

  _countByStatus(rows) {
    const counts = { sent: 0, failed: 0, skipped: 0 };
    for (const row of rows) {
      const key = row.status;
      const n = typeof row._count === 'number' ? row._count : row._count?.status || 0;
      if (counts[key] != null) counts[key] = n;
    }
    counts.total = counts.sent + counts.failed + counts.skipped;
    return counts;
  }

  async getConnectionStatus() {
    const map = await this._loadConfigMap(true);
    const fromConfig = (key) => {
      const v = this.getConfigValue(map, key, null);
      if (v === null || v === undefined) return '';
      return String(v).trim();
    };
    const configKey = fromConfig('MNOTIFY_API_KEY');
    const envKey = (process.env.MNOTIFY_API_KEY || '').trim();
    const { apiKey, senderId, apiUrl } = this.resolveMnotifyCredentials(map);

    let apiKeySource = 'none';
    if (configKey) apiKeySource = 'config';
    else if (envKey) apiKeySource = 'env';

    const [lastSuccess, lastError] = await Promise.all([
      prisma.smsDispatchLog.findFirst({
        where: { status: 'sent' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, eventKey: true, phone: true }
      }),
      prisma.smsDispatchLog.findFirst({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, eventKey: true, errorMessage: true, phone: true }
      })
    ]);

    return {
      configured: !!apiKey,
      apiKeyConfigured: !!apiKey,
      apiKeySource,
      senderIdConfigured: !!senderId,
      senderId,
      apiUrl,
      masterEnabled: this.isMasterEnabled(map),
      devMode: this.devMode,
      lastSuccessAt: lastSuccess?.createdAt || null,
      lastSuccessEventKey: lastSuccess?.eventKey || null,
      lastErrorAt: lastError?.createdAt || null,
      lastErrorEventKey: lastError?.eventKey || null,
      lastErrorMessage: lastError?.errorMessage || null
    };
  }

  async getAdminStats({ recentLimit = 50, failureLimit = 30 } = {}) {
    const now = new Date();
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const takeRecent = Math.min(Math.max(Number(recentLimit) || 50, 1), 100);
    const takeFailures = Math.min(Math.max(Number(failureLimit) || 30, 1), 50);

    const [
      connection,
      totalsRaw,
      last24hRaw,
      last7dRaw,
      byEventRaw,
      recentRows,
      failureRows
    ] = await Promise.all([
      this.getConnectionStatus(),
      prisma.smsDispatchLog.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.smsDispatchLog.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: d24h } }
      }),
      prisma.smsDispatchLog.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: d7d } }
      }),
      prisma.smsDispatchLog.groupBy({
        by: ['eventKey', 'status'],
        _count: { status: true }
      }),
      prisma.smsDispatchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: takeRecent,
        select: {
          id: true,
          eventKey: true,
          status: true,
          phone: true,
          errorMessage: true,
          createdAt: true,
          message: true
        }
      }),
      prisma.smsDispatchLog.findMany({
        where: { status: 'failed' },
        orderBy: { createdAt: 'desc' },
        take: takeFailures,
        select: {
          id: true,
          eventKey: true,
          status: true,
          phone: true,
          errorMessage: true,
          createdAt: true,
          metadata: true
        }
      })
    ]);

    const byEventMap = {};
    for (const row of byEventRaw) {
      if (!byEventMap[row.eventKey]) {
        byEventMap[row.eventKey] = {
          eventKey: row.eventKey,
          sent: 0,
          failed: 0,
          skipped: 0,
          total: 0
        };
      }
      const bucket = byEventMap[row.eventKey];
      const n = typeof row._count === 'number' ? row._count : row._count?.status || 0;
      if (bucket[row.status] != null) bucket[row.status] = n;
      bucket.total += n;
    }

    const mapRow = (row) => ({
      id: row.id,
      eventKey: row.eventKey,
      status: row.status,
      phoneMasked: this.maskPhone(row.phone),
      errorMessage: row.errorMessage || null,
      createdAt: row.createdAt,
      messagePreview: row.message ? String(row.message).slice(0, 80) : null
    });

    return {
      connection,
      totals: this._countByStatus(totalsRaw),
      last24h: this._countByStatus(last24hRaw),
      last7d: this._countByStatus(last7dRaw),
      byEventKey: Object.values(byEventMap).sort((a, b) => b.total - a.total),
      recent: recentRows.map(mapRow),
      recentFailures: failureRows.map((row) => ({
        ...mapRow(row),
        providerResponse:
          row.metadata && typeof row.metadata === 'object'
            ? this.sanitizeProviderPayload(row.metadata.providerResponse, null)
            : null
      }))
    };
  }
}

module.exports = new SmsService();
