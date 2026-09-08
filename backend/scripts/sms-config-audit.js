#!/usr/bin/env node
/**
 * Audit (and optionally repair) stored SMS configuration.
 *
 *   node scripts/sms-config-audit.js           # report only
 *   node scripts/sms-config-audit.js --fix     # normalise values
 *
 * Repairs performed with --fix:
 *   - boolean rows stored as "No"/"Yes"/"0"/"1"/" true " → canonical "true"/"false"
 *   - boolean rows with an unparseable value → "false" (fail closed)
 *   - SMS_STATUS_SLA_HOURS stored double-encoded → single, valid JSON object
 *   - inactive (isActive=false) toggle rows are reported, never silently enabled
 */
const { prisma } = require('../config/database');
const {
  SMS_TOGGLE_KEYS,
  SMS_MASTER_KEY,
  parseBooleanStrict,
  parseSlaHours
} = require('../services/smsConfig');

async function main() {
  const fix = process.argv.includes('--fix');

  const rows = await prisma.configuration.findMany({
    where: {
      OR: [{ key: { startsWith: 'SMS_' } }, { key: { startsWith: 'MNOTIFY_' } }]
    },
    orderBy: { key: 'asc' }
  });

  console.log(`\nSMS configuration audit — ${rows.length} row(s)${fix ? ' (repair mode)' : ''}\n`);

  const problems = [];
  const repairs = [];

  for (const row of rows) {
    if (SMS_TOGGLE_KEYS.has(row.key)) {
      const parsed = parseBooleanStrict(row.value);
      const canonical = parsed === true ? 'true' : 'false';

      if (parsed === null) {
        problems.push(
          `${row.key}: unparseable boolean ${JSON.stringify(row.value)} → treated as OFF at runtime`
        );
        if (fix) repairs.push({ key: row.key, value: 'false' });
      } else if (row.value !== canonical) {
        problems.push(
          `${row.key}: non-canonical boolean ${JSON.stringify(row.value)} (reads as ${canonical})`
        );
        if (fix) repairs.push({ key: row.key, value: canonical });
      }

      if (row.isActive === false) {
        problems.push(`${row.key}: row is inactive (isActive=false) → treated as OFF`);
      }
    }

    if (row.key === 'SMS_STATUS_SLA_HOURS') {
      const parsed = parseSlaHours(row.value);
      let firstPass = null;
      try {
        firstPass = JSON.parse(row.value);
      } catch {
        firstPass = null;
      }
      const doubleEncoded = typeof firstPass === 'string';
      if (doubleEncoded) {
        problems.push('SMS_STATUS_SLA_HOURS: value is double-encoded JSON (a string inside a string)');
      }
      if (Object.keys(parsed).length === 0) {
        problems.push('SMS_STATUS_SLA_HOURS: no usable per-status hours → stuck-status SMS disabled');
      }
      if (fix && (doubleEncoded || Object.keys(parsed).length > 0)) {
        const canonical = JSON.stringify(parsed);
        if (canonical !== row.value) {
          repairs.push({ key: row.key, value: canonical });
        }
      }
    }
  }

  const master = rows.find((r) => r.key === SMS_MASTER_KEY);
  if (!master) {
    console.log(`⚠️  ${SMS_MASTER_KEY} row is missing → master reads as OFF (fail-closed). Nothing sends.`);
  } else {
    console.log(
      `Master ${SMS_MASTER_KEY} = ${JSON.stringify(master.value)} → ${
        parseBooleanStrict(master.value) === true ? 'ON' : 'OFF'
      }`
    );
  }

  const enabled = rows
    .filter((r) => SMS_TOGGLE_KEYS.has(r.key) && parseBooleanStrict(r.value) === true)
    .map((r) => r.key);
  console.log(`Enabled toggles (${enabled.length}): ${enabled.join(', ') || 'none'}`);

  const missing = [...SMS_TOGGLE_KEYS].filter((k) => !rows.some((r) => r.key === k));
  console.log(`Missing toggle rows (treated as OFF): ${missing.join(', ') || 'none'}`);

  console.log(`\nFindings (${problems.length}):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  if (!problems.length) console.log('  none');

  if (fix && repairs.length) {
    console.log(`\nApplying ${repairs.length} repair(s):`);
    for (const r of repairs) {
      await prisma.configuration.update({
        where: { key: r.key },
        data: { value: r.value }
      });
      console.log(`  ✔ ${r.key} → ${r.value}`);
    }
    try {
      require('../services/smsService').invalidateConfigCache();
    } catch {
      /* not running in-process */
    }
  } else if (fix) {
    console.log('\nNothing to repair.');
  } else if (repairs.length === 0 && problems.length) {
    console.log('\nRe-run with --fix to normalise the values above.');
  }

  console.log('');
}

main()
  .catch((err) => {
    console.error('❌ Audit failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
