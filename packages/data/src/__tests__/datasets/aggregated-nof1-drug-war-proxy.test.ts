import { describe, expect, it } from 'vitest';

import {
  DEFAULT_AGGREGATED_NOF1_DRUG_WAR_PROXY_PANEL_PATH,
  loadAggregatedNOf1DrugWarProxyPanel,
  parseAggregatedNOf1DrugWarProxyCsv,
} from '../../datasets/aggregated-nof1-drug-war-proxy';

describe('aggregated-nof1-drug-war-proxy dataset', () => {
  it('parses csv text into typed rows', () => {
    const csv = [
      '"iso3","year","publicOrderSafetySpendingLcu","publicOrderSafetySpendingPctGdp","publicOrderSafetySpendingPerCapitaPpp","oecdAccidentalPoisoningDeathsPer100k","wbUnintentionalPoisoningDeathsPer100k","spendingCurrency"',
      '"AAA","2001","1000","1.25","300.5","2.1","","USD"',
      '"BBB","2002","","2.50","","","1.7",""',
      '',
    ].join('\n');

    const rows = parseAggregatedNOf1DrugWarProxyCsv(csv);
    expect(rows).toHaveLength(2);

    expect(rows[0]).toEqual({
      iso3: 'AAA',
      year: 2001,
      publicOrderSafetySpendingLcu: 1000,
      publicOrderSafetySpendingPctGdp: 1.25,
      publicOrderSafetySpendingPerCapitaPpp: 300.5,
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
      oecdAccidentalPoisoningDeathsPer100k: null,
      wbUnintentionalPoisoningDeathsPer100k: 1.7,
      spendingCurrency: null,
    });
  });

  it('loads the default downloaded panel file', () => {
    const rows = loadAggregatedNOf1DrugWarProxyPanel();
    expect(rows.length).toBeGreaterThan(900);
    expect(DEFAULT_AGGREGATED_NOF1_DRUG_WAR_PROXY_PANEL_PATH).toContain(
      'derived-drug-war-proxy-panel.csv',
    );
    expect(rows.some((row) => row.iso3 === 'USA')).toBe(true);
    expect(rows.every((row) => row.iso3.length === 3)).toBe(true);
    expect(rows.every((row) => Number.isInteger(row.year))).toBe(true);
  });
});
