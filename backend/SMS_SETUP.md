# SMS Service Setup (MNotify)

CN Terminal sends SMS via **MNotify** (Ghana). Clickatell is deprecated and no longer used.

## Credentials (source of truth: Admin UI)

**Primary path:** Admin Dashboard → **SMS Settings** → **MNotify credentials**.

Enter:

| Field | Config key | Notes |
|-------|------------|--------|
| API key | `MNOTIFY_API_KEY` | Password field; never returned in cleartext after save |
| Sender ID | `MNOTIFY_SENDER_ID` | Max **11 characters** (MNotify rule) |
| API URL (optional) | `MNOTIFY_API_URL` | Defaults to `https://api.mnotify.com/api/sms/quick` |

Only **ADMIN** / **IT_CONSULTANT** can read or update these fields. Seed defaults leave the API key empty — do not invent a real key.

The backend reads credentials from the **configurations** table (short TTL cache). Env vars are an **optional local/dev fallback** only:

```bash
# Optional local/dev fallback (production: use Admin UI)
# MNOTIFY_API_KEY=your_mnotify_api_key
# MNOTIFY_SENDER_ID=CNTerminal
# MNOTIFY_API_URL=https://api.mnotify.com/api/sms/quick

# Development: log SMS instead of calling MNotify
SMS_DEV_MODE=true

# Optional: run one SMS scan ~60s after server boot
# SMS_SCHEDULER_RUN_ON_BOOT=true
```

Numbers are normalized to Ghana `233XXXXXXXXX` internally; the API call uses local `0XXXXXXXXX` format.

## Getting an API key

