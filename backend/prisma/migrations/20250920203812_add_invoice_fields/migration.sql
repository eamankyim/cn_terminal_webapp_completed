-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "blAmendment" TEXT DEFAULT 'no',
ADD COLUMN     "charges" JSONB,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "paymentNotes" TEXT,
ADD COLUMN     "transactionReference" TEXT;
