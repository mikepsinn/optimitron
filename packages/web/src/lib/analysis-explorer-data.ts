import {
  buildAdaptiveNumericBins,
  buildOutcomeMegaStudies,
  buildPairStudyId,
  validatePairStudyResult,
  type AggregateVariableRelationship,
  type OutcomeMegaStudyRanking,
  type OutcomeRankingCandidate,
  type PairStudyResult,
} from "@optimitron/optimizer";

import governmentSizeRaw from "../data/us-government-size-analysis.json";
import optimalBudgetRaw from "../data/optimal-budget.json";
import type {
  EvidenceGrade,
  ExplorerFreshness,
  ExplorerOutcome,
  ExplorerPrecomputeIndex,
  ExplorerPairSummary,
  ExplorerPredictor,
  ExplorerSource,
  ExplorerSourceFingerprint,
  ExplorerSubjectDrilldown,
  ExplorerSubjectSummary,
} from "./analysis-explorer-types";
import { buildSubjectDrilldowns } from "./analysis-explorer-subjects";
import { clamp01, finiteOrNull } from "./numeric-utils";

interface GovernmentSizeTier {
  tier: string;
  minPctGdp: number | null;
  maxPctGdp: number | null;
  observations: number;
  jurisdictions: number;
  typicalHealthyLifeYears: number | null;
  typicalHealthyLifeYearsGrowthPerYear: number | null;
  typicalRealAfterTaxMedianIncomeLevel: number | null;
  typicalRealAfterTaxMedianIncomeGrowthPct: number | null;
  lowSampleWarning: string | null;
}

interface GovernmentSizePerCapitaTier {
  tier: string;
  minSpendingPerCapitaPpp: number | null;
  maxSpendingPerCapitaPpp: number | null;
  observations: number;
  jurisdictions: number;
  typicalHealthyLifeYears: number | null;
  typicalHealthyLifeYearsGrowthPerYear: number | null;
  typicalRealAfterTaxMedianIncomeLevel: number | null;
  typicalRealAfterTaxMedianIncomeGrowthPct: number | null;
  lowSampleWarning: string | null;
}

interface GovernmentOutcomeJurisdiction {
  jurisdictionId: string;
  jurisdictionName: string;
  optimalPctGdp: number;
  forwardPearson: number;
  predictivePearson: number;
  percentChangeFromBaseline: number;
  bradfordHillStrength: number;
  numberOfPairs: number;
}

interface GovernmentOutcome {
  id: string;
  name: string;
  direction: "higher_better" | "lower_better";
  meanForwardPearson: number;
  meanPercentChange: number;
  positiveCount: number;
  negativeCount: number;
  jurisdictionsAnalyzed: number;
  jurisdictionsSkipped: number;
  medianOptimalPctGdp: number;
  p25OptimalPctGdp: number;
  p75OptimalPctGdp: number;
  confidenceScore: number;
  confidenceGrade: EvidenceGrade;
  jurisdictions: GovernmentOutcomeJurisdiction[];
}

interface GovernmentSizeData {
  predictor: {
    id: string;
    name: string;
    coverage: {
      observations: number;
      yearMin: number;
      yearMax: number;
    };
  };
  outcomes: GovernmentOutcome[];
  spendingLevelTable: {
    healthyLifeYearsMetric: {
      isDirectMetric: boolean;
      metricUsed: string;
    };
    incomeGrowthMetric: {
      isDirectMetric: boolean;
      metricUsed: string;
    };
    binning: {
      method: string;
      targetBinCount: number;
      minBinSize: number;
      anchors: number[];
      roundTo: number;
      binsGenerated: number;
    };
    tiers: GovernmentSizeTier[];
  };
  spendingPerCapitaLevelTable: {
    definition: string;
    binning: {
      method: string;
      targetBinCount: number;
      minBinSize: number;
      anchors: number[];
      roundTo: number;
      binsGenerated: number;
    };
    tiers: GovernmentSizePerCapitaTier[];
  };
  generatedAt: string;
}

interface OptimalBudgetAnalysis {
  dateRange?: {
    start?: string;
    end?: string;
  };
  numberOfPairs?: number;
  forwardPearson?: number;
  reversePearson?: number;
  predictivePearson?: number;
  pValue?: number;
  baselineFollowup?: {
    outcomeFollowUpPercentChangeFromBaseline?: number;
  };
  optimalValues?: {
    valuePredictingHighOutcome?: number;
    valuePredictingLowOutcome?: number;
    optimalDailyValue?: number;
  };
  pis?: {
    score?: number;
    evidenceGrade?: EvidenceGrade;
  };
  dataQuality?: {
    isValid?: boolean;
  };
}

interface OptimalBudgetCountryResult {
  jurisdictionId: string;
  jurisdictionName: string;
  analysis?: OptimalBudgetAnalysis;
}

interface OptimalBudgetCategory {
  id: string;
  name: string;
  meanPercentChange: number;
  countriesPositive: number;
  countriesAnalyzed: number;
  meanForwardPearson: number;
  outcomeDescription: string;
  countryResults: OptimalBudgetCountryResult[];
}

interface OptimalBudgetData {
  analyzedAt: string;
  categories: OptimalBudgetCategory[];
}

interface ExplorerPairRecord {
  summary: ExplorerPairSummary;
  pairStudy: PairStudyResult;
  subjects: ExplorerSubjectSummary[];
  subjectDrilldowns: ExplorerSubjectDrilldown[];
}

