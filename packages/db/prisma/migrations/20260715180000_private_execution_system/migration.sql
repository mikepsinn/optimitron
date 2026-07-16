-- Private execution kernel: one task graph, explicit tenant roles, scoped
-- provenance, immutable execution evidence, and human-approved side effects.

ALTER TYPE "McpScope" ADD VALUE IF NOT EXISTS 'tasks:organization';
ALTER TYPE "McpScope" ADD VALUE IF NOT EXISTS 'actions:approve';

ALTER TABLE "OAuthAuthCode"
  ADD COLUMN "organizationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "OAuthGrant"
  ADD COLUMN "organizationIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TYPE "OrganizationMemberRole" AS ENUM (
  'OWNER',
  'ADMIN',
  'MEMBER',
  'VIEWER'
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "OrganizationMember"
    WHERE lower("role") NOT IN ('owner', 'admin', 'member', 'viewer')
  ) THEN
    RAISE EXCEPTION 'OrganizationMember contains an unsupported role';
  END IF;
END $$;

ALTER TABLE "OrganizationMember"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "OrganizationMemberRole"
    USING upper("role")::"OrganizationMemberRole",
  ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- Preserve only semantics that are unambiguous without TaskKind.
UPDATE "Task"
SET "compensationKind" = 'BOUNTY'
WHERE "kind" = 'BOUNTY'
  AND "compensationKind" = 'UNSPECIFIED';

UPDATE "Task"
SET
  "compensationKind" = 'VOLUNTEER',
  "engagementKind" = CASE
    WHEN "engagementKind" = 'ONE_OFF' THEN 'ONGOING'::"TaskEngagementKind"
    ELSE "engagementKind"
  END
WHERE "kind" = 'VOLUNTEER_ROLE'
  AND "compensationKind" = 'UNSPECIFIED';

DROP INDEX IF EXISTS "Task_kind_status_idx";
ALTER TABLE "Task" DROP COLUMN "kind";
DROP TYPE "TaskKind";

CREATE TYPE "TaskVerificationMethod" AS ENUM (
  'DETERMINISTIC',
  'RULE_BASED',
  'REVIEWER',
  'OUTCOME'
);

CREATE TYPE "TaskVerificationResult" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'ERROR'
);

CREATE TYPE "ExternalActionRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'EXECUTED',
  'FAILED',
  'CANCELLED'
);

ALTER TABLE "SourceArtifact"
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "ownerOrganizationId" TEXT,
  ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true,
  ADD CONSTRAINT "SourceArtifact_private_owner_check" CHECK (
    "isPublic" OR
    num_nonnulls("ownerUserId", "ownerOrganizationId") = 1
  );

CREATE INDEX "SourceArtifact_ownerUserId_isPublic_idx"
  ON "SourceArtifact"("ownerUserId", "isPublic");
CREATE INDEX "SourceArtifact_ownerOrganizationId_isPublic_idx"
  ON "SourceArtifact"("ownerOrganizationId", "isPublic");
CREATE INDEX "SourceArtifact_isPublic_idx"
  ON "SourceArtifact"("isPublic");

ALTER TABLE "SourceArtifact" ADD CONSTRAINT "SourceArtifact_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SourceArtifact" ADD CONSTRAINT "SourceArtifact_ownerOrganizationId_fkey"
  FOREIGN KEY ("ownerOrganizationId") REFERENCES "Organization"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TaskExecutionArtifact" (
  "id" TEXT NOT NULL,
  "taskExecutionAttemptId" TEXT NOT NULL,
  "documentRevisionId" TEXT,
  "contentAttachmentId" TEXT,
  "taskCommentAttachmentId" TEXT,
  "externalUrl" TEXT,
  "structuredResultJson" JSONB,
  "label" TEXT,
  "contentHash" TEXT NOT NULL,
  "submittedByUserId" TEXT,
  "submittedByAgentExecutorId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskExecutionArtifact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskExecutionArtifact_payload_check" CHECK (
    num_nonnulls(
      "documentRevisionId",
      "contentAttachmentId",
      "taskCommentAttachmentId",
      "externalUrl",
      "structuredResultJson"
    ) = 1
  ),
  CONSTRAINT "TaskExecutionArtifact_submitter_check" CHECK (
    num_nonnulls("submittedByUserId", "submittedByAgentExecutorId") = 1
  )
);

