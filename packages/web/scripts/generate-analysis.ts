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
  type SpendingOutcomePoint,
  type DiminishingReturnsModel,
} from '@optimitron/obg';

// Data imports
import {
  US_FEDERAL_BUDGET,
  toRealPerCapita,
  historicalToRealPerCapita,
  oecdBudgetPanelToSpendingOutcome,
} from '@optimitron/data';
import type { OECDBudgetPanelDataPoint } from '@optimitron/data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/data');

const US_POPULATION = 339_000_000; // 2025 estimate

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

const OECD_MAPPINGS: Record<string, OECDMapping> = {
  'Medicare': {
    spendingField: 'healthSpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
  'Medicaid': {
    spendingField: 'healthSpendingPerCapitaPpp',
    outcomeField: 'infantMortalityPer1000',
    negateOutcome: true,
    outcomeName: 'Infant Survival (inverted mortality)',
  },
  'Military': {
    spendingField: 'militarySpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
  'Social Security': {
    spendingField: 'socialSpendingPerCapitaPpp',
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

// Non-discretionary categories: skip OSL — these are mandated obligations
const NON_DISCRETIONARY = new Set([
  'Interest on Debt',
  'Social Security',
  'Medicare',
  'Other Mandatory Programs',
]);

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

  if (model.r2 < 0.01) return null; // No relationship

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

    if (isNonDiscretionary) {
      // Non-discretionary: no optimization, just report
      evidenceSource = 'non-discretionary (mandated)';
    } else if (mapping) {
      // Real OECD cross-country OSL estimation
      const result = runOSLAnalysis(mapping, currentRealPerCapita);
      if (result) {
        optimalPerCapita = result.oslPerCapita;
        optimalNominal = result.oslPerCapita * US_POPULATION;
        gap = optimalNominal - currentUsd;
        gapPercent = currentUsd > 0 ? (gap / currentUsd) * 100 : 0;
        evidenceSource = `OECD cross-country (${result.data.length} observations, ${new Set(result.data.map(d => d.jurisdiction)).size} countries)`;

        drInfo = {
          modelType: result.model.type,
          r2: Math.round(result.model.r2 * 1000) / 1000,
          n: result.model.n,
          marginalReturn: Math.round(result.mr * 100000) / 100000,
          elasticity: result.elasticity !== null ? Math.round(result.elasticity * 1000) / 1000 : null,
          outcomeName: mapping.outcomeName,
        };

        // Recommendation from gap
        if (gapPercent > 50) recommendation = 'scale_up';
        else if (gapPercent > 10) recommendation = 'increase';
        else if (gapPercent > -10) recommendation = 'maintain';
        else if (gapPercent > -50) recommendation = 'decrease';
        else recommendation = 'major_decrease';
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
    });
  }

  // Sort by absolute gap (biggest misallocation first)
  categories.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // Top recommendations (only categories with real evidence)
  const topRecommendations = categories
    .filter(c => c.recommendation !== 'maintain' && c.diminishingReturns !== null)
    .slice(0, 10)
    .map(c => {
      const dir = c.gap > 0 ? 'Increase' : 'Decrease';
      const amt = Math.abs(c.gap);
      const fmtAmt = amt >= 1e12 ? `$${(amt/1e12).toFixed(1)}T` : `$${(amt/1e9).toFixed(0)}B`;
      const model = c.diminishingReturns!;
      return `${dir} ${c.name} by ${fmtAmt} (${model.modelType} model, R²=${model.r2}, ${model.n} observations)`;
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
    description: 'Mandatory health savings + catastrophic insurance + price transparency. Singapore spends 4% GDP with better outcomes than US at 17%.',
    effectSize: 1.5, studyCount: 8, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 4,
    incomeEffect: 0.20, healthEffect: 0.40,
    rationale: 'Singapore: life expectancy 84 (US: 77), infant mortality 1.7 (US: 5.4), healthcare spending 4% GDP (US: 17%). Key: mandatory savings accounts + price competition + catastrophic coverage.',
    currentStatus: 'US spends $4.3T/yr (17% GDP) with worse outcomes than peers',
    recommendedTarget: 'Hybrid model: mandatory HSAs + transparent pricing + catastrophic pool',
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
    name: 'Military Spending Efficiency Audit',
    type: 'budget_allocation', category: 'defense',
    description: 'Mandatory independent audit of DoD spending; redirect savings to underfunded categories.',
    effectSize: 0.3, studyCount: 5, hasPredecessor: false, doseResponseExists: false,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 2,
    incomeEffect: 0.03, healthEffect: 0.01,
    rationale: 'Pentagon has failed every audit since they became mandatory in 2018. GAO estimates $100-200B/yr in waste, fraud, and cost overruns. F-35 program alone is $180B over budget.',
    currentStatus: '$886B military budget; failed 6th consecutive audit',
    recommendedTarget: 'Independent audit with binding recommendations; freeze until clean audit',
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
