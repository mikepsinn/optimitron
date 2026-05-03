-- Person-centered referendum votes and the minimum Earth-human graph.

CREATE TYPE "PersonLifeStatus" AS ENUM ('UNKNOWN', 'LIVING', 'DECEASED');
CREATE TYPE "PersonConditionStatus" AS ENUM ('UNKNOWN', 'ACTIVE', 'PAST', 'CAUSE_OF_DEATH');
CREATE TYPE "PersonDeathCauseCategory" AS ENUM ('UNKNOWN', 'DISEASE', 'ARMED_CONFLICT', 'STATE_VIOLENCE', 'TERRORISM', 'OTHER_PREVENTABLE', 'OTHER');
CREATE TYPE "PersonCivilianStatus" AS ENUM ('UNKNOWN', 'CIVILIAN', 'COMBATANT');
CREATE TYPE "PersonMemorialEvidenceKind" AS ENUM ('PHOTO', 'DOCUMENT', 'NEWS_ARTICLE', 'HOSPITAL_RECORD', 'DEATH_RECORD', 'WITNESS_STATEMENT', 'OTHER');
CREATE TYPE "EfficacyLagEvidenceStatus" AS ENUM ('CANDIDATE', 'CONFIRMED', 'REJECTED');
CREATE TYPE "ReferendumVoteSource" AS ENUM ('SELF', 'REPRESENTED');
CREATE TYPE "InterventionExperienceStatus" AS ENUM ('UNKNOWN', 'CURRENT', 'PAST', 'PLANNED', 'NEVER_TRIED');
CREATE TYPE "InterventionOutcomeRating" AS ENUM ('UNKNOWN', 'MUCH_WORSE', 'WORSE', 'NO_EFFECT', 'MODERATE_IMPROVEMENT', 'MAJOR_IMPROVEMENT');
CREATE TYPE "InterventionSideEffectSeverity" AS ENUM ('UNKNOWN', 'NONE', 'MINIMAL', 'MILD', 'MODERATE', 'SEVERE', 'EXTREME');
CREATE TYPE "VariableEvidenceMetricKind" AS ENUM ('EFFECT_SIZE', 'EFFECTIVENESS', 'SAFETY', 'NNT', 'NNH', 'COST', 'COST_PER_QALY', 'QALYS_GAINED', 'REMISSION_RATE', 'RESPONSE_RATE', 'ACCESS', 'CONFIDENCE', 'OTHER');
CREATE TYPE "VariableRelationshipEvidenceSourceType" AS ENUM ('IMPORTED_STUDY', 'USER_REPORT', 'OPTIMIZER_N_OF_1', 'OPTIMIZER_AGGREGATE', 'CURATED_DATASET', 'MANUAL', 'OTHER');
CREATE TYPE "InterventionRankingRunStatus" AS ENUM ('DRAFT', 'ACTIVE');
CREATE TYPE "McpToolCallStatus" AS ENUM ('SUCCEEDED', 'FAILED');
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

ALTER TYPE "SubjectType" ADD VALUE IF NOT EXISTS 'PERSON';
ALTER TYPE "McpScope" ADD VALUE IF NOT EXISTS 'earthdata:write';
ALTER TYPE "McpScope" ADD VALUE IF NOT EXISTS 'earthdata:admin';

ALTER TABLE "Person"
  ADD COLUMN "lifeStatus" "PersonLifeStatus" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "deathDate" TIMESTAMP(3);

ALTER TABLE "Subject"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "personId" TEXT,
  ADD COLUMN "jurisdictionId" TEXT,
  ADD COLUMN "organizationId" TEXT;

ALTER TABLE "Measurement"
  ADD COLUMN "subjectId" TEXT,
  ADD COLUMN "recordedByUserId" TEXT;

UPDATE "Person" AS p
SET "lifeStatus" = 'LIVING'
FROM "User" AS u
WHERE u."personId" = p."id"
  AND p."deletedAt" IS NULL;

UPDATE "Person" AS p
SET "createdByUserId" = u."id"
FROM "User" AS u
WHERE u."personId" = p."id"
  AND u."isSystem" = false
  AND p."createdByUserId" IS NULL
  AND p."deletedAt" IS NULL;

