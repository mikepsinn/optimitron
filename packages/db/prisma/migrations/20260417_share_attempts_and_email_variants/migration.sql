-- AddEnum
CREATE TYPE "ShareSource" AS ENUM ('EMAIL', 'IN_APP');

-- AlterTable: EmailLog — add subject/body variant fields and sendContext
ALTER TABLE "EmailLog"
  ADD COLUMN "subjectVariantId" TEXT,
  ADD COLUMN "subjectTemplate"  TEXT,
  ADD COLUMN "bodyTemplateId"   TEXT,
  ADD COLUMN "sendContext"      JSONB;

CREATE INDEX "EmailLog_subjectVariantId_idx" ON "EmailLog"("subjectVariantId");
CREATE INDEX "EmailLog_bodyTemplateId_idx"   ON "EmailLog"("bodyTemplateId");

-- AlterTable: Referral — add loose pointer to the originating ShareAttempt
ALTER TABLE "Referral"
  ADD COLUMN "originatingShareAttemptId" TEXT;

CREATE INDEX "Referral_originatingShareAttemptId_idx" ON "Referral"("originatingShareAttemptId");

-- AlterTable: ReferralClick — add loose pointer to the ShareAttempt that generated the URL
ALTER TABLE "ReferralClick"
  ADD COLUMN "shareAttemptId" TEXT;

CREATE INDEX "ReferralClick_shareAttemptId_idx" ON "ReferralClick"("shareAttemptId");

-- CreateTable: ShareAttempt
CREATE TABLE "ShareAttempt" (
  "id"                    TEXT        NOT NULL,
  "userId"                TEXT        NOT NULL,
  "source"                "ShareSource" NOT NULL,
  "surface"               TEXT,
  "channel"               TEXT,
  "taskId"                TEXT,
  "emailLogId"            TEXT,
  "templateId"            TEXT,
  "templateHash"          TEXT,
  "templateBody"          TEXT,
  "renderedMessage"       TEXT,
  "renderedHash"          TEXT,
  "wasEdited"             BOOLEAN     NOT NULL DEFAULT false,
  "context"               JSONB,
  "firstReferralClickAt"  TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ShareAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShareAttempt_userId_createdAt_idx"       ON "ShareAttempt"("userId", "createdAt");
CREATE INDEX "ShareAttempt_templateHash_idx"           ON "ShareAttempt"("templateHash");
CREATE INDEX "ShareAttempt_emailLogId_idx"             ON "ShareAttempt"("emailLogId");
CREATE INDEX "ShareAttempt_firstReferralClickAt_idx"   ON "ShareAttempt"("firstReferralClickAt");
CREATE INDEX "ShareAttempt_source_idx"                 ON "ShareAttempt"("source");
CREATE INDEX "ShareAttempt_channel_idx"                ON "ShareAttempt"("channel");

-- AddForeignKey
ALTER TABLE "ShareAttempt"
  ADD CONSTRAINT "ShareAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShareAttempt"
  ADD CONSTRAINT "ShareAttempt_emailLogId_fkey"
  FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareAttempt"
  ADD CONSTRAINT "ShareAttempt_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