1. Create / log in at [mNotify](https://www.mnotify.com/) / BMS.
2. Generate an API key (API v2).
3. Register a sender ID (max 11 chars).
4. Docs: https://readthedocs.mnotify.com/ (Quick Bulk SMS → `POST /api/sms/quick?key=...`)
5. Paste the key and sender ID into **Admin → SMS Settings** (no GitHub secrets required).

## Master + per-event toggles

Controlled in the database via configurations (Admin Dashboard → **SMS Settings**, or Configuration page → SMS).

| Key | Default | Notes |
|-----|---------|--------|
| `SMS_NOTIFICATIONS` | `false` | **Master** — must be ON for any SMS |
| `MNOTIFY_API_KEY` | _(empty)_ | Admin UI — sensitive |
| `MNOTIFY_SENDER_ID` | _(empty)_ | Admin UI — max 11 chars |
| `MNOTIFY_API_URL` | MNotify quick URL | Optional override |
| `SMS_JOB_ASSIGNED` | `true` | Staff — new assignee (skip self-assign) |
| `SMS_JOB_REASSIGNED` | `true` | Staff — new + previous |
| `SMS_STAFF_STAGE_HANDOFF` | `true` | Status advance + assignee change |
| `SMS_STATUS_REVERTED` | `true` | Assignee + SUPERVISOR (+ ADMIN optional) |
| `SMS_ETA_APPROACHING` | `true` | Cron — staff 7d / 3d thresholds |
| `SMS_ETA_OVERDUE` | `true` | Cron — staff daily to assignee + SUPERVISOR |
| `SMS_DEMURRAGE` | `true` | Cron |
| `SMS_RELEASE_SCHEDULE_SLIPPED` | `true` | Cron |
| `SMS_STUCK_ASSIGNEE` | `true` | Cron |
| `SMS_STUCK_STATUS` | `true` | Cron — per-status SLA JSON |
| `SMS_ESCALATION` | `true` | Cron — SUPERVISOR then ADMIN |
| `SMS_REASSIGN_CHURN` | `true` | ≥N reassigns / 24h |
| `SMS_RELEASE_MONEY` | `true` | Cron after delay |
| `SMS_COMMENT_ASSIGNEE` | `false` | Opt-in |
| `SMS_CUSTOMER_JOB_CREATED_ETA` | `true` | **Job created → customer** (include ETA; skip if no ETA) |
| `SMS_CUSTOMER_*` milestones | `true` | Incl. READY_FOR_RELEASE |
| `SMS_CUSTOMER_CONSIGNEE_COPY` | `false` | RELEASED / CLEARED / DELIVERED |
| `SMS_CUSTOMER_ETA_APPROACHING` | `false` | **ETA approaching → customer** (uses `Customer.phone`) |
| `SMS_CUSTOMER_ETA_OVERDUE` | `false` | **ETA overdue → customer** (reputation risk) |
| `SMS_PAYMENT_REMINDER` | `false` | Overdue invoices |

Thresholds: `SMS_ETA_WARN_DAYS` (`7,3`), `SMS_ETA_OVERDUE_REPEAT_HOURS` (24), `SMS_STUCK_ASSIGNEE_HOURS` (24), `SMS_STATUS_SLA_HOURS` (JSON), `SMS_ESCALATION_HOURS` (24), `SMS_REASSIGN_CHURN_COUNT` (3), `SMS_RELEASE_MONEY_DELAY_HOURS` (2), `SMS_QUIET_HOURS` (`21-7` Africa/Accra).

Quiet hours apply to SLA/ETA nudges only — **not** assignment, reassignment, or customer milestones.

**Job identity in SMS:** Messages identify a job by **container number** and **client / consignee name**, not tracking ID (e.g. CNT-2026-001234). Example: `CN Terminal: Job for Acme Ltd / Kwame Mensah · MSKU1234567: created. ETA: 03 Sep 2026.` Tracking ID is used only if both names and container are missing.

**Staff phones:** Assignment / reassignment SMS uses `User.phone`. If empty, in-app notifications still work but SMS is skipped (logged as `skipped` in `SmsDispatchLog`). Team members set phone under Settings → Profile; Admin user list now shows phone and warns when missing.

Client ETA toggles are independent of staff ETA toggles: turning staff ETA off does not block customer ETA SMS (and vice versa). Both still require the master switch.

Runtime note: if an event key was never seeded, the backend now uses the same product defaults as the Admin UI (previously UI could show ON while sends treated missing keys as OFF). Still prefer **Seed missing defaults** so values persist in the DB.

## Scheduler

`backend/jobs/smsScheduler.js` runs every **20 minutes** via `node-cron` (started from `server.js`).

Scans: ETA approaching/overdue (staff + optional customer), stuck assignee/status, escalation, demurrage, release schedule slipped, release money, overdue payment reminders.

Dedupe: `SmsDispatchLog` table (`dedupeKey` unique).

`Job.lastAssignedAt` is updated on assignment/reassign. Older jobs fall back to current status history date / `updatedAt`.

## Local testing with SMS_DEV_MODE

1. Set `SMS_DEV_MODE=true` in `backend/.env`.
2. Restart the backend.
3. In Admin → SMS Settings: turn **Enable SMS notifications** ON; leave event toggles as needed.
4. Ensure staff/customer records have phone numbers.
5. Trigger an event (assign a job, advance to `ENTRY_COMPLETED`, etc.).
6. Check backend logs for:

```text
📱 [SMS DEV MODE] SMS would be sent:
   Event: SMS_JOB_ASSIGNED
   To: 233XXXXXXXXX
   Message: ...
```

7. Set `SMS_DEV_MODE=false` and enter real MNotify credentials in **Admin → SMS Settings** for production.

## Manual API usage

```js
const smsService = require('./services/smsService');

await smsService.sendSms({
  to: '0241234567',
  message: 'Test from CN Terminal',
  eventKey: 'SMS_JOB_ASSIGNED' // optional toggle check
});
```

## Troubleshooting

- Master `SMS_NOTIFICATIONS` must be `true`.
- Per-event toggle must be `true`.
- MNotify API key + sender ID must be set in Admin → SMS Settings (or env fallback).
- User/customer must have a phone number.
- Check MNotify balance and sender ID approval.
- Deduped cron events will not re-send until the dedupe key changes (often daily).

## Production deploy notes

**You do not need GitHub secrets for MNotify** — after deploy, an admin sets credentials in the app.

Deploy may still wire optional `MNOTIFY_*` env vars from GitHub secrets as a **fallback** (`deploy.yml` / `docker-compose.prod.yml`). Prefer the Admin UI so credentials survive without re-deploying secrets.

`SMS_DEV_MODE` is forced to `false` on production deploys. The in-app master toggle `SMS_NOTIFICATIONS` stays **off** until an admin enables it.

### After this change

1. Redeploy (or restart) the backend so the new code/config keys are live.
2. Admin → SMS Settings → **Seed missing defaults** (adds `MNOTIFY_*`, `SMS_CUSTOMER_JOB_CREATED_ETA`, and other new keys if missing).
3. Enter MNotify API key + sender ID and save.
4. Enable master SMS and any client ETA toggles you want.
