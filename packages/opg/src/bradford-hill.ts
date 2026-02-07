/**
 * Bradford Hill Criteria Scoring Functions
 * 
 * Operationalizes Bradford Hill's 9 criteria for causality assessment
 * into quantitative scoring functions that produce scores in [0, 1].
 * 
 * @see https://opg.warondisease.org/#sec-bradford-hill
 * 
 * legacy API implements these criteria implicitly across multiple files:
 * - Strength: |correlation coefficient| — https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationForwardPearsonCorrelationCoefficientProperty.php
 * - Consistency: number_of_users in AggregateCorrelation — https://github.com/mikepsinn/curedao-api/blob/main/app/Models/AggregateCorrelation.php
 * - Temporality: forward vs reverse Pearson — https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationPredictivePearsonCorrelationCoefficientProperty.php
 * - Gradient: optimal value spread (value_predicting_high vs low) — https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationValuePredictingHighOutcomeProperty.php
 * - Experiment: statistical significance composite — https://github.com/mikepsinn/curedao-api/blob/main/app/Properties/Correlation/CorrelationStatisticalSignificanceProperty.php
 * 
 * This OPG module explicitly names and weights the criteria for policy evaluation.
 * The optimizer package (@optomitron/optimizer) also has Bradford Hill scoring for health data.
 */

export interface BradfordHillScores {
  strength: number;
  consistency: number;
  temporality: number;
  gradient: number;
  experiment: number;
  plausibility: number;
  coherence: number;
  analogy: number;
  specificity: number;
}

export type CausalConfidenceScore = number;

export interface EffectEstimate {
  beta: number;           // Effect size
  standardError: number;  // Standard error
  method: AnalysisMethod;
  jurisdictionCount: number;
  doseResponseCorrelation?: number;
  supportingStudies: number;
  outcomeCount: number;
  validityViolations: number; // 0-1, proportion of validity checks failed
}

export type AnalysisMethod = 
  | 'rct'
  | 'regression_discontinuity'
  | 'synthetic_control'
  | 'difference_in_differences'
  | 'event_study'
  | 'interrupted_time_series'
  | 'before_after'
  | 'cross_sectional';

/** Method quality weights */
export const METHOD_WEIGHTS: Record<AnalysisMethod, number> = {
  rct: 1.00,
  regression_discontinuity: 0.90,
  synthetic_control: 0.85,
  difference_in_differences: 0.80,
  event_study: 0.75,
  interrupted_time_series: 0.65,
  before_after: 0.40,
  cross_sectional: 0.25,
};

/** Default criterion weights for CCS calculation */
export const CRITERION_WEIGHTS = {
  experiment: 0.225,
  consistency: 0.19,
  strength: 0.15,
  gradient: 0.125,
  coherence: 0.10,
  plausibility: 0.09,
  specificity: 0.06,
  analogy: 0.06,
} as const;

/**
 * Strength of Association
 * Larger effect estimates provide stronger evidence.
 * Uses exponential saturation: S = 1 - e^(-|β_std| / β_sig)
 */
export function scoreStrength(
  standardizedEffect: number,
  saturationParam: number = 0.3
): number {
  return 1 - Math.exp(-Math.abs(standardizedEffect) / saturationParam);
}

/**
 * Consistency Across Jurisdictions
 * Replication across contexts provides stronger evidence.
 * S = 1 - e^(-N_j / N_sig)
 */
export function scoreConsistency(
  concordantJurisdictions: number,
  saturationParam: number = 10
): number {
  return 1 - Math.exp(-concordantJurisdictions / saturationParam);
}

/**
 * Temporality (Required)
 * Policy adoption must precede outcome change.
 * Binary: either satisfied (1.0) or not (0.0).
 */
export function scoreTemporality(
  policyPrecedesOutcome: boolean
): number {
  return policyPrecedesOutcome ? 1.0 : 0.0;
}

