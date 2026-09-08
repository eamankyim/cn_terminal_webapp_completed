#!/usr/bin/env node
/**
 * Safety self-test for the SMS gates. Sends NOTHING and writes NOTHING:
 * the provider call and the dispatch log are stubbed before any test runs.
 *
 *   node scripts/sms-safety-selftest.js
 *
 * Verifies, against synthetic config maps:
 *   - master OFF blocks a send even when the event toggle is ON
 *   - a missing master row blocks (fail closed)
 *   - a missing / blank / garbage event row blocks (no default-ON fallback)
 *   - "No", "false", "0", "off" all read as OFF
 *   - the kill switch blocks everything, admin test sends included
 *   - the rate limiter opens the circuit at the configured cap
 *   - double-encoded SLA JSON still parses to usable hours
 */
process.env.SMS_DEV_MODE = 'true';
delete process.env.SMS_KILL_SWITCH;

const smsService = require('../services/smsService');
const smsRateLimiter = require('../services/smsRateLimiter');
const { parseSlaHours, parseBooleanStrict } = require('../services/smsConfig');

// Hard stubs: nothing may reach the provider or the database during the test.
let providerCalls = 0;
smsService._sendViaMNotify = async () => {
  providerCalls += 1;
  return { success: true, messageId: 'stub', provider: 'stub' };
};
smsService._writeDispatchLog = async () => {};
smsService.devMode = false; // exercise the real path up to the stubbed provider

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✘ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function row(key, value, extra = {}) {
  return { key, value, type: 'BOOLEAN', isActive: true, ...extra };
}

/** Run sendSms against a fixed config map, with dedupe / limiter neutralised. */
async function attempt(map, opts = {}) {
  smsService._loadConfigMap = async () => map;
  smsService._configLoadFailed = false;
  const before = providerCalls;
  const result = await smsService.sendSms({
    to: '0241234567',
    message: 'self-test',
    ...opts
  });
  return { result, sent: providerCalls > before };
}

