import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  fetchers,
  getVariableRegistry,
  getVariableById,
  type DataPoint,
  type FetchOptions,
  type VariableTemporalFillingType,
  type VariableRegistryEntry,
  type SparseOutcomeProfile,
} from "@optimitron/data";
import {
  alignTimeSeries,
  buildAdaptiveNumericBins,
  deriveSupportConstrainedTargets,
  estimateDiminishingReturns,
  estimateMinimumEffectiveDose,
  rankPredictorsForOutcome,
  estimateSaturationRange,
  runVariableRelationshipAnalysis,
  assessSparseOutcomeSupport,
  type AlignedPair,
  type DiminishingReturnsEstimate,
  type MinimumEffectiveDoseEstimate,
  type OutcomeMegaStudyRanking,
  type OutcomeRankingCandidate,
  type SaturationRangeEstimate,
  type SupportConstrainedTargetsEstimate,
  type SparseOutcomeDiagnostics,
  type TimeSeries,
} from "@optimitron/optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, "../../output/mega-studies");
const DEFAULT_CACHE_DIR = path.resolve(__dirname, "../../output/.cache/mega-study-data");
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
export const DEFAULT_REPORT_OUTCOME_IDS = [
  "outcome.derived.after_tax_median_income_ppp",
  "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
  "outcome.who.healthy_life_expectancy_years",
  "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
  "outcome.wb.primary_completion_rate_pct",
  "outcome.wb.battle_related_deaths",
  "outcome.who.ncd_mortality_rate",
  "outcome.wb.maternal_mortality_per_100k",
  "outcome.derived.battle_related_deaths_per_100k",
  "outcome.wb.under_five_mortality_per_1000",
] as const;

type TemporalProfileSource = "pair_override" | "predictor_default" | "global_fallback";
type PairActionabilityStatus = "actionable" | "exploratory";
type PairQualityTier = "strong" | "moderate" | "exploratory" | "insufficient";
type DataSufficiencyStatus = "sufficient" | "insufficient_data";
type ReliabilityBand = "high" | "moderate" | "low";
type DecisionTargetSource = "support_constrained" | "robust_fallback" | "unavailable";
type OutcomeRole = "direct_kpi" | "guardrail_kpi" | "context_kpi";
type TailMarginalSignal = "positive" | "near_zero" | "negative" | "insufficient";
type TaxpayerReturnBenchmark =
  | "extra_spending_has_signal"
  | "no_clear_marginal_gain"
  | "possible_harm"
  | "insufficient";

export type GateVerdict =
  | "pass"
  | "insufficient_data"
  | "weak_signal"
  | "adverse_signal"
  | "sparse_outcome"
  | "no_profile";

export interface StageGateResult {
  stage: "direct_mission" | "welfare_guardrail";
  verdict: GateVerdict;
  reasons: string[];
  outcomeId: string | null;
  reliabilityScore: number | null;
  direction: "positive" | "negative" | "neutral" | null;
}

export interface TwoStageGateResult {
  directMission: StageGateResult;
  welfareGuardrail: StageGateResult;
  overallEligible: boolean;
  suppressLargeScaleUp: boolean;
  plainLanguageGuidance: string;
}

interface PredictorObjectiveProfile {
  directOutcomeIds: readonly string[];
  guardrailOutcomeIds: readonly string[];
  notes?: readonly string[];
  coverageGaps?: readonly string[];
}

interface PairMarginalTradeoffDiagnostics {
  segmentCount: number;
  normalizedPreKneeSlope: number | null;
  normalizedPostKneeSlope: number | null;
  normalizedTailSlope: number | null;
  tailSignal: TailMarginalSignal;
  taxpayerReturnBenchmark: TaxpayerReturnBenchmark;
}

const PREDICTOR_OBJECTIVE_PROFILES: Readonly<Record<string, PredictorObjectiveProfile>> = {
  "predictor.derived.gov_health_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.who.healthy_life_expectancy_years",
      "outcome.who.ncd_mortality_rate",
      "outcome.wb.under_five_mortality_per_1000",
      "outcome.wb.maternal_mortality_per_100k",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
    ],
  },
  "predictor.derived.education_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.wb.primary_completion_rate_pct",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
    notes: [
      "Direct KPI currently uses primary completion rates; add learning-score KPIs when available.",
    ],
  },
  "predictor.derived.rd_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
    ],
    guardrailOutcomeIds: [
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
  },
  "predictor.derived.military_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.wb.battle_related_deaths",
      "outcome.derived.battle_related_deaths_per_100k",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
    notes: [
      "Direct KPI currently uses battle-related deaths; add foreign-attack/security KPIs when available.",
    ],
    coverageGaps: [
      "No global foreign-attack or territorial-security KPI available.",
    ],
  },
  "predictor.derived.gov_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.who.healthy_life_expectancy_years",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
  },
  "predictor.derived.gov_non_military_expenditure_per_capita_ppp": {
    directOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.who.healthy_life_expectancy_years",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
  },
  "predictor.derived.gov_health_share_of_gov_expenditure_pct": {
    directOutcomeIds: [
      "outcome.who.healthy_life_expectancy_years",
      "outcome.who.ncd_mortality_rate",
      "outcome.wb.under_five_mortality_per_1000",
      "outcome.wb.maternal_mortality_per_100k",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
    ],
  },
  "predictor.derived.education_share_of_gov_expenditure_pct": {
    directOutcomeIds: [
      "outcome.wb.primary_completion_rate_pct",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
    notes: [
      "Direct KPI currently uses primary completion rates; add learning-score KPIs when available.",
    ],
  },
  "predictor.derived.rd_share_of_gov_expenditure_pct": {
    directOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
    ],
    guardrailOutcomeIds: [
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
  },
  "predictor.derived.military_share_of_gov_expenditure_pct": {
    directOutcomeIds: [
      "outcome.wb.battle_related_deaths",
      "outcome.derived.battle_related_deaths_per_100k",
    ],
    guardrailOutcomeIds: [
      "outcome.derived.after_tax_median_income_ppp",
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      "outcome.who.healthy_life_expectancy_years",
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
    ],
    notes: [
      "Direct KPI currently uses battle-related deaths; add foreign-attack/security KPIs when available.",
    ],
    coverageGaps: [
      "No global foreign-attack or territorial-security KPI available.",
    ],
  },
};

const PAIR_TEMPORAL_OVERRIDES: Readonly<Record<string, Omit<ResolvedTemporalProfile, "source">>> = {
  "predictor.wb.gov_health_expenditure_pct_gdp::outcome.who.healthy_life_expectancy_years": {
    lagYears: 2,
    durationYears: 5,
    fillingType: "interpolation",
  },
  "predictor.wb.gov_health_expenditure_pct_gdp::outcome.derived.healthy_life_expectancy_growth_yoy_pct": {
    lagYears: 2,
    durationYears: 3,
    fillingType: "interpolation",
  },
  "predictor.wb.education_expenditure_pct_gdp::outcome.derived.after_tax_median_income_ppp": {
    lagYears: 3,
    durationYears: 5,
    fillingType: "interpolation",
  },
  "predictor.wb.education_expenditure_pct_gdp::outcome.derived.after_tax_median_income_ppp_growth_yoy_pct": {
    lagYears: 2,
    durationYears: 3,
    fillingType: "interpolation",
  },
};

const SUFFICIENCY_THRESHOLDS = {
  minSubjects: 40,
  minPairs: 2000,
  minTemporalCandidatesWithResults: 2,
  minBins: 6,
} as const;

export interface MegaStudyGenerationOptions {
  outputDir?: string;
  writeFiles?: boolean;
  logProgress?: boolean;
  period?: { startYear: number; endYear: number };
  jurisdictions?: string[];
  minimumPairs?: number;
  minimumMeasurementsPerSeries?: number;
  topSubjectsPerPair?: number;
  outcomeIds?: string[];
  useDataCache?: boolean;
  cacheDir?: string;
  maxCacheAgeHours?: number;
}

interface PairSubjectSummary {
  subjectId: string;
  forwardPearson: number;
  predictivePearson: number;
  effectSize: number;
  numberOfPairs: number;
}

export interface PairAlignedPoint {
  subjectId: string;
  predictorValue: number;
  outcomeValue: number;
  predictorTimestamp?: number;
  outcomeTimestamp?: number;
}

export interface PppPerCapitaSummary {
  samplePairs: number;
  medianGdpPerCapitaPpp: number | null;
  estimatedBestPerCapitaPpp: number | null;
  bestObservedPerCapitaPppRange: string | null;
  bestObservedPerCapitaPppMean: number | null;
  bestObservedPerCapitaPppMedian: number | null;
}

export interface DistributionBucket {
  lowerBound: number;
  upperBound: number;
  isUpperInclusive: boolean;
  count: number;
}

export interface PairBinSummaryRow {
  binIndex: number;
  label: string;
  lowerBound: number;
  upperBound: number;
  isUpperInclusive: boolean;
  pairs: number;
  subjects: number;
  predictorMean: number | null;
  predictorMedian: number | null;
  outcomeMean: number | null;
  outcomeMedian: number | null;
}

export interface PairTemporalSensitivityRow {
  lagYears: number;
  durationYears: number;
  source: TemporalProfileSource;
  fillingType: VariableTemporalFillingType;
  fillingValue: number | null;
  score: number;
  scoreDeltaFromBest: number;
  includedSubjects: number;
  totalPairs: number;
}

export interface PairRobustnessSummary {
  trimLowerQuantile: number;
  trimUpperQuantile: number;
  rawPairCount: number;
  trimmedPairCount: number;
  retainedFraction: number;
  rawBestObservedRange: string | null;
  robustBestObservedRange: string | null;
  rawBestOutcomeMean: number | null;
  robustBestOutcomeMean: number | null;
  rawOptimalValue: number | null;
  robustOptimalValue: number | null;
  optimalDeltaAbsolute: number | null;
  optimalDeltaPercent: number | null;
}

export interface PairQualitySignalInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregateForwardPearson?: number;
  aggregatePredictivePearson: number;
  maxSubjectDirectionalScore?: number;
  predictorObservedMin?: number | null;
  predictorObservedMax?: number | null;
  aggregateValuePredictingHighOutcome?: number | null;
  aggregateValuePredictingLowOutcome?: number | null;
  aggregateOptimalDailyValue?: number | null;
}

export interface PairResponseCurveDiagnostics {
  diminishingReturns: DiminishingReturnsEstimate;
  minimumEffectiveDose: MinimumEffectiveDoseEstimate;
  saturationRange: SaturationRangeEstimate;
  supportConstrainedTargets: SupportConstrainedTargetsEstimate;
}

export interface PairDataSufficiency {
  status: DataSufficiencyStatus;
  reasons: string[];
  thresholds: {
    minSubjects: number;
    minPairs: number;
    minTemporalCandidatesWithResults: number;
    minBins: number;
  };
}

export interface PairReliability {
  overallScore: number;
  band: ReliabilityBand;
  components: {
    support: number;
    significance: number;
    directional: number;
    temporalStability: number;
    robustness: number;
  };
}

export interface PairStudyArtifact {
  pairId: string;
  predictorId: string;
  predictorLabel: string;
  predictorUnit: string;
  outcomeId: string;
  outcomeLabel: string;
  outcomeUnit: string;
  lagYears: number;
  durationYears: number;
  temporalProfileSource: TemporalProfileSource;
  fillingType: VariableTemporalFillingType;
  fillingValue: number | null;
  temporalCandidatesEvaluated: number;
  temporalCandidatesWithResults: number;
  temporalScore: number;
  temporalRunnerUps: PairTemporalSensitivityRow[];
  temporalStabilityWarning: string | null;
  robustness: PairRobustnessSummary;
  qualityTier: PairQualityTier;
  actionabilityStatus: PairActionabilityStatus;
  actionabilityReasons: string[];
  includedSubjects: number;
  skippedSubjects: number;
  totalPairs: number;
  aggregateForwardPearson: number;
  aggregateReversePearson: number;
  aggregatePredictivePearson: number;
  aggregateEffectSize: number;
  aggregateStatisticalSignificance: number;
  weightedAveragePIS: number;
  aggregateValuePredictingHighOutcome: number | null;
  aggregateValuePredictingLowOutcome: number | null;
  aggregateOptimalDailyValue: number | null;
  responseCurve: PairResponseCurveDiagnostics;
  dataSufficiency: PairDataSufficiency;
  reliability: PairReliability;
  predictorObservedMin: number | null;
  predictorObservedMax: number | null;
  narrativeSummary: string[];
  predictorBinRows: PairBinSummaryRow[];
  predictorDistribution: DistributionBucket[];
  outcomeDistribution: DistributionBucket[];
  pppPerCapitaSummary: PppPerCapitaSummary | null;
  sparseOutcomeDiagnostics: SparseOutcomeDiagnostics | null;
  pValue: number;
  evidenceGrade: "A" | "B" | "C" | "D" | "F";
  direction: "positive" | "negative" | "neutral";
  qualityWarnings: string[];
  topSubjects: PairSubjectSummary[];
  skippedReasons: string[];
}

export interface MegaStudyArtifacts {
  generatedAt: string;
  outputDir: string;
  pairStudyCount: number;
  skippedPairCount: number;
  outcomeRankingCount: number;
  pairStudies: PairStudyArtifact[];
  rankings: OutcomeMegaStudyRanking[];
  skippedPairs: Array<{ predictorId: string; outcomeId: string; reason: string }>;
}

export interface MegaStudyApiPair {
  pairId: string;
  predictor: {
    id: string;
    label: string;
    unit: string;
  };
  outcome: {
    id: string;
    label: string;
    unit: string;
  };
  targets: {
    decisionBest: number | null;
    decisionTargetSource: DecisionTargetSource;
    modelBest: number | null;
    observedSupportBest: number | null;
    robustBest: number | null;
    minimumEffectiveDose: number | null;
    diminishingReturnsKnee: number | null;
    saturationStart: number | null;
    saturationEnd: number | null;
  };
  diagnostics: {
    qualityTier: PairQualityTier;
    evidenceGrade: "A" | "B" | "C" | "D" | "F";
    significance: number;
    directionalScore: number;
    direction: "positive" | "negative" | "neutral";
    includedSubjects: number;
    totalPairs: number;
    extrapolative: boolean;
    outsideBestObservedBin: boolean;
    modelExtrapolative: boolean;
    modelOutsideBestObservedBin: boolean;
    dataSufficiencyStatus: DataSufficiencyStatus;
    reliabilityScore: number;
    reliabilityBand: ReliabilityBand;
    publicationEligible: boolean;
    twoStageGate: {
      directMissionVerdict: GateVerdict;
      welfareGuardrailVerdict: GateVerdict;
      overallEligible: boolean;
      suppressLargeScaleUp: boolean;
      plainLanguageGuidance: string;
    } | null;
  };
  links: {
    markdownFile: string;
  };
}

export interface MegaStudyApiOutcomeRow {
  rank: number;
  predictorId: string;
  predictorLabel: string;
  score: number;
  confidence: number;
  adjustedPValue: number;
  qualityTier: PairQualityTier;
  dataSufficiencyStatus: DataSufficiencyStatus;
  reliabilityScore: number;
  reliabilityBand: ReliabilityBand;
  pairId: string;
  pairMarkdownFile: string;
  publicationEligible: boolean;
}

export interface MegaStudyApiOutcome {
  outcomeId: string;
  outcomeLabel: string;
  outcomeMarkdownFile: string;
  rows: MegaStudyApiOutcomeRow[];
}

export interface MegaStudyApiPayload {
  schemaVersion: "2026-02-14";
  generatedAt: string;
  outcomes: MegaStudyApiOutcome[];
  pairs: MegaStudyApiPair[];
}

interface VariableCacheEnvelope {
  variableId: string;
  fetchedAt: string;
  period?: { startYear: number; endYear: number };
  jurisdictions: string[];
  points: DataPoint[];
}

interface ActionableOutcomeRow {
  row: OutcomeMegaStudyRanking["rows"][number];
  pair: PairStudyArtifact;
}

export interface ResolvedTemporalProfile {
  lagYears: number;
  durationYears: number;
  source: TemporalProfileSource;
  fillingType: VariableTemporalFillingType;
  fillingValue?: number;
}

interface TemporalProfileCandidateEvaluation {
  profile: ResolvedTemporalProfile;
  score: number;
  includedSubjects: number;
  totalPairs: number;
}

export function isReportEligiblePredictor(variable: VariableRegistryEntry): boolean {
  return variable.kind === "predictor" && variable.isDiscretionary === true;
}

export function isReportEligibleOutcome(
  variable: VariableRegistryEntry,
  selectedOutcomeIds: readonly string[] = DEFAULT_REPORT_OUTCOME_IDS,
): boolean {
  return variable.kind === "outcome" && selectedOutcomeIds.includes(variable.id);
}

export function slugifyId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
}

function sortedUnique(values: readonly string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  return [...new Set(values)].sort();
}

export function buildFetchCacheKey(variableId: string, fetchOptions: FetchOptions): string {
  const jurisdictionKey = sortedUnique(fetchOptions.jurisdictions).join(",");
  const payload = JSON.stringify({
    variableId,
    period: fetchOptions.period,
    jurisdictions: jurisdictionKey,
  });
  const hash = createHash("sha1").update(payload).digest("hex").slice(0, 12);
  return `${slugifyId(variableId)}__${hash}`;
}

function resolveVariableCachePath(cacheDir: string, cacheKey: string): string {
  return path.join(cacheDir, `${cacheKey}.json`);
}

function readVariableCache(
  cachePath: string,
  variableId: string,
  fetchOptions: FetchOptions,
  maxCacheAgeHours: number,
): DataPoint[] | null {
  if (!fs.existsSync(cachePath)) return null;
  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    const envelope = JSON.parse(raw) as VariableCacheEnvelope;
    if (envelope.variableId !== variableId) return null;
    const cachedPeriod = envelope.period ?? null;
    const requestedPeriod = fetchOptions.period ?? null;
    if ((cachedPeriod?.startYear ?? null) !== (requestedPeriod?.startYear ?? null)) return null;
    if ((cachedPeriod?.endYear ?? null) !== (requestedPeriod?.endYear ?? null)) return null;
    const expectedJurisdictions = sortedUnique(fetchOptions.jurisdictions);
    const cachedJurisdictions = sortedUnique(envelope.jurisdictions);
    if (expectedJurisdictions.join(",") !== cachedJurisdictions.join(",")) return null;

    const fetchedAtMs = new Date(envelope.fetchedAt).getTime();
    const ageMs = Date.now() - fetchedAtMs;
    const maxAgeMs = Math.max(0, maxCacheAgeHours) * 60 * 60 * 1000;
    if (!Number.isFinite(fetchedAtMs) || ageMs > maxAgeMs) return null;

    return envelope.points;
  } catch {
    return null;
  }
}

function writeVariableCache(
  cachePath: string,
  variableId: string,
  fetchOptions: FetchOptions,
  points: DataPoint[],
): void {
  const envelope: VariableCacheEnvelope = {
    variableId,
    fetchedAt: new Date().toISOString(),
    period: fetchOptions.period,
    jurisdictions: sortedUnique(fetchOptions.jurisdictions),
    points,
  };
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(envelope), "utf-8");
}

export function selectLagYears(
  predictorLags: number[],
  outcomeLags: number[],
): number {
  const intersection = predictorLags
    .filter((lag) => outcomeLags.includes(lag))
    .sort((a, b) => a - b);
  if (intersection.length > 0) return intersection[0] ?? 1;
  if (predictorLags.includes(1) || outcomeLags.includes(1)) return 1;
  const predictorMin = predictorLags.length > 0 ? Math.min(...predictorLags) : Number.POSITIVE_INFINITY;
  const outcomeMin = outcomeLags.length > 0 ? Math.min(...outcomeLags) : Number.POSITIVE_INFINITY;
  const resolved = Math.min(predictorMin, outcomeMin);
  return Number.isFinite(resolved) ? resolved : 1;
}

export function resolvePairTemporalProfile(
  predictor: VariableRegistryEntry,
  outcome: VariableRegistryEntry,
): ResolvedTemporalProfile {
  const overrideKey = `${predictor.id}::${outcome.id}`;
  const pairOverride = PAIR_TEMPORAL_OVERRIDES[overrideKey];
  if (pairOverride) {
    return {
      ...pairOverride,
      source: "pair_override",
    };
  }

  const predictorProfile = predictor.temporalProfile;
  if (predictorProfile) {
    const lagYears = selectLagYears(
      predictorProfile.onsetDelayYears,
      outcome.suggestedLagYears,
    );
    const durationYears = [...predictorProfile.durationYears]
      .sort((a, b) => a - b)[0] ?? 1;
    return {
      lagYears,
      durationYears,
      source: "predictor_default",
      fillingType: predictorProfile.preferredFillingType,
      fillingValue: predictorProfile.preferredFillingValue,
    };
  }

  const lagYears = selectLagYears(
    predictor.suggestedLagYears,
    outcome.suggestedLagYears,
  );
  return {
    lagYears,
    durationYears: 1,
    source: "global_fallback",
    fillingType: "interpolation",
  };
}