CREATE INDEX "TaskExecutionArtifact_taskExecutionAttemptId_createdAt_idx"
  ON "TaskExecutionArtifact"("taskExecutionAttemptId", "createdAt");
CREATE INDEX "TaskExecutionArtifact_documentRevisionId_idx"
  ON "TaskExecutionArtifact"("documentRevisionId");
CREATE INDEX "TaskExecutionArtifact_contentAttachmentId_idx"
  ON "TaskExecutionArtifact"("contentAttachmentId");
CREATE INDEX "TaskExecutionArtifact_taskCommentAttachmentId_idx"
  ON "TaskExecutionArtifact"("taskCommentAttachmentId");
CREATE INDEX "TaskExecutionArtifact_submittedByUserId_idx"
  ON "TaskExecutionArtifact"("submittedByUserId");
CREATE INDEX "TaskExecutionArtifact_submittedByAgentExecutorId_idx"
  ON "TaskExecutionArtifact"("submittedByAgentExecutorId");
CREATE INDEX "TaskExecutionArtifact_contentHash_idx"
  ON "TaskExecutionArtifact"("contentHash");
CREATE INDEX "TaskExecutionArtifact_deletedAt_idx"
  ON "TaskExecutionArtifact"("deletedAt");

ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_taskExecutionAttemptId_fkey"
  FOREIGN KEY ("taskExecutionAttemptId") REFERENCES "TaskExecutionAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_documentRevisionId_fkey"
  FOREIGN KEY ("documentRevisionId") REFERENCES "DocumentRevision"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_contentAttachmentId_fkey"
  FOREIGN KEY ("contentAttachmentId") REFERENCES "ContentAttachment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_taskCommentAttachmentId_fkey"
  FOREIGN KEY ("taskCommentAttachmentId") REFERENCES "TaskCommentAttachment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskExecutionArtifact" ADD CONSTRAINT "TaskExecutionArtifact_submittedByAgentExecutorId_fkey"
  FOREIGN KEY ("submittedByAgentExecutorId") REFERENCES "AgentExecutor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TaskVerification" (
  "id" TEXT NOT NULL,
  "taskExecutionAttemptId" TEXT NOT NULL,
  "method" "TaskVerificationMethod" NOT NULL,
  "result" "TaskVerificationResult" NOT NULL DEFAULT 'PENDING',
  "acceptanceCriteriaSnapshotJson" JSONB NOT NULL,
  "criterionResultsJson" JSONB,
  "evidenceJson" JSONB,
  "note" TEXT,
  "ruleKey" TEXT,
  "ruleVersion" TEXT,
  "reviewerUserId" TEXT,
  "reviewerAgentExecutorId" TEXT,
  "selfReviewed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "TaskVerification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TaskVerification_reviewer_check" CHECK (
    num_nonnulls("reviewerUserId", "reviewerAgentExecutorId") <= 1
  ),
  CONSTRAINT "TaskVerification_terminal_check" CHECK (
    ("result" = 'PENDING' AND "completedAt" IS NULL) OR
    (
      "result" <> 'PENDING' AND
      "completedAt" IS NOT NULL AND
      num_nonnulls("reviewerUserId", "reviewerAgentExecutorId") = 1
    )
  )
);

CREATE INDEX "TaskVerification_taskExecutionAttemptId_createdAt_idx"
  ON "TaskVerification"("taskExecutionAttemptId", "createdAt");
CREATE INDEX "TaskVerification_taskExecutionAttemptId_result_idx"
  ON "TaskVerification"("taskExecutionAttemptId", "result");
