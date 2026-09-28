import type { MedianIncomeSeriesRecord } from './median-income-types';

/** Keep the published income unit and definition alongside every observation. */
export interface CountryPanelIncomeFields {
  afterTaxMedianIncome: MedianIncomeSeriesRecord | null;
}

export function isEligibleCountryPanelIncomeRecord(
  record: MedianIncomeSeriesRecord,
): boolean {
  const compatibleSource =
    (record.source === 'OECD IDD'
      && record.unit === 'Real PPP-adjusted US dollars per equivalised household'
      && record.methodology === 'METH2012'
      && record.definition === 'D_CUR')
    || (record.source === 'Eurostat EU-SILC'
      && record.unit === 'Real PPP-adjusted US dollars per equivalised person'
      && record.methodology === 'EU-SILC');

  return compatibleSource
    && record.concept === 'after_tax_median_disposable_income'
    && record.isAfterTax
    && record.taxScope === 'after_direct_taxes_and_cash_transfers'
    && record.priceBasis === 'real'
    && record.purchasingPower === 'ppp'
    && record.isInterpolated !== true
    && record.welfareType !== 'consumption'
    && Number.isFinite(record.value)
    && record.value > 0;
}

/**
 * Use one comparable definition per country: most distinct observed years,
 * then OECD when coverage ties, then a stable definition key. Missing years
 * stay missing rather than borrowing another source's unit or price basis.
 */
export function buildCountryPanelIncomeLookup(
  records: readonly MedianIncomeSeriesRecord[],
): Map<string, MedianIncomeSeriesRecord> {
  const countries = new Map<string, Map<string, Map<number, MedianIncomeSeriesRecord>>>();
  for (const record of records) {
    if (!isEligibleCountryPanelIncomeRecord(record)) continue;
    const definition = JSON.stringify([
      record.source, record.unit, record.methodology, record.definition,
      record.priceIndexNote, record.pppBasisNote,
      record.consumptionTaxTreatment, record.inKindTransferTreatment,
    ]);
    const series = countries.get(record.jurisdictionIso3)
      ?? new Map<string, Map<number, MedianIncomeSeriesRecord>>();
    const years = series.get(definition) ?? new Map<number, MedianIncomeSeriesRecord>();
    if (!years.has(record.year)) years.set(record.year, record);
    series.set(definition, years);
    countries.set(record.jurisdictionIso3, series);
  }

  const lookup = new Map<string, MedianIncomeSeriesRecord>();
  for (const [country, series] of countries) {
    const [selected] = [...series.entries()].sort(([leftKey, left], [rightKey, right]) => {
      const leftIsOecd = left.values().next().value?.source === 'OECD IDD';
      const rightIsOecd = right.values().next().value?.source === 'OECD IDD';
      return right.size - left.size || Number(rightIsOecd) - Number(leftIsOecd)
        || (leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0);
    });
    if (!selected) continue;
    for (const [year, record] of selected[1]) {
      lookup.set(`${country}:${year}`, record);
    }
  }
  return lookup;
}

/** Reject legacy snapshots without observation-level source and unit metadata. */
export function resolveCountryPanelIncome(row: {
  jurisdictionIso3: string;
  year: number;
  afterTaxMedianIncome?: MedianIncomeSeriesRecord | null;
}): CountryPanelIncomeFields {
  const record = row.afterTaxMedianIncome;
  const eligible = record?.jurisdictionIso3 === row.jurisdictionIso3
    && record.year === row.year
    && isEligibleCountryPanelIncomeRecord(record);
  return {
    afterTaxMedianIncome: eligible ? record : null,
  };
}

/** Refresh income from cached source records without touching other indicators. */
export function refreshCountryPanelIncome<T extends { jurisdictionIso3: string; year: number }>(
  rows: readonly T[],
  records: readonly MedianIncomeSeriesRecord[],
): Array<Omit<T, keyof CountryPanelIncomeFields> & CountryPanelIncomeFields> {
  const lookup = buildCountryPanelIncomeLookup(records);
  return rows.map((row) => ({
    ...row,
    ...resolveCountryPanelIncome({
      jurisdictionIso3: row.jurisdictionIso3,
      year: row.year,
      afterTaxMedianIncome: lookup.get(`${row.jurisdictionIso3}:${row.year}`) ?? null,
    }),
  }));
}
