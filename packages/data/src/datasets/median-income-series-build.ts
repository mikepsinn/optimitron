import type { DerivedOecdMedianDisposableIncomePoint } from '../fetchers/oecd-income-distribution';
import type { DerivedEurostatMedianDisposableIncomePoint } from '../fetchers/eurostat-income';
import type { PIPCountryData } from '../fetchers/world-bank-pip';
import type {
  MedianIncomeSeriesMetadata,
  MedianIncomeSeriesRecord,
} from './median-income-types';

export function buildPipMedianIncomeSeries(
  records: PIPCountryData[],
): MedianIncomeSeriesRecord[] {
  return [...records]
    .sort((a, b) => {
      if (a.countryCode !== b.countryCode) {
        return a.countryCode.localeCompare(b.countryCode);
      }
      return a.year - b.year;
    })
    .map((record) => ({
      jurisdictionIso3: record.countryCode,
      jurisdictionName: record.countryName,
      year: record.year,
      value: record.medianAnnual,
      unit: 'PPP-adjusted dollars per year',
      concept: 'median_income',
      priceBasis: 'real',
      purchasingPower: 'ppp',
      source: 'World Bank PIP',
      derivation: 'direct',
      isAfterTax: false,
      taxScope: 'unknown',
      consumptionTaxTreatment: 'unknown',
      inKindTransferTreatment: 'unknown',
      isInterpolated: record.isInterpolated,
      surveyYear: record.surveyYear ?? undefined,
      surveyAcronym: record.surveyAcronym ?? undefined,
      estimateType: record.estimateType ?? undefined,
      estimationType: record.estimationType ?? undefined,
      distributionType: record.distributionType ?? undefined,
      surveyCoverage: record.surveyCoverage ?? undefined,
      surveyComparability: record.surveyComparability ?? undefined,
      comparableSpell: record.comparableSpell ?? undefined,
      welfareType: record.welfareType,
      sourceUrl: record.sourceUrl,
    }));
}

export function buildOecdMedianIncomeSeries(
  records: DerivedOecdMedianDisposableIncomePoint[],
): MedianIncomeSeriesRecord[] {
  return [...records]
    .sort((a, b) => {
      if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
        return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
      }
      return a.year - b.year;
    })
    .flatMap((record) => {
      const baseRecord = {
        jurisdictionIso3: record.jurisdictionIso3,
        jurisdictionName: record.jurisdictionName ?? record.jurisdictionIso3,
        year: record.year,
        concept: 'after_tax_median_disposable_income' as const,
        source: 'OECD IDD' as const,
        isAfterTax: true,
        taxScope: 'after_direct_taxes_and_cash_transfers' as const,
        consumptionTaxTreatment: 'excluded' as const,
        inKindTransferTreatment: 'excluded' as const,
        methodology: record.methodology,
        definition: record.definition,
        sourceUrl: record.sourceUrl,
      };
      const renderedRecords: MedianIncomeSeriesRecord[] = [
        {
          ...baseRecord,
          value: record.nominalMedianLocalCurrency,
          unit: 'National currency units per equivalised household',
          priceBasis: 'nominal',
          purchasingPower: 'national_currency',
          derivation: 'direct',
        },
      ];

      if (record.realMedianLocalCurrency !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.realMedianLocalCurrency,
          unit: 'Real national currency units per equivalised household',
          priceBasis: 'real',
          purchasingPower: 'national_currency',
          derivation: 'derived',
          priceIndexNote: 'Deflated with OECD IDD CPI (index, same-year basis as published by OECD).',
        });
      }

      if (record.nominalMedianPppUsd !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.nominalMedianPppUsd,
          unit: 'PPP-adjusted US dollars per equivalised household',
          priceBasis: 'nominal',
          purchasingPower: 'ppp',
          derivation: 'derived',
          pppBasisNote: 'Converted with OECD IDD private-consumption PPP (national currency per US dollar).',
        });
      }

      if (record.realMedianPppUsd !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.realMedianPppUsd,
          unit: 'Real PPP-adjusted US dollars per equivalised household',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          derivation: 'derived',
          priceIndexNote: 'Deflated with OECD IDD CPI (index, same-year basis as published by OECD).',
          pppBasisNote: 'Converted with OECD IDD private-consumption PPP (national currency per US dollar).',
        });
      }

      return renderedRecords;
    });
}

