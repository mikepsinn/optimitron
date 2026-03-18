/**
 * US Federal Policy Ranking Analysis
 *
 * Loads evidence-based US policy data, runs OPG policy ranking using
 * Bradford Hill criteria scoring, ranks policies by welfare impact,
 * and generates both markdown and JSON output.
 *
 * @see https://opg.warondisease.org
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  scoreStrength,
  scoreConsistency,
  scoreTemporality,
  scoreGradient,
  scoreExperiment,
  scorePlausibility,
  scoreCoherence,
  scoreSpecificity,
  calculateCCS,
  type BradfordHillScores,
  type AnalysisMethod,
} from '@optimitron/opg';

import {
  generatePolicyReport,
  type PolicyRankingResult,
  type PolicyAnalysis,
} from '@optimitron/opg';

import type {
  Policy,
  PolicyRecommendation,
  RecommendationType,
  EvidenceGrade,
} from '@optimitron/opg';

import type { Jurisdiction } from '@optimitron/opg';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

const US_JURISDICTION: Jurisdiction = {
  id: 'US',
  name: 'United States of America',
  type: 'country',
  isoCode: 'US',
  population: 336_000_000,
  gdpPerCapita: 86_300,
  dataQualityScore: 0.85,
};

// ---------------------------------------------------------------------------
// Evidence-based US Policy Data
// ---------------------------------------------------------------------------

interface PolicySeed {
  id: string;
  name: string;
  type: Policy['type'];
  categoryId: string;
  description: string;
  isContinuous: boolean;

  // Evidence data for Bradford Hill scoring
  standardizedEffect: number;
  concordantJurisdictions: number;
  policyPrecedesOutcome: boolean;
  doseResponseCorrelation?: number;
  analysisMethod: AnalysisMethod;
  validityViolations: number;
  mechanism: {
    theoryPredicts: boolean;
    behavioralResponse: boolean;
    noImplausibleAssumptions: boolean;
    timingConsistent: boolean;
    magnitudePlausible: boolean;
  };
  supportingStudies: number;
  outcomeCount: number;
  analogyScore: number;

  // Policy recommendation context
  recommendationType: RecommendationType;
  currentStatus?: string;
  recommendedTarget?: string;
  rationale: string;
  blockingFactors?: PolicyRecommendation['blockingFactors'];

  // Welfare effects
  incomeEffect: number;
  healthEffect: number;
}

const POLICIES: PolicySeed[] = [
  {
    id: 'eitc_expansion',
    name: 'Earned Income Tax Credit Expansion',
    type: 'tax_policy',
    categoryId: 'income_security',
    description: 'Expand EITC eligibility and benefit amounts for childless workers and families',
    isContinuous: true,
    standardizedEffect: 0.45,
    concordantJurisdictions: 12,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.72,
    analysisMethod: 'rct',
    validityViolations: 0.05,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 45,
    outcomeCount: 3,
    analogyScore: 0.85,
    recommendationType: 'replace',
    currentStatus: '$7,430 max credit (family w/ 3+ children)',
    recommendedTarget: '$10,000 max credit with expanded childless worker eligibility',
    rationale: 'Strong RCT evidence shows EITC expansion reduces poverty, increases labor force participation, and improves child outcomes.',
    blockingFactors: ['budget_constraint', 'political'],
    incomeEffect: 0.45,
    healthEffect: 0.15,
  },
  {
    id: 'universal_pre_k',
    name: 'Universal Pre-K (Ages 3-4)',
    type: 'budget_allocation',
    categoryId: 'education',
    description: 'Federally funded universal pre-kindergarten for all 3-4 year olds',
    isContinuous: false,
    standardizedEffect: 0.55,
    concordantJurisdictions: 15,
    policyPrecedesOutcome: true,
    analysisMethod: 'rct',
    validityViolations: 0.08,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 38,
    outcomeCount: 5,
    analogyScore: 0.80,
    recommendationType: 'enact',
    rationale: 'Perry Preschool and Head Start RCTs show long-term gains in earnings, education, and reduced crime. ROI estimated at 7:1.',
    blockingFactors: ['budget_constraint', 'political'],
    incomeEffect: 0.35,
    healthEffect: 0.20,
  },
  {
    id: 'medicare_negotiation',
    name: 'Medicare Drug Price Negotiation Expansion',
    type: 'regulation',
    categoryId: 'medicare',
    description: 'Expand IRA drug negotiation to cover more drugs sooner',
    isContinuous: true,
    standardizedEffect: 0.38,
    concordantJurisdictions: 20,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.65,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.10,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 30,
    outcomeCount: 4,
    analogyScore: 0.90,
    recommendationType: 'replace',
    currentStatus: '10 drugs negotiated in 2026',
    recommendedTarget: '50+ drugs by 2028, covering Part D and Part B',
    rationale: 'All peer OECD nations negotiate drug prices. Cross-country evidence shows 30-60% savings with no reduction in innovation.',
    blockingFactors: ['political'],
    incomeEffect: 0.20,
    healthEffect: 0.30,
  },
  {
    id: 'carbon_pricing',
    name: 'Carbon Pricing / Carbon Fee-and-Dividend',
    type: 'tax_policy',
    categoryId: 'environment',
    description: 'Economy-wide carbon fee starting at $50/ton with revenue returned as dividends',
    isContinuous: true,
    standardizedEffect: 0.50,
    concordantJurisdictions: 8,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.68,
    analysisMethod: 'synthetic_control',
    validityViolations: 0.12,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 25,
    outcomeCount: 4,
    analogyScore: 0.75,
    recommendationType: 'enact',
    rationale: 'BC carbon tax and EU ETS show emissions reduction with minimal GDP impact. Dividend return makes it progressive.',
    blockingFactors: ['political', 'constitutional'],
    incomeEffect: 0.10,
    healthEffect: 0.25,
  },
  {
    id: 'housing_zoning_reform',
    name: 'Federal Incentives for Zoning Reform',
    type: 'regulation',
    categoryId: 'housing',
    description: 'Tie federal transportation/HUD funding to local zoning reform for housing supply',
    isContinuous: true,
    standardizedEffect: 0.42,
    concordantJurisdictions: 6,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.58,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.15,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 18,
    outcomeCount: 3,
    analogyScore: 0.70,
    recommendationType: 'enact',
    rationale: 'Supply-side housing reform in Japan, Auckland, and US state-level (OR, CA) show reduced housing costs.',
    blockingFactors: ['political', 'federal_preemption'],
    incomeEffect: 0.30,
    healthEffect: 0.10,
  },
  {
    id: 'nih_funding_increase',
    name: 'Double NIH Research Funding',
    type: 'budget_allocation',
    categoryId: 'health_research',
    description: 'Double NIH budget from $48B to $96B over 5 years',
    isContinuous: true,
    standardizedEffect: 0.60,
    concordantJurisdictions: 10,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.75,
    analysisMethod: 'event_study',
    validityViolations: 0.08,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 42,
    outcomeCount: 6,
    analogyScore: 0.85,
    recommendationType: 'replace',
    currentStatus: '$48B annual NIH budget',
    recommendedTarget: '$96B annual NIH budget',
    rationale: 'Previous NIH doubling (1998-2003) led to genomic revolution. ROI on biomedical research estimated at 40-50%.',
    blockingFactors: ['budget_constraint'],
    incomeEffect: 0.25,
    healthEffect: 0.50,
  },
  {
    id: 'immigration_reform',
    name: 'High-Skill Immigration Reform',
    type: 'law',
    categoryId: 'general_govt',
    description: 'Increase H-1B cap, create startup visa, clear green card backlog',
    isContinuous: true,
    standardizedEffect: 0.35,
    concordantJurisdictions: 8,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.55,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.12,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 22,
    outcomeCount: 4,
    analogyScore: 0.75,
    recommendationType: 'replace',
    currentStatus: '85,000 H-1B annual cap',
    recommendedTarget: '200,000+ H-1B cap with startup visa category',
    rationale: 'Canada and Australia points-based systems show high-skill immigration boosts GDP per capita and innovation.',
    blockingFactors: ['political'],
    incomeEffect: 0.40,
    healthEffect: 0.05,
  },
  {
    id: 'child_tax_credit',
    name: 'Permanent Expanded Child Tax Credit',
    type: 'tax_policy',
    categoryId: 'income_security',
    description: 'Make 2021 expanded CTC ($3,600/child) permanent and fully refundable',
    isContinuous: true,
    standardizedEffect: 0.52,
    concordantJurisdictions: 15,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.70,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.05,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 35,
    outcomeCount: 5,
    analogyScore: 0.90,
    recommendationType: 'enact',
    rationale: '2021 expansion cut child poverty by 46%. Canada CDB shows sustained poverty reduction effects.',
    blockingFactors: ['budget_constraint', 'political'],
    incomeEffect: 0.40,
    healthEffect: 0.15,
  },
  {
    id: 'infrastructure_investment',
    name: 'Sustained Infrastructure Investment (IIJA+)',
    type: 'budget_allocation',
    categoryId: 'transportation',
    description: 'Maintain IIJA spending levels beyond 2026 with expanded transit and broadband',
    isContinuous: true,
    standardizedEffect: 0.40,
    concordantJurisdictions: 10,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.60,
    analysisMethod: 'synthetic_control',
    validityViolations: 0.10,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 28,
    outcomeCount: 5,
    analogyScore: 0.80,
    recommendationType: 'replace',
    currentStatus: 'IIJA $550B new spending (2022-2026)',
    recommendedTarget: 'Sustained $150B/year above baseline',
    rationale: 'ASCE rates US infrastructure C−. Multiplier effects of 1.5-2.0x on GDP; reduces commute times and freight costs.',
    blockingFactors: ['budget_constraint', 'political'],
    incomeEffect: 0.30,
    healthEffect: 0.10,
  },
  {
    id: 'permitting_reform',
    name: 'NEPA & Permitting Reform',
    type: 'regulation',
    categoryId: 'general_govt',
    description: 'Streamline environmental review and permitting for infrastructure and clean energy',
    isContinuous: false,
    standardizedEffect: 0.30,
    concordantJurisdictions: 5,
    policyPrecedesOutcome: true,
    analysisMethod: 'event_study',
    validityViolations: 0.15,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: false,
    },
    supportingStudies: 15,
    outcomeCount: 3,
    analogyScore: 0.65,
    recommendationType: 'enact',
    rationale: 'Average permitting time of 4.5 years delays critical projects. Germany and EU permitting reform shows 50% time reduction.',
    blockingFactors: ['political'],
    incomeEffect: 0.20,
    healthEffect: 0.05,
  },
  {
    id: 'drug_decriminalization',
    name: 'Shift Drug Policy from Criminal to Health Approach',
    type: 'law',
    categoryId: 'justice',
    description: 'Redirect drug enforcement spending to treatment and harm reduction',
    isContinuous: false,
    standardizedEffect: 0.35,
    concordantJurisdictions: 7,
    policyPrecedesOutcome: true,
    analysisMethod: 'interrupted_time_series',
    validityViolations: 0.18,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 20,
    outcomeCount: 4,
    analogyScore: 0.70,
    recommendationType: 'replace',
    currentStatus: 'Criminal penalties for drug possession in most states',
    recommendedTarget: 'Civil penalties with mandatory treatment referrals',
    rationale: 'Portugal decriminalization (2001) shows reduced overdose deaths, HIV, and incarceration without increased use.',
    blockingFactors: ['political', 'federal_preemption'],
    incomeEffect: 0.10,
    healthEffect: 0.25,
  },
  {
    id: 'clean_energy_standard',
    name: 'National Clean Energy Standard',
    type: 'regulation',
    categoryId: 'energy',
    description: '80% clean electricity by 2030, 100% by 2035',
    isContinuous: true,
    standardizedEffect: 0.45,
    concordantJurisdictions: 9,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.62,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.12,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 22,
    outcomeCount: 4,
    analogyScore: 0.80,
    recommendationType: 'enact',
    rationale: 'State-level RPS data shows clean energy standards reduce emissions 10-20% with modest electricity cost increases.',
    blockingFactors: ['political'],
    incomeEffect: 0.10,
    healthEffect: 0.30,
  },
  {
    id: 'occupational_licensing_reform',
    name: 'Occupational Licensing Reform',
    type: 'regulation',
    categoryId: 'general_govt',
    description: 'Federal incentives for states to reduce unnecessary occupational licensing barriers',
    isContinuous: true,
    standardizedEffect: 0.28,
    concordantJurisdictions: 8,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.50,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.10,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 20,
    outcomeCount: 3,
    analogyScore: 0.65,
    recommendationType: 'enact',
    rationale: 'Licensing reform in AZ and universal recognition states show increased labor mobility and lower consumer prices.',
    blockingFactors: ['federal_preemption', 'political'],
    incomeEffect: 0.25,
    healthEffect: 0.02,
  },
  {
    id: 'paid_family_leave',
    name: 'National Paid Family Leave',
    type: 'law',
    categoryId: 'income_security',
    description: '12 weeks paid family and medical leave at 66% wage replacement',
    isContinuous: true,
    standardizedEffect: 0.40,
    concordantJurisdictions: 18,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.58,
    analysisMethod: 'difference_in_differences',
    validityViolations: 0.08,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: true,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 32,
    outcomeCount: 5,
    analogyScore: 0.90,
    recommendationType: 'enact',
    rationale: 'US is only OECD nation without federal paid leave. State programs (CA, NJ, WA) show improved maternal/infant health and labor force participation.',
    blockingFactors: ['budget_constraint', 'political'],
    incomeEffect: 0.20,
    healthEffect: 0.25,
  },
  {
    id: 'defense_audit',
    name: 'Military Spending Efficiency Audit & Reform',
    type: 'regulation',
    categoryId: 'military',
    description: 'Achieve clean DoD audit, reduce procurement waste, close redundant bases',
    isContinuous: false,
    standardizedEffect: 0.20,
    concordantJurisdictions: 5,
    policyPrecedesOutcome: true,
    analysisMethod: 'before_after',
    validityViolations: 0.20,
    mechanism: {
      theoryPredicts: true,
      behavioralResponse: true,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: true,
    },
    supportingStudies: 12,
    outcomeCount: 3,
    analogyScore: 0.60,
    recommendationType: 'replace',
    currentStatus: 'DoD has failed 6 consecutive audits',
    recommendedTarget: 'Clean audit by 2028, 5% efficiency savings',
    rationale: 'GAO estimates $100-200B in potential savings. Allied nations achieve comparable readiness at lower cost.',
    blockingFactors: ['political', 'implementation_capacity'],
    incomeEffect: 0.15,
    healthEffect: 0.02,
  },
  {
    id: 'war_on_drugs',
    name: 'War on Drugs / Mandatory Minimums',
    type: 'law',
    categoryId: 'justice',
    description: 'Federal mandatory minimum sentences for drug offenses',
    isContinuous: false,
    standardizedEffect: -0.15,
    concordantJurisdictions: 4,
    policyPrecedesOutcome: true,
    analysisMethod: 'before_after',
    validityViolations: 0.25,
    mechanism: {
      theoryPredicts: false,
      behavioralResponse: false,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: false,
    },
    supportingStudies: 8,
    outcomeCount: 2,
    analogyScore: 0.30,
    recommendationType: 'repeal',
    currentStatus: 'Federal mandatory minimums for drug possession/distribution',
    recommendedTarget: 'Repeal mandatory minimums; redirect to treatment (Portugal model)',
    rationale: 'US incarceration rates rose 500% since 1970 with no decline in drug use. Portugal decriminalization (2001) reduced overdose deaths and HIV with no usage increase.',
    blockingFactors: ['political'],
    incomeEffect: -0.10,
    healthEffect: -0.20,
  },
  {
    id: 'abstinence_only_education',
    name: 'Abstinence-Only Sex Education',
    type: 'budget_allocation',
    categoryId: 'education',
    description: 'Federal funding for abstinence-only-until-marriage sex education programs',
    isContinuous: true,
    standardizedEffect: -0.10,
    concordantJurisdictions: 3,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: -0.15,
    analysisMethod: 'before_after',
    validityViolations: 0.20,
    mechanism: {
      theoryPredicts: false,
      behavioralResponse: false,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: false,
    },
    supportingStudies: 10,
    outcomeCount: 2,
    analogyScore: 0.25,
    recommendationType: 'repeal',
    currentStatus: '$85M annual federal abstinence education funding',
    recommendedTarget: 'Redirect to evidence-based comprehensive sex education',
    rationale: 'Multiple RCTs (Mathematica 2007, Trenholm et al.) show no effect on sexual behavior. States with abstinence-only programs have higher teen pregnancy rates.',
    blockingFactors: ['political'],
    incomeEffect: -0.02,
    healthEffect: -0.08,
  },
  {
    id: 'ethanol_fuel_mandate',
    name: 'Ethanol Fuel Mandate (Renewable Fuel Standard)',
    type: 'regulation',
    categoryId: 'energy',
    description: 'Federal mandate requiring ethanol blending in gasoline under the Renewable Fuel Standard',
    isContinuous: true,
    standardizedEffect: 0.05,
    concordantJurisdictions: 2,
    policyPrecedesOutcome: true,
    doseResponseCorrelation: 0.10,
    analysisMethod: 'before_after',
    validityViolations: 0.22,
    mechanism: {
      theoryPredicts: false,
      behavioralResponse: true,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: false,
    },
    supportingStudies: 12,
    outcomeCount: 2,
    analogyScore: 0.35,
    recommendationType: 'repeal',
    currentStatus: '15B gallons/year corn ethanol mandate',
    recommendedTarget: 'Phase out corn ethanol mandate; maintain cellulosic RFS only',
    rationale: 'Lifecycle analysis shows negligible net emissions reduction. Raises food prices by 5-15% (corn diverted to fuel). Primarily benefits corn lobby, not environment.',
    blockingFactors: ['political'],
    incomeEffect: -0.05,
    healthEffect: 0.02,
  },
  {
    id: 'penny_continuation',
    name: 'Penny Coin Continuation',
    type: 'regulation',
    categoryId: 'general_govt',
    description: 'Continued minting of the US one-cent coin despite costing more to produce than face value',
    isContinuous: false,
    standardizedEffect: -0.02,
    concordantJurisdictions: 2,
    policyPrecedesOutcome: true,
    analysisMethod: 'before_after',
    validityViolations: 0.15,
    mechanism: {
      theoryPredicts: false,
      behavioralResponse: false,
      noImplausibleAssumptions: false,
      timingConsistent: true,
      magnitudePlausible: false,
    },
    supportingStudies: 6,
    outcomeCount: 1,
    analogyScore: 0.40,
    recommendationType: 'repeal',
    currentStatus: '~7B pennies minted annually at 3.07 cents each (2023)',
    recommendedTarget: 'Eliminate penny; round cash transactions to nearest 5 cents',
    rationale: 'Costs 3x face value to mint ($179M net loss in 2023). Canada (2013) and Australia (1992) eliminated lowest denomination coins with no economic disruption.',
    blockingFactors: ['political'],
    incomeEffect: -0.01,
    healthEffect: 0.00,
  },
];

// ---------------------------------------------------------------------------
// Analysis pipeline
// ---------------------------------------------------------------------------

function analyzeSinglePolicy(seed: PolicySeed): PolicyAnalysis {
  // 1. Build Policy object
  const policy: Policy = {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    categoryId: seed.categoryId,
    description: seed.description,
    isContinuous: seed.isContinuous,
  };

  // 2. Score Bradford Hill criteria
  const bhScores: BradfordHillScores = {
    strength: scoreStrength(seed.standardizedEffect),
    consistency: scoreConsistency(seed.concordantJurisdictions),
    temporality: scoreTemporality(seed.policyPrecedesOutcome),
    gradient: scoreGradient(seed.doseResponseCorrelation) ?? 0,
    experiment: scoreExperiment(seed.analysisMethod, seed.validityViolations),
    plausibility: scorePlausibility(seed.mechanism),
    coherence: scoreCoherence(seed.supportingStudies),
    analogy: seed.analogyScore,
    specificity: scoreSpecificity(seed.outcomeCount),
  };

  // 3. Calculate CCS
  const ccs = calculateCCS(bhScores);

  // 4. Evidence grade from CCS
  let evidenceGrade: EvidenceGrade;
  if (ccs >= 0.80) evidenceGrade = 'A';
  else if (ccs >= 0.60) evidenceGrade = 'B';
  else if (ccs >= 0.40) evidenceGrade = 'C';
  else if (ccs >= 0.20) evidenceGrade = 'D';
  else evidenceGrade = 'F';

  // 5. Policy Impact Score (0-1, composite of CCS and welfare magnitude)
  const welfareMagnitude = Math.abs(seed.incomeEffect) + Math.abs(seed.healthEffect);
  const policyImpactScore = Math.min(1, ccs * 0.6 + welfareMagnitude * 0.4);

  // 6. Priority score
  const priorityScore = policyImpactScore * welfareMagnitude * 100;

  // 7. Build recommendation
  const recommendation: PolicyRecommendation = {
    jurisdictionId: 'US',
    policyId: seed.id,
    recommendationType: seed.recommendationType,
    currentStatus: seed.currentStatus,
    recommendedTarget: seed.recommendedTarget,
    welfareEffect: {
      incomeEffect: seed.incomeEffect,
      healthEffect: seed.healthEffect,
    },
    evidenceGrade,
    policyImpactScore,
    priorityScore,
    blockingFactors: seed.blockingFactors,
    rationale: seed.rationale,
  };

  return {
    policy,
    recommendation,
    bradfordHillScores: bhScores,
    causalConfidenceScore: ccs,
  };
}

// ---------------------------------------------------------------------------
// Website JSON type
// ---------------------------------------------------------------------------

interface WebsitePolicyData {
  jurisdiction: string;
  analysisDate: string;
  policies: {
    name: string;
    type: string;
    category: string;
    description: string;
    recommendationType: string;
    evidenceGrade: string;
    causalConfidenceScore: number;
    policyImpactScore: number;
    welfareScore: number;
    incomeEffect: number;
    healthEffect: number;
    bradfordHillScores: BradfordHillScores;
    rationale: string;
    currentStatus?: string;
    recommendedTarget?: string;
    blockingFactors: string[];
  }[];
  topRecommendations: string[];
  generatedAt: string;
}

export interface PolicyAnalysisArtifacts {
  result: PolicyRankingResult;
  websiteData: WebsitePolicyData;
  reportMarkdown: string;
  outputPaths: {
    markdown: string;
    json: string;
  };
}

export interface PolicyAnalysisOptions {
  outputDir?: string;
  writeFiles?: boolean;
  logSummary?: boolean;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const analysisDate = new Date().toISOString().slice(0, 10);

  // Analyze all policies
  const policyAnalyses = POLICIES.map(analyzeSinglePolicy);

  // Sort by priority score (descending)
  policyAnalyses.sort(
    (a, b) => b.recommendation.priorityScore - a.recommendation.priorityScore,
  );

  // Calculate overall welfare score
  const overallWelfareScore =
    policyAnalyses.reduce(
      (sum, pa) =>
        sum +
        (pa.recommendation.welfareEffect.incomeEffect +
          pa.recommendation.welfareEffect.healthEffect),
      0,
    ) / policyAnalyses.length;

  const result: PolicyRankingResult = {
    jurisdiction: US_JURISDICTION,
    analysisDate,
    policies: policyAnalyses,
    overallWelfareScore,
  };

  // Generate markdown report
  const report = generatePolicyReport(result);

  // Generate website JSON
  const websiteData: WebsitePolicyData = {
    jurisdiction: 'United States of America',
    analysisDate,
    policies: policyAnalyses.map(pa => ({
      name: pa.policy.name,
      type: pa.policy.type,
      category: pa.policy.categoryId ?? 'general',
      description: pa.policy.description ?? '',
      recommendationType: pa.recommendation.recommendationType,
      evidenceGrade: pa.recommendation.evidenceGrade,
      causalConfidenceScore: pa.causalConfidenceScore ?? 0,
      policyImpactScore: pa.recommendation.policyImpactScore,
      welfareScore:
        (pa.recommendation.welfareEffect.incomeEffect +
          pa.recommendation.welfareEffect.healthEffect) *
        100,
      incomeEffect: pa.recommendation.welfareEffect.incomeEffect,
      healthEffect: pa.recommendation.welfareEffect.healthEffect,
      bradfordHillScores: pa.bradfordHillScores!,
      rationale: pa.recommendation.rationale ?? '',
      currentStatus: pa.recommendation.currentStatus,
      recommendedTarget: pa.recommendation.recommendedTarget,
      blockingFactors: (pa.recommendation.blockingFactors ?? []) as string[],
    })),
    topRecommendations: policyAnalyses
      .filter(pa => pa.recommendation.recommendationType !== 'maintain')
      .slice(0, 10)
      .map(
        pa =>
          `${pa.recommendation.recommendationType === 'enact' ? 'Enact' : pa.recommendation.recommendationType === 'replace' ? 'Modify' : 'Repeal'}: ${pa.policy.name} (Grade ${pa.recommendation.evidenceGrade}, welfare +${((pa.recommendation.welfareEffect.incomeEffect + pa.recommendation.welfareEffect.healthEffect) * 100).toFixed(0)})`,
      ),
    generatedAt: new Date().toISOString(),
  };

  // Write outputs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const mdPath = path.join(OUTPUT_DIR, 'us-policy-report.md');
  fs.writeFileSync(mdPath, report, 'utf-8');
  console.log(`✅ Markdown report written to ${mdPath}`);

  const jsonPath = path.join(OUTPUT_DIR, 'us-policy-analysis.json');
  fs.writeFileSync(jsonPath, JSON.stringify(websiteData, null, 2), 'utf-8');
  console.log(`✅ JSON analysis written to ${jsonPath}`);

  // Print summary
  console.log('\n--- Policy Ranking Summary ---');
  console.log(`Policies analyzed: ${policyAnalyses.length}`);
  console.log(`Overall welfare score: ${overallWelfareScore.toFixed(2)}`);
  console.log('\nTop 5 policy recommendations:');
  websiteData.topRecommendations.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r}`);
  });
}

main();
