import { describe, it, expect } from 'vitest';
import {
  filterByCostEffectiveness,
  calculateOSLFromCEA,
  aggregateCostPerQaly,
  qalysToUsd,
  calculateROI,
  VALUE_CONVERSIONS,
  type Intervention,
} from '../cost-effectiveness.js';

// ---------------------------------------------------------------------------
// Test data from paper: Vaccinations example
// ---------------------------------------------------------------------------
const vaccinationInterventions: Intervention[] = [
  {
    id: 'childhood-routine',
    name: 'Childhood routine immunization',
    categoryId: 'vaccinations',
    targetPopulation: 4_000_000,
    costPerPerson: 500,
    qalyPerPerson: 0.1,
    costPerQaly: 5_000,
    source: 'CDC VFC',
    year: 2023,
  },
  {
    id: 'hpv',
    name: 'HPV vaccination',
    categoryId: 'vaccinations',
    targetPopulation: 4_000_000,
    costPerPerson: 300,
    qalyPerPerson: 0.05,
    costPerQaly: 6_000,
    source: 'CEA Registry',
    year: 2023,
  },
  {
    id: 'flu-elderly',
    name: 'Flu (elderly)',
    categoryId: 'vaccinations',
    targetPopulation: 50_000_000,
    costPerPerson: 40,
    qalyPerPerson: 0.01,
    costPerQaly: 4_000,
    source: 'CDC',
    year: 2023,
  },
  {
    id: 'shingles',
    name: 'Shingles vaccination',
    categoryId: 'vaccinations',
    targetPopulation: 40_000_000,
    costPerPerson: 200,
    qalyPerPerson: 0.02,
    costPerQaly: 10_000,
    source: 'CEA Registry',
    year: 2023,
  },
  {
    id: 'covid-boosters',
    name: 'COVID boosters',
    categoryId: 'vaccinations',
    targetPopulation: 100_000_000,
    costPerPerson: 30,
    qalyPerPerson: 0.005,
    costPerQaly: 6_000,
    source: 'CDC',
    year: 2023,
  },
];

// An expensive intervention above the threshold
const expensiveIntervention: Intervention = {
  id: 'gene-therapy-rare',
  name: 'Gene therapy for rare disease',
  categoryId: 'rare-disease',
  targetPopulation: 1_000,
  costPerPerson: 2_000_000,
  qalyPerPerson: 5,
  costPerQaly: 400_000,
  source: 'Hypothetical',
  year: 2023,
};

// ======================== filterByCostEffectiveness =========================

describe('filterByCostEffectiveness', () => {
  it('includes all interventions below WTP threshold', () => {
    const result = filterByCostEffectiveness(vaccinationInterventions, 100_000);
    expect(result).toHaveLength(5);
  });

  it('excludes interventions above WTP threshold', () => {
    const all = [...vaccinationInterventions, expensiveIntervention];
    const result = filterByCostEffectiveness(all, 100_000);
    expect(result).toHaveLength(5);
    expect(result.find((i) => i.id === 'gene-therapy-rare')).toBeUndefined();
  });

  it('sorts by cost per QALY (most cost-effective first)', () => {
    const result = filterByCostEffectiveness(vaccinationInterventions, 100_000);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.costPerQaly).toBeGreaterThanOrEqual(result[i - 1]!.costPerQaly);
    }
  });

  it('returns empty array when no interventions are cost-effective', () => {
    const result = filterByCostEffectiveness(vaccinationInterventions, 1_000);
    expect(result).toHaveLength(0);
  });

  it('uses default WTP of $100K when not specified', () => {
    const all = [...vaccinationInterventions, expensiveIntervention];
    const result = filterByCostEffectiveness(all);
    expect(result).toHaveLength(5);
  });

  it('handles empty intervention list', () => {
    const result = filterByCostEffectiveness([], 100_000);
    expect(result).toHaveLength(0);
  });

  it('includes intervention exactly at threshold', () => {
    const atThreshold: Intervention = {
      id: 'at-threshold',
      name: 'Exactly at threshold',
      categoryId: 'test',
      targetPopulation: 1000,
      costPerPerson: 100,
      qalyPerPerson: 0.001,
      costPerQaly: 100_000,
      source: 'test',
      year: 2023,
    };
    const result = filterByCostEffectiveness([atThreshold], 100_000);
    expect(result).toHaveLength(1);
  });

  it('excludes intervention just above threshold', () => {
    const aboveThreshold: Intervention = {
      id: 'above-threshold',
      name: 'Just above threshold',
      categoryId: 'test',
      targetPopulation: 1000,
      costPerPerson: 100,
      qalyPerPerson: 0.001,
      costPerQaly: 100_001,
      source: 'test',
      year: 2023,
    };
    const result = filterByCostEffectiveness([aboveThreshold], 100_000);
    expect(result).toHaveLength(0);
  });
});

// ========================== calculateOSLFromCEA ============================

