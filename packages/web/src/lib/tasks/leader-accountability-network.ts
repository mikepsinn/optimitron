/**
 * Builder functions for the leader accountability ledger.
 *
 * Parallels treaty-signer-network.ts: takes structured activity data and
 * produces ImportedTaskBundles suitable for upsertImportedTaskBundle().
 */

import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db";
import type { LeaderActivityRecord } from "@optimitron/data";
import type {
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
  ImportedTaskBundle,
} from "./opg-obg-adapters";
import type { TreatySignerSlot } from "./treaty-signer-network";
import { getActivityTaskKey } from "./leader-activity-keys";

// ---------------------------------------------------------------------------
// Source artifacts
// ---------------------------------------------------------------------------

function buildActivitySourceArtifacts(
  activity: LeaderActivityRecord,
): ImportedSourceArtifactDraft[] {
  const taskKey = getActivityTaskKey(activity.countryCode, activity.activitySlug);
  const artifacts: ImportedSourceArtifactDraft[] = [
    {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: null,
      externalKey: `${taskKey}:primary`,
      payloadJson: {
        activitySlug: activity.activitySlug,
        activityType: activity.activityType,
        countryCode: activity.countryCode,
        taxpayerCostUsd: activity.taxpayerCostUsd,
      },
      sourceKey: `external:accountability:${activity.countryCode.toLowerCase()}:${activity.activitySlug}`,
      sourceRef: `accountability:${activity.countryCode.toLowerCase()}:${activity.activitySlug}`,
      sourceSystem: SourceSystem.EXTERNAL,
      sourceUrl: activity.sourceUrl,
      title: activity.title,
      versionKey: "current",
    },
  ];

  for (const url of activity.additionalSourceUrls) {
    const slug = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    artifacts.push({
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: null,
      externalKey: `${taskKey}:${slug}`,
      payloadJson: {},
      sourceKey: `external:accountability:${activity.countryCode.toLowerCase()}:${activity.activitySlug}:${slug}`,
      sourceRef: null,
      sourceSystem: SourceSystem.EXTERNAL,
      sourceUrl: url,
      title: null,
      versionKey: null,
    });
  }

  return artifacts;
}

// ---------------------------------------------------------------------------
// Impact frame + metrics
// ---------------------------------------------------------------------------

function buildActivityImpactMetrics(activity: LeaderActivityRecord): ImportedImpactMetricDraft[] {
  const metrics: ImportedImpactMetricDraft[] = [];

  if (activity.taxpayerCostUsd != null) {
    metrics.push({
      baseValue: activity.taxpayerCostUsd,
      displayGroup: "cost",
      highValue: null,
      lowValue: null,
      metadataJson: null,
      metricKey: "taxpayer_cost_usd",
      summaryStatsJson: null,
      unit: "USD",
      valueJson: null,
    });
  }

  if (activity.impactTier === "harm") {
    if (activity.casualtiesEstimate != null) {
      // Negative: lives lost, not saved
      metrics.push({
        baseValue: -activity.casualtiesEstimate,
        displayGroup: "human-impact",
        highValue: null,
        lowValue: null,
        metadataJson: null,
        metricKey: "lives_saved_if_success",
        summaryStatsJson: null,
        unit: "lives",
        valueJson: null,
      });
    }

    if (activity.dalysInflicted != null) {
      metrics.push({
        baseValue: -activity.dalysInflicted,
        displayGroup: "human-impact",
        highValue: null,
        lowValue: null,
        metadataJson: null,
        metricKey: "dalys_averted",
        summaryStatsJson: null,
        unit: "DALYs",
        valueJson: null,
      });
    }
  }

  if (activity.impactTier === "measured-benefit") {
    if (activity.measuredLivesSaved != null) {
      metrics.push({
        baseValue: activity.measuredLivesSaved,
        displayGroup: "human-impact",
        highValue: null,
        lowValue: null,
        metadataJson: null,
        metricKey: "lives_saved_if_success",
        summaryStatsJson: null,
        unit: "lives",
        valueJson: null,
      });
    }
  }

  return metrics;
}

