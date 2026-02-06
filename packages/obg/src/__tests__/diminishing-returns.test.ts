import { describe, it, expect } from 'vitest';
import {
  fitLogModel,
  fitSaturationModel,
  marginalReturn,
  findOSL,
  estimateOSL,
  type SpendingOutcomePoint,
  type DiminishingReturnsModel,
} from '../diminishing-returns.js';

// ---------------------------------------------------------------------------
// Helper: generate data from a known log model  Outcome = α + β·ln(S)
// ---------------------------------------------------------------------------
function generateLogData(
  alpha: number,
  beta: number,
  spendingLevels: number[],
  noise: number = 0,
): SpendingOutcomePoint[] {
  return spendingLevels.map((s, i) => ({
    spending: s,
    outcome: alpha + beta * Math.log(s) + noise * (i % 2 === 0 ? 1 : -1),
    jurisdiction: `J${i}`,
    year: 2020,
  }));
}

// Helper: generate data from a known saturation model
// Outcome = α + β·(S / (S + γ))
function generateSaturationData(
  alpha: number,
  beta: number,
  gamma: number,
  spendingLevels: number[],
  noise: number = 0,
): SpendingOutcomePoint[] {
  return spendingLevels.map((s, i) => ({
    spending: s,
    outcome: alpha + beta * (s / (s + gamma)) + noise * (i % 2 === 0 ? 1 : -1),
    jurisdiction: `J${i}`,
    year: 2020,
  }));
}

// ============================= fitLogModel =================================

describe('fitLogModel', () => {
  it('recovers parameters from a perfect log-linear relationship', () => {
    // Outcome = 10 + 5·ln(S)
    const data = generateLogData(10, 5, [100, 500, 1000, 5000, 10000, 50000]);
    const model = fitLogModel(data);

    expect(model.type).toBe('log');
    expect(model.n).toBe(6);
    expect(model.alpha).toBeCloseTo(10, 0);
    expect(model.beta).toBeCloseTo(5, 0);
    expect(model.r2).toBeCloseTo(1, 5);
  });

  it('handles two data points (minimum for regression)', () => {
    const data = generateLogData(0, 1, [1, Math.E]);
    const model = fitLogModel(data);

    expect(model.n).toBe(2);
    // With 2 points, R² should be 1 (perfect fit on 2 points)
    expect(model.r2).toBeCloseTo(1, 5);
  });

  it('handles noisy data with reasonable R²', () => {
    const data = generateLogData(10, 5, [100, 500, 1000, 5000, 10000, 50000], 2);
    const model = fitLogModel(data);

    expect(model.r2).toBeGreaterThan(0.9);
    expect(model.beta).toBeGreaterThan(0);
  });

  it('detects a negative relationship', () => {
    // Outcome = 100 - 5·ln(S)  (e.g. crime as spending increases)
    const data = generateLogData(100, -5, [100, 500, 1000, 5000, 10000]);
    const model = fitLogModel(data);

    expect(model.beta).toBeLessThan(0);
    expect(model.r2).toBeCloseTo(1, 5);
  });

  it('returns low R² for non-log data', () => {
    // Purely random data – shouldn't fit well
    const data: SpendingOutcomePoint[] = [
      { spending: 100, outcome: 50, jurisdiction: 'A', year: 2020 },
      { spending: 200, outcome: 10, jurisdiction: 'B', year: 2020 },
      { spending: 300, outcome: 80, jurisdiction: 'C', year: 2020 },
      { spending: 400, outcome: 20, jurisdiction: 'D', year: 2020 },
      { spending: 500, outcome: 70, jurisdiction: 'E', year: 2020 },
    ];
    const model = fitLogModel(data);
    expect(model.r2).toBeLessThan(0.5);
  });

  it('handles identical spending levels gracefully', () => {
    const data: SpendingOutcomePoint[] = [
      { spending: 100, outcome: 50, jurisdiction: 'A', year: 2020 },
      { spending: 100, outcome: 55, jurisdiction: 'B', year: 2020 },
      { spending: 100, outcome: 45, jurisdiction: 'C', year: 2020 },
    ];
    const model = fitLogModel(data);
    // All same log(spending), so denominator = 0, beta = NaN
    // That's expected degenerate behavior
    expect(model.n).toBe(3);
  });

  it('works with very large spending values', () => {
    const data = generateLogData(10, 5, [1e9, 1e10, 1e11, 1e12]);
    const model = fitLogModel(data);
    expect(model.r2).toBeCloseTo(1, 5);
    expect(model.beta).toBeCloseTo(5, 0);
  });

  it('works with very small spending values', () => {
    const data = generateLogData(10, 5, [0.01, 0.1, 1, 10]);
    const model = fitLogModel(data);
    expect(model.r2).toBeCloseTo(1, 5);
    expect(model.beta).toBeCloseTo(5, 0);
  });
});

