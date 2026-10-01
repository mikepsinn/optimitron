import { describe, expect, it } from 'vitest';
import { generateOptimalBudget } from '../optimal-budget-generator.js';
import type { OptimalBudgetInput } from '../optimal-budget-generator.js';
import { scaleOptimalBudgetScenario } from '../optimal-budget-scaling.js';

const input: OptimalBudgetInput = {
  population: 100,
  incomeUnit: 'constant purchasing-power dollars',
  categories: [{ id: 'GF02', name: 'Military' }, { id: 'GF07', name: 'Health' }],
  subcategories: [{ id: 'GF0701', parentId: 'GF07', name: 'Medicines' }],
  countries: [{
    id: 'A', name: 'A', costs: { GF02: 10, GF07: 200 }, totalHealthPerCapita: 300,
    outcomes: { hale: 70, income: 100 }, subcategoryCosts: { GF0701: 150 },
  }],
  healthcareCountries: [{
    id: 'B', name: 'B', totalPerCapita: 100, publicPerCapita: 50,
    privatePerCapita: 50, externalPerCapita: 0, outOfPocketPerCapita: 20,
    hale: 75, haleLow: 74, haleHigh: 76,
  }],
  healthcareBudgets: [{ countryId: 'B', publicPerCapita: 80, subcategoryCosts: { GF0701: 60 } }],
};

describe('optimal budget generator', () => {
  it('selects global healthcare without requiring an unrelated national health reference', () => {
    const result = generateOptimalBudget({ ...input, countries: [], categories: [{ id: 'GF07', name: 'Health' }] });
    for (const scenario of result.scenarios) {
      expect(scenario.complete).toBe(true);
      expect(scenario.lines).toHaveLength(1);
      expect(scenario.lines[0]!.peer!.id).toBe('B');
      expect(scenario.annualBudget).toBe(8000);
    }
  });

  it('assembles the global health reference using its public ledger without double-counting private costs or services', () => {
    const original = structuredClone(input);
    const result = generateOptimalBudget(input);
    for (const scenario of result.scenarios) {
      const health = scenario.lines.find(line => line.id === 'GF07')!;
      expect(health.peer).toMatchObject({ id: 'B', publicCostPerCapita: 80, selectionCostPerCapita: 100 });
      expect(health.targets).toEqual({ hale: 75 - scenario.maxHealthyYearGap });
      expect(health.breakdown).toEqual([{ id: 'GF0701', name: 'Medicines', perCapita: 60 }]);
      expect(health.breakdownRemainder).toBe(20);
      expect(scenario.totalPerCapita).toBe(90);
      expect(scenario.annualBudget).toBe(9000);
      expect(scenario.alternativePerCapitaRange).toEqual([90, 90]);
    }
    expect(input).toEqual(original);
  });

  it('preserves the health target and an incomplete budget when the selected system lacks a public ledger', () => {
    const result = generateOptimalBudget({ ...input, healthcareBudgets: [] });
    expect(result.healthcare.scenarios[0]!.selected!.id).toBe('B');
    const scenario = result.scenarios[0]!;
    expect(scenario.lines.find(line => line.id === 'GF07')).toMatchObject({
      peer: null, annualBudget: null, targets: { hale: 74 },
    });
    expect(scenario).toMatchObject({ complete: false, totalPerCapita: null, annualBudget: null, subtotalPerCapita: 10 });
    const scaled = scaleOptimalBudgetScenario(scenario, 200);
    expect(scaled.annualBudget).toBeNull();
    expect(scaled.lines.find(line => line.id === 'GF02')!.annualBudget).toBe(2000);
  });

  it('scales the same scenarios for the browser and batch generator without losing metadata', () => {
    const original = generateOptimalBudget(input);
    const scaled = original.scenarios.map(scenario => scaleOptimalBudgetScenario(scenario, 200));
    expect(scaled).toEqual(generateOptimalBudget({ ...input, population: 200 }).scenarios);
    expect(original.scenarios[0]!.annualBudget).toBe(9000);
    for (const population of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => scaleOptimalBudgetScenario(original.scenarios[0]!, population)).toThrow('Population');
    }
    // The health replacement must also be checked, after the category selector has run.
    expect(() => generateOptimalBudget({ ...input,
      healthcareBudgets: [{ ...input.healthcareBudgets[0]!, publicPerCapita: Number.MAX_VALUE }],
    })).toThrow('numeric range');
  });
});
