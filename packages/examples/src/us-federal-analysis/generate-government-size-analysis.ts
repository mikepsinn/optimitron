/**
 * Government Size Analysis (OECD Panel, 2000-2022)
 *
 * Estimates an evidence-weighted optimal spending share (% GDP) using
 * multi-jurisdiction N-of-1 causal analysis across four outcomes.
 *
 * Predictor:
 *   "Modeled public spending basket (% GDP)" =
 *   health + education + military + social + R&D spending shares.
 *
 * IMPORTANT:
 * This is not full general-government spending. It is the spending basket
 * available in the OECD panel dataset used by this project.
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
  OECD_BUDGET_PANEL,
  type OECDBudgetPanelDataPoint,
} from '@optomitron/data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

type SpendingField =
  | 'healthSpendingPercentGdp'
  | 'educationSpendingPercentGdp'
  | 'militarySpendingPercentGdp'
  | 'socialSpendingPercentGdp'
  | 'rdSpendingPercentGdp';

type OutcomeField =
  | 'lifeExpectancyYears'
  | 'gdpPerCapitaPpp'
  | 'infantMortalityPer1000'
  | 'giniIndex';

interface OutcomeSpec {
  id: string;
  name: string;
  field: OutcomeField;
  direction: 'higher_better' | 'lower_better';
  weight: number;
  unit: string;
}

interface OutcomeAnalysis {
  id: string;
  name: string;
  direction: 'higher_better' | 'lower_better';
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

interface GovernmentSizeAnalysisData {
  predictor: {
    id: string;
    name: string;
    definition: string;
    fields: SpendingField[];
    coverage: {
      jurisdictions: number;
      years: number;
      observations: number;
      yearMin: number;
      yearMax: number;
    };
  };
  outcomes: OutcomeAnalysis[];
  spendingLevelTable: {
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
    tiers: Array<{
      tier: string;
      minPctGdp: number | null;
      maxPctGdp: number | null;
      observations: number;
      jurisdictions: number;
      typicalHealthyLifeYears: number | null;
      typicalHealthyLifeYearsGrowthPerYear: number | null;
      typicalRealAfterTaxMedianIncomeLevel: number | null;
      typicalRealAfterTaxMedianIncomeGrowthPct: number | null;
      proxyNotes: string[];
    }>;
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
}

const SPENDING_FIELDS: SpendingField[] = [
  'healthSpendingPercentGdp',
  'educationSpendingPercentGdp',
  'militarySpendingPercentGdp',
  'socialSpendingPercentGdp',
  'rdSpendingPercentGdp',
];

const OUTCOMES: OutcomeSpec[] = [
  {
    id: 'life_expectancy',
    name: 'Life Expectancy',
    field: 'lifeExpectancyYears',
    direction: 'higher_better',
    weight: 0.35,
    unit: 'years',
  },
  {
    id: 'gdp_per_capita',
    name: 'GDP per Capita (PPP)',
    field: 'gdpPerCapitaPpp',
    direction: 'higher_better',
    weight: 0.35,
    unit: 'constant 2017 intl $',
  },
  {
    id: 'infant_mortality',
    name: 'Infant Mortality',
    field: 'infantMortalityPer1000',
    direction: 'lower_better',
    weight: 0.15,
    unit: 'per 1,000',
  },
  {
    id: 'inequality',
    name: 'Income Inequality (Gini)',
    field: 'giniIndex',
    direction: 'lower_better',
    weight: 0.15,
    unit: 'index',
  },
];

const ISO3_NAMES: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  FRA: 'France',
  DEU: 'Germany',
  JPN: 'Japan',
  CAN: 'Canada',
  ITA: 'Italy',
  AUS: 'Australia',
  NLD: 'Netherlands',
  BEL: 'Belgium',
  SWE: 'Sweden',
  NOR: 'Norway',
  DNK: 'Denmark',
  FIN: 'Finland',
  AUT: 'Austria',
  CHE: 'Switzerland',
  ESP: 'Spain',
  PRT: 'Portugal',
  IRL: 'Ireland',
  NZL: 'New Zealand',
  KOR: 'South Korea',
  ISR: 'Israel',
  CZE: 'Czech Republic',
};

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

interface SpendingTier {
  label: string;
  min: number;
  max: number;
}

const SPENDING_TIERS: SpendingTier[] = [
  { label: '<25%', min: -Infinity, max: 25 },
  { label: '25-30%', min: 25, max: 30 },
  { label: '30-35%', min: 30, max: 35 },
  { label: '35-40%', min: 35, max: 40 },
  { label: '40-45%', min: 40, max: 45 },
  { label: '45-50%', min: 45, max: 50 },
  { label: '>=50%', min: 50, max: Infinity },
];

interface SpendingObservation {
  jurisdictionIso3: string;
  year: number;
  spendingPctGdp: number;
  lifeExpectancyYears: number | null;
  lifeExpectancyGrowthYears: number | null;
  gdpPerCapitaPpp: number | null;
  gdpPerCapitaGrowthPct: number | null;
}

function buildSpendingObservations(): SpendingObservation[] {
  const byCountry = new Map<string, OECDBudgetPanelDataPoint[]>();
  for (const row of OECD_BUDGET_PANEL) {
    const existing = byCountry.get(row.jurisdictionIso3);
    if (existing) {
      existing.push(row);
    } else {
      byCountry.set(row.jurisdictionIso3, [row]);
    }
  }

  const observations: SpendingObservation[] = [];
  for (const [iso3, rows] of byCountry) {
    const sorted = [...rows].sort((a, b) => a.year - b.year);
    let prevGdp: number | null = null;
    let prevLifeExp: number | null = null;

    for (const row of sorted) {
      const spendingPctGdp = computeSpendingBasketPctGdp(row);
      if (spendingPctGdp == null) {
        prevGdp = row.gdpPerCapitaPpp;
        prevLifeExp = row.lifeExpectancyYears;
        continue;
      }

      let growth: number | null = null;
      if (prevGdp != null && row.gdpPerCapitaPpp != null && prevGdp !== 0) {
        growth = ((row.gdpPerCapitaPpp - prevGdp) / prevGdp) * 100;
      }
      let lifeExpGrowth: number | null = null;
      if (prevLifeExp != null && row.lifeExpectancyYears != null) {
        lifeExpGrowth = row.lifeExpectancyYears - prevLifeExp;
      }

      observations.push({
        jurisdictionIso3: iso3,
        year: row.year,
        spendingPctGdp,
        lifeExpectancyYears: row.lifeExpectancyYears,
        lifeExpectancyGrowthYears: lifeExpGrowth,
        gdpPerCapitaPpp: row.gdpPerCapitaPpp,
        gdpPerCapitaGrowthPct: growth,
      });

      prevGdp = row.gdpPerCapitaPpp;
      prevLifeExp = row.lifeExpectancyYears;
    }
  }

  return observations;
}

function summarizeSpendingTiers(observations: SpendingObservation[]): GovernmentSizeAnalysisData['spendingLevelTable']['tiers'] {
  return SPENDING_TIERS.map(tier => {
    const matches = observations.filter(obs => obs.spendingPctGdp >= tier.min && obs.spendingPctGdp < tier.max);
    const lifeValues = matches
      .map(obs => obs.lifeExpectancyYears)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const lifeGrowthValues = matches
      .map(obs => obs.lifeExpectancyGrowthYears)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const incomeLevelValues = matches
      .map(obs => obs.gdpPerCapitaPpp)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const incomeGrowthValues = matches
      .map(obs => obs.gdpPerCapitaGrowthPct)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    return {
      tier: tier.label,
      minPctGdp: Number.isFinite(tier.min) ? tier.min : null,
      maxPctGdp: Number.isFinite(tier.max) ? tier.max : null,
      observations: matches.length,
      jurisdictions: new Set(matches.map(obs => obs.jurisdictionIso3)).size,
      typicalHealthyLifeYears: lifeValues.length > 0 ? quantile(lifeValues, 0.5) : null,
      typicalHealthyLifeYearsGrowthPerYear: lifeGrowthValues.length > 0 ? quantile(lifeGrowthValues, 0.5) : null,
      typicalRealAfterTaxMedianIncomeLevel: incomeLevelValues.length > 0 ? quantile(incomeLevelValues, 0.5) : null,
      typicalRealAfterTaxMedianIncomeGrowthPct: incomeGrowthValues.length > 0 ? quantile(incomeGrowthValues, 0.5) : null,
      proxyNotes: [
        'Healthy life years proxy: life expectancy at birth',
        'Healthy life years growth proxy: life expectancy YoY change',
        'Real after-tax median income level proxy: GDP per capita PPP level',
        'Real after-tax median income growth proxy: real GDP per capita YoY growth',
      ],
    };
  });
}

function computeSpendingBasketPctGdp(row: OECDBudgetPanelDataPoint): number | null {
  for (const field of SPENDING_FIELDS) {
    if (row[field] == null) return null;
  }
  return SPENDING_FIELDS.reduce((sum, field) => sum + (row[field] as number), 0);
}

function buildPredictorSeries(): AnnualTimeSeries[] {
  const byCountry = new Map<string, Map<number, number>>();
  for (const row of OECD_BUDGET_PANEL) {
    const spendingPct = computeSpendingBasketPctGdp(row);
    if (spendingPct == null) continue;
    const annual = byCountry.get(row.jurisdictionIso3);
    if (annual) {
      annual.set(row.year, spendingPct);
    } else {
      byCountry.set(row.jurisdictionIso3, new Map([[row.year, spendingPct]]));
    }
  }

  const predictors: AnnualTimeSeries[] = [];
  for (const [iso3, annualValues] of byCountry) {
    predictors.push({
      jurisdictionId: iso3,
      jurisdictionName: ISO3_NAMES[iso3] ?? iso3,
      variableId: 'governmentSpendingBasketPercentGdp',
      variableName: 'Modeled Public Spending Basket (% GDP)',
      unit: '% GDP',
      annualValues,
    });
  }
  return predictors;
}

function buildOutcomeSeries(spec: OutcomeSpec): AnnualTimeSeries[] {
  const byCountry = new Map<string, Map<number, number>>();
  for (const row of OECD_BUDGET_PANEL) {
    const value = row[spec.field];
    if (value == null) continue;
    const aligned = spec.direction === 'lower_better' ? -value : value;
    const annual = byCountry.get(row.jurisdictionIso3);
    if (annual) {
      annual.set(row.year, aligned);
    } else {
      byCountry.set(row.jurisdictionIso3, new Map([[row.year, aligned]]));
    }
  }

  const outcomes: AnnualTimeSeries[] = [];
  for (const [iso3, annualValues] of byCountry) {
    outcomes.push({
      jurisdictionId: iso3,
      jurisdictionName: ISO3_NAMES[iso3] ?? iso3,
      variableId: spec.id,
      variableName: spec.name,
      unit: spec.direction === 'lower_better' ? `negated ${spec.unit}` : spec.unit,
      annualValues,
    });
  }
  return outcomes;
}

function analyzeOutcome(spec: OutcomeSpec, predictors: AnnualTimeSeries[]): OutcomeAnalysis {
  const outcomes = buildOutcomeSeries(spec);
  const result = runCountryAnalysis({
    predictors,
    outcomes,
    config: {
      onsetDelayDays: 365,
      durationOfActionDays: 1095,
      fillingType: 'interpolation',
      minimumDataPoints: 5,
      plausibilityScore: 0.7,
      coherenceScore: 0.6,
      analogyScore: 0.7,
      specificityScore: 0.3,
    },
  });

  const agg = result.aggregate;
  const optimals = result.jurisdictions
    .map(j => j.analysis.optimalValues.valuePredictingHighOutcome)
    .filter(v => Number.isFinite(v));

  const directionalConsistency = agg.n > 0 ? agg.positiveCount / agg.n : 0;
  const sampleSaturation = 1 - Math.exp(-agg.n / 10);
  const confidenceScore = clamp(
    agg.meanBradfordHill.strength * directionalConsistency * sampleSaturation,
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
    meanForwardPearson: agg.meanForwardPearson,
    meanPercentChange: agg.meanPercentChange,
    positiveCount: agg.positiveCount,
    negativeCount: agg.negativeCount,
    jurisdictionsAnalyzed: agg.n,
    jurisdictionsSkipped: agg.skipped,
    medianOptimalPctGdp: quantile(optimals, 0.5),
    p25OptimalPctGdp: quantile(optimals, 0.25),
    p75OptimalPctGdp: quantile(optimals, 0.75),
    confidenceScore,
    confidenceGrade: scoreToGrade(confidenceScore),
    jurisdictions,
  };
}

function weightedMean(values: Array<{ value: number; weight: number }>): number {
  const sumWeights = values.reduce((sum, item) => sum + item.weight, 0);
  if (sumWeights <= 0) return avg(values.map(v => v.value));
  const weighted = values.reduce((sum, item) => sum + item.value * item.weight, 0);
  return weighted / sumWeights;
}

function buildMarkdown(data: GovernmentSizeAnalysisData): string {
  const lines: string[] = [];
  lines.push('# Government Size Analysis: OECD Panel (2000-2022)');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(
    `Evidence-weighted N-of-1 analysis suggests an optimal modeled spending share of ` +
    `**${data.overall.optimalPctGdp.toFixed(1)}% of GDP** ` +
    `(band: **${data.overall.optimalBandLowPctGdp.toFixed(1)}% - ${data.overall.optimalBandHighPctGdp.toFixed(1)}%**).`,
  );
  lines.push('');
  lines.push(`- **US latest modeled share (${data.usSnapshot.latestYear}):** ${data.usSnapshot.modeledSpendingPctGdp.toFixed(1)}%`);
  lines.push(`- **US gap to central estimate:** ${data.usSnapshot.gapToOptimalPctPoints >= 0 ? '+' : ''}${data.usSnapshot.gapToOptimalPctPoints.toFixed(1)} percentage points`);
  lines.push(`- **US status vs inferred band:** ${data.usSnapshot.status.replaceAll('_', ' ')}`);
  lines.push('');

  lines.push('## Predictor Definition');
  lines.push('');
  lines.push('Modeled Public Spending Basket (% GDP) =');
  lines.push('- Health spending % GDP');
  lines.push('- Education spending % GDP');
  lines.push('- Military spending % GDP');
  lines.push('- Social spending % GDP');
  lines.push('- R&D spending % GDP');
  lines.push('');
  lines.push('This is a large OECD spending basket, not full general-government spending.');
  lines.push('');

  lines.push('## Data Coverage');
  lines.push('');
  lines.push(`- Jurisdictions: ${data.predictor.coverage.jurisdictions}`);
  lines.push(`- Years: ${data.predictor.coverage.yearMin}-${data.predictor.coverage.yearMax}`);
  lines.push(`- Country-year observations: ${data.predictor.coverage.observations}`);
  lines.push('');

  lines.push('## Spending Levels vs Typical Outcomes');
  lines.push('');
  lines.push('Primary welfare outcomes are median healthy life years and real after-tax median income growth.');
  lines.push('Cross-country panel proxies are used here because direct country-year series for those metrics are incomplete in-repo:');
  lines.push('- Healthy life years level proxy: Life expectancy at birth');
  lines.push('- Healthy life years growth proxy: Life expectancy YoY change');
  lines.push('- Real after-tax median income level proxy: GDP per capita PPP level');
  lines.push('- Real after-tax median income growth proxy: Real GDP per capita YoY growth');
  lines.push('');
  lines.push('| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (proxy level) | Typical Healthy Life Years Growth (proxy) | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) |');
  lines.push('|------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|');
  for (const tier of data.spendingLevelTable.tiers) {
    const life = tier.typicalHealthyLifeYears == null ? 'N/A' : tier.typicalHealthyLifeYears.toFixed(1);
    const lifeGrowth = tier.typicalHealthyLifeYearsGrowthPerYear == null
      ? 'N/A'
      : `${tier.typicalHealthyLifeYearsGrowthPerYear >= 0 ? '+' : ''}${tier.typicalHealthyLifeYearsGrowthPerYear.toFixed(3)}`;
    const incomeLevel = tier.typicalRealAfterTaxMedianIncomeLevel == null
      ? 'N/A'
      : `$${Math.round(tier.typicalRealAfterTaxMedianIncomeLevel).toLocaleString('en-US')}`;
    const income = tier.typicalRealAfterTaxMedianIncomeGrowthPct == null
      ? 'N/A'
      : `${tier.typicalRealAfterTaxMedianIncomeGrowthPct >= 0 ? '+' : ''}${tier.typicalRealAfterTaxMedianIncomeGrowthPct.toFixed(2)}%`;
    lines.push(
      `| ${tier.tier} ` +
      `| ${tier.observations} ` +
      `| ${tier.jurisdictions} ` +
      `| ${life} ` +
      `| ${lifeGrowth} ` +
      `| ${incomeLevel} ` +
      `| ${income} |`,
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
  lines.push('- Run N-of-1 longitudinal causal analysis within each jurisdiction (2000-2022).');
  lines.push('- Estimate per-jurisdiction optimal predictor value from high-outcome periods.');
  lines.push('- Aggregate outcome-level medians and uncertainty bands (IQR).');
  lines.push(`- Combine outcomes via ${data.overall.weightingMethod}.`);
  lines.push('');

  lines.push('## Limitations');
  lines.push('');
  lines.push('- Predictor is a spending basket available in this dataset, not total government spending.');
  lines.push('- OECD high-income panel may not generalize globally.');
  lines.push('- Macro outcomes are affected by time-varying confounders (wars, crises, pandemics).');
  lines.push('');

  return lines.join('\n');
}

export function generateGovernmentSizeAnalysisArtifacts(
  options: GovernmentSizeAnalysisOptions = {},
): GovernmentSizeAnalysisArtifacts {
  const {
    outputDir = OUTPUT_DIR,
    writeFiles = true,
    logSummary = true,
  } = options;

  const predictors = buildPredictorSeries();
  const allYears = new Set<number>();
  let observationCount = 0;
  for (const predictor of predictors) {
    observationCount += predictor.annualValues.size;
    for (const year of predictor.annualValues.keys()) allYears.add(year);
  }

  const outcomeAnalyses = OUTCOMES.map(spec => analyzeOutcome(spec, predictors));
  const spendingObservations = buildSpendingObservations();
  const spendingLevelTable = summarizeSpendingTiers(spendingObservations);
  const totalWeight = outcomeAnalyses.reduce((sum, outcome) => sum + outcome.weight, 0);
  const normalized = outcomeAnalyses.map(outcome => ({
    ...outcome,
    baseWeight: totalWeight > 0 ? outcome.weight / totalWeight : 0,
  }));

  // Effective weight = baseWeight × (0.2 + 0.8 × confidenceScore)
  // This preserves outcome inclusion while emphasizing better-supported outcomes.
  const optimalPctGdp = weightedMean(normalized.map(o => ({
    value: o.medianOptimalPctGdp,
    weight: o.baseWeight * (0.2 + 0.8 * o.confidenceScore),
  })));
  const optimalBandLowPctGdp = weightedMean(normalized.map(o => ({
    value: o.p25OptimalPctGdp,
    weight: o.baseWeight * (0.2 + 0.8 * o.confidenceScore),
  })));
  const optimalBandHighPctGdp = weightedMean(normalized.map(o => ({
    value: o.p75OptimalPctGdp,
    weight: o.baseWeight * (0.2 + 0.8 * o.confidenceScore),
  })));

  const usaRows = OECD_BUDGET_PANEL
    .filter(row => row.jurisdictionIso3 === 'USA')
    .map(row => ({ year: row.year, spendingPctGdp: computeSpendingBasketPctGdp(row) }))
    .filter((row): row is { year: number; spendingPctGdp: number } => row.spendingPctGdp != null)
    .sort((a, b) => b.year - a.year);
  const latestUs = usaRows[0];
  if (!latestUs) {
    throw new Error('No USA rows found in OECD budget panel for modeled spending predictor');
  }

  const usGapToOptimal = latestUs.spendingPctGdp - optimalPctGdp;
  let status: GovernmentSizeAnalysisData['usSnapshot']['status'] = 'within_optimal_band';
  if (latestUs.spendingPctGdp > optimalBandHighPctGdp) status = 'above_optimal_band';
  if (latestUs.spendingPctGdp < optimalBandLowPctGdp) status = 'below_optimal_band';

  const years = [...allYears];
  const data: GovernmentSizeAnalysisData = {
    predictor: {
      id: 'government_spending_basket_pct_gdp',
      name: 'Modeled Public Spending Basket (% GDP)',
      definition: 'health + education + military + social + R&D (% GDP)',
      fields: SPENDING_FIELDS,
      coverage: {
        jurisdictions: predictors.length,
        years: years.length,
        observations: observationCount,
        yearMin: Math.min(...years),
        yearMax: Math.max(...years),
      },
    },
    outcomes: outcomeAnalyses,
    spendingLevelTable: {
      healthyLifeYearsMetric: {
        isDirectMetric: false,
        metricUsed: 'Life expectancy at birth (proxy)',
        note: 'OECD panel lacks complete country-year HALE series in this repository.',
      },
      incomeGrowthMetric: {
        isDirectMetric: false,
        metricUsed: 'Real GDP per capita YoY growth (proxy)',
        note: 'OECD panel lacks complete country-year real after-tax median income series in this repository.',
      },
      tiers: spendingLevelTable,
    },
    overall: {
      optimalPctGdp,
      optimalBandLowPctGdp,
      optimalBandHighPctGdp,
      weightingMethod: 'outcome-weighted average with evidence modulation (0.2 + 0.8*confidence)',
    },
    usSnapshot: {
      latestYear: latestUs.year,
      modeledSpendingPctGdp: latestUs.spendingPctGdp,
      gapToOptimalPctPoints: usGapToOptimal,
      status,
    },
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
    console.log(`Optimal modeled spending share: ${data.overall.optimalPctGdp.toFixed(1)}% GDP`);
    console.log(`Inferred band: ${data.overall.optimalBandLowPctGdp.toFixed(1)}% - ${data.overall.optimalBandHighPctGdp.toFixed(1)}% GDP`);
    console.log(`US (${data.usSnapshot.latestYear}): ${data.usSnapshot.modeledSpendingPctGdp.toFixed(1)}% GDP (${data.usSnapshot.status})`);
  }

  return {
    markdown,
    json: data,
    outputPaths,
  };
}

function main(): void {
  generateGovernmentSizeAnalysisArtifacts();
}

main();
