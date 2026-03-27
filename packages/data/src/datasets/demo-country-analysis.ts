/**
 * Demo: Run the optimizer on country health data
 *
 * Loads Singapore and US health data as TimeSeries, then compares
 * healthcare spending → life expectancy across countries.
 *
 * This is a proof-of-concept showing that the same causal pipeline used for
 * personal health data can analyze country-level policy data.
 */

import type { TimeSeries } from '@optimitron/optimizer';
import {
  healthComparisonToTimeSeries,
  getCrossCountryVariable,
} from './to-time-series';
import { HEALTH_SYSTEM_COMPARISON } from './international-comparisons';

/**
 * Analyze the relationship between healthcare spending and life expectancy
 * across all countries in the dataset.
 *
 * Returns a summary object with basic statistics and the most efficient
 * countries by life-years-per-dollar-spent.
 */
export function analyzeSpendingVsLifeExpectancy(): {
  countries: Array<{
    country: string;
    iso3: string;
    spending: number;
    lifeExpectancy: number;
  }>;
  pearsonR: number;
  topEfficiency: Array<{ country: string; ratio: number }>;
} {
  const data = HEALTH_SYSTEM_COMPARISON.map((c) => ({
    country: c.country,
    iso3: c.iso3,
    spending: c.healthSpendingPerCapita,
    lifeExpectancy: c.lifeExpectancy,
  }));

  // Manual Pearson r calculation
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.spending, 0);
  const sumY = data.reduce((s, d) => s + d.lifeExpectancy, 0);
  const sumXY = data.reduce((s, d) => s + d.spending * d.lifeExpectancy, 0);
  const sumX2 = data.reduce((s, d) => s + d.spending * d.spending, 0);
  const sumY2 = data.reduce((s, d) => s + d.lifeExpectancy * d.lifeExpectancy, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );
  const pearsonR = denominator === 0 ? 0 : numerator / denominator;

  // Efficiency ratio: life expectancy per $1000 spent
  const efficiency = data
    .map((d) => ({
      country: d.country,
      ratio: d.lifeExpectancy / (d.spending / 1000),
    }))
    .sort((a, b) => b.ratio - a.ratio);

  return {
    countries: data,
    pearsonR,
    topEfficiency: efficiency.slice(0, 5),
  };
}

/**
 * Get Singapore and US health data as TimeSeries for comparison.
 */
export function getSingaporeVsUSTimeSeries(): {
  singapore: TimeSeries[];
  us: TimeSeries[];
} {
  const allHealth = healthComparisonToTimeSeries();
  return {
    singapore: allHealth.get('SGP') ?? [],
    us: allHealth.get('USA') ?? [],
  };
}

/**
 * Print a formatted analysis to console (for demo purposes).
 */
export function printDemoAnalysis(): void {
  const result = analyzeSpendingVsLifeExpectancy();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Healthcare Spending vs Life Expectancy Analysis       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Countries analyzed: ${result.countries.length}`);
  console.log(
    `Pearson correlation (spending → life expectancy): ${result.pearsonR.toFixed(4)}`,
  );
  console.log();
  console.log('─── Top 5 Most Efficient (Life Years per $1K spent) ───');
  for (const e of result.topEfficiency) {
    console.log(`  ${e.country.padEnd(20)} ${e.ratio.toFixed(2)} years/$1K`);
  }
  console.log();

  // Singapore vs US comparison
  const sg = result.countries.find((c) => c.iso3 === 'SGP')!;
  const us = result.countries.find((c) => c.iso3 === 'USA')!;
  console.log('─── Singapore vs United States ───');
  console.log(
    `  Singapore: $${sg.spending}/capita → ${sg.lifeExpectancy} years`,
  );
  console.log(
    `  US:        $${us.spending}/capita → ${us.lifeExpectancy} years`,
  );
  console.log(
    `  SG spends ${((1 - sg.spending / us.spending) * 100).toFixed(0)}% less but lives ${(sg.lifeExpectancy - us.lifeExpectancy).toFixed(1)} years longer`,
  );
  console.log();

  // TimeSeries stats
  const { singapore: sgSeries, us: usSeries } = getSingaporeVsUSTimeSeries();
  console.log('─── TimeSeries Generated ───');
  console.log(`  Singapore: ${sgSeries.length} variables`);
  console.log(`  US:        ${usSeries.length} variables`);

  const allHealth = healthComparisonToTimeSeries();
  let totalSeries = 0;
  for (const [, series] of allHealth) {
    totalSeries += series.length;
  }
  console.log(`  All health data: ${totalSeries} series across ${allHealth.size} countries`);
}