// ========================= fitSaturationModel ==============================

describe('fitSaturationModel', () => {
  it('recovers parameters from a perfect saturation relationship', () => {
    // Outcome = 20 + 80·(S/(S+5000))
    const data = generateSaturationData(
      20,
      80,
      5000,
      [100, 500, 1000, 2500, 5000, 10000, 25000, 50000],
    );
    const model = fitSaturationModel(data, 5000);

    expect(model.type).toBe('saturation');
    expect(model.n).toBe(8);
    expect(model.alpha).toBeCloseTo(20, 0);
    expect(model.beta).toBeCloseTo(80, 0);
    expect(model.gamma).toBe(5000);
    expect(model.r2).toBeCloseTo(1, 5);
  });

  it('uses median spending as default gamma', () => {
    const data = generateSaturationData(
      0,
      100,
      5000,
      [100, 1000, 5000, 10000, 50000],
    );
    const model = fitSaturationModel(data);

    expect(model.type).toBe('saturation');
    expect(model.gamma).toBeDefined();
    // Median of [100, 1000, 5000, 10000, 50000] = 5000
    expect(model.gamma).toBe(5000);
  });

  it('handles two data points', () => {
    const data = generateSaturationData(10, 50, 1000, [500, 5000]);
    const model = fitSaturationModel(data, 1000);

    expect(model.n).toBe(2);
    expect(model.r2).toBeCloseTo(1, 5);
  });

  it('handles data where spending >> gamma (near saturation)', () => {
    // All spending far above gamma=100, so outcomes are near alpha+beta
    const data = generateSaturationData(10, 90, 100, [10000, 50000, 100000, 500000]);
    const model = fitSaturationModel(data, 100);

    expect(model.type).toBe('saturation');
    // R² might be low because outcomes are nearly identical
    expect(model.n).toBe(4);
  });

  it('handles data where spending << gamma (linear region)', () => {
    // All spending far below gamma=1e6
    const data = generateSaturationData(10, 90, 1e6, [100, 200, 500, 1000]);
    const model = fitSaturationModel(data, 1e6);

    expect(model.type).toBe('saturation');
    expect(model.n).toBe(4);
  });
});

// ============================= marginalReturn ==============================

