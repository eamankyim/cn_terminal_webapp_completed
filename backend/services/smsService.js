/**
 * SMS service via MNotify (Ghana).
 * Replaces Clickatell. Env: MNOTIFY_API_KEY, MNOTIFY_SENDER_ID, SMS_DEV_MODE.
 */
const fetch = require('node-fetch');
const { prisma } = require('../config/database');
const {
  QUIET_HOURS_EVENTS,
  parseBoolean,
  parseQuietHours,
  isWithinQuietHours
} = require('./smsConfig');

class SmsService {
  constructor() {
    this.apiKey = process.env.MNOTIFY_API_KEY;
    this.apiUrl = process.env.MNOTIFY_API_URL || 'https://api.mnotify.com/api/sms/quick';
    this.senderId = (process.env.MNOTIFY_SENDER_ID || 'CNTerminal').slice(0, 11);
    this.devMode = process.env.SMS_DEV_MODE === 'true';
    this._configCache = { at: 0, map: null };
    this._configTtlMs = 30_000;

    if (process.env.CLICKATELL_API_KEY && !process.env.MNOTIFY_API_KEY) {
      console.warn(
        '⚠️ CLICKATELL_API_KEY is deprecated. SMS now uses MNotify — set MNOTIFY_API_KEY and MNOTIFY_SENDER_ID.'
      );
    }
    if (!this.apiKey && !this.devMode) {
      console.warn('⚠️ MNotify API key not configured. SMS will not be sent (set MNOTIFY_API_KEY or SMS_DEV_MODE=true).');
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
            { key: { startsWith: 'SMS_' } }
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
   * Central send entry — checks master + event toggle, quiet hours, formats number.
   * Never throws to callers for business flows; returns { success, ... }.
   *
   * @param {Object} opts
   * @param {string} opts.to - Phone number
   * @param {string} opts.message
   * @param {string} [opts.eventKey] - Config toggle key
   * @param {boolean} [opts.skipQuietHours]
   * @param {boolean} [opts.skipEventCheck] - Only check master (rare)
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

      if (
        !skipQuietHours &&
        eventKey &&
        QUIET_HOURS_EVENTS.has(eventKey)
      ) {
        const quietRaw = this.getConfigValue(map, 'SMS_QUIET_HOURS', '21-7');
        const quietSpec = parseQuietHours(quietRaw);
        if (isWithinQuietHours(quietSpec)) {
          return { success: false, reason: 'Quiet hours', skipped: true, quietHours: true };
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
        return { success: false, reason: 'Invalid phone number format' };
      }

      const maxLength = 160;
      const truncatedMessage =
        message.length > maxLength ? `${message.substring(0, maxLength - 3)}...` : message;

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
        if (!this.apiKey) {
          console.error('❌ MNotify API key not configured');
          result = { success: false, reason: 'MNotify API key not configured' };
        } else {
          result = await this._sendViaMNotify(formattedPhone, truncatedMessage);
        }
      }

      if (dedupeKey || jobId || eventKey) {
        try {
          await prisma.smsDispatchLog.upsert({
            where: { dedupeKey: dedupeKey || `oneshot:${eventKey || 'custom'}:${formattedPhone}:${Date.now()}` },
            create: {
              eventKey: eventKey || 'CUSTOM',
              jobId,
              userId,
              phone: formattedPhone,
              dedupeKey: dedupeKey || `oneshot:${eventKey || 'custom'}:${formattedPhone}:${Date.now()}`,
              message: truncatedMessage,
              status: result.success ? 'sent' : result.skipped ? 'skipped' : 'failed',
              metadata: metadata || undefined
            },
            update: {
              status: result.success ? 'sent' : 'failed',
              message: truncatedMessage,
              metadata: metadata || undefined
            }
          });
        } catch (logErr) {
          // Unique race — ignore
          if (logErr.code !== 'P2002') {
            console.error('❌ [SMS] Failed to write dispatch log:', logErr.message);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  async _sendViaMNotify(formattedPhone, truncatedMessage) {
    // MNotify quick SMS: POST with recipient array; accepts 0XXXXXXXXX or 233…
    // Prefer local 0-prefix for API examples compatibility, keep 233 in logs.
    const localRecipient =
      formattedPhone.startsWith('233') && formattedPhone.length === 12
        ? `0${formattedPhone.slice(3)}`
        : formattedPhone;

    const url = `${this.apiUrl}?key=${encodeURIComponent(this.apiKey)}`;
    const body = {
      recipient: [localRecipient],
      sender: this.senderId,
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
}

module.exports = new SmsService();
