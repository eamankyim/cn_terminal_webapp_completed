-- CreateTable
CREATE TABLE IF NOT EXISTS "job_comments" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "job_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "job_comments" ADD CONSTRAINT "job_comments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_comments" ADD CONSTRAINT "job_comments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

