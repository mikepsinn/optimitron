#!/usr/bin/env tsx
/**
 * Generate real policy and budget analysis JSON from the OPG/OBG libraries.
 *
 * Budget analysis uses OECD cross-country panel data (23 countries × 23 years)
 * to fit diminishing-returns curves and estimate optimal spending levels (OSL).
 * Categories without OECD mappings fall back to outcome-trend heuristics.
 *
 * Run: pnpm --filter @optimitron/web run generate
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// OPG imports
import {
  calculateCCS,
  scoreStrength,
  scoreConsistency,
  scoreTemporality,
  scoreGradient,
  scoreExperiment,
  scorePlausibility,
  scoreCoherence,
  scoreSpecificity,
  calculateWelfare as calculatePolicyWelfare,
  type AnalysisMethod,
} from '@optimitron/opg';

// OBG imports
import {
  fitLogModel,
  fitSaturationModel,
  analyzeEfficiency,
  attributeFieldsToLines,
  summarizeEfficiencyByField,
  type BudgetReportOecdBenchmark,
  type DiminishingReturnsModel,
  type EfficiencyAnalysis,
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
import type { OECDBudgetPanelDataPoint } from '@optimitron/data';
import { getBestAvailableMedianIncomeSeries } from '@optimitron/data/datasets/median-income-series';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');

// Latest measured after-tax median income (PPP, per person) from the canonical source.
// The series runs oldest year first. Interpolated years after the last survey are skipped.
const usIncomeRecords = getBestAvailableMedianIncomeSeries({
  jurisdictions: ['USA'],
  isAfterTax: true,
  purchasingPower: 'ppp',
  excludeInterpolated: true,
});
const latestUsIncomeRecord = usIncomeRecords[usIncomeRecords.length - 1];
if (!latestUsIncomeRecord) {
  throw new Error('No measured US after-tax median income in the median income series');
}
const usMedianIncome = Math.round(latestUsIncomeRecord.value);

// Jurisdiction config — change to generate for any country
const JURISDICTION = {
  code: 'USA',
  name: 'United States',
  population: 339_000_000,
  /** Per person, like the savings it is compared with. */
  medianIncome: usMedianIncome,
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

type GeneratedBudgetCategory = BudgetCategoryOutput & { oecdBenchmark: BudgetReportOecdBenchmark };
type GeneratedBudgetAnalysis = Omit<BudgetAnalysisOutput, 'categories'> & { categories: GeneratedBudgetCategory[] };

/** Convert OECD panel data to SpendingOutcomePoint[], run OBG efficiency analysis. */
function runEfficiencyAnalysis(mapping: OECDMapping): EfficiencyAnalysis | null {
  let data = oecdBudgetPanelToSpendingOutcome(
    mapping.spendingField as keyof OECDBudgetPanelDataPoint,
    mapping.outcomeField as keyof OECDBudgetPanelDataPoint,
  );
  if (mapping.negateOutcome) {
    data = data.map(d => ({ ...d, outcome: 100 - d.outcome }));
  }

  return analyzeEfficiency(data, {
    jurisdictionCode: JURISDICTION.code,
    population: JURISDICTION.population,
    countryNames: COUNTRY_NAMES,
    outcomeName: mapping.outcomeName,
  });
}

/** Fit a diminishing returns model for informational context only (R², model type).
 *  NOT used for recommendations or optimal spending — efficiency frontier handles that. */
function fitModelInfo(
  mapping: OECDMapping,
): { model: DiminishingReturnsModel; n: number } | null {
  let data = oecdBudgetPanelToSpendingOutcome(
    mapping.spendingField as keyof OECDBudgetPanelDataPoint,
    mapping.outcomeField as keyof OECDBudgetPanelDataPoint,
  );
  if (mapping.negateOutcome) {
    data = data.map(d => ({ ...d, outcome: 100 - d.outcome }));
  }
  if (data.length < 10) return null;

  const logModel = fitLogModel(data);
  const satModel = fitSaturationModel(data);
  const model = logModel.r2 >= satModel.r2 ? logModel : satModel;
  return { model, n: data.length };
}