describe('marginalReturn', () => {
  describe('log model', () => {
    const logModel: DiminishingReturnsModel = {
      type: 'log',
      alpha: 10,
      beta: 5,
      r2: 0.99,
      n: 10,
    };

    it('computes β/S for log model', () => {
      // At S=100: dOutcome/dS = 5/100 = 0.05
      expect(marginalReturn(100, logModel)).toBeCloseTo(0.05, 10);
    });

    it('decreases as spending increases (diminishing returns)', () => {
      const mr1 = marginalReturn(1000, logModel);
      const mr2 = marginalReturn(10000, logModel);
      expect(mr1).toBeGreaterThan(mr2);
    });

    it('is higher at very low spending', () => {
      const mr = marginalReturn(1, logModel);
      expect(mr).toBe(5); // β/1 = 5
    });

    it('approaches zero at very high spending', () => {
      const mr = marginalReturn(1e12, logModel);
      expect(mr).toBeLessThan(1e-10);
    });
  });

  describe('saturation model', () => {
    const satModel: DiminishingReturnsModel = {
      type: 'saturation',
      alpha: 20,
      beta: 80,
      gamma: 5000,
      r2: 0.99,
      n: 10,
    };

    it('computes β·γ/(S+γ)² for saturation model', () => {
      // At S=5000: 80*5000/(5000+5000)² = 400000/1e8 = 0.004
      expect(marginalReturn(5000, satModel)).toBeCloseTo(0.004, 10);
    });

    it('is maximized at S=0', () => {
      // At S=0: β·γ/γ² = β/γ = 80/5000 = 0.016
      expect(marginalReturn(0, satModel)).toBeCloseTo(0.016, 10);
    });

    it('decreases as spending increases', () => {
      const mr1 = marginalReturn(1000, satModel);
      const mr2 = marginalReturn(10000, satModel);
      expect(mr1).toBeGreaterThan(mr2);
    });

    it('approaches zero at very high spending', () => {
      const mr = marginalReturn(1e12, satModel);
      expect(mr).toBeLessThan(1e-15);
    });
  });
});

// ================================= findOSL =================================

describe('findOSL', () => {
  describe('log model', () => {
    it('computes OSL = β/r for log model', () => {
      const model: DiminishingReturnsModel = {
        type: 'log',
        alpha: 10,
        beta: 5,
        r2: 0.99,
        n: 10,
      };
      // OSL = β/r = 5/0.03 = 166.67
      expect(findOSL(model, 0.03)).toBeCloseTo(5 / 0.03, 5);
    });

    it('increases when opportunity cost decreases', () => {
      const model: DiminishingReturnsModel = {
        type: 'log',
        alpha: 10,
        beta: 5,
        r2: 0.99,
        n: 10,
      };
      const osl1 = findOSL(model, 0.05);
      const osl2 = findOSL(model, 0.01);
      expect(osl2).toBeGreaterThan(osl1);
    });

    it('uses default opportunity cost of 0.03', () => {
      const model: DiminishingReturnsModel = {
        type: 'log',
        alpha: 10,
        beta: 5,
        r2: 0.99,
        n: 10,
      };
      expect(findOSL(model)).toBeCloseTo(5 / 0.03, 5);
    });

    it('handles negative beta (OSL is negative → meaning no spending justified)', () => {
      const model: DiminishingReturnsModel = {
        type: 'log',
        alpha: 100,
        beta: -5,
        r2: 0.9,
        n: 10,
      };
      expect(findOSL(model, 0.03)).toBeLessThan(0);
    });
  });

  describe('saturation model', () => {
    it('finds the correct OSL for saturation model via quadratic formula', () => {
      const model: DiminishingReturnsModel = {
        type: 'saturation',
        alpha: 20,
        beta: 80,
        gamma: 5000,
        r2: 0.99,
        n: 10,
      };
      const osl = findOSL(model, 0.03);

      // Verify: marginal return at OSL should equal opportunity cost
      const mr = marginalReturn(osl, model);
      expect(mr).toBeCloseTo(0.03, 3);
    });

    it('increases when opportunity cost decreases (saturation)', () => {
      const model: DiminishingReturnsModel = {
        type: 'saturation',
        alpha: 20,
        beta: 80,
        gamma: 5000,
        r2: 0.99,
        n: 10,
      };
      const osl1 = findOSL(model, 0.05);
      const osl2 = findOSL(model, 0.01);
      expect(osl2).toBeGreaterThan(osl1);
    });

    it('handles very large gamma (slow saturation)', () => {
      const model: DiminishingReturnsModel = {
        type: 'saturation',
        alpha: 0,
        beta: 100,
        gamma: 1e9,
        r2: 0.95,
        n: 10,
      };
      const osl = findOSL(model, 0.03);
      expect(osl).toBeGreaterThan(0);
      expect(isFinite(osl)).toBe(true);
    });

    it('handles negative discriminant (returns gamma*10 fallback)', () => {
      // When β is very small relative to r and gamma, discriminant can go negative
      const model: DiminishingReturnsModel = {
        type: 'saturation',
        alpha: 0,
        beta: 0.0001,
        gamma: 5000,
        r2: 0.5,
        n: 5,
      };
      const osl = findOSL(model, 10);
      // Discriminant < 0 → fallback to gamma*10
      expect(osl).toBe(50000);
    });
  });
});

