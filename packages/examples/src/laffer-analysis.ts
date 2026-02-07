#!/usr/bin/env tsx
/**
 * Laffer Curve Analysis via Optomitron Optimizer
 *
 * Tests the Laffer Curve hypothesis using temporal causal inference:
 *   a. Top Marginal Tax Rate → Federal Revenue %GDP
 *   b. Top Marginal Tax Rate → Real GDP Growth
 *   c. Top Marginal Tax Rate → Real Median Income (1967+)
 *   d. Federal Revenue %GDP → Real GDP Growth
 *
 * Each analysis is run on both absolute levels and YoY % change.
 */

import { US_LAFFER_CURVE_DATA, type LafferCurveDataPoint } from '@optomitron/data';
import { runFullAnalysis, type TimeSeries, type FullAnalysisResult } from '@optomitron/optimizer';

// ─── Config ───────────────────────────────────────────────────────────

const ONE_YEAR = 365 * 24 * 3600;
const analysisConfig = {
  onsetDelaySeconds: ONE_YEAR,       // 1-year onset delay
  durationOfActionSeconds: 3 * ONE_YEAR, // 3-year duration of action
  fillingType: 'none' as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────

function toTS(
  data: Array<{ year: number; value: number }>,
  id: string,
  name: string,
): TimeSeries {
  return {
    variableId: id,
    name,
    measurements: data.map(d => ({
      timestamp: new Date(`${d.year}-07-01`).getTime(),
      value: d.value,
    })),
  };
}

/** Compute YoY % change series, dropping the first year */
function yoyChange(data: Array<{ year: number; value: number }>): Array<{ year: number; value: number }> {
  const result: Array<{ year: number; value: number }> = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    if (prev === 0) continue;
    result.push({
      year: data[i].year,
      value: ((data[i].value - prev) / Math.abs(prev)) * 100,
    });
  }
  return result;
}

// ─── Build series ─────────────────────────────────────────────────────

const taxRate = US_LAFFER_CURVE_DATA.map(d => ({ year: d.year, value: d.topMarginalTaxRate }));
const revGDP = US_LAFFER_CURVE_DATA.map(d => ({ year: d.year, value: d.federalRevenuePercentGDP }));
const gdpGrowth = US_LAFFER_CURVE_DATA.map(d => ({ year: d.year, value: d.realGDPGrowthRate }));
const medianIncome = US_LAFFER_CURVE_DATA
  .filter((d): d is LafferCurveDataPoint & { realMedianHouseholdIncome: number } =>
    d.realMedianHouseholdIncome !== null)
  .map(d => ({ year: d.year, value: d.realMedianHouseholdIncome }));

// YoY % change versions
const taxRateYoY = yoyChange(taxRate);
const revGDPYoY = yoyChange(revGDP);
const gdpGrowthYoY = yoyChange(gdpGrowth); // already % growth, but this is change-in-growth
const medianIncomeYoY = yoyChange(medianIncome);

// ─── Analysis pairs ───────────────────────────────────────────────────

interface AnalysisPair {
  label: string;
  predictor: { data: Array<{ year: number; value: number }>; id: string; name: string };
  outcome: { data: Array<{ year: number; value: number }>; id: string; name: string };
}

const analyses: AnalysisPair[] = [
  // === ABSOLUTE ===
  {
    label: 'A1. Tax Rate → Revenue %GDP (ABSOLUTE)',
    predictor: { data: taxRate, id: 'tax-rate', name: 'Top Marginal Tax Rate (%)' },
    outcome: { data: revGDP, id: 'rev-gdp', name: 'Federal Revenue % GDP' },
  },
  {
    label: 'A2. Tax Rate → Real GDP Growth (ABSOLUTE)',
    predictor: { data: taxRate, id: 'tax-rate', name: 'Top Marginal Tax Rate (%)' },
    outcome: { data: gdpGrowth, id: 'gdp-growth', name: 'Real GDP Growth (%)' },
  },
  {
    label: 'A3. Tax Rate → Real Median Income (ABSOLUTE, 1967+)',
    predictor: { data: taxRate.filter(d => d.year >= 1967), id: 'tax-rate-67', name: 'Top Marginal Tax Rate (%)' },
    outcome: { data: medianIncome, id: 'median-income', name: 'Real Median Household Income ($)' },
  },
  {
    label: 'A4. Revenue %GDP → Real GDP Growth (ABSOLUTE)',
    predictor: { data: revGDP, id: 'rev-gdp', name: 'Federal Revenue % GDP' },
    outcome: { data: gdpGrowth, id: 'gdp-growth', name: 'Real GDP Growth (%)' },
  },
  // === YoY % CHANGE ===
  {
    label: 'B1. Tax Rate → Revenue %GDP (YoY % CHANGE)',
    predictor: { data: taxRateYoY, id: 'tax-rate-yoy', name: 'Tax Rate YoY % Change' },
    outcome: { data: revGDPYoY, id: 'rev-gdp-yoy', name: 'Revenue %GDP YoY % Change' },
  },
  {
    label: 'B2. Tax Rate → Real GDP Growth (YoY % CHANGE)',
    predictor: { data: taxRateYoY, id: 'tax-rate-yoy', name: 'Tax Rate YoY % Change' },
    outcome: { data: gdpGrowth, id: 'gdp-growth', name: 'Real GDP Growth (%)' },  // already a rate
  },
  {
    label: 'B3. Tax Rate → Real Median Income (YoY % CHANGE, 1967+)',
    predictor: { data: taxRateYoY.filter(d => d.year >= 1968), id: 'tax-rate-yoy-67', name: 'Tax Rate YoY % Change' },
    outcome: { data: medianIncomeYoY, id: 'median-income-yoy', name: 'Median Income YoY % Change' },
  },
  {
    label: 'B4. Revenue %GDP → Real GDP Growth (YoY % CHANGE)',
    predictor: { data: revGDPYoY, id: 'rev-gdp-yoy', name: 'Revenue %GDP YoY % Change' },
    outcome: { data: gdpGrowth, id: 'gdp-growth', name: 'Real GDP Growth (%)' },
  },
];

