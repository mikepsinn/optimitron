/**
 * Causal Analysis Demo — Full dFDA Pipeline
 *
 * Simulates a personal health scenario: Vitamin D supplementation → mood score.
 * Runs the complete causal pipeline:
 *   temporal alignment → correlation → effect size → Bradford Hill → PIS → evidence grade → optimal values
 *
 * Output: a markdown report with all Bradford Hill scores, effect metrics,
 * and a treatment recommendation.
 *
 * @see dFDA Spec paper: "Predictor Impact Score" section
 */

import {
  type TimeSeries,
  type AlignedPair,
  alignTimeSeries,
  calculatePredictorImpactScore,
  validateDataQuality,
  pearsonCorrelation,
  spearmanCorrelation,
} from '@optomitron/causal';

// ─── Generate sample time-series data ────────────────────────────────

/**
 * Deterministic seeded PRNG (LCG).
 */
function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

/** Box-Muller normal variate */
function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

/**
 * Generate 180 days of Vitamin D supplementation data.
 *
 * Pattern:
 * - Days 1-30: no supplementation (baseline)
 * - Days 31-120: 4000 IU/day (most days, some skipped)
 * - Days 121-150: no supplementation (washout)
 * - Days 151-180: 2000 IU/day (lower dose period)
 */
function generateVitaminDSeries(rng: () => number): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const startDate = new Date('2025-06-01T08:00:00Z').getTime();
  const DAY_MS = 86_400_000;

  for (let day = 0; day < 180; day++) {
    const ts = startDate + day * DAY_MS;

    let dose: number;
    if (day < 30) {
      dose = 0; // baseline: no supplementation
    } else if (day < 120) {
      // Treatment period: 4000 IU with some skipped days
      dose = rng() > 0.15 ? 4000 : 0;
    } else if (day < 150) {
      dose = 0; // washout
    } else {
      // Lower dose period
      dose = rng() > 0.1 ? 2000 : 0;
    }

    measurements.push({ timestamp: ts, value: dose, unit: 'IU' });
  }

  return {
    variableId: 'vitamin_d',
    name: 'Vitamin D Supplementation',
    measurements,
    category: 'Supplements',
  };
}

/**
 * Generate 180 days of mood scores (1-10).
 *
 * Mood is a noisy function of recent Vitamin D intake with ~7-day onset
 * delay and ~14-day duration of action. Higher doses improve mood by
 * ~1.5 points on average.
 */
