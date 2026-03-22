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
  findOSL,
  marginalReturn as calcMarginalReturn,
  predictOutcome,
  efficientFrontier,
  findMinimumEffectiveSpending,
  overspendRatio,
  type SpendingOutcomePoint,
  type DiminishingReturnsModel,
  type EfficiencyCategory,
  type SpendingDecileCategory,
  type CountrySpending,
} from '@optimitron/obg';

// Data imports
import {
  US_FEDERAL_BUDGET,
  OECD_BUDGET_PANEL,
  toRealPerCapita,
  historicalToRealPerCapita,
  oecdBudgetPanelToSpendingOutcome,
} from '@optimitron/data';
import type { OECDBudgetPanelDataPoint } from '@optimitron/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');

const US_POPULATION = 339_000_000; // 2025 estimate

const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', GBR: 'United Kingdom', FRA: 'France',
  DEU: 'Germany', JPN: 'Japan', CAN: 'Canada', ITA: 'Italy',
  AUS: 'Australia', NLD: 'Netherlands', BEL: 'Belgium',
  SWE: 'Sweden', NOR: 'Norway', DNK: 'Denmark', FIN: 'Finland',
  AUT: 'Austria', CHE: 'Switzerland', ESP: 'Spain', PRT: 'Portugal',
  IRL: 'Ireland', NZL: 'New Zealand', KOR: 'South Korea',
  ISR: 'Israel', CZE: 'Czech Republic',
};

// ─── OECD Category Mappings ─────────────────────────────────────────
// Maps US federal budget category names to OECD panel spending/outcome fields.
// Categories with a mapping get real cross-country OSL estimation.

type OECDSpendingField = 'healthSpendingPerCapitaPpp' | 'educationSpendingPerCapitaPpp' | 'militarySpendingPerCapitaPpp' | 'socialSpendingPerCapitaPpp' | 'rdSpendingPerCapitaPpp';
type OECDOutcomeField = 'lifeExpectancyYears' | 'gdpPerCapitaPpp' | 'infantMortalityPer1000' | 'giniIndex';

interface OECDMapping {
  spendingField: OECDSpendingField;
  outcomeField: OECDOutcomeField;
  /** Negate outcome so higher = better (e.g., infant mortality) */
  negateOutcome?: boolean;
  outcomeName: string;
}

