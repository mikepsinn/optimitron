-- CreateEnum
CREATE TYPE "ParameterSourceType" AS ENUM ('EXTERNAL', 'CALCULATED', 'DEFINITION', 'AI_ESTIMATED', 'CURATED');
CREATE TYPE "ParameterDistributionType" AS ENUM ('FIXED', 'NORMAL', 'LOGNORMAL', 'BETA', 'GAMMA', 'TRIANGULAR', 'UNIFORM');
CREATE TYPE "ModelRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED', 'REJECTED');

-- ExtendEnum
ALTER TYPE "SourceArtifactType" ADD VALUE IF NOT EXISTS 'CALCULATION_SOURCE';

-- CreateTable
CREATE TABLE "ParameterDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "currentRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ParameterDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParameterRevision" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "ModelRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "value" DOUBLE PRECISION NOT NULL,
    "manualRef" TEXT,
    "sourceRef" TEXT,
    "sourceType" "ParameterSourceType" NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "formulaText" TEXT,
    "formulaLatex" TEXT,
    "calculationCode" TEXT,
    "calculationLanguage" TEXT,
    "confidence" TEXT NOT NULL,
    "sourceLastUpdated" TEXT,
    "peerReviewed" BOOLEAN NOT NULL DEFAULT false,
    "conservative" BOOLEAN NOT NULL DEFAULT false,
    "sensitivity" DOUBLE PRECISION,
    "displayValue" TEXT,
    "displayName" TEXT,
    "validationMin" DOUBLE PRECISION,
    "validationMax" DOUBLE PRECISION,
    "confidenceIntervalLow" DOUBLE PRECISION,
    "confidenceIntervalHigh" DOUBLE PRECISION,
    "stdError" DOUBLE PRECISION,
    "distributionType" "ParameterDistributionType",
    "distributionParametersJson" JSONB,
    "latexSymbol" TEXT,
    "summaryStatsJson" JSONB,
    "sourceContentHash" TEXT NOT NULL,
    "rationale" TEXT,
    "assumptionsJson" JSONB,
    "proposedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ParameterRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ParameterRevision_finite_bounds_check" CHECK (
      ("validationMin" IS NULL OR "validationMax" IS NULL OR "validationMin" <= "validationMax") AND
      ("confidenceIntervalLow" IS NULL OR "confidenceIntervalHigh" IS NULL OR "confidenceIntervalLow" <= "confidenceIntervalHigh")
    ),
    CONSTRAINT "ParameterRevision_finite_values_check" CHECK (
      "value" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION) AND
      ("sensitivity" IS NULL OR "sensitivity" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION)) AND
      ("validationMin" IS NULL OR "validationMin" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION)) AND
      ("validationMax" IS NULL OR "validationMax" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION)) AND
      ("confidenceIntervalLow" IS NULL OR "confidenceIntervalLow" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION)) AND
      ("confidenceIntervalHigh" IS NULL OR "confidenceIntervalHigh" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION)) AND
      ("stdError" IS NULL OR (
        "stdError" NOT IN ('NaN'::DOUBLE PRECISION, 'Infinity'::DOUBLE PRECISION, '-Infinity'::DOUBLE PRECISION) AND
        "stdError" >= 0
      ))
    ),
    CONSTRAINT "ParameterRevision_value_bounds_check" CHECK (
      ("validationMin" IS NULL OR "value" >= "validationMin") AND
      ("validationMax" IS NULL OR "value" <= "validationMax") AND
      ("confidenceIntervalLow" IS NULL OR "value" >= "confidenceIntervalLow") AND
      ("confidenceIntervalHigh" IS NULL OR "value" <= "confidenceIntervalHigh")
    )
);

CREATE TABLE "ParameterRevisionInput" (
    "id" TEXT NOT NULL,
    "calculatedRevisionId" TEXT NOT NULL,
    "inputRevisionId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ParameterRevisionInput_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ParameterRevisionInput_position_check" CHECK ("position" >= 0)
);

