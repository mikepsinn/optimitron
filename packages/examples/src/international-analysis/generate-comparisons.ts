/**
 * Pre-computed International Comparison Analyses
 *
 * Master entry point that loads all 4 international datasets (health, drug policy,
 * education, criminal justice), calculates efficiency rankings, identifies exemplars
 * and key insights, and outputs:
 *   - JSON:     packages/examples/output/cross-country-analysis.json
 *   - Markdown: packages/examples/output/cross-country-report.md
 *
 * @see generate-cross-country-analysis.ts for domain-specific analysis logic
 * @see generate-health-comparison.ts, generate-drug-policy-comparison.ts, etc.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateCrossCountryAnalysis,
  type CrossCountryAnalysis,
} from './generate-cross-country-analysis.js';

import { POLICY_EXEMPLARS } from '@optimitron/data';

import {
  HEALTH_SYSTEM_COMPARISON,
  DRUG_POLICY_COMPARISON,
  EDUCATION_COMPARISON,
  CRIMINAL_JUSTICE_COMPARISON,
} from '@optimitron/data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

// ---------------------------------------------------------------------------
// Combined Markdown Report Generation
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive combined markdown report covering all four
 * policy domains plus policy exemplars.
 */
export function generateCombinedMarkdownReport(analysis: CrossCountryAnalysis): string {
  const lines: string[] = [];

  lines.push('# International Cross-Country Comparison Report');
  lines.push('');
  lines.push(`> Generated: ${analysis.generatedAt}`);
  lines.push(`> Domains: Health, Drug Policy, Education, Criminal Justice`);
  lines.push(`> Policy Exemplars: ${analysis.policyExemplars.length}`);
  lines.push('');

  // Table of Contents
  lines.push('## Table of Contents');
  lines.push('');
  lines.push('1. [Executive Summary](#executive-summary)');
  lines.push('2. [Health Systems](#health-systems)');
  lines.push('3. [Drug Policy](#drug-policy)');
  lines.push('4. [Education](#education)');
  lines.push('5. [Criminal Justice](#criminal-justice)');
  lines.push('6. [Policy Exemplars](#policy-exemplars)');
  lines.push('7. [Cross-Domain Findings](#cross-domain-findings)');
  lines.push('8. [Methodology](#methodology)');
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(
    'This report presents a comprehensive comparison of policy outcomes across ' +
    `${HEALTH_SYSTEM_COMPARISON.length} countries (health), ` +
    `${DRUG_POLICY_COMPARISON.length} countries (drug policy), ` +
    `${EDUCATION_COMPARISON.length} countries (education), and ` +
    `${CRIMINAL_JUSTICE_COMPARISON.length} countries (criminal justice). ` +
    'By analyzing spending efficiency, outcome metrics, and policy approaches, ' +
    'we identify what works, what doesn\'t, and which policies are most transferable ' +
    'to other national contexts.',
  );
  lines.push('');
  lines.push('**Key cross-domain finding:** Countries that invest in prevention, ' +
    'treat social problems as public health issues, and prioritize evidence-based policy ' +
    'consistently achieve better outcomes at lower cost than those relying on punitive ' +
    'or market-driven approaches.');
  lines.push('');

  // ─── Health Systems ──────────────────────────────────────────────────
  lines.push('## Health Systems');
  lines.push('');
  lines.push(`Countries analyzed: ${analysis.health.rankings.length}`);
  lines.push('');

  lines.push('### Health Rankings (by spending efficiency)');
  lines.push('');
  lines.push('| Rank | Country | Efficiency | Life Expectancy | Spending/Capita | System |');
  lines.push('|------|---------|------------|-----------------|-----------------|--------|');
  for (const r of analysis.health.rankings) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.efficiencyScore.toFixed(2)} | ` +
      `${r.lifeExpectancy} yrs | $${r.spendingPerCapita.toLocaleString()} | ${r.systemType} |`,
    );
  }
  lines.push('');

  lines.push('### Health Insights');
  lines.push('');
  for (const insight of analysis.health.insights) {
    lines.push(`#### ${insight.title}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');
  }

  lines.push('### Health Exemplars');
  lines.push('');
  for (const ex of analysis.health.exemplars) {
    lines.push(`- **${ex.country}** (Rank #${ex.efficiencyRank}): ${ex.keyStrength.slice(0, 120)}...`);
  }
  lines.push('');

  // ─── Drug Policy ─────────────────────────────────────────────────────
  lines.push('## Drug Policy');
  lines.push('');
  lines.push(`Countries analyzed: ${analysis.drugPolicy.rankings.length}`);
  lines.push('');

  lines.push('### Drug Policy Rankings (by composite outcome score)');
  lines.push('');
  lines.push('| Rank | Country | Approach | Score | Deaths/100K | Incarceration | Treatment |');
  lines.push('|------|---------|----------|-------|-------------|---------------|-----------|');
  for (const r of analysis.drugPolicy.rankings) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.approach} | ${r.outcomeScore} | ` +
      `${r.drugDeathsPer100K} | ${r.incarcerationRatePer100K}/100K | ${r.treatmentAccessRate}% |`,
    );
  }
  lines.push('');

  lines.push('### Drug Policy Insights');
  lines.push('');
  for (const insight of analysis.drugPolicy.insights) {
    lines.push(`#### ${insight.title}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');
  }

  lines.push('### Drug Policy Exemplars');
  lines.push('');
  for (const ex of analysis.drugPolicy.exemplars) {
    lines.push(`- **${ex.country}** (${ex.approach}, Rank #${ex.rank}): ${ex.keyOutcome}`);
  }
  lines.push('');

  // ─── Education ───────────────────────────────────────────────────────
  lines.push('## Education');
  lines.push('');
  lines.push(`Countries analyzed: ${analysis.education.rankings.length}`);
  lines.push('');

  lines.push('### Education Rankings (by spending efficiency)');
  lines.push('');
  lines.push('| Rank | Country | Efficiency | Avg PISA | Spending (% GDP) | Teacher Pay |');
  lines.push('|------|---------|------------|----------|------------------|-------------|');
  for (const r of analysis.education.rankings) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.efficiencyScore} | ${r.avgPisaScore} | ` +
      `${r.spendingPctGDP}% | ${r.teacherSalaryRatio}x |`,
    );
  }
  lines.push('');

  lines.push('### Education Insights');
  lines.push('');
  for (const insight of analysis.education.insights) {
    lines.push(`#### ${insight.title}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');
  }

  lines.push('### Education Exemplars');
  lines.push('');
  for (const ex of analysis.education.exemplars) {
    lines.push(`- **${ex.country}** (Rank #${ex.rank}): ${ex.keyStrength.slice(0, 120)}...`);
  }
  lines.push('');

  // ─── Criminal Justice ────────────────────────────────────────────────
  lines.push('## Criminal Justice');
  lines.push('');
  lines.push(`Countries analyzed: ${analysis.criminalJustice.rankings.length}`);
  lines.push('');

  lines.push('### Criminal Justice Rankings (by composite outcome score)');
  lines.push('');
  lines.push('| Rank | Country | Score | Incarceration | Homicide | Recidivism |');
  lines.push('|------|---------|-------|---------------|----------|------------|');
  for (const r of analysis.criminalJustice.rankings) {
    lines.push(
      `| ${r.rank} | ${r.country} | ${r.outcomeScore} | ` +
      `${r.incarcerationRate}/100K | ${r.homicideRate} | ${r.recidivismRate}% |`,
    );
  }
  lines.push('');

  lines.push('### Criminal Justice Insights');
  lines.push('');
  for (const insight of analysis.criminalJustice.insights) {
    lines.push(`#### ${insight.title}`);
    lines.push('');
    lines.push(insight.description);
    lines.push('');
  }

  lines.push('### Criminal Justice Exemplars');
  lines.push('');
  for (const ex of analysis.criminalJustice.exemplars) {
    lines.push(`- **${ex.country}** (Rank #${ex.rank}): ${ex.keyStrength.slice(0, 120)}...`);
  }
  lines.push('');

  // ─── Policy Exemplars ────────────────────────────────────────────────
  lines.push('## Policy Exemplars');
  lines.push('');
  lines.push(`Total exemplars documented: ${analysis.policyExemplars.length}`);
  lines.push('');

  lines.push('| Policy | Country | Category | Transferability | Year |');
  lines.push('|--------|---------|----------|-----------------|------|');
  for (const ex of analysis.policyExemplars) {
    const shortName = ex.name.length > 50 ? ex.name.slice(0, 47) + '...' : ex.name;
    lines.push(
      `| ${shortName} | ${ex.originCountry} | ${ex.category} | ` +
      `${ex.estimatedTransferability} | ${ex.yearImplemented} |`,
    );
  }
  lines.push('');

  for (const ex of analysis.policyExemplars) {
    lines.push(`### ${ex.name}`);
    lines.push('');
    lines.push(`**Country:** ${ex.originCountry} | **Category:** ${ex.category} | ` +
      `**Transferability:** ${ex.estimatedTransferability} | **Year:** ${ex.yearImplemented}`);
    lines.push('');
    lines.push(ex.description);
    lines.push('');
    lines.push('**Measured Outcomes:**');
    lines.push('');
    for (const outcome of ex.outcomes) {
      const direction = outcome.changePercent > 0 ? '📈' : '📉';
      lines.push(
        `- ${direction} ${outcome.metric}: ${outcome.beforeValue} → ${outcome.afterValue} ` +
        `(${outcome.changePercent > 0 ? '+' : ''}${outcome.changePercent}%)`,
      );
    }
    lines.push('');
    lines.push(`**Adaptation notes:** ${ex.adaptationNotes}`);
    lines.push('');
  }

  // ─── Cross-Domain Findings ───────────────────────────────────────────
  lines.push('## Cross-Domain Findings');
  lines.push('');
  lines.push(
    '### 1. Prevention is cheaper than treatment (across all domains)',
  );
  lines.push('');
  lines.push(
    'Countries investing in upstream prevention — universal health coverage, early childhood ' +
    'education, drug treatment access, and rehabilitative justice — consistently achieve ' +
    'better outcomes at lower total cost than those that rely on downstream interventions ' +
    '(emergency rooms, prisons, enforcement).',
  );
  lines.push('');

  lines.push('### 2. The US is a consistent outlier — highest spending, worst outcomes');
  lines.push('');
  lines.push(
    'Across health, drug policy, education, and criminal justice, the United States ' +
    'spends more per capita than nearly every other developed nation yet ranks at or ' +
    'near the bottom in outcomes. This suggests systemic design failures rather than ' +
    'resource constraints.',
  );
  lines.push('');

  lines.push('### 3. Small countries can be big innovators');
  lines.push('');
  lines.push(
    'Singapore (health efficiency), Portugal (drug decriminalization), Finland (education equity), ' +
    'Norway (rehabilitative justice), and Estonia (digital governance) — all relatively small nations — ' +
    'have produced the most transferable policy innovations.',
  );
  lines.push('');

  lines.push('### 4. Policy approach matters more than spending level');
  lines.push('');
  lines.push(
    'The correlation between spending and outcomes is weak across all four domains. ' +
    'System design, institutional quality, and policy approach explain far more variance ' +
    'in outcomes than raw spending levels.',
  );
  lines.push('');

  // ─── Methodology ─────────────────────────────────────────────────────
  lines.push('## Methodology');
  lines.push('');
  lines.push('### Data Sources');
  lines.push('');
  lines.push('- WHO Global Health Observatory & Expenditure Database (2022)');
  lines.push('- OECD Health Statistics, Education at a Glance, Social Expenditure (2023)');
  lines.push('- World Bank World Development Indicators (2022)');
  lines.push('- UNODC World Drug Report (2023)');
  lines.push('- EMCDDA European Drug Report (2023)');
  lines.push('- PISA 2022 Results (OECD)');
  lines.push('- Institute for Criminal Policy Research / World Prison Brief');
  lines.push('- Country-specific government statistical agencies');
  lines.push('');

  lines.push('### Efficiency Metrics');
  lines.push('');
  lines.push('- **Health:** Life-years per $1,000 spent per capita (USD PPP)');
  lines.push('- **Drug Policy:** Composite score (drug deaths 35%, incarceration 25%, treatment access 25%, HIV among PWID 15%)');
  lines.push('- **Education:** Average PISA score per % GDP spent on education');
  lines.push('- **Criminal Justice:** Composite score (homicide rate 40%, recidivism 35%, incarceration rate 25%)');
  lines.push('');

  lines.push('### Limitations');
  lines.push('');
  lines.push('- Efficiency metrics are simplified; they do not capture equity, quality of life, or distributional effects.');
  lines.push('- Cross-country comparisons are confounded by cultural, geographic, demographic, and institutional differences.');
  lines.push('- Data availability and measurement methods vary across countries.');
  lines.push('- Transferability assessments are qualitative and necessarily approximate.');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function runComparisons(): {
  analysis: CrossCountryAnalysis;
  markdownReport: string;
} {
  const analysis = generateCrossCountryAnalysis();
  const markdownReport = generateCombinedMarkdownReport(analysis);
  return { analysis, markdownReport };
}

