-- Rename the first-pass task email schema to the channel-agnostic task
-- communication schema. This keeps the migration reviewable and preserves
-- existing local/preview data.

-- Rename enums that remain conceptually the same.
ALTER TYPE "TaskEmailAudience" RENAME TO "TaskCommunicationAudience";
ALTER TYPE "TaskCommunicationAudience" ADD VALUE IF NOT EXISTS 'ASSIGNEE';

ALTER TYPE "TaskEmailRole" RENAME TO "TaskCommunicationPurpose";
ALTER TYPE "TaskCommunicationPurpose" ADD VALUE IF NOT EXISTS 'ASSIGNMENT';
ALTER TYPE "TaskCommunicationPurpose" ADD VALUE IF NOT EXISTS 'FOLLOW_UP';
ALTER TYPE "TaskCommunicationPurpose" ADD VALUE IF NOT EXISTS 'EVIDENCE_REQUEST';
ALTER TYPE "TaskCommunicationPurpose" ADD VALUE IF NOT EXISTS 'STATUS_UPDATE';
ALTER TYPE "TaskCommunicationPurpose" ADD VALUE IF NOT EXISTS 'REPLY';

ALTER TYPE "TaskEmailFormat" RENAME TO "TaskCommunicationFormat";

-- New enums for the channel-agnostic communication envelope and readable thread.
CREATE TYPE "TaskCommunicationDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "TaskCommunicationChannel" AS ENUM (
  'EMAIL',
  'IN_APP',
  'SMS',
  'PUSH',
  'EXTERNAL_URL',
  'MAILTO',
  'MANUAL'
);
CREATE TYPE "TaskCommunicationStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'RECEIVED',
  'FAILED',
  'CANCELLED'
);
CREATE TYPE "TaskCommunicationEndpointKind" AS ENUM (
  'EMAIL',
  'MAILTO',
  'EXTERNAL_URL',
  'FORM_URL',
  'PUBLIC_PROFILE',
  'IN_APP',
  'MANUAL'
);
CREATE TYPE "TaskCommunicationEndpointVerificationStatus" AS ENUM (
  'UNVERIFIED',
  'VERIFIED',
  'STALE',
  'FAILED'
);
CREATE TYPE "TaskCommentKind" AS ENUM (
  'COMMENT',
  'OUTBOUND_MESSAGE',
  'INBOUND_MESSAGE',
  'STATUS_UPDATE',
  'SYSTEM_NOTE'
);
CREATE TYPE "TaskCommentVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "TaskCommentSource" AS ENUM (
  'WEB',
  'AGENT',
  'EMAIL_REPLY',
  'MANUAL_IMPORT',
  'SYSTEM'
);

-- Drop first-pass foreign keys before table/column renames and FK semantic changes.
ALTER TABLE "TaskEmailTemplate" DROP CONSTRAINT IF EXISTS "TaskEmailTemplate_taskId_fkey";
ALTER TABLE "TaskEmailVariant" DROP CONSTRAINT IF EXISTS "TaskEmailVariant_templateId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_taskId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_templateId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_templateVariantId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_recipientPersonId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_recipientUserId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_shareAttemptId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_emailLogId_fkey";
ALTER TABLE "TaskEmailAttempt" DROP CONSTRAINT IF EXISTS "TaskEmailAttempt_referralInvitationId_fkey";
ALTER TABLE "ShareAttempt" DROP CONSTRAINT IF EXISTS "ShareAttempt_taskEmailVariantId_fkey";
ALTER TABLE "TaskComment" DROP CONSTRAINT IF EXISTS "TaskComment_authorUserId_fkey";
ALTER TABLE "EmailLog" DROP CONSTRAINT IF EXISTS "EmailLog_userId_fkey";

-- Rename first-pass tables/columns.
ALTER TABLE "TaskEmailTemplate" RENAME TO "TaskCommunicationTemplate";
ALTER TABLE "TaskEmailVariant" RENAME TO "TaskCommunicationVariant";
ALTER TABLE "TaskEmailAttempt" RENAME TO "TaskCommunication";
ALTER TABLE "TaskCommunicationTemplate" RENAME COLUMN "role" TO "purpose";
ALTER TABLE "TaskCommunication" RENAME COLUMN "role" TO "purpose";
ALTER TABLE "TaskCommunication" RENAME COLUMN "lastSentAt" TO "sentAt";
ALTER TABLE "TaskCommunication" RENAME COLUMN "context" TO "metadataJson";
ALTER TABLE "ShareAttempt" RENAME COLUMN "taskEmailVariantId" TO "taskCommunicationVariantId";

