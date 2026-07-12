import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskClaimPolicy,
  TaskStatus,
} from "@optimitron/db";
import type { GovernmentLeaderRecord } from "@optimitron/data/datasets/government-leader-types";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getMilitaryToGovernmentClinicalTrialRatio } from "@optimitron/data/datasets/government-spending-ratios";
import {
  SIPRI_MILITARY_SPENDING_2024_SOURCE_URL,
  SIPRI_WORLD_MILITARY_SPENDING_SNAPSHOT_YEAR,
  SIPRI_WORLD_MILITARY_SPENDING_USD_2024,
} from "@optimitron/data/parameters";
import {
  buildTreatyAcceptanceCriteria,
  buildTreatyImpactStatement,
  buildTreatySignerContactTemplate,
  buildTreatyTaskDescription,
  TREATY_SIGN_LABEL,
  TREATY_SIGN_URL,
} from "@/lib/campaigns/one-percent-treaty";
import type {
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
} from "./opg-obg-adapters";
import type { PolicyModelRunImportDraft } from "./policy-model-run-to-imported-task-bundle";
import { getTreatySignerTaskKey, TREATY_SIGNER_TASK_TITLE } from "./task-keys";
export const TREATY_DUE_AT = new Date("2024-12-31T00:00:00.000Z");

const SCALEABLE_FRAME_KEYS = [
  "delayDalysLostPerDayBase",
  "delayDalysLostPerDayHigh",
  "delayDalysLostPerDayLow",
  "delayEconomicValueUsdLostPerDayBase",
  "delayEconomicValueUsdLostPerDayHigh",
  "delayEconomicValueUsdLostPerDayLow",
  "estimatedCashCostUsdBase",
  "estimatedCashCostUsdHigh",
  "estimatedCashCostUsdLow",
  "expectedDalysAvertedBase",
  "expectedDalysAvertedHigh",
  "expectedDalysAvertedLow",
  "expectedEconomicValueUsdBase",
  "expectedEconomicValueUsdHigh",
  "expectedEconomicValueUsdLow",
] satisfies Array<keyof ImportedImpactFrameDraft>;

const SCALEABLE_METRIC_KEYS = new Set([
  "contribution_lives_saved_per_pct_point",
  "contribution_suffering_hours_per_pct_point",
  "delay_dalys_lost_per_day",
  "delay_economic_value_usd_lost_per_day",
  "expected_value_per_hour_dalys",
  "expected_value_per_hour_usd",
  "lives_saved_if_success",
  "suffering_hours_if_success",
  "treaty_cumulative_20yr_with_ratchet",
  "treaty_lives_saved_annual_global",
  "treaty_qalys_gained_annual_global",
]);

function round(value: number, digits = 4) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function scaleNumber(value: number | null, factor: number) {
  return value == null ? null : value * factor;
}

function uniqueArtifacts(artifacts: ImportedSourceArtifactDraft[]) {
  const deduped = new Map<string, ImportedSourceArtifactDraft>();
  for (const artifact of artifacts) {
    deduped.set(artifact.sourceKey, artifact);
  }
  return [...deduped.values()];
}

function buildCountryInterestTags(slot: GovernmentLeaderRecord) {
  return [
    "treaty",
    "disease-eradication",
    "peace-dividend",
    `country-${slot.countryCode.toLowerCase()}`,
  ];
}

function buildCountrySkillTags(slot: GovernmentLeaderRecord) {
  return [
    "diplomacy",
    "public-pressure",
    "executive-action",
    `country-${slot.countryCode.toLowerCase()}`,
  ];
}

function buildTreatySignerSourceArtifacts(
  slot: GovernmentLeaderRecord,
): ImportedSourceArtifactDraft[] {
  const artifacts: ImportedSourceArtifactDraft[] = [
    {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: null,
      externalKey: `sipri-milex-2024:${slot.countryCode.toLowerCase()}`,
      payloadJson: {
        countryCode: slot.countryCode,
        countryIso3: slot.countryIso3,
        countryName: slot.countryName,
        militaryBudgetUsd: slot.militaryBudgetUsd,
        snapshotYear: SIPRI_WORLD_MILITARY_SPENDING_SNAPSHOT_YEAR,
        worldMilitarySpendingUsd: SIPRI_WORLD_MILITARY_SPENDING_USD_2024,
      },
      sourceKey: `external:sipri:military-expenditure-2024:${slot.countryCode.toLowerCase()}`,
      sourceRef: `sipri:military-expenditure-2024:${slot.countryCode.toLowerCase()}`,
      sourceSystem: SourceSystem.EXTERNAL,
      sourceUrl: SIPRI_MILITARY_SPENDING_2024_SOURCE_URL,
      title: `SIPRI 2024 military expenditure snapshot for ${slot.countryName}`,
      versionKey: "2024",
    },
  ];

  const officeSourceUrl =
    slot.officialSourceUrl ?? slot.governmentWebsite ?? slot.contactUrl ?? null;

  if (officeSourceUrl) {
    artifacts.push({
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: null,
      externalKey: `official-office:${slot.countryCode.toLowerCase()}`,
      payloadJson: {
        contactLabel: slot.contactLabel,
        contactUrl: slot.contactUrl,
        countryCode: slot.countryCode,
        countryIso3: slot.countryIso3,
        decisionMakerLabel: slot.decisionMakerLabel,
        governmentName: slot.governmentName,
      },
      sourceKey: `external:official-office:${slot.countryCode.toLowerCase()}`,
      sourceRef: `official-office:${slot.countryCode.toLowerCase()}`,
      sourceSystem: SourceSystem.EXTERNAL,
      sourceUrl: officeSourceUrl,
      title: `${slot.decisionMakerLabel} official office page`,
      versionKey: "current",
    });
  }

  return artifacts;
}

