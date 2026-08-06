/*
  Warnings:

  - The values [WAREHOUSE] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'ENTRY_COMPLETED';
ALTER TYPE "JobStatus" ADD VALUE 'READY_FOR_RELEASE';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'STAFF', 'DRIVER', 'IT_CONSULTANT', 'ENQUIRY_OFFICER', 'ENTRY_OFFICER', 'TRANSPORT_COORDINATOR', 'RELEASE_OFFICER', 'PREINVOICE_OFFICER', 'REVIEW_OFFICER', 'VETTING_OFFICER', 'CLEARING_OFFICER', 'ACCOUNTANT');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF';
COMMIT;

-- DropForeignKey
ALTER TABLE "cashflow_transactions" DROP CONSTRAINT "cashflow_expense_fkey";

-- DropForeignKey
ALTER TABLE "cashflow_transactions" DROP CONSTRAINT "cashflow_payout_fkey";

-- AlterTable
ALTER TABLE "expense_requests" ADD COLUMN     "approvalComment" TEXT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "boeNumber" TEXT,
ADD COLUMN     "demurrageType" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "estimateId" TEXT;

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "estimateNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "convertedToInvoice" BOOLEAN NOT NULL DEFAULT false,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "charges" JSONB,
    "comments" TEXT,
    "terms" TEXT,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estimates_estimateNumber_key" ON "estimates"("estimateNumber");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
