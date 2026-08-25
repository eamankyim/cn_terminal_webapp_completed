#!/usr/bin/env node
/**
 * Job Status Report
 * -----------------
 * Looks up the current status of jobs from a pasted list of references
 * (e.g. a WhatsApp message containing lines like "BLNUMBER/CONTAINER1/CONTAINER2").
 *
 * Usage:
 *   node scripts/job-status-report.js                # uses the default embedded list below
 *   node scripts/job-status-report.js refs.txt       # reads references from a text file
 *   cat refs.txt | node scripts/job-status-report.js # reads references from stdin
 *   node scripts/job-status-report.js --json         # machine-readable JSON output
 *
 * Matching strategy (read-only, no writes):
 *   - Every token on a line is matched (case-insensitive, trimmed) against
 *     Job.trackingId, Job.blNumber, Job.containerNumber and Job.boeNumber.
 *   - Exact matches score higher than partial ("contains") matches; tokens of the
 *     same line accumulate evidence for the same job (e.g. BL + its containers).
 *   - Lines that match nothing are reported as NOT FOUND so they can be chased up.
 */

require('dotenv').config();

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Default input: message received from Jennifer CN on 24/08/2026 14:03
// ---------------------------------------------------------------------------
const DEFAULT_INPUT = `
[24/08/2026, 14:03:18] Jennifer CN: 272926872/MSKU3644229/MSKU7781301
FOC0355179/TCNU3159590
NGRI60632500/PCIU9269916
272369951/CAAU7079752
271662481/MRSU5808148
HLCUKHI260638968/TCKU6448713
MEDUAAV32251/MEDU7720129
272594370/MRSU2898322
271655048/MRKU3968252
OOLU2171028950/CSNU7854634
272056643/MRKU0936610
270792142/MRKU2131404
272528431/BEAU5748970
271501238/CAIU9526826
272525888/MRKU4482898
272377138/MRSU6873092
271711985/MRKU5282030
271808379/SEKU6939670
[24/08/2026, 14:03:19] Jennifer CN: GOSUGZH0727266/ZCSU6735522
271501256/MSKU5619159
GOSUGZH0742768/CAAU9437027
272378251/TCNU4513007
83641220
272382061/TCKU7431504
MEDURE907700/MSNU8949884
ONEYCPTG28215800/DRYU9206525/ONEU5989431
MEDURT630080/MSDU5970960
MEDURT619372/CAAU9449537
272615098/TCNU2815008
HLCUSYD260426891/TCNU1788633
NGZN60438400/PIDU4691243
272694049/MRKU2710617
272860894/MIEU3093947
272740433/SELU4175456
ONEYCMBG15039507/ONEU5414680
TAO600633600/PIDU4196954
NGCN60606400/PIDU4466746
ONEYCMBG15039508/TCLU8145014
HUHG60752100/PCIU8897142
272369857/BMOU4097312
`;

// ---------------------------------------------------------------------------
// Status presentation - mirrors frontend/src/pages/JobsPage.jsx & statusUtils.js
// ---------------------------------------------------------------------------
const STATUS_LABELS = {
  NEW: 'New',
  PREINVOICED: 'Pre-invoiced',
  INVOICED: 'Invoiced',
  ENTRY: 'Entry',
  ENTRY_COMPLETED: 'Entry Completed',
  DUTY_PAID: 'Duty Paid',
  READY_FOR_RELEASE: 'Ready for Release',
  RELEASE: 'Release',
  RELEASED: 'Released',
  CLEARED: 'Cleared',
  DELIVERED: 'Delivered',
};

const STATUS_ICONS = {
  NEW: '➕',
  PREINVOICED: '📋',
  INVOICED: '🧾',
  ENTRY: '🗂️',
  ENTRY_COMPLETED: '📦',
  DUTY_PAID: '💰',
  READY_FOR_RELEASE: '🚗',
  RELEASE: '🔑',
  RELEASED: '🔓',
  CLEARED: '🟢',
  DELIVERED: '🚚',
};

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Strip WhatsApp-style "[dd/mm/yyyy, hh:mm:ss] Sender:" prefixes and noise. */
function cleanLine(line) {
  return line
    .replace(/^\s*\[[^\]]+\]\s*[^:]*:\s*/, '') // [24/08/2026, 14:03:18] Jennifer CN:
    .trim();
}

