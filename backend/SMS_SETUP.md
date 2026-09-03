# SMS Service Setup (MNotify)

CN Terminal sends SMS via **MNotify** (Ghana). Clickatell is deprecated and no longer used.

## Environment variables

Add to `backend/.env`:

```bash
# MNotify SMS
MNOTIFY_API_KEY=your_mnotify_api_key
MNOTIFY_SENDER_ID=CNTerminal
# Optional override (default below)
# MNOTIFY_API_URL=https://api.mnotify.com/api/sms/quick

# Development: log SMS instead of calling MNotify
SMS_DEV_MODE=true

# Optional: run one SMS scan ~60s after server boot
# SMS_SCHEDULER_RUN_ON_BOOT=true
```

- `MNOTIFY_SENDER_ID` max **11 characters** (MNotify rule).
- Numbers are normalized to Ghana `233XXXXXXXXX` internally; the API call uses local `0XXXXXXXXX` format.

## Getting an API key

1. Create / log in at [mNotify](https://www.mnotify.com/) / BMS.
2. Generate an API key (API v2).
3. Register a sender ID (max 11 chars).
4. Docs: https://readthedocs.mnotify.com/ (Quick Bulk SMS → `POST /api/sms/quick?key=...`)

## Master + per-event toggles

Controlled in the database via configurations (Admin Dashboard → **SMS Settings**, or Configuration page → SMS).

| Key | Default | Notes |
|-----|---------|--------|
| `SMS_NOTIFICATIONS` | `false` | **Master** — must be ON for any SMS |
| `SMS_JOB_ASSIGNED` | `true` | Staff — new assignee (skip self-assign) |
| `SMS_JOB_REASSIGNED` | `true` | Staff — new + previous |
| `SMS_STAFF_STAGE_HANDOFF` | `true` | Status advance + assignee change |
| `SMS_STATUS_REVERTED` | `true` | Assignee + SUPERVISOR (+ ADMIN optional) |
| `SMS_ETA_APPROACHING` | `true` | Cron — 7d / 3d thresholds |
| `SMS_ETA_OVERDUE` | `true` | Cron — daily to assignee + SUPERVISOR |
| `SMS_DEMURRAGE` | `true` | Cron |
| `SMS_RELEASE_SCHEDULE_SLIPPED` | `true` | Cron |
| `SMS_STUCK_ASSIGNEE` | `true` | Cron |
| `SMS_STUCK_STATUS` | `true` | Cron — per-status SLA JSON |
| `SMS_ESCALATION` | `true` | Cron — SUPERVISOR then ADMIN |
| `SMS_REASSIGN_CHURN` | `true` | ≥N reassigns / 24h |
| `SMS_RELEASE_MONEY` | `true` | Cron after delay |
| `SMS_COMMENT_ASSIGNEE` | `false` | Opt-in |
| `SMS_CUSTOMER_*` milestones | `true` | Incl. READY_FOR_RELEASE |
| `SMS_CUSTOMER_CONSIGNEE_COPY` | `false` | RELEASED / CLEARED / DELIVERED |
| `SMS_CUSTOMER_ETA_OVERDUE` | `false` | Reputation risk |
| `SMS_PAYMENT_REMINDER` | `false` | Overdue invoices |

Thresholds: `SMS_ETA_WARN_DAYS` (`7,3`), `SMS_ETA_OVERDUE_REPEAT_HOURS` (24), `SMS_STUCK_ASSIGNEE_HOURS` (24), `SMS_STATUS_SLA_HOURS` (JSON), `SMS_ESCALATION_HOURS` (24), `SMS_REASSIGN_CHURN_COUNT` (3), `SMS_RELEASE_MONEY_DELAY_HOURS` (2), `SMS_QUIET_HOURS` (`21-7` Africa/Accra).

Quiet hours apply to SLA/ETA nudges only — **not** assignment, reassignment, or customer milestones.

Seed missing keys: Admin → SMS Settings → **Seed missing defaults**, or `POST /api/configurations/init`.

## Scheduler

`backend/jobs/smsScheduler.js` runs every **20 minutes** via `node-cron` (started from `server.js`).

Scans: ETA approaching/overdue, stuck assignee/status, escalation, demurrage, release schedule slipped, release money, overdue payment reminders.

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

7. Set `SMS_DEV_MODE=false` and configure real `MNOTIFY_*` credentials for production.

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
- User/customer must have a phone number.
- Check MNotify balance and sender ID approval.
- Deduped cron events will not re-send until the dedupe key changes (often daily).

## Production (GitHub Actions)

Deploy writes `.env.production` from GitHub secrets and passes them into the backend container via `docker-compose.prod.yml`.

Required repository secrets (Settings → Secrets and variables → Actions):

- `MNOTIFY_API_KEY` — MNotify API key
- `MNOTIFY_SENDER_ID` — approved sender ID (max 11 chars), e.g. `CNTerminal`

Optional:

- `MNOTIFY_API_URL` — defaults in code to `https://api.mnotify.com/api/sms/quick` if empty

`SMS_DEV_MODE` is forced to `false` on production deploys. The in-app master toggle `SMS_NOTIFICATIONS` stays **off** until an admin enables it (do not rely on env alone for customer SMS).

After adding secrets, re-run the production deploy (push to `production` or workflow_dispatch) so containers pick up the new env.

