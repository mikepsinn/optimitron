import { describe, expect, it } from 'vitest';
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  GLOBAL_POPULATION_2024,
} from '../parameters/parameters-calculations-citations';
import {
  BULK_SHIRT_UNIT_COST_USD,
  GLOBAL_ANNUAL_PHILANTHROPY_USD,
  PER_SHIRT_TRUE_VALUE_USD,
  TREATY_MILITARY_ALLOCATION_PCT,
  TREATY_TRIALS_ALLOCATION_PCT,
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
} from '../parameters/shirt-distribution';

const shirtParameters = [
  BULK_SHIRT_UNIT_COST_USD,
  UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
  PER_SHIRT_TRUE_VALUE_USD,
  GLOBAL_ANNUAL_PHILANTHROPY_USD,
  TREATY_MILITARY_ALLOCATION_PCT,
  TREATY_TRIALS_ALLOCATION_PCT,
];

describe('shirt distribution parameters', () => {
  it('calculates universal shirt distribution cost from population and unit cost', () => {
    expect(UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD.value).toBe(
      GLOBAL_POPULATION_2024.value * BULK_SHIRT_UNIT_COST_USD.value,
    );
  });

  it('calculates per-shirt true value from expected treaty value and population', () => {
    expect(PER_SHIRT_TRUE_VALUE_USD.value).toBe(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value /
        GLOBAL_POPULATION_2024.value,
    );
  });

  it('keeps post-treaty military and trials allocations exhaustive', () => {
    expect(
      TREATY_MILITARY_ALLOCATION_PCT.value +
        TREATY_TRIALS_ALLOCATION_PCT.value,
    ).toBe(1);
  });

  it('keeps confidence intervals ordered with values inside their bounds', () => {
    for (const parameter of shirtParameters) {
      if (!parameter.confidenceInterval) {
        continue;
      }

      const [low, high] = parameter.confidenceInterval;
      expect(low).toBeLessThanOrEqual(high);
      expect(parameter.value).toBeGreaterThanOrEqual(low);
      expect(parameter.value).toBeLessThanOrEqual(high);
    }
  });

  it('exports unique parameter names with positive USD-or-rate values', () => {
    const names = new Set<string>();
    for (const parameter of shirtParameters) {
      expect(names.has(parameter.parameterName)).toBe(false);
      names.add(parameter.parameterName);
      expect(parameter.value).toBeGreaterThan(0);
      expect(['USD', 'rate']).toContain(parameter.unit);
    }
  });
});
