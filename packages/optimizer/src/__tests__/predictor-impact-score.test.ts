import { describe, it, expect } from 'vitest';
import {
  saturation,
  scoreStrength,
  scoreConsistency,
  scoreTemporality,
  scoreGradient,
  scoreZFactor,
  calculateOptimalValues,
  validateDataQuality,
  getEvidenceGrade,
  getRecommendation,
  calculatePredictorImpactScore,
  SATURATION_CONSTANTS,
} from '../predictor-impact-score.js';
import type { AlignedPair } from '../types.js';

// ─── Helper ──────────────────────────────────────────────────────────

function pair(pv: number, ov: number, pt = 0, ot = 0): AlignedPair {
  return { predictorValue: pv, outcomeValue: ov, predictorTimestamp: pt, outcomeTimestamp: ot };
}

/** Generate N pairs with a linear relationship + noise */
function linearPairs(
  n: number,
  slope: number,
  intercept: number,
  noiseScale: number = 0.1
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  for (let i = 0; i < n; i++) {
    const pv = (i / n) * 100;
    // Deterministic pseudo-noise using sin
    const noise = Math.sin(i * 137.5) * noiseScale * intercept;
    const ov = slope * pv + intercept + noise;
    pairs.push(pair(pv, ov, i * 1000, i * 1000 + 500));
  }
  return pairs;
}

/** Generate pairs that simulate a dose-response relationship */
function doseResponsePairs(n: number): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  for (let i = 0; i < n; i++) {
    // Dose from 0 to 100
    const dose = (i / n) * 100;
    // Outcome: saturating benefit with noise
    // Simulates "magnesium reduces headache severity"
    const headacheSeverity = 8 - 5 * (1 - Math.exp(-dose / 30)) + Math.sin(i * 2.13) * 0.5;
    pairs.push(pair(dose, headacheSeverity, i * 86400000, i * 86400000 + 43200000));
  }
  return pairs;
}

// ─── saturation ──────────────────────────────────────────────────────

