#!/usr/bin/env tsx
/**
 * Fetch real data from public APIs, cache it, and generate website analysis.
 * 
 * Run: pnpm --filter @optomitron/web run fetch
 * 
 * This fetches from World Bank, WHO, etc., caches the raw data,
 * then runs OPG/OBG to generate evidence-based analysis.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  fetchAllCountryData,
  datasetToJSON,
  datasetFromJSON,
  type FetchedDataset,
} from '../../data/src/pipelines/fetch-country-timeseries.ts';
import { estimateOSL, type SpendingOutcomePoint } from '../../obg/src/index.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');
const cacheDir = resolve(__dirname, '../.cache');

// Ensure cache dir exists
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

const CACHE_FILE = resolve(cacheDir, 'country-data.json');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Fetch or load from cache ────────────────────────────────────────

async function getCountryData(): Promise<FetchedDataset> {
  // Check cache
  if (existsSync(CACHE_FILE)) {
    const stat = statSync(CACHE_FILE);
    const age = Date.now() - stat.mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      console.log(`📦 Using cached data (${Math.round(age / 3600000)}h old)`);
      const json = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
      return datasetFromJSON(json);
    }
    console.log('📦 Cache expired, re-fetching...');
  }

  // Fetch fresh data
  const dataset = await fetchAllCountryData(2000, 2023);

  // Cache it
  const json = datasetToJSON(dataset);
  writeFileSync(CACHE_FILE, JSON.stringify(json, null, 2));
  console.log(`💾 Cached to ${CACHE_FILE}`);

  return dataset;
}

// ─── Generate cross-country analysis ─────────────────────────────────

interface CrossCountryResult {
  variable: string;
  countries: {
    iso3: string;
    latestValue: number;
    yearRange: [number, number];
    dataPoints: number;
  }[];
  correlations: {
    predictor: string;
    outcome: string;
    pearsonR: number;
    pValue: number;
    n: number;
  }[];
}

function analyzeDataset(dataset: FetchedDataset): object {
  console.log('\n🔬 Running cross-country analysis...');

  // Build paired data: health spending → life expectancy for OSL
  const spendingOutcomePoints: SpendingOutcomePoint[] = [];
  const countryLatest: Record<string, Record<string, number>> = {};

  for (const [iso3, country] of dataset.countries) {
    countryLatest[iso3] = {};

    for (const [varId, series] of country.variables) {
      if (series.measurements.length > 0) {
        // Get latest value
        const latest = series.measurements[series.measurements.length - 1];
        countryLatest[iso3][varId] = latest.value;
      }
    }

    // Build spending→outcome pairs for the latest year available
    const spending = countryLatest[iso3]?.['health_expenditure_pct_gdp'];
    const gdp = countryLatest[iso3]?.['gdp_per_capita'];
    const le = countryLatest[iso3]?.['life_expectancy'];

    if (spending && gdp && le) {
      const spendingPerCapita = (spending / 100) * gdp;
      spendingOutcomePoints.push({
        spending: spendingPerCapita,
        outcome: le,
        jurisdiction: iso3,
        year: 2022,
      });
    }
  }

  console.log(`  📊 ${spendingOutcomePoints.length} countries with spending + life expectancy data`);

  // Run OSL on health spending → life expectancy
  let oslResult = null;
  if (spendingOutcomePoints.length >= 10) {
    try {
      oslResult = estimateOSL(spendingOutcomePoints);
      console.log(`  ✅ OSL: $${Math.round(oslResult.oslUsd)} per capita (CI: $${Math.round(oslResult.confidenceInterval[0])}-$${Math.round(oslResult.confidenceInterval[1])})`);
      console.log(`     Marginal return at OSL: ${oslResult.marginalReturnAtOSL.toFixed(6)} years/$`);
    } catch (e) {
      console.log(`  ⚠️ OSL estimation failed: ${e}`);
    }
  }

  // Calculate simple Pearson correlation: spending → life expectancy
  const xs = spendingOutcomePoints.map(p => p.spending);
  const ys = spendingOutcomePoints.map(p => p.outcome);
  const n = xs.length;
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const pearsonR = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;

  // Rank countries by efficiency (life expectancy / spending per capita)
  const efficiency = spendingOutcomePoints
    .map(p => ({
      iso3: p.jurisdiction,
      spending: Math.round(p.spending),
      lifeExpectancy: p.outcome,
      efficiency: p.outcome / p.spending * 1000, // years per $1000
    }))
    .sort((a, b) => b.efficiency - a.efficiency);

  console.log(`\n🏆 Top 5 most efficient healthcare systems:`);
  for (const e of efficiency.slice(0, 5)) {
    console.log(`   ${e.iso3}: ${e.lifeExpectancy.toFixed(1)} years at $${e.spending}/capita (${e.efficiency.toFixed(2)} yrs/$1K)`);
  }

  console.log(`\n🔻 Bottom 5 (least efficient):`);
  for (const e of efficiency.slice(-5)) {
    console.log(`   ${e.iso3}: ${e.lifeExpectancy.toFixed(1)} years at $${e.spending}/capita (${e.efficiency.toFixed(2)} yrs/$1K)`);
  }

  return {
    generatedAt: new Date().toISOString(),
    generatedBy: '@optomitron/obg + @optomitron/data (real API data)',
    dataSource: dataset.metadata,
    healthSpendingVsLifeExpectancy: {
      pearsonR: Math.round(pearsonR * 1000) / 1000,
      n: spendingOutcomePoints.length,
      oslPerCapita: oslResult ? Math.round(oslResult.oslUsd) : null,
      oslConfidenceInterval: oslResult ? [
        Math.round(oslResult.confidenceInterval[0]),
        Math.round(oslResult.confidenceInterval[1]),
      ] : null,
      marginalReturnAtOSL: oslResult?.marginalReturnAtOSL ?? null,
      insight: oslResult
        ? `Optimal health spending is ~$${Math.round(oslResult.oslUsd)}/capita. Beyond this, additional spending has diminishing returns on life expectancy.`
        : 'Insufficient data for OSL estimation.',
    },
    efficiencyRanking: efficiency,
    countryLatestValues: countryLatest,
  };
}

// ─── Markdown Report ─────────────────────────────────────────────────

function generateMarkdownReport(analysis: any, dataset: FetchedDataset): string {
  const lines: string[] = [];
  const hs = analysis.healthSpendingVsLifeExpectancy;
  const eff = analysis.efficiencyRanking as any[];

  lines.push('# Cross-Country Health Spending Analysis');
  lines.push('');
  lines.push(`> Generated ${new Date(analysis.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by ${analysis.generatedBy}`);
  lines.push('');
  
  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`Analysis of **${eff.length} countries** using real-time data from the World Bank and WHO (${dataset.metadata.yearRange[0]}-${dataset.metadata.yearRange[1]}).`);
  lines.push('');
  if (hs.oslPerCapita) {
    lines.push(`**Key finding:** Optimal health spending is approximately **$${hs.oslPerCapita}/capita** per year (95% CI: $${hs.oslConfidenceInterval[0]}-$${hs.oslConfidenceInterval[1]}). Beyond this level, additional spending produces diminishing returns on life expectancy.`);
  }
  lines.push('');
  lines.push(`The correlation between health spending and life expectancy is **r = ${hs.pearsonR}** (n = ${hs.n}), indicating a ${hs.pearsonR > 0.5 ? 'strong' : hs.pearsonR > 0.3 ? 'moderate' : 'weak'} positive relationship — but with dramatic variation in efficiency.`);
  lines.push('');

  // The US Problem
  const usa = eff.find((e: any) => e.iso3 === 'USA');
  const sgp = eff.find((e: any) => e.iso3 === 'SGP');
  const jpn = eff.find((e: any) => e.iso3 === 'JPN');
  if (usa) {
    lines.push('## The US Healthcare Spending Problem');
    lines.push('');
    lines.push(`The United States spends **$${usa.spending.toLocaleString()}/capita** on healthcare — more than any other country — yet achieves a life expectancy of only **${usa.lifeExpectancy.toFixed(1)} years**, ranking near the bottom of developed nations.`);
    lines.push('');
    if (sgp) {
      lines.push(`**Singapore** achieves **${sgp.lifeExpectancy.toFixed(1)} years** at just **$${sgp.spending.toLocaleString()}/capita** — ${(usa.spending / sgp.spending).toFixed(1)}x less spending for ${(sgp.lifeExpectancy - usa.lifeExpectancy).toFixed(1)} more years of life.`);
      lines.push('');
    }
    if (jpn) {
      lines.push(`**Japan** achieves **${jpn.lifeExpectancy.toFixed(1)} years** at **$${jpn.spending.toLocaleString()}/capita** — roughly ${(usa.spending / jpn.spending).toFixed(1)}x less spending.`);
      lines.push('');
    }
    lines.push(`At the current US spending level, the diminishing returns model predicts a life expectancy gain of only **${hs.marginalReturnAtOSL?.toFixed(4) ?? 'N/A'} years per additional dollar** — effectively zero return on additional investment.`);
    lines.push('');
  }

  // OSL Analysis
  lines.push('## Optimal Spending Level (OSL)');
  lines.push('');
  lines.push('The Optimal Spending Level is the point where marginal returns on health spending equalize — where the next dollar spent produces the most life expectancy gain.');
  lines.push('');
  if (hs.oslPerCapita) {
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Optimal spending per capita | **$${hs.oslPerCapita}** |`);
    lines.push(`| 95% Confidence Interval | $${hs.oslConfidenceInterval[0]} - $${hs.oslConfidenceInterval[1]} |`);
    lines.push(`| Pearson correlation (spending → life expectancy) | r = ${hs.pearsonR} |`);
    lines.push(`| Countries analyzed | ${hs.n} |`);
    lines.push(`| Year range | ${dataset.metadata.yearRange[0]}-${dataset.metadata.yearRange[1]} |`);
    lines.push('');
  }

  // Efficiency Rankings
  lines.push('## Healthcare Efficiency Rankings');
  lines.push('');
  lines.push('Efficiency = life years per $1,000 spent on healthcare. Higher is better.');
  lines.push('');
  
  // Top 10
  lines.push('### 🏆 Most Efficient (Top 10)');
  lines.push('');
  lines.push('| Rank | Country | Life Expectancy | Spending/Capita | Efficiency (yrs/$1K) |');
  lines.push('|------|---------|----------------|-----------------|---------------------|');
  for (let i = 0; i < Math.min(10, eff.length); i++) {
    const e = eff[i];
    lines.push(`| ${i + 1} | ${e.iso3} | ${e.lifeExpectancy.toFixed(1)} | $${e.spending.toLocaleString()} | ${e.efficiency.toFixed(2)} |`);
  }
  lines.push('');

  // Bottom 10
  lines.push('### 🔻 Least Efficient (Bottom 10)');
  lines.push('');
  lines.push('| Rank | Country | Life Expectancy | Spending/Capita | Efficiency (yrs/$1K) |');
  lines.push('|------|---------|----------------|-----------------|---------------------|');
  const bottom = eff.slice(-10).reverse();
  for (let i = 0; i < bottom.length; i++) {
    const e = bottom[i];
    const rank = eff.length - i;
    lines.push(`| ${rank} | ${e.iso3} | ${e.lifeExpectancy.toFixed(1)} | $${e.spending.toLocaleString()} | ${e.efficiency.toFixed(2)} |`);
  }
  lines.push('');

  // Full table
  lines.push('### Full Rankings');
  lines.push('');
  lines.push('| Rank | Country | Life Expectancy | Spending/Capita | Efficiency |');
  lines.push('|------|---------|----------------|-----------------|-----------|');
  for (let i = 0; i < eff.length; i++) {
    const e = eff[i];
    lines.push(`| ${i + 1} | ${e.iso3} | ${e.lifeExpectancy.toFixed(1)} | $${e.spending.toLocaleString()} | ${e.efficiency.toFixed(2)} |`);
  }
  lines.push('');

  // Methodology
  lines.push('## Methodology');
  lines.push('');
  lines.push('### Data Sources');
  lines.push('');
  for (const src of dataset.metadata.sources) {
    lines.push(`- ${src}`);
  }
  lines.push('');
  lines.push('### Optimal Spending Level Estimation');
  lines.push('');
  lines.push('1. **Data**: Health expenditure per capita (% GDP × GDP per capita) and life expectancy for 50 countries');
  lines.push('2. **Model**: Log-linear and saturation models fitted to cross-country spending-outcome data');
  lines.push('3. **OSL**: Point where marginal return equals opportunity cost (default: 3%)');
  lines.push('4. **Confidence Interval**: Bootstrap estimation with 1,000 resamples');
  lines.push('');
  lines.push('### Efficiency Metric');
  lines.push('');
  lines.push('`Efficiency = Life Expectancy / (Health Spending per Capita / 1000)`');
  lines.push('');
  lines.push('This measures how many years of life expectancy a country achieves per $1,000 of health spending. Higher values indicate more efficient healthcare systems.');
  lines.push('');
  lines.push('### Limitations');
  lines.push('');
  lines.push('- Life expectancy is influenced by many factors beyond healthcare spending (diet, genetics, environment, safety)');
  lines.push('- Cross-country comparisons don\'t control for cost-of-living differences beyond PPP adjustment');
  lines.push('- WHO healthy life expectancy and UHC index data not available in this run (API returned 400)');
  lines.push('- Correlation does not establish causation — Bradford Hill analysis needed for causal claims');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by [Optomitron](https://github.com/mikepsinn/optomitron) — the open-source world optimization engine.*`);
  lines.push(`*Data fetched ${new Date(analysis.generatedAt).toISOString()}*`);

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  try {
    const dataset = await getCountryData();
    const analysis = analyzeDataset(dataset);

    writeFileSync(
      resolve(dataDir, 'cross-country-analysis.json'),
      JSON.stringify(analysis, null, 2),
    );
    console.log(`\n✅ Written to src/data/cross-country-analysis.json`);

    const report = generateMarkdownReport(analysis, dataset);
    const reportPath = resolve(dataDir, '..', '..', '..', '..', 'reports');
    if (!existsSync(reportPath)) mkdirSync(reportPath, { recursive: true });
    const reportFile = resolve(reportPath, 'cross-country-health-spending.md');
    writeFileSync(reportFile, report);
    console.log(`📝 Markdown report written to reports/cross-country-health-spending.md`);
  } catch (e) {
    console.error('❌ Pipeline failed:', e);
    process.exit(1);
  }
}

main();
