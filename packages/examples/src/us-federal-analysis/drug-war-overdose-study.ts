import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { US_DRUG_WAR_DATA, type DrugWarDataPoint } from "@optomitron/data";
import {
  alignTimeSeries,
  buildAdaptiveNumericBins,
  deriveSupportConstrainedTargets,
  estimateDiminishingReturns,
  estimateMinimumEffectiveDose,
  runVariableRelationshipAnalysis,
  type AlignedPair,
  type AnalysisConfig,
  type TimeSeries,
} from "@optomitron/optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, "../../output");
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export interface DrugWarTemporalProfile {
  lagYears: number;
  durationYears: number;
  score: number;
  totalPairs: number;
  forwardPearson: number;
  predictivePearson: number;
  statisticalSignificance: number;
}

export interface DrugWarBinRow {
  label: string;
  lowerBound: number;
  upperBound: number;
  isUpperInclusive: boolean;
  observations: number;
  predictorMean: number | null;
  predictorMedian: number | null;
  outcomeMean: number | null;
  outcomeMedian: number | null;
}

export interface DrugWarOverdoseStudy {
  generatedAt: string;
  yearRange: { startYear: number; endYear: number };
  predictorLabel: string;
  predictorUnit: string;
  outcomeLabel: string;
  outcomeUnit: string;
  bestTemporalProfile: DrugWarTemporalProfile;
  temporalProfiles: DrugWarTemporalProfile[];
  pairCount: number;
  forwardPearson: number;
  predictivePearson: number;
  statisticalSignificance: number;
  suggestedSpendingPerCapitaUsd: number | null;
  minimumEffectiveDosePerCapitaUsd: number | null;
  firstDetectedChangeDosePerCapitaUsd: number | null;
  diminishingReturnsKneePerCapitaUsd: number | null;
  bestObservedBin: DrugWarBinRow | null;
  binRows: DrugWarBinRow[];
  overdoseRateSensitivity: {
    totalPairs: number;
    forwardPearson: number;
    predictivePearson: number;
    statisticalSignificance: number;
  } | null;
  notes: string[];
}

interface DrugWarSeriesBundle {
  predictorSpendingPerCapita: TimeSeries;
  outcomeOverdoseDeaths: TimeSeries;
  outcomeOverdoseDeathRate: TimeSeries;
}

function finiteOrZero(value: number | null | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const left = sorted[middle - 1];
  const right = sorted[middle];
  if (left == null || right == null) return null;
  return (left + right) / 2;
}

function formatCompactNumber(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: fractionDigits }).format(value);
}

function formatCurrencyPerCapita(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `$${formatCompactNumber(value)} /person`;
}

function formatBinLabel(lowerBound: number, upperBound: number, isUpperInclusive: boolean): string {
  const lower = formatCompactNumber(lowerBound);
  const upper = formatCompactNumber(upperBound);
  return isUpperInclusive ? `[${lower}, ${upper}]` : `[${lower}, ${upper})`;
}

function isInBin(value: number, lowerBound: number, upperBound: number, isUpperInclusive: boolean): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < lowerBound) return false;
  if (isUpperInclusive) return value <= upperBound;
  return value < upperBound;
}

function sameBin(left: DrugWarBinRow | null, right: DrugWarBinRow | null): boolean {
  if (!left || !right) return false;
  return (
    left.lowerBound === right.lowerBound &&
    left.upperBound === right.upperBound &&
    left.isUpperInclusive === right.isUpperInclusive
  );
}

function averageOutcomeSlopeAcrossBins(rows: DrugWarBinRow[]): number | null {
  let slopeSum = 0;
  let slopeCount = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const prev = rows[index - 1];
    const next = rows[index];
    if (!prev || !next) continue;
    if (prev.predictorMean == null || next.predictorMean == null) continue;
    if (prev.outcomeMean == null || next.outcomeMean == null) continue;
    const dx = next.predictorMean - prev.predictorMean;
    if (!Number.isFinite(dx) || Math.abs(dx) < 1e-9) continue;
    const dy = next.outcomeMean - prev.outcomeMean;
    slopeSum += dy / dx;
    slopeCount += 1;
  }
  if (slopeCount === 0) return null;
  return slopeSum / slopeCount;
}

