/**
 * Policy Evaluation — 3-Layer Evidence Framework
 *
 * Evaluates any policy using:
 * 1. Within-jurisdiction time series (e.g., US drug spending vs overdose deaths over time)
 * 2. Natural experiments (before/after an intervention in specific jurisdictions)
 * 3. Cross-jurisdiction panel data (OECD countries compared simultaneously)
 *
 * Each layer feeds through `runFullAnalysis()` from @optimitron/optimizer.
 * Results are aggregated via weighted meta-analysis into a final evidence grade.
 */

import { runFullAnalysis } from '@optimitron/optimizer';
import type { FullAnalysisResult, TimeSeries, AnalysisConfig } from '@optimitron/optimizer';

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/** Direction: is a higher outcome value better or worse? */
export type OutcomeDirection = 'higher' | 'lower';

/** A specific outcome metric a policy is expected to affect */
export interface OutcomeMetric {
  /** Human-readable name (e.g., "Drug Overdose Deaths") */
  name: string;
  /** Machine-readable ID */
  id: string;
  /** Unit of measurement */
  unit: string;
  /** Is higher better or lower better? */
  direction: OutcomeDirection;
}

/** Result from a single natural experiment (one jurisdiction, one policy) */
export interface NaturalExperimentResult {
  /** Jurisdiction that implemented the policy */
  jurisdiction: string;
  /** ISO country code */
  jurisdictionCode: string;
  /** Policy name */
  policy: string;
  /** Date the policy was implemented */
  interventionDate: string;
  /** Outcome metric being measured */
  outcomeMetric: OutcomeMetric;
  /** Number of data points before intervention */
  preDataPoints: number;
  /** Number of data points after intervention */
  postDataPoints: number;
  /** Year range of data */
  yearRange: string;
  /** Mean outcome value before intervention */
  preMean: number;
  /** Mean outcome value after intervention */
  postMean: number;
  /** Absolute change (post - pre) */
  absoluteChange: number;
  /** Percent change from pre to post */
  percentChange: number;
  /** Full analysis result from the optimizer pipeline */
  analysisResult: FullAnalysisResult;
}

/** Panel analysis result (cross-jurisdiction comparison) */
export interface PanelAnalysisResult {
  /** Number of jurisdictions compared */
  jurisdictionCount: number;
  /** Jurisdictions included */
  jurisdictions: string[];
  /** Spending category being analyzed */
  spendingCategory: string;
  /** Average correlation across jurisdictions */
  averageCorrelation: number;
  /** Overspend ratio for the reference jurisdiction (usually US) */
  referenceOverspendRatio?: number;
  /** Efficient frontier position */
  efficientFrontierRank?: number;
}

/** Complete evaluation of a single policy across all evidence layers */
export interface PolicyEvaluation {
  /** Policy name */
  policy: string;
  /** Policy description */
  description: string;
  /** Category (health, education, justice, etc.) */
  category: string;
  /** Expected outcome metrics */
  expectedOutcomes: OutcomeMetric[];

  /** Layer 1: Within-jurisdiction time series (typically US) */
  withinJurisdiction: {
    jurisdiction: string;
    analyses: Array<{
      outcomeMetric: OutcomeMetric;
      correlation: number;
      pValue: number;
      dataPoints: number;
      yearRange: string;
      bradfordHillAverage: number;
      predictorImpactScore: number;
      effectSizePercent: number;
      interpretation: 'counterproductive' | 'effective' | 'neutral';
    }>;
  } | null;

  /** Layer 2: Natural experiments (multi-jurisdiction before/after) */
  naturalExperiments: NaturalExperimentResult[];

  /** Layer 3: Cross-jurisdiction panel */
  crossJurisdiction: PanelAnalysisResult | null;

  /** Aggregated evidence */
  aggregate: {
    /** Weighted average effect size across all layers */
    weightedEffectSize: number;
    /** Number of independent evidence sources */
    evidenceSources: number;
    /** Number of jurisdictions with data */
    jurisdictionCount: number;
    /** Overall evidence grade (A-F) */
    evidenceGrade: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Human-readable verdict */
    verdict: string;
  };
}

// ---------------------------------------------------------------------------
// Natural Experiment Data Definition
// ---------------------------------------------------------------------------

/** Input definition for a natural experiment */
export interface NaturalExperimentDef {
  /** Policy name */
  policy: string;
  /** Jurisdiction that implemented it */
  jurisdiction: string;
  /** ISO country code */
  jurisdictionCode: string;
  /** Year the policy was implemented */
  interventionYear: number;
  /** Outcome metrics with year-by-year data */
  outcomes: Array<{
    metric: OutcomeMetric;
    /** Year-by-year data: { year, value } */
    data: Array<{ year: number; value: number }>;
  }>;
}

