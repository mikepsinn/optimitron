import { TaskClaimPolicy, TaskImpactFrameKey } from "@optimitron/db";
import type {
  ParameterExport,
  ParameterExportEntry,
  PolicyModelCompileConfig,
} from "./parameter-export-to-policy-model";
import {
  ParameterExportSchema,
  buildPolicyModelRunFromParameterExport,
} from "./parameter-export-to-policy-model";
import type { NumericEstimate, PolicyModelMetric, PolicyModelRun } from "./policy-model-run";

const MANUAL_TREATY_IMPACT_URL =
  "https://manual.WarOnDisease.org/knowledge/economics/1-pct-treaty-impact.html";
const MANUAL_EARTH_OPTIMIZATION_PRIZE_URL =
  "https://manual.WarOnDisease.org/knowledge/strategy/earth-optimization-prize.html";
const MANUAL_PERSONAL_BENEFITS_URL =
  "https://manual.WarOnDisease.org/knowledge/call-to-action/your-personal-benefits.html";
const MANUAL_PEACE_DIVIDEND_URL =
  "https://manual.WarOnDisease.org/knowledge/economics/peace-dividend.html";

const SIGNER_EFFORT_HOURS = 30 / 3600;

function getRequiredParameter(
  exportData: ParameterExport,
  parameterKey: string,
) {
  const entry = exportData.parameters[parameterKey];

  if (!entry) {
    throw new Error(`Missing required treaty parameter: ${parameterKey}`);
  }

  return entry;
}

function estimateFromEntry(
  entry: ParameterExportEntry,
  options?: {
    multiplier?: number;
  },
): NumericEstimate {
  const multiplier = options?.multiplier ?? 1;

  return {
    base: entry.value * multiplier,
    high: entry.confidenceInterval?.[1] != null ? entry.confidenceInterval[1] * multiplier : null,
    low: entry.confidenceInterval?.[0] != null ? entry.confidenceInterval[0] * multiplier : null,
  };
}

function estimateFromScalar(
  base: number,
  options?: {
    high?: number | null;
    low?: number | null;
  },
): NumericEstimate {
  return {
    base,
    high: options?.high ?? null,
    low: options?.low ?? null,
  };
}

function multiplyEstimate(
  left: NumericEstimate,
  right: NumericEstimate,
): NumericEstimate {
  const leftBase = left.base ?? 0;
  const rightBase = right.base ?? 0;
  const leftLow = left.low ?? leftBase;
  const leftHigh = left.high ?? leftBase;
  const rightLow = right.low ?? rightBase;
  const rightHigh = right.high ?? rightBase;

  return {
    base: leftBase * rightBase,
    high: leftHigh * rightHigh,
    low: leftLow * rightLow,
  };
}

function divideEstimate(estimate: NumericEstimate, divisor: number): NumericEstimate {
  if (divisor <= 0) {
    return {
      base: null,
      high: null,
      low: null,
    };
  }

  return {
    base: estimate.base != null ? estimate.base / divisor : null,
    high: estimate.high != null ? estimate.high / divisor : null,
    low: estimate.low != null ? estimate.low / divisor : null,
  };
}

function sumEntries(
  ...entries: Array<ParameterExportEntry>
): NumericEstimate {
  return entries.reduce<NumericEstimate>(
    (accumulator, entry) => {
      const estimate = estimateFromEntry(entry);

      return {
        base: (accumulator.base ?? 0) + (estimate.base ?? 0),
        high:
          accumulator.high == null && estimate.high == null
            ? null
            : (accumulator.high ?? accumulator.base ?? 0) + (estimate.high ?? estimate.base ?? 0),
        low:
          accumulator.low == null && estimate.low == null
            ? null
            : (accumulator.low ?? accumulator.base ?? 0) + (estimate.low ?? estimate.base ?? 0),
      };
    },
    { base: 0, high: 0, low: 0 },
  );
}

