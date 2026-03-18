#!/usr/bin/env tsx
/**
 * Generate causal inference reports using the ACTUAL optimizer pipeline.
 * 
 * Approach (N-of-1 aggregation):
 * 1. For each country, build time series of predictor (spending) and outcome (life expectancy)
 * 2. Run `runFullAnalysis()` per country — this does temporal alignment with onset delays,
 *    duration of action, change-from-baseline, optimal values, Bradford Hill scoring
 * 3. Aggregate N-of-1 results across countries
 * 4. Generate markdown reports
 * 
 * This is the correct approach: treating each country as a longitudinal subject,
 * looking at how changes in spending over time correlate with changes in outcomes,
 * rather than cross-sectional snapshots.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runFullAnalysis, generateMarkdownReport, type FullAnalysisResult, type AnalysisConfig } from '../../optimizer/src/index.js';
import type { TimeSeries, Measurement } from '../../optimizer/src/types.js';
import {
  fetchAllCountryData,
  datasetToJSON,
  datasetFromJSON,
  type FetchedDataset,
  type CountryTimeSeries,
} from '../../data/src/pipelines/fetch-country-timeseries.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = resolve(__dirname, '..', '..', '..', 'reports');
const cacheDir = resolve(__dirname, '../.cache');
const CACHE_FILE = resolve(cacheDir, 'country-data.json');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

// ─── Country names ───────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', GBR: 'United Kingdom', CAN: 'Canada', AUS: 'Australia',
  DEU: 'Germany', FRA: 'France', JPN: 'Japan', KOR: 'South Korea', SGP: 'Singapore',
  NZL: 'New Zealand', NOR: 'Norway', SWE: 'Sweden', DNK: 'Denmark', FIN: 'Finland',
  NLD: 'Netherlands', BEL: 'Belgium', AUT: 'Austria', CHE: 'Switzerland', IRL: 'Ireland',
  ISR: 'Israel', ITA: 'Italy', ESP: 'Spain', PRT: 'Portugal', GRC: 'Greece',
  CZE: 'Czech Republic', POL: 'Poland', HUN: 'Hungary', SVK: 'Slovakia', SVN: 'Slovenia',
  EST: 'Estonia', LTU: 'Lithuania', LVA: 'Latvia', CHL: 'Chile', MEX: 'Mexico',
  COL: 'Colombia', BRA: 'Brazil', ARG: 'Argentina', ZAF: 'South Africa', TUR: 'Turkey',
  IND: 'India', CHN: 'China', IDN: 'Indonesia', THA: 'Thailand', MYS: 'Malaysia',
  PHL: 'Philippines', VNM: 'Vietnam', RUS: 'Russia', UKR: 'Ukraine', EGY: 'Egypt',
  NGA: 'Nigeria',
};

// ─── Fetch or cache ──────────────────────────────────────────────────

async function getCountryData(): Promise<FetchedDataset> {
  if (existsSync(CACHE_FILE)) {
    const { statSync } = await import('fs');
    const age = Date.now() - statSync(CACHE_FILE).mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      console.log(`📦 Using cached data (${Math.round(age / 3600000)}h old)`);
      return datasetFromJSON(JSON.parse(readFileSync(CACHE_FILE, 'utf-8')));
    }
  }
  console.log('🌐 Fetching fresh data from World Bank/WHO...');
  const dataset = await fetchAllCountryData(2000, 2023);
  writeFileSync(CACHE_FILE, JSON.stringify(datasetToJSON(dataset), null, 2));
  return dataset;
}

// ─── Build predictor/outcome TimeSeries for a country ────────────────

function buildSpendingTimeSeries(country: CountryTimeSeries): TimeSeries | null {
  const hePct = country.variables.get('health_expenditure_pct_gdp');
  const gdp = country.variables.get('gdp_per_capita');
  if (!hePct || !gdp) return null;

  // Match by year to get spending per capita in USD
  const gdpByYear = new Map<number, number>();
  for (const m of gdp.measurements) {
    const year = new Date(m.timestamp as number).getFullYear();
    gdpByYear.set(year, m.value);
  }

  const measurements: Measurement[] = [];
  for (const m of hePct.measurements) {
    const year = new Date(m.timestamp as number).getFullYear();
    const gdpVal = gdpByYear.get(year);
    if (gdpVal) {
      measurements.push({
        // Use mid-year timestamp — annual data
        timestamp: new Date(`${year}-07-01`).getTime(),
        value: (m.value / 100) * gdpVal, // % GDP → USD per capita
        unit: 'USD per capita',
        source: 'World Bank (computed: health_expenditure_pct_gdp × gdp_per_capita)',
      });
    }
  }

  if (measurements.length < 5) return null;

  return {
    variableId: `${country.iso3}:health_spending_per_capita`,
    name: `Health Spending per Capita (${COUNTRY_NAMES[country.iso3] ?? country.iso3})`,
    measurements,
  };
}

function buildLifeExpectancyTimeSeries(country: CountryTimeSeries): TimeSeries | null {
  const le = country.variables.get('life_expectancy');
  if (!le || le.measurements.length < 5) return null;

  return {
    variableId: `${country.iso3}:life_expectancy`,
    name: `Life Expectancy (${COUNTRY_NAMES[country.iso3] ?? country.iso3})`,
    measurements: le.measurements.map(m => ({
      ...m,
      unit: 'years',
    })),
  };
}

// ─── Run N-of-1 analysis per country ─────────────────────────────────

interface CountryResult {
  iso3: string;
  name: string;
  analysis: FullAnalysisResult;
  report: string;
}

function analyzeCountry(country: CountryTimeSeries): CountryResult | null {
  const predictor = buildSpendingTimeSeries(country);
  const outcome = buildLifeExpectancyTimeSeries(country);

  if (!predictor || !outcome) {
    return null;
  }

  const name = COUNTRY_NAMES[country.iso3] ?? country.iso3;

  // For annual country data:
  // - onset delay: 1 year (365 days) — spending changes take ~1 year to affect health outcomes
  // - duration of action: 3 years — effects of spending persist for several years
  // - filling: interpolation — annual data, fill gaps linearly
  const config: AnalysisConfig = {
    onsetDelaySeconds: 365 * 24 * 3600,        // 1 year
    durationOfActionSeconds: 3 * 365 * 24 * 3600, // 3 years
    fillingType: 'interpolation',
    subjectCount: 1,  // N-of-1
    plausibilityScore: 0.7,   // Well-established that healthcare spending → health outcomes
    coherenceScore: 0.6,      // Generally coherent with known mechanisms
    analogyScore: 0.7,        // Analogous to individual health spending
    specificityScore: 0.3,    // Low — spending affects many outcomes, not specific
  };

  try {
    const analysis = runFullAnalysis(predictor, outcome, config);
    const report = generateMarkdownReport(analysis);
    return { iso3: country.iso3, name, analysis, report };
  } catch (e) {
    console.log(`  ⚠️ ${name}: ${(e as Error).message}`);
    return null;
  }
}

// ─── Aggregate N-of-1 results ────────────────────────────────────────

interface AggregateResult {
  n: number;
  meanForwardPearson: number;
  medianForwardPearson: number;
  meanPIS: number;
  meanEffectSize: number;
  meanPercentChange: number;
  meanOptimalSpending: number;
  countriesWithPositiveCorrelation: number;
  countriesWithNegativeCorrelation: number;
  meanBradfordHill: {
    strength: number;
    consistency: number;
    temporality: number;
    gradient: number;
    experiment: number;
    plausibility: number;
    coherence: number;
    analogy: number;
    specificity: number;
  };
}

function aggregateResults(results: CountryResult[]): AggregateResult {
  const n = results.length;
  const pearsonValues = results.map(r => r.analysis.forwardPearson);
  const sorted = [...pearsonValues].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  return {
    n,
    meanForwardPearson: avg(pearsonValues),
    medianForwardPearson: median,
    meanPIS: avg(results.map(r => r.analysis.pis.score)),
    meanEffectSize: avg(results.map(r => r.analysis.effectSize.zScore)),
    meanPercentChange: avg(results.map(r => r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline)),
    meanOptimalSpending: avg(results.map(r => r.analysis.optimalValues.valuePredictingHighOutcome)),
    countriesWithPositiveCorrelation: results.filter(r => r.analysis.forwardPearson > 0).length,
    countriesWithNegativeCorrelation: results.filter(r => r.analysis.forwardPearson < 0).length,
    meanBradfordHill: {
      strength: avg(results.map(r => r.analysis.bradfordHill.strength)),
      consistency: avg(results.map(r => r.analysis.bradfordHill.consistency)),
      temporality: avg(results.map(r => r.analysis.bradfordHill.temporality)),
      gradient: avg(results.map(r => r.analysis.bradfordHill.gradient ?? 0)),
      experiment: avg(results.map(r => r.analysis.bradfordHill.experiment)),
      plausibility: avg(results.map(r => r.analysis.bradfordHill.plausibility)),
      coherence: avg(results.map(r => r.analysis.bradfordHill.coherence)),
      analogy: avg(results.map(r => r.analysis.bradfordHill.analogy)),
      specificity: avg(results.map(r => r.analysis.bradfordHill.specificity)),
    },
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ─── Generate aggregate markdown report ──────────────────────────────

function generateAggregateReport(results: CountryResult[], agg: AggregateResult): string {
  const lines: string[] = [];

  lines.push('# Health Spending → Life Expectancy: Multi-Country Causal Analysis');
  lines.push('');
  lines.push(`> Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by @optimitron/optimizer`);
  lines.push('');

  // Methodology
  lines.push('## Methodology');
  lines.push('');
  lines.push('This analysis treats **each country as an N-of-1 longitudinal study**:');
  lines.push('');
  lines.push('1. **Within-country time series**: For each country, we have 20+ years of annual health spending per capita and life expectancy');
  lines.push('2. **Temporal alignment**: Measurements are aligned with a **1-year onset delay** (spending changes take ~1 year to manifest in health outcomes) and **3-year duration of action** (effects persist)');
  lines.push('3. **Change from baseline**: For each country, we compare outcome when spending is above vs below its own mean — this controls for cross-country confounders (wealth, genetics, diet)');
  lines.push('4. **Causal scoring**: Bradford Hill criteria applied to each country\'s time series (strength, consistency, temporality, gradient, etc.)');
  lines.push('5. **Aggregation**: N-of-1 results are aggregated across countries — like a meta-analysis of single-subject studies');
  lines.push('');
  lines.push('**Why this is better than cross-sectional analysis:**');
  lines.push('- Controls for time-invariant confounders (culture, genetics, geography)');
  lines.push('- Measures the *effect of changes in spending* within each country');
  lines.push('- Onset delay captures the lag between spending and health impact');
  lines.push('- Duration of action models how long spending effects persist');
  lines.push('- Each country is its own control group');
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`Analysis of **${agg.n} countries** as individual longitudinal studies (2000-2023).`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Countries analyzed | ${agg.n} |`);
  lines.push(`| Mean within-country correlation (spending → life expectancy) | r = ${agg.meanForwardPearson.toFixed(3)} |`);
  lines.push(`| Median within-country correlation | r = ${agg.medianForwardPearson.toFixed(3)} |`);
  lines.push(`| Countries with positive correlation | ${agg.countriesWithPositiveCorrelation}/${agg.n} (${((agg.countriesWithPositiveCorrelation / agg.n) * 100).toFixed(0)}%) |`);
  lines.push(`| Countries with negative correlation | ${agg.countriesWithNegativeCorrelation}/${agg.n} |`);
  lines.push(`| Mean effect size (z-score) | ${agg.meanEffectSize.toFixed(3)} |`);
  lines.push(`| Mean outcome change from baseline | ${agg.meanPercentChange.toFixed(2)}% |`);
  lines.push(`| Mean Predictor Impact Score | ${(agg.meanPIS * 100).toFixed(1)}/100 |`);
  lines.push(`| Mean optimal spending per capita | $${Math.round(agg.meanOptimalSpending).toLocaleString()} |`);
  lines.push(`| Onset delay | 1 year |`);
  lines.push(`| Duration of action | 3 years |`);
  lines.push('');

  // Bradford Hill Aggregate
  lines.push('## Aggregated Bradford Hill Criteria');
  lines.push('');
  lines.push('Average scores across all country analyses (each 0-1):');
  lines.push('');
  const bh = agg.meanBradfordHill;
  lines.push(`| Criterion | Score | Interpretation |`);
  lines.push(`|-----------|-------|---------------|`);
  lines.push(`| Strength | ${bh.strength.toFixed(3)} | ${bh.strength > 0.5 ? 'Strong' : bh.strength > 0.3 ? 'Moderate' : 'Weak'} association |`);
  lines.push(`| Consistency | ${bh.consistency.toFixed(3)} | ${agg.countriesWithPositiveCorrelation}/${agg.n} countries show same direction |`);
  lines.push(`| Temporality | ${bh.temporality.toFixed(3)} | ${bh.temporality > 0.5 ? 'Spending changes precede outcome changes' : 'Weak temporal ordering'} |`);
  lines.push(`| Gradient | ${bh.gradient.toFixed(3)} | ${bh.gradient > 0.5 ? 'Clear' : bh.gradient > 0.3 ? 'Moderate' : 'Weak'} dose-response |`);
  lines.push(`| Experiment | ${bh.experiment.toFixed(3)} | Observational only (no RCTs at country level) |`);
  lines.push(`| Plausibility | ${bh.plausibility.toFixed(3)} | Well-established biological mechanism |`);
  lines.push(`| Coherence | ${bh.coherence.toFixed(3)} | Consistent with known epidemiology |`);
  lines.push(`| Analogy | ${bh.analogy.toFixed(3)} | Analogous to individual health investment |`);
  lines.push(`| Specificity | ${bh.specificity.toFixed(3)} | Low — spending affects many outcomes |`);
  lines.push('');

  // Country details - sorted by PIS
  const sorted = [...results].sort((a, b) => b.analysis.pis.score - a.analysis.pis.score);

  lines.push('## Individual Country Results');
  lines.push('');
  lines.push('Sorted by Predictor Impact Score (strongest evidence first):');
  lines.push('');
  lines.push('| Country | Forward r | Predictive r | Effect Size (d) | % Change | Optimal $/cap | PIS | Grade |');
  lines.push('|---------|-----------|-------------|-----------------|----------|--------------|-----|-------|');

  for (const r of sorted) {
    const a = r.analysis;
    lines.push(
      `| ${r.name} | ${a.forwardPearson.toFixed(3)} | ${a.predictivePearson.toFixed(3)} | ` +
      `${a.effectSize.zScore.toFixed(3)} | ${a.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline.toFixed(2)}% | ` +
      `$${Math.round(a.optimalValues.valuePredictingHighOutcome).toLocaleString()} | ` +
      `${(a.pis.score * 100).toFixed(1)} | ${a.pis.evidenceGrade} |`
    );
  }
  lines.push('');

  // Notable findings
  lines.push('## Notable Findings');
  lines.push('');

  // Countries where spending increase DIDN'T help
  const negative = results.filter(r => r.analysis.forwardPearson < 0);
  if (negative.length > 0) {
    lines.push('### Countries Where More Spending ≠ Better Outcomes');
    lines.push('');
    lines.push('These countries show a negative within-country correlation — when their spending went up, life expectancy did NOT improve correspondingly:');
    lines.push('');
    for (const r of negative.sort((a, b) => a.analysis.forwardPearson - b.analysis.forwardPearson)) {
      lines.push(`- **${r.name}** (r = ${r.analysis.forwardPearson.toFixed(3)}): Spending increases were associated with ${Math.abs(r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).toFixed(2)}% *worse* life expectancy`);
    }
    lines.push('');
  }

  // Strongest positive
  const strongPositive = results.filter(r => r.analysis.forwardPearson > 0.7);
  if (strongPositive.length > 0) {
    lines.push('### Countries With Strongest Spending → Outcome Relationship');
    lines.push('');
    for (const r of strongPositive.sort((a, b) => b.analysis.forwardPearson - a.analysis.forwardPearson)) {
      lines.push(`- **${r.name}** (r = ${r.analysis.forwardPearson.toFixed(3)}): ${r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline.toFixed(2)}% improvement in life expectancy when spending above baseline`);
    }
    lines.push('');
  }

  // US specifically
  const usResult = results.find(r => r.iso3 === 'USA');
  if (usResult) {
    lines.push('### United States Deep Dive');
    lines.push('');
    const a = usResult.analysis;
    lines.push(`- **Forward correlation**: r = ${a.forwardPearson.toFixed(3)} — ${a.forwardPearson > 0 ? 'positive but' : 'negative,'} ${Math.abs(a.forwardPearson) < 0.3 ? 'weak' : Math.abs(a.forwardPearson) < 0.5 ? 'moderate' : 'strong'}`);
    lines.push(`- **Predictive Pearson**: ${a.predictivePearson.toFixed(3)} — ${a.predictivePearson > 0.05 ? 'spending drives outcome' : a.predictivePearson < -0.05 ? 'outcome may drive spending (reverse causation!)' : 'no clear direction'}`);
    lines.push(`- **Effect size**: z-score = ${a.effectSize.zScore.toFixed(3)} (${Math.abs(a.effectSize.zScore) < 0.2 ? 'negligible' : Math.abs(a.effectSize.zScore) < 0.5 ? 'small' : Math.abs(a.effectSize.zScore) < 0.8 ? 'medium' : 'large'})`);
    lines.push(`- **Baseline → Follow-up**: Life expectancy went from ${a.baselineFollowup.outcomeBaselineAverage.toFixed(2)} to ${a.baselineFollowup.outcomeFollowUpAverage.toFixed(2)} years (${a.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline.toFixed(2)}% change)`);
    lines.push(`- **Optimal spending**: $${Math.round(a.optimalValues.valuePredictingHighOutcome).toLocaleString()}/capita associated with highest life expectancy`);
    lines.push(`- **Evidence grade**: ${a.pis.evidenceGrade}`);
    lines.push('');
    if (a.predictivePearson < -0.05) {
      lines.push('⚠️ **The negative predictive Pearson suggests reverse causation**: sicker populations drive up healthcare spending, rather than spending driving health improvements. This is the classic "spending paradox" — the US spends more BECAUSE its population is unhealthy, not the other way around.');
      lines.push('');
    }
  }

  // Methodology details
  lines.push('## Data & Parameters');
  lines.push('');
  lines.push('| Parameter | Value |');
  lines.push('|-----------|-------|');
  lines.push('| Data sources | World Bank WDI (life expectancy, GDP per capita, health expenditure % GDP) |');
  lines.push('| Years | 2000-2023 |');
  lines.push('| Onset delay | 365 days (1 year) — spending changes take time to affect outcomes |');
  lines.push('| Duration of action | 1,095 days (3 years) — health effects of spending persist |');
  lines.push('| Filling type | Interpolation (annual data, linear fill) |');
  lines.push('| Predictor | Health spending per capita (USD PPP) = health_expenditure_%_GDP × GDP_per_capita |');
  lines.push('| Outcome | Life expectancy at birth (years) |');
  lines.push('| Analysis engine | @optimitron/optimizer (runFullAnalysis) |');
  lines.push('');

  lines.push('## Limitations');
  lines.push('');
  lines.push('- Annual data provides limited temporal granularity — finer-grained data would improve onset delay estimation');
  lines.push('- Life expectancy is a lagging indicator — immediate effects of spending are not captured');
  lines.push('- Spending composition matters more than total amount — this analysis doesn\'t distinguish between preventive care, acute care, administration, etc.');
  lines.push('- N-of-1 approach controls for time-invariant confounders but NOT time-varying ones (wars, pandemics, policy changes)');
  lines.push('- COVID-19 (2020-2022) creates significant noise in recent years');
  lines.push('- Optimal values represent within-country optima — they indicate what spending level was associated with the best outcomes for THAT country, not a universal optimum');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Optimitron](https://github.com/mikepsinn/optimitron) — the open-source world optimization engine.*');
  lines.push('*Analysis pipeline: @optimitron/optimizer → runFullAnalysis() with temporal alignment, onset delays, change-from-baseline, Bradford Hill scoring*');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const dataset = await getCountryData();

  console.log('\n🔬 Running N-of-1 causal analysis per country...\n');

  const results: CountryResult[] = [];

  for (const [iso3, country] of dataset.countries) {
    const name = COUNTRY_NAMES[iso3] ?? iso3;
    process.stdout.write(`  ${name}... `);
    const result = analyzeCountry(country);
    if (result) {
      results.push(result);
      const a = result.analysis;
      console.log(`r=${a.forwardPearson?.toFixed(3) ?? 'N/A'}, d=${a.effectSize?.zScore?.toFixed(3) ?? 'N/A'}, PIS=${((a.pis?.score ?? 0)*100).toFixed(1)}, grade=${a.pis?.evidenceGrade ?? 'N/A'}`);
    } else {
      console.log('skipped (insufficient data)');
    }
  }

  console.log(`\n✅ ${results.length}/${dataset.countries.size} countries analyzed`);

  // Aggregate
  const agg = aggregateResults(results);
  console.log(`\n📊 Aggregate: mean r=${agg.meanForwardPearson.toFixed(3)}, mean d=${agg.meanEffectSize.toFixed(3)}, ${agg.countriesWithPositiveCorrelation}/${agg.n} positive`);

  // Generate aggregate report
  const report = generateAggregateReport(results, agg);
  const reportFile = resolve(reportsDir, 'health-spending-causal-analysis.md');
  writeFileSync(reportFile, report);
  console.log(`\n📝 Aggregate report: reports/health-spending-causal-analysis.md`);

  // Generate individual country reports
  const countryReportsDir = resolve(reportsDir, 'countries');
  if (!existsSync(countryReportsDir)) mkdirSync(countryReportsDir, { recursive: true });

  for (const r of results) {
    const file = resolve(countryReportsDir, `${r.iso3.toLowerCase()}-health-spending.md`);
    writeFileSync(file, `# ${r.name}: Health Spending → Life Expectancy\n\n${r.report}`);
  }
  console.log(`📝 ${results.length} individual country reports in reports/countries/`);

  // Save JSON for website
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    generatedBy: '@optimitron/optimizer (N-of-1 causal analysis)',
    methodology: 'N-of-1 longitudinal analysis per country, aggregated across countries',
    config: {
      onsetDelayDays: 365,
      durationOfActionDays: 1095,
      fillingType: 'interpolation',
    },
    aggregate: agg,
    countries: results.map(r => ({
      iso3: r.iso3,
      name: r.name,
      forwardPearson: r.analysis.forwardPearson,
      reversePearson: r.analysis.reversePearson,
      predictivePearson: r.analysis.predictivePearson,
      pValue: r.analysis.pValue,
      effectSize: r.analysis.effectSize.zScore,
      percentChange: r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline,
      optimalSpendingPerCapita: Math.round(r.analysis.optimalValues.valuePredictingHighOutcome),
      baselineLifeExpectancy: r.analysis.baselineFollowup.outcomeBaselineAverage,
      followupLifeExpectancy: r.analysis.baselineFollowup.outcomeFollowUpAverage,
      pisScore: r.analysis.pis.score,
      evidenceGrade: r.analysis.pis.evidenceGrade,
      numberOfPairs: r.analysis.numberOfPairs,
      bradfordHill: r.analysis.bradfordHill,
    })),
  };

  writeFileSync(
    resolve(__dirname, '../src/data/causal-analysis.json'),
    JSON.stringify(jsonOutput, null, 2),
  );
  console.log(`📝 JSON data: packages/web/src/data/causal-analysis.json`);
}

main().catch(e => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