function scaleImportedMetric(
  metric: ImportedImpactMetricDraft,
  factor: number,
): ImportedImpactMetricDraft {
  if (!SCALEABLE_METRIC_KEYS.has(metric.metricKey)) {
    return metric;
  }

  return {
    ...metric,
    baseValue: scaleNumber(metric.baseValue, factor),
    highValue: scaleNumber(metric.highValue, factor),
    lowValue: scaleNumber(metric.lowValue, factor),
    metadataJson: {
      ...(metric.metadataJson ?? {}),
      treatySignerScaledByMilitaryShare: true,
    },
  };
}

function scaleImpactFrame(
  frame: ImportedImpactFrameDraft,
  factor: number,
): ImportedImpactFrameDraft {
  const scaledFrame = { ...frame };

  for (const key of SCALEABLE_FRAME_KEYS) {
    scaledFrame[key] = scaleNumber(
      frame[key],
      factor,
    ) as ImportedImpactFrameDraft[typeof key];
  }

  scaledFrame.metrics = frame.metrics.map((metric) =>
    scaleImportedMetric(metric, factor),
  );
  return scaledFrame;
}

function upsertMetric(
  metrics: ImportedImpactMetricDraft[],
  nextMetric: ImportedImpactMetricDraft,
) {
  const existingIndex = metrics.findIndex(
    (metric) => metric.metricKey === nextMetric.metricKey,
  );
  if (existingIndex >= 0) {
    metrics.splice(existingIndex, 1, nextMetric);
    return;
  }

  metrics.push(nextMetric);
}

function buildSignerImpactMetrics(slot: GovernmentLeaderRecord) {
  const militaryShareRatio =
    slot.militaryBudgetUsd / SIPRI_WORLD_MILITARY_SPENDING_USD_2024;
  const redirectAmountUsd = slot.militaryBudgetUsd * 0.01;

  return [
    {
      baseValue: slot.militaryBudgetUsd,
      displayGroup: "treaty-slot",
      highValue: null,
      lowValue: null,
      metadataJson: {
        displayName: "Military budget (2024 SIPRI)",
      },
      metricKey: "military_budget_usd",
      summaryStatsJson: null,
      unit: "USD",
      valueJson: null,
    },
    {
      baseValue: militaryShareRatio,
      displayGroup: "treaty-slot",
      highValue: null,
      lowValue: null,
      metadataJson: {
        displayName: "Share of global military spending",
      },
      metricKey: "military_budget_share_ratio",
      summaryStatsJson: null,
      unit: "ratio",
      valueJson: null,
    },
    {
      baseValue: militaryShareRatio * 100,
      displayGroup: "treaty-slot",
      highValue: null,
      lowValue: null,
      metadataJson: {
        displayName: "Share of global military spending",
      },
      metricKey: "military_budget_share_pct",
      summaryStatsJson: null,
      unit: "percent",
      valueJson: null,
    },
    {
      baseValue: redirectAmountUsd,
      displayGroup: "treaty-slot",
      highValue: null,
      lowValue: null,
      metadataJson: {
        displayName: "Annual 1% redirect amount",
      },
      metricKey: "annual_redirect_amount_usd",
      summaryStatsJson: null,
      unit: "USD/year",
      valueJson: null,
    },
  ] satisfies ImportedImpactMetricDraft[];
}