function numericMetric(
  entry: ParameterExportEntry,
  metricKey: string,
  displayName: string,
  options?: {
    displayGroup?: string | null;
    multiplier?: number;
  },
): PolicyModelMetric {
  return {
    chapterUrl: entry.chapterUrl ?? null,
    description: entry.description,
    displayGroup: options?.displayGroup ?? null,
    displayName,
    estimate: estimateFromEntry(entry, { multiplier: options?.multiplier }),
    key: metricKey,
    sourceArtifactKeys: [],
    summaryStats: null,
    unit: entry.unit ?? "unitless",
    valueKind: "numeric",
  };
}

function computedMetric(
  metricKey: string,
  displayName: string,
  unit: string,
  estimate: NumericEstimate,
  options?: {
    chapterUrl?: string | null;
    description?: string | null;
    displayGroup?: string | null;
  },
): PolicyModelMetric {
  return {
    chapterUrl: options?.chapterUrl ?? null,
    description: options?.description ?? null,
    displayGroup: options?.displayGroup ?? null,
    displayName,
    estimate,
    key: metricKey,
    sourceArtifactKeys: [],
    summaryStats: null,
    unit,
    valueKind: "numeric",
  };
}

function numericMetricBinding(
  key: string,
  displayName: string,
  parameterKey: string,
  displayGroup: string,
) {
  return {
    displayGroup,
    displayName,
    key,
    parameterKey,
    valueKind: "numeric" as const,
  };
}