interface ExplorerCatalog {
  sourceHash: string;
  freshness: ExplorerFreshness;
  precomputeIndex: ExplorerPrecomputeIndex;
  outcomes: ExplorerOutcome[];
  predictors: ExplorerPredictor[];
  pairSummaries: ExplorerPairSummary[];
  rankingsByOutcome: Map<string, OutcomeMegaStudyRanking>;
  pairsByKey: Map<string, ExplorerPairRecord>;
}

const GOVERNMENT_SIZE_SOURCE_ID = "us_government_size";
const OPTIMAL_BUDGET_SOURCE_ID = "us_optimal_budget";
const DEFAULT_OUTCOME_DIRECTION: ExplorerOutcome["direction"] = "higher_better";

const governmentSizeData = governmentSizeRaw as GovernmentSizeData;
const optimalBudgetData = optimalBudgetRaw as OptimalBudgetData;

let cachedCatalog: ExplorerCatalog | null = null;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function toId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "unknown"
  );
}

function toLookupKey(outcomeId: string, predictorId: string): string {
  return `${toId(outcomeId)}::${toId(predictorId)}`;
}

function finiteValues(values: Array<number | null | undefined>): number[] {
  return values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
}

function average(values: Array<number | null | undefined>): number {
  const filtered = finiteValues(values);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function quantile(values: Array<number | null | undefined>, q: number): number | null {
  const filtered = finiteValues(values).sort((a, b) => a - b);
  if (filtered.length === 0) return null;
  const idx = (filtered.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return filtered[lo] ?? null;
  const loVal = filtered[lo] ?? 0;
  const hiVal = filtered[hi] ?? 0;
  return loVal + (hiVal - loVal) * (idx - lo);
}

function median(values: Array<number | null | undefined>): number | null {
  return quantile(values, 0.5);
}

function inferEvidenceGrade(confidence: number): EvidenceGrade {
  if (confidence >= 0.85) return "A";
  if (confidence >= 0.7) return "B";
  if (confidence >= 0.55) return "C";
  if (confidence >= 0.4) return "D";
  return "F";
}

function inferDirection(value: number): "positive" | "negative" | "neutral" {
  if (value > 0.02) return "positive";
  if (value < -0.02) return "negative";
  return "neutral";
}

function parseYear(value: string | undefined): number | null {
  if (!value) return null;
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function countGovernmentSizeRecords(data: GovernmentSizeData): number {
  const jurisdictionRows = data.outcomes.reduce(
    (sum, outcome) => sum + outcome.jurisdictions.length,
    0,
  );
  const tierRows =
    data.spendingLevelTable.tiers.length + data.spendingPerCapitaLevelTable.tiers.length;
  return jurisdictionRows + tierRows;
}

function countOptimalBudgetRecords(data: OptimalBudgetData): number {
  return data.categories.reduce((sum, category) => sum + category.countryResults.length, 0);
}

function deriveSourceHash(): string {
  const snapshot = JSON.stringify({
    governmentSize: {
      generatedAt: governmentSizeData.generatedAt,
      outcomes: governmentSizeData.outcomes.length,
      records: countGovernmentSizeRecords(governmentSizeData),
    },
    optimalBudget: {
      analyzedAt: optimalBudgetData.analyzedAt,
      categories: optimalBudgetData.categories.length,
      records: countOptimalBudgetRecords(optimalBudgetData),
    },
  });
  return stableHash(snapshot);
}

function outcomeUnitForGovernmentOutcome(outcomeId: string): string {
  switch (outcomeId) {
    case "life_expectancy":
      return "years";
    case "gdp_per_capita":
      return "PPP intl-$ per person";
    case "infant_mortality":
      return "per 1,000 live births";
    case "inequality":
      return "gini index points";
    default:
      return "index";
  }
}

function splitOutcomeLabelAndUnit(label: string): { label: string; unit: string } {
  const match = label.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) {
    return { label: label.trim(), unit: "index" };
  }
  return {
    label: match[1]?.trim() || label,
    unit: match[2]?.trim() || "index",
  };
}
function buildGovernmentSizePair(outcome: GovernmentOutcome): {
  pair: ExplorerPairRecord;
  candidate: OutcomeRankingCandidate;
  outcomeDefinition: ExplorerOutcome;
  predictorDefinition: ExplorerPredictor;
} {
  const predictorId = toId(governmentSizeData.predictor.id);
  const predictorLabel = governmentSizeData.predictor.name;
  const outcomeId = toId(outcome.id);
  const outcomeLabel = outcome.name;
  const outcomeUnit = outcomeUnitForGovernmentOutcome(outcome.id);

  const subjects: ExplorerSubjectSummary[] = outcome.jurisdictions.map(subject => ({
    subjectId: toId(subject.jurisdictionId),
    subjectName: subject.jurisdictionName,
    optimalPredictorValue: finiteOrNull(subject.optimalPctGdp),
    forwardPearson: finiteOrNull(subject.forwardPearson),
    predictivePearson: finiteOrNull(subject.predictivePearson),
    percentChangeFromBaseline: finiteOrNull(subject.percentChangeFromBaseline),
    numberOfPairs: Math.max(0, Math.round(subject.numberOfPairs || 0)),
    evidenceGrade: inferEvidenceGrade(clamp01(subject.bradfordHillStrength || 0)),
  }));

  const totalPairs = subjects.reduce((sum, subject) => sum + subject.numberOfPairs, 0);
  const aggregatePredictive = average(subjects.map(subject => subject.predictivePearson));

  const aggregateVariableRelationship: AggregateVariableRelationship = {
    numberOfUnits: Math.max(0, outcome.jurisdictionsAnalyzed),
    aggregateForwardPearson: outcome.meanForwardPearson,
    aggregateReversePearson: average(subjects.map(subject => subject.forwardPearson)) - aggregatePredictive,
    aggregatePredictivePearson: aggregatePredictive,
    aggregateEffectSize: outcome.meanPercentChange,
    aggregateStatisticalSignificance: clamp01(outcome.confidenceScore),
    aggregateValuePredictingHighOutcome: finiteOrNull(outcome.medianOptimalPctGdp),
    aggregateValuePredictingLowOutcome: finiteOrNull(outcome.p25OptimalPctGdp),
    aggregateOptimalDailyValue: finiteOrNull(outcome.medianOptimalPctGdp),
    aggregateOutcomeFollowUpPercentChangeFromBaseline: finiteOrNull(outcome.meanPercentChange),
    weightedAveragePIS: clamp01(Math.abs(outcome.meanForwardPearson) * clamp01(outcome.confidenceScore)),
    totalPairs,
  };

  const coverage = governmentSizeData.predictor.coverage;

  const qualityFlags = [] as PairStudyResult["qualityFlags"];
  if (!governmentSizeData.spendingLevelTable.healthyLifeYearsMetric.isDirectMetric) {
    qualityFlags.push({
      severity: "info",
      code: "metric.proxy_healthy_life_years",
      message: `Healthy life years uses proxy: ${governmentSizeData.spendingLevelTable.healthyLifeYearsMetric.metricUsed}.`,
    });
  }
  if (!governmentSizeData.spendingLevelTable.incomeGrowthMetric.isDirectMetric) {
    qualityFlags.push({
      severity: "info",
      code: "metric.proxy_income_growth",
      message: `Real after-tax median income growth uses proxy: ${governmentSizeData.spendingLevelTable.incomeGrowthMetric.metricUsed}.`,
    });
  }

  if (outcome.jurisdictionsAnalyzed < 20) {
    qualityFlags.push({
      severity: "warning",
      code: "coverage.low_subject_count",
      message: `Only ${outcome.jurisdictionsAnalyzed} subjects available for this pair study.`,
    });
  }

  const pctRows = governmentSizeData.spendingLevelTable.tiers.map((tier, index, rows) => {
    const lowerBound = finiteOrNull(tier.minPctGdp) ?? 0;
    const upperBound = finiteOrNull(tier.maxPctGdp) ?? lowerBound;
    const rowFlags =
      [] as PairStudyResult["adaptiveBinTables"][number]["rows"][number]["qualityFlags"];
    if (tier.lowSampleWarning) {
      rowFlags.push({
        severity: "warning",
        code: "bin.low_sample",
        message: tier.lowSampleWarning,
      });
    }

    return {
      binIndex: index,
      label: tier.tier,
      lowerBound,
      upperBound,
      isUpperInclusive: index === rows.length - 1,
      observations: tier.observations,
      subjects: tier.jurisdictions,
      predictorMean: (lowerBound + upperBound) / 2,
      predictorMedian: (lowerBound + upperBound) / 2,
      metrics: {
        healthy_life_years_level: finiteOrNull(tier.typicalHealthyLifeYears),
        healthy_life_years_growth_per_year: finiteOrNull(tier.typicalHealthyLifeYearsGrowthPerYear),
        real_after_tax_median_income_level: finiteOrNull(tier.typicalRealAfterTaxMedianIncomeLevel),
        real_after_tax_median_income_growth_pct: finiteOrNull(tier.typicalRealAfterTaxMedianIncomeGrowthPct),
      },
      qualityFlags: rowFlags,
    };
  });

  const perCapitaRows = governmentSizeData.spendingPerCapitaLevelTable.tiers.map((tier, index, rows) => {
    const lowerBound = finiteOrNull(tier.minSpendingPerCapitaPpp) ?? 0;
    const upperBound = finiteOrNull(tier.maxSpendingPerCapitaPpp) ?? lowerBound;
    const rowFlags =
      [] as PairStudyResult["adaptiveBinTables"][number]["rows"][number]["qualityFlags"];
    if (tier.lowSampleWarning) {
      rowFlags.push({
        severity: "warning",
        code: "bin.low_sample",
        message: tier.lowSampleWarning,
      });
    }

    return {
      binIndex: index,
      label: tier.tier,
      lowerBound,
      upperBound,
      isUpperInclusive: index === rows.length - 1,
      observations: tier.observations,
      subjects: tier.jurisdictions,
      predictorMean: (lowerBound + upperBound) / 2,
      predictorMedian: (lowerBound + upperBound) / 2,
      metrics: {
        healthy_life_years_level: finiteOrNull(tier.typicalHealthyLifeYears),
        healthy_life_years_growth_per_year: finiteOrNull(tier.typicalHealthyLifeYearsGrowthPerYear),
        real_after_tax_median_income_level: finiteOrNull(tier.typicalRealAfterTaxMedianIncomeLevel),
        real_after_tax_median_income_growth_pct: finiteOrNull(tier.typicalRealAfterTaxMedianIncomeGrowthPct),
      },
      qualityFlags: rowFlags,
    };
  });

  const study = validatePairStudyResult({
    studyId: buildPairStudyId({ scope: "aggregate_n_of_1", predictorId, outcomeId }),
    generatedAt: governmentSizeData.generatedAt,
    scope: { scope: "aggregate_n_of_1" },
    predictor: {
      id: predictorId,
      label: predictorLabel,
      unit: "% GDP",
      transform: "level",
      lagYears: 1,
    },
    outcome: {
      id: outcomeId,
      label: outcomeLabel,
      unit: outcomeUnit,
      transform: "level",
      lagYears: 1,
    },
    analysis: {
      lagYearsEvaluated: [0, 1, 2, 3],
      predictorTransform: "level",
      outcomeTransform: "level",
      targetBinCount: governmentSizeData.spendingLevelTable.binning.targetBinCount,
      minBinSize: governmentSizeData.spendingLevelTable.binning.minBinSize,
      notes: [
        "Primary predictor is government spending as a share of GDP.",
        "Adaptive spending-per-capita table is included as a complementary confounding check.",
      ],
    },
    coverage: {
      observations: coverage.observations,
      alignedPairs: totalPairs,
      includedSubjects: outcome.jurisdictionsAnalyzed,
      skippedSubjects: outcome.jurisdictionsSkipped,
      yearMin: coverage.yearMin,
      yearMax: coverage.yearMax,
    },
    evidence: {
      evidenceGrade: outcome.confidenceGrade,
      direction: inferDirection(aggregatePredictive),
      predictorImpactScore: clamp01(Math.abs(aggregatePredictive) * clamp01(outcome.confidenceScore)),
      forwardPearson: outcome.meanForwardPearson,
      predictivePearson: aggregatePredictive,
      pValue: clamp01(1 - outcome.confidenceScore),
      adjustedPValue: clamp01(1 - outcome.confidenceScore),
      percentChangeFromBaseline: outcome.meanPercentChange,
      consistency: {
        positive: outcome.positiveCount,
        negative: outcome.negativeCount,
        neutral: 0,
      },
    },
    optimalValue: {
      objective: outcome.direction === "lower_better" ? "minimize_outcome" : "maximize_outcome",
      centralValue: outcome.medianOptimalPctGdp,
      lowerValue: outcome.p25OptimalPctGdp,
      upperValue: outcome.p75OptimalPctGdp,
      groupedValue: Math.round(outcome.medianOptimalPctGdp * 10) / 10,
      predictorUnit: "% GDP",
      supportObservations: totalPairs,
      supportSubjects: outcome.jurisdictionsAnalyzed,
      expectedOutcomeMetrics: {
        outcome_percent_change: outcome.meanPercentChange,
      },
      method: "evidence_weighted_jurisdiction_median",
    },
    adaptiveBinTables: [
      {
        tableId: "spending_pct_gdp",
        tableLabel: "Government Spending Share (% GDP)",
        predictorUnit: "% GDP",
        metricDefinitions: [
          { id: "healthy_life_years_level", label: "Typical Healthy Life Years (proxy)", unit: "years", direction: "higher_better" },
          { id: "healthy_life_years_growth_per_year", label: "Typical Healthy Life Years Growth (proxy)", unit: "years/year", direction: "higher_better" },
          { id: "real_after_tax_median_income_level", label: "Typical Real After-Tax Median Income (proxy)", unit: "PPP intl-$", direction: "higher_better" },
          { id: "real_after_tax_median_income_growth_pct", label: "Typical Real After-Tax Median Income Growth (proxy)", unit: "%", direction: "higher_better" },
        ],
        binning: governmentSizeData.spendingLevelTable.binning,
        rows: pctRows,
      },
      {
        tableId: "spending_per_capita_ppp",
        tableLabel: "Derived Spending Per-Capita (PPP)",
        predictorUnit: "PPP intl-$ per person",
        metricDefinitions: [
          { id: "healthy_life_years_level", label: "Typical Healthy Life Years (proxy)", unit: "years", direction: "higher_better" },
          { id: "healthy_life_years_growth_per_year", label: "Typical Healthy Life Years Growth (proxy)", unit: "years/year", direction: "higher_better" },
          { id: "real_after_tax_median_income_level", label: "Typical Real After-Tax Median Income (proxy)", unit: "PPP intl-$", direction: "higher_better" },
          { id: "real_after_tax_median_income_growth_pct", label: "Typical Real After-Tax Median Income Growth (proxy)", unit: "%", direction: "higher_better" },
        ],
        binning: governmentSizeData.spendingPerCapitaLevelTable.binning,
        rows: perCapitaRows,
      },
    ],
    qualityFlags,
    dataFlow: [
      {
        stepId: "raw_panel",
        label: "Raw panel observations",
        inputCount: coverage.observations,
        outputCount: coverage.observations,
        droppedCount: 0,
      },
      {
        stepId: "alignment",
        label: "Jurisdiction pair alignment",
        inputCount: Math.max(coverage.observations, totalPairs),
        outputCount: totalPairs,
        droppedCount: Math.max(0, Math.max(coverage.observations, totalPairs) - totalPairs),
      },
      {
        stepId: "subject_filter",
        label: "Subject inclusion filter",
        inputCount: outcome.jurisdictionsAnalyzed + outcome.jurisdictionsSkipped,
        outputCount: outcome.jurisdictionsAnalyzed,
        droppedCount: outcome.jurisdictionsSkipped,
      },
    ],
  });

  const summary: ExplorerPairSummary = {
    sourceId: GOVERNMENT_SIZE_SOURCE_ID,
    predictorId,
    predictorLabel,
    outcomeId,
    outcomeLabel,
    outcomeUnit,
    subjectCount: subjects.length,
    coverageYearMin: coverage.yearMin,
    coverageYearMax: coverage.yearMax,
    generatedAt: governmentSizeData.generatedAt,
  };

  return {
    pair: {
      summary,
      pairStudy: study,
      subjects,
      subjectDrilldowns: buildSubjectDrilldowns(study, subjects),
    },
    candidate: {
      outcomeId,
      predictorId,
      predictorLabel,
      pValue: clamp01(1 - outcome.confidenceScore),
      evidenceGrade: outcome.confidenceGrade,
      aggregateVariableRelationship,
    },
    outcomeDefinition: {
      id: outcomeId,
      label: outcomeLabel,
      unit: outcomeUnit,
      direction: outcome.direction,
    },
    predictorDefinition: {
      id: predictorId,
      label: predictorLabel,
      unit: "% GDP",
    },
  };
}
function buildOptimalBudgetPair(category: OptimalBudgetCategory): {
  pair: ExplorerPairRecord;
  candidate: OutcomeRankingCandidate;
  outcomeDefinition: ExplorerOutcome;
  predictorDefinition: ExplorerPredictor;
} | null {
  const predictorId = `budget_${toId(category.id)}`;
  const predictorLabel = `${category.name} Spending`;
  const { label: outcomeLabel, unit: outcomeUnit } = splitOutcomeLabelAndUnit(category.outcomeDescription);
  const outcomeId = toId(outcomeLabel);

  const subjects = category.countryResults
    .map(result => {
      const analysis = result.analysis;
      if (!analysis) return null;

      const optimal =
        finiteOrNull(analysis.optimalValues?.valuePredictingHighOutcome) ??
        finiteOrNull(analysis.optimalValues?.optimalDailyValue);
      const pValue = finiteOrNull(analysis.pValue);
      const forward = finiteOrNull(analysis.forwardPearson);
      const predictive = finiteOrNull(analysis.predictivePearson);
      const percentChange = finiteOrNull(analysis.baselineFollowup?.outcomeFollowUpPercentChangeFromBaseline);

      const confidence = clamp01(
        (analysis.dataQuality?.isValid ? 0.5 : 0.2) + Math.min(0.5, Math.abs(forward ?? 0) * 0.5),
      );
      const yearStart = parseYear(analysis.dateRange?.start);
      const yearEnd = parseYear(analysis.dateRange?.end);

      return {
        subject: {
          subjectId: toId(result.jurisdictionId),
          subjectName: result.jurisdictionName || result.jurisdictionId,
          optimalPredictorValue: optimal,
          forwardPearson: forward,
          predictivePearson: predictive,
          percentChangeFromBaseline: percentChange,
          numberOfPairs: Math.max(0, Math.round(analysis.numberOfPairs ?? 0)),
          evidenceGrade: analysis.pis?.evidenceGrade ?? inferEvidenceGrade(confidence),
        } satisfies ExplorerSubjectSummary,
        pValue,
        reversePearson: finiteOrNull(analysis.reversePearson),
        pisScore: finiteOrNull(analysis.pis?.score),
        yearStart,
        yearEnd,
        dataQualityValid: analysis.dataQuality?.isValid !== false,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (subjects.length === 0) {
    return null;
  }

  const summaries = subjects.map(row => row.subject);
  const totalPairs = summaries.reduce((sum, subject) => sum + subject.numberOfPairs, 0);
  const predictiveMean = average(summaries.map(subject => subject.predictivePearson));
  const forwardMean = average(summaries.map(subject => subject.forwardPearson));
  const reverseMean = average(subjects.map(subject => subject.reversePearson));
  const effectMean = average(summaries.map(subject => subject.percentChangeFromBaseline));
  const statisticalSignificance = clamp01(
    (category.countriesPositive / Math.max(1, category.countriesAnalyzed)) * 0.55 +
      Math.min(1, summaries.length / 150) * 0.45,
  );

  const aggregateVariableRelationship: AggregateVariableRelationship = {
    numberOfUnits: summaries.length,
    aggregateForwardPearson: Number.isFinite(forwardMean) ? forwardMean : category.meanForwardPearson,
    aggregateReversePearson: reverseMean,
    aggregatePredictivePearson: predictiveMean,
    aggregateEffectSize: Number.isFinite(effectMean) ? effectMean : category.meanPercentChange,
    aggregateStatisticalSignificance: statisticalSignificance,
    aggregateValuePredictingHighOutcome: median(summaries.map(subject => subject.optimalPredictorValue)),
    aggregateValuePredictingLowOutcome: quantile(summaries.map(subject => subject.optimalPredictorValue), 0.25),
    aggregateOptimalDailyValue: median(summaries.map(subject => subject.optimalPredictorValue)),
    aggregateOutcomeFollowUpPercentChangeFromBaseline: effectMean,
    weightedAveragePIS: clamp01(average(subjects.map(subject => subject.pisScore)) || Math.abs(predictiveMean)),
    totalPairs,
  };

  const yearMin = quantile(subjects.map(subject => subject.yearStart), 0);
  const yearMax = quantile(subjects.map(subject => subject.yearEnd), 1);

  const predictorValues = finiteValues(summaries.map(subject => subject.optimalPredictorValue));
  const targetBinCount = Math.min(10, Math.max(4, Math.round(Math.sqrt(summaries.length))));
  const minBinSize = Math.max(8, Math.floor(summaries.length / 10));
  const adaptiveBins = buildAdaptiveNumericBins(predictorValues, {
    targetBinCount,
    minBinSize,
    roundTo: 1,
  });

  const bins = adaptiveBins.length > 0
    ? adaptiveBins
    : [{
        lowerBound: predictorValues[0] ?? 0,
        upperBound: predictorValues[0] ?? 0,
        count: summaries.length,
        isUpperInclusive: true,
      }];

  const rows = bins.map((bin, index, allRows) => {
    const inBin = summaries.filter(subject => {
      const value = subject.optimalPredictorValue;
      if (!Number.isFinite(value)) return false;
      if (index === allRows.length - 1) return value! >= bin.lowerBound && value! <= bin.upperBound;
      return value! >= bin.lowerBound && value! < bin.upperBound;
    });

    const rowFlags =
      [] as PairStudyResult["adaptiveBinTables"][number]["rows"][number]["qualityFlags"];
    if (inBin.length < minBinSize) {
      rowFlags.push({
        severity: "warning",
        code: "bin.low_sample",
        message: `Bin has only ${inBin.length} subjects (target minimum ${minBinSize}).`,
      });
    }

    return {
      binIndex: index,
      label: `${bin.lowerBound.toFixed(1)} - ${bin.upperBound.toFixed(1)}`,
      lowerBound: bin.lowerBound,
      upperBound: bin.upperBound,
      isUpperInclusive: index === allRows.length - 1,
      observations: inBin.reduce((sum, subject) => sum + subject.numberOfPairs, 0),
      subjects: inBin.length,
      predictorMean: average(inBin.map(subject => subject.optimalPredictorValue)),
      predictorMedian: median(inBin.map(subject => subject.optimalPredictorValue)),
      metrics: {
        outcome_percent_change: median(inBin.map(subject => subject.percentChangeFromBaseline)),
        forward_pearson: median(inBin.map(subject => subject.forwardPearson)),
        predictive_pearson: median(inBin.map(subject => subject.predictivePearson)),
      },
      qualityFlags: rowFlags,
    };
  });

  const failedQualityCount = subjects.filter(subject => !subject.dataQualityValid).length;
  const qualityFlags = [] as PairStudyResult["qualityFlags"];
  if (failedQualityCount > 0) {
    qualityFlags.push({
      severity: "warning",
      code: "subject.quality_failures",
      message: `${failedQualityCount} subjects failed source data-quality checks.`,
    });
  }
  if (summaries.length < 30) {
    qualityFlags.push({
      severity: "warning",
      code: "coverage.low_subject_count",
      message: `Only ${summaries.length} subjects available for this pair study.`,
    });
  }

  const pairStudy = validatePairStudyResult({
    studyId: buildPairStudyId({ scope: "aggregate_n_of_1", predictorId, outcomeId }),
    generatedAt: optimalBudgetData.analyzedAt,
    scope: { scope: "aggregate_n_of_1" },
    predictor: {
      id: predictorId,
      label: predictorLabel,
      unit: "model spending units",
      transform: "level",
      lagYears: 1,
    },
    outcome: {
      id: outcomeId,
      label: outcomeLabel,
      unit: outcomeUnit,
      transform: "level",
      lagYears: 1,
    },
    analysis: {
      lagYearsEvaluated: [0, 1, 2, 3],
      predictorTransform: "level",
      outcomeTransform: "level",
      targetBinCount,
      minBinSize,
      notes: [
        "Built from cross-jurisdiction N-of-1 summaries.",
        "Bin rows summarize distributions of jurisdiction-level optimal predictor values.",
      ],
    },
    coverage: {
      observations: totalPairs,
      alignedPairs: totalPairs,
      includedSubjects: summaries.length,
      skippedSubjects: Math.max(0, category.countriesAnalyzed - summaries.length),
      yearMin: yearMin ?? undefined,
      yearMax: yearMax ?? undefined,
    },
    evidence: {
      evidenceGrade: inferEvidenceGrade(statisticalSignificance),
      direction: inferDirection(predictiveMean),
      predictorImpactScore: clamp01(Math.abs(predictiveMean) * statisticalSignificance),
      forwardPearson: Number.isFinite(forwardMean) ? forwardMean : category.meanForwardPearson,
      reversePearson: reverseMean,
      predictivePearson: predictiveMean,
      pValue: clamp01(average(subjects.map(subject => subject.pValue)) || (1 - statisticalSignificance)),
      adjustedPValue: clamp01(average(subjects.map(subject => subject.pValue)) || (1 - statisticalSignificance)),
      percentChangeFromBaseline: Number.isFinite(effectMean) ? effectMean : category.meanPercentChange,
      consistency: {
        positive: summaries.filter(subject => (subject.percentChangeFromBaseline ?? 0) > 0).length,
        negative: summaries.filter(subject => (subject.percentChangeFromBaseline ?? 0) < 0).length,
        neutral: summaries.filter(subject => (subject.percentChangeFromBaseline ?? 0) === 0).length,
      },
    },
    optimalValue: {
      objective: "maximize_outcome",
      centralValue: aggregateVariableRelationship.aggregateOptimalDailyValue ?? 0,
      lowerValue: aggregateVariableRelationship.aggregateValuePredictingLowOutcome ?? 0,
      upperValue: quantile(summaries.map(subject => subject.optimalPredictorValue), 0.75) ?? 0,
      groupedValue: aggregateVariableRelationship.aggregateOptimalDailyValue ?? undefined,
      predictorUnit: "model spending units",
      supportObservations: totalPairs,
      supportSubjects: summaries.length,
      expectedOutcomeMetrics: {
        outcome_percent_change: Number.isFinite(effectMean) ? effectMean : category.meanPercentChange,
      },
      method: "adaptive_bin_jurisdiction_median",
    },
    adaptiveBinTables: [
      {
        tableId: "jurisdiction_optimal_value_bins",
        tableLabel: "Jurisdiction Optimal Predictor Value Distribution",
        predictorUnit: "model spending units",
        metricDefinitions: [
          { id: "outcome_percent_change", label: "Outcome % Change from Baseline", unit: "%", direction: "higher_better" },
          { id: "forward_pearson", label: "Forward Pearson", direction: "higher_better" },
          { id: "predictive_pearson", label: "Predictive Pearson", direction: "higher_better" },
        ],
        binning: {
          method: "adaptive_numeric_bins",
          targetBinCount,
          minBinSize,
          anchors: [],
          roundTo: 1,
          binsGenerated: rows.length,
        },
        rows,
      },
    ],
    qualityFlags,
    dataFlow: [
      {
        stepId: "source_country_results",
        label: "Source country results",
        inputCount: category.countryResults.length,
        outputCount: summaries.length,
        droppedCount: Math.max(0, category.countryResults.length - summaries.length),
      },
      {
        stepId: "aggregation",
        label: "Aggregate pair metrics",
        inputCount: totalPairs,
        outputCount: totalPairs,
        droppedCount: 0,
      },
      {
        stepId: "adaptive_binning",
        label: "Adaptive bin construction",
        inputCount: summaries.length,
        outputCount: summaries.length,
        droppedCount: 0,
      },
    ],
  });

  return {
    pair: {
      summary: {
        sourceId: OPTIMAL_BUDGET_SOURCE_ID,
        predictorId,
        predictorLabel,
        outcomeId,
        outcomeLabel,
        outcomeUnit,
        subjectCount: summaries.length,
        coverageYearMin: yearMin ?? undefined,
        coverageYearMax: yearMax ?? undefined,
        generatedAt: optimalBudgetData.analyzedAt,
      },
      pairStudy,
      subjects: summaries,
      subjectDrilldowns: buildSubjectDrilldowns(pairStudy, summaries),
    },
    candidate: {
      outcomeId,
      predictorId,
      predictorLabel,
      pValue: clamp01(average(subjects.map(subject => subject.pValue)) || (1 - statisticalSignificance)),
      evidenceGrade: inferEvidenceGrade(statisticalSignificance),
      aggregateVariableRelationship,
    },
    outcomeDefinition: {
      id: outcomeId,
      label: outcomeLabel,
      unit: outcomeUnit,
      direction: DEFAULT_OUTCOME_DIRECTION,
    },
    predictorDefinition: {
      id: predictorId,
      label: predictorLabel,
      unit: "model spending units",
    },
  };
}
function buildCatalog(sourceHash: string): ExplorerCatalog {
  const sourceFingerprints: ExplorerSourceFingerprint[] = [
    {
      sourceId: GOVERNMENT_SIZE_SOURCE_ID,
      generatedAt: governmentSizeData.generatedAt,
      recordCount: countGovernmentSizeRecords(governmentSizeData),
      fingerprint: stableHash(
        JSON.stringify({
          generatedAt: governmentSizeData.generatedAt,
          predictorId: governmentSizeData.predictor.id,
          outcomeIds: governmentSizeData.outcomes.map(outcome => outcome.id).sort(),
          records: countGovernmentSizeRecords(governmentSizeData),
        }),
      ),
    },
    {
      sourceId: OPTIMAL_BUDGET_SOURCE_ID,
      generatedAt: optimalBudgetData.analyzedAt,
      recordCount: countOptimalBudgetRecords(optimalBudgetData),
      fingerprint: stableHash(
        JSON.stringify({
          analyzedAt: optimalBudgetData.analyzedAt,
          categoryIds: optimalBudgetData.categories.map(category => category.id).sort(),
          records: countOptimalBudgetRecords(optimalBudgetData),
        }),
      ),
    },
  ];

  const sources: ExplorerSource[] = [
    {
      id: GOVERNMENT_SIZE_SOURCE_ID,
      label: "US Government Size Analysis",
      generatedAt: governmentSizeData.generatedAt,
      provenance: "packages/examples/output/us-government-size-analysis.json",
    },
    {
      id: OPTIMAL_BUDGET_SOURCE_ID,
      label: "US Optimal Budget Analysis",
      generatedAt: optimalBudgetData.analyzedAt,
      provenance: "packages/web/src/data/optimal-budget.json",
    },
  ];

  const outcomesById = new Map<string, ExplorerOutcome>();
  const predictorsById = new Map<string, ExplorerPredictor>();
  const pairsByKey = new Map<string, ExplorerPairRecord>();
  const candidates: OutcomeRankingCandidate[] = [];

  for (const outcome of governmentSizeData.outcomes) {
    const built = buildGovernmentSizePair(outcome);
    outcomesById.set(built.outcomeDefinition.id, built.outcomeDefinition);
    predictorsById.set(built.predictorDefinition.id, built.predictorDefinition);
    pairsByKey.set(toLookupKey(built.outcomeDefinition.id, built.predictorDefinition.id), built.pair);
    candidates.push(built.candidate);
  }

  for (const category of optimalBudgetData.categories) {
    const built = buildOptimalBudgetPair(category);
    if (!built) continue;

    outcomesById.set(built.outcomeDefinition.id, built.outcomeDefinition);
    predictorsById.set(built.predictorDefinition.id, built.predictorDefinition);
    pairsByKey.set(toLookupKey(built.outcomeDefinition.id, built.predictorDefinition.id), built.pair);
    candidates.push(built.candidate);
  }

  const rankings = buildOutcomeMegaStudies({
    candidates,
    multipleTestingMethod: "benjamini_hochberg",
    alpha: 0.05,
  });

  const rankingsByOutcome = new Map(rankings.map(ranking => [toId(ranking.outcomeId), ranking]));
  const pairSummaries = [...pairsByKey.values()]
    .map(pair => pair.summary)
    .sort((a, b) => {
      if (a.outcomeId !== b.outcomeId) return a.outcomeId.localeCompare(b.outcomeId);
      return a.predictorId.localeCompare(b.predictorId);
    });

  const generatedAt =
    [...sources]
      .map(source => source.generatedAt)
      .sort()
      .at(-1) ?? new Date().toISOString();

  const subjectCount = [...pairsByKey.values()].reduce(
    (sum, pair) => sum + pair.subjects.length,
    0,
  );
  const precomputeIndex: ExplorerPrecomputeIndex = {
    cacheKey: stableHash(
      JSON.stringify({
        sourceHash,
        generatedAt,
        sourceFingerprints: sourceFingerprints.map(source => ({
          sourceId: source.sourceId,
          fingerprint: source.fingerprint,
        })),
        outcomeCount: outcomesById.size,
        predictorCount: predictorsById.size,
        pairCount: pairsByKey.size,
        subjectCount,
      }),
    ),
    generatedAt,
    sourceFingerprints,
    outcomeCount: outcomesById.size,
    predictorCount: predictorsById.size,
    pairCount: pairsByKey.size,
    subjectCount,
  };

  return {
    sourceHash,
    freshness: {
      generatedAt,
      sources,
    },
    precomputeIndex,
    outcomes: [...outcomesById.values()].sort((a, b) => a.label.localeCompare(b.label)),
    predictors: [...predictorsById.values()].sort((a, b) => a.label.localeCompare(b.label)),
    pairSummaries,
    rankingsByOutcome,
    pairsByKey,
  };
}

function getCatalog(): ExplorerCatalog {
  const sourceHash = deriveSourceHash();
  if (!cachedCatalog || cachedCatalog.sourceHash !== sourceHash) {
    cachedCatalog = buildCatalog(sourceHash);
  }
  return cachedCatalog;
}

export function getExplorerFreshness(): ExplorerFreshness {
  return getCatalog().freshness;
}

export function getExplorerPrecomputeIndex(): ExplorerPrecomputeIndex {
  return getCatalog().precomputeIndex;
}

export function listExplorerOutcomes(): ExplorerOutcome[] {
  return getCatalog().outcomes;
}

export function listExplorerPredictors(): ExplorerPredictor[] {
  return getCatalog().predictors;
}

export function listExplorerPairSummaries(): ExplorerPairSummary[] {
  return getCatalog().pairSummaries;
}

export function getOutcomeMegaStudy(outcomeId: string): OutcomeMegaStudyRanking | null {
  return getCatalog().rankingsByOutcome.get(toId(outcomeId)) ?? null;
}

export function getPairStudy(outcomeId: string, predictorId: string): PairStudyResult | null {
  const record = getCatalog().pairsByKey.get(toLookupKey(outcomeId, predictorId));
  return record?.pairStudy ?? null;
}

export function getPairSummary(outcomeId: string, predictorId: string): ExplorerPairSummary | null {
  const record = getCatalog().pairsByKey.get(toLookupKey(outcomeId, predictorId));
  return record?.summary ?? null;
}

export function listPairSubjects(outcomeId: string, predictorId: string): ExplorerSubjectSummary[] {
  const record = getCatalog().pairsByKey.get(toLookupKey(outcomeId, predictorId));
  return record?.subjects ?? [];
}

export function listPairSubjectDrilldowns(
  outcomeId: string,
  predictorId: string,
): ExplorerSubjectDrilldown[] {
  const record = getCatalog().pairsByKey.get(toLookupKey(outcomeId, predictorId));
  return record?.subjectDrilldowns ?? [];
}

export function getPairSubject(
  outcomeId: string,
  predictorId: string,
  subjectId: string,
): ExplorerSubjectSummary | null {
  const normalizedSubjectId = toId(subjectId);
  return (
    listPairSubjects(outcomeId, predictorId).find(subject => toId(subject.subjectId) === normalizedSubjectId) ??
    null
  );
}

export function getPairSubjectDrilldown(
  outcomeId: string,
  predictorId: string,
  subjectId: string,
): ExplorerSubjectDrilldown | null {
  const normalizedSubjectId = toId(subjectId);
  return (
    listPairSubjectDrilldowns(outcomeId, predictorId).find(
      subject => toId(subject.summary.subjectId) === normalizedSubjectId,
    ) ?? null
  );
}
