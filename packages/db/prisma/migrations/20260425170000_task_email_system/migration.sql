-- AddEnum
CREATE TYPE "TaskEmailAudience" AS ENUM (
  'RECIPIENT',
  'SENDER',
  'OBSERVER'
);

CREATE TYPE "TaskEmailRole" AS ENUM (
  'INVITATION',
  'REMINDER',
  'SCORECARD',
  'RE_ENGAGEMENT',
  'VOTE_CONFIRMED',
  'RECIPIENT_VOTED',
  'SHARE'
);

CREATE TYPE "TaskEmailFormat" AS ENUM (
  'DEFAULT',
  'TASK_NOTIFICATION',
  'SINCERE'
);

CREATE TYPE "TaskEmailAttemptStatus" AS ENUM (
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'SUPPRESSED',
  'UNSUBSCRIBED'
);

-- AlterTable
ALTER TABLE "ShareAttempt"
  ADD COLUMN "taskEmailVariantId" TEXT;

-- CreateTable
CREATE TABLE "TaskEmailTemplate" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "audience" "TaskEmailAudience" NOT NULL,
  "role" "TaskEmailRole" NOT NULL,
  "label" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskEmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskEmailVariant" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "step" INTEGER NOT NULL DEFAULT 0,
  "format" "TaskEmailFormat" NOT NULL DEFAULT 'DEFAULT',
  "subject" TEXT,
  "htmlBody" TEXT,
  "textBody" TEXT,
  "delayDays" INTEGER,
  "senderIdentity" TEXT,
  "signature" TEXT,
  "footer" TEXT,
  "unsubscribeScope" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskEmailVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskEmailAttempt" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "templateVariantId" TEXT,
  "recipientPersonId" TEXT,
  "recipientUserId" TEXT,
  "recipientEmail" TEXT,
  "audience" "TaskEmailAudience" NOT NULL,
  "role" "TaskEmailRole" NOT NULL,
  "format" "TaskEmailFormat" NOT NULL DEFAULT 'DEFAULT',
  "step" INTEGER NOT NULL DEFAULT 0,
  "nextSendAt" TIMESTAMP(3),
  "lastSentAt" TIMESTAMP(3),
  "unsubscribeToken" TEXT,
  "shareAttemptId" TEXT,
  "emailLogId" TEXT,
  "referralInvitationId" TEXT,
  "status" "TaskEmailAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "providerMessageId" TEXT,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskEmailAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskEmailTemplate_taskId_audience_role_key"
  ON "TaskEmailTemplate"("taskId", "audience", "role");
CREATE INDEX "TaskEmailTemplate_taskId_idx" ON "TaskEmailTemplate"("taskId");
CREATE INDEX "TaskEmailTemplate_audience_role_idx" ON "TaskEmailTemplate"("audience", "role");
CREATE INDEX "TaskEmailTemplate_isActive_idx" ON "TaskEmailTemplate"("isActive");
CREATE INDEX "TaskEmailTemplate_deletedAt_idx" ON "TaskEmailTemplate"("deletedAt");

CREATE UNIQUE INDEX "TaskEmailVariant_templateId_step_format_key"
  ON "TaskEmailVariant"("templateId", "step", "format");
CREATE INDEX "TaskEmailVariant_templateId_idx" ON "TaskEmailVariant"("templateId");
CREATE INDEX "TaskEmailVariant_isActive_idx" ON "TaskEmailVariant"("isActive");
CREATE INDEX "TaskEmailVariant_deletedAt_idx" ON "TaskEmailVariant"("deletedAt");

CREATE UNIQUE INDEX "TaskEmailAttempt_unsubscribeToken_key"
  ON "TaskEmailAttempt"("unsubscribeToken");
CREATE INDEX "TaskEmailAttempt_taskId_idx" ON "TaskEmailAttempt"("taskId");
CREATE INDEX "TaskEmailAttempt_templateId_idx" ON "TaskEmailAttempt"("templateId");
CREATE INDEX "TaskEmailAttempt_templateVariantId_idx" ON "TaskEmailAttempt"("templateVariantId");
CREATE INDEX "TaskEmailAttempt_recipientPersonId_idx" ON "TaskEmailAttempt"("recipientPersonId");
CREATE INDEX "TaskEmailAttempt_recipientUserId_idx" ON "TaskEmailAttempt"("recipientUserId");
CREATE INDEX "TaskEmailAttempt_nextSendAt_idx" ON "TaskEmailAttempt"("nextSendAt");
CREATE INDEX "TaskEmailAttempt_status_idx" ON "TaskEmailAttempt"("status");
CREATE INDEX "TaskEmailAttempt_referralInvitationId_idx" ON "TaskEmailAttempt"("referralInvitationId");
CREATE INDEX "TaskEmailAttempt_emailLogId_idx" ON "TaskEmailAttempt"("emailLogId");
CREATE INDEX "TaskEmailAttempt_deletedAt_idx" ON "TaskEmailAttempt"("deletedAt");

CREATE INDEX "ShareAttempt_taskEmailVariantId_idx" ON "ShareAttempt"("taskEmailVariantId");

-- AddForeignKey
ALTER TABLE "TaskEmailTemplate"
  ADD CONSTRAINT "TaskEmailTemplate_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskEmailVariant"
  ADD CONSTRAINT "TaskEmailVariant_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "TaskEmailTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "TaskEmailTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_templateVariantId_fkey"
  FOREIGN KEY ("templateVariantId") REFERENCES "TaskEmailVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_recipientPersonId_fkey"
  FOREIGN KEY ("recipientPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_shareAttemptId_fkey"
  FOREIGN KEY ("shareAttemptId") REFERENCES "ShareAttempt"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_emailLogId_fkey"
  FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskEmailAttempt"
  ADD CONSTRAINT "TaskEmailAttempt_referralInvitationId_fkey"
  FOREIGN KEY ("referralInvitationId") REFERENCES "ReferralInvitation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareAttempt"
  ADD CONSTRAINT "ShareAttempt_taskEmailVariantId_fkey"
  FOREIGN KEY ("taskEmailVariantId") REFERENCES "TaskEmailVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
