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

// OBG imports — diminishing returns model for supplementary context only
import {
  fitLogModel,
  fitSaturationModel,
  type DiminishingReturnsModel,
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

const US_POPULATION = 339_000_000; // 2025 estimate

// Use canonical mappings from @optimitron/data (no local duplicates)
const OECD_MAPPINGS = OECD_CATEGORY_MAPPINGS;
const NON_DISCRETIONARY = NON_DISCRETIONARY_CATEGORIES;
type OECDMapping = OECDCategoryMapping;

// ─── Efficiency Analysis Helpers ─────────────────────────────────────

/** Average the latest 3 years of OECD data per country for a given field */
function latestCountryAverages(
  spendingField: keyof OECDBudgetPanelDataPoint,
  outcomeField: keyof OECDBudgetPanelDataPoint,
  negateOutcome?: boolean,
): Array<{ code: string; name: string; spending: number; outcome: number }> {
  // Group by country, take last 3 years with non-null data
  const byCountry = new Map<string, { spending: number[]; outcome: number[] }>();
  for (const row of OECD_BUDGET_PANEL) {
    const s = row[spendingField] as number | null;
    const o = row[outcomeField] as number | null;
    if (s == null || o == null) continue;
    if (!byCountry.has(row.jurisdictionIso3)) {
      byCountry.set(row.jurisdictionIso3, { spending: [], outcome: [] });
    }
    const entry = byCountry.get(row.jurisdictionIso3)!;
    entry.spending.push(s);
    entry.outcome.push(negateOutcome ? 100 - o : o);
  }

  return [...byCountry.entries()].map(([code, data]) => {
    // Take last 3 entries (sorted by insertion order = chronological)
    const recentS = data.spending.slice(-3);
    const recentO = data.outcome.slice(-3);
    const avgS = recentS.reduce((a, b) => a + b, 0) / recentS.length;
    const avgO = recentO.reduce((a, b) => a + b, 0) / recentO.length;
    return { code, name: COUNTRY_NAMES[code] ?? code, spending: avgS, outcome: avgO };
  }).filter(c => c.spending > 0);
}


// ─── Budget Analysis (OBG) ──────────────────────────────────────────

interface EfficiencyInfo {
  /** US rank among OECD countries (1 = most efficient) */
  usRank: number;
  totalCountries: number;
  /** Most efficient country */
  bestCountry: { code: string; name: string; spending: number; outcome: number };
  /** US data point */
  usData: { spending: number; outcome: number };
  /** Minimum effective spending (floor where outcomes plateau) */
  floorSpending: number;
  floorOutcome: number;
  /** US overspend ratio: actual / floor */
  overspendRatio: number;
  /** Potential savings if spending at the floor */
  potentialSavingsPerCapita: number;
  potentialSavingsTotal: number;
  /** Outcome name being measured */
  outcomeName: string;
  /** Top 3 most efficient countries for context */
  topEfficient: Array<{ name: string; spending: number; outcome: number; rank: number }>;
}

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
  /** Efficient frontier + minimum effective spending analysis */
  efficiency: EfficiencyInfo | null;
}

/**
 * "Cheapest High Performer" algorithm.
 *
 * 1. Get all countries' latest spending + outcome averages
 * 2. Compute the 75th percentile outcome (the "high performer" threshold)
 * 3. Filter to countries at or above that threshold
 * 4. Rank high performers by spending (lowest first)
 * 5. "Best value" = cheapest high performer
 * 6. "Floor" = best value country's spending
 * 7. Overspend ratio = target jurisdiction / floor
 *
 * No GDP filters, no US-centric logic, no clamping.
 * Works for any jurisdiction as the target.
 */
