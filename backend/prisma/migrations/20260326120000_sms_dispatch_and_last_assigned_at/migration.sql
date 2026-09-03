-- AlterTable
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "lastAssignedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sms_dispatch_logs" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT,
    "phone" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sms_dispatch_logs_dedupeKey_key" ON "sms_dispatch_logs"("dedupeKey");
CREATE INDEX IF NOT EXISTS "sms_dispatch_logs_eventKey_jobId_idx" ON "sms_dispatch_logs"("eventKey", "jobId");
CREATE INDEX IF NOT EXISTS "sms_dispatch_logs_createdAt_idx" ON "sms_dispatch_logs"("createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sms_dispatch_logs" ADD CONSTRAINT "sms_dispatch_logs_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