function generateMoodSeries(
  vitaminD: TimeSeries,
  rng: () => number,
): TimeSeries {
  const measurements: Array<{ timestamp: number; value: number; unit: string }> = [];
  const startDate = new Date('2025-06-01T18:00:00Z').getTime();
  const DAY_MS = 86_400_000;

  // Pre-compute daily vitamin D doses for look-back
  const dailyDoses: number[] = vitaminD.measurements.map(m => m.value);

  for (let day = 0; day < 180; day++) {
    const ts = startDate + day * DAY_MS;

    // Look back 7-21 days (onset=7d, duration=14d) to estimate effect
    let recentDoseAvg = 0;
    let count = 0;
    for (let lookback = 7; lookback <= 21 && (day - lookback) >= 0; lookback++) {
      recentDoseAvg += dailyDoses[day - lookback] ?? 0;
      count++;
    }
    recentDoseAvg = count > 0 ? recentDoseAvg / count : 0;

    // Dose-response: 4000 IU → +1.5 mood, 2000 IU → +0.8 mood
    const doseEffect = (recentDoseAvg / 4000) * 1.5;

    // Baseline mood ~5.5 with seasonal variation + noise
    const seasonal = 0.3 * Math.sin((2 * Math.PI * day) / 365);
    const baseMood = 5.5 + seasonal;
    const noise = normalRandom(rng, 0, 0.8);

    const mood = Math.max(1, Math.min(10, baseMood + doseEffect + noise));

    measurements.push({ timestamp: ts, value: Math.round(mood * 10) / 10, unit: 'score' });
  }

  return {
    variableId: 'mood',
    name: 'Overall Mood Score',
    measurements,
    category: 'Mood',
  };
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  const rng = seededRng(123);

  // 1. Generate data
  const vitaminD = generateVitaminDSeries(rng);
  const mood = generateMoodSeries(vitaminD, rng);

  // 2. Temporal alignment (onset=7 days, duration=14 days)
  const ONSET_DELAY_DAYS = 7;
  const DURATION_DAYS = 14;
  const forwardPairs = alignTimeSeries(vitaminD, mood, {
    onsetDelaySeconds: ONSET_DELAY_DAYS * 86400,
    durationOfActionSeconds: DURATION_DAYS * 86400,
    fillingType: 'zero',
  });

  // 3. Reverse pairs (outcome → predictor, to test temporality)
  const reversePairs = alignTimeSeries(mood, vitaminD, {
    onsetDelaySeconds: ONSET_DELAY_DAYS * 86400,
    durationOfActionSeconds: DURATION_DAYS * 86400,
    fillingType: 'none',
  });

  // 4. Data quality
  const quality = validateDataQuality(forwardPairs);

  // 5. PIS calculation
  const pis = calculatePredictorImpactScore(forwardPairs, reversePairs, {
    subjectCount: 1,
    plausibilityScore: 0.8,  // Well-studied mechanism (Vitamin D → serotonin)
    coherenceScore: 0.7,     // Consistent with literature
    analogyScore: 0.6,       // Similar to omega-3 → mood findings
    specificityScore: 0.4,   // Vitamin D affects many systems, not specific
  });

  // 6. Compute raw correlations for the report
  const predictorValues = forwardPairs.map(p => p.predictorValue);
  const outcomeValues = forwardPairs.map(p => p.outcomeValue);
  const pearson = pearsonCorrelation(predictorValues, outcomeValues);
  const spearman = spearmanCorrelation(predictorValues, outcomeValues);

  // ─── Markdown report ──────────────────────────────────────────────

  const lines: string[] = [];
  const add = (s: string) => lines.push(s);

  add('# 🧬 Causal Analysis: Vitamin D → Mood');
  add('');
  add(`**Date:** ${new Date().toISOString().slice(0, 10)}`);
  add(`**Predictor:** Vitamin D Supplementation (IU/day)`);
  add(`**Outcome:** Overall Mood Score (1–10)`);
  add(`**Tracking Period:** 180 days`);
  add(`**Onset Delay:** ${ONSET_DELAY_DAYS} days`);
  add(`**Duration of Action:** ${DURATION_DAYS} days`);
  add('');

  // Data quality
  add('## Data Quality');
  add('');
  add(`| Metric | Value | Pass |`);
  add(`|--------|------:|:----:|`);
  add(`| Aligned pairs | ${quality.pairCount} | ${quality.hasMinimumPairs ? '✅' : '❌'} (≥30) |`);
  add(`| Predictor changes | ${quality.predictorChanges} | ${quality.hasPredicorVariance ? '✅' : '❌'} (≥5) |`);
  add(`| Outcome changes | ${quality.outcomeChanges} | ${quality.hasOutcomeVariance ? '✅' : '❌'} (≥5) |`);
  add(`| Baseline fraction | ${(quality.baselineFraction * 100).toFixed(1)}% | ${quality.hasAdequateBaseline ? '✅' : '❌'} (≥10%) |`);
  add(`| Follow-up fraction | ${(quality.followUpFraction * 100).toFixed(1)}% | ${quality.hasAdequateFollowUp ? '✅' : '❌'} (≥10%) |`);
  add(`| **Overall** | | ${quality.isValid ? '**✅ PASS**' : '**❌ FAIL**'} |`);
  if (quality.failureReasons.length > 0) {
    add('');
    add('**Issues:** ' + quality.failureReasons.join('; '));
  }
  add('');

  // Correlation
  add('## Correlation Analysis');
  add('');
  add(`| Metric | Value |`);
  add(`|--------|------:|`);
  add(`| Pearson r | ${pearson.toFixed(4)} |`);
  add(`| Spearman ρ | ${spearman.toFixed(4)} |`);
  add(`| Forward r | ${pis.forwardCorrelation.pearson.toFixed(4)} |`);
  add(`| Forward p-value | ${pis.forwardCorrelation.pValue.toExponential(3)} |`);
  add(`| Forward n | ${pis.forwardCorrelation.n} |`);
  if (pis.reverseCorrelation) {
    add(`| Reverse r | ${pis.reverseCorrelation.pearson.toFixed(4)} |`);
    add(`| Reverse p-value | ${pis.reverseCorrelation.pValue.toExponential(3)} |`);
  }
  add(`| Temporality factor | ${pis.temporalityFactor.toFixed(4)} |`);
  add('');

  // Effect size
  add('## Effect Size');
  add('');
  add(`| Metric | Value |`);
  add(`|--------|------:|`);
  add(`| Baseline mean | ${pis.effectSize.baselineMean.toFixed(2)} |`);
  add(`| Follow-up mean | ${pis.effectSize.followUpMean.toFixed(2)} |`);
  add(`| Absolute change | ${pis.effectSize.absoluteChange >= 0 ? '+' : ''}${pis.effectSize.absoluteChange.toFixed(2)} |`);
  add(`| Percent change | ${pis.effectSize.percentChange >= 0 ? '+' : ''}${pis.effectSize.percentChange.toFixed(1)}% |`);
  add(`| Z-score | ${pis.effectSize.zScore.toFixed(3)} |`);
  add(`| Baseline SD | ${pis.effectSize.baselineStd.toFixed(3)} |`);
  add(`| Baseline n | ${pis.effectSize.baselineN} |`);
  add(`| Follow-up n | ${pis.effectSize.followUpN} |`);
  add('');

  // Bradford Hill criteria
  add('## Bradford Hill Causality Criteria');
  add('');
  add('| Criterion | Score (0–1) | Interpretation |');
  add('|-----------|:----------:|----------------|');

  const bh = pis.bradfordHill;
  const interpret = (score: number): string => {
    if (score >= 0.7) return '🟢 Strong';
    if (score >= 0.4) return '🟡 Moderate';
    if (score >= 0.2) return '🟠 Weak';
    return '🔴 Insufficient';
  };

  add(`| Strength | ${bh.strength.toFixed(3)} | ${interpret(bh.strength)} |`);
  add(`| Consistency | ${bh.consistency.toFixed(3)} | ${interpret(bh.consistency)} (n=1 subject) |`);
  add(`| Temporality | ${bh.temporality.toFixed(3)} | ${interpret(bh.temporality)} |`);
  add(`| Gradient (dose-response) | ${bh.gradient !== null ? bh.gradient.toFixed(3) : 'N/A'} | ${bh.gradient !== null ? interpret(bh.gradient) : 'N/A'} |`);
  add(`| Experiment | ${bh.experiment.toFixed(3)} | ${interpret(bh.experiment)} (observational default) |`);
  add(`| Plausibility | ${bh.plausibility.toFixed(3)} | ${interpret(bh.plausibility)} (Vitamin D → serotonin pathway) |`);
  add(`| Coherence | ${bh.coherence.toFixed(3)} | ${interpret(bh.coherence)} (consistent with literature) |`);
  add(`| Analogy | ${bh.analogy.toFixed(3)} | ${interpret(bh.analogy)} (similar to omega-3 effects) |`);
  add(`| Specificity | ${bh.specificity.toFixed(3)} | ${interpret(bh.specificity)} (multi-system effects) |`);
  add('');

  // PIS summary
  add('## Predictor Impact Score');
  add('');
  add(`| Metric | Value |`);
  add(`|--------|------:|`);
  add(`| **PIS** | **${pis.score.toFixed(4)}** |`);
  add(`| Evidence Grade | **${pis.evidenceGrade}** |`);
  add(`| Recommendation | ${formatRecommendation(pis.recommendation)} |`);
  add('');

  // Optimal values
  if (pis.optimalValue) {
    add('## Optimal Values');
    add('');
    add(`| Metric | Value |`);
    add(`|--------|------:|`);
    add(`| Predictor value → high outcome | ${pis.optimalValue.valuePredictingHighOutcome.toFixed(0)} IU/day |`);
    add(`| Predictor value → low outcome | ${pis.optimalValue.valuePredictingLowOutcome.toFixed(0)} IU/day |`);
    add(`| High-outcome observations | ${pis.optimalValue.highOutcomeN} |`);
    add(`| Low-outcome observations | ${pis.optimalValue.lowOutcomeN} |`);
    if (pis.optimalValue.confidenceInterval) {
      add(`| 95% CI for optimal | [${pis.optimalValue.confidenceInterval[0].toFixed(0)}, ${pis.optimalValue.confidenceInterval[1].toFixed(0)}] IU/day |`);
    }
    add('');
  }

  // Summary
  add('## Summary');
  add('');
  const direction = pis.forwardCorrelation.pearson > 0 ? 'positive' : 'negative';
  add(`Vitamin D supplementation shows a **${direction}** association with mood scores `);
  add(`(r = ${pis.forwardCorrelation.pearson.toFixed(3)}, p = ${pis.forwardCorrelation.pValue.toExponential(2)}).`);
  add(`The effect size is a **${Math.abs(pis.effectSize.percentChange).toFixed(1)}%** change from baseline,`);
  add(`corresponding to a z-score of ${pis.effectSize.zScore.toFixed(2)}.`);
  add('');
  if (pis.optimalValue) {
    add(`The optimal supplementation level is approximately **${pis.optimalValue.valuePredictingHighOutcome.toFixed(0)} IU/day**,`);
    add(`which is associated with mood scores above the population mean.`);
    add('');
  }
  add(`With an evidence grade of **${pis.evidenceGrade}**, this relationship warrants **${formatRecommendation(pis.recommendation).toLowerCase()}**.`);
  add('');

  add('---');
  add('');
  add('*Generated by `@optomitron/examples` using `@optomitron/causal` PIS pipeline.*');

  const report = lines.join('\n');
  console.log(report);
}

function formatRecommendation(rec: string): string {
  switch (rec) {
    case 'high_priority_trial': return '🔬 High-priority clinical trial';
    case 'moderate_priority': return '📋 Moderate-priority investigation';
    case 'monitor': return '👁️ Continue monitoring';
    case 'insufficient_evidence': return '⚠️ Insufficient evidence';
    default: return rec;
  }
}

main();