describe('calculateOSLFromCEA', () => {
  it('calculates OSL matching the paper vaccination example (~$16B)', () => {
    const result = calculateOSLFromCEA(vaccinationInterventions, 100_000);

    // Paper: Childhood $2B + HPV $1.2B + Flu $2B + Shingles $8B + COVID $3B = $16.2B
    const expectedOSL =
      4_000_000 * 500 +      // $2.0B
      4_000_000 * 300 +      // $1.2B
      50_000_000 * 40 +      // $2.0B
      40_000_000 * 200 +     // $8.0B
      100_000_000 * 30;      // $3.0B
    // = $16.2B

    expect(result.oslUsd).toBe(expectedOSL);
    expect(result.oslUsd).toBeCloseTo(16_200_000_000, -6);
    expect(result.interventionCount).toBe(5);
  });

  it('calculates total QALYs correctly', () => {
    const result = calculateOSLFromCEA(vaccinationInterventions, 100_000);

    const expectedQalys =
      4_000_000 * 0.1 +
      4_000_000 * 0.05 +
      50_000_000 * 0.01 +
      40_000_000 * 0.02 +
      100_000_000 * 0.005;

    expect(result.totalQalys).toBeCloseTo(expectedQalys, 2);
  });

  it('excludes expensive interventions from OSL', () => {
    const all = [...vaccinationInterventions, expensiveIntervention];
    const result = calculateOSLFromCEA(all, 100_000);
    expect(result.interventionCount).toBe(5);
    // Gene therapy excluded, so OSL same as without it
    expect(result.oslUsd).toBeCloseTo(16_200_000_000, -6);
  });

  it('with higher WTP, includes previously excluded interventions', () => {
    const all = [...vaccinationInterventions, expensiveIntervention];
    const low = calculateOSLFromCEA(all, 100_000);
    const high = calculateOSLFromCEA(all, 500_000);

    expect(high.interventionCount).toBeGreaterThan(low.interventionCount);
    expect(high.oslUsd).toBeGreaterThan(low.oslUsd);
  });

  it('returns zero OSL when no interventions pass threshold', () => {
    const result = calculateOSLFromCEA(vaccinationInterventions, 100);
    expect(result.oslUsd).toBe(0);
    expect(result.totalQalys).toBe(0);
    expect(result.interventionCount).toBe(0);
  });

  it('handles empty intervention list', () => {
    const result = calculateOSLFromCEA([]);
    expect(result.oslUsd).toBe(0);
    expect(result.totalQalys).toBe(0);
    expect(result.interventionCount).toBe(0);
    expect(result.includedInterventions).toHaveLength(0);
  });

  it('returns the included interventions sorted by cost-effectiveness', () => {
    const result = calculateOSLFromCEA(vaccinationInterventions, 100_000);
    const costs = result.includedInterventions.map((i) => i.costPerQaly);
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]!);
    }
  });
});

// ========================= aggregateCostPerQaly ============================

describe('aggregateCostPerQaly', () => {
  it('computes total cost / total QALYs', () => {
    const totalCost =
      4_000_000 * 500 +
      4_000_000 * 300 +
      50_000_000 * 40 +
      40_000_000 * 200 +
      100_000_000 * 30;
    const totalQalys =
      4_000_000 * 0.1 +
      4_000_000 * 0.05 +
      50_000_000 * 0.01 +
      40_000_000 * 0.02 +
      100_000_000 * 0.005;

    const result = aggregateCostPerQaly(vaccinationInterventions);
    expect(result).toBeCloseTo(totalCost / totalQalys, 0);
  });

  it('returns Infinity for zero QALYs', () => {
    const interventions: Intervention[] = [
      {
        id: 'zero-qaly',
        name: 'Zero QALY intervention',
        categoryId: 'test',
        targetPopulation: 1000,
        costPerPerson: 100,
        qalyPerPerson: 0,
        costPerQaly: Infinity,
        source: 'test',
        year: 2023,
      },
    ];
    expect(aggregateCostPerQaly(interventions)).toBe(Infinity);
  });

  it('handles single intervention', () => {
    const single = [vaccinationInterventions[0]!];
    const result = aggregateCostPerQaly(single);
    // Should equal costPerQaly: 5000
    expect(result).toBeCloseTo(5000, 0);
  });
});

// ============================== qalysToUsd =================================

describe('qalysToUsd', () => {
  it('converts QALYs at default $100K/QALY', () => {
    expect(qalysToUsd(10)).toBe(1_000_000);
  });

  it('converts QALYs at custom value', () => {
    expect(qalysToUsd(10, 50_000)).toBe(500_000);
  });

  it('handles zero QALYs', () => {
    expect(qalysToUsd(0)).toBe(0);
  });

  it('handles fractional QALYs', () => {
    expect(qalysToUsd(0.5)).toBe(50_000);
  });

  it('handles negative QALYs (harm)', () => {
    expect(qalysToUsd(-1)).toBe(-100_000);
  });
});

// ============================== calculateROI ================================

describe('calculateROI', () => {
  it('calculates ROI = monetized benefit / cost', () => {
    // 10 QALYs at $100K/QALY = $1M benefit on $250K cost = 4:1 ROI
    expect(calculateROI(250_000, 10)).toBe(4);
  });

  it('returns very high ROI for low-cost high-benefit interventions', () => {
    // Paper: vaccinations return 44:1
    const roi = calculateROI(1_000_000, 440);
    expect(roi).toBe(44);
  });

  it('returns Infinity for zero cost', () => {
    expect(calculateROI(0, 10)).toBe(Infinity);
  });

  it('returns 0 for zero QALYs', () => {
    expect(calculateROI(100_000, 0)).toBe(0);
  });

  it('handles negative QALYs (harmful intervention)', () => {
    expect(calculateROI(100_000, -1)).toBeLessThan(0);
  });

  it('uses custom value per QALY', () => {
    // 1 QALY at $50K = $50K benefit / $50K cost = 1
    expect(calculateROI(50_000, 1, 50_000)).toBe(1);
  });
});

// ========================== VALUE_CONVERSIONS ==============================

describe('VALUE_CONVERSIONS', () => {
  it('has VSL at $10M', () => {
    expect(VALUE_CONVERSIONS.VSL_USD).toBe(10_000_000);
  });

  it('has QALY value at $100K', () => {
    expect(VALUE_CONVERSIONS.QALY_USD).toBe(100_000);
  });

  it('has life-year to QALY conversion at 0.85', () => {
    expect(VALUE_CONVERSIONS.LIFE_YEAR_TO_QALY).toBe(0.85);
  });
});
