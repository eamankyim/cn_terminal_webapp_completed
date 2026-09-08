#!/usr/bin/env node
/**
 * EMERGENCY STOP — blocks every outbound SMS immediately.
 *
 *   node scripts/sms-emergency-stop.js          # stop all SMS
 *   node scripts/sms-emergency-stop.js --status # show state, change nothing
 *   node scripts/sms-emergency-stop.js --release
 *
 * Sets SMS_MASTER_KILL=true and SMS_NOTIFICATIONS=false. Both are read on every
 * send, so running processes pick the change up within the 30s config cache.
 */
const { prisma } = require('../config/database');
const smsService = require('../services/smsService');

async function printState(label) {
  const state = await smsService.getSafetyState();
  console.log(`\n=== ${label} ===`);
  console.log(`  Can send now .......: ${state.canSend ? 'YES' : 'NO'}`);
  console.log(`  Kill switch ........: ${state.killSwitch.on ? 'ON (blocking)' : 'off'}`);
  if (state.killSwitch.reason) console.log(`     reason ..........: ${state.killSwitch.reason}`);
  console.log(`  Master switch ......: ${state.master.enabled ? 'ON' : 'OFF'} (${state.master.reason})`);
  console.log(`  Dev mode ...........: ${state.devMode ? 'SMS_DEV_MODE (no real sends)' : 'live'}`);
  console.log(
    `  Rate limit .........: ${state.rateLimit.counts.minute}/${state.rateLimit.limits.perMinute} per min, ` +
      `${state.rateLimit.counts.hour}/${state.rateLimit.limits.perHour} per hour`
  );
  console.log(`  Enabled toggles ....: ${state.enabledEventKeys.join(', ') || 'none'}`);
  console.log('');
  return state;
}

async function main() {
  const args = process.argv.slice(2);
  const statusOnly = args.includes('--status');
  const release = args.includes('--release');

  await printState('SMS state before');

  if (statusOnly) return;

  if (release) {
    await smsService.setKillSwitch(false, null);
    console.log('✅ Kill switch released. Master switch left OFF — turn it on deliberately.');
  } else {
    await smsService.setKillSwitch(true, null);
    await smsService.setMasterEnabled(false, null);
    console.log('🛑 ALL SMS STOPPED (kill switch ON, master OFF).');
  }

  await printState('SMS state after');
}

main()
  .catch((err) => {
    console.error('❌ Emergency stop failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
