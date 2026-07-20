-- Remove the unused campaign-specific persuasion optimizer and its legacy data.
-- Every table is named explicitly so external dependencies fail this migration.
DROP TABLE
  "ReasoningBundleVariant",
  "ReasoningDistributionTarget",
  "ReasoningOrganizationDomain",
  "ReasoningDistributionSliceSnapshot",
  "ReasoningDistributionPolicyState",
  "ReasoningLocaleConfig",
  "ReasoningDiversitySnapshot",
  "ReasoningShadowEvaluation",
  "ReasoningSystemState",
  "ReasoningChainValueGuardSnapshot",
  "ReasoningRGuardSnapshot",
  "ReasoningTopologyVariant",
  "ReasoningBlacklistRule",
  "ReasoningPromotionDecision",
  "ReasoningGenerationRequest",
  "ReasoningOrgFork",
  "ReasoningFraudFinding",
  "ReasoningFraudPattern",
  "ReasoningHoldoutComparison",
  "ReasoningOutcomeRecord",
  "ReasoningVariantExposure",
  "ReasoningBanditPolicyState",
  "ReasoningAssignmentRule",
  "ReasoningVariantArm",
  "ReasoningVariantSet";

DROP TYPE "ReasoningVariantFamily";
DROP TYPE "ReasoningOutcomeKind";
DROP TYPE "ReasoningGeneratorKind";
DROP TYPE "ReasoningBanditLevel";
DROP TYPE "ReasoningRiskTier";
DROP TYPE "ReasoningVariantSlot";
DROP TYPE "ReasoningVariantStatus";
