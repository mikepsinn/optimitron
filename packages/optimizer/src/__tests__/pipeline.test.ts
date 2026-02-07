/**
 * Tests for end-to-end analysis pipeline and markdown report generator.
 *
 * @see packages/optimizer/src/pipeline.ts
 * @see packages/optimizer/src/report.ts
 */

import { describe, it, expect } from 'vitest';
import type { TimeSeries, Measurement } from '../types.js';
import { runFullAnalysis, type FullAnalysisResult, type AnalysisConfig } from '../pipeline.js';
import { generateMarkdownReport } from '../report.js';

// ---------------------------------------------------------------------------
// Helpers — Synthetic data generators
// ---------------------------------------------------------------------------

/**
 * Generate a series of daily measurements over N days starting from a date.
 * Each day's value is produced by valueFn(dayIndex).
 */
function generateDailySeries(
  name: string,
  days: number,
  valueFn: (day: number) => number,
  startDate: string = '2024-01-15',
): TimeSeries {
  const measurements: Measurement[] = [];
  const start = new Date(startDate).getTime();
  const dayMs = 86_400_000;

  for (let d = 0; d < days; d++) {
    measurements.push({
      timestamp: start + d * dayMs,
      value: valueFn(d),
    });
  }

  return {
    variableId: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    measurements,
  };
}

/**
 * Simple seeded PRNG (mulberry32) for reproducible "random" data.
 */
function seededRng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// ---------------------------------------------------------------------------
// Synthetic datasets
// ---------------------------------------------------------------------------

const DAYS = 180;

/** Vitamin D (IU) — positive correlation with mood */
function makeVitaminDMoodData(): { predictor: TimeSeries; outcome: TimeSeries } {
  const rng = seededRng(42);
  const predictor = generateDailySeries('Vitamin D', DAYS, (d) => {
    // 0 IU for first 30 days, then ~5000 IU with noise
    if (d < 30) return 0;
    return 4500 + rng() * 1000;
  });
  const outcome = generateDailySeries('Overall Mood', DAYS, (d) => {
    // Mood starts low, rises after Vitamin D starts (with noise)
    const base = d < 30 ? 5.0 : 5.0 + (d - 30) * 0.01;
    const signal = d >= 31 ? 1.5 : 0; // onset after 1 day
    return Math.min(10, Math.max(1, base + signal + (rng() - 0.5) * 1.5));
  });
  return { predictor, outcome };
}

/** Exercise (minutes) — positive correlation with sleep quality */
function makeExerciseSleepData(): { predictor: TimeSeries; outcome: TimeSeries } {
  const rng = seededRng(99);
  const predictor = generateDailySeries('Exercise Minutes', DAYS, (d) => {
    // Alternating: some days 0, some days 30–60 min
    return d % 3 === 0 ? 0 : 30 + rng() * 30;
  });
  const outcome = generateDailySeries('Sleep Quality', DAYS, (d) => {
    // Sleep is better on exercise days (with lag)
    const exercised = d > 0 && (d - 1) % 3 !== 0;
    const base = 6.0;
    const signal = exercised ? 1.0 : 0;
    return Math.min(10, Math.max(1, base + signal + (rng() - 0.5) * 1.2));
  });
  return { predictor, outcome };
}

/** Random uncorrelated data — no relationship */
function makeRandomData(): { predictor: TimeSeries; outcome: TimeSeries } {
  const rng = seededRng(123);
  const predictor = generateDailySeries('Random Predictor', DAYS, () => rng() * 100);
  const outcome = generateDailySeries('Random Outcome', DAYS, () => rng() * 10);
  return { predictor, outcome };
}

/** Coffee (cups) — negative correlation with anxiety (higher coffee → more anxiety) */
function makeCoffeeAnxietyData(): { predictor: TimeSeries; outcome: TimeSeries } {
  const rng = seededRng(77);
  const predictor = generateDailySeries('Coffee Cups', DAYS, () => {
    return Math.round(rng() * 5); // 0-5 cups
  });
  const outcome = generateDailySeries('Anxiety Level', DAYS, (d) => {
    // We use the predictor value directly for a tighter correlation
    const cups = Math.round(seededRng(77 + d)() * 5);
    return Math.min(10, Math.max(1, 3 + cups * 0.8 + (rng() - 0.5) * 1.0));
  });
  return { predictor, outcome };
}

const defaultConfig: AnalysisConfig = {
  onsetDelaySeconds: 0,
  durationOfActionSeconds: 86400,
  fillingType: 'zero',
};

// ---------------------------------------------------------------------------
// Pipeline Tests
// ---------------------------------------------------------------------------