// Only map DISCRETIONARY categories with valid OECD comparisons.
// Non-discretionary (Medicare, Social Security, Interest) are excluded entirely.
// Healthcare: only the discretionary "Health" line gets OECD analysis. Medicare/Medicaid
// are mandatory entitlements and their savings can't be reallocated by appropriations.
//
// NOTE: OECD spending = total government (federal + state + local).
// For education, the federal budget line ($102B) is only ~12% of total US government
// education spending (~$850B). The OECD comparison reflects the total system.
const OECD_MAPPINGS: Record<string, OECDMapping> = {
  'Military': {
    spendingField: 'militarySpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
  'Education': {
    spendingField: 'educationSpendingPerCapitaPpp',
    outcomeField: 'gdpPerCapitaPpp',
    outcomeName: 'GDP per Capita',
  },
  'Science / NASA': {
    spendingField: 'rdSpendingPerCapitaPpp',
    outcomeField: 'gdpPerCapitaPpp',
    outcomeName: 'GDP per Capita',
  },
  'Health (non-Medicare/Medicaid)': {
    spendingField: 'healthSpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
};

// Non-discretionary categories: Congress cannot reallocate via annual appropriations.
// No OECD efficiency analysis, no OSL, no recommendation — just report as-is.
const NON_DISCRETIONARY = new Set([
  'Interest on Debt',
  'Social Security',
  'Medicare',
  'Medicaid',
  'Other Mandatory Programs',
]);

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

/** Build spending deciles from country averages */
function buildDeciles(countries: Array<{ spending: number; outcome: number }>): Array<{ decile: number; avgSpending: number; outcome: number }> {
  const sorted = [...countries].sort((a, b) => a.spending - b.spending);
  const decileSize = Math.max(1, Math.floor(sorted.length / 10));
  const deciles: Array<{ decile: number; avgSpending: number; outcome: number }> = [];

  for (let d = 0; d < 10; d++) {
    const start = d * decileSize;
    const end = d === 9 ? sorted.length : start + decileSize;
    const slice = sorted.slice(start, end);
    if (slice.length === 0) continue;
    const avgSpending = slice.reduce((s, c) => s + c.spending, 0) / slice.length;
    const avgOutcome = slice.reduce((s, c) => s + c.outcome, 0) / slice.length;
    deciles.push({ decile: d + 1, avgSpending, outcome: avgOutcome });
  }
  return deciles;
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

function runEfficiencyAnalysis(mapping: OECDMapping): EfficiencyInfo | null {
  const countries = latestCountryAverages(
    mapping.spendingField as keyof OECDBudgetPanelDataPoint,
    mapping.outcomeField as keyof OECDBudgetPanelDataPoint,
    mapping.negateOutcome,
  );

  if (countries.length < 5) return null;

  const usData = countries.find(c => c.code === 'USA');
  if (!usData) return null;

  // 1. Efficient frontier — rank countries by outcome-per-dollar
  const direction = mapping.negateOutcome ? 'higher' : 'higher'; // after negation, higher is always better
  const frontierResult = efficientFrontier([{
    categoryId: mapping.spendingField,
    categoryName: mapping.outcomeName,
    outcomeDirection: direction,
    countries: countries.map(c => ({
      countryCode: c.code,
      countryName: c.name,
      spending: c.spending,
      outcome: c.outcome,
    })),
  }]);

  const rankings = frontierResult[0]?.rankings ?? [];
  const usRanking = rankings.find(r => r.countryCode === 'USA');
  if (!usRanking) return null;

  // 2. Minimum effective spending — find the floor
  const deciles = buildDeciles(countries);
  const floorResult = findMinimumEffectiveSpending([{
    categoryId: mapping.spendingField,
    categoryName: mapping.outcomeName,
    deciles,
  }], {
    outcomeTolerance: mapping.negateOutcome ? 2 : 1, // wider tolerance for inverted metrics
    outcomeDirection: 'higher',
  });

  const floor = floorResult[0];
  const floorSpending = floor?.floorSpending ?? usData.spending;
  const floorOutcome = floor?.floorOutcome ?? usData.outcome;

  // 3. Overspend ratio for US
  const ratio = floorSpending > 0 ? usData.spending / floorSpending : 1;
  const savingsPerCapita = Math.max(0, usData.spending - floorSpending);

  // Top 3 most efficient
  const topEfficient = rankings.slice(0, 3).map(r => ({
    name: COUNTRY_NAMES[r.countryCode] ?? r.countryCode,
    spending: Math.round(r.spending),
    outcome: Math.round(r.outcome * 100) / 100,
    rank: r.rank,
  }));

  // Best country (rank 1)
  const best = rankings[0]!;

  return {
    usRank: usRanking.rank,
    totalCountries: rankings.length,
    bestCountry: {
      code: best.countryCode,
      name: COUNTRY_NAMES[best.countryCode] ?? best.countryCode,
      spending: Math.round(best.spending),
      outcome: Math.round(best.outcome * 100) / 100,
    },
    usData: {
      spending: Math.round(usData.spending),
      outcome: Math.round(usData.outcome * 100) / 100,
    },
    floorSpending: Math.round(floorSpending),
    floorOutcome: Math.round(floorOutcome * 100) / 100,
    overspendRatio: Math.round(ratio * 10) / 10,
    potentialSavingsPerCapita: Math.round(savingsPerCapita),
    potentialSavingsTotal: Math.round(savingsPerCapita * US_POPULATION),
    outcomeName: mapping.outcomeName,
    topEfficient,
  };
}

function runOSLAnalysis(
  mapping: OECDMapping,
  currentPerCapita: number,
): {
  model: DiminishingReturnsModel;
  oslPerCapita: number;
  mr: number;
  elasticity: number | null;
  data: SpendingOutcomePoint[];
} | null {
  // Get cross-country data
  let data = oecdBudgetPanelToSpendingOutcome(
    mapping.spendingField as keyof OECDBudgetPanelDataPoint,
    mapping.outcomeField as keyof OECDBudgetPanelDataPoint,
  );

  // Negate outcome if needed (so higher = better)
  if (mapping.negateOutcome) {
    data = data.map(d => ({ ...d, outcome: 100 - d.outcome }));
  }

  if (data.length < 10) return null;

  // Fit both models, pick best
  const logModel = fitLogModel(data);
  const satModel = fitSaturationModel(data);
  const model = logModel.r2 >= satModel.r2 ? logModel : satModel;

  // Calculate average marginal return across observed data
  const avgMR = data.reduce(
    (sum, d) => sum + Math.abs(calcMarginalReturn(d.spending, model)), 0,
  ) / data.length;

  // OSL = where marginal return drops to 50% of average
  const targetMR = avgMR * 0.5;
  let oslPerCapita: number;

  if (model.beta <= 0) {
    // Negative or zero benefit — recommend minimum observed
    const minSpending = Math.min(...data.map(d => d.spending));
    oslPerCapita = minSpending;
  } else if (targetMR > 0) {
    oslPerCapita = findOSL(model, targetMR);
    if (oslPerCapita <= 0 || !isFinite(oslPerCapita)) {
      oslPerCapita = currentPerCapita;
    }
  } else {
    oslPerCapita = currentPerCapita;
  }

  // Clamp to observed data range (don't extrapolate wildly)
  const maxObserved = Math.max(...data.map(d => d.spending));
  const minObserved = Math.min(...data.map(d => d.spending));
  oslPerCapita = Math.max(minObserved * 0.5, Math.min(oslPerCapita, maxObserved * 1.5));

  // Extra conservative for low-fit models
  if (model.r2 < 0.3) {
    oslPerCapita = Math.max(currentPerCapita * 0.5, Math.min(oslPerCapita, currentPerCapita * 2));
  }

  const mr = calcMarginalReturn(currentPerCapita, model);
  const predicted = predictOutcome(currentPerCapita, model);
  const elasticity = predicted !== 0 ? mr * (currentPerCapita / predicted) : null;

  return { model, oslPerCapita, mr, elasticity, data };
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
      // Non-discretionary: no optimization, just report
      evidenceSource = 'non-discretionary (mandated)';
    } else if (mapping) {
      // Real OECD cross-country OSL estimation
      const result = runOSLAnalysis(mapping, currentRealPerCapita);
      if (result) {
        const nCountries = new Set(result.data.map(d => d.jurisdiction)).size;

        drInfo = {
          modelType: result.model.type,
          r2: Math.round(result.model.r2 * 1000) / 1000,
          n: result.model.n,
          marginalReturn: Math.round(result.mr * 100000) / 100000,
          elasticity: result.elasticity !== null ? Math.round(result.elasticity * 1000) / 1000 : null,
          outcomeName: mapping.outcomeName,
        };

        evidenceSource = `OECD cross-country (${result.data.length} obs, ${nCountries} countries, R²=${drInfo.r2})`;

        if (result.model.r2 >= 0.01) {
          // Meaningful diminishing returns relationship — use OSL for gap
          optimalPerCapita = result.oslPerCapita;
          optimalNominal = result.oslPerCapita * US_POPULATION;
          gap = optimalNominal - currentUsd;
          gapPercent = currentUsd > 0 ? (gap / currentUsd) * 100 : 0;
        }

        // Recommendation comes from EFFICIENCY analysis (overspend ratio),
        // NOT from R² of the curve fit. A low R² means the curve doesn't fit —
        // but the efficiency ranking still shows peers getting better results for less.
        if (efficiencyInfo && efficiencyInfo.overspendRatio >= 3) {
          recommendation = 'major_decrease';
        } else if (efficiencyInfo && efficiencyInfo.overspendRatio >= 1.5) {
          recommendation = 'decrease';
        } else if (gapPercent > 50) {
          recommendation = 'scale_up';
        } else if (gapPercent > 10) {
          recommendation = 'increase';
        } else if (gapPercent > -10) {
          recommendation = 'maintain';
        } else if (gapPercent > -50) {
          recommendation = 'decrease';
        } else {
          recommendation = 'major_decrease';
        }
      } else {
        evidenceSource = 'OECD mapping available but insufficient data';
      }
    } else {
      // Fallback: outcome trend heuristic
      const improvingMetrics = cat.outcomeMetrics.filter(m =>
        m.trend === 'improving' || m.trend === 'increasing'
      ).length;
      const decliningMetrics = cat.outcomeMetrics.filter(m =>
        m.trend === 'declining' || m.trend === 'decreasing' || m.trend === 'worsening'
      ).length;
      const totalMetrics = cat.outcomeMetrics.length || 1;
      const outcomeScore = (improvingMetrics - decliningMetrics) / totalMetrics;

      evidenceSource = 'outcome-trend heuristic (no cross-country data)';

      // For trend-based: only flag strong signals
      if (outcomeScore <= -0.5) {
        recommendation = 'decrease';
        gapPercent = outcomeScore * 20; // -10% to -20%
        gap = currentUsd * (gapPercent / 100);
      } else if (outcomeScore >= 0.5) {
        recommendation = 'increase';
        gapPercent = outcomeScore * 20;
        gap = currentUsd * (gapPercent / 100);
      }
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

interface PolicyInput {
  name: string;
  type: string;
  category: string;
  description: string;
  effectSize: number;
  studyCount: number;
  hasPredecessor: boolean;
  doseResponseExists: boolean;
  hasRCT: boolean;
  mechanismKnown: boolean;
  consistentWithTheory: boolean;
  analogyExists: boolean;
  outcomeCount: number;
  incomeEffect: number;
  healthEffect: number;
  rationale: string;
  currentStatus: string;
  recommendedTarget: string;
  blockingFactors: string[];
}

const REAL_POLICIES: PolicyInput[] = [
  {
    name: 'Shift Drug Policy from Criminal to Health Approach',
    type: 'regulation', category: 'health',
    description: 'Decriminalize personal drug use, fund treatment and harm reduction. Based on Portugal model (2001).',
    effectSize: 1.2, studyCount: 15, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.05, healthEffect: 0.35,
    rationale: 'Portugal decriminalized in 2001: drug deaths dropped 80%, HIV among users dropped 90%, treatment uptake tripled. Czech Republic, Switzerland, and Netherlands show similar results.',
    currentStatus: 'US spends $40B/yr on drug enforcement; 1.5M arrests annually',
    recommendedTarget: 'Decriminalize personal use, redirect enforcement budget to treatment',
    blockingFactors: ['political_opposition'],
  },
  {
    name: 'Universal Pre-K (Ages 3-4)',
    type: 'budget_allocation', category: 'education',
    description: 'Federally funded universal pre-K based on Perry Preschool and European models.',
    effectSize: 0.8, studyCount: 25, hasPredecessor: true, doseResponseExists: true,
    hasRCT: true, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 5,
    incomeEffect: 0.15, healthEffect: 0.10,
    rationale: 'Perry Preschool RCT: 40-year follow-up shows $7-12 ROI per dollar. France, Denmark, Finland all have universal pre-K with better educational outcomes.',
    currentStatus: 'Only 34% of US 3-year-olds enrolled; varies wildly by state',
    recommendedTarget: 'Federal funding for universal enrollment by age 3',
    blockingFactors: ['budget_constraint'],
  },
  {
    name: 'Singapore-Style Healthcare (Universal + Competition)',
    type: 'regulation', category: 'health',
    description: 'Mandatory health savings + catastrophic insurance + price transparency. Singapore spends 4% GDP with better outcomes than US at 17%. OECD data: US ranks 23/23 in health spending efficiency at $10,333/cap vs floor of $3,142/cap (3.3x overspend). Savings: $2.4T/yr.',
    effectSize: 1.5, studyCount: 8, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 4,
    // Income: $2.4T savings / 133M households = $18,329/yr = 30.8% of median income
    // Health: US HALE 66.1 vs Portugal 72.1 = +6 years potential, conservatively +3yr
    incomeEffect: 0.31, healthEffect: 0.40,
    rationale: 'Singapore: life expectancy 84 (US: 77), infant mortality 1.7 (US: 5.4), healthcare spending 4% GDP (US: 17%). OECD efficiency analysis: US ranks dead last (23/23) at $10,333/cap. Portugal achieves life expectancy 81.4 at $2,924/cap. Floor spending: $3,142/cap. Potential savings: $2.4T/yr → $18,329/household/yr as dividend.',
    currentStatus: 'US spends $4.3T/yr (17% GDP), ranks 23/23 in OECD health efficiency',
    recommendedTarget: 'Singapore 3M model: mandatory HSAs + catastrophic insurance + price transparency. Target: $3,142/cap (OECD floor)',
    blockingFactors: ['political_opposition', 'industry_resistance'],
  },
  {
    name: 'Earned Income Tax Credit Expansion',
    type: 'tax_policy', category: 'income_security',
    description: 'Expand EITC for childless workers and increase phase-out thresholds.',
    effectSize: 0.6, studyCount: 30, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 4,
    incomeEffect: 0.25, healthEffect: 0.08,
    rationale: 'EITC lifts ~6M people out of poverty annually. Research shows improved infant health, better school performance, and increased labor force participation. Bipartisan support historically.',
    currentStatus: '$63B annual cost; benefits phase out at $59K for families',
    recommendedTarget: 'Double benefit for childless workers ($1,500→$3,000); raise income cap',
    blockingFactors: ['budget_constraint'],
  },
  {
    name: 'NEPA & Permitting Reform',
    type: 'regulation', category: 'infrastructure',
    description: 'Streamline environmental review timelines from 4.5 years to 2 years for infrastructure projects.',
    effectSize: 0.5, studyCount: 10, hasPredecessor: true, doseResponseExists: false,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.10, healthEffect: 0.02,
    rationale: 'Average NEPA review takes 4.5 years. Canada and EU complete equivalent reviews in 2 years. Delays cost $3.7T in deferred infrastructure investment.',
    currentStatus: 'Average environmental review: 4.5 years; 40,000+ pages of regulation',
    recommendedTarget: '2-year maximum review with categorical exclusions for clean energy',
    blockingFactors: ['political_opposition'],
  },
  {
    name: 'Carbon Fee-and-Dividend',
    type: 'tax_policy', category: 'environment',
    description: 'Tax carbon emissions, return 100% of revenue as equal citizen dividend. Based on British Columbia model.',
    effectSize: 0.7, studyCount: 12, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 4,
    incomeEffect: -0.02, healthEffect: 0.15,
    rationale: 'British Columbia: emissions down 5-15% vs control, GDP growth maintained. Switzerland carbon tax reduced emissions 20%. Dividend protects low-income households.',
    currentStatus: 'No federal carbon price; 12 states have cap-and-trade or carbon tax',
    recommendedTarget: '$50/ton starting price, rising $10/yr, 100% returned as dividend',
    blockingFactors: ['political_opposition', 'industry_resistance'],
  },
  {
    name: 'Pragmatic Clinical Trial Funding Reform',
    type: 'regulation', category: 'health_research',
    description: 'Redirect NIH funding from basic research overhead to pragmatic real-world clinical trials with mandatory data sharing.',
    effectSize: 0.9, studyCount: 8, hasPredecessor: true, doseResponseExists: true,
    hasRCT: true, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.05, healthEffect: 0.30,
    rationale: 'NIH spends $48B/yr but 70%+ goes to indirect costs and basic research with low translation rates. UK NIHR model: pragmatic trials embedded in NHS produce actionable evidence at 1/10th the cost. PCORIs pragmatic trials show 3x faster clinical adoption.',
    currentStatus: 'NIH: $48B/yr, <10% on pragmatic trials, 85% of findings fail to replicate',
    recommendedTarget: 'Mandate 30%+ of NIH budget for pragmatic trials with open data requirements',
    blockingFactors: ['institutional_resistance', 'industry_resistance'],
  },
  {
    name: 'Federal Incentives for Zoning Reform',
    type: 'regulation', category: 'housing',
    description: 'Federal grants conditioned on local upzoning, elimination of single-family-only zoning.',
    effectSize: 0.7, studyCount: 15, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.15, healthEffect: 0.05,
    rationale: 'Tokyo has no housing crisis because they allow building. Minneapolis eliminated single-family zoning: rents stabilized. Oregon statewide upzoning reduced housing cost growth. Restrictive zoning costs the US economy $1.6T/yr in lost GDP.',
    currentStatus: '75% of US residential land zoned single-family only',
    recommendedTarget: 'Condition federal transportation/HUD grants on local zoning reform',
    blockingFactors: ['political_opposition'],
  },
  {
    name: 'Occupational Licensing Reform',
    type: 'regulation', category: 'economy',
    description: 'Reduce unnecessary licensing requirements that affect 25% of US workers.',
    effectSize: 0.4, studyCount: 20, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.08, healthEffect: 0.01,
    rationale: 'Licensed occupations grew from 5% to 25% of workforce since 1950s. States with less licensing have no difference in service quality but 10-15% lower consumer prices. Interior designers need a license in some states; paramedics don\'t in others.',
    currentStatus: '25% of US workers need government license; varies wildly by state',
    recommendedTarget: 'Federal mutual recognition framework; sunset reviews for all licenses',
    blockingFactors: ['industry_resistance'],
  },
  {
    name: 'Permanent Expanded Child Tax Credit',
    type: 'tax_policy', category: 'income_security',
    description: 'Make the 2021 expanded CTC ($3,600/child) permanent and fully refundable.',
    effectSize: 0.8, studyCount: 12, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 4,
    incomeEffect: 0.20, healthEffect: 0.12,
    rationale: '2021 expanded CTC cut child poverty by 46% in 6 months — largest single-year reduction ever. Canada\'s similar program reduced child poverty by 30%. Cost: ~$100B/yr.',
    currentStatus: 'Reverted to $2,000/child, not fully refundable (excludes poorest families)',
    recommendedTarget: '$3,600/child under 6, $3,000 ages 6-17, fully refundable',
    blockingFactors: ['budget_constraint'],
  },
  {
    name: 'National Paid Family Leave (12 weeks)',
    type: 'regulation', category: 'labor',
    description: '12 weeks paid family leave at 66% wage replacement. US is the only OECD country without it.',
    effectSize: 0.6, studyCount: 35, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 5,
    incomeEffect: 0.05, healthEffect: 0.15,
    rationale: 'Every other OECD country has paid leave. California\'s program: 18% reduction in nursing home use by new parents, higher breastfeeding rates, no negative employment effects.',
    currentStatus: 'US is only OECD country with 0 weeks mandated paid family leave',
    recommendedTarget: '12 weeks at 66% wage replacement, funded by 0.4% payroll tax',
    blockingFactors: ['political_opposition', 'budget_constraint'],
  },
  {
    name: 'Military Spending Reduction to OECD Floor',
    type: 'budget_allocation', category: 'defense',
    description: 'Reduce military spending from $2,052/cap to OECD efficient floor of $279/cap (7.4x overspend). OECD data: US ranks 23/23 in military spending efficiency. Ireland achieves life expectancy 82 at $226/cap. Redirect $601B/yr savings to Universal Dividend.',
    effectSize: 0.8, studyCount: 23, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 2,
    // Income: $601B savings / 133M households = $4,519/yr = 7.6% of median income
    // Health: indirect — freed resources fund healthcare/UBI → +0.5yr HALE conservatively
    incomeEffect: 0.076, healthEffect: 0.05,
    rationale: 'OECD efficiency analysis: US ranks dead last (23/23) in military spending efficiency. Ireland spends $226/cap with life expectancy 82; Spain $331/cap with 82.87; Austria $339/cap with 81.3. US spends $2,052/cap with life expectancy 76.93. Military spending has R²=0.006 correlation with life expectancy — zero relationship. $601B/yr savings → $4,519/household/yr as Universal Dividend.',
    currentStatus: 'US spends $886B/yr (7.4x OECD efficient floor), ranks 23/23 in efficiency',
    recommendedTarget: 'Phased reduction to $279/cap ($95B total). $601B/yr savings → Universal Dividend Pool',
    blockingFactors: ['political_opposition', 'institutional_resistance'],
  },
];

function generatePolicyAnalysis() {
  const policies = REAL_POLICIES.map(p => {
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
const policyAnalysis = generatePolicyAnalysis();
writeFileSync(
  resolve(dataDir, 'us-policy-analysis.json'),
  JSON.stringify(policyAnalysis, null, 2)
);
console.log(`  ✅ ${policyAnalysis.policies.length} policies → us-policy-analysis.json`);

console.log('\nDone! Data generated from real OPG/OBG libraries + OECD cross-country data.');
