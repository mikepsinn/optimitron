import { describe, it, expect } from 'vitest';
import { fitLogModel } from '../index.js';

describe('@optimitron/obg smoke tests', () => {
  it('fitLogModel() fits a simple log-linear relationship', () => {
    // outcome ≈ 10 + 5 * log(spending)
    const data = [
      { spending: 100, outcome: 33.0, jurisdiction: 'A', year: 2020 },
      { spending: 1000, outcome: 44.5, jurisdiction: 'B', year: 2020 },
      { spending: 10000, outcome: 56.1, jurisdiction: 'C', year: 2020 },
      { spending: 100000, outcome: 67.5, jurisdiction: 'D', year: 2020 },
    ];

    const model = fitLogModel(data);

    expect(model.type).toBe('log');
    expect(model.n).toBe(4);
    expect(model.r2).toBeGreaterThan(0.9);
    expect(model.beta).toBeGreaterThan(0); // positive relationship
  });

  it('fitLogModel() reports correct n', () => {
    const data = [
      { spending: 50, outcome: 10, jurisdiction: 'X', year: 2021 },
      { spending: 500, outcome: 20, jurisdiction: 'Y', year: 2021 },
    ];

    const model = fitLogModel(data);
    expect(model.n).toBe(2);
  });

  it('exports are importable', async () => {
    const obg = await import('../index.js');
    expect(obg).toHaveProperty('fitLogModel');
    expect(obg).toHaveProperty('calculateWES');
  });
});
