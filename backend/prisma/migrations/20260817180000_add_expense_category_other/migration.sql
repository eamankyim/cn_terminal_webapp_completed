-- AlterEnum
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'OTHER';

-- AlterTable
ALTER TABLE "expense_requests" ADD COLUMN IF NOT EXISTS "categoryOther" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "categoryOther" TEXT;
