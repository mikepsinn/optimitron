-- CreateTable
CREATE TABLE "TaskCommentAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "commentId" TEXT,
    "uploadedByUserId" TEXT,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskCommentAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskCommentAttachment_sizeBytes_check" CHECK ("sizeBytes" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCommentAttachment_storageKey_key" ON "TaskCommentAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "TaskCommentAttachment_taskId_createdAt_idx" ON "TaskCommentAttachment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskCommentAttachment_commentId_idx" ON "TaskCommentAttachment"("commentId");

-- CreateIndex
CREATE INDEX "TaskCommentAttachment_uploadedByUserId_expiresAt_idx" ON "TaskCommentAttachment"("uploadedByUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "TaskCommentAttachment_deletedAt_idx" ON "TaskCommentAttachment"("deletedAt");

-- AddForeignKey
ALTER TABLE "TaskCommentAttachment" ADD CONSTRAINT "TaskCommentAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCommentAttachment" ADD CONSTRAINT "TaskCommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TaskComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCommentAttachment" ADD CONSTRAINT "TaskCommentAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
