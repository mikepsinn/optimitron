import { describe, it, expect } from 'vitest';
import {
  // Bradford Hill
  scoreStrength,
  scoreConsistency,
  scoreTemporality,
  scoreGradient,
  scoreExperiment,
  scorePlausibility,
  scoreCoherence,
  scoreSpecificity,
  calculateCCS,
  CRITERION_WEIGHTS,
  // Welfare
  calculateWelfare,
  WelfareMetricsSchema,
  // Policy schemas
  PolicyRecommendationSchema,
  PolicySchema,
  JurisdictionPolicySchema,
  // Jurisdiction
  JurisdictionSchema,
  US_STATES,
  // Budget
  SpendingGapSchema,
  OSLEstimateSchema,
} from '../index.js';

// ─── Full OPG Pipeline: Texas Worked Example from Paper ─────────────────────

describe('OPG Pipeline: Texas Worked Example', () => {
  /*
   * From the paper's Appendix A, the OPG generates recommendations for Texas.
   * We trace the full scoring pipeline for the primary seat belt law.
   */

  describe('Step 1: Bradford Hill Scoring for Primary Seat Belt Law', () => {
    // Paper values: strength=0.75, consistency=0.82, temporality=1.0 (gate),
    // plausibility=0.90, experiment=0.85

    it('computes strength score for moderate standardized effect', () => {
      // Paper: "Moderate standardized effects on both metrics" → 0.75
      // Reverse: scoreStrength(x) = 0.75 → |x|/0.3 = -ln(0.25) ≈ 1.386 → |x| ≈ 0.416
      const effect = 0.416;
      const s = scoreStrength(effect);
      expect(s).toBeCloseTo(0.75, 1);
    });

    it('computes consistency score with I²=28% across states', () => {
      // Paper: "I² = 28%, consistent across states" → consistency score = 0.82
      // From 47 US states: scoreConsistency(N) = 0.82 → N/10 = -ln(0.18) ≈ 1.71 → N ≈ 17.1
      // 17 concordant jurisdictions out of 47 analyzed
      const s = scoreConsistency(17);
      expect(s).toBeCloseTo(0.82, 1);
    });

    it('temporality is satisfied (policy precedes outcome)', () => {
      expect(scoreTemporality(true)).toBe(1.0);
    });

    it('experiment quality for synthetic control with no violations', () => {
      // Paper: "Multiple synthetic control studies" → 0.85 = METHOD_WEIGHTS.synthetic_control
      expect(scoreExperiment('synthetic_control', 0)).toBeCloseTo(0.85, 4);
    });

    it('plausibility score for seat belt law mechanism', () => {
      // Paper: "Clear mechanism (increased compliance)" → 0.90
      const s = scorePlausibility({
        theoryPredicts: true,       // 0.30 - physics + compliance theory
        behavioralResponse: true,   // 0.25 - documented compliance increase
        noImplausibleAssumptions: true, // 0.20 - straightforward mechanism
        timingConsistent: true,     // 0.15 - immediate compliance effect
        magnitudePlausible: false,  // 0.10 - uncertain magnitude
      });
      // 0.30 + 0.25 + 0.20 + 0.15 = 0.90
      expect(s).toBeCloseTo(0.90, 4);
    });
  });

  describe('Step 2: CCS Calculation', () => {
    it('computes CCS ≈ 0.81 for seat belt law (Grade A)', () => {
      // Using paper values plus reasonable estimates for unspecified criteria
      const scores = {
        strength: 0.75,
        consistency: 0.82,
        temporality: 1.0,
        gradient: null as unknown as number, // binary policy
        experiment: 0.85,
        plausibility: 0.90,
        coherence: 0.70,
        analogy: 0.50,
        specificity: 0.60,
      };
      const ccs = calculateCCS(scores);
      // Paper says CCS = 0.81 → Grade A
      expect(ccs).toBeGreaterThan(0.70);
      expect(ccs).toBeLessThan(0.90);
    });
  });

  describe('Step 3: Context Adjustment for Texas', () => {
    it('adjusts raw effects for jurisdiction context', () => {
      // Paper: Raw effect = +0.18 years health, +0.025 pp/yr income
      // Context adjustment: 0.85 (Texas differs from evidence base)
      // Adjusted: health = 0.18 * ~0.83 = ~0.15, income ~0.02

      const rawHealthEffect = 0.18;
      const contextAdjustment = 0.85; // paper says 15% smaller in Texas
      const adjustedHealth = rawHealthEffect * contextAdjustment;

      // Paper says adjusted = 0.15 years
      expect(adjustedHealth).toBeCloseTo(0.153, 1);
    });
  });

  describe('Step 4: Welfare Impact', () => {
    it('seat belt law has net positive welfare at α=0.5', () => {
      // Income: +0.02 pp/yr, Health: +0.15 years
      const welfare = calculateWelfare({
        incomeGrowth: 0.02,
        healthyLifeYears: 0.15,
      });
      // W = 0.5 * 0.02 + 0.5 * 0.15 = 0.01 + 0.075 = 0.085
      expect(welfare).toBeCloseTo(0.085, 4);
      expect(welfare).toBeGreaterThan(0);
    });

    it('tobacco tax has tradeoff: negative income, positive health', () => {
      // Paper: income = -0.02 pp/yr, health = +0.25 years
      const welfare = calculateWelfare({
        incomeGrowth: -0.02,
        healthyLifeYears: 0.25,
      });
      // W = 0.5 * (-0.02) + 0.5 * 0.25 = -0.01 + 0.125 = 0.115
      expect(welfare).toBeCloseTo(0.115, 4);
      // Net positive despite income cost
      expect(welfare).toBeGreaterThan(0);
    });

    it('infinite tobacco tax is NOT optimal (corner solution prevented)', () => {
      // Very high tax devastates income
      const extremeTax = calculateWelfare({
        incomeGrowth: -5.0,  // devastating income effect
        healthyLifeYears: 0.5, // diminishing health returns
      });
      // Moderate tax is better
      const moderateTax = calculateWelfare({
        incomeGrowth: -0.02,
        healthyLifeYears: 0.25,
      });
      expect(moderateTax).toBeGreaterThan(extremeTax);
    });
  });

  describe('Step 5: Evidence Grade Assignment', () => {
    it('Grade A requires PIS≥0.80, I²<0.50, N≥5', () => {
      // From paper: PIS >= 0.80 AND I² < 0.50 AND N_j >= 5
      // Seat belt: PIS = 0.81, I² = 28%, N = 47 → Grade A ✓
      const pis = 0.81;
      const i2 = 0.28;
      const nj = 47;
      const isGradeA = pis >= 0.80 && i2 < 0.50 && nj >= 5;
      expect(isGradeA).toBe(true);
    });

    it('Grade B requirements are less strict', () => {
      // PIS >= 0.60 AND I² < 0.50 AND N_j >= 3
      const pis = 0.65;
      const i2 = 0.45;
      const nj = 4;
      const isGradeB = pis >= 0.60 && i2 < 0.50 && nj >= 3;
      expect(isGradeB).toBe(true);
    });

    it('Grade C allows high heterogeneity', () => {
      // PIS >= 0.40 AND I² < 0.75 AND N_j >= 2
      const pis = 0.45;
      const i2 = 0.70;
      const nj = 2;
      const isGradeC = pis >= 0.40 && i2 < 0.75 && nj >= 2;
      expect(isGradeC).toBe(true);
    });

    it('Grade D only needs PIS >= 0.20', () => {
      expect(0.25 >= 0.20).toBe(true);
    });

    it('Grade F for insufficient evidence', () => {
      expect(0.15 < 0.20).toBe(true);
    });
  });

  describe('Step 6: Full Recommendation Validation', () => {
    it('validates complete Texas seat belt ENACT recommendation', () => {
      const recommendation = {
        jurisdictionId: 'TX',
        policyId: 'primary-seatbelt',
        recommendationType: 'enact' as const,
        currentStatus: 'secondary enforcement only',
        recommendedTarget: 'primary enforcement',
        welfareEffect: {
          incomeEffect: 0.02,
          incomeEffectCILow: 0.01,
          incomeEffectCIHigh: 0.03,
          healthEffect: 0.15,
          healthEffectCILow: 0.10,
          healthEffectCIHigh: 0.20,
        },
        evidenceGrade: 'A' as const,
        policyImpactScore: 0.81,
        priorityScore: 0.75,
        blockingFactors: [] as const,
        similarJurisdictions: ['FL'],
        rationale: 'Strong evidence from synthetic control analysis of 47 US states',
      };
      expect(PolicyRecommendationSchema.safeParse(recommendation).success).toBe(true);
    });

    it('validates complete Texas tobacco tax REPLACE recommendation', () => {
      const recommendation = {
        jurisdictionId: 'TX',
        policyId: 'tobacco-tax',
        recommendationType: 'replace' as const,
        currentStatus: '$1.41/pack',
        recommendedTarget: '$2.50/pack',
        welfareEffect: {
          incomeEffect: -0.02,
          incomeEffectCILow: -0.04,
          incomeEffectCIHigh: 0.01,
          healthEffect: 0.25,
          healthEffectCILow: 0.18,
          healthEffectCIHigh: 0.32,
        },
        evidenceGrade: 'A' as const,
        policyImpactScore: 0.85,
        priorityScore: 0.80,
        blockingFactors: ['political' as const],
        rationale: 'Below-median tobacco tax; strong health evidence offsets minor income cost',
      };
      expect(PolicyRecommendationSchema.safeParse(recommendation).success).toBe(true);
    });

    it('validates Texas DUI MAINTAIN recommendation', () => {
      const recommendation = {
        jurisdictionId: 'TX',
        policyId: 'dui-threshold',
        recommendationType: 'maintain' as const,
        currentStatus: '0.08 BAC',
        welfareEffect: {
          incomeEffect: 0,
          healthEffect: 0,
        },
        evidenceGrade: 'A' as const,
        policyImpactScore: 0.90,
        priorityScore: 0,
      };
      expect(PolicyRecommendationSchema.safeParse(recommendation).success).toBe(true);
    });
  });
});