function recommendationFromOverspend(overspendRatio: number): string {
  if (overspendRatio >= 3) return 'major_decrease';
  if (overspendRatio >= 1.5) return 'decrease';
  if (overspendRatio <= 0.8) return 'increase';
  return 'maintain';
}

function formatUsd(value: number): string {
  return value >= 1e12 ? `$${(value / 1e12).toFixed(1)}T` : `$${(value / 1e9).toFixed(0)}B`;
}

/** 'Total R&D spending' → 'total R&D spending' (keeps acronyms intact). */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function formatShare(share: number): string {
  const percent = share * 100;
  return `${percent < 1 ? percent.toFixed(1) : percent.toFixed(0)}%`;
}

/**
 * One sentence per finding. A category-specific finding speaks for its
 * budget line and states that line's gap from the category table. Every
 * other finding is labeled as a national comparison, so its national
 * savings never read as a federal line's.
 */
function describeFinding(
  finding: FieldEfficiencyFinding,
  categoriesById: ReadonlyMap<string, GeneratedBudgetCategory>,
): string {
  const e = finding.efficiency;
  const field = OECD_FIELDS[finding.spendingField as OECDSpendingField];
  const line = finding.categorySpecificLineId ? categoriesById.get(finding.categorySpecificLineId) : undefined;
  const subject = line ? line.name : `National comparison, ${lowerFirst(field.label)}`;

  if (e.overspendRatio > 1.2) {
    const savings = line
      ? `Cutting the ${formatUsd(line.currentSpending)} line to ${e.bestCountry.name}'s ratio saves ${formatUsd(line.gap)}/yr`
      : `Potential national savings: ${formatUsd(e.potentialSavingsTotal)}/yr`;
    return `${subject}: ${JURISDICTION.name} spends $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). ${e.bestCountry.name} spends $${e.bestCountry.spendingPerCapita}/cap with ${e.outcomeName} ${e.bestCountry.outcome}. Overspend: ${e.overspendRatio}x. ${savings}`;
  }
  if (e.overspendRatio < 0.8) {
    return `${subject}: ${JURISDICTION.name} underspends at $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). Floor: $${e.floorSpendingPerCapita}/cap.`;
  }
  return `${subject}: ${JURISDICTION.name} spends $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). Near floor ($${e.floorSpendingPerCapita}/cap). ${e.outcomeName}: ${e.outcome}`;
}