-- Drop stale first-pass indexes before recreating with final names.
DROP INDEX IF EXISTS "TaskEmailTemplate_taskId_audience_role_key";
DROP INDEX IF EXISTS "TaskEmailTemplate_taskId_idx";
DROP INDEX IF EXISTS "TaskEmailTemplate_audience_role_idx";
DROP INDEX IF EXISTS "TaskEmailTemplate_isActive_idx";
DROP INDEX IF EXISTS "TaskEmailTemplate_deletedAt_idx";
DROP INDEX IF EXISTS "TaskEmailVariant_templateId_step_format_key";
DROP INDEX IF EXISTS "TaskEmailVariant_templateId_idx";
DROP INDEX IF EXISTS "TaskEmailVariant_isActive_idx";
DROP INDEX IF EXISTS "TaskEmailVariant_deletedAt_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_unsubscribeToken_key";
DROP INDEX IF EXISTS "TaskEmailAttempt_taskId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_templateId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_templateVariantId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_recipientPersonId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_recipientUserId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_nextSendAt_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_status_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_referralInvitationId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_emailLogId_idx";
DROP INDEX IF EXISTS "TaskEmailAttempt_deletedAt_idx";
DROP INDEX IF EXISTS "ShareAttempt_taskEmailVariantId_idx";

-- Expand TaskComment so it can store the readable task thread.
ALTER TABLE "TaskComment"
  ADD COLUMN "authorPersonId" TEXT,
  ADD COLUMN "authorOrganizationId" TEXT,
  ADD COLUMN "authorNameSnapshot" TEXT,
  ADD COLUMN "kind" "TaskCommentKind" NOT NULL DEFAULT 'COMMENT',
  ADD COLUMN "visibility" "TaskCommentVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "source" "TaskCommentSource" NOT NULL DEFAULT 'WEB';
ALTER TABLE "TaskComment" ALTER COLUMN "authorUserId" DROP NOT NULL;

