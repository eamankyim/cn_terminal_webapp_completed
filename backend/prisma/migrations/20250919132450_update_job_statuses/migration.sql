/*
  Warnings:

  - The values [SUBMITTED,UNDER_REVIEW,QUOTED,AWAITING_PAYMENT,PAID,CLEARING,OUT_FOR_DELIVERY,CLOSED,ON_HOLD,REJECTED,READY_FOR_SHIPMENT,IN_TRANSIT,ARRIVED_AT_PORT] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `estimatedValue` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('NEW', 'PREINVOICED', 'INVOICED', 'ENTRY', 'RELEASE', 'CLEARED', 'DELIVERED');
ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TABLE "job_status_history" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "consignments" ALTER COLUMN "ghanaCard" DROP NOT NULL,
ALTER COLUMN "tin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "estimatedValue",
ADD COLUMN     "blNumber" TEXT,
ADD COLUMN     "containerNumber" TEXT,
ADD COLUMN     "documentsBrought" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "line" TEXT,
ADD COLUMN     "mediumOfEnquiry" TEXT,
ADD COLUMN     "vesselName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'NEW';
