-- Make customer email optional (nullable). Unique constraint remains;
-- PostgreSQL allows multiple NULL values under a UNIQUE index.
ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL;
