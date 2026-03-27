import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AGGREGATED_NOF1_DRUG_ENFORCEMENT_PANEL_PATH,
  loadAggregatedNOf1DrugEnforcementPanel,
  parseAggregatedNOf1DrugEnforcementCsv,
} from '../../datasets/aggregated-nof1-drug-enforcement';

describe('aggregated-nof1-drug-enforcement dataset', () => {
  it('parses csv text into typed rows', () => {
    const csv = [
      '"iso3","year","publicOrderSafetySpendingLcu","publicOrderSafetySpendingPctGdp","publicOrderSafetySpendingPerCapitaPpp","drugTraffickingArrestsCount","drugPossessionArrestsCount","totalArrestsCount","drugTraffickingArrestShare","drugLawArrestShare","estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp","estimatedDrugLawEnforcementSpendingPerCapitaPpp","oecdAccidentalPoisoningDeathsPer100k","wbUnintentionalPoisoningDeathsPer100k","spendingCurrency"',
      '"AAA","2001","1000","1.25","300.5","10","90","1000","0.01","0.1","3.005","30.05","2.1","","USD"',
      '"BBB","2002","","2.50","","","","","","","","","","1.7",""',
      '',
    ].join('\n');

    const rows = parseAggregatedNOf1DrugEnforcementCsv(csv);
    expect(rows).toHaveLength(2);

    expect(rows[0]).toEqual({
      iso3: 'AAA',
      year: 2001,
      publicOrderSafetySpendingLcu: 1000,
      publicOrderSafetySpendingPctGdp: 1.25,
      publicOrderSafetySpendingPerCapitaPpp: 300.5,
      drugTraffickingArrestsCount: 10,
      drugPossessionArrestsCount: 90,
      totalArrestsCount: 1000,
      drugTraffickingArrestShare: 0.01,
      drugLawArrestShare: 0.1,
      estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp: 3.005,
      estimatedDrugLawEnforcementSpendingPerCapitaPpp: 30.05,
      oecdAccidentalPoisoningDeathsPer100k: 2.1,
      wbUnintentionalPoisoningDeathsPer100k: null,
      spendingCurrency: 'USD',
    });

    expect(rows[1]).toEqual({
      iso3: 'BBB',
      year: 2002,
      publicOrderSafetySpendingLcu: null,
      publicOrderSafetySpendingPctGdp: 2.5,
      publicOrderSafetySpendingPerCapitaPpp: null,
      drugTraffickingArrestsCount: null,
      drugPossessionArrestsCount: null,
      totalArrestsCount: null,
      drugTraffickingArrestShare: null,
      drugLawArrestShare: null,
      estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp: null,
      estimatedDrugLawEnforcementSpendingPerCapitaPpp: null,
      oecdAccidentalPoisoningDeathsPer100k: null,
      wbUnintentionalPoisoningDeathsPer100k: 1.7,
      spendingCurrency: null,
    });
  });

  it('loads the default downloaded panel file', () => {
    const rows = loadAggregatedNOf1DrugEnforcementPanel();
    expect(rows.length).toBeGreaterThan(900);
    expect(DEFAULT_AGGREGATED_NOF1_DRUG_ENFORCEMENT_PANEL_PATH).toContain(
      'derived-drug-enforcement-panel.csv',
    );
    expect(rows.some((row) => row.iso3 === 'USA')).toBe(true);
    expect(rows.every((row) => row.iso3.length === 3)).toBe(true);
    expect(rows.every((row) => Number.isInteger(row.year))).toBe(true);
    expect(
      rows.some(
        (row) =>
          row.estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp != null &&
          row.estimatedDrugTraffickingEnforcementSpendingPerCapitaPpp >= 0,
      ),
    ).toBe(true);
  });
});
