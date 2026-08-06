#!/usr/bin/env node
/**
 * Programmatic test of mobile app API endpoints against the backend.
 * Validates response status and response shape (keys) expected by the mobile app.
 *
 * Usage:
 *   npm run test:api
 *   (Loads .env from mobile project root; or set MOBILE_TEST_EMAIL / MOBILE_TEST_PASSWORD)
 *
 * Uses EXPO_PUBLIC_API_URL or default https://app.cnterminalghana.com/api
 */

const path = require('path');
const fs = require('fs');

// Load .env from project root (mobile/)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  });
}

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://app.cnterminalghana.com/api';

function request(method, path, body = null, token = null) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { status: res.status, data, ok: res.ok };
  });
}

function assertKeys(obj, keys, label) {
  const missing = keys.filter((k) => !(k in (obj || {})));
  if (missing.length) {
    throw new Error(`${label}: missing keys ${missing.join(', ')}`);
  }
}

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => ({ name, ok: true }))
    .catch((err) => ({ name, ok: false, error: err.message }));
}

async function run() {
  const results = [];
  let token = null;

  // --- Public endpoints (no auth) ---
  results.push(
    await test('GET /init/check', async () => {
      const { status, data } = await request('GET', '/init/check');
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['initialized'], 'init/check');
    })
  );

  results.push(
    await test('GET / (API root)', async () => {
      const { status, data } = await request('GET', '/');
      if (status !== 200) throw new Error(`status ${status}`);
      if (!data || !data.status) throw new Error('missing status in root');
    })
  );

  // --- Login if credentials provided ---
  const email = process.env.MOBILE_TEST_EMAIL;
  const password = process.env.MOBILE_TEST_PASSWORD;
  if (email && password) {
    results.push(
      await test('POST /auth/login', async () => {
        const { status, data } = await request('POST', '/auth/login', { email, password });
        if (!data || !data.token) throw new Error(data?.error || `status ${status}`);
        assertKeys(data, ['user', 'token'], 'auth/login');
        assertKeys(data.user, ['id', 'name', 'email', 'role'], 'auth/login user');
        token = data.token;
      })
    );
  } else {
    results.push({
      name: 'POST /auth/login (skipped – set MOBILE_TEST_EMAIL and MOBILE_TEST_PASSWORD to test)',
      ok: true,
      skipped: true,
    });
  }

  if (!token) {
    console.log('\n--- Mobile API endpoint tests ---\n');
    results.forEach((r) => {
      const s = r.ok ? (r.skipped ? '⏭' : '✅') : '❌';
      console.log(`${s} ${r.name}`);
      if (!r.ok && r.error) console.log(`   ${r.error}`);
    });
    const failed = results.filter((r) => !r.ok);
    process.exit(failed.length ? 1 : 0);
    return;
  }

  // --- Protected endpoints (with token) ---
  results.push(
    await test('GET /auth/me', async () => {
      const { status, data } = await request('GET', '/auth/me', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['user'], 'auth/me');
      assertKeys(data.user, ['id', 'name', 'email', 'role'], 'auth/me user');
    })
  );

  results.push(
    await test('GET /auth/profile', async () => {
      const { status, data } = await request('GET', '/auth/profile', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['user'], 'auth/profile');
    })
  );

  results.push(
    await test('GET /jobs (list)', async () => {
      const { status, data } = await request('GET', '/jobs?page=1&limit=5', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['jobs'], 'jobs list');
      if (!Array.isArray(data.jobs)) throw new Error('jobs must be array');
      if (data.jobs.length && !data.jobs[0].id) throw new Error('job must have id');
    })
  );

  results.push(
    await test('GET /customers (list)', async () => {
      const { status, data } = await request('GET', '/customers?page=1&limit=5', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['customers'], 'customers list');
      if (!Array.isArray(data.customers)) throw new Error('customers must be array');
    })
  );

  results.push(
    await test('GET /invoices (list)', async () => {
      const { status, data } = await request('GET', '/invoices?page=1&limit=5', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['invoices'], 'invoices list');
      if (!Array.isArray(data.invoices)) throw new Error('invoices must be array');
    })
  );

  results.push(
    await test('GET /estimates (list)', async () => {
      const { status, data } = await request('GET', '/estimates', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['estimates'], 'estimates list');
      if (!Array.isArray(data.estimates)) throw new Error('estimates must be array');
    })
  );

  results.push(
    await test('GET /notifications', async () => {
      const { status, data } = await request('GET', '/notifications?page=1&limit=5', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['success', 'data'], 'notifications');
      assertKeys(data.data || {}, ['notifications', 'pagination'], 'notifications.data');
      if (!Array.isArray(data.data.notifications)) throw new Error('notifications must be array');
    })
  );

  results.push(
    await test('GET /cashflow/summary', async () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      const qs = `startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}`;
      const { status, data } = await request('GET', `/cashflow/summary?${qs}`, null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['summary'], 'cashflow/summary');
      const s = data.summary || {};
      if (typeof s.netCashflow === 'undefined' && typeof s.totalInflows === 'undefined') {
        throw new Error('summary must have netCashflow or totalInflows');
      }
    })
  );

  results.push(
    await test('GET /dashboard/stats', async () => {
      const { status, data } = await request('GET', '/dashboard/stats', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['stats'], 'dashboard/stats');
      assertKeys(data.stats || {}, ['totalJobs', 'jobsInProgress'], 'dashboard stats');
    })
  );

  results.push(
    await test('GET /invoices/jobs', async () => {
      const { status, data } = await request('GET', '/invoices/jobs?limit=10', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['jobs'], 'invoices/jobs');
      if (!Array.isArray(data.jobs)) throw new Error('jobs must be array');
    })
  );

  results.push(
    await test('GET /auth/assignable-users', async () => {
      const { status, data } = await request('GET', '/auth/assignable-users', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['users'], 'assignable-users');
      if (!Array.isArray(data.users)) throw new Error('users must be array');
    })
  );

  results.push(
    await test('GET /expenses/my-requests', async () => {
      const { status, data } = await request('GET', '/expenses/my-requests?page=1&limit=5', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['requests'], 'expenses/my-requests');
      if (!Array.isArray(data.requests)) throw new Error('requests must be array');
    })
  );

  results.push(
    await test('GET /auth/users', async () => {
      const { status, data } = await request('GET', '/auth/users', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['users'], 'auth/users');
      if (!Array.isArray(data.users)) throw new Error('users must be array');
    })
  );

  results.push(
    await test('GET /roles', async () => {
      const { status, data } = await request('GET', '/roles', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['roles'], 'roles');
      if (!Array.isArray(data.roles)) throw new Error('roles must be array');
    })
  );

  results.push(
    await test('GET /configurations', async () => {
      const { status, data } = await request('GET', '/configurations', null, token);
      if (status !== 200) throw new Error(`status ${status}`);
      assertKeys(data, ['data'], 'configurations');
      if (typeof data.data !== 'object' || data.data === null) {
        throw new Error('configurations data must be object');
      }
    })
  );

  // --- Summary ---
  console.log('\n--- Mobile API endpoint tests ---\n');
  results.forEach((r) => {
    const s = r.ok ? (r.skipped ? '⏭' : '✅') : '❌';
    console.log(`${s} ${r.name}`);
    if (!r.ok && r.error) console.log(`   ${r.error}`);
  });
  const failed = results.filter((r) => !r.ok);
  console.log('');
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
