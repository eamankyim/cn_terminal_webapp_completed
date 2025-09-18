-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "goodsTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
