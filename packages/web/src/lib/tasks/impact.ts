import { TaskImpactFrameKey } from "@optimitron/db/enums";

export const DEFAULT_TASK_IMPACT_FRAME = TaskImpactFrameKey.TWENTY_YEAR;

export interface TaskImpactMetricSummary {
  baseValue: number | null;
  displayGroup: string | null;
  highValue: number | null;
  lowValue: number | null;
  metadataJson: unknown;
  metricKey: string;
  summaryStatsJson: unknown;
  unit: string;
  valueJson: unknown;
}

export interface TaskImpactFrameSummary {
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
  metrics: TaskImpactMetricSummary[];
  successProbabilityBase: number | null;
  successProbabilityHigh: number | null;
  successProbabilityLow: number | null;
  summaryStatsJson: unknown;
  timeToImpactStartDays: number;
}

export interface TaskImpactEstimateSetSummary {
  assumptionsJson: unknown;
  calculationVersion: string;
  counterfactualKey: string;
  createdAt: Date;
  estimateKind: string;
  frames: TaskImpactFrameSummary[];
  id: string;
  isCurrent: boolean;
  methodologyKey: string;
  parameterSetHash: string;
  parameterInputsStale?: boolean;
  inputs?: Array<{
    parameterRevisionId: string;
    parameterRevision: {
      parameter: { currentRevisionId: string | null };
    };
  }>;
  publicationStatus: string;
  sourceArtifacts: TaskImpactSourceArtifactSummary[];
  sourceSystem: string;
}

export interface TaskImpactSourceArtifactSummary {
  isPrimary: boolean;
  sourceArtifact: {
    artifactType: string;
    contentHash: string | null;
    sourceKey: string;
    sourceRef: string | null;
    sourceSystem: string;
    sourceUrl: string | null;
    title: string | null;
    versionKey: string | null;
  };
}

export interface TaskImpactSelection {
  availableFrames: TaskImpactFrameSummary[];
  currentSet: Omit<TaskImpactEstimateSetSummary, "frames" | "inputs"> | null;
  metricsByKey: Record<string, TaskImpactMetricSummary>;
  selectedFrame: TaskImpactFrameSummary | null;
}