function toTimestamp(year: number): string {
  return `${year}-01-01T00:00:00.000Z`;
}

function toTemporalAnalysisConfig(lagYears: number, durationYears: number): AnalysisConfig {
  return {
    analysisMode: "individual",
    onsetDelaySeconds: Math.max(0, lagYears) * SECONDS_PER_YEAR,
    durationOfActionSeconds: Math.max(1, durationYears) * SECONDS_PER_YEAR,
    fillingType: "interpolation",
  };
}

function scoreTemporalProfile(
  predictivePearson: number,
  statisticalSignificance: number,
  totalPairs: number,
): number {
  const support = Math.min(1, Math.max(0, totalPairs) / 20);
  return Math.abs(predictivePearson) * 0.5 + statisticalSignificance * 0.35 + support * 0.15;
}

function buildRawPairs(
  predictor: TimeSeries,
  outcome: TimeSeries,
  lagYears: number,
  durationYears: number,
): AlignedPair[] {
  return alignTimeSeries(predictor, outcome, {
    onsetDelaySeconds: lagYears * SECONDS_PER_YEAR,
    durationOfActionSeconds: durationYears * SECONDS_PER_YEAR,
    fillingType: "interpolation",
  });
}

export function buildDrugWarSeries(data: DrugWarDataPoint[] = US_DRUG_WAR_DATA): DrugWarSeriesBundle {
  const sorted = [...data].sort((left, right) => left.year - right.year);
  return {
    predictorSpendingPerCapita: {
      variableId: "us_drug_war_spending_per_capita_usd",
      name: "Federal Drug Control Spending Per Capita",
      category: "fiscal",
      measurements: sorted.map((row) => ({
        timestamp: toTimestamp(row.year),
        value: (row.drugControlSpendingBillions * 1_000_000_000) / row.population,
        unit: "USD/person",
      })),
    },
    outcomeOverdoseDeaths: {
      variableId: "us_overdose_deaths",
      name: "Drug Overdose Deaths",
      category: "health",
      measurements: sorted.map((row) => ({
        timestamp: toTimestamp(row.year),
        value: row.overdoseDeaths,
        unit: "deaths",
      })),
    },
    outcomeOverdoseDeathRate: {
      variableId: "us_overdose_death_rate_per_100k",
      name: "Drug Overdose Death Rate",
      category: "health",
      measurements: sorted.map((row) => ({
        timestamp: toTimestamp(row.year),
        value: row.overdoseDeathRate,
        unit: "deaths per 100k",
      })),
    },
  };
}

export function evaluateDrugWarTemporalProfiles(
  predictor: TimeSeries,
  outcome: TimeSeries,
  lagYears: number[] = [0, 1, 2, 3, 4, 5],
  durationYears: number[] = [1, 2, 3],
): DrugWarTemporalProfile[] {
  const profiles: DrugWarTemporalProfile[] = [];
  for (const lag of lagYears) {
    for (const duration of durationYears) {
      const runner = runVariableRelationshipAnalysis({
        subjects: [{ subjectId: "usa", predictor, outcome }],
        minimumPairs: 8,
        analysisConfig: toTemporalAnalysisConfig(lag, duration),
        onSubjectError: "skip",
      });
      if (runner.subjectResults.length === 0) continue;
      const aggregate = runner.aggregateVariableRelationship;
      const predictivePearson = finiteOrZero(aggregate.aggregatePredictivePearson);
      const forwardPearson = finiteOrZero(aggregate.aggregateForwardPearson);
      const statisticalSignificance = Math.max(
        0,
        Math.min(1, finiteOrZero(aggregate.aggregateStatisticalSignificance)),
      );
      const totalPairs = Math.max(0, aggregate.totalPairs ?? 0);
      profiles.push({
        lagYears: lag,
        durationYears: duration,
        score: scoreTemporalProfile(predictivePearson, statisticalSignificance, totalPairs),
        totalPairs,
        forwardPearson,
        predictivePearson,
        statisticalSignificance,
      });
    }
  }

  return profiles.sort((left, right) => {
    if (Math.abs(right.score - left.score) > 1e-9) return right.score - left.score;
    if (right.totalPairs !== left.totalPairs) return right.totalPairs - left.totalPairs;
    if (left.lagYears !== right.lagYears) return left.lagYears - right.lagYears;
    return left.durationYears - right.durationYears;
  });
}

