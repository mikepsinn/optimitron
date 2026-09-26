#!/usr/bin/env tsx
/**
 * Generate descriptive spending comparisons and clearly labeled policy assumptions.
 * This pipeline does not identify causal effects or optimal allocations.
 *
 * Run: pnpm --filter @optimitron/web run generate
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// OBG imports
import {
  analyzeEfficiency,
  attributeFieldsToLines,
  summarizeEfficiencyByField,
  type BudgetReportOecdBenchmark,
  type FieldBenchmarkedLine,
  type FieldEfficiencyFinding,
} from '@optimitron/obg';

// Data imports
import {
  US_FEDERAL_BUDGET,
  toRealPerCapita,
  historicalToRealPerCapita,
  oecdBudgetPanelToSpendingOutcome,
  OECD_CATEGORY_MAPPINGS,
  NON_DISCRETIONARY_CATEGORIES,
  COUNTRY_NAMES,
  type OECDCategoryMapping,
  type OECDSpendingField,
} from '@optimitron/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');

// Jurisdiction config — change to generate for any country
const JURISDICTION = {
  code: 'USA',
  name: 'United States',
  population: 339_000_000,
};

// Use canonical mappings from @optimitron/data (no local duplicates)
const OECD_MAPPINGS = OECD_CATEGORY_MAPPINGS;
const NON_DISCRETIONARY = NON_DISCRETIONARY_CATEGORIES;
type OECDMapping = OECDCategoryMapping;

// ─── OECD Field Descriptions ─────────────────────────────────────────

/**
 * What each OECD spending field measures. Several budget lines borrow the
 * same field, so field-level figures (spending per capita, overspend,
 * savings, policy effects) are named for the field, never for a line that
 * only borrows it.
 */
const OECD_FIELDS: Record<OECDSpendingField, { label: string; policySubject: string; policyCategory: string }> = {
  militarySpendingPerCapitaPpp: {
    label: 'Military spending',
    policySubject: 'Military',
    policyCategory: 'military',
  },
  healthSpendingPerCapitaPpp: {
    label: 'Total health spending (public and private)',
    policySubject: 'National Health Spending',
    policyCategory: 'health',
  },
  educationSpendingPerCapitaPpp: {
    label: 'Government education spending (all levels)',
    policySubject: 'Public Education Spending',
    policyCategory: 'education',
  },
  socialSpendingPerCapitaPpp: {
    label: 'Public social spending (pensions, health, income support)',
    policySubject: 'Public Social Spending',
    policyCategory: 'social_spending',
  },
  rdSpendingPerCapitaPpp: {
    label: 'Total R&D spending (business and government)',
    policySubject: 'National R&D Spending',
    policyCategory: 'research_and_development',
  },
};

// ─── Budget Analysis (OBG) ──────────────────────────────────────────

import {
  type BudgetAnalysisOutput,
  type BudgetCategoryOutput,
  type PolicyAnalysisOutput,
  type PolicyOutput,
} from '../src/lib/generated-analysis-schemas.js';

type GeneratedBudgetCategory = BudgetCategoryOutput & { oecdBenchmark?: BudgetReportOecdBenchmark };
type GeneratedBudgetAnalysis = Omit<BudgetAnalysisOutput, 'categories'> & { categories: GeneratedBudgetCategory[] };

/** Keep one outcome definition per national field; never replace missing income with life expectancy. */
function comparisonMapping(mapping: OECDMapping): OECDMapping {
  if (mapping.spendingField === 'socialSpendingPerCapitaPpp' || mapping.spendingField === 'rdSpendingPerCapitaPpp') {
    return {
      ...mapping,
      outcomeField: 'afterTaxMedianIncomePpp',
      outcomeName: 'Measured after-tax median disposable income (OECD real PPP, equivalised household)',
    };
  }
  return mapping;
}

function comparisonData(mapping: OECDMapping) {
  const data = oecdBudgetPanelToSpendingOutcome(mapping.spendingField, mapping.outcomeField);
  return mapping.negateOutcome ? data.map(d => ({ ...d, outcome: 100 - d.outcome })) : data;
}

