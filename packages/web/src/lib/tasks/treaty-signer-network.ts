import {
  OrgType,
  SourceArtifactType,
  SourceSystem,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import type {
  ImportedImpactFrameDraft,
  ImportedImpactMetricDraft,
  ImportedSourceArtifactDraft,
} from "./opg-obg-adapters";
import type { PolicyModelRunImportDraft } from "./policy-model-run-to-imported-task-bundle";
import {
  getTreatySignerTaskKey,
  TREATY_SIGNER_TASK_TITLE,
} from "./task-keys";
export const TREATY_DUE_AT = new Date("2024-12-31T00:00:00.000Z");
export const SIPRI_WORLD_MILITARY_SPENDING_USD_2024 = 2_718_000_000_000;
export const SIPRI_MILITARY_SPENDING_2024_SOURCE_URL =
  "https://www.sipri.org/sites/default/files/2025-04/2504_fs_milex_2024.pdf";

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

export interface TreatySignerSlot {
  contactEmail: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  countryCode: string;
  countryName: string;
  decisionMakerLabel: string;
  governmentName: string;
  governmentWebsite: string | null;
  militaryBudgetUsd: number;
  officialSourceUrl: string | null;
  roleTitle: string;
  sortOrder: number;
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    style: "currency",
  }).format(value);
}

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

function buildSignerContactTemplate() {
  return [
    "Please complete {{taskTitle}}.",
    "This task is already {{delayLabel}}.",
    "Estimated delay cost so far: {{humanLives}} lives, {{sufferingHours}} suffering hours, and {{economicLoss}}.",
    "Public task page: {{taskUrl}}",
  ].join(" ");
}

function buildCountryInterestTags(slot: TreatySignerSlot) {
  return [
    "treaty",
    "disease-eradication",
    "peace-dividend",
    `country-${slot.countryCode.toLowerCase()}`,
  ];
}

function buildCountrySkillTags(slot: TreatySignerSlot) {
  return [
    "diplomacy",
    "public-pressure",
    "executive-action",
    `country-${slot.countryCode.toLowerCase()}`,
  ];
}

function buildTreatyAcceptanceCriteria(slot: TreatySignerSlot) {
  return [
    `A treaty instrument, executive order, or equivalent commitment is prepared for ${slot.decisionMakerLabel}.`,
    `${slot.decisionMakerLabel} publicly signs or commits to the 1% Treaty.`,
    `${slot.governmentName} publicly names the implementation authority for the 1% redirect.`,
    `A first implementation step is announced within 90 days of signature.`,
  ];
}