CREATE INDEX "TaskVerification_reviewerUserId_result_idx"
  ON "TaskVerification"("reviewerUserId", "result");
CREATE INDEX "TaskVerification_reviewerAgentExecutorId_result_idx"
  ON "TaskVerification"("reviewerAgentExecutorId", "result");
CREATE INDEX "TaskVerification_method_result_idx"
  ON "TaskVerification"("method", "result");
CREATE INDEX "TaskVerification_deletedAt_idx"
  ON "TaskVerification"("deletedAt");

ALTER TABLE "TaskVerification" ADD CONSTRAINT "TaskVerification_taskExecutionAttemptId_fkey"
  FOREIGN KEY ("taskExecutionAttemptId") REFERENCES "TaskExecutionAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskVerification" ADD CONSTRAINT "TaskVerification_reviewerUserId_fkey"
  FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskVerification" ADD CONSTRAINT "TaskVerification_reviewerAgentExecutorId_fkey"
  FOREIGN KEY ("reviewerAgentExecutorId") REFERENCES "AgentExecutor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ExternalActionRequest" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "taskExecutionAttemptId" TEXT,
  "operation" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "requestedByAgentExecutorId" TEXT,
  "status" "ExternalActionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvedPayloadHash" TEXT,
  "executedByUserId" TEXT,
  "executedByAgentExecutorId" TEXT,
  "executedAt" TIMESTAMP(3),
  "executionReceiptJson" JSONB,
  "failureMessage" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ExternalActionRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExternalActionRequest_requester_check" CHECK (
    num_nonnulls("requestedByUserId", "requestedByAgentExecutorId") = 1
  ),
  CONSTRAINT "ExternalActionRequest_executor_check" CHECK (
    num_nonnulls("executedByUserId", "executedByAgentExecutorId") <= 1
  ),
  CONSTRAINT "ExternalActionRequest_approval_check" CHECK (
    "status" NOT IN ('APPROVED', 'EXECUTED', 'FAILED') OR
    (
      "approvedByUserId" IS NOT NULL AND
      "approvedAt" IS NOT NULL AND
      "approvedPayloadHash" = "payloadHash"
    )
  ),
  CONSTRAINT "ExternalActionRequest_execution_check" CHECK (
    "status" NOT IN ('EXECUTED', 'FAILED') OR
    (
      "executedAt" IS NOT NULL AND
      num_nonnulls("executedByUserId", "executedByAgentExecutorId") = 1
    )
  )
);

CREATE UNIQUE INDEX "ExternalActionRequest_idempotencyKey_key"
  ON "ExternalActionRequest"("idempotencyKey");
CREATE INDEX "ExternalActionRequest_taskId_status_createdAt_idx"
  ON "ExternalActionRequest"("taskId", "status", "createdAt");
CREATE INDEX "ExternalActionRequest_taskExecutionAttemptId_status_idx"
  ON "ExternalActionRequest"("taskExecutionAttemptId", "status");
CREATE INDEX "ExternalActionRequest_requestedByUserId_status_idx"
  ON "ExternalActionRequest"("requestedByUserId", "status");
CREATE INDEX "ExternalActionRequest_requestedByAgentExecutorId_status_idx"
  ON "ExternalActionRequest"("requestedByAgentExecutorId", "status");
CREATE INDEX "ExternalActionRequest_approvedByUserId_status_idx"
  ON "ExternalActionRequest"("approvedByUserId", "status");
CREATE INDEX "ExternalActionRequest_expiresAt_status_idx"
  ON "ExternalActionRequest"("expiresAt", "status");
CREATE INDEX "ExternalActionRequest_payloadHash_idx"
  ON "ExternalActionRequest"("payloadHash");