export function pickBestDrugWarTemporalProfile(
  profiles: DrugWarTemporalProfile[],
): DrugWarTemporalProfile | null {
  return profiles[0] ?? null;
}

export function buildDrugWarBinRows(
  pairs: AlignedPair[],
  targetBinCount = 8,
  minBinSize = 2,
): DrugWarBinRow[] {
  const predictorValues = pairs.map((pair) => pair.predictorValue);
  const bins = buildAdaptiveNumericBins(predictorValues, { targetBinCount, minBinSize });
  return bins.map((bin) => {
    const inBinPairs = pairs.filter((pair) =>
      isInBin(pair.predictorValue, bin.lowerBound, bin.upperBound, bin.isUpperInclusive),
    );
    const xValues = inBinPairs.map((pair) => pair.predictorValue);
    const yValues = inBinPairs.map((pair) => pair.outcomeValue);
    return {
      label: formatBinLabel(bin.lowerBound, bin.upperBound, bin.isUpperInclusive),
      lowerBound: bin.lowerBound,
      upperBound: bin.upperBound,
      isUpperInclusive: bin.isUpperInclusive,
      observations: inBinPairs.length,
      predictorMean: mean(xValues),
      predictorMedian: median(xValues),
      outcomeMean: mean(yValues),
      outcomeMedian: median(yValues),
    };
  });
}

