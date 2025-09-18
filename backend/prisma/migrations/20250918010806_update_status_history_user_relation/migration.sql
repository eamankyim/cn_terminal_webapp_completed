/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `job_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `jobs` table. All the data in the column will be lost.
  - Added the required column `updatedById` to the `job_status_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedToId` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns as nullable first
ALTER TABLE "job_status_history" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "jobs" ADD COLUMN "assignedToId" TEXT;

-- Step 2: Get a default user ID (assuming there's at least one user)
-- We'll use the first admin user or create a fallback
DO $$
DECLARE
    default_user_id TEXT;
    user_count INTEGER;
BEGIN
    -- Check if there are any users
    SELECT COUNT(*) INTO user_count FROM "users";
    
    -- If no users, skip the update (for shadow database)
    IF user_count = 0 THEN
        RETURN;
    END IF;
    
    -- Try to get the first admin user
    SELECT id INTO default_user_id FROM "users" WHERE role = 'ADMIN' LIMIT 1;
    
    -- If no admin user, get the first user
    IF default_user_id IS NULL THEN
        SELECT id INTO default_user_id FROM "users" LIMIT 1;
    END IF;
    
    -- Update existing records with the default user ID
    UPDATE "job_status_history" SET "updatedById" = default_user_id WHERE "updatedById" IS NULL;
    UPDATE "jobs" SET "assignedToId" = default_user_id WHERE "assignedToId" IS NULL;
END $$;

-- Step 3: Make the columns NOT NULL
ALTER TABLE "job_status_history" ALTER COLUMN "updatedById" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "assignedToId" SET NOT NULL;

-- Step 4: Drop the old columns
ALTER TABLE "job_status_history" DROP COLUMN "updatedBy";
ALTER TABLE "jobs" DROP COLUMN "assignedTo";

-- Step 5: Add foreign key constraints
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
