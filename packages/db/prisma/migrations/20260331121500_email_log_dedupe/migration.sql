ALTER TYPE "EmailLogStatus" ADD VALUE IF NOT EXISTS 'QUEUED';

CREATE UNIQUE INDEX "EmailLog_userId_templateId_key" ON "EmailLog"("userId", "templateId");
