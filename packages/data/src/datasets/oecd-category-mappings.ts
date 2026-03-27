/**
 * OECD Category Mappings — Budget Category → OECD Panel Field Mapping
 *
 * Maps US federal budget categories to their corresponding OECD panel
 * spending and outcome fields for cross-country efficiency analysis.
 *
 * Only DISCRETIONARY categories are mapped. Non-discretionary spending
 * (Social Security, Medicare, Medicaid, Interest, Other Mandatory)
 * is excluded because Congress can't reallocate it via appropriations.
 *
 * NOTE: OECD spending = total government (federal + state + local).
 * For categories where federal is a minority of total government spending
 * (e.g., Education), the comparison reflects the overall system.
 */

import type { OECDBudgetPanelDataPoint } from './oecd-budget-panel';

export type OECDSpendingField = 'healthSpendingPerCapitaPpp' | 'educationSpendingPerCapitaPpp' | 'militarySpendingPerCapitaPpp' | 'socialSpendingPerCapitaPpp' | 'rdSpendingPerCapitaPpp';
export type OECDOutcomeField = 'lifeExpectancyYears' | 'infantMortalityPer1000' | 'giniIndex' | 'pisaMathScore' | 'afterTaxMedianIncomePpp';

export interface OECDCategoryMapping {
  spendingField: OECDSpendingField;
  outcomeField: OECDOutcomeField;
  /** Negate outcome so higher = better (e.g., infant mortality) */
  negateOutcome?: boolean;
  outcomeName: string;
}

/** Keyed by BudgetCategory.id */
export const OECD_CATEGORY_MAPPINGS: Record<string, OECDCategoryMapping> = {
  military: {
    spendingField: 'militarySpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
  education: {
    spendingField: 'educationSpendingPerCapitaPpp',
    outcomeField: 'pisaMathScore',
    outcomeName: 'PISA Math Score',
  },
  science_nasa: {
    spendingField: 'rdSpendingPerCapitaPpp',
    outcomeField: 'afterTaxMedianIncomePpp',
    outcomeName: 'After-Tax Median Income (PPP)',
  },
  health_discretionary: {
    spendingField: 'healthSpendingPerCapitaPpp',
    outcomeField: 'lifeExpectancyYears',
    outcomeName: 'Life Expectancy',
  },
};

/** Non-discretionary category IDs: excluded from optimization entirely */
export const NON_DISCRETIONARY_CATEGORIES = new Set([
  'interest_debt',
  'social_security',
  'medicare',
  'medicaid',
  'other_mandatory',
]);

/** Country names for display (ISO3 → human-readable) */
export const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', GBR: 'United Kingdom', FRA: 'France',
  DEU: 'Germany', JPN: 'Japan', CAN: 'Canada', ITA: 'Italy',
  AUS: 'Australia', NLD: 'Netherlands', BEL: 'Belgium',
  SWE: 'Sweden', NOR: 'Norway', DNK: 'Denmark', FIN: 'Finland',
  AUT: 'Austria', CHE: 'Switzerland', ESP: 'Spain', PRT: 'Portugal',
  IRL: 'Ireland', NZL: 'New Zealand', KOR: 'South Korea',
  ISR: 'Israel', CZE: 'Czech Republic',
  SGP: 'Singapore', EST: 'Estonia', VNM: 'Vietnam',
  TWN: 'Taiwan', POL: 'Poland',
};