CREATE TABLE "PersonRelationship" (
  "id" TEXT NOT NULL,
  "subjectPersonId" TEXT NOT NULL,
  "objectPersonId" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonCondition" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "conditionName" TEXT NOT NULL,
  "conditionCodeSystem" TEXT,
  "conditionCode" TEXT,
  "globalVariableId" TEXT,
  "status" "PersonConditionStatus" NOT NULL DEFAULT 'ACTIVE',
  "reportedByUserId" TEXT,
  "sourceUrl" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonCondition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conflict" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "primaryJurisdictionId" TEXT,
  "sourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonMemorial" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "causeCategory" "PersonDeathCauseCategory" NOT NULL DEFAULT 'UNKNOWN',
  "primaryPersonConditionId" TEXT,
  "deathCountryCode" TEXT,
  "deathLocation" TEXT,
  "conflictId" TEXT,
  "civilianStatus" "PersonCivilianStatus" NOT NULL DEFAULT 'UNKNOWN',
  "wasChild" BOOLEAN,
  "circumstances" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonMemorial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonMemorialSubmission" (
  "id" TEXT NOT NULL,
  "memorialId" TEXT NOT NULL,
  "submittedByUserId" TEXT,
  "memorialMessage" TEXT,
  "consentPublicDisplay" BOOLEAN NOT NULL DEFAULT false,
  "consentCourtEvidence" BOOLEAN NOT NULL DEFAULT false,
  "consentPublicDisplayAt" TIMESTAMP(3),
  "consentCourtEvidenceAt" TIMESTAMP(3),
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonMemorialSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonMemorialResponsibleParty" (
  "id" TEXT NOT NULL,
  "memorialId" TEXT NOT NULL,
  "jurisdictionId" TEXT,
  "organizationId" TEXT,
  "name" TEXT,
  "sourceArtifactId" TEXT,
  "roleSlug" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "confidenceScore" DOUBLE PRECISION,
  "sourceUrl" TEXT,
  "privateNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonMemorialResponsibleParty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonMemorialEvidence" (
  "id" TEXT NOT NULL,
  "memorialId" TEXT NOT NULL,
  "submittedByUserId" TEXT,
  "submissionId" TEXT,
  "sourceArtifactId" TEXT,
  "evidenceKind" "PersonMemorialEvidenceKind" NOT NULL DEFAULT 'OTHER',
  "title" TEXT,
  "description" TEXT,
  "sourceUrl" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "containsSensitiveData" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonMemorialEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionApprovalTimeline" (
  "id" TEXT NOT NULL,
  "interventionName" TEXT NOT NULL,
  "brandName" TEXT,
  "interventionGlobalVariableId" TEXT,
  "conditionName" TEXT NOT NULL,
  "conditionGlobalVariableId" TEXT,
  "jurisdictionId" TEXT,
  "regulatorName" TEXT,
  "firstEvidenceDate" TIMESTAMP(3),
  "firstEvidenceDescription" TEXT,
  "approvalDate" TIMESTAMP(3),
  "approvalDescription" TEXT,
  "efficacyLagDays" INTEGER,
  "estimatedLivesSavedPerYear" DOUBLE PRECISION,
  "estimatedDeathsDuringLag" DOUBLE PRECISION,
  "sourceUrl" TEXT,
  "sourceArtifactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InterventionApprovalTimeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonEfficacyLagEvidence" (
  "id" TEXT NOT NULL,
  "memorialId" TEXT NOT NULL,
  "personConditionId" TEXT,
  "interventionApprovalTimelineId" TEXT NOT NULL,
  "status" "EfficacyLagEvidenceStatus" NOT NULL DEFAULT 'CANDIDATE',
  "diedBeforeApprovalDays" INTEGER,
  "explanation" TEXT,
  "confidenceScore" DOUBLE PRECISION,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PersonEfficacyLagEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalVariableExternalCode" (
  "id" TEXT NOT NULL,
  "globalVariableId" TEXT NOT NULL,
  "codeSystem" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "displayName" TEXT,
  "sourceArtifactId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "GlobalVariableExternalCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionExperience" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "reportedByUserId" TEXT,
  "conditionGlobalVariableId" TEXT,
  "interventionGlobalVariableId" TEXT NOT NULL,
  "status" "InterventionExperienceStatus" NOT NULL DEFAULT 'UNKNOWN',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "doseValue" DOUBLE PRECISION,
  "doseUnitId" TEXT,
  "frequencyText" TEXT,
  "notes" TEXT,
  "sourceArtifactId" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InterventionExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionExperienceOutcome" (
  "id" TEXT NOT NULL,
  "interventionExperienceId" TEXT NOT NULL,
  "outcomeGlobalVariableId" TEXT NOT NULL,
  "rating" "InterventionOutcomeRating" NOT NULL DEFAULT 'UNKNOWN',
  "value" DOUBLE PRECISION,
  "unitId" TEXT,
  "beforeMeasurementId" TEXT,
  "afterMeasurementId" TEXT,
  "publicComment" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InterventionExperienceOutcome_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionExperienceSideEffect" (
  "id" TEXT NOT NULL,
  "interventionExperienceId" TEXT NOT NULL,
  "sideEffectGlobalVariableId" TEXT NOT NULL,
  "severity" "InterventionSideEffectSeverity" NOT NULL DEFAULT 'UNKNOWN',
  "onsetAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "isSerious" BOOLEAN,
  "actionTaken" TEXT,
  "publicComment" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InterventionExperienceSideEffect_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VariableRelationshipEvidenceEstimate" (
  "id" TEXT NOT NULL,
  "predictorGlobalVariableId" TEXT NOT NULL,
  "outcomeGlobalVariableId" TEXT NOT NULL,
  "contextGlobalVariableId" TEXT,
  "metricKind" "VariableEvidenceMetricKind" NOT NULL,
  "sourceType" "VariableRelationshipEvidenceSourceType" NOT NULL DEFAULT 'OTHER',
  "value" DOUBLE PRECISION,
  "unitId" TEXT,
  "confidenceScore" DOUBLE PRECISION,
  "evidenceGrade" "EvidenceGrade",
  "participants" INTEGER,
  "studies" INTEGER,
  "rationale" TEXT,
  "sourceUrl" TEXT,
  "sourceArtifactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "VariableRelationshipEvidenceEstimate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionRankingRun" (
  "id" TEXT NOT NULL,
  "conditionGlobalVariableId" TEXT,
  "algorithmKey" TEXT NOT NULL,
  "algorithmVersion" TEXT,
  "status" "InterventionRankingRunStatus" NOT NULL DEFAULT 'DRAFT',
  "rankedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceArtifactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "InterventionRankingRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RankedIntervention" (
  "id" TEXT NOT NULL,
  "rankingRunId" TEXT NOT NULL,
  "interventionGlobalVariableId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "effectivenessScore" DOUBLE PRECISION,
  "safetyScore" DOUBLE PRECISION,
  "evidenceScore" DOUBLE PRECISION,
  "costScore" DOUBLE PRECISION,
  "confidenceScore" DOUBLE PRECISION,
  "sourceEvidenceEstimateId" TEXT,
  "rationale" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "RankedIntervention_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpToolCallAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "clientId" TEXT,
  "oauthGrantId" TEXT,
  "agentId" TEXT,
  "runId" TEXT,
  "toolName" TEXT NOT NULL,
  "status" "McpToolCallStatus" NOT NULL,
  "inputHash" TEXT,
  "inputSummaryJson" JSONB,
  "outputSummaryJson" JSONB,
  "errorSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "McpToolCallAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reportedByUserId" TEXT,
  "reasonType" TEXT NOT NULL,
  "message" TEXT,
  "correctionJson" JSONB,
  "sourceUrl" TEXT,
  "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReferendumVote"
  ADD COLUMN "personId" TEXT,
  ADD COLUMN "voteSource" "ReferendumVoteSource" NOT NULL DEFAULT 'SELF',
  ADD COLUMN "publicComment" TEXT,
  ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Existing signed-in users should all have linked living Person rows. If any
-- old voter belongs to a system user without a Person, cover that defensively
-- too so the ReferendumVote.personId backfill can be made NOT NULL safely.
INSERT INTO "Person" (
  "id",
  "displayName",
  "isPublic",
  "isPublicFigure",
  "lifeStatus",
  "createdByUserId",
  "createdAt",
  "updatedAt"
)
SELECT
  'person_' || substr(md5(u."id"), 1, 24),
  COALESCE(NULLIF(lower(u."email"), ''), 'Person ' || substr(u."id", 1, 8)),
  false,
  false,
  'LIVING',
  u."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" AS u
WHERE u."personId" IS NULL
  AND (
    u."isSystem" = false
    OR EXISTS (
      SELECT 1
      FROM "ReferendumVote" AS rv
      WHERE rv."userId" = u."id"
    )
  )
ON CONFLICT ("id") DO NOTHING;

UPDATE "User" AS u
SET "personId" = 'person_' || substr(md5(u."id"), 1, 24)
WHERE u."personId" IS NULL
  AND (
    u."isSystem" = false
    OR EXISTS (
      SELECT 1
      FROM "ReferendumVote" AS rv
      WHERE rv."userId" = u."id"
    )
  );

UPDATE "Subject" AS s
SET "userId" = u."id",
    "personId" = u."personId",
    "displayName" = COALESCE(s."displayName", p."displayName", u."email")
FROM "User" AS u
LEFT JOIN "Person" AS p ON p."id" = u."personId"
WHERE s."subjectType" = 'USER'
  AND s."externalId" = u."id";

INSERT INTO "Subject" (
  "id",
  "subjectType",
  "externalId",
  "userId",
  "personId",
  "displayName",
  "createdAt",
  "updatedAt"
)
SELECT
  'subject_user_' || substr(md5(source."userId"), 1, 21),
  'USER',
  source."userId",
  u."id",
  u."personId",
  COALESCE(p."displayName", u."email", 'User ' || substr(source."userId", 1, 8)),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "userId"
  FROM "Measurement"
  WHERE "userId" IS NOT NULL
  UNION
  SELECT DISTINCT "userId"
  FROM "NOf1Variable"
  WHERE "userId" IS NOT NULL
  UNION
  SELECT "id" AS "userId"
  FROM "User"
) AS source
LEFT JOIN "User" AS u ON u."id" = source."userId"
LEFT JOIN "Person" AS p ON p."id" = u."personId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Subject" AS existing
  WHERE existing."subjectType" = 'USER'
    AND existing."externalId" = source."userId"
)
ON CONFLICT ("id") DO NOTHING;

UPDATE "NOf1Variable" AS nv
SET "subjectId" = s."id"
FROM "Subject" AS s
WHERE nv."subjectId" IS NULL
  AND nv."userId" IS NOT NULL
  AND s."subjectType" = 'USER'
  AND s."externalId" = nv."userId";

UPDATE "Measurement" AS m
SET "subjectId" = s."id",
    "recordedByUserId" = CASE
      WHEN EXISTS (SELECT 1 FROM "User" AS u WHERE u."id" = m."userId")
      THEN m."userId"
      ELSE NULL
    END
FROM "Subject" AS s
WHERE m."subjectId" IS NULL
  AND m."userId" IS NOT NULL
  AND s."subjectType" = 'USER'
  AND s."externalId" = m."userId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "NOf1Variable" WHERE "subjectId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill NOf1Variable.subjectId for all existing rows';
  END IF;

  IF EXISTS (SELECT 1 FROM "Measurement" WHERE "subjectId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill Measurement.subjectId for all existing rows';
  END IF;
END $$;

UPDATE "ReferendumVote" AS rv
SET "personId" = u."personId"
FROM "User" AS u
WHERE rv."userId" = u."id"
  AND rv."personId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ReferendumVote" WHERE "personId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill ReferendumVote.personId for all existing votes';
  END IF;
END $$;

ALTER TABLE "ReferendumVote"
  ALTER COLUMN "personId" SET NOT NULL;

ALTER TABLE "NOf1Variable"
  ALTER COLUMN "subjectId" SET NOT NULL;

ALTER TABLE "Measurement"
  ALTER COLUMN "subjectId" SET NOT NULL;

-- Typed subjects are keyed by their concrete FK columns. Keep externalId only
-- for imported or unlinked subjects without a typed row target.
UPDATE "Subject"
SET "externalId" = NULL
WHERE "userId" IS NOT NULL
   OR "personId" IS NOT NULL
   OR "jurisdictionId" IS NOT NULL
   OR "organizationId" IS NOT NULL;

DROP INDEX IF EXISTS "Subject_externalId_key";
DROP INDEX IF EXISTS "NOf1Variable_userId_idx";
DROP INDEX IF EXISTS "NOf1Variable_userId_globalVariableId_key";
DROP INDEX IF EXISTS "Measurement_userId_idx";
DROP INDEX IF EXISTS "Measurement_userId_startTime_idx";
DROP INDEX IF EXISTS "Measurement_userId_globalVariableId_startTime_idx";
DROP INDEX IF EXISTS "Measurement_userId_globalVariableId_startTime_key";
DROP INDEX IF EXISTS "ReferendumVote_userId_referendumId_key";

ALTER TABLE "NOf1Variable"
  DROP COLUMN "userId";

ALTER TABLE "Measurement"
  DROP COLUMN "userId";

CREATE UNIQUE INDEX "ReferendumVote_referendumId_personId_key" ON "ReferendumVote"("referendumId", "personId");
CREATE UNIQUE INDEX "Subject_userId_key" ON "Subject"("userId");
CREATE UNIQUE INDEX "Subject_personId_key" ON "Subject"("personId");
CREATE UNIQUE INDEX "Subject_jurisdictionId_key" ON "Subject"("jurisdictionId");
CREATE UNIQUE INDEX "Subject_organizationId_key" ON "Subject"("organizationId");
CREATE UNIQUE INDEX "Subject_subjectType_externalId_key" ON "Subject"("subjectType", "externalId");
CREATE UNIQUE INDEX "NOf1Variable_subjectId_globalVariableId_key" ON "NOf1Variable"("subjectId", "globalVariableId");
CREATE UNIQUE INDEX "Measurement_subjectId_globalVariableId_startTime_key" ON "Measurement"("subjectId", "globalVariableId", "startTime");
CREATE INDEX "Subject_externalId_idx" ON "Subject"("externalId");
CREATE INDEX "Measurement_subjectId_idx" ON "Measurement"("subjectId");
CREATE INDEX "Measurement_subjectId_startTime_idx" ON "Measurement"("subjectId", "startTime");
CREATE INDEX "Measurement_recordedByUserId_idx" ON "Measurement"("recordedByUserId");
CREATE INDEX "Measurement_subjectId_globalVariableId_startTime_idx" ON "Measurement"("subjectId", "globalVariableId", "startTime");
CREATE INDEX "Person_deathDate_idx" ON "Person"("deathDate");
CREATE INDEX "Person_createdByUserId_idx" ON "Person"("createdByUserId");
CREATE INDEX "Person_lifeStatus_idx" ON "Person"("lifeStatus");
CREATE INDEX "PersonRelationship_subjectPersonId_idx" ON "PersonRelationship"("subjectPersonId");
CREATE INDEX "PersonRelationship_objectPersonId_idx" ON "PersonRelationship"("objectPersonId");
CREATE INDEX "PersonRelationship_createdByUserId_idx" ON "PersonRelationship"("createdByUserId");
CREATE INDEX "PersonCondition_personId_idx" ON "PersonCondition"("personId");
CREATE INDEX "PersonCondition_globalVariableId_idx" ON "PersonCondition"("globalVariableId");
CREATE INDEX "PersonCondition_conditionName_idx" ON "PersonCondition"("conditionName");
CREATE INDEX "PersonCondition_conditionCodeSystem_conditionCode_idx" ON "PersonCondition"("conditionCodeSystem", "conditionCode");
CREATE INDEX "PersonCondition_status_idx" ON "PersonCondition"("status");
CREATE UNIQUE INDEX "Conflict_slug_key" ON "Conflict"("slug");
CREATE INDEX "Conflict_name_idx" ON "Conflict"("name");
CREATE INDEX "Conflict_startDate_idx" ON "Conflict"("startDate");
CREATE INDEX "Conflict_endDate_idx" ON "Conflict"("endDate");
CREATE INDEX "Conflict_primaryJurisdictionId_idx" ON "Conflict"("primaryJurisdictionId");
CREATE INDEX "Conflict_deletedAt_idx" ON "Conflict"("deletedAt");
CREATE UNIQUE INDEX "PersonMemorial_personId_key" ON "PersonMemorial"("personId");
CREATE INDEX "PersonMemorial_causeCategory_idx" ON "PersonMemorial"("causeCategory");
CREATE INDEX "PersonMemorial_primaryPersonConditionId_idx" ON "PersonMemorial"("primaryPersonConditionId");
CREATE INDEX "PersonMemorial_deathCountryCode_idx" ON "PersonMemorial"("deathCountryCode");
CREATE INDEX "PersonMemorial_conflictId_idx" ON "PersonMemorial"("conflictId");
CREATE INDEX "PersonMemorial_isPublic_idx" ON "PersonMemorial"("isPublic");
CREATE INDEX "PersonMemorial_deletedAt_idx" ON "PersonMemorial"("deletedAt");
CREATE INDEX "PersonMemorialSubmission_memorialId_idx" ON "PersonMemorialSubmission"("memorialId");
CREATE INDEX "PersonMemorialSubmission_submittedByUserId_idx" ON "PersonMemorialSubmission"("submittedByUserId");
CREATE INDEX "PersonMemorialSubmission_consentCourtEvidence_idx" ON "PersonMemorialSubmission"("consentCourtEvidence");
CREATE INDEX "PersonMemorialSubmission_isPublic_deletedAt_idx" ON "PersonMemorialSubmission"("isPublic", "deletedAt");
CREATE INDEX "PersonMemorialResponsibleParty_memorialId_idx" ON "PersonMemorialResponsibleParty"("memorialId");
CREATE INDEX "PersonMemorialResponsibleParty_jurisdictionId_idx" ON "PersonMemorialResponsibleParty"("jurisdictionId");
CREATE INDEX "PersonMemorialResponsibleParty_organizationId_idx" ON "PersonMemorialResponsibleParty"("organizationId");
CREATE INDEX "PersonMemorialResponsibleParty_sourceArtifactId_idx" ON "PersonMemorialResponsibleParty"("sourceArtifactId");
CREATE INDEX "PersonMemorialResponsibleParty_isPublic_deletedAt_idx" ON "PersonMemorialResponsibleParty"("isPublic", "deletedAt");
CREATE UNIQUE INDEX "PersonEfficacyLagEvidence_memorial_timeline_key" ON "PersonEfficacyLagEvidence"("memorialId", "interventionApprovalTimelineId");
CREATE UNIQUE INDEX "GlobalVariableExternalCode_globalVariableId_codeSystem_code_key" ON "GlobalVariableExternalCode"("globalVariableId", "codeSystem", "code");
CREATE INDEX "GlobalVariableExternalCode_codeSystem_code_idx" ON "GlobalVariableExternalCode"("codeSystem", "code");
CREATE INDEX "GlobalVariableExternalCode_globalVariableId_idx" ON "GlobalVariableExternalCode"("globalVariableId");
CREATE INDEX "GlobalVariableExternalCode_sourceArtifactId_idx" ON "GlobalVariableExternalCode"("sourceArtifactId");
CREATE INDEX "GlobalVariableExternalCode_deletedAt_idx" ON "GlobalVariableExternalCode"("deletedAt");
CREATE INDEX "VariableRelationshipEvidenceEstimate_predictorGlobalVariableId_idx" ON "VariableRelationshipEvidenceEstimate"("predictorGlobalVariableId");
CREATE INDEX "VariableRelationshipEvidenceEstimate_outcomeGlobalVariableId_idx" ON "VariableRelationshipEvidenceEstimate"("outcomeGlobalVariableId");
CREATE INDEX "VariableRelationshipEvidenceEstimate_contextGlobalVariableId_idx" ON "VariableRelationshipEvidenceEstimate"("contextGlobalVariableId");
CREATE INDEX "VariableRelationshipEvidenceEstimate_metricKind_idx" ON "VariableRelationshipEvidenceEstimate"("metricKind");
CREATE INDEX "VariableRelationshipEvidenceEstimate_sourceType_idx" ON "VariableRelationshipEvidenceEstimate"("sourceType");
CREATE INDEX "VariableRelationshipEvidenceEstimate_unitId_idx" ON "VariableRelationshipEvidenceEstimate"("unitId");
CREATE INDEX "VariableRelationshipEvidenceEstimate_sourceArtifactId_idx" ON "VariableRelationshipEvidenceEstimate"("sourceArtifactId");
CREATE INDEX "VariableRelationshipEvidenceEstimate_deletedAt_idx" ON "VariableRelationshipEvidenceEstimate"("deletedAt");
CREATE INDEX "InterventionRankingRun_conditionGlobalVariableId_idx" ON "InterventionRankingRun"("conditionGlobalVariableId");
CREATE INDEX "InterventionRankingRun_algorithmKey_idx" ON "InterventionRankingRun"("algorithmKey");
CREATE INDEX "InterventionRankingRun_status_idx" ON "InterventionRankingRun"("status");
CREATE INDEX "InterventionRankingRun_rankedAt_idx" ON "InterventionRankingRun"("rankedAt");
CREATE INDEX "InterventionRankingRun_sourceArtifactId_idx" ON "InterventionRankingRun"("sourceArtifactId");
CREATE INDEX "InterventionRankingRun_deletedAt_idx" ON "InterventionRankingRun"("deletedAt");
CREATE UNIQUE INDEX "RankedIntervention_rankingRunId_interventionGlobalVariableId_key" ON "RankedIntervention"("rankingRunId", "interventionGlobalVariableId");
CREATE UNIQUE INDEX "RankedIntervention_rankingRunId_rank_key" ON "RankedIntervention"("rankingRunId", "rank");
CREATE INDEX "RankedIntervention_rankingRunId_idx" ON "RankedIntervention"("rankingRunId");
CREATE INDEX "RankedIntervention_interventionGlobalVariableId_idx" ON "RankedIntervention"("interventionGlobalVariableId");
CREATE INDEX "RankedIntervention_sourceEvidenceEstimateId_idx" ON "RankedIntervention"("sourceEvidenceEstimateId");
CREATE INDEX "RankedIntervention_score_idx" ON "RankedIntervention"("score");
CREATE INDEX "RankedIntervention_deletedAt_idx" ON "RankedIntervention"("deletedAt");
CREATE INDEX "McpToolCallAudit_userId_idx" ON "McpToolCallAudit"("userId");
CREATE INDEX "McpToolCallAudit_clientId_idx" ON "McpToolCallAudit"("clientId");
CREATE INDEX "McpToolCallAudit_oauthGrantId_idx" ON "McpToolCallAudit"("oauthGrantId");
CREATE INDEX "McpToolCallAudit_agentId_idx" ON "McpToolCallAudit"("agentId");
CREATE INDEX "McpToolCallAudit_runId_idx" ON "McpToolCallAudit"("runId");
CREATE INDEX "McpToolCallAudit_toolName_createdAt_idx" ON "McpToolCallAudit"("toolName", "createdAt");
CREATE INDEX "McpToolCallAudit_status_createdAt_idx" ON "McpToolCallAudit"("status", "createdAt");
CREATE INDEX "McpToolCallAudit_deletedAt_idx" ON "McpToolCallAudit"("deletedAt");
CREATE INDEX "ContentReport_targetType_targetId_status_idx" ON "ContentReport"("targetType", "targetId", "status");
CREATE INDEX "ContentReport_reportedByUserId_idx" ON "ContentReport"("reportedByUserId");
CREATE INDEX "ContentReport_reviewedByUserId_idx" ON "ContentReport"("reviewedByUserId");
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
CREATE INDEX "ContentReport_deletedAt_idx" ON "ContentReport"("deletedAt");
CREATE INDEX "ReferendumVote_userId_referendumId_idx" ON "ReferendumVote"("userId", "referendumId");
CREATE INDEX "ReferendumVote_personId_idx" ON "ReferendumVote"("personId");
CREATE INDEX "ReferendumVote_referendumId_answer_voteSource_deletedAt_idx" ON "ReferendumVote"("referendumId", "answer", "voteSource", "deletedAt");

ALTER TABLE "Person"
  ADD CONSTRAINT "Person_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subject"
  ADD CONSTRAINT "Subject_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subject"
  ADD CONSTRAINT "Subject_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subject"
  ADD CONSTRAINT "Subject_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subject"
  ADD CONSTRAINT "Subject_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Measurement"
  ADD CONSTRAINT "Measurement_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Measurement"
  ADD CONSTRAINT "Measurement_recordedByUserId_fkey"
  FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonRelationship"
  ADD CONSTRAINT "PersonRelationship_subjectPersonId_fkey"
  FOREIGN KEY ("subjectPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonRelationship"
  ADD CONSTRAINT "PersonRelationship_objectPersonId_fkey"
  FOREIGN KEY ("objectPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonRelationship"
  ADD CONSTRAINT "PersonRelationship_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonCondition"
  ADD CONSTRAINT "PersonCondition_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonCondition"
  ADD CONSTRAINT "PersonCondition_globalVariableId_fkey"
  FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonCondition"
  ADD CONSTRAINT "PersonCondition_reportedByUserId_fkey"
  FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conflict"
  ADD CONSTRAINT "Conflict_primaryJurisdictionId_fkey"
  FOREIGN KEY ("primaryJurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorial"
  ADD CONSTRAINT "PersonMemorial_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonMemorial"
  ADD CONSTRAINT "PersonMemorial_primaryPersonConditionId_fkey"
  FOREIGN KEY ("primaryPersonConditionId") REFERENCES "PersonCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorial"
  ADD CONSTRAINT "PersonMemorial_conflictId_fkey"
  FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialSubmission"
  ADD CONSTRAINT "PersonMemorialSubmission_memorialId_fkey"
  FOREIGN KEY ("memorialId") REFERENCES "PersonMemorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialSubmission"
  ADD CONSTRAINT "PersonMemorialSubmission_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialResponsibleParty"
  ADD CONSTRAINT "PersonMemorialResponsibleParty_memorialId_fkey"
  FOREIGN KEY ("memorialId") REFERENCES "PersonMemorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialResponsibleParty"
  ADD CONSTRAINT "PersonMemorialResponsibleParty_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialResponsibleParty"
  ADD CONSTRAINT "PersonMemorialResponsibleParty_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialResponsibleParty"
  ADD CONSTRAINT "PersonMemorialResponsibleParty_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialEvidence"
  ADD CONSTRAINT "PersonMemorialEvidence_memorialId_fkey"
  FOREIGN KEY ("memorialId") REFERENCES "PersonMemorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialEvidence"
  ADD CONSTRAINT "PersonMemorialEvidence_submittedByUserId_fkey"
  FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialEvidence"
  ADD CONSTRAINT "PersonMemorialEvidence_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "PersonMemorialSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonMemorialEvidence"
  ADD CONSTRAINT "PersonMemorialEvidence_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionApprovalTimeline"
  ADD CONSTRAINT "InterventionApprovalTimeline_interventionGlobalVariableId_fkey"
  FOREIGN KEY ("interventionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionApprovalTimeline"
  ADD CONSTRAINT "InterventionApprovalTimeline_conditionGlobalVariableId_fkey"
  FOREIGN KEY ("conditionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionApprovalTimeline"
  ADD CONSTRAINT "InterventionApprovalTimeline_jurisdictionId_fkey"
  FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionApprovalTimeline"
  ADD CONSTRAINT "InterventionApprovalTimeline_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonEfficacyLagEvidence"
  ADD CONSTRAINT "PersonEfficacyLagEvidence_memorialId_fkey"
  FOREIGN KEY ("memorialId") REFERENCES "PersonMemorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonEfficacyLagEvidence"
  ADD CONSTRAINT "PersonEfficacyLagEvidence_personConditionId_fkey"
  FOREIGN KEY ("personConditionId") REFERENCES "PersonCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonEfficacyLagEvidence"
  ADD CONSTRAINT "PersonEfficacyLagEvidence_interventionApprovalTimelineId_fkey"
  FOREIGN KEY ("interventionApprovalTimelineId") REFERENCES "InterventionApprovalTimeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonEfficacyLagEvidence"
  ADD CONSTRAINT "PersonEfficacyLagEvidence_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferendumVote"
  ADD CONSTRAINT "ReferendumVote_personId_fkey"
  FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GlobalVariableExternalCode"
  ADD CONSTRAINT "GlobalVariableExternalCode_globalVariableId_fkey"
  FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GlobalVariableExternalCode"
  ADD CONSTRAINT "GlobalVariableExternalCode_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_reportedByUserId_fkey"
  FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_conditionGlobalVariableId_fkey"
  FOREIGN KEY ("conditionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_interventionGlobalVariableId_fkey"
  FOREIGN KEY ("interventionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_doseUnitId_fkey"
  FOREIGN KEY ("doseUnitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperience"
  ADD CONSTRAINT "InterventionExperience_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceOutcome"
  ADD CONSTRAINT "InterventionExperienceOutcome_interventionExperienceId_fkey"
  FOREIGN KEY ("interventionExperienceId") REFERENCES "InterventionExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceOutcome"
  ADD CONSTRAINT "InterventionExperienceOutcome_outcomeGlobalVariableId_fkey"
  FOREIGN KEY ("outcomeGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceOutcome"
  ADD CONSTRAINT "InterventionExperienceOutcome_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceOutcome"
  ADD CONSTRAINT "InterventionExperienceOutcome_beforeMeasurementId_fkey"
  FOREIGN KEY ("beforeMeasurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceOutcome"
  ADD CONSTRAINT "InterventionExperienceOutcome_afterMeasurementId_fkey"
  FOREIGN KEY ("afterMeasurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceSideEffect"
  ADD CONSTRAINT "InterventionExperienceSideEffect_interventionExperienceId_fkey"
  FOREIGN KEY ("interventionExperienceId") REFERENCES "InterventionExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterventionExperienceSideEffect"
  ADD CONSTRAINT "InterventionExperienceSideEffect_sideEffectGlobalVariableId_fkey"
  FOREIGN KEY ("sideEffectGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VariableRelationshipEvidenceEstimate"
  ADD CONSTRAINT "VariableRelationshipEvidenceEstimate_predictorGlobalVariableId_fkey"
  FOREIGN KEY ("predictorGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VariableRelationshipEvidenceEstimate"
  ADD CONSTRAINT "VariableRelationshipEvidenceEstimate_outcomeGlobalVariableId_fkey"
  FOREIGN KEY ("outcomeGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VariableRelationshipEvidenceEstimate"
  ADD CONSTRAINT "VariableRelationshipEvidenceEstimate_contextGlobalVariableId_fkey"
  FOREIGN KEY ("contextGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VariableRelationshipEvidenceEstimate"
  ADD CONSTRAINT "VariableRelationshipEvidenceEstimate_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VariableRelationshipEvidenceEstimate"
  ADD CONSTRAINT "VariableRelationshipEvidenceEstimate_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionRankingRun"
  ADD CONSTRAINT "InterventionRankingRun_conditionGlobalVariableId_fkey"
  FOREIGN KEY ("conditionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterventionRankingRun"
  ADD CONSTRAINT "InterventionRankingRun_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RankedIntervention"
  ADD CONSTRAINT "RankedIntervention_rankingRunId_fkey"
  FOREIGN KEY ("rankingRunId") REFERENCES "InterventionRankingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RankedIntervention"
  ADD CONSTRAINT "RankedIntervention_interventionGlobalVariableId_fkey"
  FOREIGN KEY ("interventionGlobalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RankedIntervention"
  ADD CONSTRAINT "RankedIntervention_sourceEvidenceEstimateId_fkey"
  FOREIGN KEY ("sourceEvidenceEstimateId") REFERENCES "VariableRelationshipEvidenceEstimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "McpToolCallAudit"
  ADD CONSTRAINT "McpToolCallAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "McpToolCallAudit"
  ADD CONSTRAINT "McpToolCallAudit_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("clientId") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "McpToolCallAudit"
  ADD CONSTRAINT "McpToolCallAudit_oauthGrantId_fkey"
  FOREIGN KEY ("oauthGrantId") REFERENCES "OAuthGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentReport"
  ADD CONSTRAINT "ContentReport_reportedByUserId_fkey"
  FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentReport"
  ADD CONSTRAINT "ContentReport_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "enforce_referendum_vote_person_invariants"()
RETURNS trigger AS $$
DECLARE
  caster_person_id TEXT;
  target_life_status "PersonLifeStatus";
BEGIN
  IF NEW."voteSource" = 'SELF' THEN
    SELECT "personId"
    INTO caster_person_id
    FROM "User"
    WHERE "id" = NEW."userId";

    IF caster_person_id IS NULL OR caster_person_id <> NEW."personId" THEN
      RAISE EXCEPTION 'SELF referendum votes must use the casting user personId';
    END IF;

    SELECT "lifeStatus"
    INTO target_life_status
    FROM "Person"
    WHERE "id" = NEW."personId";

    IF target_life_status IS DISTINCT FROM 'LIVING' THEN
      RAISE EXCEPTION 'SELF referendum votes must target a living person';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ReferendumVote_person_invariants"
BEFORE INSERT OR UPDATE OF "userId", "personId", "voteSource"
ON "ReferendumVote"
FOR EACH ROW
EXECUTE FUNCTION "enforce_referendum_vote_person_invariants"();

CREATE OR REPLACE FUNCTION "enforce_person_memorial_condition_invariant"()
RETURNS trigger AS $$
BEGIN
  IF NEW."primaryPersonConditionId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "PersonCondition" AS pc
      WHERE pc."id" = NEW."primaryPersonConditionId"
        AND pc."personId" = NEW."personId"
    )
  THEN
    RAISE EXCEPTION 'PersonMemorial.primaryPersonConditionId must belong to memorial person';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PersonMemorial_condition_invariant"
BEFORE INSERT OR UPDATE OF "personId", "primaryPersonConditionId"
ON "PersonMemorial"
FOR EACH ROW
EXECUTE FUNCTION "enforce_person_memorial_condition_invariant"();

CREATE OR REPLACE FUNCTION "enforce_person_memorial_evidence_submission_invariant"()
RETURNS trigger AS $$
BEGIN
  IF NEW."submissionId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "PersonMemorialSubmission" AS pms
      WHERE pms."id" = NEW."submissionId"
        AND pms."memorialId" = NEW."memorialId"
    )
  THEN
    RAISE EXCEPTION 'PersonMemorialEvidence.submissionId must belong to the same memorial';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PersonMemorialEvidence_submission_invariant"
BEFORE INSERT OR UPDATE OF "memorialId", "submissionId"
ON "PersonMemorialEvidence"
FOR EACH ROW
EXECUTE FUNCTION "enforce_person_memorial_evidence_submission_invariant"();

CREATE OR REPLACE FUNCTION "enforce_person_efficacy_lag_condition_invariant"()
RETURNS trigger AS $$
BEGIN
  IF NEW."personConditionId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "PersonMemorial" AS pm
      JOIN "PersonCondition" AS pc
        ON pc."id" = NEW."personConditionId"
       AND pc."personId" = pm."personId"
      WHERE pm."id" = NEW."memorialId"
    )
  THEN
    RAISE EXCEPTION 'PersonEfficacyLagEvidence.personConditionId must belong to memorial person';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PersonEfficacyLagEvidence_condition_invariant"
BEFORE INSERT OR UPDATE OF "memorialId", "personConditionId"
ON "PersonEfficacyLagEvidence"
FOR EACH ROW
EXECUTE FUNCTION "enforce_person_efficacy_lag_condition_invariant"();
