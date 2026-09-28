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
 * Never fill a missing year with nominal income, PIP or an after-government
 * estimate. OECD and Eurostat observations retain their distinct source/unit
 * metadata; analyses must not splice these definitions into one time series.
 */
export function buildCountryPanelIncomeLookup(
  records: readonly MedianIncomeSeriesRecord[],
): Map<string, MedianIncomeSeriesRecord> {
  const lookup = new Map<string, MedianIncomeSeriesRecord>();
  for (const record of records) {
    if (!isEligibleCountryPanelIncomeRecord(record)) continue;
    const key = `${record.jurisdictionIso3}:${record.year}`;
    const existing = lookup.get(key);
    if (!existing || (record.source === 'OECD IDD' && existing.source !== 'OECD IDD')) {
      lookup.set(key, record);
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
