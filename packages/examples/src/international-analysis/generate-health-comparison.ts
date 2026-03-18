/**
 * International Health System Comparison Analysis
 *
 * Loads health system data for all 20 countries, calculates spending
 * efficiency (life expectancy per $1000 spent), ranks countries, and
 * generates JSON + markdown outputs for website consumption.
 *
 * @see https://opg.warondisease.org
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HEALTH_SYSTEM_COMPARISON,
  rankCountries,
  getTopPerformers,
  getCountryComparison,
  type CountryHealthData,
  type RankedCountry,
} from '@optimitron/data';

import {
  POLICY_EXEMPLARS,
  getExemplarsByCategory,
} from '@optimitron/data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthEfficiency {
  country: string;
  iso3: string;
  lifeExpectancy: number;
  healthSpendingPerCapita: number;
  /** Life-years per $1,000 spent */
  efficiencyScore: number;
  systemType: string;
  universalCoverage: boolean;
}

export interface HealthRanking {
  rank: number;
  country: string;
  iso3: string;
  efficiencyScore: number;
  lifeExpectancy: number;
  spendingPerCapita: number;
  systemType: string;
}

export interface HealthInsight {
  key: string;
  title: string;
  description: string;
  supportingData: Record<string, number | string>;
}

export interface HealthExemplar {
  country: string;
  systemType: string;
  keyStrength: string;
  efficiencyRank: number;
  policyRecommendation: string;
}

