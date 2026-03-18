import { describe, it, expect } from 'vitest';
import { calculateWelfare, WelfareMetricsSchema } from '../index.js';

describe('@optimitron/opg smoke tests', () => {
  it('calculateWelfare() with equal weights', () => {
    const result = calculateWelfare(
      { incomeGrowth: 2.0, healthyLifeYears: 70 },
      { alpha: 0.5 }
    );
    // 0.5 * 2 + 0.5 * 70 = 1 + 35 = 36
    expect(result).toBeCloseTo(36, 5);
  });

  it('calculateWelfare() with alpha=1 returns income only', () => {
    const result = calculateWelfare(
      { incomeGrowth: 3.0, healthyLifeYears: 65 },
      { alpha: 1.0 }
    );
    expect(result).toBeCloseTo(3.0, 5);
  });

  it('calculateWelfare() with alpha=0 returns health only', () => {
    const result = calculateWelfare(
      { incomeGrowth: 3.0, healthyLifeYears: 65 },
      { alpha: 0.0 }
    );
    expect(result).toBeCloseTo(65, 5);
  });

  it('WelfareMetricsSchema validates correct input', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 2.5,
      healthyLifeYears: 72.3,
    });
    expect(result.success).toBe(true);
  });

  it('WelfareMetricsSchema rejects missing fields', () => {
    const result = WelfareMetricsSchema.safeParse({
      incomeGrowth: 2.5,
    });
    expect(result.success).toBe(false);
  });
});
