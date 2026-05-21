import type { Parameter } from './parameters-calculations-citations';
import {
  GLOBAL_POPULATION_2024,
  TREATY_REDUCTION_PCT,
} from './parameters-calculations-citations';

export const BULK_SHIRT_UNIT_COST_USD: Parameter = {
  value: 7,
  parameterName: 'BULK_SHIRT_UNIT_COST_USD',
  unit: 'USD',
  displayName: 'Bulk Shirt Unit Cost (USD)',
  description:
    'Estimated per-shirt cost at bulk-tier scale (1M+ units, blank apparel + print-on-demand fulfillment).',
  sourceType: 'external',
  sourceUrl: 'https://help.customcat.com/customcat-plan-comparison-overview',
  confidence: 'low',
  confidenceInterval: [4, 11],
};

export const UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD: Parameter = {
  value: GLOBAL_POPULATION_2024.value * BULK_SHIRT_UNIT_COST_USD.value,
  parameterName: 'UNIVERSAL_SHIRT_DISTRIBUTION_COST_USD',
  unit: 'USD',
  displayName: 'Universal Shirt Distribution Cost (USD)',
  description:
    'Estimated total cost to distribute one t-shirt to every human on Earth at bulk-tier unit pricing.',
  sourceType: 'calculated',
  confidence: 'low',
  formula: 'GLOBAL_POPULATION_2024 × BULK_SHIRT_UNIT_COST_USD',
  confidenceInterval: [
    GLOBAL_POPULATION_2024.value * 4,
    GLOBAL_POPULATION_2024.value * 11,
  ],
};

export const GLOBAL_ANNUAL_PHILANTHROPY_USD: Parameter = {
  value: 1_500_000_000_000,
  parameterName: 'GLOBAL_ANNUAL_PHILANTHROPY_USD',
  unit: 'USD',
  displayName: 'Global Annual Philanthropy Budget (USD)',
  description:
    'Estimated total annual global philanthropic giving across foundations, individual donors, corporate giving, and other charitable channels.',
  sourceType: 'external',
  sourceUrl: 'https://www.citigroup.com/global/insights/global-giving',
  confidence: 'medium',
  confidenceInterval: [1_200_000_000_000, 1_800_000_000_000],
};

export const TREATY_MILITARY_ALLOCATION_PCT: Parameter = {
  value: 1 - TREATY_REDUCTION_PCT.value,
  parameterName: 'TREATY_MILITARY_ALLOCATION_PCT',
  unit: 'rate',
  displayName: 'Post-Treaty Military Allocation Percentage',
  description:
    'Percentage of total budget that remains allocated to military spending after the 1% Treaty redirection.',
  sourceType: 'calculated',
  confidence: 'high',
  formula: '1 - TREATY_REDUCTION_PCT',
};

export const TREATY_TRIALS_ALLOCATION_PCT: Parameter = {
  value: TREATY_REDUCTION_PCT.value,
  parameterName: 'TREATY_TRIALS_ALLOCATION_PCT',
  unit: 'rate',
  displayName: 'Post-Treaty Clinical Trials Allocation Percentage',
  description:
    'Percentage of total military budget redirected to pragmatic clinical trials under the 1% Treaty.',
  sourceType: 'calculated',
  confidence: 'high',
  formula: 'TREATY_REDUCTION_PCT',
};