function comparisonYears(mapping: OECDMapping, peerCode: string): { target: number[]; peer: number[] } {
  const data = comparisonData(mapping);
  const years = (code: string) => data.filter(d => d.jurisdiction === code).slice(-3).map(d => d.year);
  return { target: years(JURISDICTION.code), peer: years(peerCode) };
}

/** 'Total R&D spending' → 'total R&D spending' (keeps acronyms intact). */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function describeFinding(finding: FieldEfficiencyFinding): string {
  const e = finding.efficiency;
  const field = OECD_FIELDS[finding.spendingField as OECDSpendingField];
  return `National comparison, ${lowerFirst(field.label)}: ${JURISDICTION.name} spends $${e.spendingPerCapita}/cap with ${e.outcomeName} ${e.outcome}. ${e.bestCountry.name} spends $${e.bestCountry.spendingPerCapita}/cap with ${e.outcomeName} ${e.bestCountry.outcome}. The ${e.overspendRatio}x spending ratio is descriptive; it does not estimate an achievable saving or allocation target.`;
}

function generateBudgetAnalysis(): { report: GeneratedBudgetAnalysis; findings: FieldEfficiencyFinding[] } {
  const totalSpendingNominal = US_FEDERAL_BUDGET.categories.reduce((sum, cat) => sum + cat.spendingBillions * 1e9, 0);
  const rows = US_FEDERAL_BUDGET.categories
    .filter(cat => OECD_MAPPINGS[cat.id] && !NON_DISCRETIONARY.has(cat.id))
    .map(cat => {
      const mapping = comparisonMapping(OECD_MAPPINGS[cat.id]!);
      const efficiency = analyzeEfficiency(comparisonData(mapping), {
        jurisdictionCode: JURISDICTION.code,
        population: JURISDICTION.population,
        countryNames: COUNTRY_NAMES,
        outcomeName: mapping.outcomeName,
      });
      const latest = cat.historicalSpending[cat.historicalSpending.length - 1];
      if (!latest) throw new Error(`Missing spending history for ${cat.id}`);
      return {
        cat, mapping, efficiency,
        currentUsd: latest.amount * 1e9,
        currentRealPerCapita: toRealPerCapita(latest.amount, latest.year),
      };
    });

  const fieldLines: FieldBenchmarkedLine[] = rows.flatMap(b => b.efficiency ? [{
    id: b.cat.id,
    spendingField: b.mapping.spendingField,
    lineSpendingPerCapita: b.currentRealPerCapita,
    efficiency: b.efficiency,
  }] : []);
  const attributions = new Map(attributeFieldsToLines(fieldLines).map(a => [a.id, a]));
  const findings = summarizeEfficiencyByField(fieldLines);

  const categories: GeneratedBudgetCategory[] = rows.map(b => {
    const { cat, mapping, efficiency, currentUsd, currentRealPerCapita } = b;
    const attribution = attributions.get(cat.id);
    const field = OECD_FIELDS[mapping.spendingField];
    return {
      id: cat.id,
      name: cat.name,
      currentSpending: currentUsd,
      currentSpendingRealPerCapita: Math.round(currentRealPerCapita * 100) / 100,
      // Peer differences do not identify a federal allocation target.
      optimalSpendingPerCapita: null,
      optimalSpendingNominal: null,
      gap: 0,
      gapPercent: 0,
      recommendation: efficiency ? 'comparison_only' : 'no_comparison',
      evidenceSource: efficiency
        ? `Descriptive national comparison: ${field.label}, ${mapping.outcomeName}, ${efficiency.totalCountries} countries. No causal effect or federal allocation target estimated.`
        : `No compatible ${mapping.outcomeName} comparison is available. Missing observations are not replaced with income proxies or other outcomes.`,
      outcomeMetrics: cat.outcomeMetrics.map(m => ({ name: m.name, value: m.value, trend: m.trend })),
      historicalRealPerCapita: historicalToRealPerCapita(cat.historicalSpending).map(h => ({
        year: h.year,
        nominalBillions: h.nominalBillions,
        realPerCapita: Math.round(h.realPerCapita * 100) / 100,
      })),
      diminishingReturns: null,
      efficiency,
      ...(efficiency && attribution ? { oecdBenchmark: {
        spendingField: mapping.spendingField,
        fieldLabel: field.label,
        scope: attribution.scope,
        lineShareOfField: attribution.shareOfField,
        comparisonYears: comparisonYears(mapping, efficiency.bestCountry.code),
      } } : {}),
    };
  });
  categories.sort((a, b) => b.currentSpending - a.currentSpending);

  return { findings, report: {
    jurisdiction: JURISDICTION.name,
    totalSpendingNominal,
    categories,
    topRecommendations: findings.map(describeFinding),
    generatedAt: new Date().toISOString(),
    generatedBy: '@optimitron/obg descriptive peer comparisons',
    inflationAdjustment: {
      method: 'CPI-U deflator for US federal spending history',
      baseYear: 2017,
      perCapita: true,
      unit: 'constant 2017 USD per capita',
      note: 'National spending comparisons use constant 2017 PPP international dollars. Income outcomes retain their OECD published real PPP basis; they are not denominators for spending dividends.',
    },
    methodology: {
      comparisonMethod: 'Average the latest three available observations per country; select the lowest-spending country among those at or above the 75th percentile of the selected outcome.',
      observationYears: 'Exact target and selected-peer years are recorded in each oecdBenchmark.comparisonYears; sparse series may have fewer than three observations and different years.',
      incomeEligibility: 'OECD IDD METH2012/D_CUR observed after-tax median disposable income, real private-consumption PPP per equivalised household. Excludes interpolated values, nominal income, consumption, government-spending proxies, and incompatible source/unit series. Missing values remain null.',
      allocationTargets: 'Not estimated. Peer spending differences do not establish causal effects, transferable savings, or optimal federal allocations. Null targets are unavailable, not zero.',
      nonDiscretionary: 'Social Security, Medicare, Medicaid, Interest on Debt, and Other Mandatory are outside this discretionary comparison table.',
      lineAttribution: 'National fields can cover several federal lines and non-federal spending. Their observations are context only; no national spending difference is assigned to a federal line.',
    },
    note: 'Descriptive cross-country spending and outcome comparisons from the bundled panel, primarily 2000–2022. These are not causal policy estimates. No optimized budget or dividend is produced.',
  } };
}