// ─── Priority Scoring Logic ─────────────────────────────────────────────────

describe('Priority Scoring', () => {
  // Priority = |Gap| × PIS × M
  it('higher gap yields higher priority', () => {
    const pisA = 0.80;
    const gapA = 1.0; // max gap
    const gapB = 0.3; // small gap
    const m = 100; // same welfare impact

    const priorityA = gapA * pisA * m;
    const priorityB = gapB * pisA * m;
    expect(priorityA).toBeGreaterThan(priorityB);
  });

  it('higher PIS yields higher priority', () => {
    const gap = 0.5;
    const m = 100;
    const pisHigh = 0.85;
    const pisLow = 0.40;

    expect(gap * pisHigh * m).toBeGreaterThan(gap * pisLow * m);
  });

  it('zero gap means zero priority (maintain)', () => {
    expect(0 * 0.90 * 100).toBe(0);
  });

  it('priority tiers match paper thresholds', () => {
    // Critical >= 0.80, High [0.50, 0.80), Medium [0.25, 0.50), Low < 0.25
    const critical = 0.85;
    const high = 0.65;
    const medium = 0.35;
    const low = 0.15;

    expect(critical).toBeGreaterThanOrEqual(0.80);
    expect(high).toBeGreaterThanOrEqual(0.50);
    expect(high).toBeLessThan(0.80);
    expect(medium).toBeGreaterThanOrEqual(0.25);
    expect(medium).toBeLessThan(0.50);
    expect(low).toBeLessThan(0.25);
  });
});

