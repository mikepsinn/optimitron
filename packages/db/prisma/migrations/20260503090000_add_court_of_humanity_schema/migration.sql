-- Court of Humanity scalable minimal schema.
-- Keep the court-specific spine small and reuse Subject, Referendum, Task,
-- SourceArtifact, PersonMemorial, and MCP audit tables for adjacent behavior.

CREATE TYPE "CourtCaseStatus" AS ENUM ('DRAFT', 'OPEN', 'VOTING', 'JUDGED', 'ARCHIVED');
CREATE TYPE "CourtCasePartyRole" AS ENUM ('NOMINAL_PLAINTIFF', 'NAMED_PLAINTIFF', 'REPRESENTATIVE_CLASS', 'RESPONDENT', 'AMICUS', 'BENEFICIARY');
CREATE TYPE "CourtCasePartyCapacity" AS ENUM ('INSTITUTIONAL', 'OFFICIAL_CAPACITY', 'PERSONAL_CAPACITY', 'OVERSIGHT_CAPACITY', 'CLASS_REPRESENTATIVE');
CREATE TYPE "CourtCaseItemStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

CREATE TABLE "CourtCase" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "status" "CourtCaseStatus" NOT NULL DEFAULT 'DRAFT',
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdByUserId" TEXT,
  "nominalPlaintiffSubjectId" TEXT,
  "primaryRespondentSubjectId" TEXT,
  "beneficiarySubjectId" TEXT,
  "rootTaskId" TEXT,
  "juryReferendumId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourtCaseParty" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "partyKey" TEXT,
  "subjectId" TEXT NOT NULL,
  "role" "CourtCasePartyRole" NOT NULL,
  "capacity" "CourtCasePartyCapacity",
  "displayNameSnapshot" TEXT,
  "standingTheory" TEXT,
  "powerToRemedyScore" DOUBLE PRECISION,
  "blameAttributionScore" DOUBLE PRECISION,
  "publicAccountabilityScore" DOUBLE PRECISION,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCaseParty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourtCaseClaim" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "claimKey" TEXT,
  "title" TEXT NOT NULL,
  "claimType" TEXT,
  "argumentMarkdown" TEXT NOT NULL,
  "requestedFinding" TEXT,
  "status" "CourtCaseItemStatus" NOT NULL DEFAULT 'PROPOSED',
  "juryReferendumId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCaseClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourtCaseHarm" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "claimId" TEXT,
  "harmKey" TEXT,
  "harmType" TEXT,
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT,
  "affectedSubjectId" TEXT,
  "globalVariableId" TEXT,
  "parameterName" TEXT,
  "lowValue" DOUBLE PRECISION,
  "baseValue" DOUBLE PRECISION,
  "highValue" DOUBLE PRECISION,
  "unit" TEXT,
  "confidenceScore" DOUBLE PRECISION,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "status" "CourtCaseItemStatus" NOT NULL DEFAULT 'PROPOSED',
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCaseHarm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourtCaseEvidence" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "claimId" TEXT,
  "harmId" TEXT,
  "evidenceKey" TEXT,
  "evidenceType" TEXT,
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT,
  "sourceArtifactId" TEXT,
  "personMemorialId" TEXT,
  "globalVariableId" TEXT,
  "parameterName" TEXT,
  "sourceUrl" TEXT,
  "contentHash" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
  "reviewStatus" "CourtCaseItemStatus" NOT NULL DEFAULT 'PROPOSED',
  "confidenceScore" DOUBLE PRECISION,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCaseEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourtCaseRemedy" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "claimId" TEXT,
  "targetPartyId" TEXT,
  "remedyKey" TEXT,
  "remedyType" TEXT,
  "title" TEXT NOT NULL,
  "bodyMarkdown" TEXT NOT NULL,
  "amountUsdLow" DOUBLE PRECISION,
  "amountUsdBase" DOUBLE PRECISION,
  "amountUsdHigh" DOUBLE PRECISION,
  "deadlineAt" TIMESTAMP(3),
  "enforcementTaskId" TEXT,
  "status" "CourtCaseItemStatus" NOT NULL DEFAULT 'PROPOSED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CourtCaseRemedy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourtCase_slug_key" ON "CourtCase"("slug");
CREATE UNIQUE INDEX "CourtCase_rootTaskId_key" ON "CourtCase"("rootTaskId");
CREATE UNIQUE INDEX "CourtCase_juryReferendumId_key" ON "CourtCase"("juryReferendumId");
CREATE INDEX "CourtCase_status_isPublic_deletedAt_idx" ON "CourtCase"("status", "isPublic", "deletedAt");
CREATE INDEX "CourtCase_createdByUserId_idx" ON "CourtCase"("createdByUserId");
CREATE INDEX "CourtCase_nominalPlaintiffSubjectId_idx" ON "CourtCase"("nominalPlaintiffSubjectId");
CREATE INDEX "CourtCase_primaryRespondentSubjectId_idx" ON "CourtCase"("primaryRespondentSubjectId");
CREATE INDEX "CourtCase_beneficiarySubjectId_idx" ON "CourtCase"("beneficiarySubjectId");
CREATE INDEX "CourtCase_createdAt_idx" ON "CourtCase"("createdAt");
CREATE INDEX "CourtCase_deletedAt_idx" ON "CourtCase"("deletedAt");