export function buildPairTemporalProfileCandidates(
  predictor: VariableRegistryEntry,
  outcome: VariableRegistryEntry,
): ResolvedTemporalProfile[] {
  const overrideKey = `${predictor.id}::${outcome.id}`;
  const pairOverride = PAIR_TEMPORAL_OVERRIDES[overrideKey];
  if (pairOverride) {
    return [{ ...pairOverride, source: "pair_override" }];
  }

  const predictorProfile = predictor.temporalProfile;
  if (!predictorProfile) {
    return [resolvePairTemporalProfile(predictor, outcome)];
  }

  const outcomeLagSet = new Set(outcome.suggestedLagYears);
  const onsetCandidates = [...new Set(predictorProfile.onsetDelayYears)].sort((a, b) => a - b);
  const durationCandidates = [...new Set(predictorProfile.durationYears)].sort((a, b) => a - b);
  const intersectedOnsets = onsetCandidates.filter((lag) => outcomeLagSet.has(lag));
  const selectedOnsets = intersectedOnsets.length > 0 ? intersectedOnsets : onsetCandidates;
  const candidates: ResolvedTemporalProfile[] = [];

  for (const lagYears of selectedOnsets) {
    for (const durationYears of durationCandidates) {
      candidates.push({
        lagYears,
        durationYears,
        source: "predictor_default",
        fillingType: predictorProfile.preferredFillingType,
        fillingValue: predictorProfile.preferredFillingValue,
      });
    }
  }

  return candidates.length > 0 ? candidates : [resolvePairTemporalProfile(predictor, outcome)];
}

export interface TemporalProfileScoreInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregatePredictivePearson: number;
}

export function scoreTemporalProfileCandidate(input: TemporalProfileScoreInput): number {
  const directionalSignal = Math.min(1, Math.abs(input.aggregatePredictivePearson) / 0.4);
  const significance = Math.max(0, Math.min(1, input.aggregateStatisticalSignificance));
  const subjectSupport = Math.min(1, Math.max(0, input.includedSubjects) / 120);
  const pairSupport = Math.min(1, Math.max(0, input.totalPairs) / 4000);
  const penalty = input.includedSubjects < 10 || input.totalPairs < 300 ? 0.2 : 0;

  return Math.max(
    0,
    directionalSignal * 0.4 +
      significance * 0.35 +
      subjectSupport * 0.15 +
      pairSupport * 0.1 -
      penalty,
  );
}

function toTemporalAnalysisConfig(profile: ResolvedTemporalProfile): {
  onsetDelaySeconds: number;
  durationOfActionSeconds: number;
  fillingType: VariableTemporalFillingType;
  fillingValue?: number;
} {
  return {
    onsetDelaySeconds: profile.lagYears * SECONDS_PER_YEAR,
    durationOfActionSeconds: profile.durationYears * SECONDS_PER_YEAR,
    fillingType: profile.fillingType,
    ...(profile.fillingType === "value" ? { fillingValue: profile.fillingValue ?? 0 } : {}),
  };
}

function isTemporalCandidateBetter(
  next: TemporalProfileCandidateEvaluation,
  current: TemporalProfileCandidateEvaluation | null,
): boolean {
  if (!current) return true;
  if (Math.abs(next.score - current.score) > 1e-9) return next.score > current.score;
  if (next.includedSubjects !== current.includedSubjects) return next.includedSubjects > current.includedSubjects;
  if (next.totalPairs !== current.totalPairs) return next.totalPairs > current.totalPairs;
  if (next.profile.lagYears !== current.profile.lagYears) return next.profile.lagYears < current.profile.lagYears;
  if (next.profile.durationYears !== current.profile.durationYears) {
    return next.profile.durationYears < current.profile.durationYears;
  }
  if (next.profile.source !== current.profile.source) {
    const precedence: Record<TemporalProfileSource, number> = {
      pair_override: 0,
      predictor_default: 1,
      global_fallback: 2,
    };
    return precedence[next.profile.source] < precedence[current.profile.source];
  }
  return next.profile.fillingType.localeCompare(current.profile.fillingType) < 0;
}

function toTemporalProfileKey(profile: ResolvedTemporalProfile): string {
  const fillingValuePart =
    profile.fillingType === "value" ? `${profile.fillingValue ?? 0}` : "";
  return [
    profile.source,
    profile.lagYears,
    profile.durationYears,
    profile.fillingType,
    fillingValuePart,
  ].join("|");
}

function sortTemporalCandidateEvaluations(
  evaluations: TemporalProfileCandidateEvaluation[],
): TemporalProfileCandidateEvaluation[] {
  return [...evaluations].sort((left, right) => {
    if (isTemporalCandidateBetter(left, right)) return -1;
    if (isTemporalCandidateBetter(right, left)) return 1;
    return 0;
  });
}

function buildTemporalStabilityWarning(
  bestScore: number,
  runnerUp: PairTemporalSensitivityRow | undefined,
): string | null {
  if (!runnerUp) return null;
  const delta = bestScore - runnerUp.score;
  if (delta >= 0.03) return null;
  return `Top temporal profiles are close (score delta ${delta.toFixed(4)}); temporal assumptions are not yet robust.`;
}

function evidenceGradeFromSignificance(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 0.85) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.55) return "C";
  if (score >= 0.4) return "D";
  return "F";
}

function finiteOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonNegativeInt(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function directionFromSignal(
  forwardPearson: number,
  predictivePearson: number,
): "positive" | "negative" | "neutral" {
  if (Math.abs(forwardPearson) < 0.05) return "neutral";
  if (Math.abs(predictivePearson) < 0.03) return "neutral";
  if (forwardPearson > 0) return "positive";
  if (forwardPearson < 0) return "negative";
  return "neutral";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export interface PairDataSufficiencyInput {
  includedSubjects: number;
  totalPairs: number;
  temporalCandidatesWithResults: number;
  predictorBinCount: number;
}

export function derivePairDataSufficiency(
  input: PairDataSufficiencyInput,
): PairDataSufficiency {
  const reasons: string[] = [];
  if (input.includedSubjects < SUFFICIENCY_THRESHOLDS.minSubjects) {
    reasons.push(
      `subject coverage below minimum (${input.includedSubjects} < ${SUFFICIENCY_THRESHOLDS.minSubjects})`,
    );
  }
  if (input.totalPairs < SUFFICIENCY_THRESHOLDS.minPairs) {
    reasons.push(
      `aligned-pair support below minimum (${input.totalPairs} < ${SUFFICIENCY_THRESHOLDS.minPairs})`,
    );
  }
  if (
    input.temporalCandidatesWithResults <
    SUFFICIENCY_THRESHOLDS.minTemporalCandidatesWithResults
  ) {
    reasons.push(
      `insufficient temporal candidates with valid results (${input.temporalCandidatesWithResults} < ${SUFFICIENCY_THRESHOLDS.minTemporalCandidatesWithResults})`,
    );
  }
  if (input.predictorBinCount < SUFFICIENCY_THRESHOLDS.minBins) {
    reasons.push(
      `insufficient predictor bins for stable response-curve estimation (${input.predictorBinCount} < ${SUFFICIENCY_THRESHOLDS.minBins})`,
    );
  }

  return {
    status: reasons.length === 0 ? "sufficient" : "insufficient_data",
    reasons,
    thresholds: { ...SUFFICIENCY_THRESHOLDS },
  };
}

export interface PairReliabilityInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregatePredictivePearson: number;
  topTemporalScoreDelta: number | null;
  robustnessDeltaPercent: number | null;
  dataSufficiencyStatus: DataSufficiencyStatus;
}

export function derivePairReliability(input: PairReliabilityInput): PairReliability {
  const supportScore =
    0.5 * clamp01(input.includedSubjects / 150) +
    0.5 * clamp01(input.totalPairs / 6000);
  const significanceScore = clamp01(input.aggregateStatisticalSignificance);
  const directionalScore = clamp01(Math.abs(input.aggregatePredictivePearson) / 0.15);
  const temporalStabilityScore =
    input.topTemporalScoreDelta == null
      ? 1
      : clamp01(input.topTemporalScoreDelta / 0.03);
  const absRobustDelta = Math.abs(input.robustnessDeltaPercent ?? 0);
  const robustnessScore =
    absRobustDelta <= 10
      ? 1
      : clamp01(1 - (absRobustDelta - 10) / 90);

  let overallScore =
    supportScore * 0.25 +
    significanceScore * 0.25 +
    directionalScore * 0.2 +
    temporalStabilityScore * 0.15 +
    robustnessScore * 0.15;
  if (input.dataSufficiencyStatus === "insufficient_data") {
    overallScore = Math.min(overallScore, 0.49);
  }
  overallScore = clamp01(overallScore);

  const band: ReliabilityBand =
    overallScore >= 0.75 ? "high" : overallScore >= 0.55 ? "moderate" : "low";

  return {
    overallScore,
    band,
    components: {
      support: supportScore,
      significance: significanceScore,
      directional: directionalScore,
      temporalStability: temporalStabilityScore,
      robustness: robustnessScore,
    },
  };
}

export function derivePairQualityWarnings(input: PairQualitySignalInput): string[] {
  const warnings: string[] = [];
  if (input.includedSubjects < 30) {
    warnings.push("Low country coverage (<30); results may change a lot as more data is added.");
  }
  if (input.totalPairs < 1000) {
    warnings.push("Low aligned-pair count (<1000); confidence is limited.");
  }
  if (input.aggregateStatisticalSignificance < 0.7) {
    warnings.push("Weak significance score (<0.70).");
  }
  if (Math.abs(input.aggregatePredictivePearson) > 1) {
    warnings.push("Direction score is unusually high; this can happen because it is a difference of two correlations.");
  }
  if (
    typeof input.aggregateForwardPearson === "number" &&
    Number.isFinite(input.aggregateForwardPearson) &&
    Math.abs(input.aggregateForwardPearson) >= 0.05 &&
    Math.abs(input.aggregatePredictivePearson) >= 0.03 &&
    Math.sign(input.aggregateForwardPearson) !== Math.sign(input.aggregatePredictivePearson)
  ) {
    warnings.push(
      "Forward and direction signals disagree; direction may be unstable.",
    );
  }
  if ((input.maxSubjectDirectionalScore ?? 0) > 1) {
    warnings.push("Some country-level direction scores are unusually high; this can happen with this scoring method.");
  }
  if (
    input.predictorObservedMin != null &&
    input.predictorObservedMax != null &&
    input.predictorObservedMin < input.predictorObservedMax
  ) {
    const lower = input.predictorObservedMin;
    const upper = input.predictorObservedMax;
    const candidates = [
      input.aggregateValuePredictingHighOutcome,
      input.aggregateValuePredictingLowOutcome,
      input.aggregateOptimalDailyValue,
    ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const hasExtrapolation = candidates.some((value) => value < lower || value > upper);
    if (hasExtrapolation) {
      warnings.push("One or more best values are outside the seen data range; treat those as math-only guesses.");
    }
  }
  return warnings;
}

interface PairActionabilityInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregatePredictivePearson: number;
  temporalStabilityWarning: string | null;
}

function derivePairActionability(input: PairActionabilityInput): {
  status: PairActionabilityStatus;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (input.includedSubjects < 60) {
    reasons.push("insufficient subject coverage (<60)");
  }
  if (input.totalPairs < 2500) {
    reasons.push("insufficient aligned-pair support (<2500)");
  }
  if (input.aggregateStatisticalSignificance < 0.8) {
    reasons.push("aggregate significance below actionable threshold (<0.80)");
  }
  if (Math.abs(input.aggregatePredictivePearson) < 0.03) {
    reasons.push("directional signal too weak (|predictive| < 0.03)");
  }
  if (input.temporalStabilityWarning) {
    reasons.push("temporal-profile selection is unstable");
  }

  if (reasons.length === 0) {
    return { status: "actionable", reasons: [] };
  }
  return { status: "exploratory", reasons };
}

export interface PairQualityTierInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregatePredictivePearson: number;
  temporalStabilityWarning: string | null;
  robustnessDeltaPercent: number | null;
  actionabilityStatus: PairActionabilityStatus;
}

export function derivePairQualityTier(input: PairQualityTierInput): PairQualityTier {
  if (input.includedSubjects < 30 || input.totalPairs < 1000 || input.aggregateStatisticalSignificance < 0.6) {
    return "insufficient";
  }

  const absPredictive = Math.abs(input.aggregatePredictivePearson);
  const absRobustDelta = input.robustnessDeltaPercent == null
    ? 0
    : Math.abs(input.robustnessDeltaPercent);

  if (
    input.actionabilityStatus === "actionable" &&
    input.aggregateStatisticalSignificance >= 0.9 &&
    absPredictive >= 0.08 &&
    !input.temporalStabilityWarning &&
    absRobustDelta < 15
  ) {
    return "strong";
  }

  if (
    input.actionabilityStatus === "actionable" &&
    input.aggregateStatisticalSignificance >= 0.8 &&
    absPredictive >= 0.05 &&
    absRobustDelta < 25
  ) {
    return "moderate";
  }

  return "exploratory";
}

function computeObservedRange(
  predictorSeries: Map<string, TimeSeries>,
  subjectIds: string[],
): { min: number | null; max: number | null } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const subjectId of subjectIds) {
    const series = predictorSeries.get(subjectId);
    if (!series) continue;
    for (const measurement of series.measurements) {
      const value = measurement.value;
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: null, max: null };
  return { min, max };
}

function safeMean(values: number[]): number | null {
  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function safeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? null;
}

function safeQuantile(values: number[], quantile: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.max(0, Math.min(1, quantile));
  const index = (sorted.length - 1) * clamped;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lower = sorted[lowerIndex];
  const upper = sorted[upperIndex];
  if (lower == null || upper == null) return null;
  if (lowerIndex === upperIndex) return lower;
  const fraction = index - lowerIndex;
  return lower + (upper - lower) * fraction;
}

function buildTrimmedAlignedPoints(
  alignedPoints: PairAlignedPoint[],
  lowerQuantile: number,
  upperQuantile: number,
): PairAlignedPoint[] {
  if (alignedPoints.length < 40) return alignedPoints;
  const values = alignedPoints.map((point) => point.predictorValue);
  const lower = safeQuantile(values, lowerQuantile);
  const upper = safeQuantile(values, upperQuantile);
  if (lower == null || upper == null || lower >= upper) return alignedPoints;
  return alignedPoints.filter(
    (point) => point.predictorValue >= lower && point.predictorValue <= upper,
  );
}

function percentDelta(fromValue: number, toValue: number): number | null {
  if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || fromValue === 0) return null;
  return ((toValue - fromValue) / Math.abs(fromValue)) * 100;
}

export function buildPairRobustnessSummary(
  alignedPoints: PairAlignedPoint[],
  rawBinRows: PairBinSummaryRow[],
  rawOptimalValue: number | null,
  targetBinCount = 10,
  trimLowerQuantile = 0.1,
  trimUpperQuantile = 0.9,
): PairRobustnessSummary {
  const rawBest = bestObservedBinFromRows(rawBinRows);
  const trimmedPoints = buildTrimmedAlignedPoints(
    alignedPoints,
    trimLowerQuantile,
    trimUpperQuantile,
  );
  const robustRows = buildPairBinSummaryRows(trimmedPoints, targetBinCount);
  const robustBest = bestObservedBinFromRows(robustRows);
  const robustOptimalValue = robustBest?.predictorMedian ?? robustBest?.predictorMean ?? null;
  const optimalDeltaAbsolute =
    rawOptimalValue == null || robustOptimalValue == null
      ? null
      : robustOptimalValue - rawOptimalValue;
  const optimalDeltaPercent =
    rawOptimalValue == null || robustOptimalValue == null
      ? null
      : percentDelta(rawOptimalValue, robustOptimalValue);

  return {
    trimLowerQuantile,
    trimUpperQuantile,
    rawPairCount: alignedPoints.length,
    trimmedPairCount: trimmedPoints.length,
    retainedFraction:
      alignedPoints.length > 0 ? trimmedPoints.length / alignedPoints.length : 0,
    rawBestObservedRange: rawBest?.label ?? null,
    robustBestObservedRange: robustBest?.label ?? null,
    rawBestOutcomeMean: rawBest?.outcomeMean ?? null,
    robustBestOutcomeMean: robustBest?.outcomeMean ?? null,
    rawOptimalValue,
    robustOptimalValue,
    optimalDeltaAbsolute,
    optimalDeltaPercent,
  };
}

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.001) return value.toExponential(2);
  if (abs >= 100000) return value.toFixed(0);
  if (abs >= 1000) return value.toFixed(1);
  if (abs >= 100) return value.toFixed(2);
  if (abs >= 1) return value.toFixed(3);
  return value.toFixed(5);
}

function formatBinLabel(
  lowerBound: number,
  upperBound: number,
  isUpperInclusive: boolean,
): string {
  const close = isUpperInclusive ? "]" : ")";
  return `[${formatCompactNumber(lowerBound)}, ${formatCompactNumber(upperBound)}${close}`;
}

export function isPercentGdpUnit(unit: string): boolean {
  const normalized = unit.trim().toLowerCase();
  return normalized === "% gdp" || normalized === "% of gdp";
}

function inBin(value: number, bucket: DistributionBucket): boolean {
  if (bucket.isUpperInclusive) {
    return value >= bucket.lowerBound && value <= bucket.upperBound;
  }
  return value >= bucket.lowerBound && value < bucket.upperBound;
}

function sampleTimeSeriesValueAtTimestamp(series: TimeSeries, timestampMs: number): number | null {
  const points = series.measurements
    .map((measurement) => ({
      timestamp: new Date(measurement.timestamp).getTime(),
      value: measurement.value,
    }))
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.value))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (points.length === 0) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;
  if (timestampMs <= first.timestamp) return first.value;
  if (timestampMs >= last.timestamp) return last.value;

  for (let index = 1; index < points.length; index++) {
    const right = points[index];
    const left = points[index - 1];
    if (!left || !right) continue;
    if (timestampMs > right.timestamp) continue;
    if (right.timestamp === left.timestamp) return right.value;
    const ratio = (timestampMs - left.timestamp) / (right.timestamp - left.timestamp);
    return left.value + (right.value - left.value) * ratio;
  }

  return null;
}

function bestObservedBinFromRows(rows: PairBinSummaryRow[]): PairBinSummaryRow | null {
  const row = [...rows]
    .filter((entry) => entry.outcomeMean != null)
    .sort(
      (a, b) =>
        (b.outcomeMean ?? Number.NEGATIVE_INFINITY) - (a.outcomeMean ?? Number.NEGATIVE_INFINITY),
    )[0];
  return row ?? null;
}

function convertPercentGdpToPerCapitaPpp(percentGdp: number, gdpPerCapitaPpp: number): number {
  return (percentGdp / 100) * gdpPerCapitaPpp;
}

function resolveActionableOptimalValueFromAggregate(
  aggregateOptimalDailyValue: number | null,
  aggregateValuePredictingHighOutcome: number | null,
): number | null {
  if (aggregateOptimalDailyValue != null) return aggregateOptimalDailyValue;
  if (aggregateValuePredictingHighOutcome != null) return aggregateValuePredictingHighOutcome;
  return null;
}

export function buildPppPerCapitaSummary(
  alignedPoints: PairAlignedPoint[],
  predictorBinRows: PairBinSummaryRow[],
  predictorUnit: string,
  gdpPerCapitaSeriesBySubject: Map<string, TimeSeries>,
  aggregateOptimalDailyValue: number | null,
  aggregateValuePredictingHighOutcome: number | null,
): PppPerCapitaSummary | null {
  if (!isPercentGdpUnit(predictorUnit)) return null;

  const convertedPoints = alignedPoints
    .map((point) => {
      if (typeof point.predictorTimestamp !== "number" || !Number.isFinite(point.predictorTimestamp)) return null;
      const gdpSeries = gdpPerCapitaSeriesBySubject.get(point.subjectId);
      if (!gdpSeries) return null;
      const gdpPerCapitaPpp = sampleTimeSeriesValueAtTimestamp(gdpSeries, point.predictorTimestamp);
      if (gdpPerCapitaPpp == null || !Number.isFinite(gdpPerCapitaPpp)) return null;
      return {
        predictorValue: point.predictorValue,
        predictorPerCapitaPpp: convertPercentGdpToPerCapitaPpp(point.predictorValue, gdpPerCapitaPpp),
        gdpPerCapitaPpp,
      };
    })
    .filter((point): point is { predictorValue: number; predictorPerCapitaPpp: number; gdpPerCapitaPpp: number } => point != null);

  if (convertedPoints.length === 0) return null;

  const bestObservedBin = bestObservedBinFromRows(predictorBinRows);
  const bestBinPppValues = bestObservedBin
    ? convertedPoints
        .filter((point) =>
          inBin(point.predictorValue, {
            lowerBound: bestObservedBin.lowerBound,
            upperBound: bestObservedBin.upperBound,
            isUpperInclusive: bestObservedBin.isUpperInclusive,
            count: 0,
          })
        )
        .map((point) => point.predictorPerCapitaPpp)
    : [];
  const minBestBinPpp = bestBinPppValues.length >= 5
    ? safeQuantile(bestBinPppValues, 0.1)
    : bestBinPppValues.length > 0
      ? Math.min(...bestBinPppValues)
      : null;
  const maxBestBinPpp = bestBinPppValues.length >= 5
    ? safeQuantile(bestBinPppValues, 0.9)
    : bestBinPppValues.length > 0
      ? Math.max(...bestBinPppValues)
      : null;
  const bestObservedPerCapitaPppRange =
    minBestBinPpp != null && maxBestBinPpp != null
      ? formatBinLabel(minBestBinPpp, maxBestBinPpp, true)
      : null;
  const medianGdpPerCapitaPpp = safeMedian(convertedPoints.map((point) => point.gdpPerCapitaPpp));
  const estimatedOptimalPercentGdp = resolveActionableOptimalValueFromAggregate(
    aggregateOptimalDailyValue,
    aggregateValuePredictingHighOutcome,
  );
  const estimatedBestPerCapitaPpp =
    medianGdpPerCapitaPpp == null || estimatedOptimalPercentGdp == null
      ? null
      : convertPercentGdpToPerCapitaPpp(estimatedOptimalPercentGdp, medianGdpPerCapitaPpp);

  return {
    samplePairs: convertedPoints.length,
    medianGdpPerCapitaPpp,
    estimatedBestPerCapitaPpp,
    bestObservedPerCapitaPppRange,
    bestObservedPerCapitaPppMean: safeMean(bestBinPppValues),
    bestObservedPerCapitaPppMedian: safeMedian(bestBinPppValues),
  };
}