function normalizeFrameSlug(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

function toMetricMap(metrics: TaskImpactMetricSummary[]) {
  return Object.fromEntries(
    metrics.map((metric) => [metric.metricKey, metric]),
  );
}

export function getMetricBaseValue(
  metrics: TaskImpactMetricSummary[],
  metricKey: string,
) {
  return toMetricMap(metrics)[metricKey]?.baseValue ?? null;
}

export function selectImpactFrame(
  estimateSet: TaskImpactEstimateSetSummary | null | undefined,
  requestedFrame:
    | TaskImpactFrameKey
    | string
    | null
    | undefined = DEFAULT_TASK_IMPACT_FRAME,
): TaskImpactSelection {
  if (!estimateSet) {
    return {
      availableFrames: [],
      currentSet: null,
      metricsByKey: {},
      selectedFrame: null,
    };
  }

  const availableFrames = estimateSet.frames;
  const requestedSlug = normalizeFrameSlug(requestedFrame?.toString());

  const selectedFrame =
    availableFrames.find(
      (frame) => normalizeFrameSlug(frame.frameSlug) === requestedSlug,
    ) ??
    availableFrames.find((frame) => frame.frameKey === requestedFrame) ??
    availableFrames.find(
      (frame) => frame.frameKey === DEFAULT_TASK_IMPACT_FRAME,
    ) ??
    availableFrames[0] ??
    null;
  return {
    availableFrames,
    currentSet: {
      assumptionsJson: estimateSet.assumptionsJson,
      parameterInputsStale:
        estimateSet.inputs?.some(
          (input) =>
            input.parameterRevision.parameter.currentRevisionId != null &&
            input.parameterRevision.parameter.currentRevisionId !==
              input.parameterRevisionId,
        ) ?? false,
      calculationVersion: estimateSet.calculationVersion,
      counterfactualKey: estimateSet.counterfactualKey,
      createdAt: estimateSet.createdAt,
      estimateKind: estimateSet.estimateKind,
      id: estimateSet.id,
      isCurrent: estimateSet.isCurrent,
      methodologyKey: estimateSet.methodologyKey,
      parameterSetHash: estimateSet.parameterSetHash,
      publicationStatus: estimateSet.publicationStatus,
      sourceArtifacts: estimateSet.sourceArtifacts,
      sourceSystem: estimateSet.sourceSystem,
    },
    metricsByKey: selectedFrame ? toMetricMap(selectedFrame.metrics) : {},
    selectedFrame,
  };
}

export function deriveImpactRatios(
  frame: TaskImpactFrameSummary | null | undefined,
) {
  if (!frame) {
    return {
      costPerDalyUsd: null,
      expectedValuePerDollar: null,
      expectedValuePerHourDalys: null,
      expectedValuePerHourUsd: null,
    };
  }

  const effortHours = Math.max(frame.estimatedEffortHoursBase ?? 0, 0.0001);
  const rawCostUsd = frame.estimatedCashCostUsdBase ?? 0;
  // Clamp magnitude away from zero so expectedValuePerDollar stays finite, but
  // preserve sign so net-negative costs (e.g. treaty peace dividend) flow through.
  const costUsd = Math.abs(rawCostUsd) < 0.0001 ? 0.0001 : rawCostUsd;

  const expectedValuePerHourDalys =
    (frame.expectedDalysAvertedBase ?? 0) / effortHours;
  const expectedValuePerHourUsd =
    (frame.expectedEconomicValueUsdBase ?? 0) / effortHours;
  const expectedValuePerDollar =
    (frame.expectedEconomicValueUsdBase ?? 0) / costUsd;
  const costPerDalyUsd =
    (frame.expectedDalysAvertedBase ?? 0) > 0
      ? (frame.estimatedCashCostUsdBase ?? 0) /
        (frame.expectedDalysAvertedBase ?? 0)
      : null;

  return {
    costPerDalyUsd,
    expectedValuePerDollar,
    expectedValuePerHourDalys,
    expectedValuePerHourUsd,
  };
}

type NumericFrameKey =
  | "delayDalysLostPerDayBase"
  | "delayDalysLostPerDayHigh"
  | "delayDalysLostPerDayLow"
  | "delayEconomicValueUsdLostPerDayBase"
  | "delayEconomicValueUsdLostPerDayHigh"
  | "delayEconomicValueUsdLostPerDayLow"
  | "estimatedCashCostUsdBase"
  | "estimatedCashCostUsdHigh"
  | "estimatedCashCostUsdLow"
  | "estimatedEffortHoursBase"
  | "estimatedEffortHoursHigh"
  | "estimatedEffortHoursLow"
  | "expectedDalysAvertedBase"
  | "expectedDalysAvertedHigh"
  | "expectedDalysAvertedLow"
  | "expectedEconomicValueUsdBase"
  | "expectedEconomicValueUsdHigh"
  | "expectedEconomicValueUsdLow"
  | "medianHealthyLifeYearsEffectBase"
  | "medianHealthyLifeYearsEffectHigh"
  | "medianHealthyLifeYearsEffectLow"
  | "medianIncomeGrowthEffectPpPerYearBase"
  | "medianIncomeGrowthEffectPpPerYearHigh"
  | "medianIncomeGrowthEffectPpPerYearLow"
  | "successProbabilityBase"
  | "successProbabilityHigh"
  | "successProbabilityLow";

// successProbability* is deliberately absent: probabilities are not additive
// across sibling shares or merged frames. Scaling them produced per-child
// values like 0.01/202; probability keys pass through unchanged instead.
const ADDITIVE_FRAME_KEYS: NumericFrameKey[] = [
  "delayDalysLostPerDayBase",
  "delayDalysLostPerDayHigh",
  "delayDalysLostPerDayLow",
  "delayEconomicValueUsdLostPerDayBase",
  "delayEconomicValueUsdLostPerDayHigh",
  "delayEconomicValueUsdLostPerDayLow",
  "estimatedCashCostUsdBase",
  "estimatedCashCostUsdHigh",
  "estimatedCashCostUsdLow",
  "estimatedEffortHoursBase",
  "estimatedEffortHoursHigh",
  "estimatedEffortHoursLow",
  "expectedDalysAvertedBase",
  "expectedDalysAvertedHigh",
  "expectedDalysAvertedLow",
  "expectedEconomicValueUsdBase",
  "expectedEconomicValueUsdHigh",
  "expectedEconomicValueUsdLow",
  "medianHealthyLifeYearsEffectBase",
  "medianHealthyLifeYearsEffectHigh",
  "medianHealthyLifeYearsEffectLow",
  "medianIncomeGrowthEffectPpPerYearBase",
  "medianIncomeGrowthEffectPpPerYearHigh",
  "medianIncomeGrowthEffectPpPerYearLow",
];

function scaleValue(value: number | null | undefined, factor: number) {
  return value == null ? null : value * factor;
}

function sumValues(values: Array<number | null | undefined>) {
  const presentValues = values.filter(
    (value): value is number => value != null,
  );
  if (presentValues.length === 0) {
    return null;
  }

  return presentValues.reduce((sum, value) => sum + value, 0);
}

export function scaleImpactFrameSummary(
  frame: TaskImpactFrameSummary,
  factor: number,
  overrides?: Partial<TaskImpactFrameSummary>,
): TaskImpactFrameSummary {
  const scaled = { ...frame };

  for (const key of ADDITIVE_FRAME_KEYS) {
    scaled[key] = scaleValue(
      frame[key],
      factor,
    ) as TaskImpactFrameSummary[typeof key];
  }

  return {
    ...scaled,
    customFrameLabel:
      overrides?.customFrameLabel ??
      frame.customFrameLabel ??
      `Scaled ${frame.frameSlug}`,
    metrics: overrides?.metrics ?? frame.metrics,
    summaryStatsJson: overrides?.summaryStatsJson ?? frame.summaryStatsJson,
    ...overrides,
  };
}

export interface ParentContributionShare {
  haleShare: number | null;
  incomeShare: number | null;
}

export function computeParentContributionShare(
  parent: TaskImpactFrameSummary | null | undefined,
  child: TaskImpactFrameSummary | null | undefined,
): ParentContributionShare {
  const parentHale = parent?.medianHealthyLifeYearsEffectBase ?? null;
  const childHale = child?.medianHealthyLifeYearsEffectBase ?? null;
  const parentIncome = parent?.medianIncomeGrowthEffectPpPerYearBase ?? null;
  const childIncome = child?.medianIncomeGrowthEffectPpPerYearBase ?? null;

  return {
    haleShare:
      parentHale != null && parentHale !== 0 && childHale != null
        ? childHale / parentHale
        : null,
    incomeShare:
      parentIncome != null && parentIncome !== 0 && childIncome != null
        ? childIncome / parentIncome
        : null,
  };
}

export function sumImpactFrameSummaries(
  frames: TaskImpactFrameSummary[],
  overrides?: Partial<TaskImpactFrameSummary>,
): TaskImpactFrameSummary | null {
  if (frames.length === 0) {
    return null;
  }

  const seed = frames[0]!;
  const merged = { ...seed };

  for (const key of ADDITIVE_FRAME_KEYS) {
    merged[key] = sumValues(
      frames.map((frame) => frame[key]),
    ) as TaskImpactFrameSummary[typeof key];
  }

  return {
    ...merged,
    customFrameLabel:
      overrides?.customFrameLabel ??
      seed.customFrameLabel ??
      "Aggregated impact",
    metrics: overrides?.metrics ?? [],
    summaryStatsJson: overrides?.summaryStatsJson ?? null,
    ...overrides,
  };
}

function normalizeLog(value: number, logScale: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(1, Math.log10(value + 1) / logScale);
}

export function getNormalizedImpactComponents(
  frame: TaskImpactFrameSummary | null | undefined,
) {
  if (!frame) {
    return {
      actorHourComponent: 0,
      delayComponent: 0,
      economicComponent: 0,
      healthComponent: 0,
    };
  }

  const derived = deriveImpactRatios(frame);
  const healthComponent = normalizeLog(
    derived.expectedValuePerHourDalys ?? 0,
    6,
  );
  const economicComponent = normalizeLog(
    derived.expectedValuePerHourUsd ?? 0,
    12,
  );
  const delayComponent = Math.max(
    normalizeLog(frame.delayDalysLostPerDayBase ?? 0, 6),
    normalizeLog(frame.delayEconomicValueUsdLostPerDayBase ?? 0, 12),
  );

  return {
    actorHourComponent: Math.max(healthComponent, economicComponent),
    delayComponent,
    economicComponent,
    healthComponent,
  };
}

export function scoreImpactFrame(
  frame: TaskImpactFrameSummary | null | undefined,
) {
  if (!frame) {
    return 0.35;
  }

  const { delayComponent, economicComponent, healthComponent } =
    getNormalizedImpactComponents(frame);

  return (healthComponent + economicComponent + delayComponent) / 3;
}

export function getPrimarySourceArtifact(
  sourceArtifacts: TaskImpactSourceArtifactSummary[],
) {
  return (
    sourceArtifacts.find((entry) => entry.isPrimary)?.sourceArtifact ??
    sourceArtifacts[0]?.sourceArtifact ??
    null
  );
}