function main(): void {
  console.log('🌍 Generating pre-computed international comparison analyses...\n');

  const { analysis, markdownReport } = runComparisons();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write combined JSON
  const jsonPath = path.join(OUTPUT_DIR, 'cross-country-analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
  console.log(`  ✅ Combined JSON:     ${jsonPath}`);

  // Write combined markdown report
  const mdPath = path.join(OUTPUT_DIR, 'cross-country-report.md');
  fs.writeFileSync(mdPath, markdownReport);
  console.log(`  ✅ Combined Markdown: ${mdPath}`);

  // Summary
  console.log('\n📊 Analysis Summary:');
  console.log(`   Health:           ${analysis.health.rankings.length} countries ranked`);
  console.log(`   Drug Policy:      ${analysis.drugPolicy.rankings.length} countries ranked`);
  console.log(`   Education:        ${analysis.education.rankings.length} countries ranked`);
  console.log(`   Criminal Justice: ${analysis.criminalJustice.rankings.length} countries ranked`);
  console.log(`   Policy Exemplars: ${analysis.policyExemplars.length} documented`);
  console.log(`   Report length:    ${(markdownReport.length / 1024).toFixed(1)} KB`);
}

// CLI entry
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('generate-comparisons') || process.argv[1].includes('tsx'));

if (isMainModule) {
  main();
}
