import { describe, expect, it } from 'vitest';

import {
  buildEurostatMedianIncomeSeries,
  buildOecdMedianIncomeSeries,
  buildPipMedianIncomeSeries,
  renderGeneratedMedianIncomeModule,
} from '../../datasets/median-income-series-build';
import type { MedianIncomeSeriesMetadata } from '../../datasets/median-income-types';
import type { DerivedEurostatMedianDisposableIncomePoint } from '../../fetchers/eurostat-income';
import type { DerivedOecdMedianDisposableIncomePoint } from '../../fetchers/oecd-income-distribution';
import type { PIPCountryData } from '../../fetchers/world-bank-pip';

const pipRecords: PIPCountryData[] = [
  {
    countryCode: 'USA',
    countryName: 'United States',
    year: 2021,
    medianDaily: 10,
    medianAnnual: 3650,
    meanDaily: 12,
    gini: 0.4,
    population: 100,
    welfareType: 'income',
    cpi: 102,
    ppp: 1,
    isInterpolated: false,
    surveyYear: 2021,
    surveyAcronym: 'US-SURVEY',
    estimateType: 'actual',
    estimationType: 'survey',
    distributionType: 'micro',
    surveyCoverage: 'national',
    surveyComparability: 'comparable',
    comparableSpell: '2019-2021',
    sourceUrl: 'https://pip.worldbank.org',
  },
  {
    countryCode: 'AUS',
    countryName: 'Australia',
    year: 2020,
    medianDaily: 8,
    medianAnnual: 2920,
    meanDaily: 9,
    gini: 0.3,
    population: 80,
    welfareType: 'income',
    cpi: 101,
    ppp: 1.2,
    isInterpolated: true,
    surveyYear: 2019,
    surveyAcronym: 'AU-SURVEY',
    estimateType: 'interpolated',
    estimationType: 'survey',
    distributionType: 'micro',
    surveyCoverage: 'national',
    surveyComparability: 'comparable',
    comparableSpell: '2018-2020',
    sourceUrl: 'https://pip.worldbank.org',
  },
];

const oecdRecords: DerivedOecdMedianDisposableIncomePoint[] = [
  {
    jurisdictionIso3: 'AUS',
    jurisdictionName: 'Australia',
    year: 2021,
    nominalMedianLocalCurrency: 200,
    cpi: 100,
    pppPrivateConsumption: 2,
    realMedianLocalCurrency: 200,
    nominalMedianPppUsd: 100,
    realMedianPppUsd: 100,
    priceReferenceYear: 2021,
    referenceCpi: 100,
    referencePpp: 2,
    priceIndexSource: 'OECD IDD',
    pppSource: 'OECD IDD',
    nominalPppSource: 'OECD IDD',
    methodology: 'METH2012',
    definition: 'D_CUR',
    source: 'OECD IDD',
    sourceUrl: 'https://data-explorer.oecd.org',
  },
];

const eurostatRecords: DerivedEurostatMedianDisposableIncomePoint[] = [
  {
    jurisdictionIso3: 'DEU',
    jurisdictionName: 'Germany',
    year: 2021,
    nominalMedianLocalCurrency: 25000,
    hicpAnnualAverage: 100,
    pppPrivateConsumption: 0.8,
    realMedianLocalCurrency: 25000,
    nominalMedianPppUsd: 31250,
    realMedianPppUsd: 31250,
    priceReferenceYear: 2021,
    referenceCpi: 100,
    referencePpp: 0.8,
    priceIndexSource: 'Eurostat HICP',
    pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
    nominalPppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
    estimateType: 'b',
    source: 'Eurostat EU-SILC',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en',
  },
];

