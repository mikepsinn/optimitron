export interface TaskAcceptanceCriteriaContext {
  acceptanceCriteria: string[];
  currentActivities: Array<{
    description: string;
    id: string | null;
    impactSummary: string | null;
    methodology: string | null;
    sourceUrl: string | null;
    updated: string | null;
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readTaskContextSections(contextJson: unknown): TaskAcceptanceCriteriaContext {
  if (!isRecord(contextJson)) {
    return {
      acceptanceCriteria: [],
      currentActivities: [],
    };
  }

  const acceptanceCriteria = Array.isArray(contextJson.acceptanceCriteria)
    ? contextJson.acceptanceCriteria.filter((value): value is string => typeof value === "string")
    : [];

  const currentActivities = Array.isArray(contextJson.currentActivities)
    ? contextJson.currentActivities
        .filter(isRecord)
        .map((activity) => ({
          description: typeof activity.description === "string" ? activity.description : "",
          id: typeof activity.id === "string" ? activity.id : null,
          impactSummary:
            typeof activity.impactSummary === "string" ? activity.impactSummary : null,
          methodology:
            typeof activity.methodology === "string" ? activity.methodology : null,
          sourceUrl: typeof activity.sourceUrl === "string" ? activity.sourceUrl : null,
          updated: typeof activity.updated === "string" ? activity.updated : null,
        }))
        .filter((activity) => activity.description.length > 0)
    : [];

  return {
    acceptanceCriteria,
    currentActivities,
  };
}

// ---------------------------------------------------------------------------
// Leader activity metadata (for accountability ledger display)
// ---------------------------------------------------------------------------

export interface LeaderActivityContext {
  activityType: string | null;
  alternativeUse: string | null;
  claimedBenefit: string | null;
  costEfficiencyNote: string | null;
  measuredOutcome: string | null;
  taxpayerCostUsd: number | null;
  wishoniaComment: string | null;
}

export function readLeaderActivityContext(contextJson: unknown): LeaderActivityContext {
  if (!isRecord(contextJson)) {
    return {
      activityType: null,
      alternativeUse: null,
      claimedBenefit: null,
      costEfficiencyNote: null,
      measuredOutcome: null,
      taxpayerCostUsd: null,
      wishoniaComment: null,
    };
  }

  return {
    activityType: typeof contextJson.activityType === "string" ? contextJson.activityType : null,
    alternativeUse: typeof contextJson.alternativeUse === "string" ? contextJson.alternativeUse : null,
    claimedBenefit: typeof contextJson.claimedBenefit === "string" ? contextJson.claimedBenefit : null,
    costEfficiencyNote: typeof contextJson.costEfficiencyNote === "string" ? contextJson.costEfficiencyNote : null,
    measuredOutcome: typeof contextJson.measuredOutcome === "string" ? contextJson.measuredOutcome : null,
    taxpayerCostUsd: typeof contextJson.taxpayerCostUsd === "number" ? contextJson.taxpayerCostUsd : null,
    wishoniaComment: typeof contextJson.wishoniaComment === "string" ? contextJson.wishoniaComment : null,
  };
}

export interface TreatySignerSlotContext {
  annualRedirectAmountUsd: number;
  countryCode: string;
  countryIso3?: string | null;
  militaryBudgetSharePct: number;
  militaryBudgetUsd: number;
  snapshotYear: number;
}

export function readTreatySignerSlotContext(
  contextJson: unknown,
): TreatySignerSlotContext | null {
  if (!isRecord(contextJson) || !isRecord(contextJson.treatySignerSlot)) {
    return null;
  }

  const slot = contextJson.treatySignerSlot;
  if (
    typeof slot.annualRedirectAmountUsd !== "number" ||
    typeof slot.countryCode !== "string" ||
    typeof slot.militaryBudgetSharePct !== "number" ||
    typeof slot.militaryBudgetUsd !== "number" ||
    typeof slot.snapshotYear !== "number"
  ) {
    return null;
  }

  return {
    annualRedirectAmountUsd: slot.annualRedirectAmountUsd,
    countryCode: slot.countryCode,
    countryIso3: typeof slot.countryIso3 === "string" ? slot.countryIso3 : null,
    militaryBudgetSharePct: slot.militaryBudgetSharePct,
    militaryBudgetUsd: slot.militaryBudgetUsd,
    snapshotYear: slot.snapshotYear,
  };
}