// ---------------------------------------------------------------------------
// Evidence Grading
// ---------------------------------------------------------------------------

/**
 * Derive evidence grade from aggregate metrics.
 *
 * A = Strong evidence (multiple jurisdictions, consistent direction, large effect)
 * B = Good evidence (some jurisdictions, mostly consistent)
 * C = Moderate evidence (limited data, mixed signals)
 * D = Weak evidence (single source, small effect)
 * F = Counter-evidence (policy appears harmful)
 */
export function deriveEvidenceGrade(
  effectSize: number,
  evidenceSources: number,
  jurisdictionCount: number,
  consistency: number, // 0-1: what fraction of analyses agree on direction
): { grade: string; confidence: number; verdict: string } {
  const absEffect = Math.abs(effectSize);

  // Counter-evidence: effect goes wrong way with high confidence
  if (effectSize < -0.3 && consistency > 0.7 && evidenceSources >= 2) {
    return {
      grade: 'F',
      confidence: Math.min(consistency, 0.95),
      verdict: 'Strong evidence that this policy is counterproductive',
    };
  }

  // Grade based on effect size, sources, and consistency
  if (absEffect > 0.5 && evidenceSources >= 3 && jurisdictionCount >= 3 && consistency > 0.8) {
    return { grade: 'A', confidence: 0.9, verdict: 'Strong evidence of effectiveness across multiple jurisdictions' };
  }
  if (absEffect > 0.3 && evidenceSources >= 2 && consistency > 0.7) {
    return { grade: 'B', confidence: 0.75, verdict: 'Good evidence of effectiveness' };
  }
  if (absEffect > 0.2 && evidenceSources >= 1) {
    return { grade: 'C', confidence: 0.5, verdict: 'Moderate evidence — more data needed' };
  }
  if (absEffect > 0.1) {
    return { grade: 'D', confidence: 0.3, verdict: 'Weak evidence — effect is small or inconsistent' };
  }

  return { grade: 'D', confidence: 0.2, verdict: 'Insufficient evidence to evaluate' };
}

// ---------------------------------------------------------------------------
// Meta-Analysis Aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregate effect sizes across multiple analyses using inverse-variance weighting.
 * 
 * Each analysis contributes proportionally to its data quality (more data points = more weight).
 * Direction is normalized: positive = policy works as intended, negative = counterproductive.
 */