-- Endpoint table replaces Task.contactUrl/contactLabel/contactTemplate.
CREATE TABLE "TaskCommunicationEndpoint" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "kind" "TaskCommunicationEndpointKind" NOT NULL,
  "label" TEXT,
  "url" TEXT,
  "email" TEXT,
  "instructions" TEXT,
  "sourceUrl" TEXT,
  "verificationStatus" "TaskCommunicationEndpointVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "verifiedAt" TIMESTAMP(3),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskCommunicationEndpoint_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TaskCommunicationEndpoint" (
  "id",
  "taskId",
  "kind",
  "label",
  "url",
  "email",
  "instructions",
  "isPrimary",
  "priority",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('tce_', md5("id")),
  "id",
  CASE
    WHEN "contactUrl" ILIKE 'mailto:%' THEN 'MAILTO'::"TaskCommunicationEndpointKind"
    ELSE 'EXTERNAL_URL'::"TaskCommunicationEndpointKind"
  END,
  "contactLabel",
  "contactUrl",
  CASE
    WHEN "contactUrl" ILIKE 'mailto:%' THEN regexp_replace("contactUrl", '^mailto:', '', 'i')
    ELSE NULL
  END,
  "contactTemplate",
  true,
  0,
  "createdAt",
  "updatedAt"
FROM "Task"
WHERE "contactUrl" IS NOT NULL
   OR "contactLabel" IS NOT NULL
   OR "contactTemplate" IS NOT NULL;

ALTER TABLE "Task"
  DROP COLUMN IF EXISTS "contactUrl",
  DROP COLUMN IF EXISTS "contactLabel",
  DROP COLUMN IF EXISTS "contactTemplate";

-- Expand TaskCommunication and collapse status to the small lifecycle.
ALTER TABLE "TaskCommunication"
  ADD COLUMN "taskCommentId" TEXT,
  ADD COLUMN "endpointId" TEXT,
  ADD COLUMN "recipientOrganizationId" TEXT,
  ADD COLUMN "recipientNameSnapshot" TEXT,
  ADD COLUMN "senderUserId" TEXT,
  ADD COLUMN "senderPersonId" TEXT,
  ADD COLUMN "senderNameSnapshot" TEXT,
  ADD COLUMN "direction" "TaskCommunicationDirection" NOT NULL DEFAULT 'OUTBOUND',
  ADD COLUMN "channel" "TaskCommunicationChannel" NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "externalUrl" TEXT;

ALTER TABLE "TaskCommunication" ALTER COLUMN "templateId" DROP NOT NULL;
ALTER TABLE "TaskCommunication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TaskCommunication" ALTER COLUMN "status" TYPE "TaskCommunicationStatus"
USING (
  CASE
    WHEN "status"::text IN ('PENDING', 'QUEUED') THEN 'DRAFT'
    WHEN "status"::text IN ('SENT', 'DELIVERED') THEN 'SENT'
    WHEN "status"::text = 'FAILED' THEN 'FAILED'
    ELSE 'CANCELLED'
  END
)::"TaskCommunicationStatus";
ALTER TABLE "TaskCommunication" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
UPDATE "TaskCommunication" SET "failedAt" = "updatedAt" WHERE "status" = 'FAILED' AND "failedAt" IS NULL;
UPDATE "TaskCommunication" SET "cancelledAt" = "updatedAt" WHERE "status" = 'CANCELLED' AND "cancelledAt" IS NULL;
DROP TYPE "TaskEmailAttemptStatus";

-- Relax EmailLog.userId so external assignee emails do not require a User.
ALTER TABLE "EmailLog"
  ADD COLUMN "dedupeKey" TEXT,
  ALTER COLUMN "userId" DROP NOT NULL;

-- Final indexes.
CREATE UNIQUE INDEX "TaskCommunicationTemplate_taskId_audience_purpose_key"
  ON "TaskCommunicationTemplate"("taskId", "audience", "purpose");
CREATE INDEX "TaskCommunicationTemplate_taskId_idx" ON "TaskCommunicationTemplate"("taskId");
CREATE INDEX "TaskCommunicationTemplate_audience_purpose_idx" ON "TaskCommunicationTemplate"("audience", "purpose");
CREATE INDEX "TaskCommunicationTemplate_isActive_idx" ON "TaskCommunicationTemplate"("isActive");
CREATE INDEX "TaskCommunicationTemplate_deletedAt_idx" ON "TaskCommunicationTemplate"("deletedAt");

CREATE UNIQUE INDEX "TaskCommunicationVariant_templateId_step_format_key"
  ON "TaskCommunicationVariant"("templateId", "step", "format");
CREATE INDEX "TaskCommunicationVariant_templateId_idx" ON "TaskCommunicationVariant"("templateId");
CREATE INDEX "TaskCommunicationVariant_isActive_idx" ON "TaskCommunicationVariant"("isActive");
CREATE INDEX "TaskCommunicationVariant_deletedAt_idx" ON "TaskCommunicationVariant"("deletedAt");

CREATE UNIQUE INDEX "TaskCommunication_unsubscribeToken_key"
  ON "TaskCommunication"("unsubscribeToken");
CREATE INDEX "TaskCommunication_taskId_idx" ON "TaskCommunication"("taskId");
CREATE INDEX "TaskCommunication_taskCommentId_idx" ON "TaskCommunication"("taskCommentId");
CREATE INDEX "TaskCommunication_templateId_idx" ON "TaskCommunication"("templateId");
CREATE INDEX "TaskCommunication_templateVariantId_idx" ON "TaskCommunication"("templateVariantId");
CREATE INDEX "TaskCommunication_endpointId_idx" ON "TaskCommunication"("endpointId");
CREATE INDEX "TaskCommunication_recipientPersonId_idx" ON "TaskCommunication"("recipientPersonId");
CREATE INDEX "TaskCommunication_recipientUserId_idx" ON "TaskCommunication"("recipientUserId");
CREATE INDEX "TaskCommunication_recipientOrganizationId_idx" ON "TaskCommunication"("recipientOrganizationId");
CREATE INDEX "TaskCommunication_senderUserId_idx" ON "TaskCommunication"("senderUserId");
CREATE INDEX "TaskCommunication_senderPersonId_idx" ON "TaskCommunication"("senderPersonId");
CREATE INDEX "TaskCommunication_nextSendAt_idx" ON "TaskCommunication"("nextSendAt");
CREATE INDEX "TaskCommunication_status_idx" ON "TaskCommunication"("status");
CREATE INDEX "TaskCommunication_channel_idx" ON "TaskCommunication"("channel");
CREATE INDEX "TaskCommunication_purpose_idx" ON "TaskCommunication"("purpose");
CREATE INDEX "TaskCommunication_referralInvitationId_idx" ON "TaskCommunication"("referralInvitationId");
CREATE INDEX "TaskCommunication_emailLogId_idx" ON "TaskCommunication"("emailLogId");
CREATE INDEX "TaskCommunication_deletedAt_idx" ON "TaskCommunication"("deletedAt");

CREATE INDEX "TaskCommunicationEndpoint_taskId_idx" ON "TaskCommunicationEndpoint"("taskId");
CREATE INDEX "TaskCommunicationEndpoint_taskId_isPrimary_idx" ON "TaskCommunicationEndpoint"("taskId", "isPrimary");
CREATE INDEX "TaskCommunicationEndpoint_kind_idx" ON "TaskCommunicationEndpoint"("kind");
CREATE INDEX "TaskCommunicationEndpoint_verificationStatus_idx" ON "TaskCommunicationEndpoint"("verificationStatus");
CREATE INDEX "TaskCommunicationEndpoint_deletedAt_idx" ON "TaskCommunicationEndpoint"("deletedAt");

CREATE INDEX "TaskComment_authorPersonId_createdAt_idx" ON "TaskComment"("authorPersonId", "createdAt");
CREATE INDEX "TaskComment_authorOrganizationId_createdAt_idx" ON "TaskComment"("authorOrganizationId", "createdAt");
CREATE INDEX "TaskComment_kind_idx" ON "TaskComment"("kind");
CREATE INDEX "TaskComment_visibility_idx" ON "TaskComment"("visibility");
CREATE INDEX "TaskComment_source_idx" ON "TaskComment"("source");

CREATE UNIQUE INDEX "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");
CREATE INDEX "ShareAttempt_taskCommunicationVariantId_idx" ON "ShareAttempt"("taskCommunicationVariantId");