function collectAlignedPairs(
  subjectIds: string[],
  predictorSeries: Map<string, TimeSeries>,
  outcomeSeries: Map<string, TimeSeries>,
  temporalProfile: ResolvedTemporalProfile,
): PairAlignedPoint[] {
  const alignedPoints: PairAlignedPoint[] = [];
  const config = toTemporalAnalysisConfig(temporalProfile);

  for (const subjectId of subjectIds) {
    const predictor = predictorSeries.get(subjectId);
    const outcome = outcomeSeries.get(subjectId);
    if (!predictor || !outcome) continue;
    const pairs: AlignedPair[] = alignTimeSeries(predictor, outcome, config);
    for (const pair of pairs) {
      if (!Number.isFinite(pair.predictorValue) || !Number.isFinite(pair.outcomeValue)) continue;
      alignedPoints.push({
        subjectId,
        predictorValue: pair.predictorValue,
        outcomeValue: pair.outcomeValue,
        predictorTimestamp: pair.predictorTimestamp,
        outcomeTimestamp: pair.outcomeTimestamp,
      });
    }
  }

  return alignedPoints;
}

export function buildDistributionBuckets(
  values: number[],
  targetBinCount: number,
  minBinSize: number,
): DistributionBucket[] {
  const bins = buildAdaptiveNumericBins(values, {
    targetBinCount: Math.max(1, Math.floor(targetBinCount)),
    minBinSize: Math.max(1, Math.floor(minBinSize)),
    roundTo: 0,
  });
  return bins.map((bin) => ({
    lowerBound: bin.lowerBound,
    upperBound: bin.upperBound,
    isUpperInclusive: bin.isUpperInclusive,
    count: bin.count,
  }));
}

export function buildFixedWidthDistributionBuckets(
  values: number[],
  targetBinCount: number,
): DistributionBucket[] {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (finite.length === 0) return [];
  const min = finite[0] ?? 0;
  const max = finite[finite.length - 1] ?? 0;
  if (min === max) {
    return [{ lowerBound: min, upperBound: max, isUpperInclusive: true, count: finite.length }];
  }

  const binCount = Math.max(1, Math.floor(targetBinCount));
  const width = (max - min) / binCount;
  const buckets: DistributionBucket[] = [];

  for (let index = 0; index < binCount; index++) {
    const lowerBound = min + width * index;
    const upperBound = index === binCount - 1 ? max : min + width * (index + 1);
    buckets.push({
      lowerBound,
      upperBound,
      isUpperInclusive: index === binCount - 1,
      count: 0,
    });
  }

  for (const value of finite) {
    if (value === max) {
      const last = buckets[buckets.length - 1];
      if (last) last.count += 1;
      continue;
    }
    const index = Math.min(binCount - 1, Math.max(0, Math.floor((value - min) / width)));
    const bucket = buckets[index];
    if (bucket) bucket.count += 1;
  }

  return buckets.filter((bucket) => bucket.count > 0);
}

export function buildPairBinSummaryRows(
  alignedPoints: PairAlignedPoint[],
  targetBinCount: number,
): PairBinSummaryRow[] {
  if (alignedPoints.length === 0) return [];
  const predictorValues = alignedPoints.map((point) => point.predictorValue);
  const minBinSize = Math.max(8, Math.floor(alignedPoints.length / Math.max(4, targetBinCount * 2)));
  const bins = buildDistributionBuckets(predictorValues, targetBinCount, minBinSize);

  return bins.map((bin, index) => {
    const points = alignedPoints.filter((point) => inBin(point.predictorValue, bin));
    const predictors = points.map((point) => point.predictorValue);
    const outcomes = points.map((point) => point.outcomeValue);
    return {
      binIndex: index,
      label: formatBinLabel(bin.lowerBound, bin.upperBound, bin.isUpperInclusive),
      lowerBound: bin.lowerBound,
      upperBound: bin.upperBound,
      isUpperInclusive: bin.isUpperInclusive,
      pairs: points.length,
      subjects: new Set(points.map((point) => point.subjectId)).size,
      predictorMean: safeMean(predictors),
      predictorMedian: safeMedian(predictors),
      outcomeMean: safeMean(outcomes),
      outcomeMedian: safeMedian(outcomes),
    };
  });
}

export function buildAsciiDistributionChart(
  title: string,
  buckets: DistributionBucket[],
): string {
  if (buckets.length === 0) return `${title}\n(no data)`;
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const lines: string[] = [title];
  for (const bucket of buckets) {
    const label = formatBinLabel(bucket.lowerBound, bucket.upperBound, bucket.isUpperInclusive);
    const barLength = Math.max(1, Math.round((bucket.count / maxCount) * 30));
    lines.push(`${label} | ${"#".repeat(barLength)} ${bucket.count}`);
  }
  return lines.join("\n");
}

function buildPairNarrativeSummary(pair: PairStudyArtifact): string[] {
  const lines: string[] = [];
  const directionText = pair.direction === "positive"
    ? `Higher ${pair.predictorLabel} tends to align with better ${pair.outcomeLabel}.`
    : pair.direction === "negative"
      ? `Higher ${pair.predictorLabel} tends to align with worse ${pair.outcomeLabel}.`
      : `No strong directional pattern is detected between ${pair.predictorLabel} and ${pair.outcomeLabel}.`;
  lines.push(directionText);
  lines.push(
    `The estimate uses ${pair.includedSubjects} subjects and ${pair.totalPairs} aligned predictor-outcome observations.`,
  );
  const strongestBin = bestObservedBinFromRows(pair.predictorBinRows);
  if (strongestBin?.outcomeMean != null) {
    lines.push(
      `Best observed mean outcome appears in predictor bin ${strongestBin.label} (mean outcome ${formatCompactNumber(strongestBin.outcomeMean)}).`,
    );
  }
  if (pair.responseCurve.minimumEffectiveDose.detected) {
    lines.push(
      `A minimum effective predictor level appears near ${formatValueWithUnit(pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose, pair.predictorUnit)} in the binned response curve.`,
    );
  }
  lines.push(
    `Confidence score is ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}); data status is ${toSimpleDataStatusLabel(pair.dataSufficiency.status)}.`,
  );
  lines.push(
    "Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).",
  );
  return lines;
}

function bestObservedBinRow(pair: PairStudyArtifact): PairBinSummaryRow | null {
  return bestObservedBinFromRows(pair.predictorBinRows ?? []);
}

function isOutsideBestObservedBin(pair: PairStudyArtifact, value: number | null): boolean {
  if (value == null || !Number.isFinite(value)) return false;
  const bestBin = bestObservedBinRow(pair);
  if (!bestBin) return false;
  return !inBin(value, {
    lowerBound: bestBin.lowerBound,
    upperBound: bestBin.upperBound,
    isUpperInclusive: bestBin.isUpperInclusive,
    count: 0,
  });
}

function formatValueWithUnit(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `${formatCompactNumber(value)} ${unit}`;
}

function isOutsideObservedRange(
  value: number | null,
  min: number | null,
  max: number | null,
): boolean {
  if (value == null || min == null || max == null) return false;
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
  if (min >= max) return false;
  return value < min || value > max;
}

