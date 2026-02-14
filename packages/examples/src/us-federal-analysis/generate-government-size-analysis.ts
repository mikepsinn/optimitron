/**
 * Government Size Analysis (World Bank Panel, configurable window)
 *
 * Estimates an evidence-weighted optimal government spending share (% GDP)
 * using multi-jurisdiction N-of-1 causal analysis across four core outcomes:
 * HALE level/growth and after-tax median income proxy level/growth.
 *
 * Predictor:
 *   General government expenditure (% GDP)
 *   World Bank WDI: GC.XPN.TOTL.GD.ZS
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runCountryAnalysis,
  scoreToGrade,
  type AnnualTimeSeries,
} from '@optomitron/obg';
import {
  buildAdaptiveNumericBins,
  type NumericBin,
} from '@optomitron/optimizer';

import {
  fetchers,
  TOP_COUNTRIES,
  type DataPoint,
} from '@optomitron/data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

const DEFAULT_START_YEAR = 1990;
const DEFAULT_END_YEAR = 2023;
const DEFAULT_SENSITIVITY_START_YEARS = [1990, 1995, 2000] as const;
const DEFAULT_JURISDICTIONS = [...TOP_COUNTRIES];
const CAUSAL_ONSET_DAYS = 365;
const CAUSAL_DURATION_DAYS = 1095;

type OutcomeDirection = 'higher_better' | 'lower_better';

type OutcomeSourceKey =
  | 'healthyLifeExpectancy'
  | 'healthyLifeExpectancyGrowthPct'
  | 'afterTaxMedianIncomePpp'
  | 'afterTaxMedianIncomeGrowthPct';

interface OutcomeSpec {
  id: string;
  name: string;
  sourceKey: OutcomeSourceKey;
  direction: OutcomeDirection;
  weight: number;
  unit: string;
}

interface OutcomeAnalysis {
  id: string;
  name: string;
  direction: OutcomeDirection;
  weight: number;
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
  confidenceGrade: ReturnType<typeof scoreToGrade>;
  jurisdictions: Array<{
    jurisdictionId: string;
    jurisdictionName: string;
    optimalPctGdp: number;
    forwardPearson: number;
    predictivePearson: number;
    percentChangeFromBaseline: number;
    bradfordHillStrength: number;
    numberOfPairs: number;
  }>;
}

interface SensitivityScenario {
  startYear: number;
  endYear: number;
  observations: number;
  jurisdictions: number;
  optimalPctGdp: number;
  optimalBandLowPctGdp: number;
  optimalBandHighPctGdp: number;
  usModeledSpendingPctGdp: number;
  usStatus: 'above_optimal_band' | 'below_optimal_band' | 'within_optimal_band';
  isPrimaryScenario: boolean;
}

interface AdaptiveBinningMetadata {
  method: string;
  targetBinCount: number;
  minBinSize: number;
  anchors: number[];
  roundTo: number;
  binsGenerated: number;
}

interface TierOutcomeSummary {
  observations: number;
  jurisdictions: number;
  typicalHealthyLifeYears: number | null;
  typicalHealthyLifeYearsGrowthPerYear: number | null;
  typicalRealAfterTaxMedianIncomeLevel: number | null;
  typicalRealAfterTaxMedianIncomeGrowthPct: number | null;
  lowSampleWarning: string | null;
  proxyNotes: string[];
}

interface SpendingPctGdpTier extends TierOutcomeSummary {
  tier: string;
  minPctGdp: number | null;
  maxPctGdp: number | null;
}

interface SpendingPerCapitaTier extends TierOutcomeSummary {
  tier: string;
  minSpendingPerCapitaPpp: number | null;
  maxSpendingPerCapitaPpp: number | null;
}

interface GovernmentSizeAnalysisData {
  predictor: {
    id: string;
    name: string;
    definition: string;
    fields: string[];
    coverage: {
      jurisdictions: number;
      years: number;
      observations: number;
      yearMin: number;
      yearMax: number;
    };
  };
  outcomes: OutcomeAnalysis[];
  sensitivity: {
    startYearScenarios: SensitivityScenario[];
    note: string;
  };
  spendingLevelTable: {
    alignment: {
      type: 'lag_aligned_follow_up';
      onsetYears: number;
      durationYears: number;
      description: string;
    };
    healthyLifeYearsMetric: {
      isDirectMetric: boolean;
      metricUsed: string;
      note: string;
    };
    incomeGrowthMetric: {
      isDirectMetric: boolean;
      metricUsed: string;
      note: string;
    };
    binning: AdaptiveBinningMetadata;
    tiers: SpendingPctGdpTier[];
  };
  spendingPerCapitaLevelTable: {
    definition: string;
    alignment: {
      type: 'lag_aligned_follow_up';
      onsetYears: number;
      durationYears: number;
      description: string;
    };
    binning: AdaptiveBinningMetadata;
    tiers: SpendingPerCapitaTier[];
  };
  overall: {
    optimalPctGdp: number;
    optimalBandLowPctGdp: number;
    optimalBandHighPctGdp: number;
    weightingMethod: string;
  };
  usSnapshot: {
    latestYear: number;
    modeledSpendingPctGdp: number;
    gapToOptimalPctPoints: number;
    status: 'above_optimal_band' | 'below_optimal_band' | 'within_optimal_band';
  };
  generatedAt: string;
}

interface GovernmentSizeAnalysisArtifacts {
  markdown: string;
  json: GovernmentSizeAnalysisData;
  outputPaths: {
    markdown: string;
    json: string;
  };
}

interface GovernmentSizeAnalysisOptions {
  outputDir?: string;
  writeFiles?: boolean;
  logSummary?: boolean;
  startYear?: number;
  endYear?: number;
  sensitivityStartYears?: number[];
  jurisdictions?: string[];
}

interface YearWindow {
  startYear: number;
  endYear: number;
}

interface IndicatorDataset {
  predictor: DataPoint[];
  gdpPerCapita: DataPoint[];
  healthyLifeExpectancy: DataPoint[];
  healthyLifeExpectancyGrowthPct: DataPoint[];
  afterTaxMedianIncomePpp: DataPoint[];
  afterTaxMedianIncomeGrowthPct: DataPoint[];
}

interface ScenarioAnalysis {
  outcomeAnalyses: OutcomeAnalysis[];
  overall: {
    optimalPctGdp: number;
    optimalBandLowPctGdp: number;
    optimalBandHighPctGdp: number;
    weightingMethod: string;
  };
  usSnapshot: {
    latestYear: number;
    modeledSpendingPctGdp: number;
    gapToOptimalPctPoints: number;
    status: 'above_optimal_band' | 'below_optimal_band' | 'within_optimal_band';
  };
  coverage: {
    jurisdictions: number;
    years: number;
    observations: number;
    yearMin: number;
    yearMax: number;
  };
}

interface PanelRow {
  jurisdictionIso3: string;
  year: number;
  predictorPctGdp: number;
  healthyLifeExpectancyYears: number | null;
  healthyLifeExpectancyGrowthPct: number | null;
  afterTaxMedianIncomePpp: number | null;
  afterTaxMedianIncomeGrowthPct: number | null;
  gdpPerCapitaPpp: number | null;
}

interface SpendingObservation {
  jurisdictionIso3: string;
  year: number;
  spendingPctGdp: number;
  spendingPerCapitaPpp: number | null;
  healthyLifeExpectancyYears: number | null;
  healthyLifeExpectancyGrowthPct: number | null;
  afterTaxMedianIncomePpp: number | null;
  afterTaxMedianIncomeGrowthPct: number | null;
}

const OUTCOMES: OutcomeSpec[] = [
  {
    id: 'healthy_life_expectancy_years',
    name: 'Healthy Life Expectancy (HALE)',
    sourceKey: 'healthyLifeExpectancy',
    direction: 'higher_better',
    weight: 0.25,
    unit: 'years',
  },
  {
    id: 'healthy_life_expectancy_growth_yoy_pct',
    name: 'Healthy Life Expectancy Growth (Annualized %)',
    sourceKey: 'healthyLifeExpectancyGrowthPct',
    direction: 'higher_better',
    weight: 0.25,
    unit: '% YoY',
  },
  {
    id: 'after_tax_median_income_ppp',
    name: 'After-Tax Median Income (PPP, proxy)',
    sourceKey: 'afterTaxMedianIncomePpp',
    direction: 'higher_better',
    weight: 0.25,
    unit: 'international $',
  },
  {
    id: 'after_tax_median_income_growth_yoy_pct',
    name: 'After-Tax Median Income Growth (Annualized %, proxy)',
    sourceKey: 'afterTaxMedianIncomeGrowthPct',
    direction: 'higher_better',
    weight: 0.25,
    unit: '% YoY',
  },
];
const ADAPTIVE_BIN_CONFIG = Object.freeze({
  targetBinCount: 12,
  minBinSize: 30,
  anchors: [20],
  roundTo: 1,
});
const ADAPTIVE_PER_CAPITA_BIN_CONFIG = Object.freeze({
  targetBinCount: 12,
  minBinSize: 30,
  anchors: [5_000, 10_000, 20_000],
  roundTo: 500,
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  const loVal = sorted[lo] ?? 0;
  const hiVal = sorted[hi] ?? 0;
  return loVal + (hiVal - loVal) * (idx - lo);
}

function quantileOrNull(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  return quantile(values, q);
}

function daysToWholeYears(days: number): number {
  return Math.max(0, Math.ceil(days / 365));
}

function weightedMean(values: Array<{ value: number; weight: number }>): number {
  const sumWeights = values.reduce((sum, item) => sum + item.weight, 0);
  if (sumWeights <= 0) return avg(values.map(v => v.value));
  const weighted = values.reduce((sum, item) => sum + item.value * item.weight, 0);
  return weighted / sumWeights;
}

function withinWindow(year: number, window: YearWindow): boolean {
  return year >= window.startYear && year <= window.endYear;
}

function keyFor(jurisdictionIso3: string, year: number): string {
  return `${jurisdictionIso3}::${year}`;
}

function filterDataPoints(points: DataPoint[], window: YearWindow): DataPoint[] {
  return points.filter(point => withinWindow(point.year, window) && isFiniteNumber(point.value));
}

function byCountryYear(points: DataPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const point of points) {
    if (!isFiniteNumber(point.value)) continue;
    map.set(keyFor(point.jurisdictionIso3, point.year), point.value);
  }
  return map;
}

function deriveAnnualizedGrowthPercent(
  points: DataPoint[],
  sourceLabel: string,
): DataPoint[] {
  const byJurisdiction = new Map<string, DataPoint[]>();
  for (const point of points) {
    if (!isFiniteNumber(point.value)) continue;
    const existing = byJurisdiction.get(point.jurisdictionIso3);
    if (existing) {
      existing.push(point);
    } else {
      byJurisdiction.set(point.jurisdictionIso3, [point]);
    }
  }

  const derived: DataPoint[] = [];
  for (const [jurisdictionIso3, jurisdictionPoints] of byJurisdiction) {
    const sorted = [...jurisdictionPoints].sort((a, b) => a.year - b.year);
    let previous: DataPoint | null = null;

    for (const current of sorted) {
      if (!previous || previous.value <= 0) {
        previous = current;
        continue;
      }

      const yearsElapsed = current.year - previous.year;
      if (yearsElapsed <= 0) {
        previous = current;
        continue;
      }

      const annualizedGrowthPct =
        (Math.pow(current.value / previous.value, 1 / yearsElapsed) - 1) * 100;
      if (!Number.isFinite(annualizedGrowthPct)) {
        previous = current;
        continue;
      }

      derived.push({
        jurisdictionIso3,
        year: current.year,
        value: annualizedGrowthPct,
        unit: '% YoY',
        source: sourceLabel,
      });

      previous = current;
    }
  }

  return derived;
}

function getOutcomePoints(dataset: IndicatorDataset, sourceKey: OutcomeSourceKey): DataPoint[] {
  switch (sourceKey) {
    case 'healthyLifeExpectancy':
      return dataset.healthyLifeExpectancy;
    case 'healthyLifeExpectancyGrowthPct':
      return dataset.healthyLifeExpectancyGrowthPct;
    case 'afterTaxMedianIncomePpp':
      return dataset.afterTaxMedianIncomePpp;
    case 'afterTaxMedianIncomeGrowthPct':
      return dataset.afterTaxMedianIncomeGrowthPct;
  }
}

async function fetchIndicatorDataset(
  window: YearWindow,
  jurisdictions: string[],
): Promise<IndicatorDataset> {
  const options = {
    jurisdictions,
    period: window,
  };
  const whoOptions = {
    period: window,
  };

  const [
    predictor,
    gdpPerCapita,
    healthyLifeExpectancyRaw,
    afterTaxMedianIncomePpp,
  ] = await Promise.all([
    fetchers.fetchGovExpenditure(options),
    fetchers.fetchGdpPerCapita(options),
    fetchers.fetchWHOHealthyLifeExpectancy(whoOptions),
    fetchers.fetchGniPerCapitaPpp(options),
  ]);

  const jurisdictionSet = new Set(jurisdictions);
  const healthyLifeExpectancy = healthyLifeExpectancyRaw.filter(
    point => jurisdictionSet.has(point.jurisdictionIso3),
  );

  const healthyLifeExpectancyGrowthPct = deriveAnnualizedGrowthPercent(
    healthyLifeExpectancy,
    'derived:annualized_growth(outcome.who.healthy_life_expectancy_years)',
  );
  const afterTaxMedianIncomeGrowthPct = deriveAnnualizedGrowthPercent(
    afterTaxMedianIncomePpp,
    'derived:annualized_growth(outcome.derived.after_tax_median_income_ppp)',
  );

  return {
    predictor,
    gdpPerCapita,
    healthyLifeExpectancy,
    healthyLifeExpectancyGrowthPct,
    afterTaxMedianIncomePpp,
    afterTaxMedianIncomeGrowthPct,
  };
}

function toAnnualSeries(
  points: DataPoint[],
  variableId: string,
  variableName: string,
  unit: string,
  negate: boolean = false,
): AnnualTimeSeries[] {
  const byCountry = new Map<string, Map<number, number>>();

  for (const point of points) {
    if (!isFiniteNumber(point.value)) continue;
    const alignedValue = negate ? -point.value : point.value;
    const annual = byCountry.get(point.jurisdictionIso3);
    if (annual) {
      annual.set(point.year, alignedValue);
    } else {
      byCountry.set(point.jurisdictionIso3, new Map([[point.year, alignedValue]]));
    }
  }

  const series: AnnualTimeSeries[] = [];
  for (const [iso3, annualValues] of byCountry) {
    series.push({
      jurisdictionId: iso3,
      jurisdictionName: iso3,
      variableId,
      variableName,
      unit,
      annualValues,
    });
  }

  return series;
}

function analyzeOutcome(
  spec: OutcomeSpec,
  predictors: AnnualTimeSeries[],
  dataset: IndicatorDataset,
  window: YearWindow,
): OutcomeAnalysis {
  const outcomePoints = filterDataPoints(getOutcomePoints(dataset, spec.sourceKey), window);
  const outcomes = toAnnualSeries(
    outcomePoints,
    spec.id,
    spec.name,
    spec.direction === 'lower_better' ? `negated ${spec.unit}` : spec.unit,
    spec.direction === 'lower_better',
  );

  const result = runCountryAnalysis({
    predictors,
    outcomes,
    config: {
      onsetDelayDays: CAUSAL_ONSET_DAYS,
      durationOfActionDays: CAUSAL_DURATION_DAYS,
      fillingType: 'interpolation',
      minimumDataPoints: 5,
      plausibilityScore: 0.7,
      coherenceScore: 0.6,
      analogyScore: 0.7,
      specificityScore: 0.3,
    },
  });

  const aggregate = result.aggregate;
  const optimals = result.jurisdictions
    .map(j => j.analysis.optimalValues.valuePredictingHighOutcome)
    .filter(value => Number.isFinite(value));

  const directionalConsistency = aggregate.n > 0 ? aggregate.positiveCount / aggregate.n : 0;
  const sampleSaturation = 1 - Math.exp(-aggregate.n / 10);
  const confidenceScore = clamp(
    aggregate.meanBradfordHill.strength * directionalConsistency * sampleSaturation,
    0,
    1,
  );

  const jurisdictions = result.jurisdictions
    .map(j => ({
      jurisdictionId: j.jurisdictionId,
      jurisdictionName: j.jurisdictionName,
      optimalPctGdp: j.analysis.optimalValues.valuePredictingHighOutcome,
      forwardPearson: j.analysis.forwardPearson,
      predictivePearson: j.analysis.predictivePearson,
      percentChangeFromBaseline: j.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline,
      bradfordHillStrength: j.analysis.bradfordHill.strength,
      numberOfPairs: j.analysis.numberOfPairs,
    }))
    .filter(row => Number.isFinite(row.optimalPctGdp))
    .sort((a, b) => b.optimalPctGdp - a.optimalPctGdp);

  return {
    id: spec.id,
    name: spec.name,
    direction: spec.direction,
    weight: spec.weight,
    meanForwardPearson: aggregate.meanForwardPearson,
    meanPercentChange: aggregate.meanPercentChange,
    positiveCount: aggregate.positiveCount,
    negativeCount: aggregate.negativeCount,
    jurisdictionsAnalyzed: aggregate.n,
    jurisdictionsSkipped: aggregate.skipped,
    medianOptimalPctGdp: quantile(optimals, 0.5),
    p25OptimalPctGdp: quantile(optimals, 0.25),
    p75OptimalPctGdp: quantile(optimals, 0.75),
    confidenceScore,
    confidenceGrade: scoreToGrade(confidenceScore),
    jurisdictions,
  };
}

function computeScenario(
  dataset: IndicatorDataset,
  window: YearWindow,
): ScenarioAnalysis {
  const predictorPoints = filterDataPoints(dataset.predictor, window);
  if (predictorPoints.length === 0) {
    throw new Error(`No predictor data available in range ${window.startYear}-${window.endYear}`);
  }

  const predictors = toAnnualSeries(
    predictorPoints,
    'governmentExpenditurePercentGdp',
    'Government Expenditure (% GDP)',
    '% GDP',
  );

  const outcomeAnalyses = OUTCOMES.map(spec => analyzeOutcome(spec, predictors, dataset, window));

  const totalWeight = outcomeAnalyses.reduce((sum, outcome) => sum + outcome.weight, 0);
  const normalized = outcomeAnalyses.map(outcome => ({
    ...outcome,
    baseWeight: totalWeight > 0 ? outcome.weight / totalWeight : 0,
  }));

  const optimalPctGdp = weightedMean(normalized.map(outcome => ({
    value: outcome.medianOptimalPctGdp,
    weight: outcome.baseWeight * (0.2 + 0.8 * outcome.confidenceScore),
  })));

  const optimalBandLowPctGdp = weightedMean(normalized.map(outcome => ({
    value: outcome.p25OptimalPctGdp,
    weight: outcome.baseWeight * (0.2 + 0.8 * outcome.confidenceScore),
  })));

  const optimalBandHighPctGdp = weightedMean(normalized.map(outcome => ({
    value: outcome.p75OptimalPctGdp,
    weight: outcome.baseWeight * (0.2 + 0.8 * outcome.confidenceScore),
  })));

  const usaRows = predictorPoints
    .filter(point => point.jurisdictionIso3 === 'USA')
    .sort((a, b) => b.year - a.year);

  const latestUs = usaRows[0];
  if (!latestUs || !isFiniteNumber(latestUs.value)) {
    throw new Error('No USA predictor data found for government expenditure analysis');
  }

  const usGapToOptimal = latestUs.value - optimalPctGdp;
  let status: ScenarioAnalysis['usSnapshot']['status'] = 'within_optimal_band';
  if (latestUs.value > optimalBandHighPctGdp) status = 'above_optimal_band';
  if (latestUs.value < optimalBandLowPctGdp) status = 'below_optimal_band';

  const years = [...new Set(predictorPoints.map(point => point.year))];
  const jurisdictions = new Set(predictorPoints.map(point => point.jurisdictionIso3));

  return {
    outcomeAnalyses,
    overall: {
      optimalPctGdp,
      optimalBandLowPctGdp,
      optimalBandHighPctGdp,
      weightingMethod: 'outcome-weighted average with evidence modulation (0.2 + 0.8*confidence)',
    },
    usSnapshot: {
      latestYear: latestUs.year,
      modeledSpendingPctGdp: latestUs.value,
      gapToOptimalPctPoints: usGapToOptimal,
      status,
    },
    coverage: {
      jurisdictions: jurisdictions.size,
      years: years.length,
      observations: predictorPoints.length,
      yearMin: Math.min(...years),
      yearMax: Math.max(...years),
    },
  };
}

function buildPanelRows(
  dataset: IndicatorDataset,
  window: YearWindow,
): PanelRow[] {
  const predictors = filterDataPoints(dataset.predictor, window);

  const hale = byCountryYear(filterDataPoints(dataset.healthyLifeExpectancy, window));
  const haleGrowth = byCountryYear(filterDataPoints(dataset.healthyLifeExpectancyGrowthPct, window));
  const afterTaxIncome = byCountryYear(filterDataPoints(dataset.afterTaxMedianIncomePpp, window));
  const afterTaxIncomeGrowth = byCountryYear(
    filterDataPoints(dataset.afterTaxMedianIncomeGrowthPct, window),
  );
  const gdp = byCountryYear(filterDataPoints(dataset.gdpPerCapita, window));

  return predictors
    .map(point => {
      const key = keyFor(point.jurisdictionIso3, point.year);
      return {
        jurisdictionIso3: point.jurisdictionIso3,
        year: point.year,
        predictorPctGdp: point.value,
        healthyLifeExpectancyYears: hale.get(key) ?? null,
        healthyLifeExpectancyGrowthPct: haleGrowth.get(key) ?? null,
        afterTaxMedianIncomePpp: afterTaxIncome.get(key) ?? null,
        afterTaxMedianIncomeGrowthPct: afterTaxIncomeGrowth.get(key) ?? null,
        gdpPerCapitaPpp: gdp.get(key) ?? null,
      } satisfies PanelRow;
    })
    .sort((a, b) => {
      if (a.jurisdictionIso3 === b.jurisdictionIso3) {
        return a.year - b.year;
      }
      return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
    });
}

function buildLagAlignedSpendingObservations(
  rows: PanelRow[],
  onsetYears: number,
  durationYears: number,
): SpendingObservation[] {
  const byCountry = new Map<string, PanelRow[]>();
  for (const row of rows) {
    const existing = byCountry.get(row.jurisdictionIso3);
    if (existing) {
      existing.push(row);
    } else {
      byCountry.set(row.jurisdictionIso3, [row]);
    }
  }

  const observations: SpendingObservation[] = [];
  for (const [jurisdictionIso3, countryRows] of byCountry) {
    const sorted = [...countryRows].sort((a, b) => a.year - b.year);

    for (const row of sorted) {
      const followUpStartYear = row.year + onsetYears;
      const followUpEndYear = row.year + durationYears;
      const followUpRows = sorted.filter(
        candidate =>
          candidate.year >= followUpStartYear &&
          candidate.year <= followUpEndYear,
      );
      if (followUpRows.length === 0) continue;

      const haleFollowUp = followUpRows
        .map(candidate => candidate.healthyLifeExpectancyYears)
        .filter((value): value is number => isFiniteNumber(value));
      const haleGrowthFollowUp = followUpRows
        .map(candidate => candidate.healthyLifeExpectancyGrowthPct)
        .filter((value): value is number => isFiniteNumber(value));
      const incomeFollowUp = followUpRows
        .map(candidate => candidate.afterTaxMedianIncomePpp)
        .filter((value): value is number => isFiniteNumber(value));
      const incomeGrowthFollowUp = followUpRows
        .map(candidate => candidate.afterTaxMedianIncomeGrowthPct)
        .filter((value): value is number => isFiniteNumber(value));

      const healthyLifeExpectancyYears = quantileOrNull(haleFollowUp, 0.5);
      const healthyLifeExpectancyGrowthPct = quantileOrNull(haleGrowthFollowUp, 0.5);
      const afterTaxMedianIncomePpp = quantileOrNull(incomeFollowUp, 0.5);
      const afterTaxMedianIncomeGrowthPct = quantileOrNull(incomeGrowthFollowUp, 0.5);

      if (
        healthyLifeExpectancyYears == null &&
        healthyLifeExpectancyGrowthPct == null &&
        afterTaxMedianIncomePpp == null &&
        afterTaxMedianIncomeGrowthPct == null
      ) {
        continue;
      }

      observations.push({
        jurisdictionIso3,
        year: row.year,
        spendingPctGdp: row.predictorPctGdp,
        spendingPerCapitaPpp:
          row.gdpPerCapitaPpp == null ? null : (row.predictorPctGdp / 100) * row.gdpPerCapitaPpp,
        healthyLifeExpectancyYears,
        healthyLifeExpectancyGrowthPct,
        afterTaxMedianIncomePpp,
        afterTaxMedianIncomeGrowthPct,
      });
    }
  }

  return observations;
}

function formatPct(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function formatPctBinLabel(bin: NumericBin): string {
  return `${formatPct(bin.lowerBound)}-${formatPct(bin.upperBound)}%`;
}

function formatUsdBinLabel(bin: NumericBin): string {
  return `${formatUsd(bin.lowerBound)}-${formatUsd(bin.upperBound)}`;
}

function summarizeTierOutcomes(
  matches: SpendingObservation[],
  minBinSize: number,
): TierOutcomeSummary {
  const haleValues = matches
    .map(observation => observation.healthyLifeExpectancyYears)
    .filter((value): value is number => isFiniteNumber(value));

  const haleGrowthValues = matches
    .map(observation => observation.healthyLifeExpectancyGrowthPct)
    .filter((value): value is number => isFiniteNumber(value));

  const incomeLevelValues = matches
    .map(observation => observation.afterTaxMedianIncomePpp)
    .filter((value): value is number => isFiniteNumber(value));

  const incomeGrowthValues = matches
    .map(observation => observation.afterTaxMedianIncomeGrowthPct)
    .filter((value): value is number => isFiniteNumber(value));

  return {
    observations: matches.length,
    jurisdictions: new Set(matches.map(observation => observation.jurisdictionIso3)).size,
    typicalHealthyLifeYears: haleValues.length > 0 ? quantile(haleValues, 0.5) : null,
    typicalHealthyLifeYearsGrowthPerYear:
      haleGrowthValues.length > 0 ? quantile(haleGrowthValues, 0.5) : null,
    typicalRealAfterTaxMedianIncomeLevel:
      incomeLevelValues.length > 0 ? quantile(incomeLevelValues, 0.5) : null,
    typicalRealAfterTaxMedianIncomeGrowthPct:
      incomeGrowthValues.length > 0 ? quantile(incomeGrowthValues, 0.5) : null,
    lowSampleWarning: matches.length < minBinSize ? 'Small sample: interpret cautiously' : null,
    proxyNotes: [
      'Healthy life years level: WHO Healthy Life Expectancy (HALE).',
      'Healthy life years growth: annualized percent growth of HALE.',
      'Real after-tax median income level proxy: GNI per-capita PPP level.',
      'Real after-tax median income growth proxy: annualized percent growth of GNI per-capita PPP.',
    ],
  };
}

function summarizeSpendingPctGdpTiers(
  observations: SpendingObservation[],
  bins: NumericBin[],
): GovernmentSizeAnalysisData['spendingLevelTable']['tiers'] {
  return bins.map((bin, idx) => {
    const isLast = idx === bins.length - 1;
    const matches = observations.filter(
      observation =>
        observation.spendingPctGdp >= bin.lowerBound &&
        (isLast
          ? observation.spendingPctGdp <= bin.upperBound
          : observation.spendingPctGdp < bin.upperBound),
    );

    return {
      tier: formatPctBinLabel(bin),
      minPctGdp: bin.lowerBound,
      maxPctGdp: bin.upperBound,
      ...summarizeTierOutcomes(matches, ADAPTIVE_BIN_CONFIG.minBinSize),
    };
  });
}

function summarizeSpendingPerCapitaTiers(
  observations: SpendingObservation[],
  bins: NumericBin[],
): GovernmentSizeAnalysisData['spendingPerCapitaLevelTable']['tiers'] {
  return bins.map((bin, idx) => {
    const isLast = idx === bins.length - 1;
    const matches = observations.filter(observation => {
      if (!isFiniteNumber(observation.spendingPerCapitaPpp)) return false;
      return (
        observation.spendingPerCapitaPpp >= bin.lowerBound &&
        (isLast
          ? observation.spendingPerCapitaPpp <= bin.upperBound
          : observation.spendingPerCapitaPpp < bin.upperBound)
      );
    });

    return {
      tier: formatUsdBinLabel(bin),
      minSpendingPerCapitaPpp: bin.lowerBound,
      maxSpendingPerCapitaPpp: bin.upperBound,
      ...summarizeTierOutcomes(matches, ADAPTIVE_PER_CAPITA_BIN_CONFIG.minBinSize),
    };
  });
}

function buildSensitivityScenarios(
  dataset: IndicatorDataset,
  endYear: number,
  startYears: number[],
  primaryStartYear: number,
): SensitivityScenario[] {
  const uniqueStartYears = [...new Set([...startYears, primaryStartYear])]
    .filter(year => year <= endYear)
    .sort((a, b) => a - b);

  return uniqueStartYears.map(startYear => {
    const scenario = computeScenario(dataset, { startYear, endYear });
    return {
      startYear,
      endYear,
      observations: scenario.coverage.observations,
      jurisdictions: scenario.coverage.jurisdictions,
      optimalPctGdp: scenario.overall.optimalPctGdp,
      optimalBandLowPctGdp: scenario.overall.optimalBandLowPctGdp,
      optimalBandHighPctGdp: scenario.overall.optimalBandHighPctGdp,
      usModeledSpendingPctGdp: scenario.usSnapshot.modeledSpendingPctGdp,
      usStatus: scenario.usSnapshot.status,
      isPrimaryScenario: startYear === primaryStartYear,
    };
  });
}

function buildMarkdown(data: GovernmentSizeAnalysisData): string {
  const lines: string[] = [];

  lines.push(
    `# Government Size Analysis: World Bank Panel (${data.predictor.coverage.yearMin}-${data.predictor.coverage.yearMax})`,
  );
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(
    `Evidence-weighted N-of-1 analysis suggests an optimal government spending share of ` +
      `**${data.overall.optimalPctGdp.toFixed(1)}% of GDP** ` +
      `(band: **${data.overall.optimalBandLowPctGdp.toFixed(1)}% - ${data.overall.optimalBandHighPctGdp.toFixed(1)}%**).`,
  );
  lines.push('');
  lines.push(
    `- **US latest spending share (${data.usSnapshot.latestYear}):** ${data.usSnapshot.modeledSpendingPctGdp.toFixed(1)}%`,
  );
  lines.push(
    `- **US gap to central estimate:** ${
      data.usSnapshot.gapToOptimalPctPoints >= 0 ? '+' : ''
    }${data.usSnapshot.gapToOptimalPctPoints.toFixed(1)} percentage points`,
  );
  lines.push(
    `- **US status vs inferred band:** ${data.usSnapshot.status.replaceAll('_', ' ')}`,
  );
  lines.push('');

  lines.push('## Predictor Definition');
  lines.push('');
  lines.push('Government Expenditure (% GDP):');
  lines.push('- World Bank WDI `GC.XPN.TOTL.GD.ZS`');
  lines.push(
    '- Includes total general government spending share relative to GDP (not category-level decomposition).',
  );
  lines.push('- Source taxonomy and alternative definitions: `government-spending-metric-comparison.md`.');
  lines.push('');

  lines.push('## Data Coverage');
  lines.push('');
  lines.push(`- Jurisdictions: ${data.predictor.coverage.jurisdictions}`);
  lines.push(`- Years: ${data.predictor.coverage.yearMin}-${data.predictor.coverage.yearMax}`);
  lines.push(`- Country-year observations: ${data.predictor.coverage.observations}`);
  lines.push('');

  lines.push('## Temporal Sensitivity (Start Year)');
  lines.push('');
  lines.push(
    data.sensitivity.note,
  );
  lines.push('');
  lines.push('| Start Year | End Year | Country-Years | Jurisdictions | Optimal % GDP | Inferred Band | US % GDP | US Status |');
  lines.push('|-----------:|---------:|--------------:|--------------:|--------------:|--------------|---------:|----------|');
  for (const scenario of data.sensitivity.startYearScenarios) {
    const band = `${scenario.optimalBandLowPctGdp.toFixed(1)}-${scenario.optimalBandHighPctGdp.toFixed(1)}`;
    const status = scenario.usStatus.replaceAll('_', ' ');
    lines.push(
      `| ${scenario.startYear} ` +
        `| ${scenario.endYear} ` +
        `| ${scenario.observations} ` +
        `| ${scenario.jurisdictions} ` +
        `| ${scenario.optimalPctGdp.toFixed(1)} ` +
        `| ${band} ` +
        `| ${scenario.usModeledSpendingPctGdp.toFixed(1)} ` +
        `| ${status}${scenario.isPrimaryScenario ? ' (primary)' : ''} |`,
    );
  }
  lines.push('');

  lines.push('## Spending Levels vs Typical Outcomes');
  lines.push('');
  lines.push('Primary welfare outcomes are median healthy life years and real after-tax median income growth.');
  lines.push(
    `Rows are lag-aligned for causal interpretation: predictor at year t, outcomes summarized over t+${data.spendingLevelTable.alignment.onsetYears} to t+${data.spendingLevelTable.alignment.durationYears}.`,
  );
  lines.push('Coverage notes for metric construction:');
  lines.push('- Healthy life years level: WHO Healthy Life Expectancy (HALE) (direct).');
  lines.push('- Healthy life years growth: annualized percent growth of HALE.');
  lines.push('- Real after-tax median income level: proxy via GNI per-capita PPP.');
  lines.push('- Real after-tax median income growth: annualized percent growth of the GNI proxy.');
  lines.push('');

  lines.push('### Spending Share (% GDP) Bins');
  lines.push('');
  lines.push(
    `- Adaptive bins: target ${data.spendingLevelTable.binning.targetBinCount}, ` +
      `minimum ${data.spendingLevelTable.binning.minBinSize} observations/bin, ` +
      `anchors at ${data.spendingLevelTable.binning.anchors.map(anchor => `${anchor}%`).join(', ')}, ` +
      `rounded to ${data.spendingLevelTable.binning.roundTo}%`,
  );
  lines.push('');
  lines.push('| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |');
  lines.push('|------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|');
  for (const tier of data.spendingLevelTable.tiers) {
    const life = tier.typicalHealthyLifeYears == null ? 'N/A' : tier.typicalHealthyLifeYears.toFixed(1);
    const lifeGrowth =
      tier.typicalHealthyLifeYearsGrowthPerYear == null
        ? 'N/A'
        : `${tier.typicalHealthyLifeYearsGrowthPerYear >= 0 ? '+' : ''}${tier.typicalHealthyLifeYearsGrowthPerYear.toFixed(3)}`;
    const incomeLevel =
      tier.typicalRealAfterTaxMedianIncomeLevel == null
        ? 'N/A'
        : `$${Math.round(tier.typicalRealAfterTaxMedianIncomeLevel).toLocaleString('en-US')}`;
    const incomeGrowth =
      tier.typicalRealAfterTaxMedianIncomeGrowthPct == null
        ? 'N/A'
        : `${tier.typicalRealAfterTaxMedianIncomeGrowthPct >= 0 ? '+' : ''}${tier.typicalRealAfterTaxMedianIncomeGrowthPct.toFixed(2)}%`;

    lines.push(
      `| ${tier.tier} ` +
        `| ${tier.observations} ` +
        `| ${tier.jurisdictions} ` +
        `| ${life} ` +
        `| ${lifeGrowth} ` +
        `| ${incomeLevel} ` +
        `| ${incomeGrowth} ` +
        `| ${tier.lowSampleWarning ?? '—'} |`,
    );
  }
  lines.push('');

  lines.push('### Spending Per-Capita (PPP) Bins');
  lines.push('');
  lines.push(
    'Per-capita PPP spending is derived as: government expenditure % GDP × GDP per capita PPP.',
  );
  lines.push(
    `- Adaptive bins: target ${data.spendingPerCapitaLevelTable.binning.targetBinCount}, ` +
      `minimum ${data.spendingPerCapitaLevelTable.binning.minBinSize} observations/bin, ` +
      `anchors at ${data.spendingPerCapitaLevelTable.binning.anchors.map(anchor => formatUsd(anchor)).join(', ')}, ` +
      `rounded to ${formatUsd(data.spendingPerCapitaLevelTable.binning.roundTo)}`,
  );
  lines.push('');
  lines.push('| Spending Per-Capita PPP Level | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |');
  lines.push('|-------------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|');
  for (const tier of data.spendingPerCapitaLevelTable.tiers) {
    const life = tier.typicalHealthyLifeYears == null ? 'N/A' : tier.typicalHealthyLifeYears.toFixed(1);
    const lifeGrowth =
      tier.typicalHealthyLifeYearsGrowthPerYear == null
        ? 'N/A'
        : `${tier.typicalHealthyLifeYearsGrowthPerYear >= 0 ? '+' : ''}${tier.typicalHealthyLifeYearsGrowthPerYear.toFixed(3)}`;
    const incomeLevel =
      tier.typicalRealAfterTaxMedianIncomeLevel == null
        ? 'N/A'
        : `$${Math.round(tier.typicalRealAfterTaxMedianIncomeLevel).toLocaleString('en-US')}`;
    const incomeGrowth =
      tier.typicalRealAfterTaxMedianIncomeGrowthPct == null
        ? 'N/A'
        : `${tier.typicalRealAfterTaxMedianIncomeGrowthPct >= 0 ? '+' : ''}${tier.typicalRealAfterTaxMedianIncomeGrowthPct.toFixed(2)}%`;

    lines.push(
      `| ${tier.tier} ` +
        `| ${tier.observations} ` +
        `| ${tier.jurisdictions} ` +
        `| ${life} ` +
        `| ${lifeGrowth} ` +
        `| ${incomeLevel} ` +
        `| ${incomeGrowth} ` +
        `| ${tier.lowSampleWarning ?? '—'} |`,
    );
  }
  lines.push('');

  lines.push('## Outcome-Level Results');
  lines.push('');
  lines.push('| Outcome | Direction | Weight | N | +/- | Mean r | Mean % Change | Optimal %GDP (Median) | IQR | Confidence |');
  lines.push('|---------|-----------|-------:|---:|-----|-------:|--------------:|----------------------:|-----|------------|');
  for (const outcome of data.outcomes) {
    const pctChange = `${outcome.meanPercentChange >= 0 ? '+' : ''}${outcome.meanPercentChange.toFixed(2)}%`;
    const iqr = `${outcome.p25OptimalPctGdp.toFixed(1)}-${outcome.p75OptimalPctGdp.toFixed(1)}`;
    lines.push(
      `| ${outcome.name} ` +
        `| ${outcome.direction === 'higher_better' ? 'Higher is better' : 'Lower is better (negated)'} ` +
        `| ${outcome.weight.toFixed(2)} ` +
        `| ${outcome.jurisdictionsAnalyzed} ` +
        `| ${outcome.positiveCount}/${outcome.negativeCount} ` +
        `| ${outcome.meanForwardPearson.toFixed(3)} ` +
        `| ${pctChange} ` +
        `| ${outcome.medianOptimalPctGdp.toFixed(1)} ` +
        `| ${iqr} ` +
        `| ${outcome.confidenceGrade} (${outcome.confidenceScore.toFixed(2)}) |`,
    );
  }
  lines.push('');

  lines.push('## Method');
  lines.push('');
  lines.push('- Run N-of-1 longitudinal causal analysis within each jurisdiction.');
  lines.push('- Estimate per-jurisdiction optimal predictor value from high-outcome periods.');
  lines.push('- Aggregate outcome-level medians and uncertainty bands (IQR).');
  lines.push(
    `- Build lag-aligned bin tables from predictor year t to outcome follow-up window t+${data.spendingLevelTable.alignment.onsetYears}..t+${data.spendingLevelTable.alignment.durationYears}.`,
  );
  lines.push(`- Combine outcomes via ${data.overall.weightingMethod}.`);
  lines.push('- Report start-year sensitivity to show temporal robustness of the estimate.');
  lines.push('');

  lines.push('## Limitations');
  lines.push('');
  lines.push('- This is cross-country observational panel analysis; confounding remains possible.');
  lines.push('- Government spending % GDP captures scale, not composition quality.');
  lines.push('- Real after-tax median income is currently proxied by GNI per-capita PPP (not direct median disposable income).');
  lines.push('- HALE growth and income-growth series are annualized derivatives and can be noisy in sparse panels.');
  lines.push('- Indicator revisions in source databases can shift historical estimates over time.');
  lines.push('');

  return lines.join('\n');
}

export async function generateGovernmentSizeAnalysisArtifacts(
  options: GovernmentSizeAnalysisOptions = {},
): Promise<GovernmentSizeAnalysisArtifacts> {
  const {
    outputDir = OUTPUT_DIR,
    writeFiles = true,
    logSummary = true,
    startYear = DEFAULT_START_YEAR,
    endYear = DEFAULT_END_YEAR,
    sensitivityStartYears = [...DEFAULT_SENSITIVITY_START_YEARS],
    jurisdictions = DEFAULT_JURISDICTIONS,
  } = options;

  const earliestStartYear = Math.min(startYear, ...sensitivityStartYears);
  const fetchWindow: YearWindow = {
    startYear: earliestStartYear,
    endYear,
  };

  const dataset = await fetchIndicatorDataset(fetchWindow, jurisdictions);
  const primaryWindow: YearWindow = { startYear, endYear };
  const primaryScenario = computeScenario(dataset, primaryWindow);
  const onsetYears = daysToWholeYears(CAUSAL_ONSET_DAYS);
  const durationYears = daysToWholeYears(CAUSAL_DURATION_DAYS);

  const panelRows = buildPanelRows(dataset, primaryWindow);
  const spendingObservations = buildLagAlignedSpendingObservations(
    panelRows,
    onsetYears,
    durationYears,
  );
  const adaptiveBins = buildAdaptiveNumericBins(
    spendingObservations.map(observation => observation.spendingPctGdp),
    ADAPTIVE_BIN_CONFIG,
  );
  const spendingLevelTable = summarizeSpendingPctGdpTiers(spendingObservations, adaptiveBins);

  const spendingPerCapitaValues = spendingObservations
    .map(observation => observation.spendingPerCapitaPpp)
    .filter((value): value is number => isFiniteNumber(value));
  const adaptivePerCapitaBins = buildAdaptiveNumericBins(
    spendingPerCapitaValues,
    ADAPTIVE_PER_CAPITA_BIN_CONFIG,
  );
  const spendingPerCapitaLevelTable = summarizeSpendingPerCapitaTiers(
    spendingObservations,
    adaptivePerCapitaBins,
  );

  const sensitivity = buildSensitivityScenarios(
    dataset,
    endYear,
    sensitivityStartYears,
    startYear,
  );

  const data: GovernmentSizeAnalysisData = {
    predictor: {
      id: 'government_expenditure_pct_gdp',
      name: 'Government Expenditure (% GDP)',
      definition: 'World Bank WDI GC.XPN.TOTL.GD.ZS',
      fields: ['GC.XPN.TOTL.GD.ZS'],
      coverage: primaryScenario.coverage,
    },
    outcomes: primaryScenario.outcomeAnalyses,
    sensitivity: {
      startYearScenarios: sensitivity,
      note: 'All scenarios use the same methodology and countries where data is available; only the start year changes.',
    },
    spendingLevelTable: {
      alignment: {
        type: 'lag_aligned_follow_up',
        onsetYears,
        durationYears,
        description:
          'Predictor is measured at year t; outcome summaries are medians over years t+onset through t+duration.',
      },
      healthyLifeYearsMetric: {
        isDirectMetric: true,
        metricUsed: 'WHO Healthy Life Expectancy (HALE)',
        note: 'Growth is derived as annualized percent change in HALE.',
      },
      incomeGrowthMetric: {
        isDirectMetric: false,
        metricUsed: 'Annualized growth of after-tax median income proxy (GNI per-capita PPP)',
        note: 'Direct global after-tax median income time series is not yet integrated in this panel.',
      },
      binning: {
        method: 'adaptive quantile bins with anchor constraints',
        targetBinCount: ADAPTIVE_BIN_CONFIG.targetBinCount,
        minBinSize: ADAPTIVE_BIN_CONFIG.minBinSize,
        anchors: [...ADAPTIVE_BIN_CONFIG.anchors],
        roundTo: ADAPTIVE_BIN_CONFIG.roundTo,
        binsGenerated: adaptiveBins.length,
      },
      tiers: spendingLevelTable,
    },
    spendingPerCapitaLevelTable: {
      definition: 'Government expenditure per-capita PPP derived as (%GDP / 100) * GDP per-capita PPP.',
      alignment: {
        type: 'lag_aligned_follow_up',
        onsetYears,
        durationYears,
        description:
          'Predictor is measured at year t; outcome summaries are medians over years t+onset through t+duration.',
      },
      binning: {
        method: 'adaptive quantile bins with anchor constraints',
        targetBinCount: ADAPTIVE_PER_CAPITA_BIN_CONFIG.targetBinCount,
        minBinSize: ADAPTIVE_PER_CAPITA_BIN_CONFIG.minBinSize,
        anchors: [...ADAPTIVE_PER_CAPITA_BIN_CONFIG.anchors],
        roundTo: ADAPTIVE_PER_CAPITA_BIN_CONFIG.roundTo,
        binsGenerated: adaptivePerCapitaBins.length,
      },
      tiers: spendingPerCapitaLevelTable,
    },
    overall: primaryScenario.overall,
    usSnapshot: primaryScenario.usSnapshot,
    generatedAt: new Date().toISOString(),
  };

  const markdown = buildMarkdown(data);
  const outputPaths = {
    markdown: path.join(outputDir, 'us-government-size-report.md'),
    json: path.join(outputDir, 'us-government-size-analysis.json'),
  };

  if (writeFiles) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPaths.markdown, markdown, 'utf-8');
    fs.writeFileSync(outputPaths.json, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Government size markdown written to ${outputPaths.markdown}`);
    console.log(`✅ Government size JSON written to ${outputPaths.json}`);
  }

  if (logSummary) {
    console.log('\n--- Government Size Analysis Summary ---');
    console.log(
      `Optimal spending share: ${data.overall.optimalPctGdp.toFixed(1)}% GDP ` +
        `(band ${data.overall.optimalBandLowPctGdp.toFixed(1)}-${data.overall.optimalBandHighPctGdp.toFixed(1)})`,
    );
    console.log(
      `US (${data.usSnapshot.latestYear}): ${data.usSnapshot.modeledSpendingPctGdp.toFixed(1)}% GDP ` +
        `(${data.usSnapshot.status})`,
    );
  }

  return {
    markdown,
    json: data,
    outputPaths,
  };
}

async function main(): Promise<void> {
  await generateGovernmentSizeAnalysisArtifacts();
}

main().catch(error => {
  console.error('Failed to generate government size analysis:', error);
  process.exitCode = 1;
});
