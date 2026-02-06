import { describe, it, expect } from 'vitest';
import {
  calculateWelfare,
  WelfareMetricsSchema,
  WelfareFunctionConfigSchema,
  WelfareEffectSchema,
  type WelfareMetrics,
  type WelfareFunctionConfig,
  type WelfareEffect,
} from '../welfare.js';

// ─── calculateWelfare ───────────────────────────────────────────────────────

describe('calculateWelfare', () => {
  it('computes W = α×income + (1-α)×health with default α=0.5', () => {
    // W = 0.5 * 2.0 + 0.5 * 70 = 1.0 + 35.0 = 36.0
    expect(calculateWelfare({ incomeGrowth: 2.0, healthyLifeYears: 70 })).toBeCloseTo(36.0, 5);
  });

  it('with α=1.0, returns income only', () => {
    expect(calculateWelfare(
      { incomeGrowth: 3.0, healthyLifeYears: 65 },
      { alpha: 1.0 }
    )).toBeCloseTo(3.0, 5);
  });

  it('with α=0.0, returns health only', () => {
    expect(calculateWelfare(
      { incomeGrowth: 3.0, healthyLifeYears: 65 },
      { alpha: 0.0 }
    )).toBeCloseTo(65, 5);
  });

  it('handles zero income and health', () => {
    expect(calculateWelfare({ incomeGrowth: 0, healthyLifeYears: 0 })).toBe(0);
  });

  it('handles negative income growth', () => {
    // W = 0.5 * (-1.5) + 0.5 * 72 = -0.75 + 36 = 35.25
    expect(calculateWelfare({ incomeGrowth: -1.5, healthyLifeYears: 72 })).toBeCloseTo(35.25, 5);
  });

  it('handles negative health years (edge case)', () => {
    // W = 0.5 * 2 + 0.5 * (-5) = 1 - 2.5 = -1.5
    expect(calculateWelfare({ incomeGrowth: 2, healthyLifeYears: -5 })).toBeCloseTo(-1.5, 5);
  });

  it('linear in both metrics', () => {
    const base = calculateWelfare({ incomeGrowth: 1, healthyLifeYears: 50 });
    const doubled = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 100 });
    expect(doubled).toBeCloseTo(base * 2, 5);
  });

  it('α=0.7 weights income more heavily', () => {
    const metrics: WelfareMetrics = { incomeGrowth: 4.0, healthyLifeYears: 60 };
    // W = 0.7 * 4 + 0.3 * 60 = 2.8 + 18.0 = 20.8
    expect(calculateWelfare(metrics, { alpha: 0.7 })).toBeCloseTo(20.8, 5);
  });

  it('welfare increases when either metric improves (holding other constant)', () => {
    const base = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 70 });
    const betterIncome = calculateWelfare({ incomeGrowth: 3, healthyLifeYears: 70 });
    const betterHealth = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 75 });
    expect(betterIncome).toBeGreaterThan(base);
    expect(betterHealth).toBeGreaterThan(base);
  });

  it('uses default config when not provided', () => {
    const withDefault = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 70 });
    const explicit = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 70 }, { alpha: 0.5 });
    expect(withDefault).toBeCloseTo(explicit, 10);
  });

  // Paper-relevant: the OPG paper says α=0.5 default, equal weighting
  it('at α=0.5, equal improvement in income and health contribute equally', () => {
    const incomeUp = calculateWelfare({ incomeGrowth: 3, healthyLifeYears: 70 }) -
                     calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 70 });
    const healthUp = calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 71 }) -
                     calculateWelfare({ incomeGrowth: 2, healthyLifeYears: 70 });
    // Both should be 0.5 (since α=0.5 and both increase by 1 unit)
    expect(incomeUp).toBeCloseTo(0.5, 5);
    expect(healthUp).toBeCloseTo(0.5, 5);
  });
});

// ─── WelfareMetricsSchema ───────────────────────────────────────────────────

describe('WelfareMetricsSchema', () => {
  it('validates correct input', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 2.5,
      healthyLifeYears: 72.3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing incomeGrowth', () => {
    const result = WelfareMetricsSchema.safeParse({
      healthyLifeYears: 72,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing healthyLifeYears', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects string values', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 'high',
      healthyLifeYears: 72,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero values', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 0,
      healthyLifeYears: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative values', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: -2.0,
      healthyLifeYears: -1.0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty object', () => {
    const result = WelfareMetricsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── WelfareFunctionConfigSchema ────────────────────────────────────────────

describe('WelfareFunctionConfigSchema', () => {
  it('validates alpha in [0, 1]', () => {
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 0 }).success).toBe(true);
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 0.5 }).success).toBe(true);
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 1 }).success).toBe(true);
  });

  it('rejects alpha < 0', () => {
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: -0.1 }).success).toBe(false);
  });

  it('rejects alpha > 1', () => {
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 1.1 }).success).toBe(false);
  });

  it('uses default alpha=0.5 when not provided', () => {
    const result = WelfareFunctionConfigSchema.parse({});
    expect(result.alpha).toBe(0.5);
  });
});

// ─── WelfareEffectSchema ────────────────────────────────────────────────────

describe('WelfareEffectSchema', () => {
  it('validates full welfare effect with CIs', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: 0.02,
      incomeEffectCILow: 0.01,
      incomeEffectCIHigh: 0.03,
      healthEffect: 0.15,
      healthEffectCILow: 0.10,
      healthEffectCIHigh: 0.20,
    });
    expect(result.success).toBe(true);
  });

  it('validates welfare effect without optional CIs', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: -0.02,
      healthEffect: 0.25,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing incomeEffect', () => {
    const result = WelfareEffectSchema.safeParse({
      healthEffect: 0.15,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing healthEffect', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: 0.02,
    });
    expect(result.success).toBe(false);
  });

  it('accepts negative effects (e.g., tobacco tax income impact)', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: -0.02,
      healthEffect: 0.25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incomeEffect).toBe(-0.02);
      expect(result.data.healthEffect).toBe(0.25);
    }
  });

  it('accepts zero effects', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: 0,
      healthEffect: 0,
    });
    expect(result.success).toBe(true);
  });
});
