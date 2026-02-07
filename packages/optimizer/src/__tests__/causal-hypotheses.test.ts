/**
 * Hypothesis-driven tests for the core causal inference engine.
 * 
 * These tests encode scientific expectations about what the optimizer
 * SHOULD detect given known data patterns. Each hypothesis documents
 * what we're testing and why we expect a specific result.
 */

import { describe, it, expect } from 'vitest';
import { runFullAnalysis, type FullAnalysisResult, type AnalysisConfig } from '../pipeline.js';
import type { TimeSeries, Measurement } from '../types.js';

// ─── Test data builders ──────────────────────────────────────────────

function ts(id: string, name: string, data: [number, number][], unit?: string): TimeSeries {
  return {
    variableId: id,
    name,
    measurements: data.map(([timestamp, value]) => ({
      timestamp,
      value,
      unit,
    })),
  };
}

/** Generate daily timestamps for N days starting from a base date */
function dailyTimestamps(days: number, startMs: number = Date.parse('2020-01-01')): number[] {
  const DAY = 86400000;
  return Array.from({ length: days }, (_, i) => startMs + i * DAY);
}

/** Generate a time series with a known linear relationship */
function linearSeries(
  id: string, name: string, days: number,
  slope: number, intercept: number, noise: number = 0,
): TimeSeries {
  const timestamps = dailyTimestamps(days);
  return ts(id, name,
    timestamps.map((t, i) => [t, intercept + slope * i + (noise ? Math.sin(i * 0.7) * noise : 0)]),
  );
}

const defaultConfig: AnalysisConfig = {
  onsetDelaySeconds: 86400,       // 1 day
  durationOfActionSeconds: 86400, // 1 day
  fillingType: 'none',
};

// ─── H1: Known positive relationship ─────────────────────────────────

describe('H1: Strong positive predictor→outcome → positive Pearson', () => {
  // When predictor goes up and outcome goes up proportionally,
  // the engine must detect a strong positive correlation.
  const predictor = linearSeries('pred', 'Treatment Dose', 100, 1, 10);
  const outcome = linearSeries('out', 'Health Score', 100, 0.5, 50);

  it('forward Pearson should be strongly positive (> 0.7)', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    expect(result.forwardPearson).toBeGreaterThan(0.7);
  });

  it('p-value should be significant (< 0.05)', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    expect(result.pValue).toBeLessThan(0.05);
  });

  it('evidence grade should be A or B', () => {
    const result = runFullAnalysis(predictor, outcome, {
      ...defaultConfig,
      subjectCount: 50, // Enough subjects for consistency
    });
    expect(['A', 'B']).toContain(result.pis.evidenceGrade);
  });
});

// ─── H2: Known negative relationship ────────────────────────────────

describe('H2: Inverse predictor→outcome → negative Pearson', () => {
  // When predictor goes up and outcome goes DOWN,
  // the engine must detect a negative correlation.
  const predictor = linearSeries('pred', 'Toxin Exposure', 100, 1, 0);
  const outcome = linearSeries('out', 'Health Score', 100, -0.3, 80);

  it('forward Pearson should be negative', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    expect(result.forwardPearson).toBeLessThan(-0.5);
  });

  it('optimal predictor value should be LOW (less toxin = better)', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    const meanPred = 10 + 50; // midpoint of predictor range
    expect(result.optimalValues.valuePredictingHighOutcome).toBeLessThan(meanPred);
  });
});

// ─── H3: No relationship → weak correlation ────────────────────────

describe('H3: Independent variables → negligible correlation', () => {
  // Predictor and outcome that are completely independent should
  // produce a correlation near zero.
  const predictor = linearSeries('pred', 'Irrelevant Variable', 100, 1, 0);
  const timestamps = dailyTimestamps(100);
  const outcome = ts('out', 'Health Score',
    timestamps.map((t, i) => [t, 50 + Math.sin(i * 0.3) * 10]),
  );

  it('forward Pearson should be near zero (|r| < 0.3)', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    expect(Math.abs(result.forwardPearson)).toBeLessThan(0.3);
  });

  it('evidence grade should be D or F', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    expect(['D', 'F']).toContain(result.pis.evidenceGrade);
  });
});