function buildTreatySignerSourceArtifacts(
  slot: TreatySignerSlot,
): ImportedSourceArtifactDraft[] {
  const artifacts: ImportedSourceArtifactDraft[] = [
    {
      artifactType: SourceArtifactType.EXTERNAL_SOURCE,
      contentHash: null,
      externalKey: `sipri-milex-2024:${slot.countryCode.toLowerCase()}`,
      payloadJson: {
        countryCode: slot.countryCode,
        countryName: slot.countryName,
        militaryBudgetUsd: slot.militaryBudgetUsd,
        snapshotYear: 2024,
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
    scaledFrame[key] = scaleNumber(frame[key], factor) as ImportedImpactFrameDraft[typeof key];
  }

  scaledFrame.metrics = frame.metrics.map((metric) => scaleImportedMetric(metric, factor));
  return scaledFrame;
}

function upsertMetric(
  metrics: ImportedImpactMetricDraft[],
  nextMetric: ImportedImpactMetricDraft,
) {
  const existingIndex = metrics.findIndex((metric) => metric.metricKey === nextMetric.metricKey);
  if (existingIndex >= 0) {
    metrics.splice(existingIndex, 1, nextMetric);
    return;
  }

  metrics.push(nextMetric);
}

function buildSignerImpactMetrics(slot: TreatySignerSlot) {
  const militaryShareRatio = slot.militaryBudgetUsd / SIPRI_WORLD_MILITARY_SPENDING_USD_2024;
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
  slot: TreatySignerSlot;
}): PolicyModelRunImportDraft {
  const slot = input.slot;
  const factor = slot.militaryBudgetUsd / SIPRI_WORLD_MILITARY_SPENDING_USD_2024;
  const redirectAmountUsd = slot.militaryBudgetUsd * 0.01;
  const cloned = structuredClone(input.baseDraft);
  const taskKey = getTreatySignerTaskKey(slot);

  cloned.assigneeHint = {
    actorKey: null,
    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    contactLabel: slot.contactLabel,
    contactTemplate: buildSignerContactTemplate(),
    contactUrl: slot.contactUrl,
    currentAffiliation: slot.governmentName,
    displayName: slot.decisionMakerLabel,
    isPublicFigure: true,
    organizationKey: null,
    organizationName: null,
    organizationType: null,
    role: "decision_maker",
    roleTitle: slot.roleTitle,
  };

  cloned.bundle.task.assigneeAffiliationSnapshot = slot.governmentName;
  cloned.bundle.task.assigneeOrganizationName = null;
  cloned.bundle.task.assigneeOrganizationSourceRef = null;
  cloned.bundle.task.assigneeOrganizationType = null;
  cloned.bundle.task.claimPolicy = TaskClaimPolicy.ASSIGNED_ONLY;
  cloned.bundle.task.contactLabel = slot.contactLabel;
  cloned.bundle.task.contactTemplate = buildSignerContactTemplate();
  cloned.bundle.task.contactUrl = slot.contactUrl;
  cloned.bundle.task.description = [
    `Secure ${slot.decisionMakerLabel}'s signature on the 1% Treaty.`,
    `If completed, ${slot.governmentName} redirects about ${formatCompactUsd(redirectAmountUsd)} per year into pragmatic clinical trials and disease-eradication work.`,
    `This slot represents about ${round(factor * 100, 1)}% of global military spending in the 2024 SIPRI snapshot.`,
  ].join(" ");
  cloned.bundle.task.difficulty = TaskDifficulty.EXPERT;
  cloned.bundle.task.dueAt = TREATY_DUE_AT;
  cloned.bundle.task.impactStatement = [
    `${formatCompactUsd(redirectAmountUsd)} per year redirected if completed.`,
    "Thirty seconds for the signer. Large global downside from delay.",
  ].join(" ");
  cloned.bundle.task.interestTags = buildCountryInterestTags(slot);
  cloned.bundle.task.roleTitle = slot.roleTitle;
  cloned.bundle.task.skillTags = buildCountrySkillTags(slot);
  cloned.bundle.task.status = TaskStatus.ACTIVE;
  cloned.bundle.task.taskKey = taskKey;
  cloned.bundle.task.title = TREATY_SIGNER_TASK_TITLE;
  cloned.bundle.task.contextJson = {
    ...cloned.bundle.task.contextJson,
    acceptanceCriteria: buildTreatyAcceptanceCriteria(slot),
    treatySignerSlot: {
      annualRedirectAmountUsd: redirectAmountUsd,
      countryCode: slot.countryCode,
      countryName: slot.countryName,
      decisionMakerLabel: slot.decisionMakerLabel,
      governmentName: slot.governmentName,
      militaryBudgetSharePct: round(factor * 100, 2),
      militaryBudgetShareRatio: factor,
      militaryBudgetUsd: slot.militaryBudgetUsd,
      snapshotYear: 2024,
      worldMilitarySpendingUsd: SIPRI_WORLD_MILITARY_SPENDING_USD_2024,
    },
  };

  cloned.bundle.impactEstimate.assumptionsJson = {
    ...(cloned.bundle.impactEstimate.assumptionsJson ?? {}),
    annualRedirectAmountUsd: redirectAmountUsd,
    countryCode: slot.countryCode,
    countryName: slot.countryName,
    decisionMakerLabel: slot.decisionMakerLabel,
    governmentName: slot.governmentName,
    militaryBudgetShareRatio: factor,
    militaryBudgetUsd: slot.militaryBudgetUsd,
    treatySignerScalingMethod: "scaled-by-share-of-2024-global-military-spending",
  };
  cloned.bundle.impactEstimate.frames = cloned.bundle.impactEstimate.frames.map((frame) => {
    const scaledFrame = scaleImpactFrame(frame, factor);
    const addedMetrics = buildSignerImpactMetrics(slot);

    for (const metric of addedMetrics) {
      upsertMetric(scaledFrame.metrics, metric);
    }

    return scaledFrame;
  });
  cloned.bundle.sourceArtifacts = uniqueArtifacts([
    ...cloned.bundle.sourceArtifacts,
    ...buildTreatySignerSourceArtifacts(slot),
  ]);

  return cloned;
}

