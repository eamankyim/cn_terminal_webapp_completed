/*
  Warnings:

  - You are about to drop the column `estimatedValue` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `goodsType` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the `password_reset_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_userId_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "ghanaCard" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "tin" TEXT;

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "estimatedValue",
DROP COLUMN "goodsType";

-- DropTable
DROP TABLE "password_reset_tokens";
