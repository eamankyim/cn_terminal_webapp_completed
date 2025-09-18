/*
  Warnings:

  - The values [REGULAR,PREMIUM,VIP] on the enum `CustomerType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `businessType` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `customers` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CustomerType_new" AS ENUM ('COMPANY', 'INDIVIDUAL');
ALTER TABLE "customers" ALTER COLUMN "customerType" DROP DEFAULT;
ALTER TABLE "customers" ALTER COLUMN "customerType" TYPE "CustomerType_new" USING ("customerType"::text::"CustomerType_new");
ALTER TYPE "CustomerType" RENAME TO "CustomerType_old";
ALTER TYPE "CustomerType_new" RENAME TO "CustomerType";
DROP TYPE "CustomerType_old";
ALTER TABLE "customers" ALTER COLUMN "customerType" SET DEFAULT 'COMPANY';
COMMIT;

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "businessType",
DROP COLUMN "registrationNumber",
ALTER COLUMN "customerType" SET DEFAULT 'COMPANY';