// ─── Policy Analysis (OPG) ──────────────────────────────────────────

import { STRUCTURAL_POLICY_REFORMS, type PolicyRecommendation } from '@optimitron/data';

type GeneratedPolicy = PolicyOutput & { oecdSpendingField?: string };
type GeneratedPolicyAnalysis = Omit<PolicyAnalysisOutput, 'policies'> & { policies: GeneratedPolicy[] };

/** No calibrated causal estimate or uncertainty is available from this generation path. */
const UNESTIMATED_SCORES = {
  evidenceGrade: null,
  causalConfidenceScore: null,
  policyImpactScore: null,
  welfareScore: null,
  bradfordHillScores: {},
};

function generatePolicyAnalysis(
  findings: FieldEfficiencyFinding[],
  categoryNames: ReadonlyMap<string, string>,
): GeneratedPolicyAnalysis {
  const assumptions: GeneratedPolicy[] = STRUCTURAL_POLICY_REFORMS.map((p: PolicyRecommendation) => ({
    name: p.name,
    type: p.type,
    category: p.category,
    description: p.description,
    recommendationType: 'evaluate',
    evidenceKind: 'assumption',
    ...UNESTIMATED_SCORES,
    // Preserve the source's fractional assumptions without converting them to
    // years, annual growth, dollars, or a synthetic welfare score.
    incomeEffect: p.incomeEffect,
    healthEffect: p.healthEffect,
    rationale: p.rationale,
    currentStatus: p.currentStatus,
    recommendedTarget: p.recommendedTarget,
    blockingFactors: p.blockingFactors,
  }));

  const comparisons: GeneratedPolicy[] = findings
    .filter(f => f.efficiency.overspendRatio >= 1.5)
    .map(f => {
      const e = f.efficiency;
      const field = OECD_FIELDS[f.spendingField as OECDSpendingField];
      const lineNames = f.lineIds.map(id => categoryNames.get(id) ?? id).join(', ');
      return {
        // Preserve the existing name/slug convention; evidenceKind governs presentation.
        name: `${field.policySubject}: Adopt ${e.bestCountry.name}'s Approach`,
        type: 'budget_allocation',
        category: field.policyCategory,
        description: `Compare ${lowerFirst(field.label)}: ${e.bestCountry.name} has ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spendingPerCapita}/cap; ${JURISDICTION.name} has ${e.outcome} at $${e.spendingPerCapita}/cap.`,
        recommendationType: 'compare',
        evidenceKind: 'comparison',
        ...UNESTIMATED_SCORES,
        incomeEffect: null,
        healthEffect: null,
        rationale: `Descriptive spending comparison across ${e.totalCountries} countries. The peer has a top-quartile outcome at lower spending; the ${e.overspendRatio}x spending ratio does not identify transferable savings or income and health effects. Related federal lines: ${lineNames}.`,
        currentStatus: `${JURISDICTION.name} spends $${e.spendingPerCapita}/cap on ${lowerFirst(field.label)}; the selected peer spends $${e.bestCountry.spendingPerCapita}/cap.`,
        recommendedTarget: 'No spending target estimated.',
        blockingFactors: ['causal_effect_not_estimated'],
        oecdSpendingField: f.spendingField,
      };
    });

  return {
    jurisdiction: JURISDICTION.name,
    policies: [...assumptions, ...comparisons],
    generatedAt: new Date().toISOString(),
    generatedBy: '@optimitron/opg evidence inventory',
    note: 'Curated fractional effect assumptions and descriptive national spending comparisons. Effects are not calibrated causal estimates, and no causal grade, welfare ranking, time horizon, or uncertainty interval is inferred.',
  };
}

