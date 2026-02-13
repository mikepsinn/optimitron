import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  fetchers,
  getVariableRegistry,
  type DataPoint,
  type FetchOptions,
  type VariableTemporalFillingType,
  type VariableRegistryEntry,
} from "@optomitron/data";
import {
  alignTimeSeries,
  buildAdaptiveNumericBins,
  buildOutcomeMegaStudies,
  runVariableRelationshipAnalysis,
  type AlignedPair,
  type OutcomeMegaStudyRanking,
  type OutcomeRankingCandidate,
  type TimeSeries,
} from "@optomitron/optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, "../../output/mega-studies");
const DEFAULT_CACHE_DIR = path.resolve(__dirname, "../../output/.cache/mega-study-data");
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
export const DEFAULT_REPORT_OUTCOME_IDS = [
  "outcome.derived.after_tax_median_income_ppp",
  "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct",
  "outcome.who.healthy_life_expectancy_years",
  "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
] as const;

type TemporalProfileSource = "pair_override" | "predictor_default" | "global_fallback";
type PairActionabilityStatus = "actionable" | "exploratory";

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

export interface PairQualitySignalInput {
  includedSubjects: number;
  totalPairs: number;
  aggregateStatisticalSignificance: number;
  aggregatePredictivePearson: number;
  maxSubjectDirectionalScore?: number;
  predictorObservedMin?: number | null;
  predictorObservedMax?: number | null;
  aggregateValuePredictingHighOutcome?: number | null;
  aggregateValuePredictingLowOutcome?: number | null;
  aggregateOptimalDailyValue?: number | null;
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
  predictorObservedMin: number | null;
  predictorObservedMax: number | null;
  narrativeSummary: string[];
  predictorBinRows: PairBinSummaryRow[];
  predictorDistribution: DistributionBucket[];
  outcomeDistribution: DistributionBucket[];
  pppPerCapitaSummary: PppPerCapitaSummary | null;
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

interface VariableCacheEnvelope {
  variableId: string;
  fetchedAt: string;
  period: { startYear: number; endYear: number };
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
    if (envelope.period.startYear !== fetchOptions.period.startYear) return null;
    if (envelope.period.endYear !== fetchOptions.period.endYear) return null;
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

function directionFromPredictive(value: number): "positive" | "negative" | "neutral" {
  if (value >= 0.02) return "positive";
  if (value <= -0.02) return "negative";
  return "neutral";
}

export function derivePairQualityWarnings(input: PairQualitySignalInput): string[] {
  const warnings: string[] = [];
  if (input.includedSubjects < 30) {
    warnings.push("Low subject coverage (<30); estimates may be unstable across jurisdictions.");
  }
  if (input.totalPairs < 1000) {
    warnings.push("Low aligned-pair count (<1000); confidence is limited.");
  }
  if (input.aggregateStatisticalSignificance < 0.7) {
    warnings.push("Weak aggregate significance (<0.70).");
  }
  if (Math.abs(input.aggregatePredictivePearson) > 1) {
    warnings.push("Directional score exceeds |1|; this score is forward-minus-reverse and ranges [-2, 2].");
  }
  if ((input.maxSubjectDirectionalScore ?? 0) > 1) {
    warnings.push("Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.");
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
      warnings.push("One or more optimal values are outside the observed predictor range; interpretation is extrapolative.");
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
  lines.push(
    "Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).",
  );
  return lines;
}

function bestObservedBinRow(pair: PairStudyArtifact): PairBinSummaryRow | null {
  return bestObservedBinFromRows(pair.predictorBinRows);
}

function formatValueWithUnit(value: number | null, unit: string): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `${formatCompactNumber(value)} ${unit}`;
}

function resolveActionableOptimalValue(pair: PairStudyArtifact): number | null {
  return resolveActionableOptimalValueFromAggregate(
    pair.aggregateOptimalDailyValue,
    pair.aggregateValuePredictingHighOutcome,
  );
}

function buildPairActionableTakeaway(pair: PairStudyArtifact): string[] {
  const lines: string[] = [];
  const optimalValue = resolveActionableOptimalValue(pair);
  const bestBin = bestObservedBinRow(pair);
  const pppSummary = pair.pppPerCapitaSummary;
  const isActionable = pair.actionabilityStatus === "actionable";

  lines.push(
    `${isActionable ? "Estimated best" : "Exploratory estimate of best"} ${pair.predictorLabel} level for higher ${pair.outcomeLabel}: ${formatValueWithUnit(optimalValue, pair.predictorUnit)}.`,
  );
  if (pppSummary?.estimatedBestPerCapitaPpp != null) {
    lines.push(
      `${isActionable ? "Approximate per-capita PPP equivalent of that best level" : "Exploratory per-capita PPP equivalent"}: ${formatCompactNumber(pppSummary.estimatedBestPerCapitaPpp)} international $/person (using median GDP per-capita PPP in-sample).`,
    );
  }
  if (bestBin?.outcomeMean != null) {
    lines.push(
      `Highest observed mean ${pair.outcomeLabel} appears when ${pair.predictorLabel} is in ${bestBin.label} (mean outcome ${formatCompactNumber(bestBin.outcomeMean)}).`,
    );
  }
  if (pppSummary?.bestObservedPerCapitaPppRange != null) {
    lines.push(
      `PPP per-capita equivalent in that best observed bin (p10-p90): ${pppSummary.bestObservedPerCapitaPppRange}.`,
    );
  }
  if (pair.direction === "negative") {
    lines.push("Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.");
  } else if (pair.direction === "positive") {
    lines.push("Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.");
  } else {
    lines.push("Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.");
  }
  if (!isActionable) {
    lines.push(
      `Actionability gate: exploratory only (${pair.actionabilityReasons.join("; ")}).`,
    );
  }
  return lines;
}

function buildEvidenceInterpretation(pair: PairStudyArtifact): string {
  if (pair.aggregateStatisticalSignificance >= 0.9 && pair.includedSubjects >= 120) {
    return "Stronger evidence for directional signal relative to other predictors in this report.";
  }
  if (pair.aggregateStatisticalSignificance >= 0.8 && pair.includedSubjects >= 60) {
    return "Moderate evidence; plausible signal but still sensitive to model assumptions.";
  }
  return "Exploratory evidence only; use primarily for hypothesis generation.";
}

function selectActionableOutcomeRows(
  ranking: OutcomeMegaStudyRanking,
  pairByKey: Map<string, PairStudyArtifact>,
): ActionableOutcomeRow[] {
  const rowsWithPairs: ActionableOutcomeRow[] = ranking.rows
    .map((row) => ({
      row,
      pair: pairByKey.get(`${row.predictorId}::${row.outcomeId}`),
    }))
    .filter((entry): entry is ActionableOutcomeRow => entry.pair != null);

  const highClarity = rowsWithPairs.filter(({ pair }) => pair.actionabilityStatus === "actionable");

  const topRow = rowsWithPairs[0];
  if (!topRow) return [];

  const dedup = new Map<string, ActionableOutcomeRow>();
  dedup.set(`${topRow.row.predictorId}::${topRow.row.outcomeId}`, topRow);

  const prioritizedPool = highClarity.length >= 3 ? highClarity : rowsWithPairs;
  for (const candidate of prioritizedPool) {
    const key = `${candidate.row.predictorId}::${candidate.row.outcomeId}`;
    if (!dedup.has(key)) dedup.set(key, candidate);
    if (dedup.size >= 5) break;
  }

  return [...dedup.values()].slice(0, 5);
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

function buildDerivedGovExpPerCapitaPpp(raw: Map<string, DataPoint[]>): DataPoint[] {
  const gov = raw.get("predictor.wb.gov_expenditure_pct_gdp") ?? [];
  const gdp = raw.get("outcome.wb.gdp_per_capita_ppp") ?? [];
  const gdpByKey = new Map(gdp.map((row) => [`${row.jurisdictionIso3}::${row.year}`, row.value]));
  const rows: DataPoint[] = [];
  for (const row of gov) {
    const key = `${row.jurisdictionIso3}::${row.year}`;
    const gdpValue = gdpByKey.get(key);
    if (!Number.isFinite(gdpValue)) continue;
    rows.push({
      jurisdictionIso3: row.jurisdictionIso3,
      year: row.year,
      value: (row.value / 100) * (gdpValue ?? 0),
      unit: "PPP-adjusted currency/person",
      source: "Derived (Gov %GDP × GDP PPP per-capita)",
    });
  }
  return rows;
}

function buildDerivedAfterTaxMedianIncomePpp(raw: Map<string, DataPoint[]>): DataPoint[] {
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

function buildDerivedYoYPercent(points: DataPoint[], sourceLabel: string): DataPoint[] {
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

async function fetchRegistryVariable(
  variable: VariableRegistryEntry,
  fetchOptions: FetchOptions,
): Promise<DataPoint[]> {
  const fetcherName = variable.source.fetcher;
  if (!fetcherName) return [];
  const fetcher = fetchers[fetcherName as keyof typeof fetchers];
  if (typeof fetcher !== "function") return [];
  return (await fetcher(fetchOptions)) as DataPoint[];
}

function toPairFileName(pair: PairStudyArtifact): string {
  return `pair-${slugifyId(pair.predictorId)}__${slugifyId(pair.outcomeId)}.md`;
}

function toOutcomeFileName(outcomeId: string): string {
  return `outcome-${slugifyId(outcomeId)}.md`;
}

function buildPairMarkdown(pair: PairStudyArtifact): string {
  const lines: string[] = [];
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
  lines.push(`- Evidence grade: ${pair.evidenceGrade}`);
  lines.push(`- Direction: ${pair.direction}`);
  lines.push(`- Derived uncertainty score: ${pair.pValue.toFixed(4)} (1 - aggregate significance, not NHST p-value)`);
  lines.push("");
  lines.push("## Actionable Takeaway");
  lines.push("");
  for (const sentence of buildPairActionableTakeaway(pair)) {
    lines.push(`- ${sentence}`);
  }
  lines.push("");
  lines.push("## Decision Summary");
  lines.push("");
  lines.push(`- Interpretation: ${buildEvidenceInterpretation(pair)}`);
  if (pair.actionabilityStatus === "actionable") {
    lines.push(
      pair.direction === "positive"
        ? `- Practical direction: increase ${pair.predictorLabel} toward the estimated best level, then monitor ${pair.outcomeLabel}.`
        : pair.direction === "negative"
          ? `- Practical direction: decrease ${pair.predictorLabel} toward the estimated best level, then monitor ${pair.outcomeLabel}.`
          : `- Practical direction: no strong directional guidance; prioritize additional data and robustness checks.`,
    );
  } else {
    lines.push("- Practical direction: exploratory signal only; do not treat this as a prescriptive target yet.");
  }
  lines.push(
    pair.aggregateStatisticalSignificance >= 0.85
      ? "- Signal strength: relatively stronger within this report set."
      : "- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.",
  );
  lines.push(`- Actionability status: ${pair.actionabilityStatus}.`);
  if (pair.actionabilityReasons.length > 0) {
    lines.push(`- Actionability gate reasons: ${pair.actionabilityReasons.join("; ")}.`);
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
  lines.push("");
  lines.push("## Appendix: Technical Diagnostics");
  lines.push("");
  lines.push("### Core Metrics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|------:|");
  lines.push(`| Aggregate forward Pearson | ${pair.aggregateForwardPearson.toFixed(4)} |`);
  lines.push(`| Aggregate reverse Pearson | ${pair.aggregateReversePearson.toFixed(4)} |`);
  lines.push(`| Aggregate directional score (forward - reverse) | ${pair.aggregatePredictivePearson.toFixed(4)} |`);
  lines.push(`| Aggregate effect size (% baseline delta) | ${pair.aggregateEffectSize.toFixed(4)} |`);
  lines.push(`| Aggregate statistical significance | ${pair.aggregateStatisticalSignificance.toFixed(4)} |`);
  lines.push(`| Weighted average PIS | ${pair.weightedAveragePIS.toFixed(4)} |`);
  lines.push(`| Aggregate value predicting high outcome | ${pair.aggregateValuePredictingHighOutcome == null ? "N/A" : pair.aggregateValuePredictingHighOutcome.toFixed(4)} |`);
  lines.push(`| Aggregate value predicting low outcome | ${pair.aggregateValuePredictingLowOutcome == null ? "N/A" : pair.aggregateValuePredictingLowOutcome.toFixed(4)} |`);
  lines.push(`| Aggregate optimal daily value | ${pair.aggregateOptimalDailyValue == null ? "N/A" : pair.aggregateOptimalDailyValue.toFixed(4)} |`);
  lines.push(`| Observed predictor range | ${pair.predictorObservedMin == null || pair.predictorObservedMax == null ? "N/A" : `[${pair.predictorObservedMin.toFixed(4)}, ${pair.predictorObservedMax.toFixed(4)}]`} |`);
  lines.push(`| Actionability status | ${pair.actionabilityStatus} |`);
  lines.push(`| Actionability reasons | ${pair.actionabilityReasons.length > 0 ? pair.actionabilityReasons.join("; ") : "N/A"} |`);
  if (pair.pppPerCapitaSummary != null) {
    lines.push(
      `| Estimated best level (PPP per-capita equivalent) | ${pair.pppPerCapitaSummary.estimatedBestPerCapitaPpp == null ? "N/A" : `${formatCompactNumber(pair.pppPerCapitaSummary.estimatedBestPerCapitaPpp)} international $/person`} |`,
    );
    lines.push(
      `| Best observed PPP per-capita range (p10-p90) | ${pair.pppPerCapitaSummary.bestObservedPerCapitaPppRange ?? "N/A"} |`,
    );
    lines.push(
      `| Median GDP per-capita PPP (context) | ${pair.pppPerCapitaSummary.medianGdpPerCapitaPpp == null ? "N/A" : `${formatCompactNumber(pair.pppPerCapitaSummary.medianGdpPerCapitaPpp)} international $`} |`,
    );
    lines.push(
      `| Pairs with PPP conversion | ${pair.pppPerCapitaSummary.samplePairs} |`,
    );
  }
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
  lines.push("- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.");
  if (
    outcomeId === "outcome.derived.after_tax_median_income_ppp" ||
    outcomeId === "outcome.derived.after_tax_median_income_ppp_growth_yoy_pct"
  ) {
    lines.push("- Note: After-tax median income is currently proxied by World Bank GNI per-capita PPP in this report set.");
  }
  const significantCount = ranking.rows.filter((row) => row.significant).length;
  const actionableRows = selectActionableOutcomeRows(ranking, pairByKey);
  if (ranking.rows.length > 0) {
    const lead = actionableRows[0]?.row ?? ranking.rows[0]!;
    const topPair = pairByKey.get(`${lead.predictorId}::${lead.outcomeId}`);
    const topBestLevel = topPair
      ? formatValueWithUnit(resolveActionableOptimalValue(topPair), topPair.predictorUnit)
      : "N/A";
    const topBestPpp = topPair?.pppPerCapitaSummary?.estimatedBestPerCapitaPpp == null
      ? "N/A"
      : `${formatCompactNumber(topPair.pppPerCapitaSummary.estimatedBestPerCapitaPpp)} international $/person`;
    lines.push("");
    lines.push("## Lead Takeaway");
    lines.push("");
    lines.push(`- Lead predictor for ${outcomeLabel}: ${lead.predictorLabel ?? lead.predictorId}.`);
    lines.push(
      topPair?.actionabilityStatus === "actionable"
        ? "- Recommendation status: actionable."
        : "- Recommendation status: exploratory only (lead signal did not pass actionability gate).",
    );
    lines.push(`- Estimated best level: ${topBestLevel}.`);
    if (topBestPpp !== "N/A") {
      lines.push(`- Approximate PPP per-capita equivalent of that level: ${topBestPpp}.`);
    }
    lines.push(
      significantCount > 0
        ? `- Statistical status: ${significantCount} predictors pass adjusted-alpha threshold.`
        : "- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.",
    );
  }
  lines.push("");
  lines.push("## Actionable Takeaways (Top Predictors)");
  lines.push("");
  lines.push("- Rows are filtered for clarity (coverage + directional signal) when possible; fallback is top-ranked predictors.");
  lines.push("");
  lines.push("| Model Rank | Predictor | Estimated Best Level | Estimated Best PPP/Capita | Best Observed Range | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Status | Pair Report |");
  lines.push("|-----------:|-----------|---------------------:|--------------------------:|--------------------:|-----------------------------------:|---------------------------:|----------:|--------|------------|");
  for (const { row, pair } of actionableRows) {
    const reportFile = `[${toPairFileName(pair)}](${toPairFileName(pair)})`;
    const bestBin = bestObservedBinRow(pair);
    const bestLevel = formatValueWithUnit(resolveActionableOptimalValue(pair), pair.predictorUnit);
    const bestLevelPpp = pair.pppPerCapitaSummary?.estimatedBestPerCapitaPpp == null
      ? "N/A"
      : `${formatCompactNumber(pair.pppPerCapitaSummary.estimatedBestPerCapitaPpp)} intl $/person`;
    const bestRange = bestBin?.label ?? "N/A";
    const bestRangePpp = pair?.pppPerCapitaSummary?.bestObservedPerCapitaPppRange ?? "N/A";
    const bestOutcomeMean = bestBin?.outcomeMean == null ? "N/A" : formatCompactNumber(bestBin.outcomeMean);
    const direction = pair.direction;
    const status = pair.actionabilityStatus;
    lines.push(
      `| ${row.rank} | ${row.predictorLabel ?? row.predictorId} | ${bestLevel} | ${bestLevelPpp} | ${bestRange} | ${bestRangePpp} | ${bestOutcomeMean} | ${direction} | ${status} | ${reportFile} |`,
    );
  }
  if (ranking.rows.length > 0) {
    const top = ranking.rows[0]!;
    const pair = pairByKey.get(`${top.predictorId}::${top.outcomeId}`);
    const direction = pair?.direction ?? "neutral";
    lines.push("");
    lines.push("## Plain-Language Summary");
    lines.push("");
    lines.push(
      `- Top-ranked predictor is ${top.predictorLabel ?? top.predictorId} with score ${top.score.toFixed(3)} and direction ${direction}.`,
    );
    lines.push(
      `- This outcome page includes ${ranking.rows.length} predictor studies and ${significantCount} pass the configured adjusted-alpha threshold.`,
    );
    lines.push(
      "- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.",
    );
  }
  lines.push("");
  lines.push("## Appendix: Technical Ranking Details");
  lines.push("");
  lines.push("| Rank | Predictor | Score | Confidence | Adj p | Evidence | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |");
  lines.push("|-----:|-----------|------:|-----------:|------:|---------:|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|");
  for (const row of ranking.rows) {
    const pair = pairByKey.get(`${row.predictorId}::${row.outcomeId}`);
    const reportFile = pair ? `[${toPairFileName(pair)}](${toPairFileName(pair)})` : "(missing)";
    const optimalHigh = pair?.aggregateValuePredictingHighOutcome == null ? "N/A" : pair.aggregateValuePredictingHighOutcome.toFixed(3);
    const optimalLow = pair?.aggregateValuePredictingLowOutcome == null ? "N/A" : pair.aggregateValuePredictingLowOutcome.toFixed(3);
    const optimalDaily = pair?.aggregateOptimalDailyValue == null ? "N/A" : pair.aggregateOptimalDailyValue.toFixed(3);
    const evidence = pair?.evidenceGrade ?? row.evidenceGrade ?? "N/A";
    const direction = pair?.direction ?? "n/a";
    const directionalScore = pair ? pair.aggregatePredictivePearson.toFixed(4) : row.aggregatePredictivePearson.toFixed(4);
    lines.push(`| ${row.rank} | ${row.predictorLabel ?? row.predictorId} | ${row.score.toFixed(4)} | ${row.confidence.toFixed(4)} | ${row.adjustedPValue.toFixed(4)} | ${evidence} | ${direction} | ${directionalScore} | ${row.numberOfUnits} | ${row.totalPairs} | ${optimalHigh} | ${optimalLow} | ${optimalDaily} | ${reportFile} |`);
  }
  lines.push("");
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
  if (predictors.some((entry) => entry.id === "predictor.derived.gov_expenditure_per_capita_ppp")) {
    rawByVariable.set(
      "predictor.derived.gov_expenditure_per_capita_ppp",
      buildDerivedGovExpPerCapitaPpp(rawByVariable),
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
      const direction = directionFromPredictive(aggregatePredictivePearson);
      const qualityWarnings = derivePairQualityWarnings({
        includedSubjects: runner.subjectResults.length,
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
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
      const actionability = derivePairActionability({
        includedSubjects: nonNegativeInt(runner.subjectResults.length),
        totalPairs: nonNegativeInt(aggregate.totalPairs),
        aggregateStatisticalSignificance,
        aggregatePredictivePearson,
        temporalStabilityWarning,
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
        predictorObservedMin: predictorObservedRange.min,
        predictorObservedMax: predictorObservedRange.max,
        narrativeSummary: [],
        predictorBinRows,
        predictorDistribution: predictorHistogram.length > 0 ? predictorHistogram : predictorDistribution,
        outcomeDistribution: outcomeHistogram.length > 0 ? outcomeHistogram : outcomeDistribution,
        pppPerCapitaSummary,
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
    }
  }

  const rankings = buildOutcomeMegaStudies({ candidates, multipleTestingMethod: "benjamini_hochberg", alpha: 0.05 });
  const pairByKey = new Map(pairStudies.map((pair) => [`${pair.predictorId}::${pair.outcomeId}`, pair]));

  if (writeFiles) {
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    for (const pair of pairStudies) fs.writeFileSync(path.join(outputDir, toPairFileName(pair)), buildPairMarkdown(pair), "utf-8");
    for (const ranking of rankings) fs.writeFileSync(path.join(outputDir, toOutcomeFileName(ranking.outcomeId)), buildOutcomeMarkdown(ranking.outcomeId, ranking, pairByKey), "utf-8");

    const indexLines = [
      "# Aggregate N-of-1 Mega Studies",
      "",
      `- Generated: ${new Date().toISOString()}`,
      `- Predictors considered: ${predictors.length}`,
      `- Predictors excluded (non-discretionary): ${excludedNonDiscretionaryPredictors.length}`,
      `- Outcomes considered: ${outcomes.length}`,
      `- Outcome scope: ${selectedOutcomeIds.join(", ")}`,
      `- Data cache: ${useDataCache ? `enabled (${maxCacheAgeHours}h max age)` : "disabled"}`,
      `- Cache directory: ${useDataCache ? cacheDir : "N/A"}`,
      `- Pair studies generated: ${pairStudies.length}`,
      `- Pair studies skipped: ${skippedPairs.length}`,
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
  }

  return {
    generatedAt: new Date().toISOString(),
    outputDir,
    pairStudyCount: pairStudies.length,
    skippedPairCount: skippedPairs.length,
    outcomeRankingCount: rankings.length,
    pairStudies,
    rankings,
    skippedPairs,
  };
}