/**
 * Dose-Response Gradient
 * For continuous policies, correlation between intensity and outcome magnitude.
 * S = r² / (r² + r_sig²)
 */
export function scoreGradient(
  doseResponseCorrelation: number | undefined,
  saturationParam: number = 0.5
): number | null {
  if (doseResponseCorrelation === undefined) {
    return null; // N/A for binary policies
  }
  const r2 = doseResponseCorrelation ** 2;
  const sig2 = saturationParam ** 2;
  return r2 / (r2 + sig2);
}

/**
 * Experiment Quality
 * Quality of quasi-experimental design.
 * S = w_method × (1 - v_violations)
 */
export function scoreExperiment(
  method: AnalysisMethod,
  validityViolations: number = 0
): number {
  const methodWeight = METHOD_WEIGHTS[method];
  return methodWeight * (1 - validityViolations);
}

/**
 * Plausibility (Mechanistic)
 * Economic or behavioral mechanism linking policy to outcome.
 * Scored by mechanism checklist.
 */
export function scorePlausibility(
  mechanismScores: {
    theoryPredicts: boolean;
    behavioralResponse: boolean;
    noImplausibleAssumptions: boolean;
    timingConsistent: boolean;
    magnitudePlausible: boolean;
  }
): number {
  const weights = {
    theoryPredicts: 0.30,
    behavioralResponse: 0.25,
    noImplausibleAssumptions: 0.20,
    timingConsistent: 0.15,
    magnitudePlausible: 0.10,
  };
  
  let score = 0;
  if (mechanismScores.theoryPredicts) score += weights.theoryPredicts;
  if (mechanismScores.behavioralResponse) score += weights.behavioralResponse;
  if (mechanismScores.noImplausibleAssumptions) score += weights.noImplausibleAssumptions;
  if (mechanismScores.timingConsistent) score += weights.timingConsistent;
  if (mechanismScores.magnitudePlausible) score += weights.magnitudePlausible;
  
  return score;
}

/**
 * Coherence with Literature
 * S = 1 - e^(-N_studies / N_sig)
 */
export function scoreCoherence(
  supportingStudies: number,
  saturationParam: number = 5
): number {
  return 1 - Math.exp(-supportingStudies / saturationParam);
}

/**
 * Specificity
 * Whether policy affects specific outcomes rather than everything.
 * S = 1 / (1 + log(1 + N_outcomes))
 */
export function scoreSpecificity(outcomeCount: number): number {
  return 1 / (1 + Math.log(1 + outcomeCount));
}

/**
 * Calculate Causal Confidence Score (CCS)
 * Combines all Bradford Hill criteria with weights.
 * Temporality acts as a binary gate.
 */
export function calculateCCS(
  scores: BradfordHillScores,
  weights: typeof CRITERION_WEIGHTS = CRITERION_WEIGHTS
): CausalConfidenceScore {
  // Temporality is a gate - if violated, CCS is 0
  if (scores.temporality === 0) {
    return 0;
  }
  
  // Calculate weighted sum of other criteria
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Handle gradient separately (may be null for binary policies)
  const criteriaToSum = [
    { key: 'experiment', score: scores.experiment },
    { key: 'consistency', score: scores.consistency },
    { key: 'strength', score: scores.strength },
    { key: 'coherence', score: scores.coherence },
    { key: 'plausibility', score: scores.plausibility },
    { key: 'specificity', score: scores.specificity },
    { key: 'analogy', score: scores.analogy },
  ] as const;
  
  for (const { key, score } of criteriaToSum) {
    weightedSum += weights[key] * score;
    totalWeight += weights[key];
  }
  
  // Add gradient if available (renormalize weights if excluded)
  if (scores.gradient !== null && scores.gradient !== undefined) {
    weightedSum += weights.gradient * scores.gradient;
    totalWeight += weights.gradient;
  }
  
  return weightedSum / totalWeight;
}