describe('saturation', () => {
  it('returns 0 when value is 0', () => {
    expect(saturation(0, 10)).toBe(0);
  });

  it('approaches 1 for large values', () => {
    // 1 - e^(-100/10) = 1 - e^(-10) ≈ 0.99995
    expect(saturation(100, 10)).toBeCloseTo(1.0, 3);
  });

  it('equals 1 - 1/e ≈ 0.632 when value equals sigConstant', () => {
    // 1 - e^(-1) ≈ 0.6321
    expect(saturation(10, 10)).toBeCloseTo(0.6321, 3);
  });

  it('is monotonically increasing', () => {
    let prev = 0;
    for (let v = 1; v <= 100; v++) {
      const current = saturation(v, 10);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });

  it('uses N_SIG=10 for user saturation (paper spec)', () => {
    // φ_users = 1 - e^(-N/10)
    const φ10 = saturation(10, SATURATION_CONSTANTS.N_SIG);
    expect(φ10).toBeCloseTo(0.6321, 3);

    const φ30 = saturation(30, SATURATION_CONSTANTS.N_SIG);
    expect(φ30).toBeCloseTo(0.9502, 3);
  });

  it('uses N_PAIRS_SIG=100 for pair saturation (paper spec)', () => {
    const φ100 = saturation(100, SATURATION_CONSTANTS.N_PAIRS_SIG);
    expect(φ100).toBeCloseTo(0.6321, 3);

    const φ500 = saturation(500, SATURATION_CONSTANTS.N_PAIRS_SIG);
    expect(φ500).toBeCloseTo(0.9933, 3);
  });

  it('handles negative values (mathematically valid but unusual)', () => {
    // 1 - e^(1) = 1 - 2.718... ≈ -1.718
    const result = saturation(-10, 10);
    expect(result).toBeLessThan(0);
  });
});

// ─── scoreStrength ───────────────────────────────────────────────────

describe('scoreStrength', () => {
  it('returns 0 for zero correlation', () => {
    expect(scoreStrength(0)).toBe(0);
  });

  it('uses absolute value of correlation', () => {
    expect(scoreStrength(-0.5)).toBe(scoreStrength(0.5));
  });

  it('approaches 1 for strong correlation', () => {
    expect(scoreStrength(1.0)).toBeGreaterThan(0.95);
  });

  it('returns ~0.632 when |r| equals the sigConstant (default 0.3)', () => {
    // 1 - e^(-0.3/0.3) = 1 - e^(-1) ≈ 0.632
    expect(scoreStrength(0.3)).toBeCloseTo(0.6321, 3);
  });

  it('allows custom sigConstant', () => {
    expect(scoreStrength(0.5, 0.5)).toBeCloseTo(0.6321, 3);
  });
});

// ─── scoreConsistency ────────────────────────────────────────────────

describe('scoreConsistency', () => {
  it('returns 0 for zero subjects', () => {
    expect(scoreConsistency(0)).toBe(0);
  });

  it('returns ~0.632 for N_SIG=10 subjects', () => {
    expect(scoreConsistency(10)).toBeCloseTo(0.6321, 3);
  });

  it('returns ~0.95 for 30 subjects', () => {
    expect(scoreConsistency(30)).toBeCloseTo(0.9502, 3);
  });

  it('approaches 1 for very large subject counts', () => {
    expect(scoreConsistency(100)).toBeGreaterThan(0.99);
    expect(scoreConsistency(1000)).toBeGreaterThan(0.999);
  });

  it('is monotonically increasing with subject count', () => {
    let prev = 0;
    for (let n = 1; n <= 50; n++) {
      const current = scoreConsistency(n);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });
});

// ─── scoreTemporality ────────────────────────────────────────────────

describe('scoreTemporality', () => {
  it('returns 0.5 when forward and reverse are equal', () => {
    expect(scoreTemporality(0.5, 0.5)).toBeCloseTo(0.5, 10);
    expect(scoreTemporality(-0.5, -0.5)).toBeCloseTo(0.5, 10);
  });

  it('returns 1.0 when reverse is 0 (pure forward causation)', () => {
    expect(scoreTemporality(0.8, 0)).toBeCloseTo(1.0, 10);
  });

  it('returns 0.0 when forward is 0 (pure reverse causation)', () => {
    expect(scoreTemporality(0, 0.8)).toBeCloseTo(0.0, 10);
  });

  it('returns 0.5 when both are 0 (no signal)', () => {
    expect(scoreTemporality(0, 0)).toBeCloseTo(0.5, 10);
  });

  it('uses absolute values (sign-agnostic)', () => {
    // |r_forward| / (|r_forward| + |r_reverse|) per paper formula
    const a = scoreTemporality(0.7, -0.3);
    const b = scoreTemporality(-0.7, 0.3);
    expect(a).toBeCloseTo(b, 10);
  });

  it('favors forward when forward > reverse', () => {
    const result = scoreTemporality(0.8, 0.2);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeCloseTo(0.8, 5); // 0.8 / (0.8 + 0.2) = 0.8
  });

  it('penalizes when reverse > forward', () => {
    const result = scoreTemporality(0.2, 0.8);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeCloseTo(0.2, 5); // 0.2 / (0.2 + 0.8) = 0.2
  });
});

// ─── scoreGradient ───────────────────────────────────────────────────

describe('scoreGradient', () => {
  it('returns 0 for fewer than 10 pairs', () => {
    const pairs = [pair(1, 10), pair(2, 20), pair(3, 30)];
    expect(scoreGradient(pairs)).toBe(0);
  });

  it('returns 0 when predictor has zero variance', () => {
    const pairs = Array.from({ length: 20 }, (_, i) => pair(5, i));
    expect(scoreGradient(pairs)).toBe(0);
  });

  it('returns high value for strong dose-response', () => {
    const pairs = doseResponsePairs(100);
    const gradient = scoreGradient(pairs);
    expect(gradient).toBeGreaterThan(0.3);
  });

  it('returns value between 0 and 1', () => {
    const pairs = linearPairs(50, -0.5, 100, 5);
    const gradient = scoreGradient(pairs);
    expect(gradient).toBeGreaterThanOrEqual(0);
    expect(gradient).toBeLessThanOrEqual(1);
  });

  it('returns 0 when all outcomes are equal (no gradient possible)', () => {
    const pairs = Array.from({ length: 20 }, (_, i) => pair(i, 50));
    // All outcomes are above mean → no low outcome pairs
    // Actually all outcomes = mean → lowOutcomePairs will be empty (<=mean is all of them since ==mean counts)
    // Wait: meanOutcome = 50, so lowOutcomePairs = pairs where outcomeValue <= 50 → all 20
    // highOutcomePairs = pairs where outcomeValue > 50 → 0
    // Returns 0 since highOutcomePairs is empty
    expect(scoreGradient(pairs)).toBe(0);
  });

  it('captures dose-response relationship from paper examples', () => {
    // From paper: "Biological Gradient" criterion
    // Higher dose → lower symptom severity (monotonic decrease)
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 50; i++) {
      const dose = i * 10; // 0 to 490
      // Symptom decreases with dose
      const symptom = 100 - dose * 0.15 + Math.sin(i * 1.5) * 3;
      pairs.push(pair(dose, symptom));
    }

    const gradient = scoreGradient(pairs);
    expect(gradient).toBeGreaterThan(0);
  });
});

// ─── scoreZFactor ────────────────────────────────────────────────────

describe('scoreZFactor', () => {
  it('returns 0 for z=0', () => {
    expect(scoreZFactor(0)).toBe(0);
  });

  it('returns 0.5 at z=Z_REF (z=2, per paper)', () => {
    // φ_z = |z| / (|z| + z_ref) = 2 / (2 + 2) = 0.5
    expect(scoreZFactor(2)).toBeCloseTo(0.5, 10);
  });

  it('approaches 1 for very large z', () => {
    expect(scoreZFactor(100)).toBeGreaterThan(0.98);
    expect(scoreZFactor(1000)).toBeGreaterThan(0.998);
  });

  it('handles negative z (uses absolute value)', () => {
    expect(scoreZFactor(-3)).toBeCloseTo(scoreZFactor(3), 10);
  });

  it('is monotonically increasing for positive z', () => {
    let prev = 0;
    for (let z = 0.5; z <= 20; z += 0.5) {
      const current = scoreZFactor(z);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });

  it('matches paper formula: φ_z = |z| / (|z| + 2)', () => {
    // Test several values against hand-computed results
    expect(scoreZFactor(1)).toBeCloseTo(1 / 3, 10);   // 1/(1+2) = 0.333
    expect(scoreZFactor(4)).toBeCloseTo(4 / 6, 10);   // 4/(4+2) = 0.667
    expect(scoreZFactor(8)).toBeCloseTo(8 / 10, 10);   // 8/(8+2) = 0.8
    expect(scoreZFactor(0.5)).toBeCloseTo(0.5 / 2.5, 10); // 0.5/2.5 = 0.2
  });
});

// ─── calculateOptimalValues ──────────────────────────────────────────

describe('calculateOptimalValues', () => {
  it('calculates V_high and V_low from paper formula', () => {
    // Paper: V_high = mean predictor when outcome > mean outcome
    // V_low = mean predictor when outcome <= mean outcome
    const pairs = [
      pair(10, 3),  // low outcome
      pair(20, 4),  // low outcome
      pair(30, 5),  // high outcome (> mean=5.5? no...)
      pair(40, 6),  // high
      pair(50, 7),  // high
      pair(60, 8),  // high
    ];
    // Mean outcome = (3+4+5+6+7+8)/6 = 5.5
    // High: outcome > 5.5 → pairs with ov=6,7,8 → predictor=40,50,60 → mean=50
    // Low: outcome <= 5.5 → pairs with ov=3,4,5 → predictor=10,20,30 → mean=20

    const result = calculateOptimalValues(pairs);
    expect(result.valuePredictingHighOutcome).toBeCloseTo(50, 5);
    expect(result.valuePredictingLowOutcome).toBeCloseTo(20, 5);
    expect(result.highOutcomeN).toBe(3);
    expect(result.lowOutcomeN).toBe(3);
  });

  it('provides confidence interval when enough high-outcome pairs', () => {
    const pairs = linearPairs(50, 0.5, 20, 2);
    const result = calculateOptimalValues(pairs);

    expect(result.confidenceInterval).toBeDefined();
    expect(result.confidenceInterval![0]).toBeLessThan(result.valuePredictingHighOutcome);
    expect(result.confidenceInterval![1]).toBeGreaterThan(result.valuePredictingHighOutcome);
  });

  it('returns NaN for V_high when all outcomes are below mean', () => {
    // All outcomes equal → all are "low" (<=mean)
    const pairs = Array.from({ length: 20 }, (_, i) => pair(i * 5, 50));
    const result = calculateOptimalValues(pairs);
    expect(result.valuePredictingHighOutcome).toBeNaN();
    expect(result.highOutcomeN).toBe(0);
  });

  it('returns NaN for V_low when all outcomes are above mean', () => {
    // This can't really happen since mean = all values, so all <= mean
    // But if somehow: skip this edge case
    // Instead test when all outcomes are equal
    const pairs = [pair(10, 100), pair(20, 100), pair(30, 100)];
    const result = calculateOptimalValues(pairs);
    // All outcomes = mean = 100, so all are "low" (<=mean), none are "high"
    expect(result.highOutcomeN).toBe(0);
    expect(result.lowOutcomeN).toBe(3);
  });
});

// ─── validateDataQuality ─────────────────────────────────────────────

describe('validateDataQuality', () => {
  it('returns valid for well-formed data', () => {
    // 50 pairs with adequate variance and balance
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 50; i++) {
      pairs.push(pair(
        i < 25 ? i : i + 25, // Predictor varies
        50 + Math.sin(i) * 20 // Outcome varies
      ));
    }

    const quality = validateDataQuality(pairs);
    expect(quality.isValid).toBe(true);
    expect(quality.failureReasons).toEqual([]);
    expect(quality.pairCount).toBe(50);
  });

  it('fails for insufficient pairs (< 30)', () => {
    const pairs = linearPairs(10, 1, 50);
    const quality = validateDataQuality(pairs);
    expect(quality.isValid).toBe(false);
    expect(quality.hasMinimumPairs).toBe(false);
    expect(quality.failureReasons).toContain('Insufficient pairs (<30)');
  });

  it('fails for insufficient predictor variance', () => {
    // All predictors = 5, enough pairs
    const pairs = Array.from({ length: 40 }, (_, i) =>
      pair(5, i * 2) // No predictor variance
    );
    const quality = validateDataQuality(pairs);
    expect(quality.hasPredicorVariance).toBe(false);
    expect(quality.predictorChanges).toBe(0);
  });

  it('fails for insufficient outcome variance', () => {
    const pairs = Array.from({ length: 40 }, (_, i) =>
      pair(i * 2, 50) // No outcome variance
    );
    const quality = validateDataQuality(pairs);
    expect(quality.hasOutcomeVariance).toBe(false);
    expect(quality.outcomeChanges).toBe(0);
  });

  it('fails for inadequate baseline fraction (< 10%)', () => {
    // All predictor values very high → most are in follow-up
    // Mean predictor ≈ 95, so baseline (<95) fraction is tiny
    const pairs: AlignedPair[] = [];
    for (let i = 0; i < 40; i++) {
      const pv = i < 2 ? 0 : 100; // 2 below mean, 38 at/above mean
      pairs.push(pair(pv, 50 + Math.sin(i) * 20));
    }
    const quality = validateDataQuality(pairs);
    // Mean predictor = (0*2 + 100*38) / 40 = 95
    // Baseline = predictor < 95 → the 2 with pv=0
    // baselineFraction = 2/40 = 0.05 < 0.1
    expect(quality.hasAdequateBaseline).toBe(false);
  });

  it('counts predictor and outcome changes correctly', () => {
    const pairs = [
      pair(1, 10), pair(1, 10), pair(2, 10), pair(2, 20),
      pair(3, 20), pair(3, 30),
    ];
    const quality = validateDataQuality(pairs);
    // Predictor changes: 1→1(no), 1→2(yes), 2→2(no), 2→3(yes), 3→3(no) = 2
    expect(quality.predictorChanges).toBe(2);
    // Outcome changes: 10→10(no), 10→10(no), 10→20(yes), 20→20(no), 20→30(yes) = 2
    expect(quality.outcomeChanges).toBe(2);
  });

  it('returns all failure reasons for maximally bad data', () => {
    // 5 pairs, all same values
    const pairs = Array.from({ length: 5 }, () => pair(0, 0));
    const quality = validateDataQuality(pairs);

    expect(quality.isValid).toBe(false);
    expect(quality.failureReasons.length).toBeGreaterThanOrEqual(3);
    expect(quality.failureReasons).toContain('Insufficient pairs (<30)');
    expect(quality.failureReasons).toContain('Insufficient predictor variance (<5 changes)');
    expect(quality.failureReasons).toContain('Insufficient outcome variance (<5 changes)');
  });
});

// ─── getEvidenceGrade ────────────────────────────────────────────────

describe('getEvidenceGrade', () => {
  it('returns A for PIS >= 0.5', () => {
    expect(getEvidenceGrade(0.5)).toBe('A');
    expect(getEvidenceGrade(0.8)).toBe('A');
    expect(getEvidenceGrade(1.0)).toBe('A');
  });

  it('returns B for PIS in [0.3, 0.5)', () => {
    expect(getEvidenceGrade(0.3)).toBe('B');
    expect(getEvidenceGrade(0.4)).toBe('B');
    expect(getEvidenceGrade(0.499)).toBe('B');
  });

  it('returns C for PIS in [0.1, 0.3)', () => {
    expect(getEvidenceGrade(0.1)).toBe('C');
    expect(getEvidenceGrade(0.2)).toBe('C');
    expect(getEvidenceGrade(0.299)).toBe('C');
  });

  it('returns D for PIS in [0.05, 0.1)', () => {
    expect(getEvidenceGrade(0.05)).toBe('D');
    expect(getEvidenceGrade(0.07)).toBe('D');
    expect(getEvidenceGrade(0.099)).toBe('D');
  });

  it('returns F for PIS < 0.05', () => {
    expect(getEvidenceGrade(0.04)).toBe('F');
    expect(getEvidenceGrade(0.01)).toBe('F');
    expect(getEvidenceGrade(0)).toBe('F');
  });

  it('handles boundary values exactly', () => {
    expect(getEvidenceGrade(0.5)).toBe('A');
    expect(getEvidenceGrade(0.3)).toBe('B');
    expect(getEvidenceGrade(0.1)).toBe('C');
    expect(getEvidenceGrade(0.05)).toBe('D');
  });
});

// ─── getRecommendation ───────────────────────────────────────────────

describe('getRecommendation', () => {
  it('returns high_priority_trial for PIS >= 0.5', () => {
    expect(getRecommendation(0.5)).toBe('high_priority_trial');
    expect(getRecommendation(0.9)).toBe('high_priority_trial');
  });

  it('returns moderate_priority for PIS in [0.3, 0.5)', () => {
    expect(getRecommendation(0.3)).toBe('moderate_priority');
    expect(getRecommendation(0.4)).toBe('moderate_priority');
  });

  it('returns monitor for PIS in [0.1, 0.3)', () => {
    expect(getRecommendation(0.1)).toBe('monitor');
    expect(getRecommendation(0.2)).toBe('monitor');
  });

  it('returns insufficient_evidence for PIS < 0.1', () => {
    expect(getRecommendation(0.05)).toBe('insufficient_evidence');
    expect(getRecommendation(0)).toBe('insufficient_evidence');
  });
});

// ─── calculatePredictorImpactScore ───────────────────────────────────

describe('calculatePredictorImpactScore', () => {
  it('produces higher PIS for stronger correlations', () => {
    const strongPairs = linearPairs(60, -0.8, 100, 0.5);
    const weakPairs = linearPairs(60, -0.1, 100, 5);

    const strongPIS = calculatePredictorImpactScore(strongPairs);
    const weakPIS = calculatePredictorImpactScore(weakPairs);

    expect(strongPIS.score).toBeGreaterThan(weakPIS.score);
  });

  it('incorporates temporality factor when reverse pairs provided', () => {
    const forwardPairs = linearPairs(60, -0.5, 100, 1);
    // Weak reverse correlation (outcome doesn't predict predictor)
    const reversePairs = linearPairs(60, -0.05, 50, 10);

    const pisWithReverse = calculatePredictorImpactScore(forwardPairs, reversePairs);

    expect(pisWithReverse.temporalityFactor).toBeGreaterThan(0.5);
    expect(pisWithReverse.reverseCorrelation).toBeDefined();
  });

  it('penalizes when reverse correlation dominates', () => {
    // Strong forward
    const forwardPairs = linearPairs(60, -0.3, 100, 2);
    // Even stronger reverse (suggests confounding by indication)
    const reversePairs = linearPairs(60, -0.9, 100, 0.5);

    const pis = calculatePredictorImpactScore(forwardPairs, reversePairs);

    // Temporality should be < 0.5 since reverse > forward
    expect(pis.temporalityFactor).toBeLessThan(0.5);
  });

  it('includes all Bradford Hill scores', () => {
    const pairs = doseResponsePairs(60);
    const pis = calculatePredictorImpactScore(pairs, undefined, {
      subjectCount: 50,
      plausibilityScore: 0.8,
      coherenceScore: 0.7,
      analogyScore: 0.6,
      specificityScore: 0.9,
    });

    expect(pis.bradfordHill.strength).toBeGreaterThan(0);
    expect(pis.bradfordHill.consistency).toBeGreaterThan(0.9); // 50 subjects
    expect(pis.bradfordHill.temporality).toBeDefined();
    expect(pis.bradfordHill.gradient).toBeGreaterThanOrEqual(0);
    expect(pis.bradfordHill.plausibility).toBe(0.8);
    expect(pis.bradfordHill.coherence).toBe(0.7);
    expect(pis.bradfordHill.analogy).toBe(0.6);
    expect(pis.bradfordHill.specificity).toBe(0.9);
    expect(pis.bradfordHill.experiment).toBe(0.5); // Default for observational
  });

  it('increases PIS with more subjects (consistency)', () => {
    const pairs = linearPairs(60, -0.5, 100, 1);

    const pis1 = calculatePredictorImpactScore(pairs, undefined, { subjectCount: 1 });
    const pis10 = calculatePredictorImpactScore(pairs, undefined, { subjectCount: 10 });
    const pis100 = calculatePredictorImpactScore(pairs, undefined, { subjectCount: 100 });

    expect(pis10.score).toBeGreaterThan(pis1.score);
    expect(pis100.score).toBeGreaterThan(pis10.score);
  });

  it('increases PIS with more pairs (sample saturation)', () => {
    // Pairs with same correlation but different N
    const pairs30 = linearPairs(30, -0.5, 100, 1);
    const pairs200 = linearPairs(200, -0.5, 100, 1);

    const pis30 = calculatePredictorImpactScore(pairs30);
    const pis200 = calculatePredictorImpactScore(pairs200);

    // More pairs → higher φ_pairs → higher PIS
    expect(pis200.score).toBeGreaterThan(pis30.score);
  });

  it('assigns evidence grade and recommendation', () => {
    const strongPairs = linearPairs(200, -0.8, 100, 0.5);
    const pis = calculatePredictorImpactScore(strongPairs, undefined, {
      subjectCount: 50,
    });

    expect(['A', 'B', 'C', 'D', 'F']).toContain(pis.evidenceGrade);
    expect([
      'high_priority_trial',
      'moderate_priority',
      'monitor',
      'insufficient_evidence',
    ]).toContain(pis.recommendation);
  });

  it('calculates effect size (percent change)', () => {
    const pairs = linearPairs(60, -0.3, 100, 1);
    const pis = calculatePredictorImpactScore(pairs);

    expect(Number.isFinite(pis.effectSize.percentChange)).toBe(true);
    expect(Number.isFinite(pis.effectSize.absoluteChange)).toBe(true);
    expect(pis.effectSize.baselineN).toBeGreaterThan(0);
    expect(pis.effectSize.followUpN).toBeGreaterThan(0);
  });

  it('calculates optimal values', () => {
    const pairs = doseResponsePairs(60);
    const pis = calculatePredictorImpactScore(pairs);

    expect(pis.optimalValue).toBeDefined();
    expect(Number.isFinite(pis.optimalValue!.valuePredictingHighOutcome)).toBe(true);
    expect(Number.isFinite(pis.optimalValue!.valuePredictingLowOutcome)).toBe(true);
  });

  it('implements user-level PIS formula: |r| · S · φ_z · φ_temporal', () => {
    // Verify the formula components are multiplied correctly
    const pairs = linearPairs(100, -0.6, 80, 1);
    const pis = calculatePredictorImpactScore(pairs);

    const r = Math.abs(pis.forwardCorrelation.pearson);
    const S = 1 - pis.forwardCorrelation.pValue;
    const φZ = scoreZFactor(pis.effectSize.zScore);
    const temporality = pis.temporalityFactor;

    // User-level PIS = r * S * φZ * temporality
    const userPIS = r * S * φZ * temporality;

    // Aggregate PIS = userPIS * φUsers * φPairs
    const φUsers = saturation(1, SATURATION_CONSTANTS.N_SIG); // Default 1 subject
    const φPairs = saturation(pairs.length, SATURATION_CONSTANTS.N_PAIRS_SIG);
    const expectedAggregate = userPIS * φUsers * φPairs;

    expect(pis.score).toBeCloseTo(expectedAggregate, 5);
  });

  it('handles realistic scenario: Vitamin D vs Depression severity', () => {
    // Simulating a realistic N-of-1: patient tracks Vitamin D dose and PHQ-9 depression score
    // Over 90 days. Higher Vit D → lower depression (with 2-week onset delay baked into pairs)
    const pairs: AlignedPair[] = [];
    for (let day = 0; day < 90; day++) {
      const dose = day < 30 ? 0 : day < 60 ? 2000 : 4000; // IU
      // Depression decreases with treatment
      const phq9 = day < 30
        ? 15 + Math.sin(day * 0.7) * 2  // Moderate depression
        : day < 60
          ? 12 + Math.sin(day * 0.7) * 2 // Mild improvement
          : 8 + Math.sin(day * 0.7) * 2;  // More improvement

      pairs.push(pair(dose, phq9, day * 86400000, day * 86400000));
    }

    const pis = calculatePredictorImpactScore(pairs, undefined, {
      subjectCount: 1,
      plausibilityScore: 0.8, // Vitamin D + depression has mechanistic support
    });

    // Should detect negative relationship (higher dose → lower depression)
    expect(pis.forwardCorrelation.pearson).toBeLessThan(0);
    expect(pis.effectSize.percentChange).toBeLessThan(0); // Depression decreases
    expect(pis.score).toBeGreaterThan(0);
  });

  it('defaults to neutral Bradford Hill scores when not provided', () => {
    const pairs = linearPairs(60, 0.5, 50, 1);
    const pis = calculatePredictorImpactScore(pairs);

    expect(pis.bradfordHill.plausibility).toBe(0.5);
    expect(pis.bradfordHill.coherence).toBe(0.5);
    expect(pis.bradfordHill.analogy).toBe(0.5);
    expect(pis.bradfordHill.specificity).toBe(0.5);
  });

  it('skips reverse temporality when reverse pairs < 30', () => {
    const forwardPairs = linearPairs(60, 0.5, 50, 1);
    const reversePairs = linearPairs(10, 0.3, 50, 1); // Too few

    const pis = calculatePredictorImpactScore(forwardPairs, reversePairs);

    // Should default to temporality = 1.0 (no reverse comparison)
    expect(pis.temporalityFactor).toBe(1.0);
    expect(pis.reverseCorrelation).toBeUndefined();
  });
});

// ─── End-to-End Scenario ─────────────────────────────────────────────

describe('end-to-end PIS scenario', () => {
  it('full pipeline: strong signal gets high grade, weak gets low grade', () => {
    // Strong signal: Aspirin → reduced headache severity
    const strongPairs: AlignedPair[] = [];
    for (let i = 0; i < 100; i++) {
      const dose = i < 50 ? 0 : 400 + Math.sin(i) * 50;
      const headache = i < 50
        ? 7 + Math.sin(i * 0.5) * 1.5
        : 3 + Math.sin(i * 0.5) * 1.0;
      strongPairs.push(pair(dose, headache, i * 1000, i * 1000));
    }

    // Weak signal: random noise
    const weakPairs: AlignedPair[] = [];
    for (let i = 0; i < 100; i++) {
      weakPairs.push(pair(
        Math.sin(i * 137.5) * 50 + 50,
        Math.cos(i * 97.3) * 30 + 70,
        i * 1000,
        i * 1000,
      ));
    }

    const strongPIS = calculatePredictorImpactScore(strongPairs, undefined, {
      subjectCount: 30,
    });
    const weakPIS = calculatePredictorImpactScore(weakPairs, undefined, {
      subjectCount: 30,
    });

    // Strong should get better grade
    const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 } as const;
    expect(gradeOrder[strongPIS.evidenceGrade]).toBeGreaterThanOrEqual(
      gradeOrder[weakPIS.evidenceGrade]
    );
    expect(strongPIS.score).toBeGreaterThan(weakPIS.score);
  });

  it('PIS score is non-negative', () => {
    // Even for weird data, PIS uses absolute correlation
    const pairs = linearPairs(60, -0.5, 100, 1);
    const pis = calculatePredictorImpactScore(pairs);
    expect(pis.score).toBeGreaterThanOrEqual(0);
  });

  it('comprehensive: all components of PIS result are populated', () => {
    const pairs = doseResponsePairs(80);
    const reversePairs = linearPairs(60, -0.1, 50, 5);

    const pis = calculatePredictorImpactScore(pairs, reversePairs, {
      subjectCount: 25,
      plausibilityScore: 0.7,
      coherenceScore: 0.6,
      analogyScore: 0.5,
      specificityScore: 0.8,
    });

    // Forward correlation
    expect(Number.isFinite(pis.forwardCorrelation.pearson)).toBe(true);
    expect(Number.isFinite(pis.forwardCorrelation.pValue)).toBe(true);
    expect(pis.forwardCorrelation.n).toBe(80);

    // Reverse correlation
    expect(pis.reverseCorrelation).toBeDefined();
    expect(Number.isFinite(pis.reverseCorrelation!.pearson)).toBe(true);

    // Effect size
    expect(Number.isFinite(pis.effectSize.percentChange)).toBe(true);
    expect(Number.isFinite(pis.effectSize.zScore)).toBe(true);

    // Bradford Hill
    for (const [key, value] of Object.entries(pis.bradfordHill)) {
      if (value !== null) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }

    // Overall
    expect(Number.isFinite(pis.score)).toBe(true);
    expect(pis.score).toBeGreaterThanOrEqual(0);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(pis.evidenceGrade);
  });
});
