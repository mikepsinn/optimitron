/**
 * Markdown Report Generator
 *
 * Produces a human-readable markdown report from a FullAnalysisResult.
 *
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 */

import type { FullAnalysisResult } from './pipeline.js';
import { describeGrade, fmt, reportTimestamp } from './report-utils.js';

/** Presentation metadata that cannot be inferred from a measurement's unit. */
export interface MarkdownReportOptions {
  /** Cadence of the input observations, not the onset delay or effect window. */
  observationPeriod?: 'day' | 'week' | 'month' | 'year';
  /** Omit when the desirability of a larger outcome is unknown. */
  outcomeDirection?: 'higher' | 'lower';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Describe the strength of a correlation coefficient.
 */
function describeCorrelation(r: number): string {
  const absR = Math.abs(r);
  const direction = r >= 0 ? 'positive' : 'negative';
  if (absR >= 0.7) return `strong ${direction}`;
  if (absR >= 0.4) return `moderate ${direction}`;
  if (absR >= 0.2) return `weak ${direction}`;
  if (absR >= 0.1) return `very weak ${direction}`;
  return 'negligible';
}

// describeGrade and fmt are imported from ./report-utils.js

/**
 * Describe predictive direction by comparing absolute correlation magnitudes.
 *
 * Uses |forwardR| - |reverseR| to determine which direction is stronger,
 * avoiding the bug where negative correlations in both directions produce
 * a misleading raw delta (e.g., Coffee→Sleep: -0.246 forward, -0.114 reverse
 * has delta -0.132 but forward is actually stronger in magnitude).
 */
function describePredictiveDirection(forwardR: number, reverseR: number): string {
  const absDelta = Math.abs(forwardR) - Math.abs(reverseR);
  if (absDelta > 0.2) return 'substantially stronger forward predictive association';
  if (absDelta > 0.05) return 'slightly stronger forward predictive association';
  if (absDelta < -0.2) return 'substantially stronger reverse predictive association';
  if (absDelta < -0.05) return 'slightly stronger reverse predictive association';
  return 'no clear directionality';
}

/**
 * Compute Bradford Hill composite score (sum of all 9 criteria).
 */
function bradfordHillTotal(bh: FullAnalysisResult['bradfordHill']): number {
  return (
    bh.strength +
    bh.consistency +
    bh.temporality +
    (bh.gradient ?? 0) +
    bh.experiment +
    bh.plausibility +
    bh.coherence +
    bh.analogy +
    bh.specificity
  );
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable markdown report from a FullAnalysisResult.
 *
 * The report includes:
 * - Summary with key finding
 * - Key findings (optimal value, outcome change, correlation, evidence grade, PIS)
 * - Causality assessment (forward, reverse, predictive Pearson, Bradford Hill)
 * - Candidate values associated with high/low outcomes
 * - Data quality (pairs, date range, evidence grade)
 *
 * @param result - Complete analysis result from runFullAnalysis
 * @param options - Observation cadence and desired outcome direction, when known
 * @returns Markdown-formatted report string
 */
export function generateMarkdownReport(
  result: FullAnalysisResult,
  options: MarkdownReportOptions = {},
): string {
  const {
    predictorName,
    outcomeName,
    forwardPearson,
    reversePearson,
    predictivePearson,
    pValue,
    baselineFollowup,
    optimalValues,
    bradfordHill,
    pis,
    dataQuality,
    dateRange,
    numberOfPairs,
    predictorUnit,
    outcomeUnit,
  } = result;

  const pUnit = predictorUnit ? ` ${predictorUnit}` : '';
  const oUnit = outcomeUnit ? ` ${outcomeUnit}` : '';
  const periods = options.observationPeriod ? `${options.observationPeriod}s` : 'observations';

  const percentChange = baselineFollowup.outcomeFollowUpPercentChangeFromBaseline;
  const absoluteChange = baselineFollowup.outcomeFollowUpAverage - baselineFollowup.outcomeBaselineAverage;
  const direction = absoluteChange > 0 ? 'higher' : absoluteChange < 0 ? 'lower' : 'unchanged';
  // The analysis's legacy percent field contains an absolute difference when
  // baseline is zero. Preserve that result without mislabelling it as a percent.
  const change = absoluteChange === 0
    ? 'unchanged'
    : baselineFollowup.outcomeBaselineAverage === 0
      ? `${fmt(Math.abs(absoluteChange))}${oUnit} ${direction}`
      : `${fmt(Math.abs(percentChange), 1)}% ${direction}`;
  const interpretation = options.outcomeDirection && absoluteChange !== 0
    ? ` (${direction === options.outcomeDirection ? 'improvement' : 'worsening'} in the specified outcome direction)`
    : '';

  // These are existing outcome-split means, not a fitted global optimum. Do not
  // recommend maximizing an adverse outcome via the legacy optimalDailyValue.
  const selectedDirection = options.outcomeDirection ?? 'higher';
  const candidateValue = selectedDirection === 'lower'
    ? optimalValues.valuePredictingLowOutcome
    : optimalValues.valuePredictingHighOutcome;
  const pisScore = pis.score * 100; // Display on 0–100 scale
  const bhTotal = bradfordHillTotal(bradfordHill);

  const lines: string[] = [];

  // --- Title ---
  lines.push(`# Analysis: ${predictorName} → ${outcomeName}`);
  lines.push('');

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  if (!dataQuality.isValid) {
    lines.push('**Exploratory result: data quality checks failed. These estimates do not support a target recommendation.**');
    lines.push('');
  }
  lines.push(
    `${outcomeName} was **${change}** following high-${predictorName} ${periods} ` +
    `compared with low-${predictorName} baseline ${periods}${interpretation}.`,
  );
  lines.push('This is an observed group difference, not an estimated effect of setting the predictor to a particular value.');
  lines.push('');

  // --- Key Findings ---
  lines.push('## Key Findings');
  lines.push('');
  lines.push(`- **Candidate predictor value associated with ${selectedDirection} outcomes:** ${fmt(candidateValue)}${pUnit}`);
  lines.push(
    `- **Observed Outcome Change:** ${outcomeName} is ${change} following high-predictor ${periods} vs low-predictor baseline ${periods}`,
  );
  if (baselineFollowup.outcomeBaselineAverage === 0) {
    lines.push('- Percentage change is undefined because the baseline outcome is zero; the absolute difference is shown.');
  }
  lines.push(
    `- **Correlation:** r = ${fmt(forwardPearson)} (${describeCorrelation(forwardPearson)})`,
  );
  lines.push(
    `- **Evidence Grade:** ${pis.evidenceGrade} (${describeGrade(pis.evidenceGrade)})`,
  );
  lines.push(`- **Predictor Impact Score:** ${fmt(pisScore, 1)}/100`);
  lines.push('');

  // --- Causality Assessment ---
  lines.push('## Causality Assessment');
  lines.push('');
  lines.push(`- Forward Pearson (predictor → outcome): ${fmt(forwardPearson)}`);
  lines.push(`- Reverse Pearson (outcome → predictor): ${fmt(reversePearson)}`);
  lines.push(
    `- Predictive Direction Score (forward − reverse): ${fmt(predictivePearson)} (${describePredictiveDirection(forwardPearson, reversePearson)})`,
  );
  lines.push('- Relative predictive direction compares correlation magnitudes; it does not establish causation.');
  lines.push(`- Bradford Hill Score: ${fmt(bhTotal, 1)}/9`);
  lines.push(`- p-value: ${pValue < 0.001 ? '< 0.001' : fmt(pValue, 4)}`);
  lines.push('');

  // --- Optimal Values ---
  lines.push('## Optimal Values');
  lines.push('');
  lines.push(
    `- High ${predictorName} ${periods} (avg ${fmt(optimalValues.averageDailyHighPredictor)}${pUnit}): ` +
    `${outcomeName} = ${fmt(optimalValues.averageOutcomeFollowingHighPredictor)}${oUnit}`,
  );
  lines.push(
    `- Low ${predictorName} ${periods} (avg ${fmt(optimalValues.averageDailyLowPredictor)}${pUnit}): ` +
    `${outcomeName} = ${fmt(optimalValues.averageOutcomeFollowingLowPredictor)}${oUnit}`,
  );
  lines.push('');
  lines.push('Separately, grouping observations by outcome rather than predictor:');
  lines.push(`- Mean predictor preceding above-mean outcomes: ${fmt(optimalValues.valuePredictingHighOutcome)}${pUnit}`);
  lines.push(`- Mean predictor preceding at-or-below-mean outcomes: ${fmt(optimalValues.valuePredictingLowOutcome)}${pUnit}`);
  lines.push('These within-sample candidate values are associations, not established optima or predicted benefits from changing the predictor.');
  if (!dataQuality.isValid) {
    lines.push('A target recommendation is withheld because the data quality checks failed.');
  }
  lines.push('');

  // --- Data Quality ---
  lines.push('## Data Quality');
  lines.push('');
  lines.push(`- Pairs analyzed: ${numberOfPairs}`);
  lines.push(`- Date range: ${dateRange.start} to ${dateRange.end}`);
  lines.push(`- Observation period: ${options.observationPeriod ?? 'unspecified (reported as observations)'}`);
  lines.push(`- Evidence grade: ${pis.evidenceGrade}`);
  lines.push(`- Data quality: ${dataQuality.isValid ? 'PASS' : 'FAIL'}`);

  if (!dataQuality.isValid && dataQuality.failureReasons.length > 0) {
    for (const reason of dataQuality.failureReasons) {
      lines.push(`  - ⚠️ ${reason}`);
    }
  }

  lines.push('');

  // --- Metadata ---
  lines.push('---');
  lines.push('');
  lines.push(
    `*Generated by \`@optimitron/optimizer\` on ${reportTimestamp()} · ` +
    `onset delay: ${result.onsetDelay}s, duration: ${result.durationOfAction}s, ` +
    `pairs: ${numberOfPairs}*`,
  );

  return lines.join('\n');
}
