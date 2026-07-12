import type {
  Policy,
  PolicyRecommendation,
  PolicyReportJSON,
  PolicyReportPolicy,
} from "@optimitron/opg";
import type {
  BudgetReportCategory,
  BudgetReportJSON,
} from "@optimitron/obg";
import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db";

export interface ImportedSourceArtifactDraft {
  artifactType: SourceArtifactType;
  contentHash: string | null;
  externalKey: string | null;
  payloadJson: Record<string, unknown>;
  sourceKey: string;
  sourceRef: string | null;
  sourceSystem: SourceSystem;
  sourceUrl: string | null;
  title: string | null;
  versionKey: string | null;
}

export interface ImportedImpactMetricDraft {
  baseValue: number | null;
  displayGroup: string | null;
  highValue: number | null;
  lowValue: number | null;
  metadataJson: Record<string, unknown> | null;
  metricKey: string;
  summaryStatsJson: Record<string, unknown> | null;
  unit: string;
  valueJson: unknown;
}

export interface ImportedImpactFrameDraft {
  annualDiscountRate: number;
  adoptionRampYears: number;
  benefitDurationYears: number;
  customFrameLabel: string | null;
  delayDalysLostPerDayBase: number | null;
  delayDalysLostPerDayHigh: number | null;
  delayDalysLostPerDayLow: number | null;
  delayEconomicValueUsdLostPerDayBase: number | null;
  delayEconomicValueUsdLostPerDayHigh: number | null;
  delayEconomicValueUsdLostPerDayLow: number | null;
  estimatedCashCostUsdBase: number | null;
  estimatedCashCostUsdHigh: number | null;
  estimatedCashCostUsdLow: number | null;
  estimatedEffortHoursBase: number | null;
  estimatedEffortHoursHigh: number | null;
  estimatedEffortHoursLow: number | null;
  evaluationHorizonYears: number;
  expectedDalysAvertedBase: number | null;
  expectedDalysAvertedHigh: number | null;
  expectedDalysAvertedLow: number | null;
  expectedEconomicValueUsdBase: number | null;
  expectedEconomicValueUsdHigh: number | null;
  expectedEconomicValueUsdLow: number | null;
  frameKey: TaskImpactFrameKey;
  frameSlug: string;
  medianHealthyLifeYearsEffectBase: number | null;
  medianHealthyLifeYearsEffectHigh: number | null;
  medianHealthyLifeYearsEffectLow: number | null;
  medianIncomeGrowthEffectPpPerYearBase: number | null;
  medianIncomeGrowthEffectPpPerYearHigh: number | null;
  medianIncomeGrowthEffectPpPerYearLow: number | null;
  metrics: ImportedImpactMetricDraft[];
  successProbabilityBase: number | null;
  successProbabilityHigh: number | null;
  successProbabilityLow: number | null;
  summaryStatsJson: Record<string, unknown> | null;
  timeToImpactStartDays: number;
}

export interface ImportedImpactEstimateDraft {
  assumptionsJson: Record<string, unknown>;
  calculationVersion: string;
  counterfactualKey: string;
  estimateKind: TaskImpactEstimateKind;
  frames: ImportedImpactFrameDraft[];
  methodologyKey: string;
  parameterSetHash: string;
  publicationStatus: TaskImpactPublicationStatus;
  sourceSystem: SourceSystem;
}

export interface ImportedTaskDraft {
  assigneeAffiliationSnapshot: string | null;
  assigneeOrganizationName: string | null;
  assigneeOrganizationSourceRef: string | null;
  assigneeOrganizationType: OrgType | null;
  category: TaskCategory;
  claimPolicy: TaskClaimPolicy;
  contextJson: Record<string, unknown>;
  description: string;
  dueAt: Date | null;
  contactLabel: string | null;
  contactTemplate: string | null;
  contactUrl: string | null;
  estimatedEffortHours: number | null;
  impactStatement: string | null;
  interestTags: string[];
  roleTitle: string | null;
  skillTags: string[];
  status: TaskStatus;
  taskKey: string;
  title: string;
}