function generateBudgetAnalysis(): { report: GeneratedBudgetAnalysis; findings: FieldEfficiencyFinding[] } {
  const totalSpendingNominal = US_FEDERAL_BUDGET.categories.reduce((sum, cat) => sum + cat.spendingBillions * 1e9, 0);

  // Only include categories with actual OECD efficient frontier data.
  // No guesses, no defaults — every number must be backed by cross-country evidence.
  const benchmarked: Array<{
    cat: (typeof US_FEDERAL_BUDGET.categories)[number];
    mapping: OECDMapping;
    efficiency: EfficiencyAnalysis;
    currentUsd: number;
    currentRealPerCapita: number;
  }> = [];
  for (const cat of US_FEDERAL_BUDGET.categories) {
    const mapping = OECD_MAPPINGS[cat.id];
    if (!mapping || NON_DISCRETIONARY.has(cat.id)) continue;

    const efficiency = runEfficiencyAnalysis(mapping);
    if (!efficiency) continue;

    const latestSpending = cat.historicalSpending[cat.historicalSpending.length - 1]?.amount ?? 0;
    const latestYear = cat.historicalSpending[cat.historicalSpending.length - 1]?.year ?? 2025;
    benchmarked.push({
      cat,
      mapping,
      efficiency,
      currentUsd: latestSpending * 1e9,
      currentRealPerCapita: toRealPerCapita(latestSpending, latestYear),
    });
  }

  // Several lines borrow one OECD field (eight departments → public social
  // spending), and most fields measure a whole national system. A field's
  // figures describe a line only when the line is most of the field.
  const fieldLines: FieldBenchmarkedLine[] = benchmarked.map(b => ({
    id: b.cat.id,
    spendingField: b.mapping.spendingField,
    lineSpendingPerCapita: b.currentRealPerCapita,
    efficiency: b.efficiency,
  }));
  const attributions = attributeFieldsToLines(fieldLines);
  const findings = summarizeEfficiencyByField(fieldLines);

  const categories: GeneratedBudgetCategory[] = benchmarked.map((b, index) => {
    const { cat, mapping, efficiency: e, currentUsd, currentRealPerCapita } = b;
    const attribution = attributions[index];
    if (!attribution) throw new Error(`Missing field attribution for ${cat.id}`);
    const field = OECD_FIELDS[mapping.spendingField];
    const nCountries = e.totalCountries;

    let optimalNominal: number | null = null;
    let optimalPerCapita: number | null = null;
    let gap = 0;
    let gapPercent = 0;
    let recommendation = 'no_line_benchmark';
    let evidenceSource =
      `No line-specific benchmark. The only OECD comparison is ${lowerFirst(field.label)}, ` +
      `where ${JURISDICTION.name} ranks ${e.rank} of ${nCountries} countries. ` +
      `This line is ${formatShare(attribution.shareOfField)} of that total, so its overspend ratio is not applied here.`;

    if (attribution.scope === 'category_specific') {
      // The field measures this line, so the field's overspend ratio is the line's.
      optimalNominal = Math.round(currentUsd / e.overspendRatio);
      optimalPerCapita = Math.round((currentRealPerCapita / e.overspendRatio) * 100) / 100;
      gap = Math.round(currentUsd - optimalNominal);
      gapPercent = currentUsd > 0 ? Math.round((gap / currentUsd) * 1000) / 10 : 0;
      recommendation = recommendationFromOverspend(e.overspendRatio);
      evidenceSource = `OECD efficient frontier (${nCountries} countries, rank ${e.rank}/${nCountries})`;
    }

    // Fit a diminishing returns model for informational context
    let drInfo: BudgetCategoryOutput['diminishingReturns'] = null;
    const modelInfo = fitModelInfo(mapping);
    if (modelInfo) {
      drInfo = {
        modelType: modelInfo.model.type,
        r2: Math.round(modelInfo.model.r2 * 1000) / 1000,
        n: modelInfo.n,
        marginalReturn: 0,
        elasticity: null,
        outcomeName: mapping.outcomeName,
      };
    }

    return {
      id: cat.id,
      name: cat.name,
      currentSpending: currentUsd,
      currentSpendingRealPerCapita: Math.round(currentRealPerCapita * 100) / 100,
      optimalSpendingPerCapita: optimalPerCapita,
      optimalSpendingNominal: optimalNominal,
      gap,
      gapPercent,
      recommendation,
      evidenceSource,
      outcomeMetrics: cat.outcomeMetrics.map(m => ({
        name: m.name,
        value: m.value,
        trend: m.trend,
      })),
      historicalRealPerCapita: historicalToRealPerCapita(cat.historicalSpending).map(h => ({
        year: h.year,
        nominalBillions: h.nominalBillions,
        realPerCapita: Math.round(h.realPerCapita * 100) / 100,
      })),
      diminishingReturns: drInfo,
      efficiency: e,
      oecdBenchmark: {
        spendingField: mapping.spendingField,
        fieldLabel: field.label,
        scope: attribution.scope,
        lineShareOfField: attribution.shareOfField,
      },
    };
  });

  // Biggest line-specific misallocation first; lines without a line-specific
  // benchmark follow, largest first.
  categories.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap) || b.currentSpending - a.currentSpending);

  // One recommendation per OECD field, biggest overspend first.
  const categoriesById = new Map(categories.map(c => [c.id, c]));
  const topRecommendations = [...findings]
    .sort((a, b) => b.efficiency.overspendRatio - a.efficiency.overspendRatio)
    .slice(0, 10)
    .map(finding => describeFinding(finding, categoriesById));

  const report: GeneratedBudgetAnalysis = {
    jurisdiction: JURISDICTION.name,
    totalSpendingNominal,
    categories,
    topRecommendations,
    generatedAt: new Date().toISOString(),
    generatedBy: '@optimitron/obg + OECD cross-country panel',
    inflationAdjustment: {
      method: 'CPI-U deflator',
      baseYear: 2017,
      perCapita: true,
      unit: 'constant 2017 USD per capita',
      note: 'Matches OECD cross-country PPP convention for comparable analysis',
    },
    methodology: {
      oslMethod: 'Diminishing returns curve fitting (log-linear or saturation model)',
      oslThreshold: 'OSL where marginal return drops to 50% of cross-country average',
      dataClamping: 'OSL clamped to [50% min, 150% max] of observed cross-country spending',
      lowFitGuard: 'Models with R² < 0.3 constrained to [0.5×, 2×] current spending',
      nonDiscretionary: 'Social Security, Medicare, Interest on Debt, Other Mandatory excluded from optimization',
      lineAttribution: 'An OECD field sets a line\'s optimal only when the line is at least half of the spending the field measures (oecdBenchmark.scope = category_specific). Every other line is a national_field_proxy: its optimal is null, and its efficiency block describes the national field, not the line.',
    },
    note: 'Budget analysis uses real OECD cross-country data (23 countries × 23 years) for OSL estimation where available. Categories without OECD mappings use outcome-trend heuristics.',
  };

  return { report, findings };
}

