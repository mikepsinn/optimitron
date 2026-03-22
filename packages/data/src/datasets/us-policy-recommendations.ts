/**
 * Evidence-Based Structural Policy Reforms
 *
 * These are policy changes backed by RCTs, natural experiments, or strong
 * cross-country evidence. They are NOT efficiency-derived spending targets
 * (those come automatically from the OBG "cheapest high performer" analysis).
 *
 * Selection criteria:
 * - Must have RCT, natural experiment, or cross-country evidence
 * - Must clearly increase real after-tax median income OR median HALE
 * - No argument-from-popularity ("every country has it")
 * - Effect sizes must be defensible and conservative
 *
 * These are tagged by category so they can be linked to the appropriate
 * budget analysis. They apply to any jurisdiction that has the "current
 * status" problem described.
 */

export interface PolicyRecommendation {
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
  /** Effect on real after-tax median income as fraction (0.05 = +5%) */
  incomeEffect: number;
  /** Effect on median healthy life years as fraction (0.10 = +10%) */
  healthEffect: number;
  rationale: string;
  currentStatus: string;
  recommendedTarget: string;
  blockingFactors: string[];
  /** Jurisdiction codes where this reform applies (empty = universal) */
  applicableJurisdictions?: string[];
}

// NOTE: Efficiency-derived policies ("reduce spending to cheapest high performer")
// are NOT listed here. Those are generated automatically by the OBG efficiency
// analysis for each jurisdiction. This list contains only STRUCTURAL reforms.

export const STRUCTURAL_POLICY_REFORMS: PolicyRecommendation[] = [
  {
    name: 'Universal Pre-K (Ages 3-4)',
    type: 'budget_allocation', category: 'education',
    description: 'Federally funded universal pre-K. Perry Preschool RCT shows $7-12 ROI per dollar over 40 years.',
    effectSize: 0.8, studyCount: 25, hasPredecessor: true, doseResponseExists: true,
    hasRCT: true, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 5,
    incomeEffect: 0.15, healthEffect: 0.10,
    rationale: 'Perry Preschool RCT: 40-year follow-up shows $7-12 ROI per dollar. Participants had 15% higher income, 20% less likely to be arrested, healthier outcomes. France, Denmark, Finland all have universal pre-K with better PISA scores.',
    currentStatus: 'Only 34% of US 3-year-olds enrolled; varies wildly by state',
    recommendedTarget: 'Federal funding for universal enrollment by age 3',
    blockingFactors: ['budget_constraint'],
  },
  {
    name: 'Shift Drug Policy from Criminal to Health Approach',
    type: 'regulation', category: 'health',
    description: 'Decriminalize personal drug use, redirect enforcement budget to treatment. Based on Portugal (2001).',
    effectSize: 1.2, studyCount: 15, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.05, healthEffect: 0.35,
    rationale: 'Portugal decriminalized in 2001: drug deaths dropped 80%, HIV among users dropped 90%, treatment uptake tripled. US spends $40B/yr on drug enforcement with zero measurable reduction in drug deaths (r=0.026). Czech Republic, Switzerland, Netherlands show similar results.',
    currentStatus: 'US spends $40B/yr on enforcement; 1.5M arrests/yr; overdose deaths at record highs',
    recommendedTarget: 'Decriminalize personal use, redirect enforcement budget to treatment',
    blockingFactors: ['political_opposition'],
  },
  {
    name: 'Pragmatic Clinical Trial Funding Reform',
    type: 'regulation', category: 'health_research',
    description: 'Redirect research funding to pragmatic real-world trials. UK NIHR produces actionable evidence at 1/10th the cost.',
    effectSize: 0.9, studyCount: 8, hasPredecessor: true, doseResponseExists: true,
    hasRCT: true, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.05, healthEffect: 0.30,
    rationale: 'NIH spends $48B/yr but 70%+ goes to indirect costs. 85% of findings fail to replicate. UK NIHR model: pragmatic trials embedded in NHS produce actionable evidence at 1/10th the cost. PCORI pragmatic trials show 3x faster clinical adoption.',
    currentStatus: 'NIH: $48B/yr, <10% on pragmatic trials, 85% of findings fail to replicate',
    recommendedTarget: 'Mandate 30%+ of research budget for pragmatic trials with open data requirements',
    blockingFactors: ['institutional_resistance', 'industry_resistance'],
  },
  {
    name: 'Housing Supply Deregulation',
    type: 'regulation', category: 'housing',
    description: 'Remove restrictive zoning that constrains housing supply. Tokyo, Minneapolis, Oregon show reduced housing cost growth.',
    effectSize: 0.7, studyCount: 15, hasPredecessor: true, doseResponseExists: true,
    hasRCT: false, mechanismKnown: true, consistentWithTheory: true, analogyExists: true, outcomeCount: 3,
    incomeEffect: 0.05, healthEffect: 0.03,
    rationale: 'Tokyo has no housing crisis because they allow building. Minneapolis eliminated single-family zoning: rents stabilized. Oregon statewide upzoning reduced housing cost growth. Hsieh & Moretti (2019) estimate $1.6T/yr GDP cost from restrictive zoning.',
    currentStatus: '75% of US residential land zoned single-family only',
    recommendedTarget: 'Condition federal grants on local zoning reform',
    blockingFactors: ['political_opposition'],
  },
];
