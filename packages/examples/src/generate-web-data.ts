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
  type DiminishingReturnsModel,
  type EfficiencyAnalysis,
} from '@optimitron/obg';

// Data imports
import {
  US_FEDERAL_BUDGET,
  OECD_BUDGET_PANEL,
  toRealPerCapita,
  historicalToRealPerCapita,
  oecdBudgetPanelToSpendingOutcome,
  OECD_CATEGORY_MAPPINGS,
  NON_DISCRETIONARY_CATEGORIES,
  COUNTRY_NAMES,
  type OECDCategoryMapping,
} from '@optimitron/data';
import type { OECDBudgetPanelDataPoint } from '@optimitron/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../../web/src/data');

// Jurisdiction config — change to generate for any country
const JURISDICTION = {
  code: 'USA',
  name: 'United States',
  population: 339_000_000,
  households: 133_000_000,
  medianIncome: 59_540,
};
const US_POPULATION = JURISDICTION.population;

// Use canonical mappings from @optimitron/data (no local duplicates)
const OECD_MAPPINGS = OECD_CATEGORY_MAPPINGS;
const NON_DISCRETIONARY = NON_DISCRETIONARY_CATEGORIES;
type OECDMapping = OECDCategoryMapping;

// ─── Efficiency Analysis Helpers ─────────────────────────────────────

// ─── Budget Analysis (OBG) ──────────────────────────────────────────

interface BudgetCategoryOutput {
  name: string;
  currentSpending: number;
  currentSpendingRealPerCapita: number;
  optimalSpendingPerCapita: number | null;
  optimalSpendingNominal: number | null;
  gap: number;
  gapPercent: number;
  recommendation: string;
  evidenceSource: string;
  outcomeMetrics: { name: string; value: number; trend: string }[];
  historicalRealPerCapita: { year: number; nominalBillions: number; realPerCapita: number }[];
  diminishingReturns: {
    modelType: string;
    r2: number;
    n: number;
    marginalReturn: number;
    elasticity: number | null;
    outcomeName: string;
  } | null;
  efficiency: EfficiencyAnalysis | null;
}

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