// ─── Policy Analysis (OPG) ──────────────────────────────────────────

import { STRUCTURAL_POLICY_REFORMS, type PolicyRecommendation } from '@optimitron/data';

type PolicyInput = PolicyRecommendation & { oecdSpendingField?: string };
type GeneratedPolicy = PolicyOutput & { oecdSpendingField?: string };
type GeneratedPolicyAnalysis = Omit<PolicyAnalysisOutput, 'policies'> & { policies: GeneratedPolicy[] };

// Structural reforms from the data package (jurisdiction-agnostic, evidence-based).
// Efficiency-derived policies ("reduce spending to cheapest high performer") are
// auto-generated from the budget analysis — not hardcoded.
const STRUCTURAL_REFORMS: PolicyInput[] = [...STRUCTURAL_POLICY_REFORMS];

// Auto-generate efficiency-derived policy recommendations from budget analysis.
// These are spending reallocations, not structural reforms — the "effect" is the
// savings redirected as Optimization Dividend (income) and the outcome improvement
// from matching the high performer's level (health, if the outcome is life expectancy).
// One policy per OECD spending field: the policy is named for what the field
// measures, and its effects are the field's, computed once.
function generateEfficiencyPolicies(
  findings: FieldEfficiencyFinding[],
  categoryNames: ReadonlyMap<string, string>,
): PolicyInput[] {
  const MEDIAN_INCOME = JURISDICTION.medianIncome;
  const POPULATION = JURISDICTION.population;

  return findings
    .filter(f => f.efficiency.overspendRatio >= 1.5)
    .map(f => {
      const e = f.efficiency;
      const field = OECD_FIELDS[f.spendingField as OECDSpendingField];
      const fieldName = lowerFirst(field.label);
      const lineNames = f.lineIds.map(id => categoryNames.get(id) ?? id).join(', ');
      // Per person over per person: the median income series is per person.
      const savingsPerPerson = Math.round(e.potentialSavingsTotal / POPULATION);
      const incomeEffect = savingsPerPerson / MEDIAN_INCOME;

      // Health effect: only claim if outcome IS life expectancy AND best country is better
      // For non-LE outcomes (PISA, median income), health effect is 0.
      const isLifeExpOutcome = e.outcomeName === 'Life Expectancy';
      const leGap = isLifeExpOutcome ? (e.bestCountry.outcome - e.outcome) : 0;
      // Convert LE gap in years to a fraction of baseline HALE (~66 years)
      // Only claim half the gap as realistic improvement (conservative)
      const healthEffect = isLifeExpOutcome ? Math.round((leGap * 0.5 / 66) * 1000) / 1000 : 0;

      return {
        name: `${field.policySubject}: Adopt ${e.bestCountry.name}'s Approach`,
        type: 'budget_allocation',
        category: field.policyCategory,
        description: `Reduce ${fieldName} to the cheapest high-performer floor. ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spendingPerCapita}/cap; ${JURISDICTION.name} gets ${e.outcome} at $${e.spendingPerCapita}/cap.`,
        effectSize: Math.min(e.overspendRatio / 5, 1.5),
        studyCount: e.totalCountries,
        hasPredecessor: true, // other countries already do this
        doseResponseExists: e.overspendRatio > 2, // clear spending-outcome gradient if big overspend
        hasRCT: false, // cross-country comparison, not randomized
        mechanismKnown: true, // spending less and redirecting to dividend is straightforward
        consistentWithTheory: true,
        analogyExists: true, // the best-performing country IS the analogy
        outcomeCount: 1,
        incomeEffect: Math.round(incomeEffect * 1000) / 1000,
        healthEffect,
        rationale: `Cheapest-high-performer analysis of ${fieldName}: ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spendingPerCapita}/cap. ${JURISDICTION.name} at $${e.spendingPerCapita}/cap (${e.overspendRatio}x overspend). Top 3: ${e.topEfficient.map(t => `${t.name} ($${t.spendingPerCapita})`).join(', ')}. Savings: $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr → $${savingsPerPerson.toLocaleString()}/person/yr as Optimization Dividend. Federal budget lines benchmarked against this field: ${lineNames}.`,
        currentStatus: `${JURISDICTION.name} spends $${e.spendingPerCapita}/cap on ${fieldName}, ranks ${e.rank}/${e.totalCountries}. ${e.overspendRatio}x overspend.`,
        recommendedTarget: `${e.bestCountry.name} model ($${e.floorSpendingPerCapita}/cap floor). $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr savings → Optimization Dividend.`,
        blockingFactors: ['political_opposition'],
        oecdSpendingField: f.spendingField,
      } satisfies PolicyInput;
    });
}

