import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  fetchers,
  getVariableRegistry,
  type DataPoint,
  type FetchOptions,
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

export interface MegaStudyGenerationOptions {
  outputDir?: string;
  writeFiles?: boolean;
  logProgress?: boolean;
  period?: { startYear: number; endYear: number };
  jurisdictions?: string[];
  minimumPairs?: number;
  minimumMeasurementsPerSeries?: number;
  topSubjectsPerPair?: number;
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

export function isReportEligiblePredictor(variable: VariableRegistryEntry): boolean {
  return variable.kind === "predictor" && variable.isDiscretionary === true;
}

export function slugifyId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
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

function inBin(value: number, bucket: DistributionBucket): boolean {
  if (bucket.isUpperInclusive) {
    return value >= bucket.lowerBound && value <= bucket.upperBound;
  }
  return value >= bucket.lowerBound && value < bucket.upperBound;
}

function collectAlignedPairs(
  subjectIds: string[],
  predictorSeries: Map<string, TimeSeries>,
  outcomeSeries: Map<string, TimeSeries>,
  lagYears: number,
): PairAlignedPoint[] {
  const alignedPoints: PairAlignedPoint[] = [];
  const config = {
    onsetDelaySeconds: lagYears * 365 * 24 * 60 * 60,
    durationOfActionSeconds: 365 * 24 * 60 * 60,
    fillingType: "interpolation" as const,
  };

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
  const strongestBin = [...pair.predictorBinRows]
    .filter((row) => row.outcomeMean != null)
    .sort((a, b) => (b.outcomeMean ?? Number.NEGATIVE_INFINITY) - (a.outcomeMean ?? Number.NEGATIVE_INFINITY))[0];
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
  lines.push(`- Included subjects: ${pair.includedSubjects}`);
  lines.push(`- Skipped subjects: ${pair.skippedSubjects}`);
  lines.push(`- Total aligned pairs: ${pair.totalPairs}`);
  lines.push(`- Evidence grade: ${pair.evidenceGrade}`);
  lines.push(`- Direction: ${pair.direction}`);
  lines.push(`- Derived uncertainty score: ${pair.pValue.toFixed(4)} (1 - aggregate significance, not NHST p-value)`);
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
  lines.push("");
  lines.push("## Binned Pattern Table");
  lines.push("");
  lines.push("| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |");
  lines.push("|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|");
  for (const row of pair.predictorBinRows) {
    lines.push(
      `| ${row.binIndex + 1} | ${row.label} | ${row.pairs} | ${row.subjects} | ${row.predictorMean == null ? "N/A" : row.predictorMean.toFixed(4)} | ${row.predictorMedian == null ? "N/A" : row.predictorMedian.toFixed(4)} | ${row.outcomeMean == null ? "N/A" : row.outcomeMean.toFixed(4)} | ${row.outcomeMedian == null ? "N/A" : row.outcomeMedian.toFixed(4)} |`,
    );
  }
  lines.push("");
  lines.push("## Distribution Charts");
  lines.push("");
  lines.push("```text");
  lines.push(buildAsciiDistributionChart(`Predictor Distribution (${pair.predictorLabel})`, pair.predictorDistribution));
  lines.push("```");
  lines.push("");
  lines.push("```text");
  lines.push(buildAsciiDistributionChart(`Outcome Distribution (${pair.outcomeLabel}, welfare-aligned)`, pair.outcomeDistribution));
  lines.push("```");
  lines.push("");
  lines.push("## Top Subjects");
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
  lines.push(`# Outcome Mega Study: ${outcomeId}`);
  lines.push("");
  lines.push(`- Multiple testing: ${ranking.multipleTesting.method}`);
  lines.push(`- Alpha: ${ranking.multipleTesting.alpha}`);
  lines.push(`- Tests: ${ranking.multipleTesting.tests}`);
  lines.push("- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.");
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
      `- This outcome page includes ${ranking.rows.length} predictor studies and ${ranking.rows.filter((row) => row.significant).length} pass the configured adjusted-alpha threshold.`,
    );
    lines.push(
      "- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.",
    );
  }
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
  const period = options.period ?? { startYear: 1990, endYear: 2023 };
  const minimumPairs = options.minimumPairs ?? 6;
  const minimumMeasurementsPerSeries = options.minimumMeasurementsPerSeries ?? 8;
  const topSubjectsPerPair = options.topSubjectsPerPair ?? 12;

  const registry = getVariableRegistry().filter((entry) => entry.analysisScopes.includes("global_panel"));
  const predictorCandidates = registry.filter((entry) => entry.kind === "predictor");
  const predictors = predictorCandidates.filter(isReportEligiblePredictor);
  const excludedNonDiscretionaryPredictors = predictorCandidates.filter(
    (entry) => !isReportEligiblePredictor(entry),
  );
  const outcomes = registry.filter((entry) => entry.kind === "outcome");
  const fetchOptions: FetchOptions = { period, jurisdictions: options.jurisdictions };

  const rawByVariable = new Map<string, DataPoint[]>();
  for (const variable of registry.filter((entry) => entry.source.fetcher)) {
    if (logProgress) console.log(`Fetching ${variable.id}...`);
    rawByVariable.set(variable.id, await fetchRegistryVariable(variable, fetchOptions));
  }
  if (predictors.some((entry) => entry.id === "predictor.derived.gov_expenditure_per_capita_ppp")) {
    rawByVariable.set(
      "predictor.derived.gov_expenditure_per_capita_ppp",
      buildDerivedGovExpPerCapitaPpp(rawByVariable),
    );
  }

  const seriesByVariable = new Map<string, Map<string, TimeSeries>>();
  for (const variable of registry) {
    seriesByVariable.set(
      variable.id,
      toTimeSeriesMap(variable, rawByVariable.get(variable.id) ?? [], minimumMeasurementsPerSeries),
    );
  }

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

      const lagYears = selectLagYears(predictor.suggestedLagYears, outcome.suggestedLagYears);
      const runner = runVariableRelationshipAnalysis({
        subjects: commonSubjects.map((subjectId) => ({
          subjectId,
          predictor: predictorSeries.get(subjectId)!,
          outcome: outcomeSeries.get(subjectId)!,
        })),
        minimumPairs,
        analysisConfig: {
          onsetDelaySeconds: lagYears * 365 * 24 * 60 * 60,
          durationOfActionSeconds: 365 * 24 * 60 * 60,
          fillingType: "interpolation",
          analysisMode: "individual",
        },
        onSubjectError: "skip",
      });

      if (runner.subjectResults.length === 0) {
        skippedPairs.push({ predictorId: predictor.id, outcomeId: outcome.id, reason: "No valid subject analyses." });
        continue;
      }

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
        lagYears,
      );
      const predictorBinRows = buildPairBinSummaryRows(alignedPoints, 10);
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
      const pair: PairStudyArtifact = {
        pairId: `${predictor.id}__${outcome.id}`,
        predictorId: predictor.id,
        predictorLabel: predictor.label,
        predictorUnit: predictor.unit,
        outcomeId: outcome.id,
        outcomeLabel: outcome.label,
        outcomeUnit: outcome.unit,
        lagYears,
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
