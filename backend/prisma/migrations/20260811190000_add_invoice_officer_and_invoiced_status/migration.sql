-- AlterEnum: add INVOICED job status (between PREINVOICED and VETTED in app hierarchy)
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'INVOICED';

-- AlterEnum: add INVOICE_OFFICER user role
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'INVOICE_OFFICER';
