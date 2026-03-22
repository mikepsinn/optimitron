/**
 * Government Size Analysis (World Bank Panel, configurable window)
 *
 * Estimates an evidence-weighted optimal government spending share (% GDP)
 * using multi-jurisdiction N-of-1 causal analysis across four core outcomes:
 * HALE level/growth and best-available after-tax median income level/growth.
 *
 * Predictor:
 *   General government expenditure (% GDP)
 *   World Bank WDI: GC.XPN.TOTL.GD.ZS
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateBudgetAnalysisArtifacts,
  type BudgetAnalysisArtifacts,
} from './generate-budget-analysis.js';

import {
  runCountryAnalysis,
  scoreToGrade,
  type AnnualTimeSeries,
} from '@optimitron/obg';
import {
  buildAdaptiveNumericBins,
  partialCorrelation,
  pearsonCorrelation,
  type NumericBin,
} from '@optimitron/optimizer';

import {
  fetchers,
  TOP_COUNTRIES,
  type DataPoint,
} from '@optimitron/data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

const DEFAULT_START_YEAR = 1990;
const DEFAULT_END_YEAR = 2023;
const DEFAULT_SENSITIVITY_START_YEARS = [1990, 1995, 2000] as const;
const DEFAULT_JURISDICTIONS = [...TOP_COUNTRIES];
const CAUSAL_ONSET_DAYS = 365;
const CAUSAL_DURATION_DAYS = 1095;
const COVID_EXCLUDED_YEARS = new Set([2020, 2021]);
const HEADLINE_OUTCOME_IDS = new Set([
  'healthy_life_expectancy_years',
  'after_tax_median_income_ppp',
]);
const HEADLINE_SCORE_TOLERANCE = 0.35;
const FLOOR_TOLERANCES = [0.15, 0.35, 0.75] as const;

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
  meanPredictivePearson: number;
  meanPercentChange: number;
  meanBradfordHillStrength: number;
  positiveCount: number;
  negativeCount: number;
  jurisdictionsAnalyzed: number;
  jurisdictionsSkipped: number;
  medianOptimalPctGdp: number;
  p25OptimalPctGdp: number;
  p75OptimalPctGdp: number;
  confidenceScore: number;
  confidenceGrade: ReturnType<typeof scoreToGrade>;
  pooledPctGdpCorrelation: number | null;
  pooledPctGdpPartialCorrelation: number | null;
  pooledPerCapitaCorrelation: number | null;
  pooledPerCapitaPartialCorrelation: number | null;
  pooledObservationCount: number;
  headlineEligible: boolean;
  headlineEligibilityReason: string;
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
  usEquivalentOptimalPctGdp: number | null;
  usEquivalentBandLowPctGdp: number | null;
  usEquivalentBandHighPctGdp: number | null;
  usModeledSpendingPctGdp: number;
  usStatus: 'above_optimal_band' | 'below_optimal_band' | 'within_optimal_band';
  isPrimaryScenario: boolean;
}

interface ObjectiveFloor {
  id: string;
  name: string;
  outcomeIds: string[];
  tolerance: number;
  optimalPctGdp: number;
  optimalBandLowPctGdp: number;
  optimalBandHighPctGdp: number;
  optimalSpendingPerCapitaPpp: number;
  optimalBandLowPerCapitaPpp: number;
  optimalBandHighPerCapitaPpp: number;
  usEquivalentOptimalPctGdp: number | null;
  usEquivalentBandLowPctGdp: number | null;
  usEquivalentBandHighPctGdp: number | null;
  weightingMethod: string;
  floorMethod: string;
  headlineEligibleOutcomeIds: string[];
  excludedOutcomeIds: string[];
  qualifyingJurisdictions: number;
}

type ToleranceFloorScenario = ObjectiveFloor;

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
  metricNotes: string[];
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

interface EfficientJurisdiction {
  jurisdictionId: string;
  jurisdictionName: string;
  qualifyingObservations: number;
  medianSpendingPctGdp: number;
  medianSpendingPerCapitaPpp: number;
  medianHealthyLifeExpectancyYears: number | null;
  medianAfterTaxMedianIncomePpp: number | null;
}

interface FederalCompositionCategory {
  name: string;
  currentSpendingUsd: number;
  targetSpendingUsd: number;
  reallocationUsd: number;
  reallocationPct: number;
  evidenceGrade: string;
  action: string;
  isNonDiscretionary: boolean;
  targetSharePct: number;
}

interface FederalCompositionSummary {
  sourceBudgetLevel: string;
  fiscalYear: number;
  currentBudgetUsd: number;
  unconstrainedOptimalBudgetUsd: number;
  unconstrainedGapUsd: number;
  unconstrainedGapPct: number;
  compositionCaveat: string;
  topIncreaseCategories: FederalCompositionCategory[];
  topDecreaseCategories: FederalCompositionCategory[];
  largestTargetShares: FederalCompositionCategory[];
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
  objectiveFloors: ObjectiveFloor[];
  toleranceSensitivity: ToleranceFloorScenario[];
  sensitivity: {
    startYearScenarios: SensitivityScenario[];
    covidExcludedScenario: SensitivityScenario | null;
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
    optimalSpendingPerCapitaPpp: number;
    optimalBandLowPerCapitaPpp: number;
    optimalBandHighPerCapitaPpp: number;
    usEquivalentOptimalPctGdp: number | null;
    usEquivalentBandLowPctGdp: number | null;
    usEquivalentBandHighPctGdp: number | null;
    weightingMethod: string;
    floorMethod: string;
    headlineEligibleOutcomeIds: string[];
    excludedOutcomeIds: string[];
    qualifyingJurisdictions: number;
  };
  usSnapshot: {
    latestYear: number;
    modeledSpendingPctGdp: number;
    modeledGdpPerCapitaPpp: number | null;
    modeledSpendingPerCapitaPpp: number | null;
    gapToOptimalPctPoints: number;
    gapToOptimalSpendingPerCapitaPpp: number | null;
    status: 'above_optimal_band' | 'below_optimal_band' | 'within_optimal_band';
  };
  efficientJurisdictions: EfficientJurisdiction[];
  federalComposition: FederalCompositionSummary;
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
  objectiveFloors: ObjectiveFloor[];
  toleranceSensitivity: ToleranceFloorScenario[];
  overall: {
    optimalPctGdp: number;
    optimalBandLowPctGdp: number;
    optimalBandHighPctGdp: number;
    optimalSpendingPerCapitaPpp: number;
    optimalBandLowPerCapitaPpp: number;
    optimalBandHighPerCapitaPpp: number;
    usEquivalentOptimalPctGdp: number | null;
    usEquivalentBandLowPctGdp: number | null;
    usEquivalentBandHighPctGdp: number | null;
    weightingMethod: string;
    floorMethod: string;
    headlineEligibleOutcomeIds: string[];
    excludedOutcomeIds: string[];
    qualifyingJurisdictions: number;
  };
  usSnapshot: {
    latestYear: number;
    modeledSpendingPctGdp: number;
    modeledGdpPerCapitaPpp: number | null;
    modeledSpendingPerCapitaPpp: number | null;
    gapToOptimalPctPoints: number;
    gapToOptimalSpendingPerCapitaPpp: number | null;
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
  gdpPerCapitaPpp: number | null;
  healthyLifeExpectancyYears: number | null;
  healthyLifeExpectancyGrowthPct: number | null;
  afterTaxMedianIncomePpp: number | null;
  afterTaxMedianIncomeGrowthPct: number | null;
}

interface FloorBenchmark {
  optimalPctGdp: number;
  optimalBandLowPctGdp: number;
  optimalBandHighPctGdp: number;
  optimalSpendingPerCapitaPpp: number;
  optimalBandLowPerCapitaPpp: number;
  optimalBandHighPerCapitaPpp: number;
  usEquivalentOptimalPctGdp: number | null;
  usEquivalentBandLowPctGdp: number | null;
  usEquivalentBandHighPctGdp: number | null;
  weightingMethod: string;
  floorMethod: string;
  headlineEligibleOutcomeIds: string[];
  excludedOutcomeIds: string[];
  qualifyingJurisdictions: number;
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
    name: 'After-Tax Median Income (PPP)',
    sourceKey: 'afterTaxMedianIncomePpp',
    direction: 'higher_better',
    weight: 0.25,
    unit: 'international $',
  },
  {
    id: 'after_tax_median_income_growth_yoy_pct',
    name: 'After-Tax Median Income Growth (Annualized %)',
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
const ISO3_NAMES: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  CAN: 'Canada',
  AUS: 'Australia',
  DEU: 'Germany',
  FRA: 'France',
  JPN: 'Japan',
  KOR: 'South Korea',
  SGP: 'Singapore',
  NZL: 'New Zealand',
  NOR: 'Norway',
  SWE: 'Sweden',
  DNK: 'Denmark',
  FIN: 'Finland',
  NLD: 'Netherlands',
  BEL: 'Belgium',
  AUT: 'Austria',
  CHE: 'Switzerland',
  IRL: 'Ireland',
  ISR: 'Israel',
  ITA: 'Italy',
  ESP: 'Spain',
  PRT: 'Portugal',
  GRC: 'Greece',
  CZE: 'Czech Republic',
  POL: 'Poland',
  HUN: 'Hungary',
  SVK: 'Slovakia',
  SVN: 'Slovenia',
  EST: 'Estonia',
  LTU: 'Lithuania',
  LVA: 'Latvia',
  CHL: 'Chile',
  MEX: 'Mexico',
  COL: 'Colombia',
  BRA: 'Brazil',
  ARG: 'Argentina',
  ZAF: 'South Africa',
  TUR: 'Turkey',
  IND: 'India',
  CHN: 'China',
  IDN: 'Indonesia',
  THA: 'Thailand',
  MYS: 'Malaysia',
  PHL: 'Philippines',
  VNM: 'Vietnam',
  RUS: 'Russia',
  UKR: 'Ukraine',
  EGY: 'Egypt',
  NGA: 'Nigeria',
};

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

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = avg(values.map(value => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function withinWindow(year: number, window: YearWindow): boolean {
  return year >= window.startYear && year <= window.endYear;
}

function toPerCapitaPpp(
  spendingPctGdp: number,
  gdpPerCapitaPpp: number | null,
): number | null {
  if (!isFiniteNumber(spendingPctGdp) || !isFiniteNumber(gdpPerCapitaPpp)) return null;
  return (spendingPctGdp / 100) * gdpPerCapitaPpp;
}

function toPctGdpEquivalent(
  spendingPerCapitaPpp: number,
  gdpPerCapitaPpp: number | null,
): number | null {
  if (
    !isFiniteNumber(spendingPerCapitaPpp) ||
    !isFiniteNumber(gdpPerCapitaPpp) ||
    gdpPerCapitaPpp <= 0
  ) {
    return null;
  }
  return (spendingPerCapitaPpp / gdpPerCapitaPpp) * 100;
}

function keyFor(jurisdictionIso3: string, year: number): string {
  return `${jurisdictionIso3}::${year}`;
}

function filterDataPoints(points: DataPoint[], window: YearWindow): DataPoint[] {
  return points.filter(point => withinWindow(point.year, window) && isFiniteNumber(point.value));
}

function excludeYears(points: DataPoint[], years: Set<number>): DataPoint[] {
  return points.filter(point => !years.has(point.year));
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

function getObservationOutcomeValue(
  observation: SpendingObservation,
  sourceKey: OutcomeSourceKey,
): number | null {
  switch (sourceKey) {
    case 'healthyLifeExpectancy':
      return observation.healthyLifeExpectancyYears;
    case 'healthyLifeExpectancyGrowthPct':
      return observation.healthyLifeExpectancyGrowthPct;
    case 'afterTaxMedianIncomePpp':
      return observation.afterTaxMedianIncomePpp;
    case 'afterTaxMedianIncomeGrowthPct':
      return observation.afterTaxMedianIncomeGrowthPct;
  }
}

function headlineEligibilityReason(outcome: OutcomeAnalysis): string {
  if (!HEADLINE_OUTCOME_IDS.has(outcome.id)) {
    return 'Excluded from headline because this outcome is a growth diagnostic.';
  }
  if (outcome.meanPercentChange <= 0) {
    return 'Excluded from headline because change-from-baseline is non-positive.';
  }
  const positivePartialSignal =
    (outcome.pooledPctGdpPartialCorrelation ?? Number.NEGATIVE_INFINITY) > 0.05 ||
    (outcome.pooledPerCapitaPartialCorrelation ?? Number.NEGATIVE_INFINITY) > 0.05;
  if (outcome.meanPredictivePearson <= 0.02 && !positivePartialSignal) {
    return 'Excluded from headline because directionality is weak and the confound-adjusted pooled signal is not positive.';
  }
  if (outcome.confidenceScore < 0.3) {
    return 'Excluded from headline because the Bradford-Hill confidence score is too low.';
  }
  return 'Eligible for headline floor benchmark.';
}

function iso3Name(iso3: string): string {
  return ISO3_NAMES[iso3] ?? iso3;
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
    fetchers.fetchAfterTaxMedianIncomePpp(options),
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

function filterIndicatorDataset(
  dataset: IndicatorDataset,
  excludedYears: Set<number>,
): IndicatorDataset {
  return {
    predictor: excludeYears(dataset.predictor, excludedYears),
    gdpPerCapita: excludeYears(dataset.gdpPerCapita, excludedYears),
    healthyLifeExpectancy: excludeYears(dataset.healthyLifeExpectancy, excludedYears),
    healthyLifeExpectancyGrowthPct: excludeYears(dataset.healthyLifeExpectancyGrowthPct, excludedYears),
    afterTaxMedianIncomePpp: excludeYears(dataset.afterTaxMedianIncomePpp, excludedYears),
    afterTaxMedianIncomeGrowthPct: excludeYears(dataset.afterTaxMedianIncomeGrowthPct, excludedYears),
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
      jurisdictionName: iso3Name(iso3),
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
  const meanPredictivePearson = avg(
    result.jurisdictions.map(jurisdiction => jurisdiction.analysis.predictivePearson),
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
    meanPredictivePearson,
    meanPercentChange: aggregate.meanPercentChange,
    meanBradfordHillStrength: aggregate.meanBradfordHill.strength,
    positiveCount: aggregate.positiveCount,
    negativeCount: aggregate.negativeCount,
    jurisdictionsAnalyzed: aggregate.n,
    jurisdictionsSkipped: aggregate.skipped,
    medianOptimalPctGdp: quantile(optimals, 0.5),
    p25OptimalPctGdp: quantile(optimals, 0.25),
    p75OptimalPctGdp: quantile(optimals, 0.75),
    confidenceScore,
    confidenceGrade: scoreToGrade(confidenceScore),
    pooledPctGdpCorrelation: null,
    pooledPctGdpPartialCorrelation: null,
    pooledPerCapitaCorrelation: null,
    pooledPerCapitaPartialCorrelation: null,
    pooledObservationCount: 0,
    headlineEligible: false,
    headlineEligibilityReason: 'Headline diagnostics have not been computed yet.',
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
    'Government Expense (% GDP)',
    '% GDP',
  );

  const panelRows = buildPanelRows(dataset, window);
  const spendingObservations = buildLagAlignedSpendingObservations(
    panelRows,
    daysToWholeYears(CAUSAL_ONSET_DAYS),
    daysToWholeYears(CAUSAL_DURATION_DAYS),
  );
  const outcomeAnalyses = enrichOutcomeAnalyses(
    OUTCOMES.map(spec => analyzeOutcome(spec, predictors, dataset, window)),
    spendingObservations,
  );
  const overallBase = computeFloorBenchmark(outcomeAnalyses, spendingObservations);

  const usaRows = predictorPoints
    .filter(point => point.jurisdictionIso3 === 'USA')
    .sort((a, b) => b.year - a.year);
  const gdpPerCapitaMap = byCountryYear(filterDataPoints(dataset.gdpPerCapita, window));

  const latestUs = usaRows[0];
  if (!latestUs || !isFiniteNumber(latestUs.value)) {
    throw new Error('No USA predictor data found for government expenditure analysis');
  }
  const latestUsGdpPerCapitaPpp = gdpPerCapitaMap.get(keyFor('USA', latestUs.year)) ?? null;
  const latestUsPerCapita = toPerCapitaPpp(latestUs.value, latestUsGdpPerCapitaPpp);
  const overall: ScenarioAnalysis['overall'] = attachUsEquivalentFloor(
    overallBase,
    latestUsGdpPerCapitaPpp,
  );
  const objectiveFloors = buildObjectiveFloors(
    outcomeAnalyses,
    spendingObservations,
    latestUsGdpPerCapitaPpp,
  );
  const toleranceSensitivity = buildToleranceSensitivity(
    outcomeAnalyses,
    spendingObservations,
    latestUsGdpPerCapitaPpp,
  );

  const usGapToOptimal = latestUs.value - (overall.usEquivalentOptimalPctGdp ?? overall.optimalPctGdp);
  const usGapToOptimalPerCapita =
    latestUsPerCapita == null ? null : latestUsPerCapita - overall.optimalSpendingPerCapitaPpp;
  let status: ScenarioAnalysis['usSnapshot']['status'] = 'within_optimal_band';
  if (latestUsPerCapita != null) {
    if (latestUsPerCapita > overall.optimalBandHighPerCapitaPpp) {
      status = 'above_optimal_band';
    } else if (latestUsPerCapita < overall.optimalBandLowPerCapitaPpp) {
      status = 'below_optimal_band';
    }
  } else if (overall.usEquivalentBandLowPctGdp != null && overall.usEquivalentBandHighPctGdp != null) {
    if (latestUs.value > overall.usEquivalentBandHighPctGdp) {
      status = 'above_optimal_band';
    } else if (latestUs.value < overall.usEquivalentBandLowPctGdp) {
      status = 'below_optimal_band';
    }
  } else {
    if (latestUs.value > overall.optimalBandHighPctGdp) {
      status = 'above_optimal_band';
    } else if (latestUs.value < overall.optimalBandLowPctGdp) {
      status = 'below_optimal_band';
    }
  }

  const years = [...new Set(predictorPoints.map(point => point.year))];
  const jurisdictions = new Set(predictorPoints.map(point => point.jurisdictionIso3));

  return {
    outcomeAnalyses,
    objectiveFloors,
    toleranceSensitivity,
    overall,
    usSnapshot: {
      latestYear: latestUs.year,
      modeledSpendingPctGdp: latestUs.value,
      modeledGdpPerCapitaPpp: latestUsGdpPerCapitaPpp,
      modeledSpendingPerCapitaPpp: latestUsPerCapita,
      gapToOptimalPctPoints: usGapToOptimal,
      gapToOptimalSpendingPerCapitaPpp: usGapToOptimalPerCapita,
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
        spendingPerCapitaPpp: toPerCapitaPpp(row.predictorPctGdp, row.gdpPerCapitaPpp),
        gdpPerCapitaPpp: row.gdpPerCapitaPpp,
        healthyLifeExpectancyYears,
        healthyLifeExpectancyGrowthPct,
        afterTaxMedianIncomePpp,
        afterTaxMedianIncomeGrowthPct,
      });
    }
  }

  return observations;
}

function enrichOutcomeAnalyses(
  outcomes: OutcomeAnalysis[],
  observations: SpendingObservation[],
): OutcomeAnalysis[] {
  return outcomes.map((outcome) => {
    const spec = OUTCOMES.find(candidate => candidate.id === outcome.id);
    if (!spec) return outcome;

    const validRows = observations.filter((observation) => {
      const outcomeValue = getObservationOutcomeValue(observation, spec.sourceKey);
      return (
        isFiniteNumber(outcomeValue) &&
        isFiniteNumber(observation.spendingPctGdp) &&
        isFiniteNumber(observation.spendingPerCapitaPpp) &&
        isFiniteNumber(observation.gdpPerCapitaPpp)
      );
    });

    const pct = validRows.map(row => row.spendingPctGdp);
    const ppp = validRows
      .map(row => row.spendingPerCapitaPpp)
      .filter((value): value is number => isFiniteNumber(value));
    const outcomeValues = validRows
      .map(row => getObservationOutcomeValue(row, spec.sourceKey))
      .filter((value): value is number => isFiniteNumber(value));
    const gdp = validRows
      .map(row => row.gdpPerCapitaPpp)
      .filter((value): value is number => isFiniteNumber(value));

    const pooledPctGdpCorrelation =
      pct.length >= 3 ? pearsonCorrelation(pct, outcomeValues) : NaN;
    const pooledPerCapitaCorrelation =
      ppp.length >= 3 ? pearsonCorrelation(ppp, outcomeValues) : NaN;
    const pooledPctGdpPartialCorrelation =
      pct.length >= 3 ? partialCorrelation(pct, outcomeValues, gdp) : NaN;
    const pooledPerCapitaPartialCorrelation =
      ppp.length >= 3 ? partialCorrelation(ppp, outcomeValues, gdp) : NaN;

    const enriched: OutcomeAnalysis = {
      ...outcome,
      pooledPctGdpCorrelation: Number.isFinite(pooledPctGdpCorrelation)
        ? pooledPctGdpCorrelation
        : null,
      pooledPctGdpPartialCorrelation: Number.isFinite(pooledPctGdpPartialCorrelation)
        ? pooledPctGdpPartialCorrelation
        : null,
      pooledPerCapitaCorrelation: Number.isFinite(pooledPerCapitaCorrelation)
        ? pooledPerCapitaCorrelation
        : null,
      pooledPerCapitaPartialCorrelation: Number.isFinite(pooledPerCapitaPartialCorrelation)
        ? pooledPerCapitaPartialCorrelation
        : null,
      pooledObservationCount: validRows.length,
    };

    return {
      ...enriched,
      headlineEligible: headlineEligibilityReason(enriched) === 'Eligible for headline floor benchmark.',
      headlineEligibilityReason: headlineEligibilityReason(enriched),
    };
  });
}

function zScoreMap(valuesById: Map<string, number>): Map<string, number> {
  const values = [...valuesById.values()];
  const mean = avg(values);
  const sd = stddev(values);
  return new Map(
    [...valuesById.entries()].map(([id, value]) => [id, sd === 0 ? 0 : (value - mean) / sd]),
  );
}

function emptyFloorBenchmark(outcomes: OutcomeAnalysis[], reason: string): FloorBenchmark {
  return {
    optimalPctGdp: 0,
    optimalBandLowPctGdp: 0,
    optimalBandHighPctGdp: 0,
    optimalSpendingPerCapitaPpp: 0,
    optimalBandLowPerCapitaPpp: 0,
    optimalBandHighPerCapitaPpp: 0,
    usEquivalentOptimalPctGdp: null,
    usEquivalentBandLowPctGdp: null,
    usEquivalentBandHighPctGdp: null,
    weightingMethod: reason,
    floorMethod: reason,
    headlineEligibleOutcomeIds: [],
    excludedOutcomeIds: outcomes.map(outcome => outcome.id),
    qualifyingJurisdictions: 0,
  };
}

function computeFloorBenchmark(
  outcomes: OutcomeAnalysis[],
  observations: SpendingObservation[],
  options: {
    outcomeIds?: string[];
    tolerance?: number;
    requireEligible?: boolean;
  } = {},
): FloorBenchmark {
  const tolerance = options.tolerance ?? HEADLINE_SCORE_TOLERANCE;
  const configuredOutcomes = options.outcomeIds == null
    ? null
    : outcomes.filter(outcome => options.outcomeIds?.includes(outcome.id));
  const eligibleConfiguredOutcomes = configuredOutcomes?.filter(outcome => outcome.headlineEligible) ?? [];
  const eligibleOutcomes = outcomes.filter(outcome => outcome.headlineEligible);
  const headlineOutcomes =
    configuredOutcomes == null
      ? eligibleOutcomes.length > 0
        ? eligibleOutcomes
        : outcomes.filter(outcome => HEADLINE_OUTCOME_IDS.has(outcome.id))
      : options.requireEligible === false || eligibleConfiguredOutcomes.length === 0
        ? configuredOutcomes
        : eligibleConfiguredOutcomes;

  const spendingPerCapitaValues = observations
    .map(observation => observation.spendingPerCapitaPpp)
    .filter((value): value is number => isFiniteNumber(value));

  if (headlineOutcomes.length === 0 || spendingPerCapitaValues.length === 0) {
    return emptyFloorBenchmark(outcomes, 'No minimum-efficient floor could be derived.');
  }

  const bins = buildAdaptiveNumericBins(
    spendingPerCapitaValues,
    ADAPTIVE_PER_CAPITA_BIN_CONFIG,
  );

  const scoredBins = bins.map((bin, index) => {
    const isLast = index === bins.length - 1;
    const matches = observations.filter((observation) => {
      if (!isFiniteNumber(observation.spendingPerCapitaPpp)) return false;
      return observation.spendingPerCapitaPpp >= bin.lowerBound &&
        (isLast
          ? observation.spendingPerCapitaPpp <= bin.upperBound
          : observation.spendingPerCapitaPpp < bin.upperBound);
    });

    return {
      bin,
      matches,
      outcomeMedians: new Map(
        headlineOutcomes.map(outcome => {
          const spec = OUTCOMES.find(candidate => candidate.id === outcome.id)!;
          const values = matches
            .map(observation => getObservationOutcomeValue(observation, spec.sourceKey))
            .filter((value): value is number => isFiniteNumber(value));
          return [outcome.id, quantileOrNull(values, 0.5) ?? NaN];
        }),
      ),
    };
  }).filter(bin => bin.matches.length > 0);

  const outcomeScores = headlineOutcomes.map((outcome) => {
    const rawValues = new Map<string, number>();
    for (const scoredBin of scoredBins) {
      const value = scoredBin.outcomeMedians.get(outcome.id);
      if (isFiniteNumber(value)) rawValues.set(scoredBin.bin.lowerBound.toString(), value);
    }
    return {
      outcome,
      zScores: zScoreMap(rawValues),
    };
  });

  const scored = scoredBins.map((scoredBin) => {
    const key = scoredBin.bin.lowerBound.toString();
    const components = outcomeScores.map(score => ({
      weight: score.outcome.weight,
      value: score.zScores.get(key) ?? 0,
    }));
    const composite = weightedMean(components);
    return {
      ...scoredBin,
      compositeScore: composite,
    };
  });

  const bestScore = Math.max(...scored.map(entry => entry.compositeScore));
  const qualifyingBins = scored
    .filter(entry => entry.compositeScore >= bestScore - tolerance)
    .sort((a, b) => a.bin.lowerBound - b.bin.lowerBound);
  const floorBin = qualifyingBins[0] ?? scored.sort((a, b) => a.bin.lowerBound - b.bin.lowerBound)[0]!;
  const floorObservations = floorBin.matches;
  const qualifyingObservations = qualifyingBins.flatMap(entry => entry.matches);

  const floorPctValues = floorObservations.map(observation => observation.spendingPctGdp);
  const floorPerCapitaValues = floorObservations
    .map(observation => observation.spendingPerCapitaPpp)
    .filter((value): value is number => isFiniteNumber(value));

  return {
    optimalPctGdp: quantile(floorPctValues, 0.5),
    optimalBandLowPctGdp: quantile(floorPctValues, 0.25),
    optimalBandHighPctGdp: quantile(floorPctValues, 0.75),
    optimalSpendingPerCapitaPpp: quantile(floorPerCapitaValues, 0.5),
    optimalBandLowPerCapitaPpp: floorBin.bin.lowerBound,
    optimalBandHighPerCapitaPpp: floorBin.bin.upperBound,
    usEquivalentOptimalPctGdp: null,
    usEquivalentBandLowPctGdp: null,
    usEquivalentBandHighPctGdp: null,
    weightingMethod:
      'Composite z-score across selected direct-welfare outcomes, weighted by outcome weights.',
    floorMethod:
      `Lowest per-capita PPP spending bin within ${tolerance.toFixed(2)} composite-score units of the best bin.`,
    headlineEligibleOutcomeIds: headlineOutcomes.map(outcome => outcome.id),
    excludedOutcomeIds: outcomes
      .filter(outcome => !headlineOutcomes.some(eligible => eligible.id === outcome.id))
      .map(outcome => outcome.id),
    qualifyingJurisdictions: new Set(
      qualifyingObservations.map(observation => observation.jurisdictionIso3),
    ).size,
  };
}

function attachUsEquivalentFloor(
  floor: FloorBenchmark,
  gdpPerCapitaPpp: number | null,
): FloorBenchmark {
  return {
    ...floor,
    usEquivalentOptimalPctGdp: toPctGdpEquivalent(floor.optimalSpendingPerCapitaPpp, gdpPerCapitaPpp),
    usEquivalentBandLowPctGdp: toPctGdpEquivalent(floor.optimalBandLowPerCapitaPpp, gdpPerCapitaPpp),
    usEquivalentBandHighPctGdp: toPctGdpEquivalent(floor.optimalBandHighPerCapitaPpp, gdpPerCapitaPpp),
  };
}

function buildObjectiveFloors(
  outcomes: OutcomeAnalysis[],
  observations: SpendingObservation[],
  gdpPerCapitaPpp: number | null,
): ObjectiveFloor[] {
  const definitions = [
    {
      id: 'combined_direct_welfare',
      name: 'Combined Direct Welfare',
      outcomeIds: ['healthy_life_expectancy_years', 'after_tax_median_income_ppp'],
    },
    {
      id: 'hale_only',
      name: 'Healthy Life Expectancy Only',
      outcomeIds: ['healthy_life_expectancy_years'],
    },
    {
      id: 'income_only',
      name: 'Income Proxy Only',
      outcomeIds: ['after_tax_median_income_ppp'],
    },
  ] as const;

  return definitions.map((definition) => {
    const floor = attachUsEquivalentFloor(
      computeFloorBenchmark(outcomes, observations, {
        outcomeIds: [...definition.outcomeIds],
        tolerance: HEADLINE_SCORE_TOLERANCE,
        requireEligible: false,
      }),
      gdpPerCapitaPpp,
    );
    return {
      id: definition.id,
      name: definition.name,
      outcomeIds: [...definition.outcomeIds],
      tolerance: HEADLINE_SCORE_TOLERANCE,
      ...floor,
    };
  });
}

function buildToleranceSensitivity(
  outcomes: OutcomeAnalysis[],
  observations: SpendingObservation[],
  gdpPerCapitaPpp: number | null,
): ToleranceFloorScenario[] {
  const combinedOutcomeIds = ['healthy_life_expectancy_years', 'after_tax_median_income_ppp'];
  return FLOOR_TOLERANCES.map((tolerance) => {
    const floor = attachUsEquivalentFloor(
      computeFloorBenchmark(outcomes, observations, {
        outcomeIds: combinedOutcomeIds,
        tolerance,
        requireEligible: false,
      }),
      gdpPerCapitaPpp,
    );
    return {
      id: `tolerance_${tolerance.toFixed(2)}`,
      name: `Combined Direct Welfare (tol ${tolerance.toFixed(2)})`,
      outcomeIds: combinedOutcomeIds,
      tolerance,
      ...floor,
    };
  });
}

function buildFederalCompositionSummary(
  budgetArtifacts: BudgetAnalysisArtifacts,
): FederalCompositionSummary {
  const currentBudgetUsd = budgetArtifacts.websiteData.totalBudget;
  const unconstrainedOptimalBudgetUsd = budgetArtifacts.result.totalOptimalUsd;
  const constrained = budgetArtifacts.websiteData.constrainedReallocation.categories;
  const targetShareDenominator = Math.max(currentBudgetUsd, 1);
  const categories: FederalCompositionCategory[] = constrained.map(category => ({
    name: category.name,
    currentSpendingUsd: category.currentSpending,
    targetSpendingUsd: category.constrainedOptimal,
    reallocationUsd: category.reallocation,
    reallocationPct: category.reallocationPercent,
    evidenceGrade: category.evidenceGrade,
    action: category.action,
    isNonDiscretionary: category.isNonDiscretionary,
    targetSharePct: (category.constrainedOptimal / targetShareDenominator) * 100,
  }));

  const actionable = categories.filter(category =>
    !category.isNonDiscretionary && category.evidenceGrade !== 'F',
  );

  return {
    sourceBudgetLevel: `US federal budget FY${budgetArtifacts.result.fiscalYear}`,
    fiscalYear: budgetArtifacts.result.fiscalYear,
    currentBudgetUsd,
    unconstrainedOptimalBudgetUsd,
    unconstrainedGapUsd: unconstrainedOptimalBudgetUsd - currentBudgetUsd,
    unconstrainedGapPct: currentBudgetUsd > 0
      ? ((unconstrainedOptimalBudgetUsd - currentBudgetUsd) / currentBudgetUsd) * 100
      : 0,
    compositionCaveat:
      'This composition model is federal-budget only; the category table below is constrained to the current federal budget even though standalone category optima sum to a different total.',
    topIncreaseCategories: actionable
      .filter(category => category.reallocationUsd > 0)
      .sort((a, b) => b.reallocationUsd - a.reallocationUsd)
      .slice(0, 5),
    topDecreaseCategories: actionable
      .filter(category => category.reallocationUsd < 0)
      .sort((a, b) => a.reallocationUsd - b.reallocationUsd)
      .slice(0, 5),
    largestTargetShares: [...categories]
      .sort((a, b) => b.targetSharePct - a.targetSharePct)
      .slice(0, 8),
  };
}

function computeEfficientJurisdictions(
  observations: SpendingObservation[],
  overall: ScenarioAnalysis['overall'],
): EfficientJurisdiction[] {
  const benchmarkOutcomeIds = overall.headlineEligibleOutcomeIds.length > 0
    ? new Set(overall.headlineEligibleOutcomeIds)
    : HEADLINE_OUTCOME_IDS;
  const qualifying = observations.filter((observation) => {
    if (!isFiniteNumber(observation.spendingPerCapitaPpp)) return false;
    return observation.spendingPerCapitaPpp >= overall.optimalBandLowPerCapitaPpp &&
      observation.spendingPerCapitaPpp <= overall.optimalBandHighPerCapitaPpp;
  });

  const byJurisdiction = new Map<string, SpendingObservation[]>();
  for (const observation of qualifying) {
    const existing = byJurisdiction.get(observation.jurisdictionIso3);
    if (existing) {
      existing.push(observation);
    } else {
      byJurisdiction.set(observation.jurisdictionIso3, [observation]);
    }
  }

  const base = [...byJurisdiction.entries()]
    .map(([jurisdictionIso3, rows]) => ({
      jurisdictionId: jurisdictionIso3,
      jurisdictionName: iso3Name(jurisdictionIso3),
      qualifyingObservations: rows.length,
      medianSpendingPctGdp: quantile(rows.map(row => row.spendingPctGdp), 0.5),
      medianSpendingPerCapitaPpp: quantile(
        rows
          .map(row => row.spendingPerCapitaPpp)
          .filter((value): value is number => isFiniteNumber(value)),
        0.5,
      ),
      medianHealthyLifeExpectancyYears: quantileOrNull(
        rows
          .map(row => row.healthyLifeExpectancyYears)
          .filter((value): value is number => isFiniteNumber(value)),
        0.5,
      ),
      medianAfterTaxMedianIncomePpp: quantileOrNull(
        rows
          .map(row => row.afterTaxMedianIncomePpp)
          .filter((value): value is number => isFiniteNumber(value)),
        0.5,
      ),
    }))
    .filter(jurisdiction => jurisdiction.qualifyingObservations >= 2);

  if (base.length === 0) return [];

  const haleScores = zScoreMap(
    new Map(
      base
        .filter((jurisdiction) => jurisdiction.medianHealthyLifeExpectancyYears != null)
        .map(jurisdiction => [
          jurisdiction.jurisdictionId,
          jurisdiction.medianHealthyLifeExpectancyYears!,
        ]),
    ),
  );
  const incomeScores = zScoreMap(
    new Map(
      base
        .filter((jurisdiction) => jurisdiction.medianAfterTaxMedianIncomePpp != null)
        .map(jurisdiction => [
          jurisdiction.jurisdictionId,
          jurisdiction.medianAfterTaxMedianIncomePpp!,
        ]),
    ),
  );

  const scored = base
    .map((jurisdiction) => {
      const components: number[] = [];
      if (
        benchmarkOutcomeIds.has('healthy_life_expectancy_years') &&
        jurisdiction.medianHealthyLifeExpectancyYears != null
      ) {
        components.push(haleScores.get(jurisdiction.jurisdictionId) ?? 0);
      }
      if (
        benchmarkOutcomeIds.has('after_tax_median_income_ppp') &&
        jurisdiction.medianAfterTaxMedianIncomePpp != null
      ) {
        components.push(incomeScores.get(jurisdiction.jurisdictionId) ?? 0);
      }
      return {
        ...jurisdiction,
        benchmarkScore: components.length > 0 ? avg(components) : Number.NEGATIVE_INFINITY,
      };
    })
    .filter(jurisdiction => Number.isFinite(jurisdiction.benchmarkScore));

  const selected = (scored.filter(jurisdiction => jurisdiction.benchmarkScore >= 0).length >= 3
    ? scored.filter(jurisdiction => jurisdiction.benchmarkScore >= 0)
    : [...scored].sort((a, b) => b.benchmarkScore - a.benchmarkScore)
  )
    .sort(
      (a, b) =>
        a.medianSpendingPerCapitaPpp - b.medianSpendingPerCapitaPpp ||
        b.benchmarkScore - a.benchmarkScore,
    )
    .slice(0, 8);

  return selected.map(({ benchmarkScore: _benchmarkScore, ...jurisdiction }) => jurisdiction);
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
    metricNotes: [
      'Healthy life years level: WHO Healthy Life Expectancy (HALE).',
      'Healthy life years growth: annualized percent growth of HALE.',
      'Real after-tax median income level: OECD direct after-tax disposable income where available, with World Bank PIP real median-income fallback elsewhere.',
      'Real after-tax median income growth: annualized percent growth of the best-available level series.',
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
      usEquivalentOptimalPctGdp: scenario.overall.usEquivalentOptimalPctGdp,
      usEquivalentBandLowPctGdp: scenario.overall.usEquivalentBandLowPctGdp,
      usEquivalentBandHighPctGdp: scenario.overall.usEquivalentBandHighPctGdp,
      usModeledSpendingPctGdp: scenario.usSnapshot.modeledSpendingPctGdp,
      usStatus: scenario.usSnapshot.status,
      isPrimaryScenario: startYear === primaryStartYear,
    };
  });
}

function buildCovidExcludedScenario(
  dataset: IndicatorDataset,
  window: YearWindow,
): SensitivityScenario | null {
  const filtered = filterIndicatorDataset(dataset, COVID_EXCLUDED_YEARS);
  const scenario = computeScenario(filtered, window);

  return {
    startYear: window.startYear,
    endYear: window.endYear,
    observations: scenario.coverage.observations,
    jurisdictions: scenario.coverage.jurisdictions,
    optimalPctGdp: scenario.overall.optimalPctGdp,
    optimalBandLowPctGdp: scenario.overall.optimalBandLowPctGdp,
    optimalBandHighPctGdp: scenario.overall.optimalBandHighPctGdp,
    usEquivalentOptimalPctGdp: scenario.overall.usEquivalentOptimalPctGdp,
    usEquivalentBandLowPctGdp: scenario.overall.usEquivalentBandLowPctGdp,
    usEquivalentBandHighPctGdp: scenario.overall.usEquivalentBandHighPctGdp,
    usModeledSpendingPctGdp: scenario.usSnapshot.modeledSpendingPctGdp,
    usStatus: scenario.usSnapshot.status,
    isPrimaryScenario: false,
  };
}

function buildMarkdown(data: GovernmentSizeAnalysisData): string {
  const lines: string[] = [];
  const lowestObjectiveFloor = [...data.objectiveFloors]
    .filter(objective => objective.usEquivalentOptimalPctGdp != null)
    .sort((a, b) => (a.usEquivalentOptimalPctGdp ?? Infinity) - (b.usEquivalentOptimalPctGdp ?? Infinity))[0];

  lines.push(
    `# Government Size Analysis: World Bank Panel (${data.predictor.coverage.yearMin}-${data.predictor.coverage.yearMax})`,
  );
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(
    `Lag-aligned panel diagnostics suggest a **minimum efficient government spending floor** ` +
      `around **${formatUsd(data.overall.optimalSpendingPerCapitaPpp)} PPP per capita** ` +
      `(support bin **${formatUsd(data.overall.optimalBandLowPerCapitaPpp)} - ${formatUsd(data.overall.optimalBandHighPerCapitaPpp)}**).`,
  );
  lines.push('');
  if (
    data.overall.usEquivalentOptimalPctGdp != null &&
    data.overall.usEquivalentBandLowPctGdp != null &&
    data.overall.usEquivalentBandHighPctGdp != null
  ) {
    lines.push(
      `- **U.S.-equivalent floor share:** ${data.overall.usEquivalentOptimalPctGdp.toFixed(1)}% of GDP ` +
        `(band ${data.overall.usEquivalentBandLowPctGdp.toFixed(1)}-${data.overall.usEquivalentBandHighPctGdp.toFixed(1)})`,
    );
  }
  lines.push(
    `- **Cross-country floor-bin median share (descriptive only):** ${data.overall.optimalPctGdp.toFixed(1)}% of GDP ` +
      `(IQR ${data.overall.optimalBandLowPctGdp.toFixed(1)}-${data.overall.optimalBandHighPctGdp.toFixed(1)})`,
  );
  lines.push(
    `- **US latest spending share (${data.usSnapshot.latestYear}):** ${data.usSnapshot.modeledSpendingPctGdp.toFixed(1)}%`,
  );
  if (data.usSnapshot.modeledGdpPerCapitaPpp != null) {
    lines.push(
      `- **US latest GDP per-capita PPP (${data.usSnapshot.latestYear}):** ${formatUsd(data.usSnapshot.modeledGdpPerCapitaPpp)}`,
    );
  }
  if (data.usSnapshot.modeledSpendingPerCapitaPpp != null) {
    lines.push(
      `- **US latest spending per-capita PPP (${data.usSnapshot.latestYear}):** ${formatUsd(data.usSnapshot.modeledSpendingPerCapitaPpp)}`,
    );
  }
  lines.push(
    `- **US gap to U.S.-equivalent floor:** ${
      data.usSnapshot.gapToOptimalPctPoints >= 0 ? '+' : ''
    }${data.usSnapshot.gapToOptimalPctPoints.toFixed(1)} percentage points`,
  );
  if (data.usSnapshot.gapToOptimalSpendingPerCapitaPpp != null) {
    lines.push(
      `- **US gap to per-capita floor estimate:** ${
        data.usSnapshot.gapToOptimalSpendingPerCapitaPpp >= 0 ? '+' : ''
      }${formatUsd(data.usSnapshot.gapToOptimalSpendingPerCapitaPpp)}`,
    );
  }
  lines.push(
    `- **US status vs inferred band:** ${data.usSnapshot.status.replaceAll('_', ' ')}`,
  );
  lines.push(
    `- **Headline outcomes used:** ${
      data.overall.headlineEligibleOutcomeIds.length > 0
        ? data.outcomes
            .filter(outcome => data.overall.headlineEligibleOutcomeIds.includes(outcome.id))
            .map(outcome => outcome.name)
            .join(', ')
        : 'None'
    }`,
  );
  lines.push(`- **Qualifying low-spend / high-outcome jurisdictions:** ${data.overall.qualifyingJurisdictions}`);
  if (lowestObjectiveFloor?.usEquivalentOptimalPctGdp != null) {
    lines.push(
      `- **Lowest direct-outcome floor in this model:** ${lowestObjectiveFloor.name} at ${lowestObjectiveFloor.usEquivalentOptimalPctGdp.toFixed(1)}% of U.S. GDP`,
    );
  }
  lines.push(
    `- **Federal current-budget composition view:** standalone category optima sum to ${formatUsd(data.federalComposition.unconstrainedOptimalBudgetUsd)} ` +
      `(${data.federalComposition.unconstrainedGapPct >= 0 ? '+' : ''}${data.federalComposition.unconstrainedGapPct.toFixed(1)}% vs current federal budget), ` +
      `but the composition table below is constrained to today's federal budget`,
  );
  lines.push('');

  lines.push('## Predictor Definition');
  lines.push('');
  lines.push('Government Expense (% GDP):');
  lines.push('- World Bank WDI `GC.XPN.TOTL.GD.ZS`');
  lines.push(
    '- World Bank labels this series as government expense; it is not a category decomposition.',
  );
  lines.push('- Cross-country headline comparisons should use per-capita PPP; raw % GDP is descriptive only.');
  lines.push('- Source taxonomy and alternative definitions: `government-spending-metric-comparison.md`.');
  lines.push('');

  lines.push('## Data Coverage');
  lines.push('');
  lines.push(`- Jurisdictions: ${data.predictor.coverage.jurisdictions}`);
  lines.push(`- Years: ${data.predictor.coverage.yearMin}-${data.predictor.coverage.yearMax}`);
  lines.push(`- Country-year observations: ${data.predictor.coverage.observations}`);
  lines.push('');

  lines.push('## Objective Floors');
  lines.push('');
  lines.push(
    'These floors isolate direct welfare objectives instead of forcing a single combined headline. Each row uses the same lag-aligned floor method and then translates the per-capita floor into a U.S.-equivalent % GDP share.',
  );
  lines.push('');
  lines.push('| Objective | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Floor PPP / Capita | Qualifying Jurisdictions |');
  lines.push('|-----------|-----------------------:|----------------|-------------------:|-------------------------:|');
  for (const objective of data.objectiveFloors) {
    lines.push(
      `| ${objective.name} ` +
        `| ${objective.usEquivalentOptimalPctGdp?.toFixed(1) ?? 'N/A'} ` +
        `| ${
          objective.usEquivalentBandLowPctGdp != null && objective.usEquivalentBandHighPctGdp != null
            ? `${objective.usEquivalentBandLowPctGdp.toFixed(1)}-${objective.usEquivalentBandHighPctGdp.toFixed(1)}`
            : 'N/A'
        } ` +
        `| ${formatUsd(objective.optimalSpendingPerCapitaPpp)} ` +
        `| ${objective.qualifyingJurisdictions} |`,
    );
  }
  lines.push('');

  lines.push('## Floor Tolerance');
  lines.push('');
  lines.push(
    'This checks how much the combined direct-welfare floor moves when the "within tolerance of best bin" rule is tightened or loosened.',
  );
  lines.push('');
  lines.push('| Tolerance | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Floor PPP / Capita |');
  lines.push('|----------:|-----------------------:|----------------|-------------------:|');
  for (const scenario of data.toleranceSensitivity) {
    lines.push(
      `| ${scenario.tolerance.toFixed(2)} ` +
        `| ${scenario.usEquivalentOptimalPctGdp?.toFixed(1) ?? 'N/A'} ` +
        `| ${
          scenario.usEquivalentBandLowPctGdp != null && scenario.usEquivalentBandHighPctGdp != null
            ? `${scenario.usEquivalentBandLowPctGdp.toFixed(1)}-${scenario.usEquivalentBandHighPctGdp.toFixed(1)}`
            : 'N/A'
        } ` +
        `| ${formatUsd(scenario.optimalSpendingPerCapitaPpp)} |`,
    );
  }
  lines.push('');

  lines.push('## Temporal Sensitivity (Start Year)');
  lines.push('');
  lines.push(
    data.sensitivity.note,
  );
  lines.push('');
  lines.push('| Start Year | End Year | Country-Years | Jurisdictions | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Raw Bin Median % GDP | US % GDP | US Status |');
  lines.push('|-----------:|---------:|--------------:|--------------:|------------------------:|----------------|---------------------:|---------:|----------|');
  for (const scenario of data.sensitivity.startYearScenarios) {
    const band = scenario.usEquivalentBandLowPctGdp != null && scenario.usEquivalentBandHighPctGdp != null
      ? `${scenario.usEquivalentBandLowPctGdp.toFixed(1)}-${scenario.usEquivalentBandHighPctGdp.toFixed(1)}`
      : 'N/A';
    const status = scenario.usStatus.replaceAll('_', ' ');
    lines.push(
      `| ${scenario.startYear} ` +
        `| ${scenario.endYear} ` +
        `| ${scenario.observations} ` +
        `| ${scenario.jurisdictions} ` +
        `| ${scenario.usEquivalentOptimalPctGdp?.toFixed(1) ?? 'N/A'} ` +
        `| ${band} ` +
        `| ${scenario.optimalPctGdp.toFixed(1)} ` +
        `| ${scenario.usModeledSpendingPctGdp.toFixed(1)} ` +
        `| ${status}${scenario.isPrimaryScenario ? ' (primary)' : ''} |`,
    );
  }
  lines.push('');
  if (data.sensitivity.covidExcludedScenario) {
    const covid = data.sensitivity.covidExcludedScenario;
    lines.push(
      `COVID exclusion check (dropping 2020-2021 source years): ` +
        `${covid.usEquivalentOptimalPctGdp?.toFixed(1) ?? 'N/A'}% GDP U.S.-equivalent ` +
        `(band ${
          covid.usEquivalentBandLowPctGdp?.toFixed(1) ?? 'N/A'
        }-${
          covid.usEquivalentBandHighPctGdp?.toFixed(1) ?? 'N/A'
        }; raw floor-bin median ${covid.optimalPctGdp.toFixed(1)}% GDP; ` +
        `US status ${covid.usStatus.replaceAll('_', ' ')}).`,
    );
    lines.push('');
  }

  lines.push('## Federal Composition');
  lines.push('');
  lines.push(
    `The budget-composition summary below comes from the existing US federal budget model, not the cross-country general-government panel. ` +
      `It is useful for "where should money go?" but should not be equated mechanically with the total government size floor.`,
  );
  lines.push('');
  lines.push(
    `- **Current federal budget:** ${formatUsd(data.federalComposition.currentBudgetUsd)}`,
  );
  lines.push(
    `- **Standalone federal category optima sum:** ${formatUsd(data.federalComposition.unconstrainedOptimalBudgetUsd)}`,
  );
  lines.push(
    `- **Gap vs current federal budget if each category hit its standalone optimum:** ${
      data.federalComposition.unconstrainedGapUsd >= 0 ? '+' : ''
    }${formatUsd(data.federalComposition.unconstrainedGapUsd)} ` +
      `(${data.federalComposition.unconstrainedGapPct >= 0 ? '+' : ''}${data.federalComposition.unconstrainedGapPct.toFixed(1)}%)`,
  );
  lines.push(`- **Caveat:** ${data.federalComposition.compositionCaveat}`);
  lines.push('');
  lines.push('| Top Scale-Ups At Current Budget | Reallocation % | Evidence | Target Share |');
  lines.push('|---------------|------:|----------|--------------:|');
  for (const category of data.federalComposition.topIncreaseCategories) {
    lines.push(
      `| ${category.name} ` +
        `| +${category.reallocationPct.toFixed(1)}% ` +
        `| ${category.evidenceGrade} ` +
        `| ${category.targetSharePct.toFixed(1)}% |`,
    );
  }
  lines.push('');
  lines.push('| Top Scale-Downs At Current Budget | Reallocation % | Evidence | Target Share |');
  lines.push('|-----------------|------:|----------|--------------:|');
  for (const category of data.federalComposition.topDecreaseCategories) {
    lines.push(
      `| ${category.name} ` +
        `| ${category.reallocationPct.toFixed(1)}% ` +
        `| ${category.evidenceGrade} ` +
        `| ${category.targetSharePct.toFixed(1)}% |`,
    );
  }
  lines.push('');
  lines.push('| Largest Target Shares At Current Budget | Target Share | Current | Target |');
  lines.push('|--------------------------------|--------------:|--------:|--------:|');
  for (const category of data.federalComposition.largestTargetShares) {
    lines.push(
      `| ${category.name} ` +
        `| ${category.targetSharePct.toFixed(1)}% ` +
        `| ${formatUsd(category.currentSpendingUsd)} ` +
        `| ${formatUsd(category.targetSpendingUsd)} |`,
    );
  }
  lines.push('');

  lines.push('## Efficient Jurisdictions');
  lines.push('');
  lines.push(
    'These are jurisdictions with at least two lag-aligned observations inside the minimum-efficient per-capita band and non-negative welfare benchmark scores within that band.',
  );
  lines.push('');
  lines.push('| Jurisdiction | Qualifying Obs | Median % GDP | Median Spend / Capita PPP | Median HALE | Median Income Proxy |');
  lines.push('|--------------|---------------:|-------------:|--------------------------:|------------:|--------------------:|');
  for (const jurisdiction of data.efficientJurisdictions) {
    lines.push(
      `| ${jurisdiction.jurisdictionName} ` +
        `| ${jurisdiction.qualifyingObservations} ` +
        `| ${jurisdiction.medianSpendingPctGdp.toFixed(1)} ` +
        `| ${formatUsd(jurisdiction.medianSpendingPerCapitaPpp)} ` +
        `| ${jurisdiction.medianHealthyLifeExpectancyYears?.toFixed(1) ?? 'N/A'} ` +
        `| ${jurisdiction.medianAfterTaxMedianIncomePpp == null ? 'N/A' : formatUsd(jurisdiction.medianAfterTaxMedianIncomePpp)} |`,
    );
  }
  lines.push('');

  lines.push('## Spending Levels vs Typical Outcomes');
  lines.push('');
  lines.push('Headline floor logic uses only outcomes that pass directionality/confounding gates; all four outcomes are still published below.');
  lines.push(
    `Rows are lag-aligned for causal interpretation: predictor at year t, outcomes summarized over t+${data.spendingLevelTable.alignment.onsetYears} to t+${data.spendingLevelTable.alignment.durationYears}.`,
  );
  lines.push('Coverage notes for metric construction:');
  lines.push('- Healthy life years level: WHO Healthy Life Expectancy (HALE) (direct).');
  lines.push('- Healthy life years growth: annualized percent growth of HALE.');
  lines.push('- Real after-tax median income level: best available real PPP median-income series.');
  lines.push('- Real after-tax median income growth: annualized percent growth of the best-available level series.');
  lines.push('- Source hierarchy: OECD direct after-tax disposable income where available; World Bank PIP real median-income fallback elsewhere.');
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
  lines.push('| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income | Typical Real After-Tax Median Income Growth | Notes |');
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
    'Per-capita PPP spending is derived as: government expense % GDP × GDP per capita PPP.',
  );
  lines.push(
    `- Adaptive bins: target ${data.spendingPerCapitaLevelTable.binning.targetBinCount}, ` +
      `minimum ${data.spendingPerCapitaLevelTable.binning.minBinSize} observations/bin, ` +
      `anchors at ${data.spendingPerCapitaLevelTable.binning.anchors.map(anchor => formatUsd(anchor)).join(', ')}, ` +
      `rounded to ${formatUsd(data.spendingPerCapitaLevelTable.binning.roundTo)}`,
  );
  lines.push('');
  lines.push('| Spending Per-Capita PPP Level | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income | Typical Real After-Tax Median Income Growth | Notes |');
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
  lines.push('| Outcome | Weight | N | Mean r | Mean pred r | Mean % Change | Partial r (%GDP \\| GDP/cap) | Headline | Confidence |');
  lines.push('|---------|-------:|---:|-------:|------------:|--------------:|-----------------------------:|----------|------------|');
  for (const outcome of data.outcomes) {
    lines.push(
      `| ${outcome.name} ` +
        `| ${outcome.weight.toFixed(2)} ` +
        `| ${outcome.jurisdictionsAnalyzed} ` +
        `| ${outcome.meanForwardPearson.toFixed(3)} ` +
        `| ${outcome.meanPredictivePearson.toFixed(3)} ` +
        `| ${outcome.meanPercentChange >= 0 ? '+' : ''}${outcome.meanPercentChange.toFixed(2)}% ` +
        `| ${outcome.pooledPctGdpPartialCorrelation == null ? 'N/A' : outcome.pooledPctGdpPartialCorrelation.toFixed(3)} ` +
        `| ${outcome.headlineEligible ? 'Yes' : `No: ${outcome.headlineEligibilityReason}`} ` +
        `| ${outcome.confidenceGrade} (${outcome.confidenceScore.toFixed(2)}) |`,
    );
  }
  lines.push('');

  lines.push('## Method');
  lines.push('');
  lines.push('- Run N-of-1 longitudinal causal analysis within each jurisdiction.');
  lines.push('- Keep Bradford Hill scoring, forward vs reverse Pearson, and change-from-baseline as the core within-jurisdiction diagnostics.');
  lines.push(
    `- Build lag-aligned bin tables from predictor year t to outcome follow-up window t+${data.spendingLevelTable.alignment.onsetYears}..t+${data.spendingLevelTable.alignment.durationYears}.`,
  );
  lines.push('- Compute pooled partial correlations controlling for GDP per capita as a confounding check.');
  lines.push(`- Derive the headline from ${data.overall.floorMethod}`);
  lines.push(`- Score the floor bin via ${data.overall.weightingMethod}`);
  lines.push('- Translate the per-capita floor into a U.S.-equivalent % GDP share using the latest U.S. GDP per-capita PPP.');
  lines.push('- Re-run the same floor logic for HALE-only, income-only, and tolerance-sensitivity scenarios.');
  lines.push('- Import the separate federal budget model to summarize minimum-budget composition recommendations by category.');
  lines.push('- Report start-year and COVID-excluded sensitivity to show how stable the floor estimate is.');
  lines.push('');

  lines.push('## Limitations');
  lines.push('');
  lines.push('- This is cross-country observational panel analysis; confounding remains possible.');
  lines.push('- Total government expense still collapses composition quality, capture, and corruption into a single scalar.');
  lines.push('- Raw cross-country % GDP medians are descriptive and not portable across countries with very different GDP per capita.');
  lines.push('- The federal composition summary is a separate model and a different budget level from the general-government size floor.');
  lines.push('- Category-level floors are a better policy object than a single total-size number.');
  lines.push('- Real after-tax median income now uses the best-available real PPP series: OECD direct after-tax disposable income where available, with World Bank PIP fallback elsewhere.');
  lines.push('- Cross-country comparability is improved versus the old GNI proxy, but this is still a mixed-source series rather than a perfectly homogeneous single-source panel.');
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
  const covidExcludedScenario = buildCovidExcludedScenario(dataset, primaryWindow);
  const efficientJurisdictions = computeEfficientJurisdictions(
    spendingObservations,
    primaryScenario.overall,
  );
  const budgetArtifacts = generateBudgetAnalysisArtifacts({
    outputDir,
    writeFiles: false,
    logSummary: false,
  });
  const federalComposition = buildFederalCompositionSummary(budgetArtifacts);

  const data: GovernmentSizeAnalysisData = {
    predictor: {
      id: 'government_expenditure_pct_gdp',
      name: 'Government Expense (% GDP)',
      definition: 'World Bank WDI GC.XPN.TOTL.GD.ZS',
      fields: ['GC.XPN.TOTL.GD.ZS'],
      coverage: primaryScenario.coverage,
    },
    outcomes: primaryScenario.outcomeAnalyses,
    objectiveFloors: primaryScenario.objectiveFloors,
    toleranceSensitivity: primaryScenario.toleranceSensitivity,
    sensitivity: {
      startYearScenarios: sensitivity,
      covidExcludedScenario,
      note:
        'Start-year sensitivity re-runs the same floor benchmark with different left-window cutoffs; a separate COVID exclusion check drops 2020-2021 source years.',
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
        metricUsed: 'Annualized growth of the best-available after-tax median-income PPP series',
        note: 'Level series uses OECD direct after-tax disposable income where available and World Bank PIP fallback elsewhere.',
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
      definition: 'Government expense per-capita PPP derived as (%GDP / 100) * GDP per-capita PPP.',
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
    efficientJurisdictions,
    federalComposition,
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
      `Minimum efficient spending floor: ${formatUsd(data.overall.optimalSpendingPerCapitaPpp)} PPP/capita ` +
        `(U.S.-equivalent ${data.overall.usEquivalentOptimalPctGdp?.toFixed(1) ?? 'N/A'}% GDP; ` +
        `raw floor-bin median ${data.overall.optimalPctGdp.toFixed(1)}% GDP)`,
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
