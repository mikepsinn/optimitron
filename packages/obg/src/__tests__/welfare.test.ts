import { describe, it, expect } from 'vitest';
import {
  calculateWelfare,
  WelfareMetricsSchema,
  WelfareFunctionConfigSchema,
  WelfareEffectSchema,
  type WelfareMetrics,
  type WelfareFunctionConfig,
} from '../welfare.js';

// ========================== calculateWelfare ================================

describe('calculateWelfare', () => {
  it('computes W = 0.5 × IncomeGrowth + 0.5 × HealthyYears by default', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: 2.0,       // 2 pp/year
      healthyLifeYears: 70.0,  // 70 years
    };
    // W = 0.5 × 2.0 + 0.5 × 70.0 = 1.0 + 35.0 = 36.0
    expect(calculateWelfare(metrics)).toBe(36.0);
  });

  it('uses custom alpha weight', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: 4.0,
      healthyLifeYears: 80.0,
    };
    const config: WelfareFunctionConfig = { alpha: 0.3 };
    // W = 0.3 × 4.0 + 0.7 × 80.0 = 1.2 + 56.0 = 57.2
    expect(calculateWelfare(metrics, config)).toBeCloseTo(57.2, 10);
  });

  it('alpha = 1.0 weights only income', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: 3.0,
      healthyLifeYears: 75.0,
    };
    expect(calculateWelfare(metrics, { alpha: 1.0 })).toBe(3.0);
  });

  it('alpha = 0.0 weights only health', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: 3.0,
      healthyLifeYears: 75.0,
    };
    expect(calculateWelfare(metrics, { alpha: 0.0 })).toBe(75.0);
  });

  it('handles zero metrics', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: 0,
      healthyLifeYears: 0,
    };
    expect(calculateWelfare(metrics)).toBe(0);
  });

  it('handles negative income growth (recession)', () => {
    const metrics: WelfareMetrics = {
      incomeGrowth: -2.0,
      healthyLifeYears: 70.0,
    };
    // W = 0.5 × (-2.0) + 0.5 × 70.0 = -1.0 + 35.0 = 34.0
    expect(calculateWelfare(metrics)).toBe(34.0);
  });

  it('welfare improves when either metric improves', () => {
    const baseline: WelfareMetrics = { incomeGrowth: 2.0, healthyLifeYears: 70.0 };
    const betterIncome: WelfareMetrics = { incomeGrowth: 3.0, healthyLifeYears: 70.0 };
    const betterHealth: WelfareMetrics = { incomeGrowth: 2.0, healthyLifeYears: 72.0 };

    expect(calculateWelfare(betterIncome)).toBeGreaterThan(calculateWelfare(baseline));
    expect(calculateWelfare(betterHealth)).toBeGreaterThan(calculateWelfare(baseline));
  });
});

// =========================== Zod Schemas ====================================

describe('WelfareMetricsSchema', () => {
  it('validates correct metrics', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 2.5,
      healthyLifeYears: 73.2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = WelfareMetricsSchema.safeParse({ incomeGrowth: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric values', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 'high',
      healthyLifeYears: 73,
    });
    expect(result.success).toBe(false);
  });

  it('allows negative income growth', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: -1.5,
      healthyLifeYears: 70,
    });
    expect(result.success).toBe(true);
  });
});

describe('WelfareFunctionConfigSchema', () => {
  it('validates alpha between 0 and 1', () => {
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 0.5 }).success).toBe(true);
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 0 }).success).toBe(true);
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 1 }).success).toBe(true);
  });

  it('rejects alpha outside 0-1', () => {
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: -0.1 }).success).toBe(false);
    expect(WelfareFunctionConfigSchema.safeParse({ alpha: 1.1 }).success).toBe(false);
  });

  it('defaults alpha to 0.5 when not provided', () => {
    const result = WelfareFunctionConfigSchema.parse({});
    expect(result.alpha).toBe(0.5);
  });
});

describe('WelfareEffectSchema', () => {
  it('validates complete welfare effect', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: 0.1,
      incomeEffectCILow: 0.05,
      incomeEffectCIHigh: 0.15,
      healthEffect: 0.5,
      healthEffectCILow: 0.3,
      healthEffectCIHigh: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it('allows missing CI bounds', () => {
    const result = WelfareEffectSchema.safeParse({
      incomeEffect: 0.1,
      healthEffect: 0.5,
    });
    expect(result.success).toBe(true);
  });

  it('requires incomeEffect and healthEffect', () => {
    expect(WelfareEffectSchema.safeParse({ incomeEffect: 0.1 }).success).toBe(false);
    expect(WelfareEffectSchema.safeParse({ healthEffect: 0.5 }).success).toBe(false);
  });
});