/** Turn raw pasted text into an array of { lineNo, tokens } groups. */
function parseReferences(rawText) {
  const groups = [];
  const lines = rawText.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const tokens = line
      .split('/')
      .map((t) => t.replace(/[\s,;.]+$/, '').replace(/\s+/g, '').toUpperCase())
      .filter(Boolean);

    if (tokens.length === 0) continue;
    groups.push({ lineNo: groups.length + 1, original: line.trim(), tokens });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

function normalize(value) {
  return (value || '').replace(/\s+/g, '').toUpperCase();
}

/**
 * How strongly does one token point at one job?
 *  3 = exact hit on trackingId/blNumber/boeNumber/invoiceNumber
 *  2 = container field exactly equals the token (single-container storage)
 *  1 = token found inside any of those fields (multi-container strings etc.)
 */
function scoreTokenAgainstJob(token, job) {
  const fields = {
    trackingId: normalize(job.trackingId),
    blNumber: normalize(job.blNumber),
    boeNumber: normalize(job.boeNumber),
    invoiceNumber: normalize(job.invoiceNumber),
    containerNumber: normalize(job.containerNumber),
  };

  // Exact identifier hits
  if (token && (token === fields.trackingId || token === fields.blNumber || token === fields.boeNumber)) {
    const field = token === fields.trackingId ? 'Job ID' : token === fields.blNumber ? 'B/L' : 'BOE';
    return { score: 3, field };
  }
  if (token && fields.containerNumber === token) {
    return { score: 2, field: 'Container' };
  }
  // Partial containment (handles "CONT1,CONT2" style stored values)
  if (token && token.length >= 5) {
    if (fields.containerNumber.includes(token)) return { score: 1, field: 'Container' };
    if (fields.blNumber.includes(token)) return { score: 1, field: 'B/L' };
    if (fields.trackingId.includes(token)) return { score: 1, field: 'Job ID' };
  }
  return null;
}

/** Find the best-matching job for a group of tokens. */
function findBestMatch(tokens, jobs) {
  const tally = new Map(); // jobId -> { job, score, evidence }

  for (const token of tokens) {
    let bestForToken = null;
    for (const job of jobs) {
      const hit = scoreTokenAgainstJob(token, job);
      if (hit && (!bestForToken || hit.score > bestForToken.hit.score)) {
        bestForToken = { job, hit };
      }
    }
    if (bestForToken) {
      const entry = tally.get(bestForToken.job.id) || {
        job: bestForToken.job,
        score: 0,
        evidence: [],
      };
      entry.score += bestForToken.hit.score;
      entry.evidence.push(`${token} → ${bestForToken.hit.field}`);
      tally.set(bestForToken.job.id, entry);
    }
  }

  if (tally.size === 0) return null;

  const ranked = [...tally.values()].sort((a, b) => b.score - a.score);
  return { best: ranked[0], alternatives: ranked.slice(1) };
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------
const pad = (str, len) => String(str ?? '').slice(0, len).padEnd(len);
const truncate = (str, len) => {
  const s = String(str ?? '');
  return s.length > len ? `${s.slice(0, len - 1)}…` : s;
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function statusBadge(job) {
  const icon = STATUS_ICONS[job.status] || '📄';
  const label = STATUS_LABELS[job.status] || job.status;
  return `${icon} ${label}${job.isDraft ? ' (draft)' : ''}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const fileArg = args.find((a) => !a.startsWith('--'));

  let rawInput = DEFAULT_INPUT;
  if (fileArg) {
    rawInput = fs.readFileSync(fileArg, 'utf8');
  } else if (!process.stdin.isTTY) {
    try {
      const piped = fs.readFileSync(0, 'utf8').trim();
      if (piped) rawInput = piped;
    } catch (_) {
      /* no stdin piped - keep default */
    }
  }

  const groups = parseReferences(rawInput);
  if (groups.length === 0) {
    console.error('No references found in the input.');
    process.exit(1);
  }

  console.log(`🔍 Loading jobs from database (${groups.length} references to check)...`);
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      trackingId: true,
      blNumber: true,
      containerNumber: true,
      boeNumber: true,
      invoiceNumber: true,
      status: true,
      isDraft: true,
      eta: true,
      vesselName: true,
      line: true,
      updatedAt: true,
      customer: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  const results = [];
  for (const group of groups) {
    const match = findBestMatch(group.tokens, jobs);
    results.push({ group, match });
  }

  // ----- Detailed report ---------------------------------------------------
  if (!jsonOut) {
    console.log('');
    console.log('═'.repeat(100));
    console.log(`  CN TERMINAL — JOB STATUS REPORT  (${groups.length} references checked)`);
    console.log('═'.repeat(100));
  }

  let matchedCount = 0;
  const statusCounts = {};
  const notFound = [];

  results.forEach(({ group, match }, idx) => {
    const refs = group.tokens.join(' / ');

    if (!match) {
      notFound.push(group);
      if (jsonOut) return;
      console.log(`${pad(idx + 1 + '.', 4)}❌ NOT FOUND   Refs: ${refs}`);
      return;
    }

    const { job, evidence } = match.best;
    matchedCount += 1;
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;

    if (jsonOut) return;

    console.log(`${pad(idx + 1 + '.', 4)}${statusBadge(job)}`);
    console.log(`     Refs in message : ${refs}`);
    console.log(`     Matched job     : ${job.trackingId}   (${truncate(job.customer?.name, 40)})`);
    console.log(
      `     B/L: ${pad(job.blNumber || '—', 24)} Container: ${pad(truncate(job.containerNumber || '—', 26), 27)} BOE: ${job.boeNumber || '—'}`
    );
    console.log(
      `     Assigned to: ${pad(truncate(job.assignedTo?.name || '—', 20), 21)} ETA: ${pad(fmtDate(job.eta), 13)} Last update: ${fmtDate(job.updatedAt)}`
    );
    if (match.alternatives.length > 0) {
      console.log(`     ⚠️  Also resembles: ${match.alternatives.map((a) => a.job.trackingId).join(', ')}`);
    }
    console.log(`     Evidence        : ${evidence.join('; ')}`);
    console.log('-'.repeat(100));
  });

  // ----- Summary -----------------------------------------------------------
  if (jsonOut) {
    const payload = {
      generatedAt: new Date().toISOString(),
      totalReferences: groups.length,
      matched: matchedCount,
      notFound: notFound.map((g) => ({ refs: g.tokens.join('/'), original: g.original })),
      statusDistribution: Object.fromEntries(Object.entries(statusCounts).sort()),
      jobs: results
        .filter((r) => r.match)
        .map(({ group, match }) => ({
          refs: group.tokens.join('/'),
          trackingId: match.best.job.trackingId,
          status: match.best.job.status,
          statusLabel: STATUS_LABELS[match.best.job.status] || match.best.job.status,
          customer: match.best.job.customer?.name,
          blNumber: match.best.job.blNumber,
          containerNumber: match.best.job.containerNumber,
          eta: match.best.job.eta,
          updatedAt: match.best.job.updatedAt,
        })),
    };
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log('');
    console.log('📊 SUMMARY');
    console.log(`   References checked : ${groups.length}`);
    console.log(`   ✅ Matched jobs    : ${matchedCount}`);
    console.log(`   ❌ Not found       : ${notFound.length}`);
    if (notFound.length > 0) {
      console.log('      Missing refs    :');
      notFound.forEach((g) => console.log(`        • ${g.tokens.join(' / ')}`));
    }
    console.log('');
    console.log('   Status distribution:');
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`     ${(STATUS_ICONS[status] || '📄')} ${pad(STATUS_LABELS[status] || status, 20)} ${count}`);
      });
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Report failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});