export function runDrugWarOverdoseStudy(
  data: DrugWarDataPoint[] = US_DRUG_WAR_DATA,
): DrugWarOverdoseStudy {
  const { predictorSpendingPerCapita, outcomeOverdoseDeaths, outcomeOverdoseDeathRate } =
    buildDrugWarSeries(data);
  const temporalProfiles = evaluateDrugWarTemporalProfiles(
    predictorSpendingPerCapita,
    outcomeOverdoseDeaths,
  );
  const bestTemporalProfile = pickBestDrugWarTemporalProfile(temporalProfiles);
  if (!bestTemporalProfile) {
    throw new Error("No usable temporal profile found for drug-war spending vs overdose deaths.");
  }

  const bestConfig = toTemporalAnalysisConfig(
    bestTemporalProfile.lagYears,
    bestTemporalProfile.durationYears,
  );
  const bestRunner = runVariableRelationshipAnalysis({
    subjects: [{ subjectId: "usa", predictor: predictorSpendingPerCapita, outcome: outcomeOverdoseDeaths }],
    minimumPairs: 8,
    analysisConfig: bestConfig,
    onSubjectError: "skip",
  });
  const aggregate = bestRunner.aggregateVariableRelationship;
  const alignedPairs = buildRawPairs(
    predictorSpendingPerCapita,
    outcomeOverdoseDeaths,
    bestTemporalProfile.lagYears,
    bestTemporalProfile.durationYears,
  );
  const x = alignedPairs.map((pair) => pair.predictorValue);
  const yDeaths = alignedPairs.map((pair) => pair.outcomeValue);
  const yWelfare = yDeaths.map((value) => -value);
  const binRows = buildDrugWarBinRows(alignedPairs);
  const bestObservedBin =
    [...binRows]
      .filter((row) => row.outcomeMean != null)
      .sort((left, right) => (left.outcomeMean ?? Number.POSITIVE_INFINITY) - (right.outcomeMean ?? Number.POSITIVE_INFINITY))[0] ?? null;

  const modelOptimal = finiteOrZero(aggregate.aggregateOptimalDailyValue);
  const supportTargets = deriveSupportConstrainedTargets(x, yDeaths, {
    objective: "minimize_outcome",
    modelOptimalValue: modelOptimal,
    minSamples: 8,
    targetBinCount: 8,
    minBinSize: 2,
    robustLowerQuantile: 0.1,
    robustUpperQuantile: 0.9,
  });
  const minimumBeneficialDose = estimateMinimumEffectiveDose(x, yDeaths, {
    minSamples: 8,
    targetBinCount: 8,
    minBinSize: 2,
    objective: "minimize_outcome",
    minConsecutiveBins: 2,
    minRelativeGainPercent: 5,
    minZScore: 0.5,
  });
  const firstDetectedChangeDose = estimateMinimumEffectiveDose(x, yDeaths, {
    minSamples: 8,
    targetBinCount: 8,
    minBinSize: 2,
    objective: "any_change",
    minConsecutiveBins: 2,
    minRelativeGainPercent: 5,
    minZScore: 0.5,
  });
  const diminishingReturns = estimateDiminishingReturns(x, yWelfare, {
    minSamples: 8,
    targetBinCount: 8,
    minBinSize: 2,
    minSlopePointsPerSegment: 1,
    maxPostToPreSlopeRatio: 0.7,
  });

  const rateRunner = runVariableRelationshipAnalysis({
    subjects: [{ subjectId: "usa", predictor: predictorSpendingPerCapita, outcome: outcomeOverdoseDeathRate }],
    minimumPairs: 8,
    analysisConfig: bestConfig,
    onSubjectError: "skip",
  });
  const rateAggregate = rateRunner.subjectResults.length > 0
    ? rateRunner.aggregateVariableRelationship
    : null;

  const notes: string[] = [];
  let minimumEffectiveDosePerCapitaUsd = minimumBeneficialDose.minimumEffectiveDose;
  if (minimumEffectiveDosePerCapitaUsd == null) {
    const lowestSpendingBin = binRows[0] ?? null;
    const averageSlope = averageOutcomeSlopeAcrossBins(binRows);
    const noAverageImprovementWithMoreSpending =
      averageSlope != null && averageSlope >= 0;
    if (sameBin(lowestSpendingBin, bestObservedBin) && noAverageImprovementWithMoreSpending) {
      minimumEffectiveDosePerCapitaUsd = 0;
      notes.push(
        "No beneficial spending threshold was detected above the lowest observed spending bin; MED is set to $0.",
      );
    }
  }
  if (bestTemporalProfile.statisticalSignificance < 0.7) {
    notes.push("Signal strength is moderate/weak; treat this as directional evidence, not final proof.");
  }
  if (Math.abs(bestTemporalProfile.predictivePearson) < 0.1) {
    notes.push("Predictive direction is weak, suggesting reverse-causation/trend effects may dominate.");
  }
  notes.push("This is single-jurisdiction time-series evidence (US only), so confounding risk remains.");
  notes.push("Suggested level is support-constrained to observed data, not unconstrained extrapolation.");

  const sortedYears = data.map((row) => row.year).sort((left, right) => left - right);
  return {
    generatedAt: new Date().toISOString(),
    yearRange: {
      startYear: sortedYears[0] ?? 0,
      endYear: sortedYears[sortedYears.length - 1] ?? 0,
    },
    predictorLabel: predictorSpendingPerCapita.name,
    predictorUnit: "USD/person",
    outcomeLabel: outcomeOverdoseDeaths.name,
    outcomeUnit: "deaths",
    bestTemporalProfile,
    temporalProfiles,
    pairCount: alignedPairs.length,
    forwardPearson: finiteOrZero(aggregate.aggregateForwardPearson),
    predictivePearson: finiteOrZero(aggregate.aggregatePredictivePearson),
    statisticalSignificance: Math.max(
      0,
      Math.min(1, finiteOrZero(aggregate.aggregateStatisticalSignificance)),
    ),
    suggestedSpendingPerCapitaUsd:
      supportTargets.supportConstrainedOptimalValue ?? supportTargets.robustOptimalValue,
    minimumEffectiveDosePerCapitaUsd,
    firstDetectedChangeDosePerCapitaUsd: firstDetectedChangeDose.minimumEffectiveDose,
    diminishingReturnsKneePerCapitaUsd: diminishingReturns.kneePredictorValue,
    bestObservedBin,
    binRows,
    overdoseRateSensitivity: rateAggregate
      ? {
          totalPairs: Math.max(0, rateAggregate.totalPairs ?? 0),
          forwardPearson: finiteOrZero(rateAggregate.aggregateForwardPearson),
          predictivePearson: finiteOrZero(rateAggregate.aggregatePredictivePearson),
          statisticalSignificance: Math.max(
            0,
            Math.min(1, finiteOrZero(rateAggregate.aggregateStatisticalSignificance)),
          ),
        }
      : null,
    notes,
  };
}