CREATE INDEX "ExternalActionRequest_deletedAt_idx"
  ON "ExternalActionRequest"("deletedAt");

ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_taskExecutionAttemptId_fkey"
  FOREIGN KEY ("taskExecutionAttemptId") REFERENCES "TaskExecutionAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_requestedByAgentExecutorId_fkey"
  FOREIGN KEY ("requestedByAgentExecutorId") REFERENCES "AgentExecutor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_executedByUserId_fkey"
  FOREIGN KEY ("executedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalActionRequest" ADD CONSTRAINT "ExternalActionRequest_executedByAgentExecutorId_fkey"
  FOREIGN KEY ("executedByAgentExecutorId") REFERENCES "AgentExecutor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "enforce_external_action_attempt_task"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."taskExecutionAttemptId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "TaskExecutionAttempt"
    WHERE "id" = NEW."taskExecutionAttemptId"
      AND "taskId" = NEW."taskId"
  ) THEN
    RAISE EXCEPTION 'External action attempt must belong to the selected task';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "ExternalActionRequest_attempt_task_check"
BEFORE INSERT OR UPDATE OF "taskId", "taskExecutionAttemptId"
ON "ExternalActionRequest"
FOR EACH ROW
EXECUTE FUNCTION "enforce_external_action_attempt_task"();

CREATE FUNCTION "prevent_external_action_payload_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."taskId" IS DISTINCT FROM OLD."taskId"
    OR NEW."taskExecutionAttemptId" IS DISTINCT FROM OLD."taskExecutionAttemptId"
    OR NEW."operation" IS DISTINCT FROM OLD."operation"
    OR NEW."destination" IS DISTINCT FROM OLD."destination"
    OR NEW."payloadJson" IS DISTINCT FROM OLD."payloadJson"
    OR NEW."payloadHash" IS DISTINCT FROM OLD."payloadHash"
    OR NEW."requestedByUserId" IS DISTINCT FROM OLD."requestedByUserId"
    OR NEW."requestedByAgentExecutorId" IS DISTINCT FROM OLD."requestedByAgentExecutorId"
    OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
    OR NEW."idempotencyKey" IS DISTINCT FROM OLD."idempotencyKey"
  THEN
    RAISE EXCEPTION 'Approved external action payloads are immutable; create a new request';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "ExternalActionRequest_immutable_payload"
BEFORE UPDATE ON "ExternalActionRequest"
FOR EACH ROW
EXECUTE FUNCTION "prevent_external_action_payload_mutation"();

CREATE FUNCTION "protect_task_verification_evidence"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."taskExecutionAttemptId" IS DISTINCT FROM OLD."taskExecutionAttemptId"
    OR NEW."method" IS DISTINCT FROM OLD."method"
    OR NEW."acceptanceCriteriaSnapshotJson" IS DISTINCT FROM OLD."acceptanceCriteriaSnapshotJson"
  THEN
    RAISE EXCEPTION 'Verification method and criteria snapshot are immutable';
  END IF;

  IF OLD."result" <> 'PENDING' AND (
    NEW."result" IS DISTINCT FROM OLD."result"
    OR NEW."criterionResultsJson" IS DISTINCT FROM OLD."criterionResultsJson"
    OR NEW."evidenceJson" IS DISTINCT FROM OLD."evidenceJson"
    OR NEW."note" IS DISTINCT FROM OLD."note"
    OR NEW."ruleKey" IS DISTINCT FROM OLD."ruleKey"
    OR NEW."ruleVersion" IS DISTINCT FROM OLD."ruleVersion"
    OR NEW."reviewerUserId" IS DISTINCT FROM OLD."reviewerUserId"
    OR NEW."reviewerAgentExecutorId" IS DISTINCT FROM OLD."reviewerAgentExecutorId"
    OR NEW."selfReviewed" IS DISTINCT FROM OLD."selfReviewed"
    OR NEW."completedAt" IS DISTINCT FROM OLD."completedAt"
  ) THEN
    RAISE EXCEPTION 'Completed verification evidence is append-only';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "TaskVerification_protect_evidence"
BEFORE UPDATE ON "TaskVerification"
FOR EACH ROW
EXECUTE FUNCTION "protect_task_verification_evidence"();