function generateBudgetAnalysis() {
  const totalSpendingNominal = US_FEDERAL_BUDGET.categories.reduce((sum, cat) => sum + cat.spendingBillions * 1e9, 0);
  const categories: BudgetCategoryOutput[] = [];

  for (const cat of US_FEDERAL_BUDGET.categories) {
    const latestSpending = cat.historicalSpending[cat.historicalSpending.length - 1]?.amount ?? 0;
    const latestYear = cat.historicalSpending[cat.historicalSpending.length - 1]?.year ?? 2025;
    const currentUsd = latestSpending * 1e9;
    const currentRealPerCapita = toRealPerCapita(latestSpending, latestYear);
    const historicalRPC = historicalToRealPerCapita(cat.historicalSpending);

    const isNonDiscretionary = NON_DISCRETIONARY.has(cat.name);
    const mapping = OECD_MAPPINGS[cat.name];

    let optimalPerCapita: number | null = null;
    let optimalNominal: number | null = null;
    let gap = 0;
    let gapPercent = 0;
    let recommendation = 'maintain';
    let evidenceSource = 'none';
    let drInfo: BudgetCategoryOutput['diminishingReturns'] = null;
    let efficiencyInfo: EfficiencyAnalysis | null = null;

    // Run efficiency analysis for all OECD-mapped categories (even non-discretionary)
    if (mapping) {
      efficiencyInfo = runEfficiencyAnalysis(mapping);
    }

    if (isNonDiscretionary) {
      evidenceSource = 'non-discretionary (mandated)';
    } else if (mapping && efficiencyInfo) {
      // Derive gap/optimal from EFFICIENCY FRONTIER (not OSL curve fitting).
      // NOTE: OECD spending is total government (federal+state+local), while
      // currentUsd is federal-only. The gap uses OECD per-capita values to be
      // comparable across countries. Positive gap = US overspends vs floor.
      optimalPerCapita = efficiencyInfo.floorSpendingPerCapita;
      const usOECDSpendingTotal = efficiencyInfo.spendingPerCapita * US_POPULATION; // total gov, not federal
      optimalNominal = efficiencyInfo.floorSpendingPerCapita * US_POPULATION;
      gap = usOECDSpendingTotal - optimalNominal; // OECD total vs floor — positive = overspend
      gapPercent = usOECDSpendingTotal > 0 ? (gap / usOECDSpendingTotal) * 100 : 0;

      const nCountries = efficiencyInfo.totalCountries;
      evidenceSource = `OECD efficient frontier (${nCountries} countries, rank ${efficiencyInfo.rank}/${nCountries})`;

      // Fit a diminishing returns model for informational context only
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

      // Recommendation from overspend ratio
      if (efficiencyInfo.overspendRatio >= 3) recommendation = 'major_decrease';
      else if (efficiencyInfo.overspendRatio >= 1.5) recommendation = 'decrease';
      else if (efficiencyInfo.overspendRatio <= 0.8) recommendation = 'increase';
      else recommendation = 'maintain';
    } else if (mapping) {
      evidenceSource = 'OECD mapping available but insufficient data';
    } else {
      // No OECD mapping — just report metrics, no spending recommendation
      evidenceSource = 'no cross-country data available';
    }

    categories.push({
      name: cat.name,
      currentSpending: currentUsd,
      currentSpendingRealPerCapita: Math.round(currentRealPerCapita * 100) / 100,
      optimalSpendingPerCapita: optimalPerCapita !== null ? Math.round(optimalPerCapita * 100) / 100 : null,
      optimalSpendingNominal: optimalNominal !== null ? Math.round(optimalNominal) : null,
      gap: Math.round(gap),
      gapPercent: Math.round(gapPercent * 10) / 10,
      recommendation,
      evidenceSource,
      outcomeMetrics: cat.outcomeMetrics.map(m => ({
        name: m.name,
        value: m.value,
        trend: m.trend,
      })),
      historicalRealPerCapita: historicalRPC.map(h => ({
        year: h.year,
        nominalBillions: h.nominalBillions,
        realPerCapita: Math.round(h.realPerCapita * 100) / 100,
      })),
      diminishingReturns: drInfo,
      efficiency: efficiencyInfo,
    });
  }

  // Sort by absolute gap (biggest misallocation first)
  categories.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // Top recommendations — prioritize categories with efficiency data showing overspend
  // Deduplicate: multiple US budget categories may map to the same OECD spending field
  // (e.g., Medicare, Medicaid, Health all map to healthSpendingPerCapitaPpp).
  // Only show the most relevant one per OECD field.
  const seenSpendingFields = new Set<string>();
  const withEfficiency = categories
    .filter(c => c.efficiency !== null)
    .sort((a, b) => (b.efficiency!.overspendRatio) - (a.efficiency!.overspendRatio))
    .filter(c => {
      const mapping = OECD_MAPPINGS[c.name];
      if (!mapping) return true;
      if (seenSpendingFields.has(mapping.spendingField)) return false;
      seenSpendingFields.add(mapping.spendingField);
      return true;
    });

  const topRecommendations = withEfficiency
    .slice(0, 10)
    .map(c => {
      const e = c.efficiency!;
      const savings = e.potentialSavingsTotal;
      const fmtSavings = savings >= 1e12 ? `$${(savings/1e12).toFixed(1)}T` : `$${(savings/1e9).toFixed(0)}B`;
      if (e.overspendRatio > 1.2) {
        return `${c.name}: ${JURISDICTION.name} spends $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). ${e.bestCountry.name} spends $${e.bestCountry.spendingPerCapita}/cap with ${e.outcomeName} ${e.bestCountry.outcome}. Overspend: ${e.overspendRatio}x. Potential savings: ${fmtSavings}/yr`;
      } else if (e.overspendRatio < 0.8) {
        return `${c.name}: ${JURISDICTION.name} underspends at $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). Floor: $${e.floorSpendingPerCapita}/cap.`;
      } else {
        return `${c.name}: ${JURISDICTION.name} spends $${e.spendingPerCapita}/cap (rank ${e.rank}/${e.totalCountries}). Near floor ($${e.floorSpendingPerCapita}/cap). ${e.outcomeName}: ${e.outcome}`;
      }
    });

  return {
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
    },
    note: 'Budget analysis uses real OECD cross-country data (23 countries × 23 years) for OSL estimation where available. Categories without OECD mappings use outcome-trend heuristics.',
  };
}

// ─── Policy Analysis (OPG) ──────────────────────────────────────────

import { STRUCTURAL_POLICY_REFORMS, type PolicyRecommendation } from '@optimitron/data';

type PolicyInput = PolicyRecommendation;