// ─── Main ────────────────────────────────────────────────────────────

// ── Helper: write typed TS data file ──────────────────────────────

function writeTypedDataFile(
  filename: string,
  exportName: string,
  typeName: string,
  typeImport: string,
  data: unknown,
): void {
  const json = JSON.stringify(data, null, 2);
  const ts = `// Auto-generated by generate-web-data.ts — do not edit manually.
// Regenerate with: pnpm --filter @optimitron/web run generate
import type { ${typeName} } from "${typeImport}";

export const ${exportName}: ${typeName} = ${json};
`;
  writeFileSync(resolve(dataDir, filename), ts);
}

// ── Generate budget analysis ──────────────────────────────────────

console.warn('Generating descriptive budget comparisons...');
const { report: budgetAnalysis, findings: fieldFindings } = generateBudgetAnalysis();

writeTypedDataFile(
  'us-budget-analysis.ts',
  'usBudgetAnalysis',
  'BudgetReportJSON',
  '@optimitron/obg',
  budgetAnalysis,
);
console.warn(`  ✅ ${budgetAnalysis.categories.length} categories → us-budget-analysis.ts`);

console.warn(`  📊 ${fieldFindings.length} national comparisons; no federal allocation targets estimated`);

// ── Generate policy analysis ──────────────────────────────────────

console.warn('\nGenerating policy analysis...');
const policyAnalysis = generatePolicyAnalysis(
  fieldFindings,
  new Map(budgetAnalysis.categories.map(c => [c.id, c.name])),
);

// Natural experiments kept as standalone file — needs OPG pipeline integration to regenerate
writeTypedDataFile(
  'us-policy-analysis.ts',
  'usPolicyAnalysis',
  'PolicyReportJSON',
  '@optimitron/opg',
  policyAnalysis,
);
console.warn(`  ✅ ${policyAnalysis.policies.length} policies → us-policy-analysis.ts`);

console.warn('\nDone! Descriptive comparisons and curated assumptions generated.');
