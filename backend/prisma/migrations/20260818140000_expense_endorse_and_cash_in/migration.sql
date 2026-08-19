-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'ENDORSED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "accountName" TEXT;
ALTER TABLE "expense_requests" ADD COLUMN IF NOT EXISTS "endorsedById" TEXT;
ALTER TABLE "expense_requests" ADD COLUMN IF NOT EXISTS "endorsedAt" TIMESTAMP(3);
ALTER TABLE "expense_requests" ADD COLUMN IF NOT EXISTS "endorsementComment" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expense_requests_endorsedById_fkey'
  ) THEN
    ALTER TABLE "expense_requests"
      ADD CONSTRAINT "expense_requests_endorsedById_fkey"
      FOREIGN KEY ("endorsedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
