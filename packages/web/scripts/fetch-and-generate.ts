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
  } catch (e) {
    console.error('❌ Pipeline failed:', e);
    process.exit(1);
  }
}

main();
