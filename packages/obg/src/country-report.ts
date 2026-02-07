/**
 * Markdown Report Generator for N-of-1 Country Analysis
 * 
 * Produces a human-readable report from aggregated N-of-1 causal analysis
 * across multiple jurisdictions.
 * 
 * @see https://obg.warondisease.org — Optimal Budget Generator
 */

import type { CountryAnalysisResult, JurisdictionResult } from './country-analysis.js';
import { formatUsd } from './report.js';

// ─── Helpers ─────────────────────────────────────────────────────────

function fmt(value: number, decimals: number = 3): string {
  if (!isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

function describeStrength(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'negligible';
}

// ─── Main Report Generator ──────────────────────────────────────────

/**
 * Generate a comprehensive markdown report from N-of-1 country analysis.
 * 
 * @param result - Complete analysis result from runCountryAnalysis()
 * @param options - Optional formatting overrides
 * @returns Markdown string
 */
export function generateCountryAnalysisReport(
  result: CountryAnalysisResult,
  options?: {
    /** ISO3 code of a jurisdiction to highlight (e.g., 'USA') */
    highlightJurisdiction?: string;
    /** Include individual jurisdiction reports inline */
    includeIndividualReports?: boolean;
  },
): string {
  const { aggregate: agg, jurisdictions, config } = result;
  const lines: string[] = [];

  // ─── Title ───────────────────────────────────────────────────────
  lines.push(`# ${result.predictorName} → ${result.outcomeName}: Multi-Jurisdiction Causal Analysis`);
  lines.push('');
  lines.push(`> Generated ${new Date(result.analyzedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })} by @optomitron/obg + @optomitron/optimizer`);
  lines.push('');

  // ─── Methodology ─────────────────────────────────────────────────
  lines.push('## Methodology');
  lines.push('');
  lines.push('This analysis treats **each jurisdiction as an N-of-1 longitudinal study**:');
  lines.push('');
  lines.push(`1. **Within-jurisdiction time series**: For each jurisdiction, we analyze annual ${result.predictorName.toLowerCase()} and ${result.outcomeName.toLowerCase()} over time`);
  lines.push(`2. **Temporal alignment**: Measurements aligned with **${config.onsetDelayDays}-day onset delay** and **${config.durationOfActionDays}-day duration of action**`);
  lines.push('3. **Change from baseline**: For each jurisdiction, we compare outcome when predictor is above vs below its own mean — controlling for time-invariant confounders');
  lines.push('4. **Causal scoring**: Bradford Hill criteria + Predictor Impact Score per jurisdiction');
  lines.push('5. **Aggregation**: Results aggregated across jurisdictions (meta-analysis of single-subject studies)');
  lines.push('');
  lines.push('**Why N-of-1 is better than cross-sectional:**');
  lines.push('- Controls for time-invariant confounders (culture, genetics, geography)');
  lines.push('- Measures the *effect of changes* within each jurisdiction, not between them');
  lines.push('- Onset delay captures lag between predictor change and outcome response');
  lines.push('- Duration of action models how long effects persist');
  lines.push('- Each jurisdiction is its own control group');
  lines.push('');

  // ─── Executive Summary ───────────────────────────────────────────
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`Analysis of **${agg.n} jurisdictions** as individual longitudinal studies.`);
  if (agg.skipped > 0) {
    lines.push(`(${agg.skipped} jurisdictions skipped due to insufficient data.)`);
  }
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Jurisdictions analyzed | ${agg.n} |`);
  lines.push(`| **Mean outcome change from baseline** | **${fmt(agg.meanPercentChange, 2)}%** |`);
  lines.push(`| **Mean effect size (z-score)** | **${fmt(agg.meanEffectSize)}** |`);
  lines.push(`| Mean optimal predictor value | ${formatUsd(agg.meanOptimalValue)} |`);
  lines.push(`| Jurisdictions with positive effect | ${agg.positiveCount}/${agg.n} (${((agg.positiveCount / agg.n) * 100).toFixed(0)}%) |`);
  lines.push(`| Jurisdictions with negative effect | ${agg.negativeCount}/${agg.n} |`);
  lines.push(`| Mean within-jurisdiction correlation | r = ${fmt(agg.meanForwardPearson)} |`);
  lines.push(`| Onset delay | ${config.onsetDelayDays} days |`);
  lines.push(`| Duration of action | ${config.durationOfActionDays} days |`);
  lines.push('');
  lines.push('*Change from baseline measures how much the outcome changes when the predictor is above vs below its own mean within each jurisdiction. This is more robust than Pearson correlation: no normality assumption, works for binary policy changes, and the z-score normalizes across different scales.*');
  lines.push('');

  // ─── Bradford Hill ───────────────────────────────────────────────
  lines.push('## Aggregated Bradford Hill Criteria');
  lines.push('');
  lines.push('Average scores across all jurisdiction analyses (each 0-1):');
  lines.push('');
  const bh = agg.meanBradfordHill;
  lines.push('| Criterion | Score | Interpretation |');
  lines.push('|-----------|-------|---------------|');
  lines.push(`| Strength | ${fmt(bh.strength)} | ${bh.strength > 0.5 ? 'Strong' : bh.strength > 0.3 ? 'Moderate' : 'Weak'} association |`);
  lines.push(`| Consistency | ${fmt(bh.consistency)} | ${agg.positiveCount}/${agg.n} jurisdictions show same direction |`);
  lines.push(`| Temporality | ${fmt(bh.temporality)} | ${bh.temporality > 0.5 ? 'Predictor changes precede outcome changes' : 'Weak temporal ordering'} |`);
  lines.push(`| Gradient | ${fmt(bh.gradient)} | ${bh.gradient > 0.5 ? 'Clear' : bh.gradient > 0.3 ? 'Moderate' : 'Weak'} dose-response |`);
  lines.push(`| Experiment | ${fmt(bh.experiment)} | Observational (no RCTs at jurisdiction level) |`);
  lines.push(`| Plausibility | ${fmt(bh.plausibility)} | Mechanistic plausibility |`);
  lines.push(`| Coherence | ${fmt(bh.coherence)} | Coherence with existing knowledge |`);
  lines.push(`| Analogy | ${fmt(bh.analogy)} | Analogous relationships known |`);
  lines.push(`| Specificity | ${fmt(bh.specificity)} | Specificity of association |`);
  lines.push('');

  // ─── Individual Results Table ────────────────────────────────────
  // Sort by z-score (effect size) — more meaningful than Pearson for policy analysis
  const sorted = [...jurisdictions].sort((a, b) =>
    Math.abs(b.analysis.effectSize.zScore) - Math.abs(a.analysis.effectSize.zScore)
  );

  lines.push('## Individual Jurisdiction Results');
  lines.push('');
  lines.push('Sorted by effect size (z-score). Change from baseline is the primary metric:');
  lines.push('when the predictor is above its mean, how much does the outcome change?');
  lines.push('');
  lines.push('| Jurisdiction | % Change from Baseline | z-score | Baseline Avg | Follow-up Avg | Optimal Value | Forward r |');
  lines.push('|-------------|----------------------|---------|-------------|--------------|--------------|-----------|');

  for (const r of sorted) {
    const a = r.analysis;
    const bfu = a.baselineFollowup;
    lines.push(
      `| ${r.jurisdictionName} ` +
      `| ${fmt(bfu.outcomeFollowUpPercentChangeFromBaseline, 2)}% ` +
      `| ${fmt(a.effectSize.zScore)} ` +
      `| ${fmt(bfu.outcomeBaselineAverage, 2)} ` +
      `| ${fmt(bfu.outcomeFollowUpAverage, 2)} ` +
      `| ${formatUsd(a.optimalValues.valuePredictingHighOutcome)} ` +
      `| ${fmt(a.forwardPearson)} |`
    );
  }
  lines.push('');

  // ─── Notable Findings ────────────────────────────────────────────
  lines.push('## Notable Findings');
  lines.push('');

  // Negative correlations
  const negative = jurisdictions.filter(r => r.analysis.forwardPearson < 0);
  if (negative.length > 0) {
    lines.push(`### Jurisdictions Where More ${result.predictorName} ≠ Better ${result.outcomeName}`);
    lines.push('');
    for (const r of negative.sort((a, b) => a.analysis.forwardPearson - b.analysis.forwardPearson)) {
      lines.push(`- **${r.jurisdictionName}** (r = ${fmt(r.analysis.forwardPearson)}): Increases were associated with ${fmt(Math.abs(r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline), 2)}% *worse* outcome`);
    }
    lines.push('');
  }

  // Strongest positive
  const strongPositive = jurisdictions.filter(r => r.analysis.forwardPearson > 0.7);
  if (strongPositive.length > 0) {
    lines.push('### Strongest Relationships');
    lines.push('');
    for (const r of strongPositive.sort((a, b) => b.analysis.forwardPearson - a.analysis.forwardPearson).slice(0, 10)) {
      lines.push(`- **${r.jurisdictionName}** (r = ${fmt(r.analysis.forwardPearson)}): ${fmt(r.analysis.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline, 2)}% improvement when predictor above baseline`);
    }
    lines.push('');
  }

  // ─── Highlighted Jurisdiction ────────────────────────────────────
  const highlightId = options?.highlightJurisdiction;
  if (highlightId) {
    const highlighted = jurisdictions.find(r => r.jurisdictionId === highlightId);
    if (highlighted) {
      const a = highlighted.analysis;
      lines.push(`### ${highlighted.jurisdictionName} Deep Dive`);
      lines.push('');
      lines.push(`- **Change from baseline**: ${result.outcomeName} went from **${fmt(a.baselineFollowup.outcomeBaselineAverage, 2)}** (when ${result.predictorName} below average) to **${fmt(a.baselineFollowup.outcomeFollowUpAverage, 2)}** (when above average) — **${fmt(a.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline, 2)}% change**`);
      lines.push(`- **Effect size**: z = ${fmt(a.effectSize.zScore)} (${Math.abs(a.effectSize.zScore) < 1 ? 'small' : Math.abs(a.effectSize.zScore) < 2 ? 'medium' : 'large'} effect)`);
      lines.push(`- **Optimal value**: ${formatUsd(a.optimalValues.valuePredictingHighOutcome)} associated with highest outcome`);
      lines.push(`- **Correlation**: r = ${fmt(a.forwardPearson)} (${describeStrength(a.forwardPearson)})`);
      lines.push(`- **Causal Direction Score** (forward − reverse): ${fmt(a.predictivePearson)} — ${a.predictivePearson > 0.2 ? '✅ strong forward causation (predictor → outcome)' : a.predictivePearson > 0.05 ? 'weak forward causation' : a.predictivePearson < -0.2 ? '🔄 strong reverse causation (outcome → predictor)' : a.predictivePearson < -0.05 ? '🔄 weak reverse causation' : '⚪ no clear causal direction'}`);
      lines.push(`- **Data points**: ${a.numberOfPairs} aligned pairs`);
      lines.push('');

      if (a.predictivePearson < -0.05) {
        lines.push(`⚠️ **Reverse causation signal**: The negative predictive Pearson suggests that ${result.outcomeName.toLowerCase()} changes may be driving ${result.predictorName.toLowerCase()} changes, not the other way around.`);
        lines.push('');
      }
    }
  }

  // ─── Parameters ──────────────────────────────────────────────────
  lines.push('## Analysis Parameters');
  lines.push('');
  lines.push('| Parameter | Value |');
  lines.push('|-----------|-------|');
  lines.push(`| Predictor | ${result.predictorName} |`);
  lines.push(`| Outcome | ${result.outcomeName} |`);
  lines.push(`| Onset delay | ${config.onsetDelayDays} days |`);
  lines.push(`| Duration of action | ${config.durationOfActionDays} days |`);
  lines.push(`| Filling type | ${config.fillingType} |`);
  lines.push(`| Min data points | ${config.minimumDataPoints} |`);
  lines.push(`| Analysis engine | @optomitron/optimizer (runFullAnalysis) |`);
  lines.push('');

  // ─── Limitations ─────────────────────────────────────────────────
  lines.push('## Limitations');
  lines.push('');
  lines.push('- Annual data provides limited temporal granularity — finer-grained data would improve onset delay estimation');
  lines.push('- N-of-1 approach controls for time-invariant confounders but NOT time-varying ones (wars, pandemics, policy changes)');
  lines.push('- COVID-19 (2020-2022) creates significant noise in recent data');
  lines.push('- Optimal values are within-jurisdiction optima, not universal recommendations');
  lines.push('- Spending composition may matter more than total amount');
  lines.push('- PIS scores may be low due to N=1 subject count per jurisdiction');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*Generated by [Optomitron](https://github.com/mikepsinn/optomitron) — the open-source world optimization engine.*');

  return lines.join('\n');
}
