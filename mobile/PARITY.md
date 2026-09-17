# Mobile/web functional parity

The web application's active routes in `frontend/src/App.js` are the reference.
This update substantially expands native coverage; it is **not a certification of
100% functional parity**. No production data was created or changed during validation.

## Implemented in this update

| Area | Native behavior added or corrected |
| --- | --- |
| Synchronization | Account-scoped query caches; socket cleanup on logout/account changes; independent job subscriptions; one shared assignment alarm; foreground refresh; 30-second foreground fallback refresh for changes without socket events. |
| Jobs | Complete create/edit form shared across routes; draft submission; preserve status when editing; document upload/open/delete; job deletion. |
| Clients/consignees | Client and consignment deletion, consignee documents, WhatsApp client link, complete client lists. |
| Invoices | Charge breakdown and configured VAT matching the active web form; edit amount/dates; status updates; deletion; account/reference payment fields; complete invoice and invoiceable-job lists. |
| Estimates | Deletion; complete client selection and estimate lists; preserve unsaved edits during background refresh. |
| Accounting | Paginated payouts with create/edit/complete/fail/delete; cashflow transactions and creation; recorded expenses and direct recording; mark approved expense requests paid for accountants; expense request pagination. |
| Reports | All ten report API datasets; custom date range; assignee filters; native sharing of report data. |
| Administration | Team editing/status/password reset/deletion for admins; role permission editing; invitations; configuration creation/editing/deletion/default initialization. |
| Navigation/permissions | Menu entries for new workflows; accountant opens accounting; additional UI/resource permission aliases for documents, exports, cashflow, and administration. |
| Notifications | Pagination, deletion, retry/error feedback. |
| Clients (follow-up) | Client Type and City fields on create/edit; TIN/Ghana Card shown on consignment detail; "Add consignee" gated on CUSTOMER_EDIT to match web; expense request category filter. |
| Jobs (follow-up) | Assignee filter (incl. Unassigned) on the jobs list; pre-submit Ghana Card/TIN check on job create (matches the backend's submit-time rule); status update now requires a comment on every transition (was revert-only), collects Demurrage Status (`demurrageType`) for RELEASED, and uploads status/demurrage-invoice/payment-receipt documents in the same flow; job detail shows Schedule Time, Demurrage/Free Days, Release Money Received, and Demurrage Status once RELEASED, plus a status-history Timeline; job documents are grouped into Payment Receipts / Demurrage Invoices / Other, matching web. |

The backend still enforces authorization. In particular, existing user-edit and
invitation endpoints are ADMIN-only; role-permission endpoints allow ADMIN and
IT_CONSULTANT. Expense payment completion is ACCOUNTANT-only.

No backend changes are required for this update; the mobile app works entirely
against the existing backend and web-app API surface. `GET /invoices/jobs` has no
pagination metadata, so the invoiceable-job list is capped at the same `limit=100`
the endpoint has always supported, matching the web app's own (unpaginated) call
to that endpoint.

## Deployment dependency: Job `datePosted`

One exception to the "no backend changes" rule above: a `datePosted` column was
added to `Job` (`backend/prisma/schema.prisma`, migration
`20260917161400_add_job_date_posted`), plus `POST/PUT /jobs` support and
`getJobSelect` exposure (`backend/utils/jobSelect.js`,
`backend/routes/jobs.js`). It now has UI on both clients — mobile's job
create/edit form and detail screen, and web's job form
(`frontend/src/pages/JobsPage.jsx`, beside "Documents Brought") and detail
drawer. Deploy the migration (`npx prisma migrate deploy` or equivalent) together with
this backend update — the regenerated Prisma client selects `datePosted` on
every job read, so job endpoints will error until the column exists.

## Validation

- `npm run typecheck`: passed.
- `npm run test:parity`: tests pagination, permission gates/aliases, invoice totals,
  and socket callback/lifecycle behavior.
- Expo offline iOS and Android exports: passed.
- `npm run test:api`: blocked; the configured backend is unreachable, including
  after retrying outside the sandbox. No authenticated workflow could be verified.
- Device/simulator interaction testing and visual review have not been performed.

## Remaining gaps before claiming 100%

- Native PDF/Excel report export and invoice print/layout/share parity. Report data
  sharing currently sends text, not a PDF or workbook.
- Specialized web SMS settings/test/statistics controls, admin dashboard analytics,
  system/security preferences, and profile image upload.
- Invitation/password-reset universal-link routing and notification navigation to
  related records.
- Full web filter/chart parity (Reports has no charts on mobile yet), a proper
  Cash-In-against-invoice flow, a Drafts view for jobs, and every field/action
  combination across roles.
- Enquiries are read-only on mobile — no create/edit/delete/status-change UI yet
  (the largest single gap found in the latest review; web's own Enquiries page is
  itself partly non-functional, so this needs product confirmation before mobile
  is built to match it).
- Invoice/estimate detail and edit screens are thinner than web's (no job/consignee
  context, no per-payment method/reference, invoice edit can't touch the charge
  breakdown after creation, estimate create/edit is missing `terms`/`comments`/status).
- End-to-end create/edit/delete, uploads, payments, approvals and simultaneous
  web/mobile updates against a reachable test backend, on both iOS and Android.

Test these workflows with dedicated test records and all supported roles before
releasing. A successful bundle or type check alone does not establish functional parity.