CREATE UNIQUE INDEX "CourtCaseParty_caseId_partyKey_key" ON "CourtCaseParty"("caseId", "partyKey");
CREATE UNIQUE INDEX "CourtCaseParty_caseId_role_subjectId_key" ON "CourtCaseParty"("caseId", "role", "subjectId");
CREATE INDEX "CourtCaseParty_caseId_role_idx" ON "CourtCaseParty"("caseId", "role");
CREATE INDEX "CourtCaseParty_subjectId_role_idx" ON "CourtCaseParty"("subjectId", "role");
CREATE INDEX "CourtCaseParty_createdByUserId_idx" ON "CourtCaseParty"("createdByUserId");
CREATE INDEX "CourtCaseParty_isPublic_deletedAt_idx" ON "CourtCaseParty"("isPublic", "deletedAt");
CREATE INDEX "CourtCaseParty_deletedAt_idx" ON "CourtCaseParty"("deletedAt");

CREATE UNIQUE INDEX "CourtCaseClaim_juryReferendumId_key" ON "CourtCaseClaim"("juryReferendumId");
CREATE UNIQUE INDEX "CourtCaseClaim_caseId_claimKey_key" ON "CourtCaseClaim"("caseId", "claimKey");
CREATE INDEX "CourtCaseClaim_caseId_status_deletedAt_idx" ON "CourtCaseClaim"("caseId", "status", "deletedAt");
CREATE INDEX "CourtCaseClaim_createdByUserId_idx" ON "CourtCaseClaim"("createdByUserId");
CREATE INDEX "CourtCaseClaim_isPublic_deletedAt_idx" ON "CourtCaseClaim"("isPublic", "deletedAt");
CREATE INDEX "CourtCaseClaim_deletedAt_idx" ON "CourtCaseClaim"("deletedAt");

CREATE UNIQUE INDEX "CourtCaseHarm_caseId_harmKey_key" ON "CourtCaseHarm"("caseId", "harmKey");
CREATE INDEX "CourtCaseHarm_caseId_status_deletedAt_idx" ON "CourtCaseHarm"("caseId", "status", "deletedAt");
CREATE INDEX "CourtCaseHarm_claimId_idx" ON "CourtCaseHarm"("claimId");
CREATE INDEX "CourtCaseHarm_affectedSubjectId_idx" ON "CourtCaseHarm"("affectedSubjectId");
CREATE INDEX "CourtCaseHarm_globalVariableId_idx" ON "CourtCaseHarm"("globalVariableId");
CREATE INDEX "CourtCaseHarm_parameterName_idx" ON "CourtCaseHarm"("parameterName");
CREATE INDEX "CourtCaseHarm_harmType_idx" ON "CourtCaseHarm"("harmType");
CREATE INDEX "CourtCaseHarm_createdByUserId_idx" ON "CourtCaseHarm"("createdByUserId");
CREATE INDEX "CourtCaseHarm_isPublic_deletedAt_idx" ON "CourtCaseHarm"("isPublic", "deletedAt");
CREATE INDEX "CourtCaseHarm_deletedAt_idx" ON "CourtCaseHarm"("deletedAt");

CREATE UNIQUE INDEX "CourtCaseEvidence_caseId_evidenceKey_key" ON "CourtCaseEvidence"("caseId", "evidenceKey");
CREATE INDEX "CourtCaseEvidence_caseId_reviewStatus_deletedAt_idx" ON "CourtCaseEvidence"("caseId", "reviewStatus", "deletedAt");
CREATE INDEX "CourtCaseEvidence_claimId_idx" ON "CourtCaseEvidence"("claimId");
CREATE INDEX "CourtCaseEvidence_harmId_idx" ON "CourtCaseEvidence"("harmId");
CREATE INDEX "CourtCaseEvidence_sourceArtifactId_idx" ON "CourtCaseEvidence"("sourceArtifactId");
CREATE INDEX "CourtCaseEvidence_personMemorialId_idx" ON "CourtCaseEvidence"("personMemorialId");
CREATE INDEX "CourtCaseEvidence_globalVariableId_idx" ON "CourtCaseEvidence"("globalVariableId");
CREATE INDEX "CourtCaseEvidence_parameterName_idx" ON "CourtCaseEvidence"("parameterName");
CREATE INDEX "CourtCaseEvidence_sourceUrl_idx" ON "CourtCaseEvidence"("sourceUrl");
CREATE INDEX "CourtCaseEvidence_evidenceType_idx" ON "CourtCaseEvidence"("evidenceType");
CREATE INDEX "CourtCaseEvidence_createdByUserId_idx" ON "CourtCaseEvidence"("createdByUserId");
CREATE INDEX "CourtCaseEvidence_isPublic_containsSensitiveData_deletedAt_idx" ON "CourtCaseEvidence"("isPublic", "containsSensitiveData", "deletedAt");
CREATE INDEX "CourtCaseEvidence_deletedAt_idx" ON "CourtCaseEvidence"("deletedAt");