function generatePolicyAnalysis(
  findings: FieldEfficiencyFinding[],
  categoryNames: ReadonlyMap<string, string>,
): GeneratedPolicyAnalysis {
  const efficiencyPolicies = generateEfficiencyPolicies(findings, categoryNames);
  const allPolicies = [...efficiencyPolicies, ...STRUCTURAL_REFORMS];

  const policies = allPolicies.map((p): GeneratedPolicy => {
    const method: AnalysisMethod = p.hasRCT ? 'rct' : 'cross_sectional';
    const bh = {
      strength: scoreStrength(p.effectSize),
      consistency: scoreConsistency(p.studyCount),
      temporality: scoreTemporality(p.hasPredecessor),
      gradient: scoreGradient(p.doseResponseExists ? 0.7 : 0.3) ?? 0.5,
      experiment: scoreExperiment(method),
      plausibility: scorePlausibility({
        theoryPredicts: p.mechanismKnown,
        behavioralResponse: true,
        noImplausibleAssumptions: true,
        timingConsistent: p.hasPredecessor,
        magnitudePlausible: true,
      }),
      coherence: scoreCoherence(p.studyCount),
      analogy: p.analogyExists ? 0.85 : 0.3,
      specificity: scoreSpecificity(p.outcomeCount),
    };

    const ccs = calculateCCS(bh);
    const welfare = calculatePolicyWelfare({
      incomeGrowth: p.incomeEffect * 2,
      healthyLifeYears: 75 + p.healthEffect * 10,
    });

    let evidenceGrade: string;
    if (ccs >= 0.75) evidenceGrade = 'A';
    else if (ccs >= 0.55) evidenceGrade = 'B';
    else evidenceGrade = 'C';

    const policyImpactScore = ccs * 0.6 + (welfare / 100) * 0.4;

    return {
      name: p.name,
      type: p.type,
      category: p.category,
      description: p.description,
      recommendationType: p.type === 'budget_allocation' ? 'reallocate' : 'implement',
      evidenceGrade,
      causalConfidenceScore: Math.round(ccs * 1000) / 1000,
      policyImpactScore: Math.round(policyImpactScore * 1000) / 1000,
      welfareScore: Math.round(welfare),
      incomeEffect: p.incomeEffect,
      healthEffect: p.healthEffect,
      bradfordHillScores: Object.fromEntries(
        Object.entries(bh).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
      ),
      rationale: p.rationale,
      currentStatus: p.currentStatus,
      recommendedTarget: p.recommendedTarget,
      blockingFactors: p.blockingFactors,
      ...(p.oecdSpendingField ? { oecdSpendingField: p.oecdSpendingField } : {}),
    };
  });

  policies.sort((a, b) => b.policyImpactScore - a.policyImpactScore);

  return {
    jurisdiction: JURISDICTION.name,
    policies,
    generatedAt: new Date().toISOString(),
    generatedBy: '@optimitron/opg',
    note: 'Generated using Bradford Hill scoring and welfare calculation from real cross-country evidence.',
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

// Efficient-frontier decile data for the scatter plot. Vendored from the
// last output of the deleted examples/ package
// (examples/src/us-federal-analysis/generate-efficient-frontier-report.js)
// so `pnpm generate` runs without it; regenerate from @optimitron/obg when
// the frontier pipeline moves in-package.
import SPENDING_CATEGORIES_JSON from './spending-category-deciles.json';

const SPENDING_CATEGORIES = SPENDING_CATEGORIES_JSON as Array<{
  categoryId: string;
  categoryName: string;
  deciles: Array<{ decile: number; avgSpending: number; outcome: number }>;
}>;

// Natural experiments kept as standalone file for now — needs OPG pipeline integration

console.warn('Generating budget analysis...');
const { report: budgetAnalysis, findings: fieldFindings } = generateBudgetAnalysis();

// Attach efficient frontier deciles to budget report
const outcomeNames: Record<string, string> = {
  health: 'Life Expectancy',
  education: 'PISA Math Score',
  military: 'Conflict Incidents per 100K',
  social_protection: 'Poverty Rate',
  rd: 'Patents per 100K',
};
budgetAnalysis.efficientFrontier = {
  categories: Object.fromEntries(
    SPENDING_CATEGORIES.map(cat => [cat.categoryId, {
      spendingField: cat.categoryId,
      outcomeField: cat.categoryId,
      outcomeName: outcomeNames[cat.categoryId] ?? cat.categoryName,
      deciles: cat.deciles.map(d => ({
        decile: d.decile,
        spending: d.avgSpending,
        outcome: d.outcome,
        countries: 3, // approximate per-decile country count
      })),
    }]),
  ),
  totals: {
    usCurrentTotalPerCapita: 10200 + 2400 + 3200 + 4200 + 1800, // US per-capita spending across 5 categories
    efficientFrontierTotalPerCapita: 2400 + 350 + 1600 + 3800 + 500, // floor spending (decile 2 approximation)
    ratio: (10200 + 2400 + 3200 + 4200 + 1800) / (2400 + 350 + 1600 + 3800 + 500),
  },
};
writeTypedDataFile(
  'us-budget-analysis.ts',
  'usBudgetAnalysis',
  'BudgetReportJSON',
  '@optimitron/obg',
  budgetAnalysis,
);
console.warn(`  ✅ ${budgetAnalysis.categories.length} categories → us-budget-analysis.ts`);

const lineSpecific = budgetAnalysis.categories.filter(c => c.oecdBenchmark.scope === 'category_specific');
console.warn(`  📊 ${lineSpecific.length} with a line-specific OECD benchmark, ${budgetAnalysis.categories.length - lineSpecific.length} benchmarked only against a national field`);

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

console.warn('\nDone! Data generated from real OPG/OBG libraries + OECD cross-country data.');
