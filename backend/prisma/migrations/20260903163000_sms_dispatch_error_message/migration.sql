-- Optional error text for admin SMS stats (db-push / IF NOT EXISTS friendly).
-- Does not change dedupeKey uniqueness used by the SMS scheduler.
ALTER TABLE "sms_dispatch_logs" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

CREATE INDEX IF NOT EXISTS "sms_dispatch_logs_status_idx" ON "sms_dispatch_logs"("status");