describe('Median Income Dataset Build Helpers', () => {
  it('buildPipMedianIncomeSeries converts PIP records to dataset records', () => {
    const records = buildPipMedianIncomeSeries(pipRecords);

    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(
      expect.objectContaining({
        jurisdictionIso3: 'AUS',
        concept: 'median_income',
        priceBasis: 'real',
        purchasingPower: 'ppp',
        source: 'World Bank PIP',
        taxScope: 'unknown',
        isInterpolated: true,
        surveyYear: 2019,
      }),
    );
  });

  it('buildOecdMedianIncomeSeries creates strict after-tax records in multiple units', () => {
    const records = buildOecdMedianIncomeSeries(oecdRecords);

    expect(records).toHaveLength(4);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jurisdictionIso3: 'AUS',
          concept: 'after_tax_median_disposable_income',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          source: 'OECD IDD',
          taxScope: 'after_direct_taxes_and_cash_transfers',
          consumptionTaxTreatment: 'excluded',
          inKindTransferTreatment: 'excluded',
          equivalenceScale: 'square_root',
          priceReferenceYear: 2021,
          pppReferenceYear: 2021,
          priceIndexSource: 'OECD IDD',
          pppSource: 'OECD IDD',
        }),
      ]),
    );
  });

  it('buildEurostatMedianIncomeSeries creates strict after-tax records in multiple units', () => {
    const records = buildEurostatMedianIncomeSeries(eurostatRecords);

    expect(records).toHaveLength(4);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jurisdictionIso3: 'DEU',
          source: 'Eurostat EU-SILC',
          concept: 'after_tax_median_disposable_income',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          methodology: 'EU-SILC',
          surveyAcronym: 'EU-SILC',
          estimateType: 'b',
          equivalenceScale: 'modified_oecd',
          priceReferenceYear: 2021,
          pppReferenceYear: 2021,
          priceIndexSource: 'Eurostat HICP',
          pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
        }),
      ]),
    );
  });

  it('retains fallback provenance and distinguishes fixed-year real from same-year nominal PPP', () => {
    const records = buildOecdMedianIncomeSeries([{
      ...oecdRecords[0]!,
      year: 2020,
      priceIndexSource: 'World Bank WDI (FP.CPI.TOTL)',
      pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
      nominalPppSource: 'OECD IDD',
    }]);
    const real = records.find(record => record.priceBasis === 'real' && record.purchasingPower === 'ppp')!;
    expect(real).toMatchObject({
      priceReferenceYear: 2021, pppReferenceYear: 2021,
      priceIndexSource: 'World Bank WDI (FP.CPI.TOTL)',
      pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
    });
    expect(real.priceIndexNote).toContain('World Bank WDI (FP.CPI.TOTL)');
    expect(real.pppBasisNote).toContain('2021 World Bank WDI (PA.NUS.PRVT.PP)');
    const nominal = records.find(record => record.priceBasis === 'nominal' && record.purchasingPower === 'ppp')!;
    expect(nominal).toMatchObject({ pppReferenceYear: 2020, pppSource: 'OECD IDD' });
    expect(nominal.priceReferenceYear).toBeUndefined();
    expect(nominal.priceIndexSource).toBeUndefined();
  });

  it('does not publish real observations when reference conversions are unavailable', () => {
    const records = buildOecdMedianIncomeSeries([{
      ...oecdRecords[0]!, referenceCpi: null, referencePpp: null,
      realMedianLocalCurrency: null, realMedianPppUsd: null,
    }]);
    expect(records.map(record => [record.priceBasis, record.purchasingPower, record.value])).toEqual([
      ['nominal', 'national_currency', 200], ['nominal', 'ppp', 100],
    ]);
  });

  it('renderGeneratedMedianIncomeModule embeds metadata and records', () => {
    const metadata: MedianIncomeSeriesMetadata = {
      generatedAt: '2026-03-22T00:00:00.000Z',
      recordCount: 2,
      sources: ['Eurostat EU-SILC', 'World Bank PIP'],
      caveats: ['Example caveat'],
    };

    const output = renderGeneratedMedianIncomeModule(
      buildPipMedianIncomeSeries(pipRecords),
      metadata,
    );

    expect(output).toContain('Generated by scripts/generate-median-income-series.ts');
    expect(output).toContain('"recordCount": 2');
    expect(output).toContain('"jurisdictionIso3": "AUS"');
  });
});