// ─── Run & Print ──────────────────────────────────────────────────────

function fmt(n: number, digits = 3): string {
  return n.toFixed(digits);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  LAFFER CURVE CAUSAL ANALYSIS — Optomitron Optimizer');
console.log('  Data: US 1950–2023 | Onset delay: 1yr | Duration: 3yr');
console.log('═══════════════════════════════════════════════════════════\n');

for (const a of analyses) {
  const predTS = toTS(a.predictor.data, a.predictor.id, a.predictor.name);
  const outTS = toTS(a.outcome.data, a.outcome.id, a.outcome.name);

  let result: FullAnalysisResult;
  try {
    result = runFullAnalysis(predTS, outTS, analysisConfig);
  } catch (err: any) {
    console.log(`─── ${a.label} ───`);
    console.log(`  ⚠️  FAILED: ${err.message}\n`);
    continue;
  }

  const r = result.forwardPearson;
  const rRev = result.reversePearson;
  const causalDir = result.predictivePearson;
  const p = result.pValue;
  const n = result.numberOfPairs;
  const bfBase = result.baselineFollowup.outcomeBaselineAverage;
  const bfFollow = result.baselineFollowup.outcomeFollowUpAverage;
  const pctChange = result.effectSize.percentChange;
  const grade = result.pis.evidenceGrade;
  const pisScore = result.pis.score;
  const optHigh = result.optimalValues.valuePredictingHighOutcome;
  const optLow = result.optimalValues.valuePredictingLowOutcome;

  console.log(`─── ${a.label} ───`);
  console.log(`  Forward r:       ${fmt(r)}   (p=${fmt(p, 4)})`);
  console.log(`  Reverse r:       ${fmt(rRev)}`);
  console.log(`  Causal Dir:      ${fmt(causalDir)}   (forward−reverse; >0 = predictor→outcome)`);
  console.log(`  Spearman ρ:      ${fmt(result.spearmanCorrelation)}`);
  console.log(`  Pairs:           ${n}`);
  console.log(`  Baseline→Follow: ${fmt(bfBase, 1)} → ${fmt(bfFollow, 1)}  (${pctChange >= 0 ? '+' : ''}${fmt(pctChange, 1)}%)`);
  console.log(`  Optimal high:    ${fmt(optHigh, 1)}  |  Optimal low: ${fmt(optLow, 1)}`);
  console.log(`  PIS:             ${fmt(pisScore)}  |  Grade: ${grade}`);
  console.log(`  Bradford Hill:   str=${fmt(result.bradfordHill.strength)} temp=${fmt(result.bradfordHill.temporality)} grad=${fmt(result.bradfordHill.gradient ?? 0)}`);
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  INTERPRETATION NOTES');
console.log('═══════════════════════════════════════════════════════════');
console.log(`
Hauser's Law test: If A1 shows weak r between tax rate and revenue %GDP,
it supports the observation that revenue hovers 15-20% of GDP regardless
of top marginal rates (28% to 91%).

Laffer "sweet spot": The optimal values show which tax rates are 
associated with the HIGHEST and LOWEST outcome values.

Causal Direction Score (forward r − reverse r):
  > 0: Supports predictor → outcome direction
  ≈ 0: No clear causal direction  
  < 0: Reverse causation more likely

YoY analyses (B-series) control for secular trends and test whether
CHANGES in tax rates predict CHANGES in outcomes, which is a stronger
test of causation than levels vs levels.
`);