export function renderDrugWarOverdoseMarkdown(study: DrugWarOverdoseStudy): string {
  const lines: string[] = [];
  lines.push("# US Drug War Spending vs Overdose Deaths");
  lines.push("");
  lines.push(`- Time range: ${study.yearRange.startYear}-${study.yearRange.endYear}`);
  lines.push(`- Predictor: ${study.predictorLabel} (${study.predictorUnit})`);
  lines.push(`- Outcome: ${study.outcomeLabel} (${study.outcomeUnit}, lower is better)`);
  lines.push("");
  lines.push("## Topline");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Selected lag | ${study.bestTemporalProfile.lagYears} year(s) |`);
  lines.push(`| Effect window | ${study.bestTemporalProfile.durationYears} year(s) |`);
  lines.push(`| Aligned observations | ${study.pairCount} |`);
  lines.push(`| Forward correlation (spending -> deaths) | ${study.forwardPearson.toFixed(3)} |`);
  lines.push(`| Predictive direction score | ${study.predictivePearson.toFixed(3)} |`);
  lines.push(`| Significance score | ${study.statisticalSignificance.toFixed(3)} |`);
  lines.push(`| Suggested spending level | ${formatCurrencyPerCapita(study.suggestedSpendingPerCapitaUsd)} |`);
  lines.push(`| Minimum effective level | ${formatCurrencyPerCapita(study.minimumEffectiveDosePerCapitaUsd)} |`);
  lines.push(`| First detected change level | ${formatCurrencyPerCapita(study.firstDetectedChangeDosePerCapitaUsd)} |`);
  lines.push(`| Slowdown knee | ${formatCurrencyPerCapita(study.diminishingReturnsKneePerCapitaUsd)} |`);
  lines.push(
    `| Best observed spending bin | ${
      study.bestObservedBin
        ? `${study.bestObservedBin.label} (mean deaths ${formatCompactNumber(study.bestObservedBin.outcomeMean ?? NaN, 0)})`
        : "N/A"
    } |`,
  );
  if (study.overdoseRateSensitivity) {
    lines.push(
      `| Sensitivity check (death rate forward correlation) | ${study.overdoseRateSensitivity.forwardPearson.toFixed(3)} |`,
    );
  }
  lines.push("");
  lines.push("## Spending Bins (Observed Data)");
  lines.push("");
  lines.push("| Spending Bin (USD/person) | Observations | Mean Overdose Deaths | Median Overdose Deaths |");
  lines.push("|---------------------------|-------------:|---------------------:|-----------------------:|");
  for (const row of study.binRows) {
    lines.push(
      `| ${row.label} | ${row.observations} | ${row.outcomeMean == null ? "N/A" : formatCompactNumber(row.outcomeMean, 0)} | ${row.outcomeMedian == null ? "N/A" : formatCompactNumber(row.outcomeMedian, 0)} |`,
    );
  }
  lines.push("");
  lines.push("## Lag Sensitivity");
  lines.push("");
  lines.push("| Lag | Duration | Score | Pairs | Forward r | Predictive r | Significance |");
  lines.push("|----:|---------:|------:|------:|----------:|-------------:|-------------:|");
  for (const profile of study.temporalProfiles) {
    lines.push(
      `| ${profile.lagYears} | ${profile.durationYears} | ${profile.score.toFixed(3)} | ${profile.totalPairs} | ${profile.forwardPearson.toFixed(3)} | ${profile.predictivePearson.toFixed(3)} | ${profile.statisticalSignificance.toFixed(3)} |`,
    );
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  for (const note of study.notes) {
    lines.push(`- ${note}`);
  }
  lines.push("- Positive forward correlation means higher spending precedes higher overdose deaths (worse).");
  lines.push("");
  return lines.join("\n");
}

export function writeDrugWarOverdoseStudyFiles(
  study: DrugWarOverdoseStudy,
  outputDir: string = DEFAULT_OUTPUT_DIR,
): { markdownPath: string; jsonPath: string } {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, "drug-war-overdose-study.md");
  const jsonPath = path.join(outputDir, "drug-war-overdose-study.json");
  fs.writeFileSync(markdownPath, `${renderDrugWarOverdoseMarkdown(study)}\n`, "utf8");
  fs.writeFileSync(jsonPath, `${JSON.stringify(study, null, 2)}\n`, "utf8");
  return { markdownPath, jsonPath };
}