export function buildTreatySignerImportDraft(input: {
  baseDraft: PolicyModelRunImportDraft;
  slot: GovernmentLeaderRecord;
}): PolicyModelRunImportDraft {
  const slot = input.slot;
  const factor =
    slot.militaryBudgetUsd / SIPRI_WORLD_MILITARY_SPENDING_USD_2024;
  const redirectAmountUsd = slot.militaryBudgetUsd * 0.01;
  const governmentMetrics = getGovernmentMetrics(slot.countryCode);
  const militaryToClinicalTrialsRatio = governmentMetrics
    ? getMilitaryToGovernmentClinicalTrialRatio(governmentMetrics)
    : null;
  const cloned = structuredClone(input.baseDraft);
  const taskKey = getTreatySignerTaskKey(slot);

  cloned.assigneeHint =
    slot.leaderName && slot.leaderSourceRef
      ? {
          actorKey: slot.leaderSourceRef,
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          contactLabel: slot.contactLabel,
          contactTemplate: buildTreatySignerContactTemplate(),
          contactUrl: slot.contactUrl,
          currentAffiliation: slot.governmentName,
          displayName: slot.leaderName,
          isPublicFigure: true,
          organizationKey: `organization:government:${slot.countryCode.toLowerCase()}`,
          organizationName: slot.governmentName,
          organizationType: OrgType.GOVERNMENT,
          role: "decision_maker",
          roleTitle: slot.roleTitle,
        }
      : null;

  cloned.bundle.task.assigneeAffiliationSnapshot = slot.governmentName;
  cloned.bundle.task.assigneeOrganizationName = slot.governmentName;
  cloned.bundle.task.assigneeOrganizationSourceRef = `organization:government:${slot.countryCode.toLowerCase()}`;
  cloned.bundle.task.assigneeOrganizationType = OrgType.GOVERNMENT;
  cloned.bundle.task.claimPolicy = TaskClaimPolicy.ASSIGNED_ONLY;
  // The parent signer task's action link is the assignee's *own* action target —
  // a head of state clicks through to sign the treaty. Wishonia-voice nudge
  // template (third-person about the signer) does NOT belong on this task; it
  // moves to the citizen-created reminder subtask in claimSignerReminder.
  // The runtime fallback in task-communication-action.ts no longer fires for
  // these tasks because contactUrl is now stored.
  cloned.bundle.task.contactLabel = TREATY_SIGN_LABEL;
  cloned.bundle.task.contactTemplate = null;
  cloned.bundle.task.contactUrl = TREATY_SIGN_URL;
  cloned.bundle.task.description = buildTreatyTaskDescription({
    actorLabel: slot.leaderName ?? slot.decisionMakerLabel,
    annualRedirectAmountUsd: redirectAmountUsd,
    governmentName: slot.governmentName,
    militaryBudgetShareRatio: factor,
  });
  cloned.bundle.task.dueAt = TREATY_DUE_AT;
  cloned.bundle.task.impactStatement = buildTreatyImpactStatement({
    annualRedirectAmountUsd: redirectAmountUsd,
  });
  cloned.bundle.task.interestTags = buildCountryInterestTags(slot);
  cloned.bundle.task.roleTitle = slot.roleTitle;
  cloned.bundle.task.skillTags = buildCountrySkillTags(slot);
  cloned.bundle.task.status = TaskStatus.ACTIVE;
  cloned.bundle.task.taskKey = taskKey;
  cloned.bundle.task.title = TREATY_SIGNER_TASK_TITLE;
  const existingContext =
    (cloned.bundle.task.contextJson as {
      assigneeProfile?: Record<string, unknown>;
    } | null) ?? {};
  const existingAssigneeProfile =
    (existingContext.assigneeProfile as Record<string, unknown> | undefined) ??
    {};

  cloned.bundle.task.contextJson = {
    ...cloned.bundle.task.contextJson,
    assigneeProfile: {
      ...existingAssigneeProfile,
      budgetUsdPerYear: slot.militaryBudgetUsd,
      budgetLabel: "Military spending",
      governmentBudgetUsdPerYear: slot.governmentBudgetUsd,
      ...(militaryToClinicalTrialsRatio != null
        ? { militaryToClinicalTrialsRatio }
        : {}),
    },
    acceptanceCriteria: buildTreatyAcceptanceCriteria({
      actorLabel: slot.leaderName ?? slot.decisionMakerLabel,
      governmentName: slot.governmentName,
    }),
    treatySignerSlot: {
      annualRedirectAmountUsd: redirectAmountUsd,
      countryCode: slot.countryCode,
      countryIso3: slot.countryIso3,
      governmentBudgetUsd: slot.governmentBudgetUsd,
      ...(militaryToClinicalTrialsRatio != null
        ? { militaryToClinicalTrialsRatio }
        : {}),
      militaryBudgetSharePct: round(factor * 100, 2),
      militaryBudgetUsd: slot.militaryBudgetUsd,
      snapshotYear: 2024,
    },
  };

  cloned.bundle.impactEstimate.assumptionsJson = {
    ...(cloned.bundle.impactEstimate.assumptionsJson ?? {}),
    annualRedirectAmountUsd: redirectAmountUsd,
    countryCode: slot.countryCode,
    countryIso3: slot.countryIso3,
    militaryBudgetShareRatio: factor,
    militaryBudgetUsd: slot.militaryBudgetUsd,
    treatySignerScalingMethod:
      "scaled-by-share-of-2024-global-military-spending",
  };
  cloned.bundle.impactEstimate.frames = cloned.bundle.impactEstimate.frames.map(
    (frame) => {
      const scaledFrame = scaleImpactFrame(frame, factor);
      const addedMetrics = buildSignerImpactMetrics(slot);

      for (const metric of addedMetrics) {
        upsertMetric(scaledFrame.metrics, metric);
      }

      return scaledFrame;
    },
  );
  cloned.bundle.sourceArtifacts = uniqueArtifacts([
    ...cloned.bundle.sourceArtifacts,
    ...buildTreatySignerSourceArtifacts(slot),
  ]);

  return cloned;
}
