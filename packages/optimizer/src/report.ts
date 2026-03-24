/**
 * Markdown Report Generator
 *
 * Produces a human-readable markdown report from a FullAnalysisResult.
 *
 * @see https://dfda-spec.warondisease.org — dFDA Specification
 */

import type { FullAnalysisResult } from './pipeline.js';
import { groupToPracticalValue } from './change-from-baseline.js';
import { describeGrade, fmt, reportTimestamp } from './report-utils.js';

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
 * Describe causal direction by comparing absolute correlation magnitudes.
 *
 * Uses |forwardR| - |reverseR| to determine which direction is stronger,
 * avoiding the bug where negative correlations in both directions produce
 * a misleading raw delta (e.g., Coffee→Sleep: -0.246 forward, -0.114 reverse
 * has delta -0.132 but forward is actually stronger in magnitude).
 */
function describePredictiveDirection(forwardR: number, reverseR: number): string {
  const absDelta = Math.abs(forwardR) - Math.abs(reverseR);
  if (absDelta > 0.2) return 'strong forward causation — predictor drives outcome';
  if (absDelta > 0.05) return 'weak forward causation';
  if (absDelta < -0.2) return 'strong reverse causation — outcome drives predictor';
  if (absDelta < -0.05) return 'weak reverse causation — outcome may drive predictor';
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
 * - Optimal values (high/low outcome values, practical recommendation)
 * - Data quality (pairs, date range, evidence grade)
 *
 * @param result - Complete analysis result from runFullAnalysis
 * @returns Markdown-formatted report string
 */
export function generateMarkdownReport(result: FullAnalysisResult): string {
  const {
    predictorName,
    outcomeName,
    forwardPearson,
    reversePearson,
    predictivePearson,
    pValue,
    effectSize,
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

  const percentChange = baselineFollowup.outcomeFollowUpPercentChangeFromBaseline;
  const direction = percentChange >= 0 ? 'improvement' : 'worsening';
  const absPercentChange = Math.abs(percentChange);

  const practicalValue = groupToPracticalValue(optimalValues.optimalDailyValue);
  const pisScore = pis.score * 100; // Display on 0–100 scale
  const bhTotal = bradfordHillTotal(bradfordHill);

  const lines: string[] = [];

  // --- Title ---
  lines.push(`# Analysis: ${predictorName} → ${outcomeName}`);
  lines.push('');

  // --- Summary ---
  lines.push('## Summary');
  lines.push('');
  lines.push(
    `A daily average of **${fmt(practicalValue, 0)}${pUnit} ${predictorName}** is associated ` +
    `with a **${fmt(absPercentChange, 1)}% ${direction}** in ${outcomeName}.`,
  );
  lines.push('');

  // --- Key Findings ---
  lines.push('## Key Findings');
  lines.push('');
  lines.push(`- **Optimal Daily Value:** ${fmt(practicalValue, 0)}${pUnit} (practical recommendation)`);
  lines.push(
    `- **Outcome Change:** ${outcomeName} is ${fmt(absPercentChange, 1)}% ` +
    `${percentChange >= 0 ? 'higher' : 'lower'} on treatment days vs baseline`,
  );
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
    `- Causal Direction Score (forward − reverse): ${fmt(predictivePearson)} (${describePredictiveDirection(forwardPearson, reversePearson)})`,
  );
  lines.push(`- Bradford Hill Score: ${fmt(bhTotal, 1)}/9`);
  lines.push(`- p-value: ${pValue < 0.001 ? '< 0.001' : fmt(pValue, 4)}`);
  lines.push('');

  // --- Optimal Values ---
  lines.push('## Optimal Values');
  lines.push('');
  lines.push(
    `- High ${predictorName} days (avg ${fmt(optimalValues.averageDailyHighPredictor)}${pUnit}): ` +
    `${outcomeName} = ${fmt(optimalValues.averageOutcomeFollowingHighPredictor)}${oUnit}`,
  );
  lines.push(
    `- Low ${predictorName} days (avg ${fmt(optimalValues.averageDailyLowPredictor)}${pUnit}): ` +
    `${outcomeName} = ${fmt(optimalValues.averageOutcomeFollowingLowPredictor)}${oUnit}`,
  );
  lines.push(`- Practical recommendation: **Target: ${fmt(practicalValue, 0)}${pUnit} ${predictorName} daily**`);
  lines.push('');

  // --- Data Quality ---
  lines.push('## Data Quality');
  lines.push('');
  lines.push(`- Pairs analyzed: ${numberOfPairs}`);
  lines.push(`- Date range: ${dateRange.start} to ${dateRange.end}`);
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