export function aggregateEffectSizes(
  effects: Array<{
    effectSize: number;
    dataPoints: number;
    direction: OutcomeDirection;
    correlation: number;
  }>,
): { weightedEffect: number; consistency: number; totalWeight: number } {
  if (effects.length === 0) {
    return { weightedEffect: 0, consistency: 0, totalWeight: 0 };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let positiveCount = 0;

  for (const e of effects) {
    const weight = Math.sqrt(e.dataPoints); // sqrt(N) weighting
    // Normalize direction: for "lower is better" outcomes, flip the sign
    // A negative correlation with a "lower is better" outcome = policy works
    const normalizedEffect = e.direction === 'lower' ? -e.correlation : e.correlation;

    weightedSum += normalizedEffect * weight;
    totalWeight += weight;

    if (normalizedEffect > 0) positiveCount++;
  }

  const weightedEffect = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const consistency = effects.length > 0 ? positiveCount / effects.length : 0;

  return { weightedEffect, consistency, totalWeight };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function yearToMs(year: number): number {
  return new Date(`${year}-07-01T00:00:00Z`).getTime();
}

const DEFAULT_EXPERIMENT_CONFIG: AnalysisConfig = {
  onsetDelaySeconds: 0,
  durationOfActionSeconds: 365 * 24 * 3600,
  fillingType: 'none',
  subjectCount: 1,
  plausibilityScore: 0.7,
  coherenceScore: 0.6,
  analogyScore: 0.5,
  specificityScore: 0.4,
};

function interpretEffect(
  effectPercent: number,
  direction: OutcomeDirection,
): 'counterproductive' | 'effective' | 'neutral' {
  const normalized = direction === 'lower' ? -effectPercent : effectPercent;
  if (normalized > 5) return 'effective';
  if (normalized < -5) return 'counterproductive';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Adapter: NaturalExperimentData (from @optimitron/data) → NaturalExperimentDef
// ---------------------------------------------------------------------------

/**
 * Convert raw natural experiment data (string metric names) into a typed
 * NaturalExperimentDef (with OutcomeMetric objects).
 */
export function convertNaturalExperimentData(data: {
  policy: string;
  jurisdiction: string;
  jurisdictionCode: string;
  interventionYear: number;
  outcomes: Array<{
    metric: string;
    unit: string;
    direction: 'higher' | 'lower';
    data: Array<{ year: number; value: number }>;
  }>;
}): NaturalExperimentDef {
  return {
    policy: data.policy,
    jurisdiction: data.jurisdiction,
    jurisdictionCode: data.jurisdictionCode,
    interventionYear: data.interventionYear,
    outcomes: data.outcomes.map(o => ({
      metric: {
        name: o.metric,
        id: o.metric.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        unit: o.unit,
        direction: o.direction,
      },
      data: o.data,
    })),
  };
}

// ---------------------------------------------------------------------------
// Layer 3: Build Panel Analysis from external data (e.g., OBG results)
// ---------------------------------------------------------------------------

/**
 * Build a PanelAnalysisResult from plain data.
 *
 * This is a plain-data adapter: callers extract fields from OBG's
 * `runCountryAnalysis()` / `efficientFrontier()` results and pass them here.
 * OPG cannot import OBG directly (would create a circular dep).
 */
export function buildPanelAnalysis(input: {
  jurisdictionCount: number;
  jurisdictions: string[];
  spendingCategory: string;
  averageCorrelation: number;
  referenceOverspendRatio?: number;
  efficientFrontierRank?: number;
}): PanelAnalysisResult {
  return {
    jurisdictionCount: input.jurisdictionCount,
    jurisdictions: input.jurisdictions,
    spendingCategory: input.spendingCategory,
    averageCorrelation: input.averageCorrelation,
    referenceOverspendRatio: input.referenceOverspendRatio,
    efficientFrontierRank: input.efficientFrontierRank,
  };
}

// ---------------------------------------------------------------------------
// Layer 2: Run a Natural Experiment
// ---------------------------------------------------------------------------

/**
 * Run causal analysis on a single natural experiment (one jurisdiction, one policy).
 *
 * For each outcome metric:
 * 1. Split data into pre/post at interventionYear
 * 2. Build TimeSeries for time index and outcome values
 * 3. Run runFullAnalysis() (time → outcome)
 * 4. Compute pre/post means and change
 *
 * Returns one NaturalExperimentResult per outcome metric.
 * Outcomes with < 3 data points are skipped.
 */
export function runNaturalExperiment(
  experiment: NaturalExperimentDef,
  config?: Partial<AnalysisConfig>,
): NaturalExperimentResult[] {
  const mergedConfig: AnalysisConfig = { ...DEFAULT_EXPERIMENT_CONFIG, ...config };
  const results: NaturalExperimentResult[] = [];

  for (const outcome of experiment.outcomes) {
    const sortedData = [...outcome.data].sort((a, b) => a.year - b.year);

    if (sortedData.length < 3) continue;

    const preData = sortedData.filter(d => d.year < experiment.interventionYear);
    const postData = sortedData.filter(d => d.year >= experiment.interventionYear);

    const preMean = preData.length > 0
      ? preData.reduce((s, d) => s + d.value, 0) / preData.length
      : sortedData[0]!.value;
    const postMean = postData.length > 0
      ? postData.reduce((s, d) => s + d.value, 0) / postData.length
      : sortedData[sortedData.length - 1]!.value;

    const absoluteChange = postMean - preMean;
    const percentChange = preMean !== 0 ? (absoluteChange / preMean) * 100 : 0;

    const timeSeries: TimeSeries = {
      variableId: 'time-index',
      name: 'Year',
      measurements: sortedData.map(d => ({
        timestamp: yearToMs(d.year),
        value: d.year,
      })),
    };

    const outcomeSeries: TimeSeries = {
      variableId: `${experiment.jurisdictionCode}-${outcome.metric.id}`,
      name: `${outcome.metric.name} (${experiment.jurisdiction})`,
      measurements: sortedData.map(d => ({
        timestamp: yearToMs(d.year),
        value: d.value,
      })),
    };

    try {
      const analysis = runFullAnalysis(timeSeries, outcomeSeries, mergedConfig);

      results.push({
        jurisdiction: experiment.jurisdiction,
        jurisdictionCode: experiment.jurisdictionCode,
        policy: experiment.policy,
        interventionDate: `${experiment.interventionYear}-01-01`,
        outcomeMetric: outcome.metric,
        preDataPoints: preData.length,
        postDataPoints: postData.length,
        yearRange: `${sortedData[0]!.year}-${sortedData[sortedData.length - 1]!.year}`,
        preMean,
        postMean,
        absoluteChange,
        percentChange,
        analysisResult: analysis,
      });
    } catch {
      // Skip outcomes where analysis fails (e.g., zero variance)
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Full Policy Evaluation (assembles all 3 layers)
// ---------------------------------------------------------------------------

/**
 * Build a complete PolicyEvaluation by assembling evidence from up to 3 layers:
 *
 * - Layer 1: Within-jurisdiction time series (pre-computed, passed in)
 * - Layer 2: Natural experiments (run here via runNaturalExperiment)
 * - Layer 3: Cross-jurisdiction panel (pre-computed, passed in)
 *
 * Aggregates effect sizes across all layers and assigns an evidence grade.
 */
export function evaluatePolicy(options: {
  policy: string;
  description: string;
  category: string;
  expectedOutcomes: OutcomeMetric[];
  withinJurisdiction?: {
    jurisdiction: string;
    analyses: Array<{ outcomeMetric: OutcomeMetric; result: FullAnalysisResult }>;
  } | null;
  naturalExperiments?: NaturalExperimentDef[];
  crossJurisdiction?: PanelAnalysisResult | null;
  analysisConfig?: Partial<AnalysisConfig>;
}): PolicyEvaluation {
  // Layer 2: run natural experiments
  const naturalExperimentResults: NaturalExperimentResult[] = [];
  for (const exp of options.naturalExperiments ?? []) {
    naturalExperimentResults.push(...runNaturalExperiment(exp, options.analysisConfig));
  }

  // Layer 1: map pre-computed analyses into the PolicyEvaluation shape
  let withinJurisdiction: PolicyEvaluation['withinJurisdiction'] = null;
  if (options.withinJurisdiction) {
    const { jurisdiction, analyses } = options.withinJurisdiction;
    withinJurisdiction = {
      jurisdiction,
      analyses: analyses.map(a => {
        const bhValues = Object.values(a.result.bradfordHill) as number[];
        const bhAvg = bhValues.reduce((sum, v) => sum + v, 0) / bhValues.length;
        return {
          outcomeMetric: a.outcomeMetric,
          correlation: a.result.forwardPearson,
          pValue: a.result.pValue,
          dataPoints: a.result.numberOfPairs,
          yearRange: `${a.result.dateRange.start}-${a.result.dateRange.end}`,
          bradfordHillAverage: bhAvg,
          predictorImpactScore: a.result.pis.score,
          effectSizePercent: a.result.effectSize.percentChange,
          interpretation: interpretEffect(a.result.effectSize.percentChange, a.outcomeMetric.direction),
        };
      }),
    };
  }

  // Collect all effects for meta-analysis aggregation
  const allEffects: Array<{
    effectSize: number;
    dataPoints: number;
    direction: OutcomeDirection;
    correlation: number;
  }> = [];

  // Layer 1 effects
  if (withinJurisdiction) {
    for (const a of withinJurisdiction.analyses) {
      allEffects.push({
        effectSize: a.effectSizePercent / 100,
        dataPoints: a.dataPoints,
        direction: a.outcomeMetric.direction,
        correlation: a.correlation,
      });
    }
  }

  // Layer 2 effects
  for (const nr of naturalExperimentResults) {
    allEffects.push({
      effectSize: nr.percentChange / 100,
      dataPoints: nr.preDataPoints + nr.postDataPoints,
      direction: nr.outcomeMetric.direction,
      correlation: nr.analysisResult.forwardPearson,
    });
  }

  // Layer 3 effects
  if (options.crossJurisdiction) {
    allEffects.push({
      effectSize: options.crossJurisdiction.averageCorrelation,
      dataPoints: options.crossJurisdiction.jurisdictionCount,
      direction: options.expectedOutcomes[0]?.direction ?? 'lower',
      correlation: options.crossJurisdiction.averageCorrelation,
    });
  }

  // Aggregate across all layers
  const { weightedEffect, consistency } = aggregateEffectSizes(allEffects);

  // Count unique jurisdictions
  const jurisdictions = new Set<string>();
  if (withinJurisdiction) jurisdictions.add(withinJurisdiction.jurisdiction);
  for (const nr of naturalExperimentResults) jurisdictions.add(nr.jurisdiction);
  if (options.crossJurisdiction) {
    for (const j of options.crossJurisdiction.jurisdictions) jurisdictions.add(j);
  }

  const { grade, confidence, verdict } = deriveEvidenceGrade(
    weightedEffect,
    allEffects.length,
    jurisdictions.size,
    consistency,
  );

  return {
    policy: options.policy,
    description: options.description,
    category: options.category,
    expectedOutcomes: options.expectedOutcomes,
    withinJurisdiction,
    naturalExperiments: naturalExperimentResults,
    crossJurisdiction: options.crossJurisdiction ?? null,
    aggregate: {
      weightedEffectSize: weightedEffect,
      evidenceSources: allEffects.length,
      jurisdictionCount: jurisdictions.size,
      evidenceGrade: grade,
      confidence,
      verdict,
    },
  };
}