CREATE UNIQUE INDEX "CourtCaseRemedy_caseId_remedyKey_key" ON "CourtCaseRemedy"("caseId", "remedyKey");
CREATE INDEX "CourtCaseRemedy_caseId_status_deletedAt_idx" ON "CourtCaseRemedy"("caseId", "status", "deletedAt");
CREATE INDEX "CourtCaseRemedy_claimId_idx" ON "CourtCaseRemedy"("claimId");
CREATE INDEX "CourtCaseRemedy_targetPartyId_idx" ON "CourtCaseRemedy"("targetPartyId");
CREATE INDEX "CourtCaseRemedy_enforcementTaskId_idx" ON "CourtCaseRemedy"("enforcementTaskId");
CREATE INDEX "CourtCaseRemedy_remedyType_idx" ON "CourtCaseRemedy"("remedyType");
CREATE INDEX "CourtCaseRemedy_createdByUserId_idx" ON "CourtCaseRemedy"("createdByUserId");
CREATE INDEX "CourtCaseRemedy_isPublic_deletedAt_idx" ON "CourtCaseRemedy"("isPublic", "deletedAt");
CREATE INDEX "CourtCaseRemedy_deletedAt_idx" ON "CourtCaseRemedy"("deletedAt");

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_nominalPlaintiffSubjectId_fkey"
  FOREIGN KEY ("nominalPlaintiffSubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_primaryRespondentSubjectId_fkey"
  FOREIGN KEY ("primaryRespondentSubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_beneficiarySubjectId_fkey"
  FOREIGN KEY ("beneficiarySubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_rootTaskId_fkey"
  FOREIGN KEY ("rootTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCase"
  ADD CONSTRAINT "CourtCase_juryReferendumId_fkey"
  FOREIGN KEY ("juryReferendumId") REFERENCES "Referendum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseParty"
  ADD CONSTRAINT "CourtCaseParty_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseParty"
  ADD CONSTRAINT "CourtCaseParty_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseParty"
  ADD CONSTRAINT "CourtCaseParty_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseClaim"
  ADD CONSTRAINT "CourtCaseClaim_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseClaim"
  ADD CONSTRAINT "CourtCaseClaim_juryReferendumId_fkey"
  FOREIGN KEY ("juryReferendumId") REFERENCES "Referendum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseClaim"
  ADD CONSTRAINT "CourtCaseClaim_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseHarm"
  ADD CONSTRAINT "CourtCaseHarm_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseHarm"
  ADD CONSTRAINT "CourtCaseHarm_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "CourtCaseClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseHarm"
  ADD CONSTRAINT "CourtCaseHarm_affectedSubjectId_fkey"
  FOREIGN KEY ("affectedSubjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseHarm"
  ADD CONSTRAINT "CourtCaseHarm_globalVariableId_fkey"
  FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseHarm"
  ADD CONSTRAINT "CourtCaseHarm_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "CourtCaseClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_harmId_fkey"
  FOREIGN KEY ("harmId") REFERENCES "CourtCaseHarm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_sourceArtifactId_fkey"
  FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_personMemorialId_fkey"
  FOREIGN KEY ("personMemorialId") REFERENCES "PersonMemorial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_globalVariableId_fkey"
  FOREIGN KEY ("globalVariableId") REFERENCES "GlobalVariable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseEvidence"
  ADD CONSTRAINT "CourtCaseEvidence_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseRemedy"
  ADD CONSTRAINT "CourtCaseRemedy_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourtCaseRemedy"
  ADD CONSTRAINT "CourtCaseRemedy_claimId_fkey"
  FOREIGN KEY ("claimId") REFERENCES "CourtCaseClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseRemedy"
  ADD CONSTRAINT "CourtCaseRemedy_targetPartyId_fkey"
  FOREIGN KEY ("targetPartyId") REFERENCES "CourtCaseParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseRemedy"
  ADD CONSTRAINT "CourtCaseRemedy_enforcementTaskId_fkey"
  FOREIGN KEY ("enforcementTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourtCaseRemedy"
  ADD CONSTRAINT "CourtCaseRemedy_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
