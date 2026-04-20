-- CreateEnum
CREATE TYPE "ReasoningVariantStatus" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'RETIRED', 'FROZEN');

-- CreateEnum
CREATE TYPE "ReasoningVariantSlot" AS ENUM ('HANDOFF', 'CHAIN_NODE', 'OBJECTION_NODE', 'INEVITABILITY', 'REPLICATION_CTA', 'DEEP_CHAIN_NODE', 'TOPOLOGY');

-- CreateEnum
CREATE TYPE "ReasoningRiskTier" AS ENUM ('T1', 'T2', 'T3');

-- CreateEnum
CREATE TYPE "ReasoningBanditLevel" AS ENUM ('GLOBAL', 'LOCALE', 'HOST', 'ORG', 'BUCKET', 'SEGMENT');

-- CreateEnum
CREATE TYPE "ReasoningGeneratorKind" AS ENUM ('HUMAN', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReasoningOutcomeKind" AS ENUM ('SURVEY_STARTED', 'HANDOFF_CLICKED', 'NODE_ADVANCED', 'NODE_EXITED', 'OBJECTION_SHOWN', 'OBJECTION_RESOLVED', 'PROBABILITY_CHANGED', 'VOTE', 'FIRST_SEND_INITIATED', 'FIRST_SEND_CONFIRMED', 'DOWNSTREAM_VOTE', 'DOWNSTREAM_SEND', 'WALK_AWAY');

-- CreateEnum
CREATE TYPE "ReasoningVariantFamily" AS ENUM ('DRY_DATA', 'EMOTIONAL_APPEAL', 'CURIOSITY_MYSTERY', 'SOCIAL_PROOF', 'SELF_INTEREST_ROI', 'MORAL_DUTY', 'ABSURDIST_COMEDY', 'DIRECT_IMPERATIVE');

-- CreateTable
CREATE TABLE "ReasoningVariantSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReasoningVariantStatus" NOT NULL DEFAULT 'DRAFT',
    "parentSetId" TEXT,
    "organizationId" TEXT,
    "allowedSlots" "ReasoningVariantSlot"[],
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "ReasoningVariantSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningVariantArm" (
    "id" TEXT NOT NULL,
    "variantSetId" TEXT NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "slotKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'default',
    "riskTier" "ReasoningRiskTier" NOT NULL DEFAULT 'T1',
    "content" JSONB NOT NULL,
    "status" "ReasoningVariantStatus" NOT NULL DEFAULT 'DRAFT',
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "armKey" TEXT NOT NULL,
    "family" "ReasoningVariantFamily" NOT NULL,
    "noveltyScore" DOUBLE PRECISION,
    "localeKey" TEXT NOT NULL,
    "parentArmId" TEXT,
    "generatorKind" "ReasoningGeneratorKind" NOT NULL DEFAULT 'HUMAN',
    "generationRequestId" TEXT,
    "fraudLineageFlagged" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "validatorVersion" TEXT,
    "validatorViolations" JSONB,
    "shadowGatePassed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningVariantArm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningAssignmentRule" (
    "id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "hostKey" TEXT,
    "organizationId" TEXT,
    "relationshipBucket" TEXT,
    "audienceTag" TEXT,
    "referralSource" TEXT,
    "device" TEXT,
    "chainDepth" TEXT,
    "localeKey" TEXT,
    "surface" TEXT,
    "variantSetId" TEXT NOT NULL,
    "isPin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "ReasoningAssignmentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningBanditPolicyState" (
    "id" TEXT NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "level" "ReasoningBanditLevel" NOT NULL,
    "segmentKey" TEXT NOT NULL,
    "armPosteriors" JSONB NOT NULL,
    "exposureCount" INTEGER NOT NULL DEFAULT 0,
    "explorationRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningBanditPolicyState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningVariantExposure" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "policyDecisionId" TEXT NOT NULL,
    "variantSetId" TEXT NOT NULL,
    "variantArmId" TEXT,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "isControlHoldout" BOOLEAN NOT NULL DEFAULT false,
    "holdoutResolutionLevel" "ReasoningBanditLevel",
    "orgContextVerified" BOOLEAN NOT NULL DEFAULT false,
    "surface" TEXT NOT NULL DEFAULT 'hosted',
    "localeKey" TEXT NOT NULL,
    "hostKey" TEXT NOT NULL,
    "organizationId" TEXT,
    "relationshipBucket" TEXT,
    "referralSource" TEXT,
    "device" TEXT,
    "chainDepth" TEXT NOT NULL,
    "returningVsFirst" TEXT,
    "referredByUserId" TEXT,
    "shareAttemptId" TEXT,
    "exposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningVariantExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningOutcomeRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "variantSetId" TEXT NOT NULL,
    "variantArmId" TEXT,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "outcomeKind" "ReasoningOutcomeKind" NOT NULL,
    "value" DOUBLE PRECISION,
    "rewardWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "chainValueContribution" DOUBLE PRECISION,
    "fraudPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "qualityPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "verifiedHumanWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "localeKey" TEXT NOT NULL,
    "surface" TEXT NOT NULL DEFAULT 'hosted',
    "channel" TEXT,
    "hostKey" TEXT NOT NULL,
    "organizationId" TEXT,
    "audienceTag" TEXT,
    "relationshipBucket" TEXT,
    "referredByUserId" TEXT,
    "policyDecisionId" TEXT,
    "isControlHoldout" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningOutcomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningHoldoutComparison" (
    "id" TEXT NOT NULL,
    "armId" TEXT NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "segmentKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "armChainValueMean" DOUBLE PRECISION NOT NULL,
    "armChainValueVar" DOUBLE PRECISION NOT NULL,
    "armExposures" INTEGER NOT NULL,
    "canonicalChainValueMean" DOUBLE PRECISION NOT NULL,
    "canonicalChainValueVar" DOUBLE PRECISION NOT NULL,
    "canonicalExposures" INTEGER NOT NULL,
    "liftPointEstimate" DOUBLE PRECISION NOT NULL,
    "liftCiLower" DOUBLE PRECISION NOT NULL,
    "liftCiUpper" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningHoldoutComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningFraudPattern" (
    "id" TEXT NOT NULL,
    "patternKind" TEXT NOT NULL,
    "pattern" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningFraudPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningFraudFinding" (
    "id" TEXT NOT NULL,
    "exposureId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "patternId" TEXT,
    "findingKind" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "details" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningFraudFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningOrgFork" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "variantSetId" TEXT NOT NULL,
    "allowedSlots" "ReasoningVariantSlot"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "ReasoningOrgFork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningGenerationRequest" (
    "id" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "kind" "ReasoningGeneratorKind" NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "slotKey" TEXT NOT NULL,
    "targetVariantSetId" TEXT NOT NULL,
    "referenceArmIds" TEXT[],
    "toneProfile" TEXT,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateArmIds" TEXT[],

    CONSTRAINT "ReasoningGenerationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningPromotionDecision" (
    "id" TEXT NOT NULL,
    "armId" TEXT NOT NULL,
    "fromStatus" "ReasoningVariantStatus" NOT NULL,
    "toStatus" "ReasoningVariantStatus" NOT NULL,
    "tier" "ReasoningRiskTier" NOT NULL,
    "actorKind" "ReasoningGeneratorKind" NOT NULL,
    "actorUserId" TEXT,
    "chainValueEvidence" JSONB NOT NULL,
    "fraudEvidence" JSONB NOT NULL,
    "rGuardSnapshot" JSONB NOT NULL,
    "chainValueGuardSnapshot" JSONB NOT NULL,
    "topologyGateState" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningPromotionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningBlacklistRule" (
    "id" TEXT NOT NULL,
    "scope" "ReasoningVariantSlot",
    "patternKind" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReasoningBlacklistRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningTopologyVariant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grammarPatch" JSONB NOT NULL,
    "riskTier" "ReasoningRiskTier" NOT NULL,
    "status" "ReasoningVariantStatus" NOT NULL DEFAULT 'DRAFT',
    "activationGateRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningTopologyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningRGuardSnapshot" (
    "id" TEXT NOT NULL,
    "rSevenDay" DOUBLE PRECISION NOT NULL,
    "components" JSONB NOT NULL,
    "triggeredRevert" BOOLEAN NOT NULL DEFAULT false,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningRGuardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningChainValueGuardSnapshot" (
    "id" TEXT NOT NULL,
    "globalChainValueMean" DOUBLE PRECISION NOT NULL,
    "canonicalHoldoutChainValueMean" DOUBLE PRECISION NOT NULL,
    "deltaPct" DOUBLE PRECISION NOT NULL,
    "triggeredRevert" BOOLEAN NOT NULL DEFAULT false,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningChainValueGuardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningSystemState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "topologyGateOpen" BOOLEAN NOT NULL DEFAULT false,
    "promoterFrozen" BOOLEAN NOT NULL DEFAULT false,
    "allocatorForceCanonical" BOOLEAN NOT NULL DEFAULT false,
    "lastFreezeReason" TEXT,
    "lastFreezeAt" TIMESTAMP(3),
    "lastUnfreezeAt" TIMESTAMP(3),
    "lastUnfreezeByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningSystemState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningShadowEvaluation" (
    "id" TEXT NOT NULL,
    "armId" TEXT NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "segmentKey" TEXT NOT NULL,
    "estimator" TEXT NOT NULL,
    "shadowChainValueMean" DOUBLE PRECISION NOT NULL,
    "shadowChainValueCiLower" DOUBLE PRECISION NOT NULL,
    "shadowChainValueCiUpper" DOUBLE PRECISION NOT NULL,
    "canonicalBaselineMean" DOUBLE PRECISION NOT NULL,
    "propensityOverlap" DOUBLE PRECISION NOT NULL,
    "evaluatedOnExposures" INTEGER NOT NULL,
    "gateDecision" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningShadowEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningDiversitySnapshot" (
    "id" TEXT NOT NULL,
    "slot" "ReasoningVariantSlot" NOT NULL,
    "segmentKey" TEXT NOT NULL,
    "familyDistribution" JSONB NOT NULL,
    "shannonEntropy" DOUBLE PRECISION NOT NULL,
    "activeFamilyCount" INTEGER NOT NULL,
    "alertLevel" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningDiversitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningLocaleConfig" (
    "id" TEXT NOT NULL,
    "localeKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "fallbackChain" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bannedPhrases" JSONB NOT NULL DEFAULT '[]',
    "fraudBaselines" JSONB NOT NULL DEFAULT '{}',
    "generatorQuota" JSONB NOT NULL DEFAULT '{}',
    "reviewerUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audienceEstimate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "ReasoningLocaleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningDistributionPolicyState" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "localeKey" TEXT,
    "channel" TEXT,
    "surface" TEXT,
    "generationBudgetWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "explorationRateMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "onboardingPriority" DOUBLE PRECISION,
    "currentYield" DOUBLE PRECISION,
    "currentSupply" INTEGER,
    "marginalYieldEstimate" DOUBLE PRECISION,
    "effortSpent" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningDistributionPolicyState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningDistributionSliceSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "localeKey" TEXT,
    "channel" TEXT,
    "surface" TEXT,
    "yield" DOUBLE PRECISION NOT NULL,
    "supply" INTEGER NOT NULL,
    "ceilingEstimate" DOUBLE PRECISION,
    "marginalYield" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReasoningDistributionSliceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningOrganizationDomain" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "surfaceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trustedParentDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cspAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tlsVerified" BOOLEAN NOT NULL DEFAULT false,
    "cnameVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningOrganizationDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningDistributionTarget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "localeKey" TEXT,
    "channel" TEXT,
    "surface" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "ceilingEstimate" DOUBLE PRECISION NOT NULL,
    "liveStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningDistributionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReasoningBundleVariant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "armBindings" JSONB NOT NULL,
    "status" "ReasoningVariantStatus" NOT NULL DEFAULT 'DRAFT',
    "riskTier" "ReasoningRiskTier" NOT NULL DEFAULT 'T2',
    "exposures" INTEGER NOT NULL DEFAULT 0,
    "chainValueSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chainValueSumSq" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activationGateRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReasoningBundleVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningVariantSet_name_key" ON "ReasoningVariantSet"("name");

-- CreateIndex
CREATE INDEX "ReasoningVariantSet_status_idx" ON "ReasoningVariantSet"("status");

-- CreateIndex
CREATE INDEX "ReasoningVariantSet_organizationId_idx" ON "ReasoningVariantSet"("organizationId");

-- CreateIndex
CREATE INDEX "ReasoningVariantArm_variantSetId_slotKey_channel_localeKey__idx" ON "ReasoningVariantArm"("variantSetId", "slotKey", "channel", "localeKey", "status");

-- CreateIndex
CREATE INDEX "ReasoningVariantArm_slot_family_status_idx" ON "ReasoningVariantArm"("slot", "family", "status");

-- CreateIndex
CREATE INDEX "ReasoningVariantArm_localeKey_slot_status_idx" ON "ReasoningVariantArm"("localeKey", "slot", "status");

-- CreateIndex
CREATE INDEX "ReasoningVariantArm_fraudLineageFlagged_idx" ON "ReasoningVariantArm"("fraudLineageFlagged");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningVariantArm_variantSetId_slotKey_channel_localeKey__key" ON "ReasoningVariantArm"("variantSetId", "slotKey", "channel", "localeKey", "armKey");

-- CreateIndex
CREATE INDEX "ReasoningAssignmentRule_active_priority_idx" ON "ReasoningAssignmentRule"("active", "priority");

-- CreateIndex
CREATE INDEX "ReasoningAssignmentRule_variantSetId_idx" ON "ReasoningAssignmentRule"("variantSetId");

-- CreateIndex
CREATE INDEX "ReasoningBanditPolicyState_slot_level_idx" ON "ReasoningBanditPolicyState"("slot", "level");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningBanditPolicyState_slot_level_segmentKey_key" ON "ReasoningBanditPolicyState"("slot", "level", "segmentKey");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_sessionId_exposedAt_idx" ON "ReasoningVariantExposure"("sessionId", "exposedAt");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_variantArmId_exposedAt_idx" ON "ReasoningVariantExposure"("variantArmId", "exposedAt");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_referredByUserId_idx" ON "ReasoningVariantExposure"("referredByUserId");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_policyDecisionId_idx" ON "ReasoningVariantExposure"("policyDecisionId");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_isControlHoldout_variantSetId_idx" ON "ReasoningVariantExposure"("isControlHoldout", "variantSetId");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_isControlHoldout_holdoutResolution_idx" ON "ReasoningVariantExposure"("isControlHoldout", "holdoutResolutionLevel");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_localeKey_variantSetId_exposedAt_idx" ON "ReasoningVariantExposure"("localeKey", "variantSetId", "exposedAt");

-- CreateIndex
CREATE INDEX "ReasoningVariantExposure_surface_variantSetId_exposedAt_idx" ON "ReasoningVariantExposure"("surface", "variantSetId", "exposedAt");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_variantArmId_slot_outcomeKind_record_idx" ON "ReasoningOutcomeRecord"("variantArmId", "slot", "outcomeKind", "recordedAt");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_referredByUserId_idx" ON "ReasoningOutcomeRecord"("referredByUserId");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_isControlHoldout_variantSetId_record_idx" ON "ReasoningOutcomeRecord"("isControlHoldout", "variantSetId", "recordedAt");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_localeKey_variantSetId_outcomeKind_r_idx" ON "ReasoningOutcomeRecord"("localeKey", "variantSetId", "outcomeKind", "recordedAt");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_organizationId_localeKey_recordedAt_idx" ON "ReasoningOutcomeRecord"("organizationId", "localeKey", "recordedAt");

-- CreateIndex
CREATE INDEX "ReasoningOutcomeRecord_surface_channel_localeKey_recordedAt_idx" ON "ReasoningOutcomeRecord"("surface", "channel", "localeKey", "recordedAt");

-- CreateIndex
CREATE INDEX "ReasoningHoldoutComparison_armId_computedAt_idx" ON "ReasoningHoldoutComparison"("armId", "computedAt");

-- CreateIndex
CREATE INDEX "ReasoningHoldoutComparison_slot_segmentKey_computedAt_idx" ON "ReasoningHoldoutComparison"("slot", "segmentKey", "computedAt");

-- CreateIndex
CREATE INDEX "ReasoningFraudPattern_approved_idx" ON "ReasoningFraudPattern"("approved");

-- CreateIndex
CREATE INDEX "ReasoningFraudFinding_sessionId_idx" ON "ReasoningFraudFinding"("sessionId");

-- CreateIndex
CREATE INDEX "ReasoningFraudFinding_userId_idx" ON "ReasoningFraudFinding"("userId");

-- CreateIndex
CREATE INDEX "ReasoningFraudFinding_patternId_idx" ON "ReasoningFraudFinding"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningOrgFork_organizationId_key" ON "ReasoningOrgFork"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningOrgFork_variantSetId_key" ON "ReasoningOrgFork"("variantSetId");

-- CreateIndex
CREATE INDEX "ReasoningPromotionDecision_armId_decidedAt_idx" ON "ReasoningPromotionDecision"("armId", "decidedAt");

-- CreateIndex
CREATE INDEX "ReasoningBlacklistRule_active_scope_idx" ON "ReasoningBlacklistRule"("active", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningTopologyVariant_name_key" ON "ReasoningTopologyVariant"("name");

-- CreateIndex
CREATE INDEX "ReasoningRGuardSnapshot_snapshotAt_idx" ON "ReasoningRGuardSnapshot"("snapshotAt");

-- CreateIndex
CREATE INDEX "ReasoningChainValueGuardSnapshot_snapshotAt_idx" ON "ReasoningChainValueGuardSnapshot"("snapshotAt");

-- CreateIndex
CREATE INDEX "ReasoningShadowEvaluation_armId_computedAt_idx" ON "ReasoningShadowEvaluation"("armId", "computedAt");

-- CreateIndex
CREATE INDEX "ReasoningShadowEvaluation_gateDecision_idx" ON "ReasoningShadowEvaluation"("gateDecision");

-- CreateIndex
CREATE INDEX "ReasoningDiversitySnapshot_slot_segmentKey_computedAt_idx" ON "ReasoningDiversitySnapshot"("slot", "segmentKey", "computedAt");

-- CreateIndex
CREATE INDEX "ReasoningDiversitySnapshot_alertLevel_computedAt_idx" ON "ReasoningDiversitySnapshot"("alertLevel", "computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningLocaleConfig_localeKey_key" ON "ReasoningLocaleConfig"("localeKey");

-- CreateIndex
CREATE INDEX "ReasoningDistributionPolicyState_onboardingPriority_idx" ON "ReasoningDistributionPolicyState"("onboardingPriority");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningDistributionPolicyState_organizationId_localeKey_c_key" ON "ReasoningDistributionPolicyState"("organizationId", "localeKey", "channel", "surface");

-- CreateIndex
CREATE INDEX "ReasoningDistributionSliceSnapshot_organizationId_localeKey_idx" ON "ReasoningDistributionSliceSnapshot"("organizationId", "localeKey", "channel", "surface", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningOrganizationDomain_host_key" ON "ReasoningOrganizationDomain"("host");

-- CreateIndex
CREATE INDEX "ReasoningOrganizationDomain_organizationId_idx" ON "ReasoningOrganizationDomain"("organizationId");

-- CreateIndex
CREATE INDEX "ReasoningOrganizationDomain_status_idx" ON "ReasoningOrganizationDomain"("status");

-- CreateIndex
CREATE INDEX "ReasoningDistributionTarget_enabled_liveStatus_idx" ON "ReasoningDistributionTarget"("enabled", "liveStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningDistributionTarget_organizationId_localeKey_channe_key" ON "ReasoningDistributionTarget"("organizationId", "localeKey", "channel", "surface");

-- CreateIndex
CREATE UNIQUE INDEX "ReasoningBundleVariant_name_key" ON "ReasoningBundleVariant"("name");

-- CreateIndex
CREATE INDEX "ReasoningBundleVariant_status_riskTier_idx" ON "ReasoningBundleVariant"("status", "riskTier");

-- AddForeignKey
ALTER TABLE "ReasoningVariantSet" ADD CONSTRAINT "ReasoningVariantSet_parentSetId_fkey" FOREIGN KEY ("parentSetId") REFERENCES "ReasoningVariantSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningVariantArm" ADD CONSTRAINT "ReasoningVariantArm_variantSetId_fkey" FOREIGN KEY ("variantSetId") REFERENCES "ReasoningVariantSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningVariantArm" ADD CONSTRAINT "ReasoningVariantArm_parentArmId_fkey" FOREIGN KEY ("parentArmId") REFERENCES "ReasoningVariantArm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningVariantArm" ADD CONSTRAINT "ReasoningVariantArm_generationRequestId_fkey" FOREIGN KEY ("generationRequestId") REFERENCES "ReasoningGenerationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningAssignmentRule" ADD CONSTRAINT "ReasoningAssignmentRule_variantSetId_fkey" FOREIGN KEY ("variantSetId") REFERENCES "ReasoningVariantSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningFraudFinding" ADD CONSTRAINT "ReasoningFraudFinding_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "ReasoningFraudPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningOrgFork" ADD CONSTRAINT "ReasoningOrgFork_variantSetId_fkey" FOREIGN KEY ("variantSetId") REFERENCES "ReasoningVariantSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReasoningShadowEvaluation" ADD CONSTRAINT "ReasoningShadowEvaluation_armId_fkey" FOREIGN KEY ("armId") REFERENCES "ReasoningVariantArm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