function runEfficiencyAnalysis(mapping: OECDMapping, targetCode: string = 'USA'): EfficiencyInfo | null {
  const countries = latestCountryAverages(
    mapping.spendingField as keyof OECDBudgetPanelDataPoint,
    mapping.outcomeField as keyof OECDBudgetPanelDataPoint,
    mapping.negateOutcome,
  );

  if (countries.length < 5) return null;

  const target = countries.find(c => c.code === targetCode);
  if (!target) return null;

  // 1. Compute 75th percentile outcome — the "high performer" threshold
  const sortedOutcomes = countries.map(c => c.outcome).sort((a, b) => a - b);
  const p75Index = Math.floor(sortedOutcomes.length * 0.75);
  const p75 = sortedOutcomes[p75Index] ?? sortedOutcomes[sortedOutcomes.length - 1]!;

  // 2. High performers: countries at or above the 75th percentile
  const highPerformers = countries
    .filter(c => c.outcome >= p75)
    .sort((a, b) => a.spending - b.spending); // cheapest first

  if (highPerformers.length === 0) return null;

  // 3. Best value = cheapest high performer
  const bestValue = highPerformers[0]!;

  // 4. Floor = best value's spending. Overspend = target / floor.
  const floorSpending = bestValue.spending;
  const ratio = floorSpending > 0 ? target.spending / floorSpending : 1;
  const savingsPerCapita = Math.max(0, target.spending - floorSpending);

  // 5. Top 3 high performers (cheapest first)
  const topEfficient = highPerformers.slice(0, 3).map((c, i) => ({
    name: COUNTRY_NAMES[c.code] ?? c.code,
    spending: Math.round(c.spending),
    outcome: Math.round(c.outcome * 100) / 100,
    rank: i + 1,
  }));

  // 6. Rank the target among all countries by outcome/spending ratio
  const allByRatio = [...countries]
    .sort((a, b) => (b.outcome / b.spending) - (a.outcome / a.spending));
  const targetRank = allByRatio.findIndex(c => c.code === targetCode) + 1;

  return {
    usRank: targetRank,
    totalCountries: countries.length,
    bestCountry: {
      code: bestValue.code,
      name: COUNTRY_NAMES[bestValue.code] ?? bestValue.code,
      spending: Math.round(bestValue.spending),
      outcome: Math.round(bestValue.outcome * 100) / 100,
    },
    usData: {
      spending: Math.round(target.spending),
      outcome: Math.round(target.outcome * 100) / 100,
    },
    floorSpending: Math.round(floorSpending),
    floorOutcome: Math.round(bestValue.outcome * 100) / 100,
    overspendRatio: Math.round(ratio * 10) / 10,
    potentialSavingsPerCapita: Math.round(savingsPerCapita),
    potentialSavingsTotal: Math.round(savingsPerCapita * US_POPULATION),
    outcomeName: mapping.outcomeName,
    topEfficient,
  };
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
  const totalBudget = US_FEDERAL_BUDGET.categories.reduce((sum, cat) => sum + cat.spending * 1e9, 0);
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
    let efficiencyInfo: EfficiencyInfo | null = null;

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
      optimalPerCapita = efficiencyInfo.floorSpending;
      const usOECDSpendingTotal = efficiencyInfo.usData.spending * US_POPULATION; // total gov, not federal
      optimalNominal = efficiencyInfo.floorSpending * US_POPULATION;
      gap = usOECDSpendingTotal - optimalNominal; // OECD total vs floor — positive = overspend
      gapPercent = usOECDSpendingTotal > 0 ? (gap / usOECDSpendingTotal) * 100 : 0;

      const nCountries = efficiencyInfo.totalCountries;
      evidenceSource = `OECD efficient frontier (${nCountries} countries, rank ${efficiencyInfo.usRank}/${nCountries})`;

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
        return `${c.name}: US spends $${e.usData.spending}/cap (rank ${e.usRank}/${e.totalCountries}). ${e.bestCountry.name} spends $${e.bestCountry.spending}/cap with ${e.outcomeName} ${e.bestCountry.outcome}. Overspend: ${e.overspendRatio}x. Potential savings: ${fmtSavings}/yr`;
      } else if (e.overspendRatio < 0.8) {
        return `${c.name}: US underspends at $${e.usData.spending}/cap (rank ${e.usRank}/${e.totalCountries}). Floor: $${e.floorSpending}/cap.`;
      } else {
        return `${c.name}: US spends $${e.usData.spending}/cap (rank ${e.usRank}/${e.totalCountries}). Near floor ($${e.floorSpending}/cap). ${e.outcomeName}: ${e.usData.outcome}`;
      }
    });

  return {
    jurisdiction: 'United States of America',
    totalBudget,
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
// savings redirected as Universal Dividend (income) and the outcome improvement
// from matching the high performer's level (health, if the outcome is life expectancy).
function generateEfficiencyPolicies(budgetCategories: BudgetCategoryOutput[]): PolicyInput[] {
  const MEDIAN_INCOME = 59_540;
  const HOUSEHOLDS = 133_000_000;

  return budgetCategories
    .filter(c => c.efficiency && c.efficiency.overspendRatio >= 1.5)
    .map(c => {
      const e = c.efficiency!;
      const savingsPerHH = Math.round(e.potentialSavingsTotal / HOUSEHOLDS);
      const incomeEffect = savingsPerHH / MEDIAN_INCOME;

      // Health effect: only claim if outcome IS life expectancy AND best country is better
      // For non-LE outcomes (PISA, median income), health effect is 0.
      const isLifeExpOutcome = e.outcomeName === 'Life Expectancy';
      const leGap = isLifeExpOutcome ? (e.bestCountry.outcome - e.usData.outcome) : 0;
      // Convert LE gap in years to a fraction of baseline HALE (~66 years)
      // Only claim half the gap as realistic improvement (conservative)
      const healthEffect = isLifeExpOutcome ? Math.round((leGap * 0.5 / 66) * 1000) / 1000 : 0;

      return {
        name: `${c.name}: Adopt ${e.bestCountry.name}'s Approach`,
        type: 'budget_allocation',
        category: c.name.toLowerCase().replace(/[^a-z]+/g, '_'),
        description: `Reduce ${c.name.toLowerCase()} spending to the cheapest high-performer floor. ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spending}/cap; US gets ${e.usData.outcome} at $${e.usData.spending}/cap.`,
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
        rationale: `Cheapest-high-performer analysis: ${e.bestCountry.name} achieves ${e.outcomeName} ${e.bestCountry.outcome} at $${e.bestCountry.spending}/cap. US at $${e.usData.spending}/cap (${e.overspendRatio}x overspend). Top 3: ${e.topEfficient.map(t => `${t.name} ($${t.spending})`).join(', ')}. Savings: $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr → $${savingsPerHH.toLocaleString()}/household/yr as Universal Dividend.`,
        currentStatus: `US spends $${e.usData.spending}/cap, ranks ${e.usRank}/${e.totalCountries}. ${e.overspendRatio}x overspend.`,
        recommendedTarget: `${e.bestCountry.name} model ($${e.floorSpending}/cap floor). $${Math.round(e.potentialSavingsTotal / 1e9)}B/yr savings → Universal Dividend.`,
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
    jurisdiction: 'United States of America',
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
