import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadAggregatedNOf1DrugEnforcementPanel,
  type AggregatedNOf1DrugEnforcementRow,
} from "@optimitron/data";
import {
  alignTimeSeries,
  buildAdaptiveNumericBins,
  deriveSupportConstrainedTargets,
  estimateDiminishingReturns,
  estimateMinimumEffectiveDose,
  runVariableRelationshipAnalysis,
  type AlignedPair,
  type AnalysisConfig,
  type NOf1VariableRelationshipInput,
  type TimeSeries,
} from "@optimitron/optimizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(__dirname, "../../output");
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export type AggregatedOutcomeSource = "oecd_accidental_poisoning" | "wb_unintentional_poisoning";
export type AggregatedDrugEnforcementPredictorSource =
  | "estimated_drug_trafficking_enforcement"
  | "estimated_drug_law_enforcement";

export interface AggregatedDrugWarTemporalProfile {
  lagYears: number;
  durationYears: number;
  score: number;
  totalPairs: number;
  includedSubjects: number;
  skippedSubjects: number;
  forwardPearson: number;
  predictivePearson: number;
  statisticalSignificance: number;
}

export interface AggregatedDrugWarBinRow {
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

export interface AggregatedDrugWarProxyStudy {
  generatedAt: string;
  yearRange: { startYear: number; endYear: number };
  outcomeSource: AggregatedOutcomeSource;
  predictorSource: AggregatedDrugEnforcementPredictorSource;
  subjectCount: number;
  includedSubjects: number;
  skippedSubjects: number;
  predictorLabel: string;
  predictorUnit: string;
  outcomeLabel: string;
  outcomeUnit: string;
  bestTemporalProfile: AggregatedDrugWarTemporalProfile;
  temporalProfiles: AggregatedDrugWarTemporalProfile[];
  pairCount: number;
  forwardPearson: number;
  predictivePearson: number;
  statisticalSignificance: number;
  suggestedSpendingPerCapitaPpp: number | null;
  minimumEffectiveDosePerCapitaPpp: number | null;
  firstDetectedChangeDosePerCapitaPpp: number | null;
  diminishingReturnsKneePerCapitaPpp: number | null;
  bestObservedBin: AggregatedDrugWarBinRow | null;
  binRows: AggregatedDrugWarBinRow[];
  notes: string[];
}

export interface RunAggregatedDrugWarProxyStudyOptions {
  rows?: AggregatedNOf1DrugEnforcementRow[];
  outcomeSource?: AggregatedOutcomeSource;
  predictorSource?: AggregatedDrugEnforcementPredictorSource;
  lagYears?: number[];
  durationYears?: number[];
  minimumPairs?: number;
  minimumYearsPerSubject?: number;
}

function finiteOrZero(value: number | null | undefined): number {
  return value != null && Number.isFinite(value) ? value : 0;
}

function toTimestamp(year: number): string {
  return `${year}-01-01T00:00:00.000Z`;
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

function formatPerCapitaPpp(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "N/A";
  return `$${formatCompactNumber(value)} PPP/person`;
}

function formatBinLabel(lowerBound: number, upperBound: number, isUpperInclusive: boolean): string {
  const lower = formatCompactNumber(lowerBound);
  const upper = formatCompactNumber(upperBound);
  return isUpperInclusive ? `[${lower}, ${upper}]` : `[${lower}, ${upper})`;
}

function describeDirection(predictivePearson: number): string {
  if (predictivePearson <= -0.3) {
    return "Higher spending is often followed by lower poisoning death rates";
  }
  if (predictivePearson <= -0.1) {
    return "Higher spending is somewhat followed by lower poisoning death rates";
  }
  if (predictivePearson < 0.1) {
    return "There is no strong pattern either way";
  }
  if (predictivePearson < 0.3) {
    return "Higher spending is somewhat followed by higher poisoning death rates";
  }
  return "Higher spending is often followed by higher poisoning death rates";
}

function describeConfidence(significance: number, pairCount: number, includedSubjects: number): string {
  if (significance >= 0.7 && pairCount >= 180 && includedSubjects >= 20) {
    return "higher confidence";
  }
  if (significance >= 0.55 && pairCount >= 100 && includedSubjects >= 12) {
    return "medium confidence";
  }
  return "low confidence";
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
  includedSubjects: number,
): number {
  const pairSupport = Math.min(1, Math.max(0, totalPairs) / 600);
  const subjectSupport = Math.min(1, Math.max(0, includedSubjects) / 30);
  return (
    Math.abs(predictivePearson) * 0.4 +
    statisticalSignificance * 0.35 +
    pairSupport * 0.15 +
    subjectSupport * 0.1
  );
}

function outcomeValueFromRow(
  row: AggregatedNOf1DrugEnforcementRow,
  outcomeSource: AggregatedOutcomeSource,
): number | null {
  return outcomeSource === "oecd_accidental_poisoning"
    ? row.oecdAccidentalPoisoningDeathsPer100k
    : row.wbUnintentionalPoisoningDeathsPer100k;
}

function predictorValueFromRow(
  row: AggregatedNOf1DrugEnforcementRow,
  predictorSource: AggregatedDrugEnforcementPredictorSource,
): number | null {
  if (predictorSource === "estimated_drug_law_enforcement") {
    return row.estimatedDrugLawEnforcementSpendingPerCapitaPpp;
  }
  return row.estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp;
}

export function buildAggregatedDrugWarProxySubjects(
  rows: AggregatedNOf1DrugEnforcementRow[],
  outcomeSource: AggregatedOutcomeSource,
  predictorSource: AggregatedDrugEnforcementPredictorSource,
  minimumYearsPerSubject = 4,
): NOf1VariableRelationshipInput[] {
  const bySubject = new Map<string, { predictorByYear: Map<number, number>; outcomeByYear: Map<number, number> }>();

  for (const row of rows) {
    const predictor = predictorValueFromRow(row, predictorSource);
    const outcome = outcomeValueFromRow(row, outcomeSource);
    if (predictor == null || !Number.isFinite(predictor)) continue;
    if (outcome == null || !Number.isFinite(outcome)) continue;
    if (!bySubject.has(row.iso3)) {
      bySubject.set(row.iso3, { predictorByYear: new Map(), outcomeByYear: new Map() });
    }
    const acc = bySubject.get(row.iso3)!;
    acc.predictorByYear.set(row.year, predictor);
    acc.outcomeByYear.set(row.year, outcome);
  }

  const subjects: NOf1VariableRelationshipInput[] = [];
  for (const [iso3, acc] of bySubject) {
    const predictorMeasurements = [...acc.predictorByYear.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([year, value]) => ({ timestamp: toTimestamp(year), value, unit: "PPP USD/person" }));
    const outcomeMeasurements = [...acc.outcomeByYear.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([year, value]) => ({ timestamp: toTimestamp(year), value, unit: "deaths per 100k" }));
    if (predictorMeasurements.length < minimumYearsPerSubject) continue;
    if (outcomeMeasurements.length < minimumYearsPerSubject) continue;

    const predictor: TimeSeries = {
      variableId: `${iso3}:predictor.estimated_drug_enforcement_spending_per_capita_ppp`,
      name: `${iso3} — Estimated Drug Enforcement Spending Per Capita (PPP)`,
      category: "fiscal",
      measurements: predictorMeasurements,
    };
    const outcome: TimeSeries = {
      variableId: `${iso3}:outcome.accidental_poisoning_deaths_per_100k`,
      name: `${iso3} — Accidental Poisoning Deaths Per 100k`,
      category: "health",
      measurements: outcomeMeasurements,
    };
    subjects.push({ subjectId: iso3, predictor, outcome });
  }

  return subjects;
}

function buildRawPairsForSubjects(
  subjects: NOf1VariableRelationshipInput[],
  includedSubjectIds: Set<string>,
  lagYears: number,
  durationYears: number,
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  for (const subject of subjects) {
    if (!includedSubjectIds.has(subject.subjectId)) continue;
    pairs.push(
      ...alignTimeSeries(subject.predictor, subject.outcome, {
        onsetDelaySeconds: lagYears * SECONDS_PER_YEAR,
        durationOfActionSeconds: durationYears * SECONDS_PER_YEAR,
        fillingType: "interpolation",
      }),
    );
  }
  return pairs;
}

export function runAggregatedDrugWarProxyStudy(
  options: RunAggregatedDrugWarProxyStudyOptions = {},
): AggregatedDrugWarProxyStudy {
  const rows = options.rows ?? loadAggregatedNOf1DrugEnforcementPanel();
  const outcomeSource = options.outcomeSource ?? "oecd_accidental_poisoning";
  const predictorSource =
    options.predictorSource ?? "estimated_drug_trafficking_enforcement";
  const minimumPairs = options.minimumPairs ?? 3;
  const subjects = buildAggregatedDrugWarProxySubjects(
    rows,
    outcomeSource,
    predictorSource,
    options.minimumYearsPerSubject ?? 4,
  );
  if (subjects.length < 2) {
    throw new Error(
      "Not enough jurisdiction series for estimated drug-enforcement predictor panel.",
    );
  }

  const lagYears = options.lagYears ?? [0, 1, 2, 3, 4, 5];
  const durationYears = options.durationYears ?? [1, 2, 3];
  const temporalProfiles: AggregatedDrugWarTemporalProfile[] = [];
  for (const lag of lagYears) {
    for (const duration of durationYears) {
      const runner = runVariableRelationshipAnalysis({
        subjects,
        minimumPairs,
        analysisConfig: toTemporalAnalysisConfig(lag, duration),
        onSubjectError: "skip",
      });
      if (runner.subjectResults.length === 0) continue;
      const aggregate = runner.aggregateVariableRelationship;
      const totalPairs = Math.max(0, aggregate.totalPairs ?? 0);
      const includedSubjects = runner.subjectResults.length;
      const predictivePearson = finiteOrZero(aggregate.aggregatePredictivePearson);
      const statisticalSignificance = Math.max(
        0,
        Math.min(1, finiteOrZero(aggregate.aggregateStatisticalSignificance)),
      );
      temporalProfiles.push({
        lagYears: lag,
        durationYears: duration,
        score: scoreTemporalProfile(
          predictivePearson,
          statisticalSignificance,
          totalPairs,
          includedSubjects,
        ),
        totalPairs,
        includedSubjects,
        skippedSubjects: runner.skippedSubjects.length,
        forwardPearson: finiteOrZero(aggregate.aggregateForwardPearson),
        predictivePearson,
        statisticalSignificance,
      });
    }
  }
  temporalProfiles.sort((left, right) => right.score - left.score);
  const bestTemporalProfile = temporalProfiles[0];
  if (!bestTemporalProfile) {
    throw new Error("No usable temporal profile found for estimated drug-enforcement panel.");
  }

  const bestRunner = runVariableRelationshipAnalysis({
    subjects,
    minimumPairs,
    analysisConfig: toTemporalAnalysisConfig(
      bestTemporalProfile.lagYears,
      bestTemporalProfile.durationYears,
    ),
    onSubjectError: "skip",
  });
  const aggregate = bestRunner.aggregateVariableRelationship;
  const includedSubjectIds = new Set(bestRunner.subjectResults.map((result) => result.subjectId));
  const alignedPairs = buildRawPairsForSubjects(
    subjects,
    includedSubjectIds,
    bestTemporalProfile.lagYears,
    bestTemporalProfile.durationYears,
  );
  const predictorValues = alignedPairs.map((pair) => pair.predictorValue);
  const outcomeValues = alignedPairs.map((pair) => pair.outcomeValue);

  const bins = buildAdaptiveNumericBins(predictorValues, { targetBinCount: 10, minBinSize: 12 });
  const binRows: AggregatedDrugWarBinRow[] = bins.map((bin) => {
    const inBin = alignedPairs.filter((pair) => {
      if (pair.predictorValue < bin.lowerBound) return false;
      if (bin.isUpperInclusive) return pair.predictorValue <= bin.upperBound;
      return pair.predictorValue < bin.upperBound;
    });
    const x = inBin.map((pair) => pair.predictorValue);
    const y = inBin.map((pair) => pair.outcomeValue);
    return {
      label: formatBinLabel(bin.lowerBound, bin.upperBound, bin.isUpperInclusive),
      lowerBound: bin.lowerBound,
      upperBound: bin.upperBound,
      isUpperInclusive: bin.isUpperInclusive,
      observations: inBin.length,
      predictorMean: mean(x),
      predictorMedian: median(x),
      outcomeMean: mean(y),
      outcomeMedian: median(y),
    };
  });
  const bestObservedBin =
    [...binRows]
      .filter((row) => row.outcomeMean != null)
      .sort(
        (left, right) =>
          (left.outcomeMean ?? Number.POSITIVE_INFINITY) -
          (right.outcomeMean ?? Number.POSITIVE_INFINITY),
      )[0] ?? null;

  const modelOptimal = finiteOrZero(aggregate.aggregateOptimalDailyValue);
  const supportTargets = deriveSupportConstrainedTargets(predictorValues, outcomeValues, {
    objective: "minimize_outcome",
    modelOptimalValue: modelOptimal,
    minSamples: 24,
    targetBinCount: 10,
    minBinSize: 12,
  });
  const minimumBeneficialDose = estimateMinimumEffectiveDose(predictorValues, outcomeValues, {
    minSamples: 24,
    targetBinCount: 10,
    minBinSize: 12,
    objective: "minimize_outcome",
    minConsecutiveBins: 2,
    minRelativeGainPercent: 3,
    minZScore: 0.25,
  });
  const firstDetectedChangeDose = estimateMinimumEffectiveDose(predictorValues, outcomeValues, {
    minSamples: 24,
    targetBinCount: 10,
    minBinSize: 12,
    objective: "any_change",
    minConsecutiveBins: 2,
    minRelativeGainPercent: 3,
    minZScore: 0.25,
  });
  const diminishingReturns = estimateDiminishingReturns(
    predictorValues,
    outcomeValues.map((value) => -value),
    {
      minSamples: 24,
      targetBinCount: 10,
      minBinSize: 12,
      minSlopePointsPerSegment: 1,
      maxPostToPreSlopeRatio: 0.7,
    },
  );

  const yearRange = {
    startYear: rows.reduce((min, row) => Math.min(min, row.year), Number.POSITIVE_INFINITY),
    endYear: rows.reduce((max, row) => Math.max(max, row.year), Number.NEGATIVE_INFINITY),
  };
  const notes = [
    "This is aggregated N-of-1 analysis across jurisdictions (countries treated as subjects).",
    `Predictor source: ${
      predictorSource === "estimated_drug_law_enforcement"
        ? "estimated drug-law enforcement spending (GF03 PPP per-capita weighted by UNODC drug-law arrest share)."
        : "estimated drug-trafficking enforcement spending (GF03 PPP per-capita weighted by UNODC drug-trafficking arrest share)."
    }`,
    `Outcome source: ${outcomeSource === "oecd_accidental_poisoning" ? "OECD accidental poisoning mortality (CICDPOSN)" : "World Bank unintentional poisoning mortality (SH.STA.POIS.P5)"}.`,
    "Decision target is constrained to observed support, not unconstrained extrapolation.",
    "Estimated predictor should be interpreted as a budget-allocation proxy, not direct audited drug-enforcement ledger totals.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    yearRange: {
      startYear: Number.isFinite(yearRange.startYear) ? yearRange.startYear : 0,
      endYear: Number.isFinite(yearRange.endYear) ? yearRange.endYear : 0,
    },
    outcomeSource,
    predictorSource,
    subjectCount: subjects.length,
    includedSubjects: bestRunner.subjectResults.length,
    skippedSubjects: bestRunner.skippedSubjects.length,
    predictorLabel: "Estimated Drug Enforcement Spending Per Capita (PPP)",
    predictorUnit: "PPP USD/person",
    outcomeLabel: "Accidental/Unintentional Poisoning Death Rate",
    outcomeUnit: "deaths per 100k",
    bestTemporalProfile,
    temporalProfiles,
    pairCount: alignedPairs.length,
    forwardPearson: finiteOrZero(aggregate.aggregateForwardPearson),
    predictivePearson: finiteOrZero(aggregate.aggregatePredictivePearson),
    statisticalSignificance: Math.max(
      0,
      Math.min(1, finiteOrZero(aggregate.aggregateStatisticalSignificance)),
    ),
    suggestedSpendingPerCapitaPpp:
      supportTargets.supportConstrainedOptimalValue ?? supportTargets.robustOptimalValue,
    minimumEffectiveDosePerCapitaPpp: minimumBeneficialDose.minimumEffectiveDose,
    firstDetectedChangeDosePerCapitaPpp: firstDetectedChangeDose.minimumEffectiveDose,
    diminishingReturnsKneePerCapitaPpp: diminishingReturns.kneePredictorValue,
    bestObservedBin,
    binRows,
    notes,
  };
}

export function renderAggregatedDrugWarProxyMarkdown(study: AggregatedDrugWarProxyStudy): string {
  const lines: string[] = [];
  const directionPlain = describeDirection(study.predictivePearson);
  const confidencePlain = describeConfidence(
    study.statisticalSignificance,
    study.pairCount,
    study.includedSubjects,
  );
  lines.push("# Aggregated N-of-1: Estimated Drug Enforcement Spending vs Poisoning Deaths");
  lines.push("");
  lines.push(`- Time range: ${study.yearRange.startYear}-${study.yearRange.endYear}`);
  lines.push(`- Jurisdictions included: ${study.includedSubjects}/${study.subjectCount}`);
  lines.push(`- Outcome source: ${study.outcomeSource}`);
  lines.push(`- Predictor source: ${study.predictorSource}`);
  lines.push("");
  lines.push("## ELI5 Summary");
  lines.push("");
  lines.push(
    `Think of each country like one big real-world experiment. In this dataset, **${directionPlain.toLowerCase()}**.`,
  );
  lines.push(
    `The best data-backed spending level here is **${formatPerCapitaPpp(study.suggestedSpendingPerCapitaPpp)}**.`,
  );
  lines.push(`Overall certainty for this signal: **${confidencePlain}**.`);
  lines.push("");
  lines.push("### What These Numbers Mean");
  lines.push("");
  lines.push("| Report Number | ELI5 Meaning |");
  lines.push("|---------------|--------------|");
  lines.push("| Suggested level | Best target inside the range we actually observed in the data. |");
  lines.push("| Minimum effective level | Lowest level where we can see a reliable improvement signal. |");
  lines.push("| First detected change level | Lowest level where outcomes start changing at all (good or bad). |");
  lines.push("| Slowdown knee | Point where extra spending starts helping much less per extra dollar. |");
  lines.push("| Best observed spending bin | Spending range with the lowest average death rate in raw grouped data. |");
  lines.push("");
  lines.push("## Topline");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Selected lag | ${study.bestTemporalProfile.lagYears} year(s) |`);
  lines.push(`| Effect window | ${study.bestTemporalProfile.durationYears} year(s) |`);
  lines.push(`| Aligned observations | ${study.pairCount} |`);
  lines.push(`| Forward correlation | ${study.forwardPearson.toFixed(3)} |`);
  lines.push(`| Predictive direction score | ${study.predictivePearson.toFixed(3)} |`);
  lines.push(`| Significance score | ${study.statisticalSignificance.toFixed(3)} |`);
  lines.push(`| Suggested level | ${formatPerCapitaPpp(study.suggestedSpendingPerCapitaPpp)} |`);
  lines.push(`| Minimum effective level | ${formatPerCapitaPpp(study.minimumEffectiveDosePerCapitaPpp)} |`);
  lines.push(`| First detected change level | ${formatPerCapitaPpp(study.firstDetectedChangeDosePerCapitaPpp)} |`);
  lines.push(`| Slowdown knee | ${formatPerCapitaPpp(study.diminishingReturnsKneePerCapitaPpp)} |`);
  lines.push(
    `| Best observed spending bin | ${
      study.bestObservedBin
        ? `${study.bestObservedBin.label} (mean deaths ${formatCompactNumber(study.bestObservedBin.outcomeMean ?? NaN, 2)})`
        : "N/A"
    } |`,
  );
  lines.push("");
  lines.push("## Spending Bins");
  lines.push("");
  lines.push("| Spending Bin (PPP USD/person) | Observations | Mean Death Rate | Median Death Rate |");
  lines.push("|-------------------------------|-------------:|----------------:|------------------:|");
  for (const row of study.binRows) {
    lines.push(
      `| ${row.label} | ${row.observations} | ${row.outcomeMean == null ? "N/A" : formatCompactNumber(row.outcomeMean, 2)} | ${row.outcomeMedian == null ? "N/A" : formatCompactNumber(row.outcomeMedian, 2)} |`,
    );
  }
  lines.push("");
  lines.push("## Lag Sensitivity");
  lines.push("");
  lines.push("| Lag | Duration | Score | Subjects | Pairs | Forward r | Predictive r | Significance |");
  lines.push("|----:|---------:|------:|---------:|------:|----------:|-------------:|-------------:|");
  for (const profile of study.temporalProfiles) {
    lines.push(
      `| ${profile.lagYears} | ${profile.durationYears} | ${profile.score.toFixed(3)} | ${profile.includedSubjects} | ${profile.totalPairs} | ${profile.forwardPearson.toFixed(3)} | ${profile.predictivePearson.toFixed(3)} | ${profile.statisticalSignificance.toFixed(3)} |`,
    );
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  for (const note of study.notes) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function writeAggregatedDrugWarProxyStudyFiles(
  study: AggregatedDrugWarProxyStudy,
  outputDir: string = DEFAULT_OUTPUT_DIR,
  fileStem = "drug-enforcement-aggregated-study",
): { markdownPath: string; jsonPath: string } {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, `${fileStem}.md`);
  const jsonPath = path.join(outputDir, `${fileStem}.json`);
  fs.writeFileSync(markdownPath, `${renderAggregatedDrugWarProxyMarkdown(study)}\n`, "utf8");
  fs.writeFileSync(jsonPath, `${JSON.stringify(study, null, 2)}\n`, "utf8");
  return { markdownPath, jsonPath };
}