CREATE TABLE "ParameterRevisionSourceArtifact" (
    "id" TEXT NOT NULL,
    "parameterRevisionId" TEXT NOT NULL,
    "sourceArtifactId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ParameterRevisionSourceArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskImpactEstimateInput" (
    "id" TEXT NOT NULL,
    "taskImpactEstimateSetId" TEXT NOT NULL,
    "parameterRevisionId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TaskImpactEstimateInput_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TaskImpactEstimateInput_position_check" CHECK ("position" >= 0)
);

-- AlterTable
ALTER TABLE "TaskImpactEstimateSet"
  ADD COLUMN "formulaText" TEXT,
  ADD COLUMN "formulaLatex" TEXT,
  ADD COLUMN "calculationCode" TEXT,
  ADD COLUMN "calculationLanguage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ParameterDefinition_currentRevisionId_key" ON "ParameterDefinition"("currentRevisionId");
CREATE UNIQUE INDEX "ParameterDefinition_key_key" ON "ParameterDefinition"("key");
CREATE INDEX "ParameterDefinition_deletedAt_idx" ON "ParameterDefinition"("deletedAt");
CREATE UNIQUE INDEX "ParameterRevision_parameterId_revision_key" ON "ParameterRevision"("parameterId", "revision");
CREATE UNIQUE INDEX "ParameterRevision_parameterId_sourceContentHash_key" ON "ParameterRevision"("parameterId", "sourceContentHash");
CREATE INDEX "ParameterRevision_parameterId_status_idx" ON "ParameterRevision"("parameterId", "status");
CREATE INDEX "ParameterRevision_sourceRef_idx" ON "ParameterRevision"("sourceRef");
CREATE INDEX "ParameterRevision_sourceType_idx" ON "ParameterRevision"("sourceType");
CREATE INDEX "ParameterRevision_deletedAt_idx" ON "ParameterRevision"("deletedAt");
CREATE UNIQUE INDEX "ParameterRevisionInput_calculatedRevisionId_symbol_key" ON "ParameterRevisionInput"("calculatedRevisionId", "symbol");
CREATE UNIQUE INDEX "ParameterRevisionInput_calculatedRevisionId_position_key" ON "ParameterRevisionInput"("calculatedRevisionId", "position");
CREATE INDEX "ParameterRevisionInput_inputRevisionId_idx" ON "ParameterRevisionInput"("inputRevisionId");
CREATE INDEX "ParameterRevisionInput_deletedAt_idx" ON "ParameterRevisionInput"("deletedAt");
CREATE UNIQUE INDEX "ParameterRevisionSourceArtifact_parameterRevisionId_sourceA_key" ON "ParameterRevisionSourceArtifact"("parameterRevisionId", "sourceArtifactId");
CREATE INDEX "ParameterRevisionSourceArtifact_sourceArtifactId_idx" ON "ParameterRevisionSourceArtifact"("sourceArtifactId");
CREATE INDEX "ParameterRevisionSourceArtifact_deletedAt_idx" ON "ParameterRevisionSourceArtifact"("deletedAt");
CREATE UNIQUE INDEX "TaskImpactEstimateInput_taskImpactEstimateSetId_symbol_key" ON "TaskImpactEstimateInput"("taskImpactEstimateSetId", "symbol");
CREATE UNIQUE INDEX "TaskImpactEstimateInput_taskImpactEstimateSetId_position_key" ON "TaskImpactEstimateInput"("taskImpactEstimateSetId", "position");
CREATE INDEX "TaskImpactEstimateInput_parameterRevisionId_idx" ON "TaskImpactEstimateInput"("parameterRevisionId");
CREATE INDEX "TaskImpactEstimateInput_deletedAt_idx" ON "TaskImpactEstimateInput"("deletedAt");

-- AddForeignKey
ALTER TABLE "ParameterDefinition" ADD CONSTRAINT "ParameterDefinition_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParameterRevision" ADD CONSTRAINT "ParameterRevision_parameterId_fkey" FOREIGN KEY ("parameterId") REFERENCES "ParameterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParameterRevision" ADD CONSTRAINT "ParameterRevision_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParameterRevision" ADD CONSTRAINT "ParameterRevision_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParameterDefinition" ADD CONSTRAINT "ParameterDefinition_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "ParameterRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParameterRevisionInput" ADD CONSTRAINT "ParameterRevisionInput_calculatedRevisionId_fkey" FOREIGN KEY ("calculatedRevisionId") REFERENCES "ParameterRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParameterRevisionInput" ADD CONSTRAINT "ParameterRevisionInput_inputRevisionId_fkey" FOREIGN KEY ("inputRevisionId") REFERENCES "ParameterRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ParameterRevisionSourceArtifact" ADD CONSTRAINT "ParameterRevisionSourceArtifact_parameterRevisionId_fkey" FOREIGN KEY ("parameterRevisionId") REFERENCES "ParameterRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParameterRevisionSourceArtifact" ADD CONSTRAINT "ParameterRevisionSourceArtifact_sourceArtifactId_fkey" FOREIGN KEY ("sourceArtifactId") REFERENCES "SourceArtifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskImpactEstimateInput" ADD CONSTRAINT "TaskImpactEstimateInput_taskImpactEstimateSetId_fkey" FOREIGN KEY ("taskImpactEstimateSetId") REFERENCES "TaskImpactEstimateSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskImpactEstimateInput" ADD CONSTRAINT "TaskImpactEstimateInput_parameterRevisionId_fkey" FOREIGN KEY ("parameterRevisionId") REFERENCES "ParameterRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