export function createOnePercentTreatyCompileConfig(input: {
  calculationVersion: string;
  generatedAt: string;
  jurisdictionId?: string;
  jurisdictionName?: string;
  parameterSetHash: string;
}): PolicyModelCompileConfig {
  const jurisdictionId = input.jurisdictionId ?? "usa-federal";
  const jurisdictionName = input.jurisdictionName ?? "United States";

  return {
    blockingFactors: ["political"],
    calculationVersion: input.calculationVersion,
    counterfactualKey: "current-policy-baseline",
    defaultFrameKey: TaskImpactFrameKey.TWENTY_YEAR,
    evidenceClaims: [
      {
        claimKey: "claim:treaty-expands-trial-capacity",
        confidence: "high",
        sourceArtifactKeys: [`manual-section:${MANUAL_TREATY_IMPACT_URL}`],
        supportsKeys: ["canonical.expectedDalysAverted", "trial_capacity_multiplier"],
        summary: "Redirecting 1% of global military spending materially expands pragmatic trial capacity.",
      },
      {
        claimKey: "claim:treaty-feasible-precedent",
        confidence: "medium",
        sourceArtifactKeys: ["external-source:icbl-ottawa-treaty"],
        supportsKeys: ["canonical.successProbability"],
        summary: "The Ottawa Treaty shows that focused treaty campaigns can move from fringe activism to multistate adoption quickly.",
      },
    ],
    executionHints: {
      decompositionNotes:
        "Treat the signer task as the public blocker page. Public pressure should happen by sharing the blocker page and contacting the assigned official until they sign.",
      parentTaskDescription:
        "Secure United States signature and sustained implementation of the 1% Treaty that redirects 1% of military spending to clinical trials and disease eradication.",
      parentTaskTitle: "President of the United States signs the 1% Treaty",
      supporterLevers: ["coalition", "media", "legislation", "public pressure", "diplomacy"],
      targetActors: [
        {
          actorKey: "person:president-of-the-united-states",
          claimPolicyHint: TaskClaimPolicy.ASSIGNED_ONLY,
          contactLabel: "White House contact form",
          contactTemplate:
            "Please complete \"{{taskTitle}}\". This task is already {{delayLabel}}. Estimated delay cost so far: {{humanLives}} lives, {{sufferingHours}} suffering hours, and {{economicLoss}}.",
          contactUrl: "https://www.whitehouse.gov/contact/",
          currentAffiliation: "United States Government",
          displayName: "President of the United States",
          organizationKey: "organization:united-states-government",
          organizationName: "United States Government",
          organizationType: "GOVERNMENT",
          roleTitle: "President",
          role: "decision_maker",
        },
      ],
    },
    frames: [
      {
        adoptionRampYears: 4,
        annualDiscountRate: 0.03,
        benefitDurationYears: 20,
        canonicalBindings: {
          estimatedCashCostUsd: {
            parameterKey: "TREATY_CAMPAIGN_TOTAL_COST",
          },
          expectedDalysAverted: {
            parameterKey: "CONTRIBUTION_DALYS_PER_PCT_POINT",
          },
          medianHealthyLifeYearsEffect: {
            parameterKey: "TREATY_HALE_GAIN_YEAR_15",
          },
          successProbability: {
            parameterKey: "POLITICAL_SUCCESS_PROBABILITY",
          },
        },
        evaluationHorizonYears: 20,
        frameKey: TaskImpactFrameKey.TWENTY_YEAR,
        frameSlug: "twenty-year",
        metricBindings: [
          numericMetricBinding(
            "trial_capacity_multiplier",
            "Trial capacity multiplier",
            "DFDA_TRIAL_CAPACITY_MULTIPLIER",
            "operations",
          ),
          numericMetricBinding(
            "lives_saved_if_success",
            "Lives saved if treaty succeeds",
            "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED",
            "health",
          ),
          numericMetricBinding(
            "contribution_lives_saved_per_pct_point",
            "Expected lives saved",
            "CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT",
            "health",
          ),
          numericMetricBinding(
            "suffering_hours_if_success",
            "Suffering hours eliminated if treaty succeeds",
            "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS",
            "health",
          ),
          numericMetricBinding(
            "contribution_suffering_hours_per_pct_point",
            "Expected suffering hours eliminated",
            "CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT",
            "health",
          ),
          numericMetricBinding(
            "risk_adjusted_cost_per_daly_usd",
            "Expected cost per DALY",
            "TREATY_EXPECTED_COST_PER_DALY",
            "economics",
          ),
          numericMetricBinding(
            "conditional_cost_per_daly_usd",
            "Conditional cost per DALY",
            "TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
            "economics",
          ),
          numericMetricBinding(
            "treaty_expected_roi_trial_capacity_plus_efficacy_lag",
            "Expected ROI",
            "TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
            "economics",
          ),
          numericMetricBinding(
            "treaty_cumulative_20yr_with_ratchet",
            "20-year treaty funding with ratchet",
            "TREATY_CUMULATIVE_20YR_WITH_RATCHET",
            "economics",
          ),
          numericMetricBinding(
            "treaty_personal_upside_blend",
            "Personal upside blend",
            "TREATY_PERSONAL_UPSIDE_BLEND",
            "personal",
          ),
          numericMetricBinding(
            "median_real_income_npv_usd",
            "Lifetime income gain per capita",
            "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA",
            "personal",
          ),
          numericMetricBinding(
            "median_healthy_life_years_gained",
            "HALE gain by year 15",
            "TREATY_HALE_GAIN_YEAR_15",
            "personal",
          ),
          numericMetricBinding(
            "treaty_lives_saved_annual_global",
            "Annual global lives saved",
            "TREATY_LIVES_SAVED_ANNUAL_GLOBAL",
            "health",
          ),
          numericMetricBinding(
            "treaty_qalys_gained_annual_global",
            "Annual global QALYs gained",
            "TREATY_QALYS_GAINED_ANNUAL_GLOBAL",
            "health",
          ),
          numericMetricBinding(
            "years_of_research_accelerated",
            "Years of research acceleration",
            "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
            "operations",
          ),
        ],
        timeToImpactStartDays: 365,
      },
    ],
    generatedAt: input.generatedAt,
    generator: {
      kind: "manual_python",
      model: "dih_models/parameters.py",
      notes:
        "Compiled from disease-eradication-plan parameter export with treaty-specific post-processing for risk-adjusted impact and delay metrics.",
    },
    includedParameterKeys: [
      "CONTRIBUTION_DALYS_PER_PCT_POINT",
      "CONTRIBUTION_LIVES_SAVED_PER_PCT_POINT",
      "CONTRIBUTION_SUFFERING_HOURS_PER_PCT_POINT",
      "DFDA_TRIAL_CAPACITY_MULTIPLIER",
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS",
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE",
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED",
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS",
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS",
      "POLITICAL_SUCCESS_PROBABILITY",
      "TREATY_CAMPAIGN_DURATION_YEARS",
      "TREATY_CAMPAIGN_TOTAL_COST",
      "TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
      "TREATY_CUMULATIVE_20YR_WITH_RATCHET",
      "TREATY_EXPECTED_COST_PER_DALY",
      "TREATY_EXPECTED_ROI_TRIAL_CAPACITY_PLUS_EFFICACY_LAG",
      "TREATY_HALE_GAIN_YEAR_15",
      "TREATY_LIVES_SAVED_ANNUAL_GLOBAL",
      "TREATY_PEACE_RECOVERY_GDP_GROWTH_BONUS_YEAR_20",
      "TREATY_CYBERCRIME_RECOVERY_GDP_GROWTH_BONUS_YEAR_20",
      "TREATY_HEALTH_RECOVERY_GDP_GROWTH_BONUS_YEAR_20",
      "TREATY_PERSONAL_UPSIDE_BLEND",
      "TREATY_QALYS_GAINED_ANNUAL_GLOBAL",
      "TREATY_REDIRECT_GDP_GROWTH_BONUS_YEAR_20",
      "TREATY_TOTAL_ANNUAL_COSTS",
      "TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA",
    ],
    methodologyKey: "one-percent-treaty-impact-compiler",
    modelKey: `policy:${jurisdictionId}:one-percent-treaty`,
    parameterSetHash: input.parameterSetHash,
    policy: {
      jurisdictionId,
      jurisdictionName,
      policyId: "one-percent-treaty",
      policyName: "1% Treaty",
      policyType: "treaty",
      recommendedTarget: "signs the treaty",
      summary:
        "Redirect 1% of military spending to pragmatic clinical trials and disease eradication funding through a binding treaty commitment.",
      tags: ["treaty", "clinical-trials", "disease-eradication", "peace-dividend"],
    },
    summary:
      "Treaty impact model compiled from the disease-eradication-plan parameter export, including risk-adjusted DALYs, economic value, and delay-sensitive accountability metrics.",
    title: "1% Treaty Impact Model",
  };
}