function formatObservedAnchorDelta(
  modelOptimalValue: number | null,
  bestObservedValue: number | null,
): string {
  if (modelOptimalValue == null || bestObservedValue == null) return "N/A";

  const pct = percentDelta(bestObservedValue, modelOptimalValue);
  const delta = modelOptimalValue - bestObservedValue;
  if (pct == null) return `${formatCompactNumber(delta)}`;
  return `${formatCompactNumber(delta)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
}

function formatObservedRange(min: number | null, max: number | null): string {
  const minText = min != null ? formatCompactNumber(min) : "N/A";
  const maxText = max != null ? formatCompactNumber(max) : "N/A";
  return `[${minText}, ${maxText}]`;
}

export function resolveActionableOptimalValue(pair: PairStudyArtifact): number | null {
  return resolveActionableOptimalValueFromAggregate(
    pair.aggregateOptimalDailyValue,
    pair.aggregateValuePredictingHighOutcome,
  );
}

function isRecommendationEligible(pair: PairStudyArtifact): boolean {
  return pair.dataSufficiency?.status !== "insufficient_data";
}

export function isPublicationEligibleRecommendation(
  pair: PairStudyArtifact,
  gateResult?: TwoStageGateResult | null,
): boolean {
  if (gateResult && !gateResult.overallEligible) return false;
  if (!isRecommendationEligible(pair)) return false;
  if (pair.qualityTier === "insufficient") return false;
  if (pair.reliability.band === "low") return false;
  const decisionLevel = resolveDecisionOptimalValue(pair);
  if (resolveDecisionTargetSource(pair) === "unavailable") return false;
  if (isOutsideObservedRange(decisionLevel, pair.predictorObservedMin, pair.predictorObservedMax)) {
    return false;
  }
  return !isOutsideBestObservedBin(pair, decisionLevel);
}

function resolvePredictorObjectiveProfile(predictorId: string): PredictorObjectiveProfile {
  return (
    PREDICTOR_OBJECTIVE_PROFILES[predictorId] ?? {
      directOutcomeIds: [],
      guardrailOutcomeIds: [],
      notes: [],
    }
  );
}

function classifyOutcomeRole(profile: PredictorObjectiveProfile, outcomeId: string): OutcomeRole {
  if (profile.directOutcomeIds.includes(outcomeId)) return "direct_kpi";
  if (profile.guardrailOutcomeIds.includes(outcomeId)) return "guardrail_kpi";
  return "context_kpi";
}

function toSimpleOutcomeRoleLabel(role: OutcomeRole): string {
  if (role === "direct_kpi") return "mission KPI";
  if (role === "guardrail_kpi") return "welfare fallback";
  return "context KPI";
}

// ─── Two-Stage Recommendation Gating ─────────────────────────────

export function evaluateDirectMissionGate(
  predictorId: string,
  pairsByOutcome: ReadonlyMap<string, PairStudyArtifact>,
  sparseProfiles: ReadonlyMap<string, SparseOutcomeProfile>,
): StageGateResult {
  const profile = resolvePredictorObjectiveProfile(predictorId);
  if (profile.directOutcomeIds.length === 0) {
    return {
      stage: "direct_mission",
      verdict: "no_profile",
      reasons: ["No direct mission outcome IDs configured for this predictor."],
      outcomeId: null,
      reliabilityScore: null,
      direction: null,
    };
  }

  let bestVerdict: GateVerdict = "insufficient_data";
  let bestReasons: string[] = ["No direct mission pair found in study results."];
  let bestOutcomeId: string | null = null;
  let bestReliability: number | null = null;
  let bestDirection: "positive" | "negative" | "neutral" | null = null;

  for (const outcomeId of profile.directOutcomeIds) {
    const pair = pairsByOutcome.get(outcomeId);
    if (!pair) continue;

    const sparseProfile = sparseProfiles.get(outcomeId);
    if (sparseProfile) {
      const bins = pair.predictorBinRows.map((row) => ({
        binIndex: row.binIndex ?? 0,
        lowerBound: row.lowerBound ?? 0,
        upperBound: row.upperBound ?? 0,
        isUpperInclusive: row.isUpperInclusive ?? false,
        count: row.pairs ?? 0,
        predictorMean: row.predictorMean ?? 0,
        predictorMedian: row.predictorMedian ?? 0,
        outcomeMean: row.outcomeMean ?? 0,
        outcomeStd: 0,
        outcomeSem: 0,
      }));
      const sparseDiag = assessSparseOutcomeSupport(bins, {
        minimumEventCountPerBin: sparseProfile.minimumEventCountPerBin,
      });
      if (!sparseDiag.meetsMinimumEventThreshold) {
        if (bestVerdict === "insufficient_data") {
          bestVerdict = "sparse_outcome";
          bestReasons = [`Sparse outcome ${outcomeId}: ${sparseDiag.warnings.join("; ")}`];
          bestOutcomeId = outcomeId;
          bestReliability = pair.reliability.overallScore;
          bestDirection = pair.direction;
        }
        continue;
      }
    }

    if (pair.dataSufficiency.status === "insufficient_data" || pair.reliability.band === "low") {
      if (bestVerdict === "insufficient_data" || bestVerdict === "sparse_outcome") {
        bestVerdict = "insufficient_data";
        bestReasons = [`Direct mission pair ${outcomeId} has insufficient data or low reliability.`];
        bestOutcomeId = outcomeId;
        bestReliability = pair.reliability.overallScore;
        bestDirection = pair.direction;
      }
      continue;
    }

    const outcomeEntry = getVariableById(outcomeId);
    const welfareDir = outcomeEntry?.welfareDirection;
    const isPositiveMission =
      (welfareDir === "higher_better" && pair.direction === "positive") ||
      (welfareDir === "lower_better" && pair.direction === "negative");
    const isAdverse =
      (welfareDir === "higher_better" && pair.direction === "negative") ||
      (welfareDir === "lower_better" && pair.direction === "positive");

    if (isAdverse) {
      return {
        stage: "direct_mission",
        verdict: "adverse_signal",
        reasons: [`Direct mission ${outcomeId} shows adverse direction (${pair.direction}) relative to welfare goal (${welfareDir}).`],
        outcomeId,
        reliabilityScore: pair.reliability.overallScore,
        direction: pair.direction,
      };
    }

    if (isPositiveMission) {
      return {
        stage: "direct_mission",
        verdict: "pass",
        reasons: [],
        outcomeId,
        reliabilityScore: pair.reliability.overallScore,
        direction: pair.direction,
      };
    }

    // Neutral / weak signal — "pass" returns early above, so we always enter here
    {
      bestVerdict = "weak_signal";
      bestReasons = [`Direct mission ${outcomeId} direction is neutral despite sufficient data.`];
      bestOutcomeId = outcomeId;
      bestReliability = pair.reliability.overallScore;
      bestDirection = pair.direction;
    }
  }

  return {
    stage: "direct_mission",
    verdict: bestVerdict,
    reasons: bestReasons,
    outcomeId: bestOutcomeId,
    reliabilityScore: bestReliability,
    direction: bestDirection,
  };
}

export function evaluateWelfareGuardrailGate(
  predictorId: string,
  pairsByOutcome: ReadonlyMap<string, PairStudyArtifact>,
): StageGateResult {
  const profile = resolvePredictorObjectiveProfile(predictorId);
  if (profile.guardrailOutcomeIds.length === 0) {
    return {
      stage: "welfare_guardrail",
      verdict: "pass",
      reasons: ["No guardrail outcomes configured."],
      outcomeId: null,
      reliabilityScore: null,
      direction: null,
    };
  }

  for (const outcomeId of profile.guardrailOutcomeIds) {
    const pair = pairsByOutcome.get(outcomeId);
    if (!pair) continue;

    if (pair.dataSufficiency.status === "insufficient_data") continue;
    if (pair.reliability.band === "low") continue;

    const outcomeEntry = getVariableById(outcomeId);
    const welfareDir = outcomeEntry?.welfareDirection;
    const isAdverse =
      (welfareDir === "higher_better" && pair.direction === "negative") ||
      (welfareDir === "lower_better" && pair.direction === "positive");
    const isSignificant = pair.aggregateStatisticalSignificance >= 0.75;

    if (isAdverse && isSignificant) {
      return {
        stage: "welfare_guardrail",
        verdict: "adverse_signal",
        reasons: [
          `Guardrail outcome ${outcomeId} shows material regression: direction=${pair.direction}, significance=${pair.aggregateStatisticalSignificance.toFixed(3)}, welfare=${welfareDir}.`,
        ],
        outcomeId,
        reliabilityScore: pair.reliability.overallScore,
        direction: pair.direction,
      };
    }
  }

  return {
    stage: "welfare_guardrail",
    verdict: "pass",
    reasons: [],
    outcomeId: null,
    reliabilityScore: null,
    direction: null,
  };
}

export function evaluateTwoStageGate(
  predictorId: string,
  pairsByOutcome: ReadonlyMap<string, PairStudyArtifact>,
  sparseProfiles: ReadonlyMap<string, SparseOutcomeProfile>,
): TwoStageGateResult {
  const direct = evaluateDirectMissionGate(predictorId, pairsByOutcome, sparseProfiles);
  const guardrail = evaluateWelfareGuardrailGate(predictorId, pairsByOutcome);

  let overallEligible = false;
  let suppressLargeScaleUp = false;
  let plainLanguageGuidance: string;

  // Decision matrix
  if (direct.verdict === "adverse_signal") {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = `Blocked: direct mission KPI (${direct.outcomeId ?? "unknown"}) shows adverse signal. ${direct.reasons.join(" ")}`;
  } else if (direct.verdict === "no_profile") {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = "Blocked: no direct mission outcome profile configured for this predictor.";
  } else if (direct.verdict === "pass" && guardrail.verdict === "pass") {
    overallEligible = true;
    suppressLargeScaleUp = false;
    plainLanguageGuidance = "Eligible: direct mission KPI positive, no guardrail regressions.";
  } else if (direct.verdict === "pass" && guardrail.verdict === "adverse_signal") {
    overallEligible = true;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = `Caution: direct mission KPI positive, but guardrail outcome (${guardrail.outcomeId ?? "unknown"}) shows regression. Large scale-up suppressed.`;
  } else if (direct.verdict === "pass" && guardrail.verdict === "insufficient_data") {
    overallEligible = true;
    suppressLargeScaleUp = false;
    plainLanguageGuidance = "Eligible with caveat: direct mission KPI positive, guardrail data insufficient.";
  } else if (direct.verdict === "weak_signal" && guardrail.verdict === "pass") {
    overallEligible = true;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = "Exploratory: direct mission signal is weak/neutral. Large scale-up suppressed.";
  } else if (direct.verdict === "weak_signal" && guardrail.verdict === "adverse_signal") {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = `Blocked: weak direct mission signal combined with guardrail regression on ${guardrail.outcomeId ?? "unknown"}.`;
  } else if (direct.verdict === "insufficient_data") {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = "Suppressed: insufficient data on direct mission KPIs.";
  } else if (direct.verdict === "sparse_outcome") {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = `Suppressed: direct mission KPI is a rare event with sparse data. ${direct.reasons.join(" ")}`;
  } else {
    overallEligible = false;
    suppressLargeScaleUp = true;
    plainLanguageGuidance = `Suppressed: ${direct.verdict} (direct) + ${guardrail.verdict} (guardrail).`;
  }

  return {
    directMission: direct,
    welfareGuardrail: guardrail,
    overallEligible,
    suppressLargeScaleUp,
    plainLanguageGuidance,
  };
}

function meanOrNull(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizedSlope(
  slope: number | null,
  predictorRange: number,
  outcomeRange: number,
): number | null {
  if (slope == null) return null;
  if (!Number.isFinite(slope) || predictorRange <= 0 || outcomeRange <= 0) return null;
  return (slope * predictorRange) / outcomeRange;
}

function formatMinMax(values: number[], unit: string): string {
  if (values.length === 0) return "N/A";
  const sorted = [...values].sort((a, b) => a - b);
  return `${formatCompactNumber(sorted[0]!)} to ${formatCompactNumber(sorted[sorted.length - 1]!)} ${unit}`;
}

function isGrowthOutcomeId(outcomeId: string): boolean {
  return outcomeId.includes("_growth_");
}

function hasDataBackedDecisionLevel(pair: PairStudyArtifact): boolean {
  return resolveDecisionTargetSource(pair) !== "unavailable";
}

function comparePairsForDecisionSummary(left: PairStudyArtifact, right: PairStudyArtifact): number {
  const leftSufficient = left.dataSufficiency.status === "sufficient" ? 1 : 0;
  const rightSufficient = right.dataSufficiency.status === "sufficient" ? 1 : 0;
  if (leftSufficient !== rightSufficient) return rightSufficient - leftSufficient;

  const leftHasDecision = hasDataBackedDecisionLevel(left) ? 1 : 0;
  const rightHasDecision = hasDataBackedDecisionLevel(right) ? 1 : 0;
  if (leftHasDecision !== rightHasDecision) return rightHasDecision - leftHasDecision;

  const leftLevelOutcome = isGrowthOutcomeId(left.outcomeId) ? 0 : 1;
  const rightLevelOutcome = isGrowthOutcomeId(right.outcomeId) ? 0 : 1;
  if (leftLevelOutcome !== rightLevelOutcome) return rightLevelOutcome - leftLevelOutcome;

  const confidenceDelta = right.reliability.overallScore - left.reliability.overallScore;
  if (Math.abs(confidenceDelta) > 1e-6) return confidenceDelta;

  return right.totalPairs - left.totalPairs;
}

export function computePairMarginalTradeoffDiagnostics(
  pair: PairStudyArtifact,
): PairMarginalTradeoffDiagnostics {
  if (pair.dataSufficiency.status === "insufficient_data") {
    return {
      segmentCount: 0,
      normalizedPreKneeSlope: null,
      normalizedPostKneeSlope: null,
      normalizedTailSlope: null,
      tailSignal: "insufficient",
      taxpayerReturnBenchmark: "insufficient",
    };
  }

  const points = pair.predictorBinRows
    .map((row) => ({
      x: row.predictorMedian ?? row.predictorMean,
      y: row.outcomeMean,
    }))
    .filter(
      (row): row is { x: number; y: number } =>
        row.x != null &&
        row.y != null &&
        Number.isFinite(row.x) &&
        Number.isFinite(row.y),
    )
    .sort((left, right) => left.x - right.x);

  if (points.length < 3) {
    return {
      segmentCount: 0,
      normalizedPreKneeSlope: null,
      normalizedPostKneeSlope: null,
      normalizedTailSlope: null,
      tailSignal: "insufficient",
      taxpayerReturnBenchmark: "insufficient",
    };
  }

  const segments: Array<{ midpoint: number; slope: number }> = [];
  for (let idx = 1; idx < points.length; idx += 1) {
    const left = points[idx - 1]!;
    const right = points[idx]!;
    const dx = right.x - left.x;
    if (dx <= 0 || !Number.isFinite(dx)) continue;
    const dy = right.y - left.y;
    segments.push({
      midpoint: (left.x + right.x) / 2,
      slope: dy / dx,
    });
  }

  if (segments.length < 2) {
    return {
      segmentCount: segments.length,
      normalizedPreKneeSlope: null,
      normalizedPostKneeSlope: null,
      normalizedTailSlope: null,
      tailSignal: "insufficient",
      taxpayerReturnBenchmark: "insufficient",
    };
  }

  const predictorMin = points[0]!.x;
  const predictorMax = points[points.length - 1]!.x;
  const outcomeValues = points.map((row) => row.y);
  const outcomeMin = Math.min(...outcomeValues);
  const outcomeMax = Math.max(...outcomeValues);
  const predictorRange = predictorMax - predictorMin;
  const outcomeRange = outcomeMax - outcomeMin;

  const knee = pair.responseCurve.diminishingReturns.kneePredictorValue;
  const splitIndex = Math.max(1, Math.floor(segments.length / 2));
  const preSegments =
    knee != null && Number.isFinite(knee)
      ? segments.filter((segment) => segment.midpoint <= knee)
      : segments.slice(0, splitIndex);
  const postSegments =
    knee != null && Number.isFinite(knee)
      ? segments.filter((segment) => segment.midpoint > knee)
      : segments.slice(splitIndex);
  const tailSegments = segments.slice(Math.max(segments.length - 2, 0));

  const preSlope = meanOrNull(preSegments.map((segment) => segment.slope));
  const postSlope = meanOrNull(postSegments.map((segment) => segment.slope));
  const tailSlope = meanOrNull(tailSegments.map((segment) => segment.slope));

  const normalizedPre = normalizedSlope(preSlope, predictorRange, outcomeRange);
  const normalizedPost = normalizedSlope(postSlope, predictorRange, outcomeRange);
  const normalizedTail = normalizedSlope(tailSlope, predictorRange, outcomeRange);

  const tailSignal: TailMarginalSignal =
    normalizedTail == null
      ? "insufficient"
      : normalizedTail > 0.05
        ? "positive"
        : normalizedTail < -0.05
          ? "negative"
          : "near_zero";

  const reliabilityScore = pair.reliability?.overallScore;
  const significanceScore = pair.aggregateStatisticalSignificance;
  const lowConfidenceForTradeoff =
    (typeof reliabilityScore === "number" &&
      Number.isFinite(reliabilityScore) &&
      reliabilityScore < 0.55) ||
    (typeof significanceScore === "number" &&
      Number.isFinite(significanceScore) &&
      significanceScore < 0.75);

  const taxpayerReturnBenchmark: TaxpayerReturnBenchmark =
    lowConfidenceForTradeoff
      ? "insufficient"
      : tailSignal === "positive"
        ? "extra_spending_has_signal"
        : tailSignal === "negative"
          ? "possible_harm"
          : tailSignal === "near_zero"
            ? "no_clear_marginal_gain"
            : "insufficient";

  return {
    segmentCount: segments.length,
    normalizedPreKneeSlope: normalizedPre,
    normalizedPostKneeSlope: normalizedPost,
    normalizedTailSlope: normalizedTail,
    tailSignal,
    taxpayerReturnBenchmark,
  };
}

function toSimpleDecisionTargetSourceLabel(source: DecisionTargetSource): string {
  if (source === "support_constrained") return "data-backed level";
  if (source === "robust_fallback") return "backup level";
  return "not enough data";
}

function toSimpleDataStatusLabel(status: DataSufficiencyStatus): string {
  return status === "sufficient" ? "enough data" : "not enough data";
}

function toSimpleReliabilityBandLabel(band: ReliabilityBand): string {
  if (band === "high") return "higher confidence";
  if (band === "moderate") return "medium confidence";
  return "lower confidence";
}

function toSimpleQualityTierLabel(tier: PairQualityTier): string {
  if (tier === "strong") return "strong signal";
  if (tier === "moderate") return "moderate signal";
  if (tier === "exploratory") return "early signal";
  return "not enough data";
}

function toSimpleEvidenceGradeLabel(grade: "A" | "B" | "C" | "D" | "F"): string {
  const detail =
    grade === "A"
      ? "very strong"
      : grade === "B"
        ? "strong"
        : grade === "C"
          ? "moderate"
          : grade === "D"
            ? "weak"
            : "very weak";
  return `${grade} (${detail})`;
}

export function resolveDecisionTargetSource(pair: PairStudyArtifact): DecisionTargetSource {
  if (!isRecommendationEligible(pair)) return "unavailable";
  const support = pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue;
  if (support != null && Number.isFinite(support)) return "support_constrained";
  const robust = pair.responseCurve.supportConstrainedTargets.robustOptimalValue;
  if (robust != null && Number.isFinite(robust)) return "robust_fallback";
  return "unavailable";
}

export function resolveDecisionOptimalValue(pair: PairStudyArtifact): number | null {
  const source = resolveDecisionTargetSource(pair);
  if (source === "support_constrained") {
    return pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue;
  }
  if (source === "robust_fallback") {
    return pair.responseCurve.supportConstrainedTargets.robustOptimalValue;
  }
  return null;
}

function formatDecisionLevelWithSource(pair: PairStudyArtifact): string {
  const decisionLevel = resolveDecisionOptimalValue(pair);
  if (decisionLevel == null || !Number.isFinite(decisionLevel)) return "N/A";
  const source = toSimpleDecisionTargetSourceLabel(resolveDecisionTargetSource(pair));
  return `${formatValueWithUnit(decisionLevel, pair.predictorUnit)} (${source})`;
}

function resolveDecisionBestPerCapitaPpp(pair: PairStudyArtifact): number | null {
  if (!isPercentGdpUnit(pair.predictorUnit)) return null;
  const decisionTarget = resolveDecisionOptimalValue(pair);
  const medianGdpPerCapitaPpp = pair.pppPerCapitaSummary?.medianGdpPerCapitaPpp;
  if (decisionTarget == null || medianGdpPerCapitaPpp == null) return null;
  return convertPercentGdpToPerCapitaPpp(decisionTarget, medianGdpPerCapitaPpp);
}

function buildPairActionableTakeaway(pair: PairStudyArtifact): string[] {
  const lines: string[] = [];
  if (pair.dataSufficiency.status === "insufficient_data") {
    lines.push(
      `No recommended level is shown for ${pair.predictorLabel} -> ${pair.outcomeLabel} because there is not enough data.`,
    );
    if (pair.dataSufficiency.reasons.length > 0) {
      lines.push(`Why: ${pair.dataSufficiency.reasons.join("; ")}.`);
    }
    lines.push(
      `Observed support in this run: ${pair.includedSubjects} subjects, ${pair.totalPairs} aligned pairs, ${pair.predictorBinRows.length} predictor bins, ${pair.temporalCandidatesWithResults} temporal candidates with valid results.`,
    );
    lines.push("Use this pair for background learning only until we have enough data.");
    return lines;
  }
  const modelOptimalValue = resolveActionableOptimalValue(pair);
  const decisionTargetValue = resolveDecisionOptimalValue(pair);
  const decisionTargetSource = resolveDecisionTargetSource(pair);
  const bestBin = bestObservedBinRow(pair);
  const decisionTargetPpp = resolveDecisionBestPerCapitaPpp(pair);
  const supportTargets = pair.responseCurve.supportConstrainedTargets;
  const med = pair.responseCurve.minimumEffectiveDose;
  const diminishing = pair.responseCurve.diminishingReturns;
  const saturation = pair.responseCurve.saturationRange;

  lines.push(
    `Recommended ${pair.predictorLabel} level for higher ${pair.outcomeLabel}: ${formatValueWithUnit(decisionTargetValue, pair.predictorUnit)} (${toSimpleDecisionTargetSourceLabel(decisionTargetSource)}).`,
  );
  if (supportTargets.detected) {
    lines.push(
      `Best level directly seen in the grouped data: ${formatValueWithUnit(supportTargets.supportConstrainedOptimalValue, pair.predictorUnit)}.`,
    );
  }
  if (decisionTargetValue == null && modelOptimalValue != null) {
    lines.push(
      "No data-backed level was found, so this pair has no recommendation.",
    );
  }
  if (isOutsideObservedRange(modelOptimalValue, pair.predictorObservedMin, pair.predictorObservedMax)) {
    const bestObservedValue = bestBin?.predictorMedian ?? bestBin?.predictorMean ?? null;
    const deltaText = formatObservedAnchorDelta(modelOptimalValue, bestObservedValue);
    lines.push(
      `Math-only guess ${formatValueWithUnit(modelOptimalValue, pair.predictorUnit)} is outside the seen data range ${formatObservedRange(pair.predictorObservedMin, pair.predictorObservedMax)}, so it is not used as the recommendation.`,
    );
    if (bestObservedValue != null) {
      lines.push(
        `Nearest observed-support anchor (best observed bin median/mean) is ${formatValueWithUnit(bestObservedValue, pair.predictorUnit)}; model-optimal minus observed-anchor difference is ${deltaText}.`,
      );
    }
  } else if (isOutsideBestObservedBin(pair, modelOptimalValue)) {
    const bestObservedValue = bestBin?.predictorMedian ?? bestBin?.predictorMean ?? null;
    const deltaText = formatObservedAnchorDelta(modelOptimalValue, bestObservedValue);
    lines.push(
      "Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.",
    );
    if (bestObservedValue != null) {
      lines.push(
        `Best observed bin anchor (median/mean) is ${formatValueWithUnit(bestObservedValue, pair.predictorUnit)}; model-optimal minus observed-anchor difference is ${deltaText}.`,
      );
    }
  }
  if (pair.robustness.robustOptimalValue != null) {
    lines.push(
      `Backup level check (middle ${Math.round(pair.robustness.trimLowerQuantile * 100)}-${Math.round(pair.robustness.trimUpperQuantile * 100)}% of data) suggests ${formatValueWithUnit(pair.robustness.robustOptimalValue, pair.predictorUnit)}.`,
    );
  }
  if (
    pair.robustness.optimalDeltaPercent != null &&
    Math.abs(pair.robustness.optimalDeltaPercent) >= 25
  ) {
    lines.push(
      `The math-only guess and backup level differ by ${Math.abs(pair.robustness.optimalDeltaPercent).toFixed(1)}%, which means extreme values may matter a lot.`,
    );
  }
  if (med.detected) {
    lines.push(
      `Minimum effective level (first consistently positive zone): ${formatValueWithUnit(med.minimumEffectiveDose, pair.predictorUnit)}.`,
    );
  } else {
    lines.push(
      `Could not find a clear minimum useful level (${med.reason ?? "unknown"}).`,
    );
  }
  if (diminishing.detected) {
    lines.push(
      `Diminishing returns likely begin near ${formatValueWithUnit(diminishing.kneePredictorValue, pair.predictorUnit)}.`,
    );
  } else {
    lines.push(
      `Could not find a clear point where gains start slowing down (${diminishing.reason ?? "unknown"}).`,
    );
  }
  if (saturation.detected) {
    lines.push(
      `Saturation/plateau zone starts around ${formatValueWithUnit(saturation.plateauStartPredictorValue, pair.predictorUnit)} and extends through ${formatValueWithUnit(saturation.plateauEndPredictorValue, pair.predictorUnit)}.`,
    );
  } else {
    lines.push(
      `Could not find a stable flat zone (${saturation.reason ?? "unknown"}).`,
    );
  }
  if (decisionTargetPpp != null) {
    lines.push(
      `Approximate per-person PPP amount for the recommended level: ${formatCompactNumber(decisionTargetPpp)} international $/person.`,
    );
  }
  if (bestBin?.outcomeMean != null) {
    lines.push(
      `Highest observed mean ${pair.outcomeLabel} appears when ${pair.predictorLabel} is in ${bestBin.label} (mean outcome ${formatCompactNumber(bestBin.outcomeMean)}).`,
    );
  }
  if (pair.pppPerCapitaSummary?.bestObservedPerCapitaPppRange != null) {
    lines.push(
      `PPP per-capita equivalent in that best observed bin (p10-p90): ${pair.pppPerCapitaSummary.bestObservedPerCapitaPppRange}.`,
    );
  }
  if (pair.direction === "negative") {
    lines.push("Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.");
  } else if (pair.direction === "positive") {
    lines.push("Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.");
  } else {
    lines.push("Direction signal is neutral; use caution and rely on the data-backed level.");
  }
  return lines;
}

function buildEvidenceInterpretation(pair: PairStudyArtifact): string {
  if (pair.aggregateStatisticalSignificance >= 0.9 && pair.includedSubjects >= 120) {
    return "Stronger signal compared with most other predictors in this report.";
  }
  if (pair.aggregateStatisticalSignificance >= 0.8 && pair.includedSubjects >= 60) {
    return "Medium signal; still sensitive to model choices.";
  }
  return "Early signal only; use this mainly to guide more testing.";
}

function selectOutcomeDisplayRows(
  ranking: OutcomeMegaStudyRanking,
  pairByKey: Map<string, PairStudyArtifact>,
): ActionableOutcomeRow[] {
  const rowsWithPairs: ActionableOutcomeRow[] = ranking.rows
    .map((row) => ({
      row,
      pair: pairByKey.get(`${row.predictorId}::${row.outcomeId}`),
    }))
    .filter((entry): entry is ActionableOutcomeRow => entry.pair != null)
    .filter((entry) => isRecommendationEligible(entry.pair));

  return rowsWithPairs.sort((left, right) => {
    const leftLabel = left.pair.predictorLabel || left.row.predictorLabel || left.row.predictorId;
    const rightLabel = right.pair.predictorLabel || right.row.predictorLabel || right.row.predictorId;
    return leftLabel.localeCompare(rightLabel);
  });
}

function toTimeSeriesMap(
  variable: VariableRegistryEntry,
  points: DataPoint[],
  minimumMeasurementsPerSeries: number,
): Map<string, TimeSeries> {
  const bySubject = new Map<string, Array<{ year: number; value: number }>>();
  for (const point of points) {
    const adjustedValue =
      variable.kind === "outcome" && variable.welfareDirection === "lower_better"
        ? -point.value
        : point.value;
    const existing = bySubject.get(point.jurisdictionIso3) ?? [];
    existing.push({ year: point.year, value: adjustedValue });
    bySubject.set(point.jurisdictionIso3, existing);
  }

  const result = new Map<string, TimeSeries>();
  for (const [subjectId, rows] of bySubject) {
    const measurements = rows
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        timestamp: `${row.year}-01-01T00:00:00.000Z`,
        value: row.value,
        source: variable.source.provider,
        unit: variable.unit,
      }));

    if (measurements.length < minimumMeasurementsPerSeries) continue;
    result.set(subjectId, {
      variableId: variable.id,
      name: variable.label,
      measurements,
      category: variable.category,
    });
  }

  return result;
}

function toCountryYearKey(row: Pick<DataPoint, "jurisdictionIso3" | "year">): string {
  return `${row.jurisdictionIso3}::${row.year}`;
}

function indexByCountryYear(points: DataPoint[]): Map<string, DataPoint> {
  const index = new Map<string, DataPoint>();
  for (const point of points) {
    index.set(toCountryYearKey(point), point);
  }
  return index;
}

export function buildDerivedPercentGdpPerCapitaPpp(
  raw: Map<string, DataPoint[]>,
  percentOfGdpVariableId: string,
  sourceLabel: string,
): DataPoint[] {
  const percentRows = raw.get(percentOfGdpVariableId) ?? [];
  const gdp = raw.get("outcome.wb.gdp_per_capita_ppp") ?? [];
  const gdpByKey = indexByCountryYear(gdp);
  const rows: DataPoint[] = [];
  for (const row of percentRows) {
    const gdpPoint = gdpByKey.get(toCountryYearKey(row));
    if (!gdpPoint || !Number.isFinite(gdpPoint.value)) continue;
    rows.push({
      jurisdictionIso3: row.jurisdictionIso3,
      year: row.year,
      value: (row.value / 100) * gdpPoint.value,
      unit: "international $/person",
      source: sourceLabel,
      sourceUrl: row.sourceUrl ?? gdpPoint.sourceUrl,
    });
  }
  return rows;
}

export function buildDerivedShareOfVariablePercent(
  raw: Map<string, DataPoint[]>,
  numeratorVariableId: string,
  denominatorVariableId: string,
  sourceLabel: string,
): DataPoint[] {
  const numeratorRows = raw.get(numeratorVariableId) ?? [];
  const denominatorByKey = indexByCountryYear(raw.get(denominatorVariableId) ?? []);
  const rows: DataPoint[] = [];

  for (const numeratorRow of numeratorRows) {
    const denominatorPoint = denominatorByKey.get(toCountryYearKey(numeratorRow));
    if (!denominatorPoint) continue;
    if (!Number.isFinite(numeratorRow.value) || !Number.isFinite(denominatorPoint.value)) continue;
    if (denominatorPoint.value <= 0) continue;
    const sharePercent = (numeratorRow.value / denominatorPoint.value) * 100;
    if (!Number.isFinite(sharePercent) || sharePercent < 0) continue;

    rows.push({
      jurisdictionIso3: numeratorRow.jurisdictionIso3,
      year: numeratorRow.year,
      value: sharePercent,
      unit: "% of government expenditure",
      source: sourceLabel,
      sourceUrl: numeratorRow.sourceUrl ?? denominatorPoint.sourceUrl,
    });
  }

  return rows;
}

export function buildDerivedDifferencePerCapitaPpp(
  raw: Map<string, DataPoint[]>,
  minuendVariableId: string,
  subtrahendVariableId: string,
  sourceLabel: string,
): DataPoint[] {
  const minuendRows = raw.get(minuendVariableId) ?? [];
  const subtrahendByKey = indexByCountryYear(raw.get(subtrahendVariableId) ?? []);
  const rows: DataPoint[] = [];

  for (const minuendRow of minuendRows) {
    const subtrahendPoint = subtrahendByKey.get(toCountryYearKey(minuendRow));
    if (!subtrahendPoint) continue;
    if (!Number.isFinite(minuendRow.value) || !Number.isFinite(subtrahendPoint.value)) continue;
    const difference = minuendRow.value - subtrahendPoint.value;
    if (!Number.isFinite(difference) || difference < 0) continue;
    rows.push({
      jurisdictionIso3: minuendRow.jurisdictionIso3,
      year: minuendRow.year,
      value: difference,
      unit: "international $/person",
      source: sourceLabel,
      sourceUrl: minuendRow.sourceUrl ?? subtrahendPoint.sourceUrl,
    });
  }

  return rows;
}

export function buildDerivedAfterTaxMedianIncomePpp(raw: Map<string, DataPoint[]>): DataPoint[] {
  const gniPerCapitaPpp = raw.get("outcome.wb.gni_per_capita_ppp") ?? [];
  return gniPerCapitaPpp
    .filter((row) => Number.isFinite(row.value))
    .map((row) => ({
      jurisdictionIso3: row.jurisdictionIso3,
      year: row.year,
      value: row.value,
      unit: "international $",
      source: "Derived proxy (mapped from World Bank GNI per-capita PPP)",
      sourceUrl: row.sourceUrl,
    }));
}

export function buildDerivedYoYPercent(points: DataPoint[], sourceLabel: string): DataPoint[] {
  const byJurisdiction = new Map<string, DataPoint[]>();
  for (const point of points) {
    const rows = byJurisdiction.get(point.jurisdictionIso3) ?? [];
    rows.push(point);
    byJurisdiction.set(point.jurisdictionIso3, rows);
  }

  const output: DataPoint[] = [];
  for (const [jurisdictionIso3, rows] of byJurisdiction) {
    const sorted = [...rows].sort((a, b) => a.year - b.year);
    for (let index = 1; index < sorted.length; index++) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous || !current) continue;
      if (current.year - previous.year !== 1) continue;
      if (!Number.isFinite(previous.value) || !Number.isFinite(current.value)) continue;
      if (previous.value === 0) continue;
      output.push({
        jurisdictionIso3,
        year: current.year,
        value: ((current.value - previous.value) / Math.abs(previous.value)) * 100,
        unit: "% YoY",
        source: sourceLabel,
      });
    }
  }

  return output;
}

export function buildDerivedRatePer100k(
  countPoints: DataPoint[],
  populationPoints: DataPoint[],
  sourceLabel: string,
): DataPoint[] {
  const popIndex = new Map<string, number>();
  for (const point of populationPoints) {
    if (Number.isFinite(point.value) && point.value > 0) {
      popIndex.set(`${point.jurisdictionIso3}::${point.year}`, point.value);
    }
  }

  const output: DataPoint[] = [];
  for (const point of countPoints) {
    if (!Number.isFinite(point.value)) continue;
    const pop = popIndex.get(`${point.jurisdictionIso3}::${point.year}`);
    if (!pop) continue;
    output.push({
      jurisdictionIso3: point.jurisdictionIso3,
      year: point.year,
      value: (point.value / pop) * 100_000,
      unit: "deaths per 100,000 people",
      source: sourceLabel,
    });
  }

  return output;
}

async function fetchRegistryVariable(
  variable: VariableRegistryEntry,
  fetchOptions: FetchOptions,
): Promise<DataPoint[]> {
  const fetcherName = variable.source.fetcher;
  if (!fetcherName) return [];
  const fetcherCandidate = fetchers[fetcherName as keyof typeof fetchers];
  if (typeof fetcherCandidate !== "function" || fetcherName === "FREDApiKeyMissingError") {
    return [];
  }
  const fetcher = fetcherCandidate as (options: FetchOptions) => Promise<DataPoint[]>;
  return fetcher(fetchOptions);
}

function toPairFileName(pair: PairStudyArtifact): string {
  return `pair-${slugifyId(pair.predictorId)}__${slugifyId(pair.outcomeId)}.md`;
}

function toOutcomeFileName(outcomeId: string): string {
  return `outcome-${slugifyId(outcomeId)}.md`;
}

export function buildMegaStudyApiPayload(
  generatedAt: string,
  pairStudies: PairStudyArtifact[],
  rankings: OutcomeMegaStudyRanking[],
  gateResults?: ReadonlyMap<string, TwoStageGateResult>,
): MegaStudyApiPayload {
  const pairByKey = new Map(pairStudies.map((pair) => [`${pair.predictorId}::${pair.outcomeId}`, pair]));
  const pairs: MegaStudyApiPair[] = pairStudies.map((pair) => {
    const modelBest = resolveActionableOptimalValue(pair);
    const decisionBest = resolveDecisionOptimalValue(pair);
    const gateResult = gateResults?.get(pair.predictorId) ?? null;
    return {
      pairId: pair.pairId,
      predictor: {
        id: pair.predictorId,
        label: pair.predictorLabel,
        unit: pair.predictorUnit,
      },
      outcome: {
        id: pair.outcomeId,
        label: pair.outcomeLabel,
        unit: pair.outcomeUnit,
      },
      targets: {
        decisionBest,
        decisionTargetSource: resolveDecisionTargetSource(pair),
        modelBest,
        observedSupportBest: pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue,
        robustBest: pair.robustness.robustOptimalValue,
        minimumEffectiveDose: pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
        diminishingReturnsKnee: pair.responseCurve.diminishingReturns.kneePredictorValue,
        saturationStart: pair.responseCurve.saturationRange.plateauStartPredictorValue,
        saturationEnd: pair.responseCurve.saturationRange.plateauEndPredictorValue,
      },
      diagnostics: {
        qualityTier: pair.qualityTier,
        evidenceGrade: pair.evidenceGrade,
        significance: pair.aggregateStatisticalSignificance,
        directionalScore: pair.aggregatePredictivePearson,
        direction: pair.direction,
        includedSubjects: pair.includedSubjects,
        totalPairs: pair.totalPairs,
        extrapolative: isOutsideObservedRange(
          decisionBest,
          pair.predictorObservedMin,
          pair.predictorObservedMax,
        ),
        outsideBestObservedBin: isOutsideBestObservedBin(pair, decisionBest),
        modelExtrapolative: isOutsideObservedRange(
          modelBest,
          pair.predictorObservedMin,
          pair.predictorObservedMax,
        ),
        modelOutsideBestObservedBin: isOutsideBestObservedBin(pair, modelBest),
        dataSufficiencyStatus: pair.dataSufficiency.status,
        reliabilityScore: pair.reliability.overallScore,
        reliabilityBand: pair.reliability.band,
        publicationEligible: isPublicationEligibleRecommendation(pair, gateResult),
        twoStageGate: gateResult
          ? {
              directMissionVerdict: gateResult.directMission.verdict,
              welfareGuardrailVerdict: gateResult.welfareGuardrail.verdict,
              overallEligible: gateResult.overallEligible,
              suppressLargeScaleUp: gateResult.suppressLargeScaleUp,
              plainLanguageGuidance: gateResult.plainLanguageGuidance,
            }
          : null,
      },
      links: {
        markdownFile: toPairFileName(pair),
      },
    };
  });

  const outcomes: MegaStudyApiOutcome[] = rankings.map((ranking) => {
    const firstPair = ranking.rows
      .map((row) => pairByKey.get(`${row.predictorId}::${row.outcomeId}`))
      .find((pair): pair is PairStudyArtifact => pair != null);
    return {
      outcomeId: ranking.outcomeId,
      outcomeLabel: firstPair?.outcomeLabel ?? ranking.outcomeId,
      outcomeMarkdownFile: toOutcomeFileName(ranking.outcomeId),
      rows: ranking.rows
        .map((row) => {
          const pair = pairByKey.get(`${row.predictorId}::${row.outcomeId}`);
          if (!pair) return null;
          return {
            rank: row.rank,
            predictorId: row.predictorId,
            predictorLabel: row.predictorLabel ?? row.predictorId,
            score: row.score,
            confidence: row.confidence,
            adjustedPValue: row.adjustedPValue,
            qualityTier: pair.qualityTier,
            dataSufficiencyStatus: pair.dataSufficiency.status,
            reliabilityScore: pair.reliability.overallScore,
            reliabilityBand: pair.reliability.band,
            pairId: pair.pairId,
            pairMarkdownFile: toPairFileName(pair),
            publicationEligible: isPublicationEligibleRecommendation(pair),
          } satisfies MegaStudyApiOutcomeRow;
        })
        .filter((row): row is MegaStudyApiOutcomeRow => row != null),
    };
  });

  return {
    schemaVersion: "2026-02-14",
    generatedAt,
    outcomes,
    pairs,
  };
}

function buildPairMarkdown(pair: PairStudyArtifact): string {
  const lines: string[] = [];
  const modelOptimalValue = resolveActionableOptimalValue(pair);
  const decisionTargetValue = resolveDecisionOptimalValue(pair);
  const decisionTargetSource = resolveDecisionTargetSource(pair);
  const decisionTargetPpp = resolveDecisionBestPerCapitaPpp(pair);
  lines.push(`# Pair Study: ${pair.predictorLabel} -> ${pair.outcomeLabel}`);
  lines.push("");
  lines.push(`- Pair ID: \`${pair.pairId}\``);
  lines.push(`- Lag years: ${pair.lagYears}`);
  lines.push(`- Duration years: ${pair.durationYears}`);
  lines.push(`- Temporal profile source: ${pair.temporalProfileSource}`);
  lines.push(
    `- Filling strategy: ${pair.fillingType}${pair.fillingType === "value" && pair.fillingValue != null ? ` (${pair.fillingValue})` : ""}`,
  );
  lines.push(`- Temporal candidates evaluated: ${pair.temporalCandidatesEvaluated}`);
  lines.push(`- Temporal candidates with valid results: ${pair.temporalCandidatesWithResults}`);
  lines.push(`- Temporal profile score: ${pair.temporalScore.toFixed(4)}`);
  lines.push(`- Included subjects: ${pair.includedSubjects}`);
  lines.push(`- Skipped subjects: ${pair.skippedSubjects}`);
  lines.push(`- Total aligned pairs: ${pair.totalPairs}`);
  lines.push(`- Signal grade: ${toSimpleEvidenceGradeLabel(pair.evidenceGrade)}`);
  lines.push(`- Data status: ${toSimpleDataStatusLabel(pair.dataSufficiency.status)}`);
  lines.push(`- Confidence score: ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)})`);
  lines.push(`- Signal tag: ${toSimpleQualityTierLabel(pair.qualityTier)}`);
  lines.push(`- Direction: ${pair.direction}`);
  lines.push(`- Uncertainty score: ${pair.pValue.toFixed(4)} (lower is better)`);
  lines.push("");
  lines.push("## Quick Meanings");
  lines.push("");
  lines.push("- `Recommended level`: main value to try first.");
  lines.push("- `Data-backed level`: level directly supported by seen data.");
  lines.push("- `Backup level`: safer fallback from the middle of the data.");
  lines.push("- `Math-only guess`: unconstrained model output for technical comparison.");
  lines.push("- `Not enough data`: we cannot safely recommend a level yet.");
  lines.push("");
  lines.push("## Key Numeric Takeaways");
  lines.push("");
  for (const sentence of buildPairActionableTakeaway(pair)) {
    lines.push(`- ${sentence}`);
  }
  lines.push("");
  lines.push("## Decision Summary");
  lines.push("");
  if (pair.dataSufficiency.status === "insufficient_data") {
    lines.push(
      "- Interpretation: not enough data for a safe recommendation.",
    );
    lines.push(
      "- Recommendation status: no recommended level until data improves.",
    );
    if (pair.dataSufficiency.reasons.length > 0) {
      lines.push(`- Why: ${pair.dataSufficiency.reasons.join("; ")}.`);
    }
  } else {
    lines.push(`- Interpretation: ${buildEvidenceInterpretation(pair)}`);
    lines.push(
      pair.direction === "positive"
        ? `- Pattern hint: higher ${pair.predictorLabel} tends to go with better ${pair.outcomeLabel}.`
        : pair.direction === "negative"
          ? `- Pattern hint: lower ${pair.predictorLabel} tends to go with better ${pair.outcomeLabel}.`
          : `- Pattern hint: no clear up/down pattern; use data-backed levels only.`,
    );
    lines.push(
      pair.aggregateStatisticalSignificance >= 0.85
        ? "- Signal strength: stronger in this report set."
        : "- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.",
    );
  }
  lines.push("");
  lines.push("## Plain-Language Summary");
  lines.push("");
  for (const sentence of pair.narrativeSummary) {
    lines.push(`- ${sentence}`);
  }
  if (pair.qualityWarnings.length > 0) {
    lines.push("");
    lines.push("## Quality Warnings");
    lines.push("");
    for (const warning of pair.qualityWarnings) {
      lines.push(`- ${warning}`);
    }
  }
  if (pair.sparseOutcomeDiagnostics) {
    lines.push("");
    lines.push("## Rare-Event Warning");
    lines.push("");
    lines.push(`- This outcome is flagged as a rare/sparse event.`);
    lines.push(`- Bins with events: ${pair.sparseOutcomeDiagnostics.binsWithEvents}/${pair.sparseOutcomeDiagnostics.binsWithEvents + pair.sparseOutcomeDiagnostics.binsWithoutEvents}`);
    lines.push(`- Median events per bin: ${pair.sparseOutcomeDiagnostics.medianEventsPerBin}`);
    lines.push(`- Total events: ${pair.sparseOutcomeDiagnostics.totalEvents}`);
    if (!pair.sparseOutcomeDiagnostics.meetsMinimumEventThreshold) {
      lines.push("- **No numeric target is safe to recommend** based on this sparse data.");
    }
    for (const warning of pair.sparseOutcomeDiagnostics.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push("");
  lines.push("## Appendix: Technical Diagnostics");
  lines.push("");
  lines.push("### Core Metrics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|------:|");
  lines.push(`| Forward correlation | ${pair.aggregateForwardPearson.toFixed(4)} |`);
  lines.push(`| Reverse correlation | ${pair.aggregateReversePearson.toFixed(4)} |`);
  lines.push(`| Direction score (forward - reverse) | ${pair.aggregatePredictivePearson.toFixed(4)} |`);
  lines.push(`| Effect size (% change from baseline) | ${pair.aggregateEffectSize.toFixed(4)} |`);
  lines.push(`| Significance score | ${pair.aggregateStatisticalSignificance.toFixed(4)} |`);
  lines.push(`| Weighted PIS | ${pair.weightedAveragePIS.toFixed(4)} |`);
  lines.push(`| Value linked with higher outcome | ${pair.aggregateValuePredictingHighOutcome == null ? "N/A" : pair.aggregateValuePredictingHighOutcome.toFixed(4)} |`);
  lines.push(`| Value linked with lower outcome | ${pair.aggregateValuePredictingLowOutcome == null ? "N/A" : pair.aggregateValuePredictingLowOutcome.toFixed(4)} |`);
  lines.push(`| Math-only best daily value | ${pair.aggregateOptimalDailyValue == null ? "N/A" : pair.aggregateOptimalDailyValue.toFixed(4)} |`);
  lines.push(`| Recommended level (reader-facing) | ${formatValueWithUnit(decisionTargetValue, pair.predictorUnit)} (${toSimpleDecisionTargetSourceLabel(decisionTargetSource)}) |`);
  lines.push(`| Math-only guess (technical) | ${formatValueWithUnit(modelOptimalValue, pair.predictorUnit)} |`);
  lines.push(`| Data-backed level | ${pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue == null ? "N/A" : formatCompactNumber(pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue)} ${pair.predictorUnit} |`);
  lines.push(`| Data-backed range | ${pair.responseCurve.supportConstrainedTargets.supportConstrainedRange == null ? "N/A" : formatBinLabel(pair.responseCurve.supportConstrainedTargets.supportConstrainedRange.lowerBound, pair.responseCurve.supportConstrainedTargets.supportConstrainedRange.upperBound, pair.responseCurve.supportConstrainedTargets.supportConstrainedRange.isUpperInclusive)} |`);
  lines.push(`| Backup level (middle-data check) | ${pair.responseCurve.supportConstrainedTargets.robustOptimalValue == null ? "N/A" : formatCompactNumber(pair.responseCurve.supportConstrainedTargets.robustOptimalValue)} ${pair.predictorUnit} |`);
  lines.push(`| Math-only guess inside seen data range? | ${pair.responseCurve.supportConstrainedTargets.rawWithinObservedRange == null ? "N/A" : pair.responseCurve.supportConstrainedTargets.rawWithinObservedRange ? "yes" : "no"} |`);
  lines.push(`| Math-only guess inside data-backed range? | ${pair.responseCurve.supportConstrainedTargets.rawWithinSupportRange == null ? "N/A" : pair.responseCurve.supportConstrainedTargets.rawWithinSupportRange ? "yes" : "no"} |`);
  lines.push(`| Seen data range | ${pair.predictorObservedMin == null || pair.predictorObservedMax == null ? "N/A" : `[${pair.predictorObservedMin.toFixed(4)}, ${pair.predictorObservedMax.toFixed(4)}]`} |`);
  lines.push(
    `| Math-only guess outside seen data? | ${
      isOutsideObservedRange(modelOptimalValue, pair.predictorObservedMin, pair.predictorObservedMax)
        ? "yes (outside observed range)"
        : "no (within observed range)"
    } |`,
  );
  lines.push(
    `| Math-only guess outside best observed bucket? | ${
      isOutsideBestObservedBin(pair, modelOptimalValue)
        ? "yes"
        : "no"
    } |`,
  );
  lines.push(`| Best observed range | ${pair.robustness.rawBestObservedRange ?? "N/A"} |`);
  lines.push(`| Best observed range (middle-data check) | ${pair.robustness.robustBestObservedRange ?? "N/A"} |`);
  lines.push(`| Best observed outcome average | ${pair.robustness.rawBestOutcomeMean == null ? "N/A" : formatCompactNumber(pair.robustness.rawBestOutcomeMean)} |`);
  lines.push(`| Best observed outcome average (middle-data check) | ${pair.robustness.robustBestOutcomeMean == null ? "N/A" : formatCompactNumber(pair.robustness.robustBestOutcomeMean)} |`);
  lines.push(`| Backup level (bucket median) | ${pair.robustness.robustOptimalValue == null ? "N/A" : formatCompactNumber(pair.robustness.robustOptimalValue)} ${pair.predictorUnit} |`);
  lines.push(`| Math-only vs backup difference | ${pair.robustness.optimalDeltaAbsolute == null || pair.robustness.optimalDeltaPercent == null ? "N/A" : `${formatCompactNumber(pair.robustness.optimalDeltaAbsolute)} (${pair.robustness.optimalDeltaPercent >= 0 ? "+" : ""}${pair.robustness.optimalDeltaPercent.toFixed(1)}%)`} |`);
  lines.push(`| Middle-data share kept | ${(pair.robustness.retainedFraction * 100).toFixed(1)}% (${pair.robustness.trimmedPairCount}/${pair.robustness.rawPairCount}) |`);
  lines.push(`| Data status | ${toSimpleDataStatusLabel(pair.dataSufficiency.status)} |`);
  lines.push(`| Data-status details | ${pair.dataSufficiency.reasons.length > 0 ? pair.dataSufficiency.reasons.join("; ") : "none"} |`);
  lines.push(`| Confidence score | ${pair.reliability.overallScore.toFixed(4)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}) |`);
  lines.push(`| Reliability support component | ${pair.reliability.components.support.toFixed(4)} |`);
  lines.push(`| Reliability significance component | ${pair.reliability.components.significance.toFixed(4)} |`);
  lines.push(`| Reliability directional component | ${pair.reliability.components.directional.toFixed(4)} |`);
  lines.push(`| Reliability temporal-stability component | ${pair.reliability.components.temporalStability.toFixed(4)} |`);
  lines.push(`| Reliability robustness component | ${pair.reliability.components.robustness.toFixed(4)} |`);
  lines.push(`| Signal tag | ${toSimpleQualityTierLabel(pair.qualityTier)} |`);
  if (pair.pppPerCapitaSummary != null) {
    lines.push(
      `| Recommended level (PPP per-person equivalent) | ${decisionTargetPpp == null ? "N/A" : `${formatCompactNumber(decisionTargetPpp)} international $/person`} |`,
    );
    lines.push(
      `| Math-only best level (PPP per-person equivalent) | ${pair.pppPerCapitaSummary.estimatedBestPerCapitaPpp == null ? "N/A" : `${formatCompactNumber(pair.pppPerCapitaSummary.estimatedBestPerCapitaPpp)} international $/person`} |`,
    );
    lines.push(
      `| Best observed PPP per-person range (p10-p90) | ${pair.pppPerCapitaSummary.bestObservedPerCapitaPppRange ?? "N/A"} |`,
    );
    lines.push(
      `| Median GDP per-capita PPP (context) | ${pair.pppPerCapitaSummary.medianGdpPerCapitaPpp == null ? "N/A" : `${formatCompactNumber(pair.pppPerCapitaSummary.medianGdpPerCapitaPpp)} international $`} |`,
    );
    lines.push(
      `| Pairs with PPP conversion | ${pair.pppPerCapitaSummary.samplePairs} |`,
    );
  }
  lines.push("");
  lines.push("### Response-Curve Diagnostics");
  lines.push("");
  lines.push("| Diagnostic | Result |");
  lines.push("|------------|--------|");
  lines.push(
    `| Minimum useful level | ${
      pair.responseCurve.minimumEffectiveDose.detected
        ? `${formatValueWithUnit(pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose, pair.predictorUnit)} (z=${pair.responseCurve.minimumEffectiveDose.zScoreAtDose == null ? "N/A" : pair.responseCurve.minimumEffectiveDose.zScoreAtDose.toFixed(2)})`
        : `Not identified (${pair.responseCurve.minimumEffectiveDose.reason ?? "unknown"})`
    } |`,
  );
  lines.push(
    `| Point where gains start slowing | ${
      pair.responseCurve.diminishingReturns.detected
        ? `${formatValueWithUnit(pair.responseCurve.diminishingReturns.kneePredictorValue, pair.predictorUnit)} (ratio=${pair.responseCurve.diminishingReturns.slopeRatio == null ? "N/A" : pair.responseCurve.diminishingReturns.slopeRatio.toFixed(3)})`
        : `Not identified (${pair.responseCurve.diminishingReturns.reason ?? "unknown"})`
    } |`,
  );
  lines.push(
    `| Flat zone range | ${
      pair.responseCurve.saturationRange.detected &&
      pair.responseCurve.saturationRange.plateauRange != null
        ? `${formatBinLabel(pair.responseCurve.saturationRange.plateauRange.lowerBound, pair.responseCurve.saturationRange.plateauRange.upperBound, pair.responseCurve.saturationRange.plateauRange.isUpperInclusive)}`
        : `Not identified (${pair.responseCurve.saturationRange.reason ?? "unknown"})`
    } |`,
  );
  lines.push(
    `| Why this data-backed level was chosen | ${pair.responseCurve.supportConstrainedTargets.reason ?? "identified"} |`,
  );
  lines.push(
    `| Math-only guess minus data-backed level | ${
      pair.responseCurve.supportConstrainedTargets.deltas.rawToSupportAbsolute == null
        ? "N/A"
        : `${formatCompactNumber(pair.responseCurve.supportConstrainedTargets.deltas.rawToSupportAbsolute)} (${pair.responseCurve.supportConstrainedTargets.deltas.rawToSupportPercent == null ? "N/A" : `${pair.responseCurve.supportConstrainedTargets.deltas.rawToSupportPercent >= 0 ? "+" : ""}${pair.responseCurve.supportConstrainedTargets.deltas.rawToSupportPercent.toFixed(1)}%`})`
    } |`,
  );
  lines.push("");
  lines.push("### Temporal Sensitivity");
  lines.push("");
  lines.push("| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |");
  lines.push("|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|");
  lines.push(
    `| Selected | ${pair.temporalProfileSource} | ${pair.lagYears} | ${pair.durationYears} | ${pair.fillingType}${pair.fillingType === "value" && pair.fillingValue != null ? ` (${pair.fillingValue})` : ""} | ${pair.temporalScore.toFixed(4)} | 0.0000 | ${pair.includedSubjects} | ${pair.totalPairs} |`,
  );
  for (const runnerUp of pair.temporalRunnerUps) {
    lines.push(
      `| Runner-up | ${runnerUp.source} | ${runnerUp.lagYears} | ${runnerUp.durationYears} | ${runnerUp.fillingType}${runnerUp.fillingType === "value" && runnerUp.fillingValue != null ? ` (${runnerUp.fillingValue})` : ""} | ${runnerUp.score.toFixed(4)} | ${runnerUp.scoreDeltaFromBest.toFixed(4)} | ${runnerUp.includedSubjects} | ${runnerUp.totalPairs} |`,
    );
  }
  if (pair.temporalRunnerUps.length === 0) {
    lines.push("| Runner-up | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |");
  }
  lines.push("");
  lines.push("### Binned Pattern Table");
  lines.push("");
  lines.push("| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |");
  lines.push("|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|");
  for (const row of pair.predictorBinRows) {
    lines.push(
      `| ${row.binIndex + 1} | ${row.label} | ${row.pairs} | ${row.subjects} | ${row.predictorMean == null ? "N/A" : row.predictorMean.toFixed(4)} | ${row.predictorMedian == null ? "N/A" : row.predictorMedian.toFixed(4)} | ${row.outcomeMean == null ? "N/A" : row.outcomeMean.toFixed(4)} | ${row.outcomeMedian == null ? "N/A" : row.outcomeMedian.toFixed(4)} |`,
    );
  }
  lines.push("");
  lines.push("### Distribution Charts");
  lines.push("");
  lines.push("```text");
  lines.push(buildAsciiDistributionChart(`Predictor Distribution (${pair.predictorLabel})`, pair.predictorDistribution));
  lines.push("```");
  lines.push("");
  lines.push("```text");
  lines.push(buildAsciiDistributionChart(`Outcome Distribution (${pair.outcomeLabel}, welfare-aligned)`, pair.outcomeDistribution));
  lines.push("```");
  lines.push("");
  lines.push("### Top Subjects");
  lines.push("");
  lines.push("| Subject | Forward r | Directional Score | Effect % | Pairs |");
  lines.push("|---------|----------:|------------------:|---------:|------:|");
  for (const row of pair.topSubjects) {
    lines.push(`| ${row.subjectId} | ${row.forwardPearson.toFixed(4)} | ${row.predictivePearson.toFixed(4)} | ${row.effectSize.toFixed(3)} | ${row.numberOfPairs} |`);
  }
  if (pair.skippedReasons.length > 0) {
    lines.push("");
    lines.push("## Skip Notes");
    lines.push("");
    for (const reason of pair.skippedReasons.slice(0, 20)) {
      lines.push(`- ${reason}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function buildOutcomeMarkdown(
  outcomeId: string,
  ranking: OutcomeMegaStudyRanking,
  pairByKey: Map<string, PairStudyArtifact>,
): string {
  const lines: string[] = [];
  const samplePair = ranking.rows.length > 0
    ? pairByKey.get(`${ranking.rows[0]!.predictorId}::${ranking.rows[0]!.outcomeId}`)
    : undefined;
  const outcomeLabel = samplePair?.outcomeLabel ?? outcomeId;
  lines.push(`# Outcome Mega Study: ${outcomeId}`);
  lines.push("");
  lines.push(`- Outcome label: ${outcomeLabel}`);
  lines.push(`- Multiple testing: ${ranking.multipleTesting.method}`);
  lines.push(`- Alpha: ${ranking.multipleTesting.alpha}`);
  lines.push(`- Tests: ${ranking.multipleTesting.tests}`);
  lines.push("- Note: `Adj p` is an uncertainty score in this system (lower is better).");
  if (
    outcomeId === "outcome.derived.after_tax_median_income_ppp" ||
    outcomeId === "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct"
  ) {
    lines.push("- Note: After-tax median income is currently proxied by World Bank GNI per-capita PPP in this report set.");
  }
  lines.push("");
  lines.push("## Quick Meanings");
  lines.push("");
  lines.push("- `Recommended level`: main value to try first.");
  lines.push("- `Data-backed level`: level directly supported by seen data.");
  lines.push("- `Backup level`: safer fallback from the middle of the data.");
  lines.push("- `Math-only guess`: model output used for technical checks only.");
  lines.push("- `Not enough data`: we cannot safely recommend a level yet.");
  const outcomePairs = [...pairByKey.values()].filter((pair) => pair.outcomeId === outcomeId);
  const insufficientOutcomePairs = outcomePairs.filter(
    (pair) => pair.dataSufficiency.status === "insufficient_data",
  );
  const sufficientOutcomePairs = outcomePairs.filter(
    (pair) => pair.dataSufficiency.status === "sufficient",
  );
  const significantCount = ranking.rows.filter((row) => row.significant).length;
  const displayRows = selectOutcomeDisplayRows(ranking, pairByKey);
  const extrapolativeRows = displayRows.filter(({ pair }) => {
    const modelBest = resolveActionableOptimalValue(pair);
    return isOutsideObservedRange(
      modelBest,
      pair.predictorObservedMin,
      pair.predictorObservedMax,
    );
  });
  const outsideBestObservedBinRows = displayRows.filter(({ pair }) => {
    const modelBest = resolveActionableOptimalValue(pair);
    return isOutsideBestObservedBin(pair, modelBest);
  });
  const allocationMixRows = displayRows.filter(
    ({ pair }) => pair.predictorUnit === "% of government expenditure",
  );
  const qualityTierCounts: Record<PairQualityTier, number> = {
    strong: 0,
    moderate: 0,
    exploratory: 0,
    insufficient: 0,
  };
  for (const entry of displayRows) {
    qualityTierCounts[entry.pair.qualityTier] += 1;
  }
  const sufficientRowCount = displayRows.filter(
    ({ pair }) => pair.dataSufficiency.status === "sufficient",
  ).length;
  const meanReliabilityScore = displayRows.length === 0
    ? 0
    : displayRows.reduce((sum, entry) => sum + entry.pair.reliability.overallScore, 0) /
      displayRows.length;
  const rankedRows = ranking.rows
    .map((row) => ({
      row,
      pair: pairByKey.get(`${row.predictorId}::${row.outcomeId}`),
    }))
    .filter((entry): entry is ActionableOutcomeRow => entry.pair != null)
    .filter((entry) => isRecommendationEligible(entry.pair));
  const publishableRankedRows = rankedRows.filter((entry) =>
    isPublicationEligibleRecommendation(entry.pair)
  );
  if (displayRows.length > 0) {
    const lead = publishableRankedRows[0]?.row ?? rankedRows[0]?.row ?? displayRows[0]!.row;
    const topPair = pairByKey.get(`${lead.predictorId}::${lead.outcomeId}`);
    const hasLeadRecommendation = publishableRankedRows.length > 0 && topPair != null;
    const topDecisionLevel = hasLeadRecommendation && topPair
      ? formatValueWithUnit(resolveDecisionOptimalValue(topPair), topPair.predictorUnit)
      : "N/A";
    const topDecisionSource = hasLeadRecommendation && topPair ? resolveDecisionTargetSource(topPair) : "unavailable";
    const topBestLevel = topPair
      ? formatValueWithUnit(resolveActionableOptimalValue(topPair), topPair.predictorUnit)
      : "N/A";
    const topBestPppValue = hasLeadRecommendation && topPair ? resolveDecisionBestPerCapitaPpp(topPair) : null;
    const topBestPpp = topBestPppValue == null
      ? "N/A"
      : `${formatCompactNumber(topBestPppValue)} international $/person`;
    lines.push("");
    lines.push("## Lead Takeaway");
    lines.push("");
    lines.push(
      publishableRankedRows.length === 0
        ? `- Highest-ranked diagnostic row for ${outcomeLabel}: ${lead.predictorLabel ?? lead.predictorId}.`
        : `- Lead predictor for ${outcomeLabel}: ${lead.predictorLabel ?? lead.predictorId}.`,
    );
    if (!hasLeadRecommendation) {
      lines.push("- Publication gate: no row currently clears the publishable recommendation threshold for this outcome.");
    }
    lines.push(`- Recommended level: ${topDecisionLevel} (${toSimpleDecisionTargetSourceLabel(topDecisionSource)}).`);
    if (topBestPpp !== "N/A") {
      lines.push(`- Approximate PPP per-person amount for that recommended level: ${topBestPpp}.`);
    }
    lines.push(
      significantCount > 0
        ? `- Stats check: ${significantCount} predictors pass the adjusted threshold.`
        : "- Stats check: no predictors pass the adjusted threshold; treat these as early signals.",
    );
    if (extrapolativeRows.length > 0) {
      lines.push(
        `- Math-only check: ${extrapolativeRows.length}/${displayRows.length} math-only guesses are outside seen data.`,
      );
    }
    if (outsideBestObservedBinRows.length > 0) {
      lines.push(
        `- Bucket check: ${outsideBestObservedBinRows.length}/${displayRows.length} math-only guesses are outside the best observed bucket.`,
      );
    }
    if (topBestLevel !== "N/A") {
      lines.push(`- Math-only guess (technical only): ${topBestLevel}.`);
    }
    lines.push(
      `- Signal tags: strong ${qualityTierCounts.strong}, moderate ${qualityTierCounts.moderate}, early ${qualityTierCounts.exploratory}, not-enough-data ${qualityTierCounts.insufficient}.`,
    );
    lines.push(
      `- Data status: ${sufficientRowCount}/${displayRows.length} predictor rows have enough data.`,
    );
    lines.push(
      `- Average confidence score across predictors: ${meanReliabilityScore.toFixed(3)}.`,
    );
    if (publishableRankedRows.length < rankedRows.length) {
      lines.push(
        `- Publication gate: ${publishableRankedRows.length}/${rankedRows.length} ranked rows are currently safe to surface as top recommendations.`,
      );
    }
  }
  if (sufficientOutcomePairs.length === 0 && insufficientOutcomePairs.length > 0) {
    lines.push("");
    lines.push("## Not Enough Data");
    lines.push("");
    lines.push(
      "- No predictor/outcome pairs had enough data for safe recommendations in this outcome.",
    );
    lines.push(
      `- Pairs checked: ${outcomePairs.length}; pairs with not enough data: ${insufficientOutcomePairs.length}.`,
    );
    lines.push("");
    lines.push("| Predictor | Included Subjects | Aligned Pairs | Why Not Enough Data | Pair Report |");
    lines.push("|-----------|------------------:|--------------:|---------------------|------------|");
    for (const pair of [...insufficientOutcomePairs].sort((left, right) =>
      left.predictorLabel.localeCompare(right.predictorLabel)
    )) {
      const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
      const reasons = pair.dataSufficiency.reasons.length > 0
        ? pair.dataSufficiency.reasons.join("; ")
        : "thresholds not met";
      lines.push(
        `| ${pair.predictorLabel} | ${pair.includedSubjects} | ${pair.totalPairs} | ${reasons} | ${reportFile} |`,
      );
    }
  }
  if (sufficientOutcomePairs.length > 0 && insufficientOutcomePairs.length > 0) {
    lines.push("");
    lines.push("## Pairs With Not Enough Data");
    lines.push("");
    lines.push(
      `- ${insufficientOutcomePairs.length} predictor/outcome pairs were removed from ranking and recommendation tables because they did not have enough data.`,
    );
    lines.push("| Predictor | Included Subjects | Aligned Pairs | Why Not Enough Data | Pair Report |");
    lines.push("|-----------|------------------:|--------------:|---------------------|------------|");
    for (const pair of [...insufficientOutcomePairs].sort((left, right) =>
      left.predictorLabel.localeCompare(right.predictorLabel)
    )) {
      const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
      const reasons = pair.dataSufficiency.reasons.length > 0
        ? pair.dataSufficiency.reasons.join("; ")
        : "thresholds not met";
      lines.push(
        `| ${pair.predictorLabel} | ${pair.includedSubjects} | ${pair.totalPairs} | ${reasons} | ${reportFile} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Top Recommended Levels");
  lines.push("");
  lines.push("- These are the top recommended levels from ranked relationships that pass the publication gate.");
  lines.push("- Use them as practical guidance, not guaranteed cause-and-effect rules.");
  lines.push("");
  const topRecommendations = [...publishableRankedRows]
    .sort((left, right) => left.row.rank - right.row.rank)
    .slice(0, 5);
  let recommendationRank = 1;
  for (const recommendation of topRecommendations) {
    const predictorName = recommendation.row.predictorLabel ?? recommendation.row.predictorId;
    const decisionLevel = formatValueWithUnit(
      resolveDecisionOptimalValue(recommendation.pair),
      recommendation.pair.predictorUnit,
    );
    const decisionSource = resolveDecisionTargetSource(recommendation.pair);
    const modelBest = formatValueWithUnit(
      resolveActionableOptimalValue(recommendation.pair),
      recommendation.pair.predictorUnit,
    );
    const supportLevel = formatValueWithUnit(
      recommendation.pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue,
      recommendation.pair.predictorUnit,
    );
    const medLevel = formatValueWithUnit(
      recommendation.pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
      recommendation.pair.predictorUnit,
    );
    lines.push(
      `${recommendationRank}. ${predictorName}: recommended level ${decisionLevel} (${toSimpleDecisionTargetSourceLabel(decisionSource)}); data-backed level ${supportLevel}; minimum useful level ${medLevel}; math-only guess ${modelBest}; signal grade ${toSimpleEvidenceGradeLabel(recommendation.pair.evidenceGrade)}; direction score ${recommendation.pair.aggregatePredictivePearson.toFixed(3)}.`,
    );
    recommendationRank += 1;
  }
  if (topRecommendations.length === 0) {
    lines.push(
      rankedRows.length > 0
        ? "1. No publishable recommendation yet because the current ranked rows remain lower-confidence or exploratory."
        : sufficientOutcomePairs.length === 0 && insufficientOutcomePairs.length > 0
          ? "1. No recommendations available because all pairs were gated as insufficient data."
          : "1. No recommendations available because no pair studies were generated.",
    );
  }
  lines.push("");
  lines.push("## Quick Confidence Table");
  lines.push("");
  lines.push("| Predictor | Data Status | Confidence | Signal Tag | Signal Grade | Significance | Direction Score | Data-Backed Level | Minimum Useful Level | Slowdown Starts Near | Included Subjects | Pairs |");
  lines.push("|-----------|-------------|-----------:|------------|--------------|-------------:|----------------:|------------------:|---------------------:|--------------------:|------------------:|------:|");
  for (const entry of rankedRows) {
    const supportTarget = formatValueWithUnit(
      entry.pair.responseCurve.supportConstrainedTargets.supportConstrainedOptimalValue,
      entry.pair.predictorUnit,
    );
    const medLevel = formatValueWithUnit(
      entry.pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
      entry.pair.predictorUnit,
    );
    const kneeLevel = formatValueWithUnit(
      entry.pair.responseCurve.diminishingReturns.kneePredictorValue,
      entry.pair.predictorUnit,
    );
    lines.push(
      `| ${entry.row.predictorLabel ?? entry.row.predictorId} | ${toSimpleDataStatusLabel(entry.pair.dataSufficiency.status)} | ${entry.pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(entry.pair.reliability.band)}) | ${toSimpleQualityTierLabel(entry.pair.qualityTier)} | ${toSimpleEvidenceGradeLabel(entry.pair.evidenceGrade)} | ${entry.pair.aggregateStatisticalSignificance.toFixed(3)} | ${entry.pair.aggregatePredictivePearson.toFixed(3)} | ${supportTarget} | ${medLevel} | ${kneeLevel} | ${entry.pair.includedSubjects} | ${entry.pair.totalPairs} |`,
    );
  }
  if (rankedRows.length === 0) {
    lines.push("| (none) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |");
  }
  if (allocationMixRows.length > 0) {
    lines.push("");
    lines.push("## Budget Allocation Signals");
    lines.push("");
    lines.push("- These rows show spending mix predictors (share of total government spending).");
    lines.push("- Use this section to compare recommended mix levels across sectors.");
    lines.push("");
    lines.push("| Allocation Share Predictor | Recommended Share | Backup Share | Math-Only Guess | Guess-Backup Difference | Direction | Signal Tag | Pair Report |");
    lines.push("|----------------------------|------------------:|-------------:|----------------:|------------------------:|----------:|------------|------------|");
    for (const { row, pair } of allocationMixRows) {
      const bestLevel = formatValueWithUnit(resolveDecisionOptimalValue(pair), pair.predictorUnit);
      const modelLevel = formatValueWithUnit(resolveActionableOptimalValue(pair), pair.predictorUnit);
      const robustBestLevel = formatValueWithUnit(pair.robustness.robustOptimalValue, pair.predictorUnit);
      const rawRobustDelta =
        pair.robustness.optimalDeltaAbsolute == null || pair.robustness.optimalDeltaPercent == null
          ? "N/A"
          : `${formatCompactNumber(pair.robustness.optimalDeltaAbsolute)} (${pair.robustness.optimalDeltaPercent >= 0 ? "+" : ""}${pair.robustness.optimalDeltaPercent.toFixed(1)}%)`;
      const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
      lines.push(
        `| ${row.predictorLabel ?? row.predictorId} | ${bestLevel} | ${robustBestLevel} | ${modelLevel} | ${rawRobustDelta} | ${pair.direction} | ${toSimpleQualityTierLabel(pair.qualityTier)} | ${reportFile} |`,
      );
    }
  }
  lines.push("");
  lines.push("## Recommended Levels By Predictor");
  lines.push("");
  lines.push("- Each row shows key numeric levels for one predictor.");
  lines.push("- `Recommended level` is the main level to try.");
  lines.push("- `Math-only guess` is shown only for technical comparison.");
  lines.push("- `Math-only guess outside best bucket?` means the math-only guess is outside the best observed data bucket.");
  lines.push("");
  lines.push("| Predictor | Recommended Level | Why This Level | Minimum Useful Level | Slowdown Starts Near | Backup Level | Math-Only Guess | Math-Only Guess Outside Seen Data? | Math-Only Guess Outside Best Bucket? | Guess-Backup Difference | Recommended PPP/Capita | Best Observed Range | Best Observed Range (Middle-Data Check) | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Data Status | Confidence | Signal Tag | Pair Report |");
  lines.push("|-----------|------------------:|----------------|---------------------:|--------------------:|-------------:|----------------:|------------------------------------|--------------------------------------|------------------------:|----------------------:|--------------------:|----------------------------------------:|-----------------------------------:|---------------------------:|----------:|------------|-----------:|------------|------------|");
  for (const { row, pair } of displayRows) {
    const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
    const bestBin = bestObservedBinRow(pair);
    const modelBestValue = resolveActionableOptimalValue(pair);
    const decisionBestValue = resolveDecisionOptimalValue(pair);
    const bestLevel = formatValueWithUnit(decisionBestValue, pair.predictorUnit);
    const modelBestLevel = formatValueWithUnit(modelBestValue, pair.predictorUnit);
    const decisionSource = toSimpleDecisionTargetSourceLabel(resolveDecisionTargetSource(pair));
    const medLevel = formatValueWithUnit(
      pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
      pair.predictorUnit,
    );
    const kneeLevel = formatValueWithUnit(
      pair.responseCurve.diminishingReturns.kneePredictorValue,
      pair.predictorUnit,
    );
    const extrapolative = isOutsideObservedRange(
      modelBestValue,
      pair.predictorObservedMin,
      pair.predictorObservedMax,
    );
    const outsideBestObservedBin = isOutsideBestObservedBin(
      pair,
      modelBestValue,
    );
    const robustBestLevel = formatValueWithUnit(pair.robustness.robustOptimalValue, pair.predictorUnit);
    const rawRobustDelta =
      pair.robustness.optimalDeltaAbsolute == null || pair.robustness.optimalDeltaPercent == null
        ? "N/A"
        : `${formatCompactNumber(pair.robustness.optimalDeltaAbsolute)} (${pair.robustness.optimalDeltaPercent >= 0 ? "+" : ""}${pair.robustness.optimalDeltaPercent.toFixed(1)}%)`;
    const decisionBestPerCapitaPpp = resolveDecisionBestPerCapitaPpp(pair);
    const bestLevelPpp = decisionBestPerCapitaPpp == null
      ? "N/A"
      : `${formatCompactNumber(decisionBestPerCapitaPpp)} intl $/person`;
    const bestRange = bestBin?.label ?? "N/A";
    const robustBestRange = pair.robustness.robustBestObservedRange ?? "N/A";
    const bestRangePpp = pair?.pppPerCapitaSummary?.bestObservedPerCapitaPppRange ?? "N/A";
    const bestOutcomeMean = bestBin?.outcomeMean == null ? "N/A" : formatCompactNumber(bestBin.outcomeMean);
    const direction = pair.direction;
    lines.push(
      `| ${row.predictorLabel ?? row.predictorId} | ${bestLevel} | ${decisionSource} | ${medLevel} | ${kneeLevel} | ${robustBestLevel} | ${modelBestLevel} | ${extrapolative ? "yes" : "no"} | ${outsideBestObservedBin ? "yes" : "no"} | ${rawRobustDelta} | ${bestLevelPpp} | ${bestRange} | ${robustBestRange} | ${bestRangePpp} | ${bestOutcomeMean} | ${direction} | ${toSimpleDataStatusLabel(pair.dataSufficiency.status)} | ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}) | ${toSimpleQualityTierLabel(pair.qualityTier)} | ${reportFile} |`,
    );
  }
  if (displayRows.length === 0) {
    lines.push("| (none) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |");
  }
  if (displayRows.length > 0) {
    lines.push("");
    lines.push("### Predictor Summaries In Plain English");
    lines.push("");
    for (const { row, pair } of displayRows) {
      const predictorName = row.predictorLabel ?? row.predictorId;
      const decisionLevel = formatValueWithUnit(resolveDecisionOptimalValue(pair), pair.predictorUnit);
      const decisionSource = resolveDecisionTargetSource(pair);
      const modelBestLevel = formatValueWithUnit(resolveActionableOptimalValue(pair), pair.predictorUnit);
      const robustBestLevel = formatValueWithUnit(pair.robustness.robustOptimalValue, pair.predictorUnit);
      const medLevel = formatValueWithUnit(
        pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
        pair.predictorUnit,
      );
      const kneeLevel = formatValueWithUnit(
        pair.responseCurve.diminishingReturns.kneePredictorValue,
        pair.predictorUnit,
      );
      const extrapolative = isOutsideObservedRange(
        resolveActionableOptimalValue(pair),
        pair.predictorObservedMin,
        pair.predictorObservedMax,
      );
      const outsideBestObservedBin = isOutsideBestObservedBin(
        pair,
        resolveActionableOptimalValue(pair),
      );
      lines.push(
        `- ${predictorName}: recommended level ${decisionLevel} (${toSimpleDecisionTargetSourceLabel(decisionSource)}); minimum useful level ${medLevel}; gains start slowing near ${kneeLevel}; backup level ${robustBestLevel}; math-only guess ${modelBestLevel}${extrapolative ? " (outside seen data)" : outsideBestObservedBin ? " (outside best observed bucket)" : ""}; data status ${toSimpleDataStatusLabel(pair.dataSufficiency.status)}; confidence ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}); signal tag ${toSimpleQualityTierLabel(pair.qualityTier)}.`,
      );
    }
  }
  if (displayRows.length > 0) {
    const top = publishableRankedRows[0] ?? rankedRows[0] ?? displayRows[0]!;
    const pair = top.pair;
    const direction = pair?.direction ?? "neutral";
    lines.push("");
    lines.push("## Plain-Language Summary");
    lines.push("");
    lines.push(
      publishableRankedRows.length === 0
        ? `- No row currently clears the publication gate; the highest-ranked diagnostic row is ${top.row.predictorLabel ?? top.row.predictorId} with direction ${direction}.`
        : `- Highest-ranked publishable row is ${top.row.predictorLabel ?? top.row.predictorId} with direction ${direction}.`,
    );
    lines.push(
      `- This outcome page includes ${displayRows.length} predictor studies; ${significantCount} pass the stats threshold.`,
    );
    lines.push(
      `- Data status: ${sufficientRowCount}/${displayRows.length} rows have enough data; average confidence is ${meanReliabilityScore.toFixed(3)}.`,
    );
    lines.push(
      `- Signal tags in this outcome: strong ${qualityTierCounts.strong}, moderate ${qualityTierCounts.moderate}, early ${qualityTierCounts.exploratory}, not-enough-data ${qualityTierCounts.insufficient}.`,
    );
    lines.push(
      "- Recommended levels come from data-backed checks; math-only guesses are kept for technical comparison only.",
    );
  }
  lines.push("");
  lines.push("## Appendix: Extra Technical Numbers");
  lines.push("");
  lines.push("| Rank | Predictor | Score | Confidence | Adj p | Signal Grade | Signal Tag | Direction | Direction Score | Countries | Pairs | High-Outcome Value | Low-Outcome Value | Math-Only Best Daily | Pair Report |");
  lines.push("|-----:|-----------|------:|-----------:|------:|--------------|------------|----------:|----------------:|----------:|------:|-------------------:|------------------:|---------------------:|------------|");
  for (const row of ranking.rows) {
    const pair = pairByKey.get(`${row.predictorId}::${row.outcomeId}`);
    const reportFile = pair ? `[${toPairFileName(pair)}](${toPairFileName(pair)})` : "(missing)";
    const optimalHigh = pair?.aggregateValuePredictingHighOutcome == null ? "N/A" : pair.aggregateValuePredictingHighOutcome.toFixed(3);
    const optimalLow = pair?.aggregateValuePredictingLowOutcome == null ? "N/A" : pair.aggregateValuePredictingLowOutcome.toFixed(3);
    const optimalDaily = pair?.aggregateOptimalDailyValue == null ? "N/A" : pair.aggregateOptimalDailyValue.toFixed(3);
    const evidence = pair?.evidenceGrade ?? row.evidenceGrade;
    const evidenceLabel = evidence == null ? "N/A" : toSimpleEvidenceGradeLabel(evidence);
    const qualityTier = pair?.qualityTier == null ? "N/A" : toSimpleQualityTierLabel(pair.qualityTier);
    const direction = pair?.direction ?? "n/a";
    const directionalScore = pair ? pair.aggregatePredictivePearson.toFixed(4) : row.aggregatePredictivePearson.toFixed(4);
    lines.push(`| ${row.rank} | ${row.predictorLabel ?? row.predictorId} | ${row.score.toFixed(4)} | ${row.confidence.toFixed(4)} | ${row.adjustedPValue.toFixed(4)} | ${evidenceLabel} | ${qualityTier} | ${direction} | ${directionalScore} | ${row.numberOfUnits} | ${row.totalPairs} | ${optimalHigh} | ${optimalLow} | ${optimalDaily} | ${reportFile} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function buildSpendingKpiTradeoffReport(
  pairStudies: PairStudyArtifact[],
  gateResults?: ReadonlyMap<string, TwoStageGateResult>,
): string {
  interface SpendingPredictorReportGroup {
    predictorId: string;
    predictorLabel: string;
    predictorUnit: string;
    profile: PredictorObjectiveProfile;
    primaryPairs: PairStudyArtifact[];
    leadPair: PairStudyArtifact;
    leadRole: OutcomeRole;
    hasDirectMissionRows: boolean;
    secondaryPairCount: number;
  }

  const lines: string[] = [];
  lines.push("# Spending KPI Levels");
  lines.push("");
  lines.push("- Objective: estimate useful spending levels for each discretionary spending predictor.");
  lines.push("- `Suggested Level` uses support-constrained targets, so it stays in data-backed ranges.");
  lines.push("- `MED` is the minimum useful level where gains first become consistent.");
  lines.push("- `Slowdown Knee` is where extra spending starts showing weaker gains.");
  lines.push("");

  const pairGroups = new Map<string, PairStudyArtifact[]>();
  for (const pair of pairStudies) {
    const group = pairGroups.get(pair.predictorId) ?? [];
    group.push(pair);
    pairGroups.set(pair.predictorId, group);
  }

  const sortedPredictorIds = [...pairGroups.keys()].sort((left, right) => {
    const leftLabel = pairGroups.get(left)?.[0]?.predictorLabel ?? left;
    const rightLabel = pairGroups.get(right)?.[0]?.predictorLabel ?? right;
    return leftLabel.localeCompare(rightLabel);
  });

  const reportGroups: SpendingPredictorReportGroup[] = [];

  for (const predictorId of sortedPredictorIds) {
    const pairs = [...(pairGroups.get(predictorId) ?? [])];
    if (pairs.length === 0) continue;
    const profile = resolvePredictorObjectiveProfile(predictorId);

    const directPairs = pairs.filter(
      (pair) => classifyOutcomeRole(profile, pair.outcomeId) === "direct_kpi",
    );
    const guardrailPairs = pairs.filter(
      (pair) => classifyOutcomeRole(profile, pair.outcomeId) === "guardrail_kpi",
    );
    const primaryPairs =
      directPairs.length > 0
        ? directPairs
        : guardrailPairs.length > 0
          ? guardrailPairs
          : pairs;
    const sortedPrimaryPairs = [...primaryPairs].sort(comparePairsForDecisionSummary);
    const leadPair = sortedPrimaryPairs[0];
    if (!leadPair) continue;

    reportGroups.push({
      predictorId,
      predictorLabel: leadPair.predictorLabel,
      predictorUnit: leadPair.predictorUnit,
      profile,
      primaryPairs: sortedPrimaryPairs,
      leadPair,
      leadRole: classifyOutcomeRole(profile, leadPair.outcomeId),
      hasDirectMissionRows: directPairs.length > 0,
      secondaryPairCount: Math.max(0, pairs.length - sortedPrimaryPairs.length),
    });
  }

  lines.push("## Quick Optimal Levels");
  lines.push("");
  lines.push("| Spending Type | Lead KPI | KPI Role | Mission Gate | Suggested Level | MED | Slowdown Knee | Confidence | Data Status | Pair Report |");
  lines.push("|---------------|----------|----------|-------------|----------------:|----:|--------------:|-----------:|-------------|------------|");
  for (const group of reportGroups) {
    const pair = group.leadPair;
    const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
    const med = formatValueWithUnit(
      pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
      pair.predictorUnit,
    );
    const knee = formatValueWithUnit(
      pair.responseCurve.diminishingReturns.kneePredictorValue,
      pair.predictorUnit,
    );
    const gate = gateResults?.get(group.predictorId);
    const gateLabel = gate
      ? gate.overallEligible
        ? gate.suppressLargeScaleUp ? "caution" : "pass"
        : "blocked"
      : "N/A";
    lines.push(
      `| ${group.predictorLabel} | ${pair.outcomeLabel} | ${toSimpleOutcomeRoleLabel(group.leadRole)} | ${gateLabel} | ${formatDecisionLevelWithSource(pair)} | ${med} | ${knee} | ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}) | ${toSimpleDataStatusLabel(pair.dataSufficiency.status)} | ${reportFile} |`,
    );
  }
  lines.push("");

  for (const group of reportGroups) {
    const medValues = group.primaryPairs
      .map((pair) => pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose)
      .filter((value): value is number => value != null && Number.isFinite(value));
    const kneeValues = group.primaryPairs
      .map((pair) => pair.responseCurve.diminishingReturns.kneePredictorValue)
      .filter((value): value is number => value != null && Number.isFinite(value));
    const decisionValues = group.primaryPairs
      .map((pair) => resolveDecisionOptimalValue(pair))
      .filter((value): value is number => value != null && Number.isFinite(value));

    lines.push(`## ${group.predictorLabel}`);
    lines.push("");
    lines.push(`- Predictor: \`${group.predictorId}\``);
    lines.push(`- Unit: ${group.predictorUnit}`);
    lines.push(`- Mission KPIs configured: ${group.profile.directOutcomeIds.length}`);
    if (!group.hasDirectMissionRows) {
      lines.push("- Mission KPI gap: no mission KPI row available in this run, so this section uses welfare fallback outcomes.");
    }
    for (const note of group.profile.notes ?? []) {
      lines.push(`- Note: ${note}`);
    }
    lines.push(
      `- Ranges in this section: MED ${formatMinMax(medValues, group.predictorUnit)}; slowdown knee ${formatMinMax(kneeValues, group.predictorUnit)}; suggested level ${formatMinMax(decisionValues, group.predictorUnit)}.`,
    );
    if (group.secondaryPairCount > 0) {
      lines.push(`- Additional non-primary outcome studies available: ${group.secondaryPairCount} (see linked pair pages).`);
    }
    const gate = gateResults?.get(group.predictorId);
    if (gate) {
      lines.push("");
      lines.push("### Gate Summary");
      lines.push("");
      lines.push(`- Direct mission gate: ${gate.directMission.verdict}${gate.directMission.outcomeId ? ` (${gate.directMission.outcomeId})` : ""}`);
      lines.push(`- Welfare guardrail gate: ${gate.welfareGuardrail.verdict}${gate.welfareGuardrail.outcomeId ? ` (${gate.welfareGuardrail.outcomeId})` : ""}`);
      lines.push(`- Overall eligible: ${gate.overallEligible ? "yes" : "no"}`);
      if (gate.suppressLargeScaleUp) {
        lines.push("- Large scale-up suppressed: yes (recommendations marked as exploratory)");
      }
      lines.push(`- Guidance: ${gate.plainLanguageGuidance}`);
    }
    lines.push("");
    lines.push("### Primary KPI Rows");
    lines.push("");
    lines.push("| KPI | Role | Suggested Level | MED | Slowdown Knee | Confidence | Data Status | Pair Report |");
    lines.push("|-----|------|----------------:|----:|--------------:|-----------:|-------------|------------|");
    const displayRows = group.primaryPairs.slice(0, 4);
    for (const pair of displayRows) {
      const role = classifyOutcomeRole(group.profile, pair.outcomeId);
      const med = formatValueWithUnit(
        pair.responseCurve.minimumEffectiveDose.minimumEffectiveDose,
        pair.predictorUnit,
      );
      const knee = formatValueWithUnit(
        pair.responseCurve.diminishingReturns.kneePredictorValue,
        pair.predictorUnit,
      );
      const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
      lines.push(
        `| ${pair.outcomeLabel} | ${toSimpleOutcomeRoleLabel(role)} | ${formatDecisionLevelWithSource(pair)} | ${med} | ${knee} | ${pair.reliability.overallScore.toFixed(3)} (${toSimpleReliabilityBandLabel(pair.reliability.band)}) | ${toSimpleDataStatusLabel(pair.dataSufficiency.status)} | ${reportFile} |`,
      );
    }
    if (group.primaryPairs.length > displayRows.length) {
      lines.push("");
      lines.push(
        `- ${group.primaryPairs.length - displayRows.length} additional primary KPI row(s) hidden for brevity; open the pair links for full details.`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function generateMegaStudyArtifacts(
  options: MegaStudyGenerationOptions = {},
): Promise<MegaStudyArtifacts> {
  const writeFiles = options.writeFiles ?? true;
  const logProgress = options.logProgress ?? true;
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  const useDataCache = options.useDataCache ?? true;
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const maxCacheAgeHours = options.maxCacheAgeHours ?? 24 * 7;
  const period = options.period ?? { startYear: 1990, endYear: 2023 };
  const minimumPairs = options.minimumPairs ?? 6;
  const minimumMeasurementsPerSeries = options.minimumMeasurementsPerSeries ?? 8;
  const topSubjectsPerPair = options.topSubjectsPerPair ?? 8;
  const selectedOutcomeIds = options.outcomeIds ?? [...DEFAULT_REPORT_OUTCOME_IDS];
  const generatedAt = new Date().toISOString();

  const registry = getVariableRegistry().filter((entry) => entry.analysisScopes.includes("global_panel"));
  const predictorCandidates = registry.filter((entry) => entry.kind === "predictor");
  const predictors = predictorCandidates.filter(isReportEligiblePredictor);
  const excludedNonDiscretionaryPredictors = predictorCandidates.filter(
    (entry) => !isReportEligiblePredictor(entry),
  );
  const outcomes = registry.filter((entry) => isReportEligibleOutcome(entry, selectedOutcomeIds));
  const fetchOptions: FetchOptions = { period, jurisdictions: options.jurisdictions };

  const rawByVariable = new Map<string, DataPoint[]>();
  for (const variable of registry.filter((entry) => entry.source.fetcher)) {
    const cacheKey = buildFetchCacheKey(variable.id, fetchOptions);
    const cachePath = resolveVariableCachePath(cacheDir, cacheKey);
    if (useDataCache) {
      const cached = readVariableCache(cachePath, variable.id, fetchOptions, maxCacheAgeHours);
      if (cached != null) {
        if (logProgress) console.log(`Cache hit for ${variable.id} (${cached.length} rows).`);
        rawByVariable.set(variable.id, cached);
        continue;
      }
    }

    if (logProgress) console.log(`Fetching ${variable.id}...`);
    const fetched = await fetchRegistryVariable(variable, fetchOptions);
    rawByVariable.set(variable.id, fetched);
    if (useDataCache) {
      writeVariableCache(cachePath, variable.id, fetchOptions, fetched);
    }
  }
  const derivedPerCapitaPredictors: Array<{
    id: string;
    percentOfGdpVariableId: string;
    sourceLabel: string;
  }> = [
    {
      id: "predictor.derived.gov_expenditure_per_capita_ppp",
      percentOfGdpVariableId: "predictor.wb.gov_expenditure_pct_gdp",
      sourceLabel: "Derived (Gov expenditure %GDP x GDP PPP per-capita)",
    },
    {
      id: "predictor.derived.gov_health_expenditure_per_capita_ppp",
      percentOfGdpVariableId: "predictor.wb.gov_health_expenditure_pct_gdp",
      sourceLabel: "Derived (Gov health expenditure %GDP x GDP PPP per-capita)",
    },
    {
      id: "predictor.derived.education_expenditure_per_capita_ppp",
      percentOfGdpVariableId: "predictor.wb.education_expenditure_pct_gdp",
      sourceLabel: "Derived (Education expenditure %GDP x GDP PPP per-capita)",
    },
    {
      id: "predictor.derived.rd_expenditure_per_capita_ppp",
      percentOfGdpVariableId: "predictor.wb.rd_expenditure_pct_gdp",
      sourceLabel: "Derived (R&D expenditure %GDP x GDP PPP per-capita)",
    },
    {
      id: "predictor.derived.military_expenditure_per_capita_ppp",
      percentOfGdpVariableId: "predictor.wb.military_expenditure_pct_gdp",
      sourceLabel: "Derived (Military expenditure %GDP x GDP PPP per-capita)",
    },
  ];
  for (const predictorSpec of derivedPerCapitaPredictors) {
    if (!registry.some((entry) => entry.id === predictorSpec.id)) continue;
    rawByVariable.set(
      predictorSpec.id,
      buildDerivedPercentGdpPerCapitaPpp(
        rawByVariable,
        predictorSpec.percentOfGdpVariableId,
        predictorSpec.sourceLabel,
      ),
    );
  }
  const derivedAllocationSharePredictors: Array<{
    id: string;
    numeratorVariableId: string;
    denominatorVariableId: string;
    sourceLabel: string;
  }> = [
    {
      id: "predictor.derived.gov_health_share_of_gov_expenditure_pct",
      numeratorVariableId: "predictor.wb.gov_health_expenditure_pct_gdp",
      denominatorVariableId: "predictor.wb.gov_expenditure_pct_gdp",
      sourceLabel: "Derived (Gov health expenditure %GDP / gov expenditure %GDP)",
    },
    {
      id: "predictor.derived.education_share_of_gov_expenditure_pct",
      numeratorVariableId: "predictor.wb.education_expenditure_pct_gdp",
      denominatorVariableId: "predictor.wb.gov_expenditure_pct_gdp",
      sourceLabel: "Derived (Education expenditure %GDP / gov expenditure %GDP)",
    },
    {
      id: "predictor.derived.rd_share_of_gov_expenditure_pct",
      numeratorVariableId: "predictor.wb.rd_expenditure_pct_gdp",
      denominatorVariableId: "predictor.wb.gov_expenditure_pct_gdp",
      sourceLabel: "Derived (R&D expenditure %GDP / gov expenditure %GDP)",
    },
    {
      id: "predictor.derived.military_share_of_gov_expenditure_pct",
      numeratorVariableId: "predictor.wb.military_expenditure_pct_gdp",
      denominatorVariableId: "predictor.wb.gov_expenditure_pct_gdp",
      sourceLabel: "Derived (Military expenditure %GDP / gov expenditure %GDP)",
    },
  ];
  for (const shareSpec of derivedAllocationSharePredictors) {
    if (!registry.some((entry) => entry.id === shareSpec.id)) continue;
    rawByVariable.set(
      shareSpec.id,
      buildDerivedShareOfVariablePercent(
        rawByVariable,
        shareSpec.numeratorVariableId,
        shareSpec.denominatorVariableId,
        shareSpec.sourceLabel,
      ),
    );
  }
  if (registry.some((entry) => entry.id === "predictor.derived.gov_non_military_expenditure_per_capita_ppp")) {
    rawByVariable.set(
      "predictor.derived.gov_non_military_expenditure_per_capita_ppp",
      buildDerivedDifferencePerCapitaPpp(
        rawByVariable,
        "predictor.derived.gov_expenditure_per_capita_ppp",
        "predictor.derived.military_expenditure_per_capita_ppp",
        "Derived (Gov expenditure per-capita PPP - military expenditure per-capita PPP)",
      ),
    );
  }
  if (registry.some((entry) => entry.id === "outcome.derived.after_tax_median_income_ppp")) {
    rawByVariable.set(
      "outcome.derived.after_tax_median_income_ppp",
      buildDerivedAfterTaxMedianIncomePpp(rawByVariable),
    );
  }
  if (registry.some((entry) => entry.id === "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct")) {
    rawByVariable.set(
      "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
      buildDerivedYoYPercent(
        rawByVariable.get("outcome.derived.after_tax_median_income_ppp") ?? [],
        "Derived YoY growth (after-tax median-income PPP proxy)",
      ),
    );
  }
  if (registry.some((entry) => entry.id === "outcome.derived.healthy_life_expectancy_growth_yoy_pct")) {
    rawByVariable.set(
      "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
      buildDerivedYoYPercent(
        rawByVariable.get("outcome.who.healthy_life_expectancy_years") ?? [],
        "Derived YoY growth (WHO HALE)",
      ),
    );
  }
  if (registry.some((entry) => entry.id === "outcome.derived.battle_related_deaths_per_100k")) {
    // Population data is needed for per-100k normalization but not tracked in the registry itself.
    // Fetch it if not already available.
    let populationData = rawByVariable.get("__population__");
    if (!populationData) {
      const popFetcher = fetchers.fetchPopulation;
      if (typeof popFetcher === "function") {
        if (logProgress) console.log("Fetching population data for rate normalization...");
        populationData = await (popFetcher as (options: FetchOptions) => Promise<DataPoint[]>)(fetchOptions);
      } else {
        populationData = [];
      }
      rawByVariable.set("__population__", populationData);
    }
    rawByVariable.set(
      "outcome.derived.battle_related_deaths_per_100k",
      buildDerivedRatePer100k(
        rawByVariable.get("outcome.wb.battle_related_deaths") ?? [],
        populationData,
        "Derived (battle deaths / population * 100k)",
      ),
    );
  }

  const seriesByVariable = new Map<string, Map<string, TimeSeries>>();
  for (const variable of registry) {
    seriesByVariable.set(
      variable.id,
      toTimeSeriesMap(variable, rawByVariable.get(variable.id) ?? [], minimumMeasurementsPerSeries),
    );
  }
  const gdpPerCapitaSeriesBySubject = seriesByVariable.get("outcome.wb.gdp_per_capita_ppp") ?? new Map();

  const candidates: OutcomeRankingCandidate[] = [];
  const pairStudies: PairStudyArtifact[] = [];
  const skippedPairs: Array<{ predictorId: string; outcomeId: string; reason: string }> = [];
  let pairsExcludedBySufficiencyGate = 0;

  for (const predictor of predictors) {
    for (const outcome of outcomes) {
      const predictorSeries = seriesByVariable.get(predictor.id) ?? new Map();
      const outcomeSeries = seriesByVariable.get(outcome.id) ?? new Map();
      const commonSubjects = [...predictorSeries.keys()].filter((subjectId) => outcomeSeries.has(subjectId));
      if (commonSubjects.length === 0) {
        skippedPairs.push({ predictorId: predictor.id, outcomeId: outcome.id, reason: "No overlapping subjects." });
        continue;
      }

      const subjectsForAnalysis = commonSubjects.map((subjectId) => ({
        subjectId,
        predictor: predictorSeries.get(subjectId)!,
        outcome: outcomeSeries.get(subjectId)!,
      }));
      const temporalCandidates = buildPairTemporalProfileCandidates(predictor, outcome);
      let selectedTemporal: TemporalProfileCandidateEvaluation | null = null;
      let selectedRunner: ReturnType<typeof runVariableRelationshipAnalysis> | null = null;
      let temporalCandidatesWithResults = 0;
      const temporalEvaluations: TemporalProfileCandidateEvaluation[] = [];

      for (const candidate of temporalCandidates) {
        const candidateRunner = runVariableRelationshipAnalysis({
          subjects: subjectsForAnalysis,
          minimumPairs,
          analysisConfig: {
            ...toTemporalAnalysisConfig(candidate),
            analysisMode: "individual",
          },
          onSubjectError: "skip",
        });

        if (candidateRunner.subjectResults.length === 0) continue;
        temporalCandidatesWithResults += 1;
        const aggregateCandidate = candidateRunner.aggregateVariableRelationship;
        const candidateEvaluation: TemporalProfileCandidateEvaluation = {
          profile: candidate,
          score: scoreTemporalProfileCandidate({
            includedSubjects: candidateRunner.subjectResults.length,
            totalPairs: nonNegativeInt(aggregateCandidate.totalPairs),
            aggregateStatisticalSignificance: finiteOrZero(
              aggregateCandidate.aggregateStatisticalSignificance,
            ),
            aggregatePredictivePearson: finiteOrZero(aggregateCandidate.aggregatePredictivePearson),
          }),
          includedSubjects: candidateRunner.subjectResults.length,
          totalPairs: nonNegativeInt(aggregateCandidate.totalPairs),
        };
        temporalEvaluations.push(candidateEvaluation);

        if (isTemporalCandidateBetter(candidateEvaluation, selectedTemporal)) {
          selectedTemporal = candidateEvaluation;
          selectedRunner = candidateRunner;
        }
      }

      if (!selectedTemporal || !selectedRunner) {
        skippedPairs.push({
          predictorId: predictor.id,
          outcomeId: outcome.id,
          reason: `No valid subject analyses across ${temporalCandidates.length} temporal candidate(s).`,
        });
        continue;
      }

      const temporalProfile = selectedTemporal.profile;
      const lagYears = temporalProfile.lagYears;
      const runner = selectedRunner;
      const sortedTemporalEvaluations = sortTemporalCandidateEvaluations(temporalEvaluations);
      const selectedTemporalProfileKey = toTemporalProfileKey(temporalProfile);
      const temporalRunnerUps: PairTemporalSensitivityRow[] = sortedTemporalEvaluations
        .filter((evaluation) => toTemporalProfileKey(evaluation.profile) !== selectedTemporalProfileKey)
        .slice(0, 3)
        .map((evaluation) => ({
          lagYears: evaluation.profile.lagYears,
          durationYears: evaluation.profile.durationYears,
          source: evaluation.profile.source,
          fillingType: evaluation.profile.fillingType,
          fillingValue:
            evaluation.profile.fillingType === "value"
              ? (evaluation.profile.fillingValue ?? 0)
              : null,
          score: evaluation.score,
          scoreDeltaFromBest: selectedTemporal.score - evaluation.score,
          includedSubjects: evaluation.includedSubjects,
          totalPairs: evaluation.totalPairs,
        }));
      const temporalStabilityWarning = buildTemporalStabilityWarning(
        selectedTemporal.score,
        temporalRunnerUps[0],
      );

      const aggregate = runner.aggregateVariableRelationship;
      const aggregateForwardPearson = finiteOrZero(aggregate.aggregateForwardPearson);
      const aggregateReversePearson = finiteOrZero(aggregate.aggregateReversePearson);
      const aggregatePredictivePearson = finiteOrZero(aggregate.aggregatePredictivePearson);
      const aggregateEffectSize = finiteOrZero(aggregate.aggregateEffectSize);
      const aggregateStatisticalSignificance = Math.max(
        0,
        Math.min(1, finiteOrZero(aggregate.aggregateStatisticalSignificance)),
      );
      const weightedAveragePIS = finiteOrZero(aggregate.weightedAveragePIS);
      const aggregateValuePredictingHighOutcome = finiteOrNull(aggregate.aggregateValuePredictingHighOutcome);
      const aggregateValuePredictingLowOutcome = finiteOrNull(aggregate.aggregateValuePredictingLowOutcome);
      const aggregateOptimalDailyValue = finiteOrNull(aggregate.aggregateOptimalDailyValue);
      const predictorObservedRange = computeObservedRange(predictorSeries, commonSubjects);
      const pValue = Math.max(0, Math.min(1, 1 - aggregateStatisticalSignificance));
      const evidenceGrade = evidenceGradeFromSignificance(aggregateStatisticalSignificance);
      const maxSubjectDirectionalScore = runner.subjectResults.reduce(
        (maxValue, result) =>
          Math.max(maxValue, Math.abs(finiteOrZero(result.nOf1VariableRelationship.predictivePearson))),
        0,
      );
      const alignedPoints = collectAlignedPairs(
        commonSubjects,
        predictorSeries,
        outcomeSeries,
        temporalProfile,
      );
      const predictorBinRows = buildPairBinSummaryRows(alignedPoints, 10);
      const rawOptimalValue = resolveActionableOptimalValueFromAggregate(
        aggregateOptimalDailyValue,
        aggregateValuePredictingHighOutcome,
      );
      const responseCurvePredictorValues = alignedPoints.map((point) => point.predictorValue);
      const responseCurveOutcomeValues = alignedPoints.map((point) => point.outcomeValue);
      const responseCurve: PairResponseCurveDiagnostics = {
        diminishingReturns: estimateDiminishingReturns(
          responseCurvePredictorValues,
          responseCurveOutcomeValues,
          {
            minSamples: 120,
            targetBinCount: 12,
            minBinSize: 20,
            minSlopePointsPerSegment: 2,
            maxPostToPreSlopeRatio: 0.5,
          },
        ),
        minimumEffectiveDose: estimateMinimumEffectiveDose(
          responseCurvePredictorValues,
          responseCurveOutcomeValues,
          {
            minSamples: 120,
            targetBinCount: 12,
            minBinSize: 20,
            minConsecutiveBins: 2,
            minRelativeGainPercent: 2,
            minZScore: 1,
          },
        ),
        saturationRange: estimateSaturationRange(
          responseCurvePredictorValues,
          responseCurveOutcomeValues,
          {
            minSamples: 120,
            targetBinCount: 12,
            minBinSize: 20,
            minConsecutiveSlopes: 2,
            maxMarginalGainFraction: 0.2,
            minAbsoluteSlope: 0.0001,
          },
        ),
        supportConstrainedTargets: deriveSupportConstrainedTargets(
          responseCurvePredictorValues,
          responseCurveOutcomeValues,
          {
            minSamples: 120,
            targetBinCount: 12,
            minBinSize: 20,
            objective: "maximize_outcome",
            modelOptimalValue: rawOptimalValue,
            robustLowerQuantile: 0.1,
            robustUpperQuantile: 0.9,
          },
        ),
      };
      const robustness = buildPairRobustnessSummary(
        alignedPoints,
        predictorBinRows,
        rawOptimalValue,
        10,
        0.1,
        0.9,
      );
      const pppPerCapitaSummary = buildPppPerCapitaSummary(
        alignedPoints,
        predictorBinRows,
        predictor.unit,
        gdpPerCapitaSeriesBySubject,
        aggregateOptimalDailyValue,
        aggregateValuePredictingHighOutcome,
      );
      const predictorDistribution = buildDistributionBuckets(
        alignedPoints.map((point) => point.predictorValue),
        12,
        Math.max(8, Math.floor(alignedPoints.length / 24)),
      );
      const predictorHistogram = buildFixedWidthDistributionBuckets(
        alignedPoints.map((point) => point.predictorValue),
        12,
      );
      const outcomeDistribution = buildDistributionBuckets(
        alignedPoints.map((point) => point.outcomeValue),
        12,
        Math.max(8, Math.floor(alignedPoints.length / 24)),
      );
      const outcomeHistogram = buildFixedWidthDistributionBuckets(
        alignedPoints.map((point) => point.outcomeValue),
        12,
      );
      const direction = directionFromSignal(
        aggregateForwardPearson,
        aggregatePredictivePearson,
      );
      const qualityWarnings = derivePairQualityWarnings({
        includedSubjects: runner.subjectResults.length,
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
        aggregateForwardPearson,
        aggregatePredictivePearson,
        maxSubjectDirectionalScore,
        predictorObservedMin: predictorObservedRange.min,
        predictorObservedMax: predictorObservedRange.max,
        aggregateValuePredictingHighOutcome,
        aggregateValuePredictingLowOutcome,
        aggregateOptimalDailyValue,
      });
      if (temporalStabilityWarning) {
        qualityWarnings.push(temporalStabilityWarning);
      }
      if (
        robustness.optimalDeltaPercent != null &&
        Math.abs(robustness.optimalDeltaPercent) >= 25
      ) {
        qualityWarnings.push(
          `Robustness check: trimmed-range optimal differs by ${Math.abs(
            robustness.optimalDeltaPercent,
          ).toFixed(1)}% from raw optimal; tail observations materially influence target.`,
        );
      }
      const dataSufficiency = derivePairDataSufficiency({
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        temporalCandidatesWithResults,
        predictorBinCount: predictorBinRows.length,
      });
      if (dataSufficiency.status === "insufficient_data" && dataSufficiency.reasons.length > 0) {
        qualityWarnings.push(`Data status warning: ${dataSufficiency.reasons.join("; ")}`);
      }
      const reliability = derivePairReliability({
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
        aggregatePredictivePearson,
        topTemporalScoreDelta: temporalRunnerUps[0]?.scoreDeltaFromBest ?? null,
        robustnessDeltaPercent: robustness.optimalDeltaPercent,
        dataSufficiencyStatus: dataSufficiency.status,
      });
      const actionability = derivePairActionability({
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
        aggregatePredictivePearson,
        temporalStabilityWarning,
      });
      const qualityTier = derivePairQualityTier({
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
        aggregatePredictivePearson,
        temporalStabilityWarning,
        robustnessDeltaPercent: robustness.optimalDeltaPercent,
        actionabilityStatus: actionability.status,
      });
      const pair: PairStudyArtifact = {
        pairId: `${predictor.id}__${outcome.id}`,
        predictorId: predictor.id,
        predictorLabel: predictor.label,
        predictorUnit: predictor.unit,
        outcomeId: outcome.id,
        outcomeLabel: outcome.label,
        outcomeUnit: outcome.unit,
        lagYears,
        durationYears: temporalProfile.durationYears,
        temporalProfileSource: temporalProfile.source,
        fillingType: temporalProfile.fillingType,
        fillingValue: temporalProfile.fillingType === "value"
          ? (temporalProfile.fillingValue ?? 0)
          : null,
        temporalCandidatesEvaluated: temporalCandidates.length,
        temporalCandidatesWithResults,
        temporalScore: selectedTemporal.score,
        temporalRunnerUps,
        temporalStabilityWarning,
        robustness,
        qualityTier,
        actionabilityStatus: actionability.status,
        actionabilityReasons: actionability.reasons,
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        skippedSubjects: nonNegativeInt(runner.skippedSubjects.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateForwardPearson,
        aggregateReversePearson,
        aggregatePredictivePearson,
        aggregateEffectSize,
        aggregateStatisticalSignificance,
        weightedAveragePIS,
        aggregateValuePredictingHighOutcome,
        aggregateValuePredictingLowOutcome,
        aggregateOptimalDailyValue,
        responseCurve,
        dataSufficiency,
        reliability,
        predictorObservedMin: predictorObservedRange.min,
        predictorObservedMax: predictorObservedRange.max,
        narrativeSummary: [],
        predictorBinRows,
        predictorDistribution: predictorHistogram.length > 0 ? predictorHistogram : predictorDistribution,
        outcomeDistribution: outcomeHistogram.length > 0 ? outcomeHistogram : outcomeDistribution,
        pppPerCapitaSummary,
        sparseOutcomeDiagnostics: (() => {
          const outcomeEntry = getVariableById(outcome.id);
          if (!outcomeEntry?.sparseOutcomeProfile) return null;
          const bins = predictorBinRows.map((row) => ({
            binIndex: row.binIndex ?? 0,
            lowerBound: row.lowerBound ?? 0,
            upperBound: row.upperBound ?? 0,
            isUpperInclusive: row.isUpperInclusive ?? false,
            count: row.pairs ?? 0,
            predictorMean: row.predictorMean ?? 0,
            predictorMedian: row.predictorMedian ?? 0,
            outcomeMean: row.outcomeMean ?? 0,
            outcomeStd: 0,
            outcomeSem: 0,
          }));
          return assessSparseOutcomeSupport(bins, {
            minimumEventCountPerBin: outcomeEntry.sparseOutcomeProfile.minimumEventCountPerBin,
          });
        })(),
        pValue,
        evidenceGrade,
        direction,
        qualityWarnings,
        topSubjects: runner.subjectResults
          .map((row) => ({
            subjectId: row.subjectId,
            forwardPearson: finiteOrZero(row.nOf1VariableRelationship.forwardPearson),
            predictivePearson: finiteOrZero(row.nOf1VariableRelationship.predictivePearson),
            effectSize: finiteOrZero(row.nOf1VariableRelationship.effectSize),
            numberOfPairs: nonNegativeInt(row.nOf1VariableRelationship.numberOfPairs),
          }))
          .sort((a, b) => Math.abs(b.predictivePearson) - Math.abs(a.predictivePearson))
          .slice(0, topSubjectsPerPair),
        skippedReasons: runner.skippedSubjects.map((row) => `${row.subjectId}: ${row.reason}`),
      };
      pair.narrativeSummary = buildPairNarrativeSummary(pair);
      pairStudies.push(pair);

      if (isRecommendationEligible(pair)) {
        candidates.push({
          outcomeId: outcome.id,
          predictorId: predictor.id,
          predictorLabel: predictor.label,
          aggregateVariableRelationship: {
            numberOfUnits: nonNegativeInt(aggregate.numberOfUnits),
            aggregateForwardPearson,
            aggregateReversePearson,
            aggregatePredictivePearson,
            aggregateEffectSize,
            aggregateStatisticalSignificance,
            aggregateValuePredictingHighOutcome: finiteOrNull(aggregate.aggregateValuePredictingHighOutcome),
            aggregateValuePredictingLowOutcome: finiteOrNull(aggregate.aggregateValuePredictingLowOutcome),
            aggregateOptimalDailyValue: finiteOrNull(aggregate.aggregateOptimalDailyValue),
            aggregateOutcomeFollowUpPercentChangeFromBaseline: finiteOrNull(
              aggregate.aggregateOutcomeFollowUpPercentChangeFromBaseline,
            ),
            weightedAveragePIS,
            totalPairs: nonNegativeInt(aggregate.totalPairs),
          },
          pValue,
          evidenceGrade,
          qualityPenalty: pair.includedSubjects < 20 ? 0.2 : 0,
        });
      } else {
        pairsExcludedBySufficiencyGate += 1;
      }
    }
  }

  const rankings = outcomes
    .map((outcome) =>
      rankPredictorsForOutcome({
        outcomeId: outcome.id,
        candidates,
        multipleTestingMethod: "benjamini_hochberg",
        alpha: 0.05,
      })
    )
    .sort((left, right) => left.outcomeId.localeCompare(right.outcomeId));
  const pairByKey = new Map(pairStudies.map((pair) => [`${pair.predictorId}::${pair.outcomeId}`, pair]));

  // ─── Two-Stage Recommendation Gating ─────────────────────────────
  const sparseProfiles = new Map<string, SparseOutcomeProfile>();
  for (const entry of registry) {
    if (entry.sparseOutcomeProfile) {
      sparseProfiles.set(entry.id, entry.sparseOutcomeProfile);
    }
  }

  const gateResults = new Map<string, TwoStageGateResult>();
  for (const predictor of predictors) {
    const pairsByOutcome = new Map<string, PairStudyArtifact>();
    for (const pair of pairStudies) {
      if (pair.predictorId === predictor.id) {
        pairsByOutcome.set(pair.outcomeId, pair);
      }
    }
    const gateResult = evaluateTwoStageGate(predictor.id, pairsByOutcome, sparseProfiles);
    gateResults.set(predictor.id, gateResult);
    if (logProgress && !gateResult.overallEligible) {
      console.log(`Gate: ${predictor.id} → ${gateResult.directMission.verdict}/${gateResult.welfareGuardrail.verdict} (${gateResult.plainLanguageGuidance})`);
    }
  }

  if (writeFiles) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    for (const pair of pairStudies) fs.writeFileSync(path.join(outputDir, toPairFileName(pair)), buildPairMarkdown(pair), "utf-8");
    for (const ranking of rankings) fs.writeFileSync(path.join(outputDir, toOutcomeFileName(ranking.outcomeId)), buildOutcomeMarkdown(ranking.outcomeId, ranking, pairByKey), "utf-8");
    const spendingTradeoffReportFile = "spending-kpi-tradeoff-report.md";
    fs.writeFileSync(
      path.join(outputDir, spendingTradeoffReportFile),
      buildSpendingKpiTradeoffReport(pairStudies, gateResults),
      "utf-8",
    );

    const indexLines = [
      "# Aggregate N-of-1 Mega Studies",
      "",
      `- Generated: ${generatedAt}`,
      `- Predictors considered: ${predictors.length}`,
      `- Predictors excluded (non-discretionary): ${excludedNonDiscretionaryPredictors.length}`,
      `- Outcomes considered: ${outcomes.length}`,
      `- Outcome scope: ${selectedOutcomeIds.join(", ")}`,
      `- Data cache: ${useDataCache ? `enabled (${maxCacheAgeHours}h max age)` : "disabled"}`,
      `- Cache directory: ${useDataCache ? cacheDir : "N/A"}`,
      `- Pair studies generated: ${pairStudies.length}`,
      `- Pair studies skipped: ${skippedPairs.length}`,
      `- Pairs excluded from ranking by hard sufficiency gate: ${pairsExcludedBySufficiencyGate}`,
      `- API payload: mega-study-api.json`,
      `- Spending KPI tradeoff report: [${spendingTradeoffReportFile}](${spendingTradeoffReportFile})`,
      ...(excludedNonDiscretionaryPredictors.length > 0
        ? [
            "",
            "## Excluded Predictors",
            "",
            ...excludedNonDiscretionaryPredictors.map(
              (entry) => `- ${entry.id}: ${entry.label}`,
            ),
          ]
        : []),
      "",
      "## Outcome Reports",
      "",
      ...rankings.map((ranking) => `- ${ranking.outcomeId}: [${toOutcomeFileName(ranking.outcomeId)}](${toOutcomeFileName(ranking.outcomeId)}) (${ranking.rows.length} predictors)`),
      "",
      "## Skipped Pairs",
      "",
      ...skippedPairs.slice(0, 200).map((row) => `- ${row.predictorId} -> ${row.outcomeId}: ${row.reason}`),
      "",
    ];
    fs.writeFileSync(path.join(outputDir, "mega-study-index.md"), indexLines.join("\n"), "utf-8");
    fs.writeFileSync(path.join(outputDir, "mega-study-results.json"), JSON.stringify({ pairStudies, rankings, skippedPairs }, null, 2), "utf-8");
    fs.writeFileSync(
      path.join(outputDir, "mega-study-api.json"),
      JSON.stringify(buildMegaStudyApiPayload(generatedAt, pairStudies, rankings, gateResults), null, 2),
      "utf-8",
    );
  }

  return {
    generatedAt,
    outputDir,
    pairStudyCount: pairStudies.length,
    skippedPairCount: skippedPairs.length,
    outcomeRankingCount: rankings.length,
    pairStudies,
    rankings,
    skippedPairs,
  };
}