async function main() {
  console.log('\nSMS safety self-test (no messages are sent)\n');

  const credentials = {
    MNOTIFY_API_KEY: { key: 'MNOTIFY_API_KEY', value: 'stub-key', type: 'STRING', isActive: true }
  };

  // Dedupe lookups must not hit the DB.
  const { prisma } = require('../config/database');
  prisma.smsDispatchLog.findUnique = async () => null;

  console.log('Master switch');
  {
    const map = {
      ...credentials,
      ...Object.fromEntries(
        [row('SMS_NOTIFICATIONS', 'false'), row('SMS_JOB_ASSIGNED', 'true')].map((r) => [r.key, r])
      )
    };
    const { result, sent } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('master OFF blocks a send even with the event ON', !sent && result.skipped, result.reason);
  }
  {
    const map = { ...credentials, SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true') };
    const { sent, result } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('missing master row blocks (fail closed)', !sent, result.reason);
  }
  {
    const map = {
      ...credentials,
      SMS_NOTIFICATIONS: row('SMS_NOTIFICATIONS', 'true'),
      SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true')
    };
    const { sent } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('master ON + event ON sends', sent);
  }

  console.log('\nEvent toggles');
  const masterOn = { ...credentials, SMS_NOTIFICATIONS: row('SMS_NOTIFICATIONS', 'true') };
  for (const value of ['false', 'No', 'no', '0', 'off', ' FALSE ', '']) {
    const map = { ...masterOn, SMS_STUCK_STATUS: row('SMS_STUCK_STATUS', value) };
    const { sent } = await attempt(map, { eventKey: 'SMS_STUCK_STATUS', skipQuietHours: true });
    check(`event value ${JSON.stringify(value)} reads as OFF`, !sent);
  }
  {
    const { sent, result } = await attempt(
      { ...masterOn },
      { eventKey: 'SMS_STUCK_ASSIGNEE', skipQuietHours: true }
    );
    check('missing event row blocks (no default-ON fallback)', !sent, result.reason);
  }
  {
    const map = { ...masterOn, SMS_STUCK_STATUS: row('SMS_STUCK_STATUS', 'maybe') };
    const { sent } = await attempt(map, { eventKey: 'SMS_STUCK_STATUS', skipQuietHours: true });
    check('unparseable event value blocks', !sent);
  }
  {
    const map = { ...masterOn, SMS_STUCK_STATUS: row('SMS_STUCK_STATUS', 'true', { isActive: false }) };
    const { sent } = await attempt(map, { eventKey: 'SMS_STUCK_STATUS', skipQuietHours: true });
    check('isActive=false blocks even when value is "true"', !sent);
  }

  console.log('\nKill switch');
  {
    const map = {
      ...masterOn,
      SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true'),
      SMS_MASTER_KILL: row('SMS_MASTER_KILL', 'true')
    };
    const { sent, result } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('kill switch blocks a normal send', !sent, result.reason);

    const bypass = await attempt(map, { eventKey: 'SMS_TEST', bypassToggles: true });
    check('kill switch blocks an admin test (bypassToggles)', !bypass.sent, bypass.result.reason);
  }
  {
    process.env.SMS_KILL_SWITCH = 'true';
    const map = { ...masterOn, SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true') };
    const { sent } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('env SMS_KILL_SWITCH=true blocks', !sent);
    delete process.env.SMS_KILL_SWITCH;
  }
  {
    const map = {
      ...masterOn,
      SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true'),
      SMS_MASTER_KILL: row('SMS_MASTER_KILL', 'garbage')
    };
    const { sent } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
    check('unparseable kill switch value denies', !sent);
  }

  console.log('\nConfig read failure');
  {
    smsService._loadConfigMap = async () => {
      smsService._configLoadFailed = true;
      return {};
    };
    const before = providerCalls;
    await smsService.sendSms({
      to: '0241234567',
      message: 'self-test',
      eventKey: 'SMS_JOB_ASSIGNED'
    });
    check('unreadable config blocks sending', providerCalls === before);
    smsService._configLoadFailed = false;
  }

  console.log('\nRate limiter / circuit breaker');
  {
    const map = {
      ...masterOn,
      SMS_JOB_ASSIGNED: row('SMS_JOB_ASSIGNED', 'true'),
      SMS_MAX_PER_MINUTE: { key: 'SMS_MAX_PER_MINUTE', value: '3', type: 'NUMBER', isActive: true },
      SMS_MAX_PER_HOUR: { key: 'SMS_MAX_PER_HOUR', value: '3', type: 'NUMBER', isActive: true }
    };
    // Isolate from real dispatch history.
    smsRateLimiter.sentAt = [];
    smsRateLimiter.trip = null;
    smsRateLimiter._syncFromDb = async () => ({ at: Date.now(), minute: 0, hour: 0 });
    smsRateLimiter.dbSync = { at: Date.now(), minute: 0, hour: 0 };

    let delivered = 0;
    for (let i = 0; i < 10; i += 1) {
      const { sent } = await attempt(map, { eventKey: 'SMS_JOB_ASSIGNED' });
      if (sent) delivered += 1;
    }
    check(`circuit breaker caps sends at the limit (delivered ${delivered}/10, cap 3)`, delivered === 3);
    check('breaker reports tripped', smsRateLimiter.trip !== null);
  }

  console.log('\nSLA JSON parsing');
  {
    const canonical = JSON.stringify({ NEW: 48, INVOICED: 72 });
    check('plain JSON parses', parseSlaHours(canonical).NEW === 48);
    check('double-encoded JSON parses', parseSlaHours(JSON.stringify(canonical)).NEW === 48);
    check(
      'triple-encoded JSON parses',
      parseSlaHours(JSON.stringify(JSON.stringify(canonical))).INVOICED === 72
    );
    check('garbage yields no SLA rather than 0-hour SLA', Object.keys(parseSlaHours('{oops')).length === 0);
    check('zero / negative hours are dropped', !parseSlaHours('{"NEW":0,"CLEARED":-5}').NEW);
    check('empty value yields {}', Object.keys(parseSlaHours('')).length === 0);
  }

  console.log('\nBoolean parsing');
  {
    check('"Yes" → true', parseBooleanStrict('Yes') === true);
    check('"No" → false', parseBooleanStrict('No') === false);
    check('0 → false', parseBooleanStrict(0) === false);
    check('"" → null (unknown)', parseBooleanStrict('') === null);
    check('"banana" → null (unknown)', parseBooleanStrict('banana') === null);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main()
  .catch((err) => {
    console.error('❌ Self-test crashed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await require('../config/database').prisma.$disconnect();
    } catch {
      /* ignore */
    }
  });