-- Final foreign keys.
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_authorPersonId_fkey"
  FOREIGN KEY ("authorPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskComment"
  ADD CONSTRAINT "TaskComment_authorOrganizationId_fkey"
  FOREIGN KEY ("authorOrganizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskCommunicationEndpoint"
  ADD CONSTRAINT "TaskCommunicationEndpoint_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskCommunicationTemplate"
  ADD CONSTRAINT "TaskCommunicationTemplate_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskCommunicationVariant"
  ADD CONSTRAINT "TaskCommunicationVariant_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "TaskCommunicationTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_taskCommentId_fkey"
  FOREIGN KEY ("taskCommentId") REFERENCES "TaskComment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "TaskCommunicationTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_templateVariantId_fkey"
  FOREIGN KEY ("templateVariantId") REFERENCES "TaskCommunicationVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_endpointId_fkey"
  FOREIGN KEY ("endpointId") REFERENCES "TaskCommunicationEndpoint"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_recipientPersonId_fkey"
  FOREIGN KEY ("recipientPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_recipientOrganizationId_fkey"
  FOREIGN KEY ("recipientOrganizationId") REFERENCES "Organization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_senderUserId_fkey"
  FOREIGN KEY ("senderUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_senderPersonId_fkey"
  FOREIGN KEY ("senderPersonId") REFERENCES "Person"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_shareAttemptId_fkey"
  FOREIGN KEY ("shareAttemptId") REFERENCES "ShareAttempt"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_emailLogId_fkey"
  FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskCommunication"
  ADD CONSTRAINT "TaskCommunication_referralInvitationId_fkey"
  FOREIGN KEY ("referralInvitationId") REFERENCES "ReferralInvitation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareAttempt"
  ADD CONSTRAINT "ShareAttempt_taskCommunicationVariantId_fkey"
  FOREIGN KEY ("taskCommunicationVariantId") REFERENCES "TaskCommunicationVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailLog"
  ADD CONSTRAINT "EmailLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