function buildActivityImpactFrame(activity: LeaderActivityRecord): ImportedImpactFrameDraft {
  // Determine economic value based on tier
  let expectedEconomicValueUsdBase: number | null = null;
  let expectedDalysAvertedBase: number | null = null;

  if (activity.impactTier === "harm") {
    // Tier 1: negative value = harm
    expectedEconomicValueUsdBase = activity.taxpayerCostUsd != null
      ? -activity.taxpayerCostUsd
      : null;
    expectedDalysAvertedBase = activity.dalysInflicted != null
      ? -activity.dalysInflicted
      : null;
  } else if (activity.impactTier === "measured-benefit") {
    // Tier 2: positive value from real measurement
    expectedEconomicValueUsdBase = activity.measuredEconomicValueUsd;
  }
  // Tier 3 (unmeasured): null — we don't know, so we don't pretend

  return {
    adoptionRampYears: 0,
    annualDiscountRate: 0,
    benefitDurationYears: 1,
    customFrameLabel: null,
    delayDalysLostPerDayBase: null,
    delayDalysLostPerDayHigh: null,
    delayDalysLostPerDayLow: null,
    delayEconomicValueUsdLostPerDayBase: null,
    delayEconomicValueUsdLostPerDayHigh: null,
    delayEconomicValueUsdLostPerDayLow: null,
    estimatedCashCostUsdBase: activity.taxpayerCostUsd,
    estimatedCashCostUsdHigh: null,
    estimatedCashCostUsdLow: null,
    estimatedEffortHoursBase: null,
    estimatedEffortHoursHigh: null,
    estimatedEffortHoursLow: null,
    evaluationHorizonYears: 1,
    expectedDalysAvertedBase,
    expectedDalysAvertedHigh: null,
    expectedDalysAvertedLow: null,
    expectedEconomicValueUsdBase,
    expectedEconomicValueUsdHigh: null,
    expectedEconomicValueUsdLow: null,
    frameKey: TaskImpactFrameKey.ONE_YEAR,
    frameSlug: "accountability-one-year",
    medianHealthyLifeYearsEffectBase: null,
    medianHealthyLifeYearsEffectHigh: null,
    medianHealthyLifeYearsEffectLow: null,
    medianIncomeGrowthEffectPpPerYearBase: null,
    medianIncomeGrowthEffectPpPerYearHigh: null,
    medianIncomeGrowthEffectPpPerYearLow: null,
    metrics: buildActivityImpactMetrics(activity),
    successProbabilityBase: 1.0, // already happened
    successProbabilityHigh: null,
    successProbabilityLow: null,
    summaryStatsJson: null,
    timeToImpactStartDays: 0,
  };
}

// ---------------------------------------------------------------------------
// Full task bundle
// ---------------------------------------------------------------------------

export function buildActivityTaskBundle(
  slot: TreatySignerSlot,
  activity: LeaderActivityRecord,
): ImportedTaskBundle {
  const taskKey = getActivityTaskKey(activity.countryCode, activity.activitySlug);
  const completedAt = new Date(activity.completedAt);

  return {
    task: {
      assigneeAffiliationSnapshot: slot.governmentName,
      assigneeOrganizationName: slot.governmentName,
      assigneeOrganizationSourceRef: `organization:government:${slot.countryCode.toLowerCase()}`,
      assigneeOrganizationType: OrgType.GOVERNMENT,
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contextJson: {
        activityType: activity.activityType,
        alternativeUse: activity.alternativeUse,
        claimedBenefit: activity.claimedBenefit,
        costEfficiencyNote: activity.costEfficiencyNote,
        impactTier: activity.impactTier,
        measuredOutcome: activity.measuredOutcome,
        taxpayerCostUsd: activity.taxpayerCostUsd,
        wishoniaComment: activity.wishoniaComment,
      },
      contactLabel: null,
      contactTemplate: null,
      contactUrl: null,
      description: activity.description,
      difficulty: TaskDifficulty.TRIVIAL,
      dueAt: completedAt,
      estimatedEffortHours: null,
      impactStatement: activity.wishoniaComment,
      interestTags: [
        "accountability",
        `country-${activity.countryCode.toLowerCase()}`,
        activity.activityType,
      ],
      roleTitle: slot.roleTitle,
      skillTags: [],
      status: TaskStatus.VERIFIED,
      taskKey,
      title: activity.title,
    },
    impactEstimate: {
      assumptionsJson: {
        activityType: activity.activityType,
        impactTier: activity.impactTier,
        note: activity.impactTier === "unmeasured"
          ? "Cost is known. Economic value is unmeasured — we do not credit face value of legislation."
          : activity.impactTier === "harm"
            ? "Negative values indicate harm caused or resources wasted."
            : "Measured benefit from real outcome data.",
      },
      calculationVersion: "accountability-ledger-v1",
      counterfactualKey: "status-quo",
      estimateKind: activity.impactTier === "measured-benefit"
        ? TaskImpactEstimateKind.OBSERVED
        : TaskImpactEstimateKind.FORECAST,
      frames: [buildActivityImpactFrame(activity)],
      methodologyKey: "leader-activity-audit",
      parameterSetHash: `accountability:${taskKey}:v1`,
      publicationStatus: TaskImpactPublicationStatus.PUBLISHED,
      sourceSystem: SourceSystem.EXTERNAL,
    },
    sourceArtifacts: buildActivitySourceArtifacts(activity),
  };
}
