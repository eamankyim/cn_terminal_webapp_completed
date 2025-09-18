/*
  Warnings:

  - You are about to drop the column `goodsType` on the `consignments` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `consignments` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `enquiries` table. All the data in the column will be lost.
  - You are about to drop the column `goodsDescription` on the `enquiries` table. All the data in the column will be lost.
  - You are about to drop the column `goodsType` on the `enquiries` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `goodsType` on the `jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "consignments" DROP COLUMN "goodsType",
DROP COLUMN "value";

-- AlterTable
ALTER TABLE "enquiries" DROP COLUMN "estimatedValue",
DROP COLUMN "goodsDescription",
DROP COLUMN "goodsType";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "estimatedValue",
DROP COLUMN "goodsType";

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