export interface HealthComparisonOutput {
  generatedAt: string;
  dataSource: string;
  countryCount: number;
  rankings: HealthRanking[];
  top5: HealthRanking[];
  bottom5: HealthRanking[];
  usPosition: HealthRanking;
  insights: HealthInsight[];
  exemplars: HealthExemplar[];
  rawEfficiencies: HealthEfficiency[];
  usComparisons: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Core Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate spending efficiency for each country.
 * Metric: life-years per $1,000 spent per capita.
 */
function calculateEfficiencies(): HealthEfficiency[] {
  return HEALTH_SYSTEM_COMPARISON.map((c) => ({
    country: c.country,
    iso3: c.iso3,
    lifeExpectancy: c.lifeExpectancy,
    healthSpendingPerCapita: c.healthSpendingPerCapita,
    efficiencyScore: Number(
      ((c.lifeExpectancy / c.healthSpendingPerCapita) * 1000).toFixed(3),
    ),
    systemType: c.systemType,
    universalCoverage: c.universalCoverage,
  })).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

/**
 * Build ranked list from efficiency data.
 */
function buildRankings(efficiencies: HealthEfficiency[]): HealthRanking[] {
  return efficiencies.map((e, i) => ({
    rank: i + 1,
    country: e.country,
    iso3: e.iso3,
    efficiencyScore: e.efficiencyScore,
    lifeExpectancy: e.lifeExpectancy,
    spendingPerCapita: e.healthSpendingPerCapita,
    systemType: e.systemType,
  }));
}

/**
 * Generate key insights from the data.
 */
function generateInsights(
  rankings: HealthRanking[],
  efficiencies: HealthEfficiency[],
): HealthInsight[] {
  const us = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'USA')!;
  const sg = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'SGP')!;
  const jp = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'JPN')!;
  const th = HEALTH_SYSTEM_COMPARISON.find((c) => c.iso3 === 'THA')!;

  const usRank = rankings.find((r) => r.iso3 === 'USA')!.rank;
  const spendingRatio = (us.healthSpendingPerCapita / sg.healthSpendingPerCapita).toFixed(1);

  const countriesWithUC = HEALTH_SYSTEM_COMPARISON.filter((c) => c.universalCoverage);
  const avgLifeExpUC =
    countriesWithUC.reduce((s, c) => s + c.lifeExpectancy, 0) / countriesWithUC.length;
  const avgSpendingUC =
    countriesWithUC.reduce((s, c) => s + c.healthSpendingPerCapita, 0) / countriesWithUC.length;

  return [
    {
      key: 'singapore-efficiency',
      title: 'Singapore achieves world-class outcomes at a fraction of US cost',
      description:
        `Singapore achieves the world's 2nd highest life expectancy (${sg.lifeExpectancy} years) ` +
        `at 1/4 the US per-capita cost ($${sg.healthSpendingPerCapita.toLocaleString()} vs ` +
        `$${us.healthSpendingPerCapita.toLocaleString()}).`,
      supportingData: {
        singaporeLifeExpectancy: sg.lifeExpectancy,
        usLifeExpectancy: us.lifeExpectancy,
        singaporeSpendingPerCapita: sg.healthSpendingPerCapita,
        usSpendingPerCapita: us.healthSpendingPerCapita,
        spendingRatio: Number(spendingRatio),
      },
    },
    {
      key: 'us-spending-paradox',
      title: 'The US spends the most but ranks last in efficiency',
      description:
        `The United States spends $${us.healthSpendingPerCapita.toLocaleString()} per capita ` +
        `(17.3% of GDP) — more than any other country — yet ranks #${usRank} out of ` +
        `${rankings.length} in spending efficiency with a life expectancy of ${us.lifeExpectancy} years. ` +
        `It is the only high-income country without universal coverage.`,
      supportingData: {
        usSpendingPerCapita: us.healthSpendingPerCapita,
        usSpendingPctGDP: us.healthSpendingPctGDP,
        usLifeExpectancy: us.lifeExpectancy,
        usEfficiencyRank: usRank,
        usUninsuredRate: us.uninsuredRate,
      },
    },
    {
      key: 'universal-coverage-advantage',
      title: 'Countries with universal coverage achieve better outcomes at lower cost',
      description:
        `The ${countriesWithUC.length} countries with universal coverage average ` +
        `${avgLifeExpUC.toFixed(1)} years life expectancy at $${Math.round(avgSpendingUC).toLocaleString()} ` +
        `per capita. The US, without universal coverage, spends ${(us.healthSpendingPerCapita / avgSpendingUC).toFixed(1)}x more ` +
        `yet achieves ${(us.lifeExpectancy - avgLifeExpUC).toFixed(1)} fewer years of life expectancy.`,
      supportingData: {
        countriesWithUC: countriesWithUC.length,
        avgLifeExpectancyUC: Number(avgLifeExpUC.toFixed(1)),
        avgSpendingUC: Math.round(avgSpendingUC),
        usSpendingMultiple: Number((us.healthSpendingPerCapita / avgSpendingUC).toFixed(1)),
        lifeExpectancyGap: Number((us.lifeExpectancy - avgLifeExpUC).toFixed(1)),
      },
    },
    {
      key: 'low-cost-high-performers',
      title: 'Thailand and Costa Rica prove great health outcomes are achievable at low cost',
      description:
        `Thailand ($${th.healthSpendingPerCapita}/capita) achieves ${th.lifeExpectancy} years ` +
        `life expectancy — just ${(us.lifeExpectancy - th.lifeExpectancy).toFixed(1)} years below the US ` +
        `at 1/${Math.round(us.healthSpendingPerCapita / th.healthSpendingPerCapita)}th the cost. ` +
        `Both Thailand and Costa Rica demonstrate that well-designed primary care systems ` +
        `can achieve near-universal coverage even in middle-income countries.`,
      supportingData: {
        thailandLifeExpectancy: th.lifeExpectancy,
        thailandSpending: th.healthSpendingPerCapita,
        costaRicaLifeExpectancy: 80.3,
        costaRicaSpending: 1285,
        usSpendingToThailandRatio: Math.round(us.healthSpendingPerCapita / th.healthSpendingPerCapita),
      },
    },
    {
      key: 'system-type-comparison',
      title: 'Bismarck and Beveridge systems both outperform the US private model',
      description:
        `Among high-income nations, single-payer (Canada), Bismarck (Japan, Germany), ` +
        `and Beveridge (UK, Norway) systems all achieve higher life expectancy than the US ` +
        `at significantly lower cost. Japan's Bismarck system achieves the highest life expectancy ` +
        `(${jp.lifeExpectancy} years) at $${jp.healthSpendingPerCapita.toLocaleString()}/capita.`,
      supportingData: {
        japanLifeExpectancy: jp.lifeExpectancy,
        japanSpending: jp.healthSpendingPerCapita,
        japanSystemType: jp.systemType,
        usLifeExpectancy: us.lifeExpectancy,
        usSpending: us.healthSpendingPerCapita,
        usSystemType: us.systemType,
      },
    },
  ];
}

/**
 * Identify exemplar health systems with policy recommendations.
 */