export interface ImportedTaskBundle {
  impactEstimate: ImportedImpactEstimateDraft;
  sourceArtifacts: ImportedSourceArtifactDraft[];
  task: ImportedTaskDraft;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function numericMetric(
  metricKey: string,
  unit: string,
  baseValue: number | null,
  options?: {
    displayGroup?: string | null;
    highValue?: number | null;
    lowValue?: number | null;
  },
): ImportedImpactMetricDraft {
  return {
    baseValue,
    displayGroup: options?.displayGroup ?? null,
    highValue: options?.highValue ?? null,
    lowValue: options?.lowValue ?? null,
    metadataJson: null,
    metricKey,
    summaryStatsJson: null,
    unit,
    valueJson: null,
  };
}

function categoricalMetric(
  metricKey: string,
  unit: string,
  valueJson: unknown,
  displayGroup: string,
): ImportedImpactMetricDraft {
  return {
    baseValue: null,
    displayGroup,
    highValue: null,
    lowValue: null,
    metadataJson: null,
    metricKey,
    summaryStatsJson: null,
    unit,
    valueJson,
  };
}

export function buildOpgRecommendationTaskBundle(input: {
  policy?: Policy | null;
  policyReport?: PolicyReportJSON | null;
  reportPolicy?: PolicyReportPolicy | null;
  recommendation: PolicyRecommendation;
}) {
  const { policy, policyReport, recommendation, reportPolicy } = input;
  const policyName = policy?.name ?? reportPolicy?.name ?? recommendation.policyId;
  const policyType = policy?.type ?? reportPolicy?.type ?? "policy";
  const recommendationTarget = recommendation.recommendedTarget ?? reportPolicy?.recommendedTarget ?? null;
  const reportArtifactKey = policyReport
    ? `opg:report:${slugify(policyReport.jurisdiction)}:${slugify(policyName)}:${slugify(policyReport.generatedAt)}`
    : null;

  return {
    impactEstimate: {
      assumptionsJson: {
        generatedFrom: "opg-policy-recommendation",
        jurisdictionId: recommendation.jurisdictionId,
        policyId: recommendation.policyId,
      },
      calculationVersion: "opg-import-v1",
      counterfactualKey: "current-policy-baseline",
      estimateKind: TaskImpactEstimateKind.FORECAST,
      frames: [
        {
          annualDiscountRate: 0.03,
          adoptionRampYears: 1,
          benefitDurationYears: policy?.typicalDurationYears ?? 20,
          customFrameLabel: null,
          delayDalysLostPerDayBase: null,
          delayDalysLostPerDayHigh: null,
          delayDalysLostPerDayLow: null,
          delayEconomicValueUsdLostPerDayBase: null,
          delayEconomicValueUsdLostPerDayHigh: null,
          delayEconomicValueUsdLostPerDayLow: null,
          estimatedCashCostUsdBase: null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: null,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 20,
          expectedDalysAvertedBase: null,
          expectedDalysAvertedHigh: null,
          expectedDalysAvertedLow: null,
          expectedEconomicValueUsdBase: null,
          expectedEconomicValueUsdHigh: null,
          expectedEconomicValueUsdLow: null,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          medianHealthyLifeYearsEffectBase: recommendation.welfareEffect.healthEffect,
          medianHealthyLifeYearsEffectHigh:
            recommendation.welfareEffect.healthEffectCIHigh ?? null,
          medianHealthyLifeYearsEffectLow:
            recommendation.welfareEffect.healthEffectCILow ?? null,
          medianIncomeGrowthEffectPpPerYearBase:
            recommendation.welfareEffect.incomeEffect,
          medianIncomeGrowthEffectPpPerYearHigh:
            recommendation.welfareEffect.incomeEffectCIHigh ?? null,
          medianIncomeGrowthEffectPpPerYearLow:
            recommendation.welfareEffect.incomeEffectCILow ?? null,
          metrics: [
            numericMetric(
              "opg_policy_impact_score",
              "score",
              recommendation.policyImpactScore,
              { displayGroup: "opg" },
            ),
            numericMetric(
              "opg_priority_score",
              "score",
              recommendation.priorityScore,
              { displayGroup: "opg" },
            ),
            categoricalMetric(
              "opg_evidence_grade",
              "grade",
              recommendation.evidenceGrade,
              "opg",
            ),
            categoricalMetric(
              "opg_recommendation_type",
              "recommendation",
              recommendation.recommendationType,
              "opg",
            ),
            numericMetric(
              "opg_causal_confidence_score",
              "score",
              reportPolicy?.causalConfidenceScore ?? null,
              { displayGroup: "opg" },
            ),
          ],
          successProbabilityBase: null,
          successProbabilityHigh: null,
          successProbabilityLow: null,
          summaryStatsJson: null,
          timeToImpactStartDays: policy?.typicalOnsetDelayDays ?? 365,
        },
      ],
      methodologyKey: "opg-policy-recommendation",
      parameterSetHash: "opg-unparameterized",
      publicationStatus: TaskImpactPublicationStatus.REVIEWED,
      sourceSystem: SourceSystem.OPG,
    },
    sourceArtifacts: [
      {
        artifactType: SourceArtifactType.OPG_POLICY_RECOMMENDATION,
        contentHash: null,
        externalKey: recommendation.policyId,
        payloadJson: {
          jurisdictionId: recommendation.jurisdictionId,
          policyId: recommendation.policyId,
          recommendation,
        },
        sourceKey: `opg:recommendation:${recommendation.jurisdictionId}:${recommendation.policyId}`,
        sourceRef: recommendation.policyId,
        sourceSystem: SourceSystem.OPG,
        sourceUrl: null,
        title: `${policyName} recommendation`,
        versionKey: null,
      },
      ...(policyReport
        ? [
            {
              artifactType: SourceArtifactType.OPG_POLICY_REPORT,
              contentHash: null,
              externalKey: policyName,
              payloadJson: {
                generatedAt: policyReport.generatedAt,
                jurisdiction: policyReport.jurisdiction,
                reportPolicy,
              },
              sourceKey: reportArtifactKey!,
              sourceRef: slugify(policyReport.jurisdiction),
              sourceSystem: SourceSystem.OPG,
              sourceUrl: null,
              title: `${policyReport.jurisdiction} policy report`,
              versionKey: policyReport.generatedAt,
            },
          ]
        : []),
    ],
    task: {
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      contextJson: {
        policyId: recommendation.policyId,
        policyType,
        recommendationType: recommendation.recommendationType,
        recommendedTarget: recommendationTarget,
      },
      assigneeAffiliationSnapshot: null,
      assigneeOrganizationName: null,
      assigneeOrganizationSourceRef: null,
      assigneeOrganizationType: null,
      description:
        reportPolicy?.description ??
        policy?.description ??
        recommendation.rationale ??
        `${recommendation.recommendationType} ${policyName}.`,
      dueAt: null,
      contactLabel: null,
      contactTemplate: null,
      contactUrl: null,
      estimatedEffortHours: null,
      impactStatement: recommendation.rationale ?? null,
      interestTags: ["policy", policyType],
      roleTitle: null,
      skillTags: ["policy-analysis", "advocacy"],
      status: TaskStatus.ACTIVE,
      taskKey: `opg:${recommendation.jurisdictionId}:${recommendation.policyId}`,
      title:
        recommendationTarget != null
          ? `${recommendation.recommendationType.toUpperCase()} ${policyName} -> ${recommendationTarget}`
          : `${recommendation.recommendationType.toUpperCase()} ${policyName}`,
    },
  } satisfies ImportedTaskBundle;
}

export function buildObgCategoryTaskBundle(input: {
  budgetReport: BudgetReportJSON;
  category: BudgetReportCategory;
}) {
  const { budgetReport, category } = input;

  return {
    impactEstimate: {
      assumptionsJson: {
        categoryId: category.id,
        generatedFrom: "obg-budget-category",
        jurisdiction: budgetReport.jurisdiction,
      },
      calculationVersion: "obg-import-v1",
      counterfactualKey: "current-budget-baseline",
      estimateKind: TaskImpactEstimateKind.FORECAST,
      frames: [
        {
          annualDiscountRate: 0.03,
          adoptionRampYears: 1,
          benefitDurationYears: 20,
          customFrameLabel: null,
          delayDalysLostPerDayBase: null,
          delayDalysLostPerDayHigh: null,
          delayDalysLostPerDayLow: null,
          delayEconomicValueUsdLostPerDayBase: null,
          delayEconomicValueUsdLostPerDayHigh: null,
          delayEconomicValueUsdLostPerDayLow: null,
          estimatedCashCostUsdBase: null,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: null,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 20,
          expectedDalysAvertedBase: null,
          expectedDalysAvertedHigh: null,
          expectedDalysAvertedLow: null,
          expectedEconomicValueUsdBase: null,
          expectedEconomicValueUsdHigh: null,
          expectedEconomicValueUsdLow: null,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          medianHealthyLifeYearsEffectBase: null,
          medianHealthyLifeYearsEffectHigh: null,
          medianHealthyLifeYearsEffectLow: null,
          medianIncomeGrowthEffectPpPerYearBase: null,
          medianIncomeGrowthEffectPpPerYearHigh: null,
          medianIncomeGrowthEffectPpPerYearLow: null,
          metrics: [
            numericMetric("obg_gap_usd", "usd", category.gap, {
              displayGroup: "obg",
            }),
            numericMetric(
              "obg_current_spending_usd",
              "usd",
              category.currentSpending,
              { displayGroup: "obg" },
            ),
            numericMetric(
              "obg_optimal_spending_usd",
              "usd",
              category.optimalSpendingNominal,
              { displayGroup: "obg" },
            ),
            numericMetric(
              "obg_marginal_return",
              "score",
              category.diminishingReturns?.marginalReturn ?? null,
              { displayGroup: "obg" },
            ),
            numericMetric(
              "obg_elasticity",
              "ratio",
              category.diminishingReturns?.elasticity ?? null,
              { displayGroup: "obg" },
            ),
            categoricalMetric(
              "obg_recommendation",
              "recommendation",
              category.recommendation,
              "obg",
            ),
          ],
          successProbabilityBase: null,
          successProbabilityHigh: null,
          successProbabilityLow: null,
          summaryStatsJson: null,
          timeToImpactStartDays: 365,
        },
      ],
      methodologyKey: "obg-budget-category",
      parameterSetHash: "obg-unparameterized",
      publicationStatus: TaskImpactPublicationStatus.REVIEWED,
      sourceSystem: SourceSystem.OBG,
    },
    sourceArtifacts: [
      {
        artifactType: SourceArtifactType.OBG_BUDGET_CATEGORY,
        contentHash: null,
        externalKey: category.id,
        payloadJson: {
          category,
          jurisdiction: budgetReport.jurisdiction,
        },
        sourceKey: `obg:category:${slugify(budgetReport.jurisdiction)}:${category.id}`,
        sourceRef: category.id,
        sourceSystem: SourceSystem.OBG,
        sourceUrl: null,
        title: category.name,
        versionKey: budgetReport.generatedAt,
      },
      {
        artifactType: SourceArtifactType.OBG_BUDGET_REPORT,
        contentHash: null,
        externalKey: slugify(budgetReport.jurisdiction),
        payloadJson: {
          generatedAt: budgetReport.generatedAt,
          jurisdiction: budgetReport.jurisdiction,
        },
        sourceKey: `obg:report:${slugify(budgetReport.jurisdiction)}:${slugify(budgetReport.generatedAt)}`,
        sourceRef: slugify(budgetReport.jurisdiction),
        sourceSystem: SourceSystem.OBG,
        sourceUrl: null,
        title: `${budgetReport.jurisdiction} budget report`,
        versionKey: budgetReport.generatedAt,
      },
    ],
    task: {
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      contextJson: {
        budgetCategoryId: category.id,
        recommendation: category.recommendation,
      },
      assigneeAffiliationSnapshot: null,
      assigneeOrganizationName: null,
      assigneeOrganizationSourceRef: null,
      assigneeOrganizationType: null,
      description: `${category.recommendation} ${category.name} spending. Current gap: ${category.gap.toLocaleString()}.`,
      dueAt: null,
      contactLabel: null,
      contactTemplate: null,
      contactUrl: null,
      estimatedEffortHours: null,
      impactStatement: category.evidenceSource,
      interestTags: ["budget", category.id],
      roleTitle: null,
      skillTags: ["budget-analysis", "policy-analysis"],
      status: TaskStatus.ACTIVE,
      taskKey: `obg:${slugify(budgetReport.jurisdiction)}:${category.id}`,
      title: `${category.recommendation.toUpperCase()} ${category.name} budget`,
    },
  } satisfies ImportedTaskBundle;
}
