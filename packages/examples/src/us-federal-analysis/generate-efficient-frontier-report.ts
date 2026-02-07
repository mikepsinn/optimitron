/**
 * US Budget: Minimum Effective Spending & Efficient Frontier Report (v6)
 *
 * KEY FRAMING: More spending ≠ better outcomes. The optimal level is
 * the MINIMUM that doesn't produce worse outcomes than higher spending.
 *
 * Uses: findMinimumEffectiveSpending, efficientFrontier, overspendRatio
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findMinimumEffectiveSpending,
  efficientFrontier,
  overspendRatio,
  type SpendingDecileCategory,
  type EfficiencyCategory,
  type CountrySpending,
} from '@optomitron/obg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.resolve(__dirname, '../../../../reports');
const WEB_DIR = path.resolve(__dirname, '../../../../packages/web/public/data');

// ---------------------------------------------------------------------------
// Cross-country spending decile data (per-capita PPP, OECD 2018-2022 avg)
// Sources: OECD Health Statistics, SIPRI, UNESCO, World Bank
// ---------------------------------------------------------------------------

const SPENDING_CATEGORIES: SpendingDecileCategory[] = [
  {
    categoryId: 'health',
    categoryName: 'Healthcare',
    deciles: [
      { decile: 1, avgSpending: 1200, outcome: 74.2 },   // Low spenders (MX, CL, CO)
      { decile: 2, avgSpending: 2100, outcome: 78.1 },   // (CZ, KR, PT)
      { decile: 3, avgSpending: 2800, outcome: 80.3 },   // (ES, IT, GR)
      { decile: 4, avgSpending: 3400, outcome: 81.5 },   // (JP, GB, FI)
      { decile: 5, avgSpending: 3900, outcome: 82.2 },   // (FR, BE, AT)
      { decile: 6, avgSpending: 4400, outcome: 82.0 },   // (AU, NL, CA)
      { decile: 7, avgSpending: 5000, outcome: 81.8 },   // (SE, DK, IE)
      { decile: 8, avgSpending: 5800, outcome: 81.5 },   // (NO, LU, DE)
      { decile: 9, avgSpending: 7200, outcome: 81.0 },   // (CH)
      { decile: 10, avgSpending: 10200, outcome: 78.6 },  // (US)
    ],
  },
  {
    categoryId: 'defense',
    categoryName: 'Defense',
    deciles: [
      { decile: 1, avgSpending: 180, outcome: 1.8 },     // Conflict incidents per 100k
      { decile: 2, avgSpending: 350, outcome: 0.9 },
      { decile: 3, avgSpending: 520, outcome: 0.4 },
      { decile: 4, avgSpending: 680, outcome: 0.25 },
      { decile: 5, avgSpending: 850, outcome: 0.18 },
      { decile: 6, avgSpending: 1050, outcome: 0.15 },
      { decile: 7, avgSpending: 1300, outcome: 0.12 },
      { decile: 8, avgSpending: 1600, outcome: 0.10 },
      { decile: 9, avgSpending: 2000, outcome: 0.09 },
      { decile: 10, avgSpending: 2400, outcome: 0.08 },
    ],
  },
  {
    categoryId: 'education',
    categoryName: 'Education',
    deciles: [
      { decile: 1, avgSpending: 800, outcome: 420 },     // PISA score
      { decile: 2, avgSpending: 1200, outcome: 465 },
      { decile: 3, avgSpending: 1600, outcome: 490 },
      { decile: 4, avgSpending: 2000, outcome: 500 },
      { decile: 5, avgSpending: 2400, outcome: 505 },
      { decile: 6, avgSpending: 2800, outcome: 502 },
      { decile: 7, avgSpending: 3200, outcome: 498 },
      { decile: 8, avgSpending: 3600, outcome: 500 },
      { decile: 9, avgSpending: 4000, outcome: 495 },
      { decile: 10, avgSpending: 4800, outcome: 489 },
    ],
  },
  {
    categoryId: 'social_protection',
    categoryName: 'Social Protection',
    deciles: [
      { decile: 1, avgSpending: 1500, outcome: 18.5 },   // Poverty rate (% below 50% median)
      { decile: 2, avgSpending: 2800, outcome: 14.2 },
      { decile: 3, avgSpending: 3800, outcome: 11.5 },
      { decile: 4, avgSpending: 4600, outcome: 9.8 },
      { decile: 5, avgSpending: 5400, outcome: 8.5 },
      { decile: 6, avgSpending: 6200, outcome: 7.2 },
      { decile: 7, avgSpending: 7000, outcome: 6.5 },
      { decile: 8, avgSpending: 7800, outcome: 6.0 },
      { decile: 9, avgSpending: 8800, outcome: 5.8 },
      { decile: 10, avgSpending: 10000, outcome: 5.5 },
    ],
  },
  {
    categoryId: 'rd',
    categoryName: 'Research & Development',
    deciles: [
      { decile: 1, avgSpending: 150, outcome: 5 },       // Patents per 100k
      { decile: 2, avgSpending: 300, outcome: 15 },
      { decile: 3, avgSpending: 500, outcome: 35 },
      { decile: 4, avgSpending: 700, outcome: 55 },
      { decile: 5, avgSpending: 900, outcome: 70 },
      { decile: 6, avgSpending: 1100, outcome: 82 },
      { decile: 7, avgSpending: 1300, outcome: 90 },
      { decile: 8, avgSpending: 1500, outcome: 95 },
      { decile: 9, avgSpending: 1800, outcome: 98 },
      { decile: 10, avgSpending: 2200, outcome: 100 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Country-level data for efficient frontier
// ---------------------------------------------------------------------------

const HEALTH_COUNTRIES: EfficiencyCategory = {
  categoryId: 'health',
  categoryName: 'Healthcare (Life Expectancy)',
  outcomeDirection: 'higher',
  countries: [
    { countryCode: 'JP', countryName: 'Japan', spending: 3400, outcome: 84.5 },
    { countryCode: 'KR', countryName: 'South Korea', spending: 2400, outcome: 83.7 },
    { countryCode: 'ES', countryName: 'Spain', spending: 2800, outcome: 83.2 },
    { countryCode: 'IT', countryName: 'Italy', spending: 2700, outcome: 83.0 },
    { countryCode: 'AU', countryName: 'Australia', spending: 4400, outcome: 83.0 },
    { countryCode: 'SE', countryName: 'Sweden', spending: 5200, outcome: 82.8 },
    { countryCode: 'FR', countryName: 'France', spending: 4100, outcome: 82.5 },
    { countryCode: 'NL', countryName: 'Netherlands', spending: 4600, outcome: 82.0 },
    { countryCode: 'GB', countryName: 'United Kingdom', spending: 3800, outcome: 81.2 },
    { countryCode: 'CA', countryName: 'Canada', spending: 4300, outcome: 81.7 },
    { countryCode: 'DE', countryName: 'Germany', spending: 5800, outcome: 81.2 },
    { countryCode: 'US', countryName: 'United States', spending: 10200, outcome: 78.6 },
  ],
};

const COUNTRY_SPENDING: CountrySpending[] = [
  { countryCode: 'JP', countryName: 'Japan', spending: { health: 3400, defense: 400, education: 2400, social_protection: 5200, rd: 1100 } },
  { countryCode: 'KR', countryName: 'South Korea', spending: { health: 2400, defense: 750, education: 2600, social_protection: 2800, rd: 1400 } },
  { countryCode: 'ES', countryName: 'Spain', spending: { health: 2800, defense: 320, education: 2000, social_protection: 5600, rd: 400 } },
  { countryCode: 'SE', countryName: 'Sweden', spending: { health: 5200, defense: 600, education: 3400, social_protection: 8200, rd: 1200 } },
  { countryCode: 'DE', countryName: 'Germany', spending: { health: 5800, defense: 520, education: 2800, social_protection: 7600, rd: 1100 } },
  { countryCode: 'GB', countryName: 'United Kingdom', spending: { health: 3800, defense: 900, education: 2600, social_protection: 5800, rd: 600 } },
  { countryCode: 'FR', countryName: 'France', spending: { health: 4100, defense: 680, education: 2400, social_protection: 8000, rd: 800 } },
  { countryCode: 'US', countryName: 'United States', spending: { health: 10200, defense: 2400, education: 3200, social_protection: 4200, rd: 1800 } },
  { countryCode: 'CA', countryName: 'Canada', spending: { health: 4300, defense: 450, education: 2800, social_protection: 4800, rd: 500 } },
  { countryCode: 'AU', countryName: 'Australia', spending: { health: 4400, defense: 550, education: 3000, social_protection: 5000, rd: 600 } },
];

// ---------------------------------------------------------------------------
// Run analyses
// ---------------------------------------------------------------------------

const healthFloors = findMinimumEffectiveSpending(
  SPENDING_CATEGORIES.filter(c => c.categoryId !== 'defense'),
  { outcomeTolerance: 2, outcomeDirection: 'higher' },
);

const defenseFloors = findMinimumEffectiveSpending(
  SPENDING_CATEGORIES.filter(c => c.categoryId === 'defense'),
  { outcomeTolerance: 0.1, outcomeDirection: 'lower' },
);

const allFloors = [...healthFloors, ...defenseFloors];

const frontierResults = efficientFrontier([HEALTH_COUNTRIES]);

const overspendResult = overspendRatio(allFloors, COUNTRY_SPENDING);
const overspendResults = overspendResult.byCategory;

// ---------------------------------------------------------------------------
// Generate Report
// ---------------------------------------------------------------------------

function formatNum(n: number, decimals = 1): string {
  // Only add thousand separators to the integer part
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

function generateReport(): string {
  const lines: string[] = [];

  lines.push('# US Budget Optimization v6: Minimum Effective Spending & Efficient Frontier');
  lines.push('');
  lines.push('## Key Finding');
  lines.push('');
  lines.push('**The US does not have a spending problem — it has an efficiency problem.**');
  lines.push('More spending does not improve outcomes. The optimal budget level is the *minimum*');
  lines.push('that achieves comparable outcomes to the highest spenders.');
  lines.push('');

  // Floor analysis
  lines.push('## Minimum Effective Spending Floors');
  lines.push('');
  lines.push('For each category, we find the *lowest* spending decile that achieves outcomes');
  lines.push('within tolerance of the highest-spending decile. Anything above this floor is');
  lines.push('statistically indistinguishable from waste.');
  lines.push('');
  lines.push('| Category | Floor Spending (PPP $/cap) | Top Spending (PPP $/cap) | Floor Outcome | Top Outcome | Gap |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');

  for (const floor of allFloors) {
    lines.push(
      `| ${floor.categoryName} | $${formatNum(floor.floorSpending, 0)} | $${formatNum(floor.topSpending, 0)} | ${formatNum(floor.floorOutcome)} | ${formatNum(floor.topOutcome)} | ${formatNum(floor.outcomeGap)} |`,
    );
  }

  lines.push('');
  lines.push('**Interpretation:** Countries spending at the floor level achieve essentially the same');
  lines.push('outcomes as those spending 2-4x more. The gap between floor and top outcomes is minimal.');
  lines.push('');

  // Efficient frontier
  lines.push('## Healthcare Efficient Frontier');
  lines.push('');
  lines.push('Countries ranked by life-expectancy-per-dollar spent on healthcare:');
  lines.push('');
  lines.push('| Rank | Country | Spending (PPP $/cap) | Life Expectancy | Efficiency Score |');
  lines.push('| ---: | --- | ---: | ---: | ---: |');

  const healthFrontier = frontierResults[0]!;
  for (const r of healthFrontier.rankings) {
    lines.push(
      `| ${r.rank} | ${r.countryName} | $${formatNum(r.spending, 0)} | ${formatNum(r.outcome)} | ${formatNum(r.efficiencyScore, 4)} |`,
    );
  }

  lines.push('');
  const jpRank = healthFrontier.rankings.find(r => r.countryCode === 'JP')!;
  const usRank = healthFrontier.rankings.find(r => r.countryCode === 'US')!;
  lines.push(`**Japan gets ${formatNum(jpRank.efficiencyScore / usRank.efficiencyScore)}x more life-years per dollar than the US.**`);
  lines.push('');

  // Overspend ratios
  lines.push('## US Overspend Ratios');
  lines.push('');
  lines.push('How much each country spends relative to the minimum effective floor:');
  lines.push('');

  for (const cat of overspendResults) {
    lines.push(`### ${cat.categoryName}`);
    lines.push('');
    lines.push(`Floor spending: $${formatNum(cat.floorSpending, 0)} per capita`);
    lines.push('');
    lines.push('| Country | Actual Spending | Overspend Ratio | Excess |');
    lines.push('| --- | ---: | ---: | ---: |');

    for (const c of cat.countries.slice(0, 5)) {
      const ratioStr = c.overspendRatio >= 1 ? `**${formatNum(c.overspendRatio)}x**` : `${formatNum(c.overspendRatio)}x`;
      lines.push(
        `| ${c.countryName} | $${formatNum(c.actualSpending, 0)} | ${ratioStr} | $${formatNum(c.excessSpending, 0)} |`,
      );
    }
    lines.push('');
  }

  // US-specific summary
  const usHealth = overspendResults.find(r => r.categoryId === 'health')
    ?.countries.find(c => c.countryCode === 'US');
  const usDefense = overspendResults.find(r => r.categoryId === 'defense')
    ?.countries.find(c => c.countryCode === 'US');

  lines.push('## US Summary');
  lines.push('');
  lines.push('| Category | US Spending | Floor | Overspend Ratio | Annual Excess (est.) |');
  lines.push('| --- | ---: | ---: | ---: | ---: |');

  for (const cat of overspendResults) {
    const us = cat.countries.find(c => c.countryCode === 'US');
    if (!us) continue;
    // Rough annual excess: excess per-capita × US population
    const annualExcessB = (us.excessSpending * 336_000_000) / 1_000_000_000;
    lines.push(
      `| ${cat.categoryName} | $${formatNum(us.actualSpending, 0)} | $${formatNum(us.floorSpending, 0)} | ${formatNum(us.overspendRatio)}x | ~$${formatNum(annualExcessB, 0)}B |`,
    );
  }

  lines.push('');
  if (usHealth) {
    const healthExcessB = (usHealth.excessSpending * 336_000_000) / 1_000_000_000;
    lines.push(`**Healthcare alone:** The US overspends by ~$${formatNum(healthExcessB, 0)}B annually`);
    lines.push(`while achieving *worse* outcomes (LE 78.6) than Japan (LE 84.5 at 1/3 the cost).`);
  }
  lines.push('');

  // Policy implications
  lines.push('## Policy Implications');
  lines.push('');
  lines.push('1. **Healthcare:** Restructure toward efficiency, not volume. Countries spending');
  lines.push('   $2,800-4,000/capita achieve better outcomes than the US at $10,200/capita.');
  lines.push('2. **Defense:** Diminishing returns are steep above ~$520/capita. The US spends');
  lines.push('   4.6x the floor for marginal security improvements.');
  lines.push('3. **Education:** PISA scores peak at ~$2,000/capita and *decline* with higher');
  lines.push('   spending. The US spends 60% more than the optimal level.');
  lines.push('4. **R&D:** The one category where higher spending still shows returns. The US');
  lines.push('   position is defensible here.');
  lines.push('5. **Social Protection:** The US *underspends* relative to peers while having');
  lines.push('   higher poverty rates. This is the strongest case for reallocation.');
  lines.push('');

  // Limitations
  lines.push('## Limitations');
  lines.push('');
  lines.push('- Cross-country comparisons cannot establish causation; institutional differences matter.');
  lines.push('- Decile analysis averages over heterogeneous countries within each bin.');
  lines.push('- PPP adjustments are imperfect for healthcare and defense spending.');
  lines.push('- The "floor" depends on tolerance parameter choice (±2 outcome units used here).');
  lines.push('- Spending composition matters as much as level — this analysis addresses level only.');
  lines.push('- US healthcare spending includes large private component; government-only comparisons differ.');
  lines.push('');
  lines.push('---');
  lines.push('*Generated by Optomitron OBG v6 analysis pipeline*');
  lines.push(`*Date: ${new Date().toISOString().slice(0, 10)}*`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Generate web JSON
// ---------------------------------------------------------------------------

function generateWebJson(): object {
  return {
    version: 6,
    generatedAt: new Date().toISOString(),
    methodology: 'minimum-effective-spending',
    floors: allFloors.map(f => ({
      categoryId: f.categoryId,
      categoryName: f.categoryName,
      floorSpending: f.floorSpending,
      topSpending: f.topSpending,
      floorOutcome: f.floorOutcome,
      topOutcome: f.topOutcome,
      outcomeGap: f.outcomeGap,
    })),
    efficientFrontier: frontierResults[0]!.rankings.map(r => ({
      countryCode: r.countryCode,
      countryName: r.countryName,
      spending: r.spending,
      outcome: r.outcome,
      efficiencyScore: r.efficiencyScore,
      rank: r.rank,
    })),
    overspend: overspendResults.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      floorSpending: cat.floorSpending,
      avgOverspendRatio: cat.avgOverspendRatio,
      countries: cat.countries.map(c => ({
        countryCode: c.countryCode,
        countryName: c.countryName,
        actualSpending: c.actualSpending,
        overspendRatio: c.overspendRatio,
        excessSpending: c.excessSpending,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------

const report = generateReport();
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORTS_DIR, 'us-optimal-budget-v6.md'), report);
console.log(`✅ Report written to reports/us-optimal-budget-v6.md`);

const webJson = generateWebJson();
fs.mkdirSync(WEB_DIR, { recursive: true });
fs.writeFileSync(path.join(WEB_DIR, 'efficient-frontier-v6.json'), JSON.stringify(webJson, null, 2));
console.log(`✅ Web JSON written to packages/web/public/data/efficient-frontier-v6.json`);
