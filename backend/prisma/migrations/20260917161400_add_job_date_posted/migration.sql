-- User-entered "Date Posted" for a job, shown beside Documents Brought (db-push / IF NOT EXISTS friendly).
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "datePosted" TIMESTAMP(3);
