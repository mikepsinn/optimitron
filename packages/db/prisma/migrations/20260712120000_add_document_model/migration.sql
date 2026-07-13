-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT,
    "documentKey" TEXT NOT NULL,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_taskId_isCurrent_idx" ON "Document"("taskId", "isCurrent");

-- CreateIndex
CREATE INDEX "Document_createdByUserId_isCurrent_idx" ON "Document"("createdByUserId", "isCurrent");

-- CreateIndex
CREATE INDEX "Document_jurisdictionId_idx" ON "Document"("jurisdictionId");

-- CreateIndex
CREATE INDEX "Document_visibility_isCurrent_idx" ON "Document"("visibility", "isCurrent");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentKey_version_key" ON "Document"("documentKey", "version");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