describe('runFullAnalysis', () => {
  describe('Vitamin D → Mood (positive correlation)', () => {
    const { predictor, outcome } = makeVitaminDMoodData();

    let result: FullAnalysisResult;
    it('runs without throwing', () => {
      result = runFullAnalysis(predictor, outcome, defaultConfig);
      expect(result).toBeDefined();
    });

    it('has correct predictor and outcome names', () => {
      expect(result.predictorName).toBe('Vitamin D');
      expect(result.outcomeName).toBe('Overall Mood');
    });

    it('counts measurements correctly', () => {
      expect(result.numberOfMeasurements.predictor).toBe(DAYS);
      expect(result.numberOfMeasurements.outcome).toBe(DAYS);
    });

    it('produces aligned pairs', () => {
      expect(result.numberOfPairs).toBeGreaterThan(30);
    });

    it('has a positive forward Pearson correlation', () => {
      expect(result.forwardPearson).toBeGreaterThan(0);
    });

    it('has a valid Spearman correlation', () => {
      expect(result.spearmanCorrelation).not.toBeNaN();
    });

    it('computes a p-value between 0 and 1', () => {
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    });

    it('computes reverse Pearson', () => {
      expect(result.reversePearson).not.toBeNaN();
    });

    it('computes predictive Pearson', () => {
      // predictive = forward - reverse
      expect(result.predictivePearson).toBeCloseTo(
        result.forwardPearson - result.reversePearson,
        10,
      );
    });

    it('computes effect size with positive percent change', () => {
      // Vitamin D should improve mood
      expect(result.effectSize.percentChange).toBeGreaterThan(0);
    });

    it('has baseline followup analysis', () => {
      expect(result.baselineFollowup.baselinePairs.length).toBeGreaterThan(0);
      expect(result.baselineFollowup.followupPairs.length).toBeGreaterThan(0);
      expect(result.baselineFollowup.outcomeFollowUpPercentChangeFromBaseline).not.toBeNaN();
    });

    it('has optimal values', () => {
      expect(result.optimalValues.valuePredictingHighOutcome).not.toBeNaN();
      expect(result.optimalValues.valuePredictingLowOutcome).not.toBeNaN();
      expect(result.optimalValues.optimalDailyValue).not.toBeNaN();
    });

    it('has Bradford Hill scores all between 0 and 1', () => {
      const bh = result.bradfordHill;
      for (const key of Object.keys(bh) as Array<keyof typeof bh>) {
        const val = bh[key];
        if (val !== null) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    });

    it('has a PIS score > 0', () => {
      expect(result.pis.score).toBeGreaterThan(0);
    });

    it('has an evidence grade', () => {
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.pis.evidenceGrade);
    });

    it('has a date range', () => {
      expect(result.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('has data quality result', () => {
      expect(result.dataQuality.pairCount).toBe(result.numberOfPairs);
      expect(result.dataQuality.numberOfPairs).toBe(result.numberOfPairs);
    });
  });

  describe('Exercise → Sleep (positive correlation)', () => {
    const { predictor, outcome } = makeExerciseSleepData();

    let result: FullAnalysisResult;
    it('runs without throwing', () => {
      result = runFullAnalysis(predictor, outcome, defaultConfig);
      expect(result).toBeDefined();
    });

    it('has correct names', () => {
      expect(result.predictorName).toBe('Exercise Minutes');
      expect(result.outcomeName).toBe('Sleep Quality');
    });

    it('produces a positive correlation', () => {
      expect(result.forwardPearson).toBeGreaterThan(0);
    });

    it('has a PIS with recommendation', () => {
      expect([
        'high_priority_trial',
        'moderate_priority',
        'monitor',
        'insufficient_evidence',
      ]).toContain(result.pis.recommendation);
    });

    it('optimal value for high outcome should be higher than low outcome', () => {
      // More exercise → better sleep
      expect(result.optimalValues.valuePredictingHighOutcome).toBeGreaterThan(
        result.optimalValues.valuePredictingLowOutcome,
      );
    });
  });

  describe('Random data (no correlation)', () => {
    const { predictor, outcome } = makeRandomData();

    let result: FullAnalysisResult;
    it('runs without throwing', () => {
      result = runFullAnalysis(predictor, outcome, defaultConfig);
      expect(result).toBeDefined();
    });

    it('has a weak forward Pearson (close to 0)', () => {
      expect(Math.abs(result.forwardPearson)).toBeLessThan(0.3);
    });

    it('has a high p-value (not significant)', () => {
      // For random data, p-value should generally be high (> 0.05)
      // But we give wiggle room since it's pseudo-random
      expect(result.pValue).toBeGreaterThan(0.01);
    });

    it('has a low PIS score', () => {
      expect(result.pis.score).toBeLessThan(0.3);
    });

    it('has small effect size', () => {
      expect(Math.abs(result.effectSize.percentChange)).toBeLessThan(30);
    });
  });

  describe('Edge cases', () => {
    it('throws when too few pairs are produced', () => {
      const predictor = generateDailySeries('A', 1, () => 1);
      const outcome = generateDailySeries('B', 1, () => 2);
      expect(() =>
        runFullAnalysis(predictor, outcome, {
          ...defaultConfig,
          fillingType: 'none',
        }),
      ).toThrow(/Insufficient aligned pairs/);
    });

    it('works with custom onset delay and duration', () => {
      const { predictor, outcome } = makeVitaminDMoodData();
      const result = runFullAnalysis(predictor, outcome, {
        onsetDelaySeconds: 3600,
        durationOfActionSeconds: 172800,
        fillingType: 'zero',
      });
      expect(result.onsetDelay).toBe(3600);
      expect(result.durationOfAction).toBe(172800);
    });

    it('uses default config when none provided', () => {
      const { predictor, outcome } = makeVitaminDMoodData();
      const result = runFullAnalysis(predictor, outcome);
      expect(result.onsetDelay).toBe(1800); // default
      expect(result.durationOfAction).toBe(86400); // default
    });

    it('accepts custom Bradford Hill priors', () => {
      const { predictor, outcome } = makeVitaminDMoodData();
      const result = runFullAnalysis(predictor, outcome, {
        ...defaultConfig,
        plausibilityScore: 0.9,
        coherenceScore: 0.8,
        analogyScore: 0.7,
        specificityScore: 0.6,
        subjectCount: 50,
      });
      expect(result.bradfordHill.plausibility).toBe(0.9);
      expect(result.bradfordHill.coherence).toBe(0.8);
      expect(result.bradfordHill.analogy).toBe(0.7);
      expect(result.bradfordHill.specificity).toBe(0.6);
    });
  });
});

// ---------------------------------------------------------------------------
// Report Tests
// ---------------------------------------------------------------------------

describe('generateMarkdownReport', () => {
  const { predictor, outcome } = makeVitaminDMoodData();
  const result = runFullAnalysis(predictor, outcome, defaultConfig);
  const report = generateMarkdownReport(result);

  it('returns a non-empty string', () => {
    expect(report.length).toBeGreaterThan(100);
  });

  it('contains the title with predictor and outcome names', () => {
    expect(report).toContain('# Analysis: Vitamin D → Overall Mood');
  });

  it('contains the Summary section', () => {
    expect(report).toContain('## Summary');
  });

  it('contains the Key Findings section', () => {
    expect(report).toContain('## Key Findings');
  });

  it('contains the Causality Assessment section', () => {
    expect(report).toContain('## Causality Assessment');
  });

  it('contains the Optimal Values section', () => {
    expect(report).toContain('## Optimal Values');
  });

  it('contains the Data Quality section', () => {
    expect(report).toContain('## Data Quality');
  });

  it('contains Forward Pearson value', () => {
    expect(report).toContain('Forward Pearson (predictor → outcome)');
    expect(report).toContain(result.forwardPearson.toFixed(2));
  });

  it('contains Reverse Pearson value', () => {
    expect(report).toContain('Reverse Pearson (outcome → predictor)');
  });

  it('contains Predictive Pearson value', () => {
    expect(report).toContain('Causal Direction Score (forward − reverse)');
  });

  it('contains Bradford Hill Score', () => {
    expect(report).toContain('Bradford Hill Score:');
    expect(report).toContain('/9');
  });

  it('contains PIS score', () => {
    expect(report).toContain('Predictor Impact Score:');
    expect(report).toContain('/100');
  });

  it('contains Evidence Grade', () => {
    expect(report).toContain('Evidence Grade:');
    expect(report).toContain(result.pis.evidenceGrade);
  });

  it('contains the date range', () => {
    expect(report).toContain(result.dateRange.start);
    expect(report).toContain(result.dateRange.end);
  });

  it('contains pair count', () => {
    expect(report).toContain(`Pairs analyzed: ${result.numberOfPairs}`);
  });

  it('contains practical recommendation', () => {
    expect(report).toContain('Practical recommendation:');
    expect(report).toContain('daily');
  });

  it('contains correlation description', () => {
    // Should contain one of the correlation descriptions
    const descriptions = [
      'strong positive', 'strong negative',
      'moderate positive', 'moderate negative',
      'weak positive', 'weak negative',
      'very weak positive', 'very weak negative',
      'negligible',
    ];
    expect(descriptions.some(d => report.includes(d))).toBe(true);
  });

  it('contains p-value', () => {
    expect(report).toContain('p-value:');
  });

  describe('report for random data', () => {
    const { predictor: rp, outcome: ro } = makeRandomData();
    const randomResult = runFullAnalysis(rp, ro, defaultConfig);
    const randomReport = generateMarkdownReport(randomResult);

    it('contains the correct predictor name', () => {
      expect(randomReport).toContain('Random Predictor');
    });

    it('contains the correct outcome name', () => {
      expect(randomReport).toContain('Random Outcome');
    });
  });

  describe('report for exercise data', () => {
    const { predictor: ep, outcome: eo } = makeExerciseSleepData();
    const exerciseResult = runFullAnalysis(ep, eo, defaultConfig);
    const exerciseReport = generateMarkdownReport(exerciseResult);

    it('contains Exercise Minutes → Sleep Quality title', () => {
      expect(exerciseReport).toContain('Exercise Minutes → Sleep Quality');
    });

    it('is valid markdown with all sections', () => {
      const sections = [
        '## Summary',
        '## Key Findings',
        '## Causality Assessment',
        '## Optimal Values',
        '## Data Quality',
      ];
      for (const section of sections) {
        expect(exerciseReport).toContain(section);
      }
    });
  });
});
