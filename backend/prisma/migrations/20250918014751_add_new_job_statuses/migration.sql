-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'READY_FOR_SHIPMENT';
ALTER TYPE "JobStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "JobStatus" ADD VALUE 'ARRIVED_AT_PORT';