export function buildOnePercentTreatyPolicyModelRun(
  rawExport: ParameterExport,
  options: {
    calculationVersion: string;
    generatedAt: string;
    jurisdictionId?: string;
    jurisdictionName?: string;
    parameterSetHash: string;
  },
): PolicyModelRun {
  const exportData = ParameterExportSchema.parse(rawExport);
  const run = buildPolicyModelRunFromParameterExport(
    exportData,
    createOnePercentTreatyCompileConfig(options),
  );
  const frame = run.frames.find((entry) => entry.frameKey === TaskImpactFrameKey.TWENTY_YEAR);

  if (!frame) {
    throw new Error("Treaty compiler expected a TWENTY_YEAR frame.");
  }

  const grossDalys = estimateFromEntry(
    getRequiredParameter(exportData, "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS"),
  );
  const grossEconomicValue = estimateFromEntry(
    getRequiredParameter(exportData, "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE"),
  );
  const successProbability = estimateFromEntry(
    getRequiredParameter(exportData, "POLITICAL_SUCCESS_PROBABILITY"),
  );
  const expectedDalysAverted = multiplyEstimate(grossDalys, successProbability);
  const expectedEconomicValueUsd = multiplyEstimate(grossEconomicValue, successProbability);
  const campaignCost = estimateFromEntry(
    getRequiredParameter(exportData, "TREATY_CAMPAIGN_TOTAL_COST"),
  );
  const totalGrowthBonusYear20 = sumEntries(
    getRequiredParameter(exportData, "TREATY_REDIRECT_GDP_GROWTH_BONUS_YEAR_20"),
    getRequiredParameter(exportData, "TREATY_PEACE_RECOVERY_GDP_GROWTH_BONUS_YEAR_20"),
    getRequiredParameter(exportData, "TREATY_CYBERCRIME_RECOVERY_GDP_GROWTH_BONUS_YEAR_20"),
    getRequiredParameter(exportData, "TREATY_HEALTH_RECOVERY_GDP_GROWTH_BONUS_YEAR_20"),
  );
  const evaluationDays = frame.evaluationHorizonYears * 365.25;
  const delayDalysLostPerDay = divideEstimate(expectedDalysAverted, evaluationDays);
  const delayEconomicValueUsdLostPerDay = divideEstimate(expectedEconomicValueUsd, evaluationDays);

  frame.canonical.delayDalysLostPerDay = delayDalysLostPerDay;
  frame.canonical.delayEconomicValueUsdLostPerDay = delayEconomicValueUsdLostPerDay;
  frame.canonical.estimatedCashCostUsd = campaignCost;
  frame.canonical.estimatedEffortHours = estimateFromScalar(SIGNER_EFFORT_HOURS);
  frame.canonical.expectedDalysAverted = expectedDalysAverted;
  frame.canonical.expectedEconomicValueUsd = expectedEconomicValueUsd;
  frame.canonical.medianIncomeGrowthEffectPpPerYear = estimateFromScalar(
    (totalGrowthBonusYear20.base ?? 0) * 100,
    {
      high:
        totalGrowthBonusYear20.high != null
          ? totalGrowthBonusYear20.high * 100
          : null,
      low:
        totalGrowthBonusYear20.low != null
          ? totalGrowthBonusYear20.low * 100
          : null,
    },
  );

  const opportunityMetrics: PolicyModelMetric[] = [
    computedMetric(
      "expected_value_per_hour_dalys",
      "Expected DALYs averted per actor hour",
      "DALYs/hour",
      divideEstimate(expectedDalysAverted, SIGNER_EFFORT_HOURS),
      {
        chapterUrl: MANUAL_EARTH_OPTIMIZATION_PRIZE_URL,
        description:
          "Risk-adjusted expected DALYs averted divided by the signer’s estimated effort.",
        displayGroup: "operations",
      },
    ),
    computedMetric(
      "expected_value_per_hour_usd",
      "Expected economic value per actor hour",
      "USD/hour",
      divideEstimate(expectedEconomicValueUsd, SIGNER_EFFORT_HOURS),
      {
        chapterUrl: MANUAL_EARTH_OPTIMIZATION_PRIZE_URL,
        description:
          "Risk-adjusted expected economic value divided by the signer’s estimated effort.",
        displayGroup: "operations",
      },
    ),
    computedMetric(
      "delay_dalys_lost_per_day",
      "DALYs lost per day of delay",
      "DALYs/day",
      delayDalysLostPerDay,
      {
        chapterUrl: MANUAL_TREATY_IMPACT_URL,
        description:
          "Approximate DALYs lost when the treaty is delayed by one day over the selected horizon.",
        displayGroup: "urgency",
      },
    ),
    computedMetric(
      "delay_economic_value_usd_lost_per_day",
      "Economic value lost per day of delay",
      "USD/day",
      delayEconomicValueUsdLostPerDay,
      {
        chapterUrl: MANUAL_TREATY_IMPACT_URL,
        description:
          "Approximate economic value lost when the treaty is delayed by one day over the selected horizon.",
        displayGroup: "urgency",
      },
    ),
    computedMetric(
      "total_gdp_growth_bonus_year_20_pp",
      "Total GDP growth bonus by year 20",
      "percentage-points/year",
      frame.canonical.medianIncomeGrowthEffectPpPerYear,
      {
        chapterUrl: MANUAL_PEACE_DIVIDEND_URL,
        description:
          "Combined year-20 growth uplift from redirect, peace, cybercrime, and health channels.",
        displayGroup: "economics",
      },
    ),
  ];

  frame.metrics.push(...opportunityMetrics);

  return run;
}