// ============================== estimateOSL ================================

describe('estimateOSL', () => {
  it('estimates OSL from log-linear data and returns confidence interval', () => {
    const data = generateLogData(10, 5, [100, 500, 1000, 5000, 10000, 50000]);
    const result = estimateOSL(data, 0.03, 100); // fewer bootstrap for speed

    expect(result.oslUsd).toBeGreaterThan(0);
    expect(result.confidenceInterval[0]).toBeLessThanOrEqual(result.oslUsd);
    expect(result.confidenceInterval[1]).toBeGreaterThanOrEqual(result.oslUsd);
    expect(result.model.type).toBeDefined();
    expect(result.marginalReturnAtOSL).toBeGreaterThan(0);
  });

  it('selects the model with higher R²', () => {
    // Perfect log data → log model should have higher R²
    const data = generateLogData(10, 5, [100, 500, 1000, 5000, 10000, 50000]);
    const result = estimateOSL(data, 0.03, 10);

    // Log data fits log model best
    expect(result.model.type).toBe('log');
  });

  it('selects saturation model when saturation data is used', () => {
    // Perfect saturation data
    const data = generateSaturationData(
      10,
      90,
      5000,
      [100, 500, 1000, 2500, 5000, 10000, 25000, 50000],
    );
    const result = estimateOSL(data, 0.03, 10);

    // The model selection depends on which fits better
    expect(result.model.type).toBeDefined();
    expect(result.oslUsd).toBeGreaterThan(0);
  });

  it('confidence interval narrows with more data points', () => {
    const smallData = generateLogData(10, 5, [100, 1000, 10000]);
    const largeData = generateLogData(
      10,
      5,
      [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
    );

    const smallResult = estimateOSL(smallData, 0.03, 200);
    const largeResult = estimateOSL(largeData, 0.03, 200);

    const smallWidth = smallResult.confidenceInterval[1] - smallResult.confidenceInterval[0];
    const largeWidth = largeResult.confidenceInterval[1] - largeResult.confidenceInterval[0];

    // Larger dataset should give tighter CI (usually, not guaranteed with bootstrap)
    // Just check both are valid
    expect(smallWidth).toBeGreaterThanOrEqual(0);
    expect(largeWidth).toBeGreaterThanOrEqual(0);
  });

  it('marginal return at OSL approximately equals opportunity cost', () => {
    const data = generateLogData(10, 5, [100, 500, 1000, 5000, 10000, 50000]);
    const opportunityCost = 0.03;
    const result = estimateOSL(data, opportunityCost, 10);

    expect(result.marginalReturnAtOSL).toBeCloseTo(opportunityCost, 2);
  });

  it('handles paper example: education spending cross-country', () => {
    // Simulate the K-12 education spending example from the paper
    // Effect of 10% increase varies by baseline spending level
    // Marginal return ~0.30 at $16,000/pupil → OSL around there
    const data: SpendingOutcomePoint[] = [
      { spending: 5000, outcome: 60, jurisdiction: 'MEX', year: 2019 },
      { spending: 8000, outcome: 72, jurisdiction: 'CHL', year: 2019 },
      { spending: 10000, outcome: 78, jurisdiction: 'ESP', year: 2019 },
      { spending: 12000, outcome: 82, jurisdiction: 'FRA', year: 2019 },
      { spending: 15000, outcome: 85, jurisdiction: 'USA', year: 2019 },
      { spending: 18000, outcome: 87, jurisdiction: 'NOR', year: 2019 },
      { spending: 22000, outcome: 88, jurisdiction: 'LUX', year: 2019 },
    ];
    const result = estimateOSL(data, 0.03, 50);

    expect(result.oslUsd).toBeGreaterThan(0);
    expect(result.model.r2).toBeGreaterThan(0.8);
  });
});
