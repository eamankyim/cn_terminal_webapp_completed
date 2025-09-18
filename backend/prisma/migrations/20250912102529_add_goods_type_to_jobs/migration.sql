/*
  Warnings:

  - Added the required column `goodsType` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "goodsType" TEXT NOT NULL;
