import {
  fetchPreferredMedianIncomeSeries,
  fetchStrictAfterTaxMedianIncomeSeries,
} from '../datasets/median-income-series.js';
import type { MedianIncomeSeriesRecord } from '../datasets/median-income-types.js';
import type { DataPoint, FetchOptions } from '../types.js';

function toMedianIncomeDataPoint(record: MedianIncomeSeriesRecord): DataPoint {
  const source =
    record.source === 'OECD IDD'
      ? 'OECD IDD real PPP median disposable income'
      : 'World Bank PIP real PPP median-income fallback';

  return {
    jurisdictionIso3: record.jurisdictionIso3,
    year: record.year,
    value: record.value,
    unit: 'PPP intl-$',
    source,
    sourceUrl: record.sourceUrl,
  };
}

export async function fetchAfterTaxMedianIncomePpp(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const records = await fetchPreferredMedianIncomeSeries({
    jurisdictions: options.jurisdictions,
    period: options.period,
    priceBasis: 'real',
    purchasingPower: 'ppp',
  });

  return records.map(toMedianIncomeDataPoint);
}

export async function fetchStrictAfterTaxMedianIncomePpp(
  options: FetchOptions = {},
): Promise<DataPoint[]> {
  const records = await fetchStrictAfterTaxMedianIncomeSeries({
    jurisdictions: options.jurisdictions,
    period: options.period,
    priceBasis: 'real',
    purchasingPower: 'ppp',
    strictAfterTaxOnly: true,
  });

  return records.map(toMedianIncomeDataPoint);
}