function identifyExemplars(rankings: HealthRanking[]): HealthExemplar[] {
  return [
    {
      country: 'Singapore',
      systemType: 'mixed (3M: Medisave/MediShield/Medifund)',
      keyStrength:
        'Mandatory health savings + catastrophic insurance + government safety net. ' +
        'Competition between public hospitals keeps costs low.',
      efficiencyRank: rankings.find((r) => r.iso3 === 'SGP')!.rank,
      policyRecommendation:
        'Adopt a three-tier universal financing model: mandatory health savings accounts, ' +
        'catastrophic insurance for major expenses, and a safety net fund for the indigent.',
    },
    {
      country: 'Japan',
      systemType: 'bismarck',
      keyStrength:
        'Universal employer-based insurance with strict fee schedules. ' +
        'Mandatory preventive screening (Tokutei Kenshin) for all adults 40-74.',
      efficiencyRank: rankings.find((r) => r.iso3 === 'JPN')!.rank,
      policyRecommendation:
        'Implement universal mandatory preventive health screenings with standardized ' +
        'fee schedules to control costs while maintaining universal access.',
    },
    {
      country: 'Thailand',
      systemType: 'mixed (universal coverage scheme)',
      keyStrength:
        'Achieved universal coverage at $812/capita through a strong primary care network ' +
        'and capitation-based payment that incentivizes prevention.',
      efficiencyRank: rankings.find((r) => r.iso3 === 'THA')!.rank,
      policyRecommendation:
        'Invest heavily in primary care infrastructure and community health workers. ' +
        'Use capitation payment models to align incentives toward prevention.',
    },
    {
      country: 'Costa Rica',
      systemType: 'mixed (CCSS)',
      keyStrength:
        'Tripartite funding (employer/employee/government) with EBAIS community clinics. ' +
        'Redirected military spending to health and education after abolishing army in 1948.',
      efficiencyRank: rankings.find((r) => r.iso3 === 'CRI')!.rank,
      policyRecommendation:
        'Prioritize primary care over tertiary care. Community-based clinics (like EBAIS) ' +
        'provide cost-effective universal access even in middle-income settings.',
    },
    {
      country: 'Israel',
      systemType: 'mixed (NHI with competing health funds)',
      keyStrength:
        'Managed competition among four non-profit health funds under universal national insurance. ' +
        'Strong health IT infrastructure and preventive care emphasis.',
      efficiencyRank: rankings.find((r) => r.iso3 === 'ISR')!.rank,
      policyRecommendation:
        'Combine universal coverage mandates with managed competition among non-profit ' +
        'insurers to achieve cost control through competition without profit-driven denial.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Markdown Report Generation
// ---------------------------------------------------------------------------

function generateMarkdownReport(output: HealthComparisonOutput): string {
  const lines: string[] = [];

  lines.push('# International Health System Comparison Report');
  lines.push('');
  lines.push(`> Generated: ${output.generatedAt}`);
  lines.push(`> Countries analyzed: ${output.countryCount}`);
  lines.push(`> Data sources: ${output.dataSource}`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(
    'This analysis compares health systems across 20 countries, ranking them by ' +
    '**spending efficiency** — life-years achieved per $1,000 spent per capita. ' +
    'The results reveal a striking pattern: countries spending less but organizing ' +
    'care around universal coverage and primary care consistently outperform the ' +
    'United States, which spends more than any other nation.'
  );
  lines.push('');

  // Key Insights
  lines.push('## Key Insights');
  lines.push('');
  for (const insight of output.insights) {
    lines.push(`### ${insight.title}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');
  }

  // Top 5 Most Efficient
  lines.push('## Top 5 Most Efficient Health Systems');
  lines.push('');
  lines.push('| Rank | Country | Efficiency Score | Life Expectancy | Spending/Capita | System Type |');
  lines.push('|------|---------|-----------------|-----------------|-----------------|-------------|');
  for (const r of output.top5) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.efficiencyScore.toFixed(2)} | ` +
      `${r.lifeExpectancy} yrs | $${r.spendingPerCapita.toLocaleString()} | ${r.systemType} |`,
    );
  }
  lines.push('');
  lines.push(
    '> **Efficiency Score** = life-years per $1,000 spent per capita. Higher is better.',
  );
  lines.push('');

  // Bottom 5 (Including US)
  lines.push('## Bottom 5 Least Efficient Health Systems');
  lines.push('');
  lines.push('| Rank | Country | Efficiency Score | Life Expectancy | Spending/Capita | System Type |');
  lines.push('|------|---------|-----------------|-----------------|-----------------|-------------|');
  for (const r of output.bottom5) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.efficiencyScore.toFixed(2)} | ` +
      `${r.lifeExpectancy} yrs | $${r.spendingPerCapita.toLocaleString()} | ${r.systemType} |`,
    );
  }
  lines.push('');

  // US Position
  lines.push('## United States Position');
  lines.push('');
  lines.push(
    `The United States ranks **#${output.usPosition.rank}** out of ${output.countryCount} ` +
    `countries in health spending efficiency.`,
  );
  lines.push('');
  lines.push(`- **Life expectancy:** ${output.usPosition.lifeExpectancy} years`);
  lines.push(`- **Spending per capita:** $${output.usPosition.spendingPerCapita.toLocaleString()}`);
  lines.push(`- **Efficiency score:** ${output.usPosition.efficiencyScore.toFixed(2)}`);
  lines.push(`- **System type:** ${output.usPosition.systemType}`);
  lines.push('');

  // Exemplar Systems
  lines.push('## Exemplar Health Systems & Policy Recommendations');
  lines.push('');
  for (const ex of output.exemplars) {
    lines.push(`### ${ex.country} (Rank #${ex.efficiencyRank})`);
    lines.push('');
    lines.push(`**System type:** ${ex.systemType}`);
    lines.push('');
    lines.push(`**Key strength:** ${ex.keyStrength}`);
    lines.push('');
    lines.push(`**Policy recommendation:** ${ex.policyRecommendation}`);
    lines.push('');
  }

  // Full Rankings
  lines.push('## Full Rankings');
  lines.push('');
  lines.push('| Rank | Country | Efficiency Score | Life Expectancy | Spending/Capita | System Type |');
  lines.push('|------|---------|-----------------|-----------------|-----------------|-------------|');
  for (const r of output.rankings) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.efficiencyScore.toFixed(2)} | ` +
      `${r.lifeExpectancy} yrs | $${r.spendingPerCapita.toLocaleString()} | ${r.systemType} |`,
    );
  }
  lines.push('');

  // Methodology
  lines.push('## Methodology');
  lines.push('');
  lines.push(
    'Spending efficiency is calculated as life-years per $1,000 of health spending per capita (USD PPP). ' +
    'This metric captures how effectively a country converts health spending into longevity. ' +
    'While simplistic — it does not account for quality of life, equity, or non-health determinants — ' +
    'it provides a consistent, comparable measure across countries.',
  );
  lines.push('');
  lines.push(
    'Data sources: WHO Global Health Expenditure Database 2022, World Bank World Development Indicators, ' +
    'OECD Health Statistics 2023, CMS National Health Expenditure Accounts.',
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function generateHealthComparison(): HealthComparisonOutput {
  const efficiencies = calculateEfficiencies();
  const rankings = buildRankings(efficiencies);
  const insights = generateInsights(rankings, efficiencies);
  const exemplars = identifyExemplars(rankings);

  const usPosition = rankings.find((r) => r.iso3 === 'USA')!;
  const top5 = rankings.slice(0, 5);
  const bottom5 = rankings.slice(-5);

  // US comparisons with key countries
  const comparisonCountries = ['Singapore', 'Japan', 'United Kingdom', 'Canada', 'Germany'];
  const usComparisons: Record<string, any> = {};
  for (const cc of comparisonCountries) {
    const comp = getCountryComparison('United States', cc, HEALTH_SYSTEM_COMPARISON, 'health');
    if (comp) {
      usComparisons[cc] = comp;
    }
  }

  const output: HealthComparisonOutput = {
    generatedAt: new Date().toISOString(),
    dataSource:
      'WHO Global Health Expenditure Database 2022; World Bank WDI; OECD Health Statistics 2023',
    countryCount: HEALTH_SYSTEM_COMPARISON.length,
    rankings,
    top5,
    bottom5,
    usPosition,
    insights,
    exemplars,
    rawEfficiencies: efficiencies,
    usComparisons,
  };

  return output;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function main(): void {
  console.log('🏥 Generating international health system comparison...\n');

  const output = generateHealthComparison();

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write JSON
  const jsonPath = path.join(OUTPUT_DIR, 'health-comparison.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ JSON:     ${jsonPath}`);

  // Write Markdown
  const mdPath = path.join(OUTPUT_DIR, 'health-comparison-report.md');
  const markdown = generateMarkdownReport(output);
  fs.writeFileSync(mdPath, markdown);
  console.log(`  ✅ Markdown: ${mdPath}`);

  // Summary
  console.log(`\n📊 ${output.countryCount} countries analyzed`);
  console.log(`   Top performer: ${output.top5[0]!.country} (efficiency: ${output.top5[0]!.efficiencyScore.toFixed(2)})`);
  console.log(`   US position:   #${output.usPosition.rank} (efficiency: ${output.usPosition.efficiencyScore.toFixed(2)})`);
  console.log(`   Key insight:   ${output.insights[0]!.title}`);
}

// Run if executed directly
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('generate-health-comparison') ||
    process.argv[1].includes('tsx'));

if (isMainModule) {
  main();
}
