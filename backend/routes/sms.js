const express = require('express');
const { authenticateToken, requireAdminOrIT } = require('../middleware/auth');
const smsService = require('../services/smsService');

const router = express.Router();

const DEFAULT_TEST_MESSAGE = 'CN Terminal SMS test';

/**
 * POST /api/sms/test
 * Admin / IT Consultant: send a test SMS via the same MNotify path as production.
 * Bypasses master SMS_NOTIFICATIONS and event toggles; still requires credentials.
 */
router.post('/test', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const message = String(req.body?.message || '').trim() || DEFAULT_TEST_MESSAGE;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await smsService.sendSms({
      to: phone,
      message,
      eventKey: 'SMS_TEST',
      bypassToggles: true,
      skipQuietHours: true,
      userId: req.user.id,
      dedupeKey: `sms-test:${req.user.id}:${Date.now()}`,
      metadata: { adminTest: true, testerId: req.user.id }
    });

    const formatted = result.phoneNumber || smsService.formatPhoneNumber(phone);

    return res.json({
      success: !!result.success,
      message: result.success
        ? result.devMode
          ? 'Test SMS logged in SMS_DEV_MODE (not sent to MNotify)'
          : 'Test SMS sent'
        : result.reason || result.error || 'Test SMS failed',
      data: {
        success: !!result.success,
        skipped: !!result.skipped,
        reason: result.reason || result.error || null,
        phoneNumber: formatted,
        phoneMasked: smsService.maskPhone(formatted),
        messageId: result.messageId || null,
        provider: result.provider || (result.devMode ? 'dev' : 'mnotify'),
        devMode: !!result.devMode,
        providerResponse: result.providerResponse || null
      }
    });
  } catch (error) {
    console.error('❌ [SMS] Test send failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test SMS',
      error: error.message
    });
  }
});

/**
 * GET /api/sms/stats
 * Admin / IT Consultant: dispatch totals, event breakdown, recent failures, connection status.
 */
router.get('/stats', authenticateToken, requireAdminOrIT, async (req, res) => {
  try {
    const data = await smsService.getAdminStats({
      recentLimit: req.query.recentLimit,
      failureLimit: req.query.failureLimit
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [SMS] Stats failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load SMS statistics',
      error: error.message
    });
  }
});

module.exports = router;