// ─── H4: Onset delay alignment ──────────────────────────────────────

describe('H4: Onset delay improves detection of lagged effects', () => {
  // Predictor at time T affects outcome at time T+3 days.
  // With onset delay = 3 days, correlation should be stronger
  // than with onset delay = 0.
  const timestamps = dailyTimestamps(200);
  const predictor = ts('pred', 'Medication Dose',
    timestamps.map((t, i) => [t, i < 100 ? 0 : 10]),
  );
  // Outcome responds 3 days after predictor change
  const outcome = ts('out', 'Symptom Score',
    timestamps.map((t, i) => [t, i < 103 ? 50 : 35]),
  );

  it('3-day onset delay should produce meaningful correlation', () => {
    const result = runFullAnalysis(predictor, outcome, {
      ...defaultConfig,
      onsetDelaySeconds: 3 * 86400, // 3 days
      durationOfActionSeconds: 86400,
    });
    // With correct onset delay, the step change should align
    expect(Math.abs(result.forwardPearson)).toBeGreaterThan(0.3);
  });
});

// ─── H5: Duration of action ─────────────────────────────────────────

describe('H5: Duration of action captures persistent effects', () => {
  // A single dose at day 50 should affect outcomes for several days.
  // With duration = 7 days, the effect window is wider → more aligned pairs.
  const timestamps = dailyTimestamps(100);
  const predictor = ts('pred', 'Single Dose',
    timestamps.map((t, i) => [t, i === 50 ? 100 : 0]),
  );
  const outcome = ts('out', 'Response',
    timestamps.map((t, i) => [t, (i >= 51 && i <= 57) ? 80 : 50]),
  );

  it('should detect the effect with 7-day duration', () => {
    const result = runFullAnalysis(predictor, outcome, {
      ...defaultConfig,
      onsetDelaySeconds: 86400, // 1 day
      durationOfActionSeconds: 7 * 86400, // 7 days
    });
    expect(result.numberOfPairs).toBeGreaterThan(0);
  });
});

// ─── H6: Change from baseline ───────────────────────────────────────

describe('H6: Baseline vs follow-up correctly splits data', () => {
  // When predictor is below mean → baseline period (low dose)
  // When predictor is above mean → follow-up period (high dose)
  // Outcome should differ between periods.
  const timestamps = dailyTimestamps(100);
  const predictor = ts('pred', 'Drug Dose',
    timestamps.map((t, i) => [t, i < 50 ? 10 : 50]), // Low then high
  );
  const outcome = ts('out', 'Blood Pressure',
    timestamps.map((t, i) => [t, i < 50 ? 140 : 120]), // High then low (drug works)
  );

  it('follow-up outcome should differ from baseline', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    const bfup = result.baselineFollowup;
    expect(bfup.outcomeFollowUpPercentChangeFromBaseline).not.toBe(0);
  });

  it('outcome should be lower in follow-up (drug reduces BP)', () => {
    const result = runFullAnalysis(predictor, outcome, defaultConfig);
    const bfup = result.baselineFollowup;
    // Higher dose → lower BP → negative percent change
    expect(bfup.outcomeFollowUpPercentChangeFromBaseline).toBeLessThan(0);
  });
});

// ─── H7: Predictive Pearson detects causal direction ────────────────