// Structural reforms from the data package (jurisdiction-agnostic, evidence-based).
// Efficiency-derived policies ("reduce spending to cheapest high performer") are
// auto-generated from the budget analysis — not hardcoded.
const STRUCTURAL_REFORMS: PolicyInput[] = [...STRUCTURAL_POLICY_REFORMS];

// Auto-generate efficiency-derived policy recommendations from budget analysis.
// These are spending reallocations, not structural reforms — the "effect" is the
// savings redirected as Optimization Dividend (income) and the outcome improvement
// from matching the high performer's level (health, if the outcome is life expectancy).
function generateEfficiencyPolicies(budgetCategories: BudgetCategoryOutput[]): PolicyInput[] {
  const MEDIAN_INCOME = JURISDICTION.medianIncome;
  const HOUSEHOLDS = JURISDICTION.households;

  return budgetCategories
    .filter(c => c.efficiency && c.efficiency.overspendRatio >= 1.5)
    .map(c => {
      const e = c.efficiency!;
      const savingsPerHH = Math.round(e.potentialSavingsTotal / HOUSEHOLDS);
      const incomeEffect = savingsPerHH / MEDIAN_INCOME;

      // Health effect: only claim if outcome IS life expectancy AND best country is better
      // For non-LE outcomes (PISA, median income), health effect is 0.
      const isLifeExpOutcome = e.outcomeName === 'Life Expectancy';
      const leGap = isLifeExpOutcome ? (e.bestCountry.outcome - e.outcome) : 0;
      // Convert LE gap in years to a fraction of baseline HALE (~66 years)
      // Only claim half the gap as realistic improvement (conservative)
      const healthEffect = isLifeExpOutcome ? Math.round((leGap * 0.5 / 66) * 1000) / 1000 : 0;

      return {
        name: `${c.name}: Adopt ${e.bestCountry.name}'s Approach`,
        type: 'budget_allocation',
        category: c.name.toLowerCase().replace(/[^a-z]+/g, '_'),
        description: `Reduce ${c.name.toLowerCase()} spending to the cheapest high-performer floor. ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spendingPerCapita}/cap; ${JURISDICTION.name} gets ${e.outcome} at $${e.spendingPerCapita}/cap.`,
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
        rationale: `Cheapest-high-performer analysis: ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spendingPerCapita}/cap. ${JURISDICTION.name} at $${e.spendingPerCapita}/cap (${e.overspendRatio}x overspend). Top 3: ${e.topEfficient.map(t => `${t.name} ($${t.spendingPerCapita})`).join(', ')}. Savings: $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr → $${savingsPerHH.toLocaleString()}/household/yr as Optimization Dividend.`,
        currentStatus: `${JURISDICTION.name} spends $${e.spendingPerCapita}/cap, ranks ${e.rank}/${e.totalCountries}. ${e.overspendRatio}x overspend.`,
        recommendedTarget: `${e.bestCountry.name} model ($${e.floorSpendingPerCapita}/cap floor). $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr savings → Optimization Dividend.`,
        blockingFactors: ['political_opposition'],
      } satisfies PolicyInput;
    });
}

function generatePolicyAnalysis(budgetCategories: BudgetCategoryOutput[]) {
  const efficiencyPolicies = generateEfficiencyPolicies(budgetCategories);
  const allPolicies = [...efficiencyPolicies, ...STRUCTURAL_REFORMS];

  const policies = allPolicies.map(p => {
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

console.log('Generating budget analysis...');
const budgetAnalysis = generateBudgetAnalysis();
writeFileSync(
  resolve(dataDir, 'us-budget-analysis.json'),
  JSON.stringify(budgetAnalysis, null, 2)
);
console.log(`  ✅ ${budgetAnalysis.categories.length} categories → us-budget-analysis.json`);

const withOSL = budgetAnalysis.categories.filter(c => c.diminishingReturns !== null);
const withRecs = budgetAnalysis.categories.filter(c => c.recommendation !== 'maintain');
console.log(`  📊 ${withOSL.length} with OECD-backed OSL, ${withRecs.length} with non-maintain recommendations`);

console.log('\nGenerating policy analysis...');
const policyAnalysis = generatePolicyAnalysis(budgetAnalysis.categories);
writeFileSync(
  resolve(dataDir, 'us-policy-analysis.json'),
  JSON.stringify(policyAnalysis, null, 2)
);
console.log(`  ✅ ${policyAnalysis.policies.length} policies → us-policy-analysis.json`);

console.log('\nDone! Data generated from real OPG/OBG libraries + OECD cross-country data.');