export function buildEurostatMedianIncomeSeries(
  records: DerivedEurostatMedianDisposableIncomePoint[],
): MedianIncomeSeriesRecord[] {
  return [...records]
    .sort((a, b) => {
      if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
        return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
      }
      return a.year - b.year;
    })
    .flatMap((record) => {
      const baseRecord = {
        jurisdictionIso3: record.jurisdictionIso3,
        jurisdictionName: record.jurisdictionName,
        year: record.year,
        concept: 'after_tax_median_disposable_income' as const,
        source: 'Eurostat EU-SILC' as const,
        isAfterTax: true,
        taxScope: 'after_direct_taxes_and_cash_transfers' as const,
        consumptionTaxTreatment: 'excluded' as const,
        inKindTransferTreatment: 'excluded' as const,
        methodology: 'EU-SILC',
        definition: 'Median equivalised disposable income (MED_E).',
        surveyAcronym: 'EU-SILC',
        isInterpolated: false,
        estimateType: record.estimateType,
        sourceUrl: record.sourceUrl,
      };
      const renderedRecords: MedianIncomeSeriesRecord[] = [
        {
          ...baseRecord,
          value: record.nominalMedianLocalCurrency,
          unit: 'National currency units per equivalised person',
          priceBasis: 'nominal',
          purchasingPower: 'national_currency',
          derivation: 'direct',
        },
      ];

      if (record.realMedianLocalCurrency !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.realMedianLocalCurrency,
          unit: 'Real national currency units per equivalised person',
          priceBasis: 'real',
          purchasingPower: 'national_currency',
          derivation: 'derived',
          priceIndexNote:
            'Deflated with Eurostat HICP annual average all-items index.',
        });
      }

      if (record.nominalMedianPppUsd !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.nominalMedianPppUsd,
          unit: 'PPP-adjusted US dollars per equivalised person',
          priceBasis: 'nominal',
          purchasingPower: 'ppp',
          derivation: 'derived',
          pppBasisNote:
            'Converted with World Bank private-consumption PPP conversion factor (LCU per international $).',
        });
      }

      if (record.realMedianPppUsd !== null) {
        renderedRecords.push({
          ...baseRecord,
          value: record.realMedianPppUsd,
          unit: 'Real PPP-adjusted US dollars per equivalised person',
          priceBasis: 'real',
          purchasingPower: 'ppp',
          derivation: 'derived',
          priceIndexNote:
            'Deflated with Eurostat HICP annual average all-items index.',
          pppBasisNote:
            'Converted with World Bank private-consumption PPP conversion factor (LCU per international $).',
        });
      }

      return renderedRecords;
    });
}

export function renderGeneratedMedianIncomeModule(
  records: MedianIncomeSeriesRecord[],
  metadata: MedianIncomeSeriesMetadata,
): string {
  const recordsJson = JSON.stringify(records, null, 2)
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${');

  return `/**
 * Generated by scripts/generate-median-income-series.ts.
 * Do not edit manually.
 */

import type {
  MedianIncomeSeriesMetadata,
  MedianIncomeSeriesRecord,
} from '../datasets/median-income-types';

export const MEDIAN_INCOME_SERIES_METADATA: MedianIncomeSeriesMetadata = ${JSON.stringify(metadata, null, 2)};

const GENERATED_MEDIAN_INCOME_SERIES_JSON = String.raw\`${recordsJson}\`;

export const GENERATED_MEDIAN_INCOME_SERIES = JSON.parse(
  GENERATED_MEDIAN_INCOME_SERIES_JSON,
) as MedianIncomeSeriesRecord[];
`;
}
