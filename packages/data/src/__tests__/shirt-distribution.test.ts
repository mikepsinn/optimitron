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
import type {
  Confidence,
  Parameter,
  SourceType,
} from '../parameters/parameters-calculations-citations';

const expectedParameterShape: Array<{
  parameter: Parameter;
  parameterName: string;
  unit: string;
  displayName: string;
  description: string;
  sourceType: SourceType;
  confidence: Confidence;
}> = [
  {
    parameter: BULK_SHIRT_UNIT_COST_USD,
    parameterName: 'BULK_SHIRT_UNIT_COST_USD',
    unit: 'USD',
    displayName: 'Bulk Shirt Unit Cost (USD)',
    description:
      'Estimated per-shirt cost at bulk-tier scale (1M+ units, blank apparel + print-on-demand fulfillment).',
    sourceType: 'external',
    confidence: 'low',
  },
  {
    parameter: UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD,
    parameterName: 'UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD',
    unit: 'USD',
    displayName: 'Universal Shirt Distribution Cost (USD)',
    description:
      'Estimated total cost to distribute one t-shirt to every human on Earth at bulk-tier unit pricing.',
    sourceType: 'calculated',
    confidence: 'low',
  },
  {
    parameter: PER_SHIRT_TRUE_VALUE_USD,
    parameterName: 'PER_SHIRT_TRUE_VALUE_USD',
    unit: 'USD',
    displayName: 'Per-Shirt True Value (USD)',
    description:
      'Projected treaty value per shirt, derived from the expected treaty value divided by the global human population.',
    sourceType: 'calculated',
    confidence: 'low',
  },
  {
    parameter: GLOBAL_ANNUAL_PHILANTHROPY_USD,
    parameterName: 'GLOBAL_ANNUAL_PHILANTHROPY_USD',
    unit: 'USD',
    displayName: 'Global Annual Philanthropy Budget (USD)',
    description:
      'Estimated total annual global philanthropic giving across foundations, individual donors, corporate giving, and other charitable channels.',
    sourceType: 'external',
    confidence: 'medium',
  },
  {
    parameter: TREATY_MILITARY_ALLOCATION_PCT,
    parameterName: 'TREATY_MILITARY_ALLOCATION_PCT',
    unit: 'rate',
    displayName: 'Post-Treaty Military Allocation Percentage',
    description:
      'Percentage of total budget that remains allocated to military spending after the 1% Treaty redirection.',
    sourceType: 'calculated',
    confidence: 'high',
  },
  {
    parameter: TREATY_TRIALS_ALLOCATION_PCT,
    parameterName: 'TREATY_TRIALS_ALLOCATION_PCT',
    unit: 'rate',
    displayName: 'Post-Treaty Clinical Trials Allocation Percentage',
    description:
      'Percentage of total military budget redirected to pragmatic clinical trials under the 1% Treaty.',
    sourceType: 'calculated',
    confidence: 'high',
  },
];

describe('shirt distribution parameters', () => {
  it('exports parameters with the expected metadata shape', () => {
    for (const expected of expectedParameterShape) {
      expect(expected.parameter).toMatchObject({
        parameterName: expected.parameterName,
        unit: expected.unit,
        displayName: expected.displayName,
        description: expected.description,
        sourceType: expected.sourceType,
        confidence: expected.confidence,
      });
    }
  });

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
    for (const { parameter } of expectedParameterShape) {
      if (!parameter.confidenceInterval) {
        continue;
      }

      const [low, high] = parameter.confidenceInterval;
      expect(low).toBeLessThanOrEqual(high);
      expect(parameter.value).toBeGreaterThanOrEqual(low);
      expect(parameter.value).toBeLessThanOrEqual(high);
    }
  });
});