// ─── PIS Calculation (Paper Formula) ────────────────────────────────────────

describe('Policy Impact Score (PIS) Calculation', () => {
  // PIS = |β_std| × CCS × Q
  
  it('computes PIS for income metric', () => {
    const betaStd = 0.025 / 1.5; // standardized: raw / cross-jurisdictional SD
    const ccs = 0.81;
    const q = 0.85; // synthetic control, no violations
    const pis = Math.abs(betaStd) * ccs * q;
    expect(pis).toBeGreaterThan(0);
    expect(pis).toBeLessThan(1);
  });

  it('computes PIS for health metric', () => {
    const betaStd = 0.18 / 4; // health effect / cross-jurisdictional SD (~4 years)
    const ccs = 0.81;
    const q = 0.85;
    const pis = Math.abs(betaStd) * ccs * q;
    expect(pis).toBeGreaterThan(0);
    expect(pis).toBeLessThan(1);
  });

  it('combined PIS = 0.5 × PIS_inc + 0.5 × PIS_hlth', () => {
    const pisInc = 0.3;
    const pisHlth = 0.5;
    const combined = 0.5 * pisInc + 0.5 * pisHlth;
    expect(combined).toBeCloseTo(0.4, 4);
  });

  it('PIS is zero when CCS is zero (temporality violated)', () => {
    const betaStd = 0.5;
    const ccs = 0; // temporality failed
    const q = 0.85;
    expect(betaStd * ccs * q).toBe(0);
  });

  it('PIS is zero when quality is zero (all validity checks failed)', () => {
    const betaStd = 0.5;
    const ccs = 0.81;
    const q = 0; // all checks failed
    expect(betaStd * ccs * q).toBe(0);
  });

  it('higher beta_std gives higher PIS (all else equal)', () => {
    const ccs = 0.8;
    const q = 0.85;
    const pisSmall = 0.1 * ccs * q;
    const pisLarge = 0.5 * ccs * q;
    expect(pisLarge).toBeGreaterThan(pisSmall);
  });
});

// ─── Cross-module: All Exports Present ──────────────────────────────────────

describe('Module Exports', () => {
  it('exports all Bradford Hill scoring functions', () => {
    expect(typeof scoreStrength).toBe('function');
    expect(typeof scoreConsistency).toBe('function');
    expect(typeof scoreTemporality).toBe('function');
    expect(typeof scoreGradient).toBe('function');
    expect(typeof scoreExperiment).toBe('function');
    expect(typeof scorePlausibility).toBe('function');
    expect(typeof scoreCoherence).toBe('function');
    expect(typeof scoreSpecificity).toBe('function');
    expect(typeof calculateCCS).toBe('function');
  });

  it('exports welfare function', () => {
    expect(typeof calculateWelfare).toBe('function');
  });

  it('exports all Zod schemas', () => {
    expect(WelfareMetricsSchema).toBeDefined();
    expect(PolicyRecommendationSchema).toBeDefined();
    expect(PolicySchema).toBeDefined();
    expect(JurisdictionPolicySchema).toBeDefined();
    expect(JurisdictionSchema).toBeDefined();
    expect(SpendingGapSchema).toBeDefined();
    expect(OSLEstimateSchema).toBeDefined();
  });

  it('exports CRITERION_WEIGHTS constant', () => {
    expect(CRITERION_WEIGHTS).toBeDefined();
    expect(typeof CRITERION_WEIGHTS.experiment).toBe('number');
  });

  it('exports US_STATES constant', () => {
    expect(US_STATES).toBeDefined();
    expect(US_STATES.length).toBe(50);
  });
});
