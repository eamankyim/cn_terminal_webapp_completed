const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { exports: module.exports, module, require: name => { if (name in mocks) return mocks[name]; throw new Error(`Unexpected dependency ${name}`); }, URLSearchParams, setTimeout, clearTimeout });
  return module.exports;
}

test('pagination fetches past the first 100 records and preserves filters', async () => {
  const calls = [];
  const { fetchAllPages } = load('src/api/pagination.ts', { './http': { api: { get: async url => {
    calls.push(url);
    return { jobs: [{ id: calls.length }], pagination: { pages: 3 } };
  } } } });
  const rows = await fetchAllPages('/jobs?status=NEW', 'jobs');
  assert.equal(rows.length, 3);
  assert.equal(calls[2], '/jobs?status=NEW&page=3&limit=100');
});
test('unpaginated estimates terminate even with more than 100 records', async () => {
  let calls = 0;
  const { fetchAllPages } = load('src/api/pagination.ts', { './http': { api: { get: async () => { calls++; return { estimates: Array.from({ length: 150 }, (_, id) => ({ id })) }; } } } });
  assert.equal((await fetchAllPages('/estimates', 'estimates')).length, 150);
  assert.equal(calls, 1);
});
test('pagination surfaces failures instead of returning incomplete records', async () => {
  const { fetchAllPages } = load('src/api/pagination.ts', { './http': { api: { get: async url => {
    if (url.includes('page=2')) throw new Error('Network unavailable');
    return { customers: [{ id: 1 }], pagination: { totalPages: 2 } };
  } } } });
  await assert.rejects(fetchAllPages('/customers', 'customers'), /Network unavailable/);
});
test('invoice charge and VAT totals match the web form for all six charges', () => {
  const { calculateInvoiceCharges, emptyCharges } = load('src/utils/invoiceCharges.ts');
  const result = calculateInvoiceCharges({ ...emptyCharges(), customDuty: '100', shippingCharges: '20', terminalCharges: '30', miscellaneous: '5', clearanceCharges: '10', serviceCharge: '35' }, 15);
  assert.equal(result.charges.vat, 30);
  assert.equal(result.amount, 230);
  assert.equal(calculateInvoiceCharges({ ...emptyCharges(), serviceCharge: '0.03' }, 15).amount, 0.03);
  assert.equal(calculateInvoiceCharges({ ...emptyCharges(), serviceCharge: '100' }, 0).amount, 100);
  assert.throws(() => calculateInvoiceCharges({ ...emptyCharges(), customDuty: '-1' }, 15));
  assert.throws(() => calculateInvoiceCharges({ ...emptyCharges(), customDuty: 'NaN' }, 15));
});
test('menu exposes admin workflows only to appropriate roles', () => {
  const { getMoreMenuLinks } = load('src/utils/permissions.ts');
  const screens = user => getMoreMenuLinks(user).map(item => item.screen);
  assert.ok(screens({ role: 'ADMIN', permissions: [] }).includes('Configuration'));
  assert.ok(screens({ role: 'ADMIN', permissions: [] }).includes('Invitations'));
  assert.ok(!screens({ role: 'IT_CONSULTANT', permissions: [] }).includes('Invitations'));
  assert.ok(!screens({ role: 'STAFF', permissions: ['ui:settings'] }).includes('Roles'));
  assert.ok(screens({ role: 'ACCOUNTANT', permissions: ['ui:accounting'] }).includes('Payouts'));
  assert.ok(!screens({ role: 'STAFF', permissions: [] }).includes('Payouts'));
});
test('job socket tears down its own connection and uses the latest callback', () => {
  let effect, cleanup, calls = 0;
  const refs = [];
  let refIndex = 0;
  const listeners = new Map();
  const socket = { on: (event, cb) => listeners.set(event, cb), emit: () => {}, disconnect: () => calls++ };
  const { useJobSocket } = load('src/realtime/useJobSocket.tsx', {
    react: { useEffect: fn => { effect = fn; }, useRef: value => { const i = refIndex++; return refs[i] ?? (refs[i] = { current: value }); } },
    'socket.io-client': { io: () => socket }, '../config/env': { API_BASE_URL: 'https://example.com/api' },
    '../context/AuthContext': { useAuth: () => ({ user: { id: 'one' }, token: 'token-one' }) },
  });
  let received = '';
  useJobSocket({ onJobUpdated: () => { received = 'old'; } }); cleanup = effect();
  refIndex = 0;
  useJobSocket({ onJobUpdated: () => { received = 'new'; } });
  listeners.get('job:updated')({ job: { id: 'job' } });
  assert.equal(received, 'new');
  cleanup(); assert.equal(calls, 1);
});
test('notification subscribers share one alarm and disconnect on last unsubscribe', () => {
  const effects = [];
  let connections = 0, alarms = 0, disconnected = 0;
  const listeners = new Map();
  const socket = {
    on: (event, cb) => { const set = listeners.get(event) || new Set(); set.add(cb); listeners.set(event, set); },
    off: (event, cb) => listeners.get(event)?.delete(cb), emit: () => {}, disconnect: () => disconnected++,
  };
  const { useNotificationSocket } = load('src/realtime/useNotificationSocket.tsx', {
    react: { useEffect: fn => effects.push(fn), useRef: value => ({ current: value }) },
    'react-native': { Alert: { alert: () => alarms++ }, Vibration: { vibrate: () => {} } },
    'socket.io-client': { io: () => { connections++; return socket; } },
    '../config/env': { API_BASE_URL: 'https://example.com/api' },
    '../context/AuthContext': { useAuth: () => ({ user: { id: 'one' }, token: 'token-one' }) },
  });
  let updates = 0;
  useNotificationSocket({}); const cleanup1 = effects.pop()();
  useNotificationSocket({ onNewNotification: () => updates++ }); const cleanup2 = effects.pop()();
  for (const listener of listeners.get('new_notification')) listener({ category: 'JOB_ASSIGNMENT' });
  assert.equal(connections, 1); assert.equal(alarms, 1); assert.equal(updates, 1);
  cleanup1(); assert.equal(disconnected, 0);
  for (const listener of listeners.get('new_notification')) listener({});
  assert.equal(updates, 2);
  cleanup2(); assert.equal(disconnected, 1);
});

test('UI grants enable the equivalent native document and reporting actions', () => {
  const { hasPermission, PERMISSIONS } = load('src/utils/permissions.ts');
  const user = { role: 'STAFF', permissions: ['ui:upload_file', 'ui:download_file', 'ui:export_reports', 'ui:create_cashflow'] };
  assert.equal(hasPermission(user, PERMISSIONS.FILE_UPLOAD), true);
  assert.equal(hasPermission(user, PERMISSIONS.FILE_DOWNLOAD), true);
  assert.equal(hasPermission(user, PERMISSIONS.REPORTS_EXPORT), true);
  assert.equal(hasPermission(user, PERMISSIONS.CASHFLOW_CREATE), true);
  assert.equal(hasPermission(user, PERMISSIONS.FILE_DELETE), false);
});