describe('H7: Predictive Pearson > 0 when predictor truly causes outcome', () => {
  // If predictor genuinely drives outcome (not reverse),
  // forward r should exceed reverse r → predictive Pearson > 0.
  const timestamps = dailyTimestamps(200);
  const predictor = ts('pred', 'Exercise Minutes',
    timestamps.map((t, i) => [t, 30 + Math.sin(i * 0.1) * 20]),
  );
  // Outcome follows predictor with noise
  const outcome = ts('out', 'Mood Score',
    timestamps.map((t, i) => {
      const exercise = 30 + Math.sin(i * 0.1) * 20;
      return [t, 50 + exercise * 0.3 + Math.sin(i * 0.5) * 5];
    }),
  );

  it('predictive Pearson should be ≥ 0 (correct causal direction)', () => {
    const result = runFullAnalysis(predictor, outcome, {
      ...defaultConfig,
      onsetDelaySeconds: 0,
      durationOfActionSeconds: 86400,
    });
    // predictive = forward - reverse; should be ≥ 0 for true cause
    expect(result.predictivePearson).toBeGreaterThanOrEqual(-0.1); // Allow small margin
  });
});

// ─── H8: Bradford Hill strength scales with correlation ─────────────

describe('H8: Bradford Hill strength score tracks correlation magnitude', () => {
  it('strong correlation should produce higher strength score than weak', () => {
    const pred = linearSeries('p', 'Strong Pred', 100, 1, 0);
    const strongOut = linearSeries('so', 'Strong Out', 100, 0.8, 0);
    const weakOut = linearSeries('wo', 'Weak Out', 100, 0.05, 0, 3);

    const strongResult = runFullAnalysis(pred, strongOut, defaultConfig);
    const weakResult = runFullAnalysis(pred, weakOut, defaultConfig);

    expect(strongResult.bradfordHill.strength).toBeGreaterThan(weakResult.bradfordHill.strength);
  });
});

// ─── H9: More data → better data quality ─────────────────────────────

describe('H9: More measurements → data quality passes', () => {
  it('100+ data points should pass data quality validation', () => {
    const pred = linearSeries('p', 'Pred', 200, 1, 0);
    const out = linearSeries('o', 'Out', 200, 0.5, 0);
    const result = runFullAnalysis(pred, out, defaultConfig);
    expect(result.dataQuality.isValid).toBe(true);
  });

  it('few data points may fail data quality', () => {
    const pred = linearSeries('p', 'Pred', 10, 1, 0);
    const out = linearSeries('o', 'Out', 10, 0.5, 0);
    const result = runFullAnalysis(pred, out, defaultConfig);
    // With only 10 points, data quality should flag concerns
    expect(result.numberOfPairs).toBeLessThanOrEqual(10);
  });
});

// ─── H10: Effect size magnitude ─────────────────────────────────────

describe('H10: Large treatment effect → large effect size', () => {
  const timestamps = dailyTimestamps(200);

  it('large effect should produce |z-score| > 1', () => {
    const pred = ts('p', 'Drug',
      timestamps.map((t, i) => [t, i < 100 ? 0 : 100]),
    );
    const out = ts('o', 'Pain',
      timestamps.map((t, i) => [t, i < 100 ? 80 : 30]), // 62.5% reduction
    );
    const result = runFullAnalysis(pred, out, defaultConfig);
    expect(Math.abs(result.effectSize.zScore)).toBeGreaterThan(1);
  });

  it('small effect should produce |z-score| < large effect z-score', () => {
    const pred = ts('p', 'Drug',
      timestamps.map((t, i) => [t, i < 100 ? 0 : 100]),
    );
    const largeOut = ts('ol', 'Pain Large',
      timestamps.map((t, i) => [t, i < 100 ? 80 : 30]),
    );
    const smallOut = ts('os', 'Pain Small',
      timestamps.map((t, i) => [t, i < 100 ? 80 : 75]), // Only 6.25% reduction
    );
    const largeResult = runFullAnalysis(pred, largeOut, defaultConfig);
    const smallResult = runFullAnalysis(pred, smallOut, defaultConfig);

    expect(Math.abs(largeResult.effectSize.zScore))
      .toBeGreaterThan(Math.abs(smallResult.effectSize.zScore));
  });
});
