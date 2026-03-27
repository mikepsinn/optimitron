import {
  fetchEurostatMedianDisposableIncomeSeries,
} from '../fetchers/eurostat-income';
import {
  deriveOecdRealMedianDisposableIncome,
  fetchOECDIDDPoints,
  OECD_IDD_SELECTORS,
} from '../fetchers/oecd-income-distribution';
import {
  GENERATED_MEDIAN_INCOME_SERIES,
  MEDIAN_INCOME_SERIES_METADATA,
} from '../generated/median-income-series';
import {
  buildEurostatMedianIncomeSeries,
  buildOecdMedianIncomeSeries,
} from './median-income-series-build';
import type {
  MedianIncomeSeriesQuery,
  MedianIncomeSeriesRecord,
} from './median-income-types';

export * from './median-income-types';

export { MEDIAN_INCOME_SERIES_METADATA };

export const MEDIAN_INCOME_SERIES = GENERATED_MEDIAN_INCOME_SERIES;

export interface MedianIncomeSeriesDependencies {
  fetchOecdIddPoints?: typeof fetchOECDIDDPoints;
  fetchEurostatMedianDisposableIncomeSeries?: typeof fetchEurostatMedianDisposableIncomeSeries;
}

export function isStrictAfterTaxMedianIncomeRecord(
  record: MedianIncomeSeriesRecord,
): boolean {
  return (
    record.isAfterTax &&
    record.taxScope === 'after_direct_taxes_and_cash_transfers'
  );
}

function matchesMedianIncomeSeriesQuery(
  record: MedianIncomeSeriesRecord,
  query: MedianIncomeSeriesQuery,
): boolean {
  if (
    query.jurisdictions?.length &&
    !query.jurisdictions.includes(record.jurisdictionIso3)
  ) {
    return false;
  }
  if (query.period && record.year < query.period.startYear) {
    return false;
  }
  if (query.period && record.year > query.period.endYear) {
    return false;
  }
  if (query.source && record.source !== query.source) {
    return false;
  }
  if (query.concept && record.concept !== query.concept) {
    return false;
  }
  if (query.priceBasis && record.priceBasis !== query.priceBasis) {
    return false;
  }
  if (
    query.purchasingPower &&
    record.purchasingPower !== query.purchasingPower
  ) {
    return false;
  }
  if (
    typeof query.isAfterTax === 'boolean' &&
    record.isAfterTax !== query.isAfterTax
  ) {
    return false;
  }
  if (query.taxScope && record.taxScope !== query.taxScope) {
    return false;
  }
  if (query.excludeInterpolated && record.isInterpolated === true) {
    return false;
  }
  if (query.strictAfterTaxOnly && !isStrictAfterTaxMedianIncomeRecord(record)) {
    return false;
  }

  return true;
}

function compareMedianIncomeSeriesRecords(
  a: MedianIncomeSeriesRecord,
  b: MedianIncomeSeriesRecord,
): number {
  if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
    return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
  }
  if (a.year !== b.year) {
    return a.year - b.year;
  }

  const rankDiff = rankMedianIncomeRecord(b) - rankMedianIncomeRecord(a);
  if (rankDiff !== 0) return rankDiff;
  if (a.source !== b.source) return a.source.localeCompare(b.source);
  if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);

  return a.value - b.value;
}

export function filterMedianIncomeSeries(
  records: MedianIncomeSeriesRecord[],
  query: MedianIncomeSeriesQuery = {},
): MedianIncomeSeriesRecord[] {
  return records
    .filter((record) => matchesMedianIncomeSeriesQuery(record, query))
    .sort(compareMedianIncomeSeriesRecords);
}

export function rankMedianIncomeRecord(record: MedianIncomeSeriesRecord): number {
  let rank = 0;

  if (isStrictAfterTaxMedianIncomeRecord(record)) {
    rank += 120;
  } else if (record.isAfterTax) {
    rank += 60;
  }
  if (record.concept === 'after_tax_median_disposable_income') rank += 10;
  if (record.priceBasis === 'real') rank += 20;
  if (record.purchasingPower === 'ppp') rank += 10;
  if (record.derivation === 'direct') rank += 5;
  if (record.source === 'OECD IDD') rank += 3;
  if (record.source === 'Eurostat EU-SILC') rank += 2;
  if (record.isInterpolated === false) rank += 2;
  if (record.isInterpolated === true) rank -= 5;

  return rank;
}

export function chooseBestMedianIncomeRecord(
  records: MedianIncomeSeriesRecord[],
): MedianIncomeSeriesRecord | null {
  if (records.length === 0) return null;

  return (
    [...records].sort((a, b) => {
      const rankDiff = rankMedianIncomeRecord(b) - rankMedianIncomeRecord(a);
      if (rankDiff !== 0) return rankDiff;
      if (a.source !== b.source) return a.source.localeCompare(b.source);
      if (a.priceBasis !== b.priceBasis) {
        return a.priceBasis.localeCompare(b.priceBasis);
      }
      if (a.purchasingPower !== b.purchasingPower) {
        return a.purchasingPower.localeCompare(b.purchasingPower);
      }
      return a.unit.localeCompare(b.unit);
    })[0] ?? null
  );
}

export function getMedianIncomeSeries(
  query: MedianIncomeSeriesQuery = {},
): MedianIncomeSeriesRecord[] {
  return filterMedianIncomeSeries(MEDIAN_INCOME_SERIES, query);
}

export function getBestAvailableMedianIncomeSeriesFromRecords(
  records: MedianIncomeSeriesRecord[],
  query: MedianIncomeSeriesQuery = {},
): MedianIncomeSeriesRecord[] {
  const filtered = filterMedianIncomeSeries(records, query);
  const grouped = new Map<string, MedianIncomeSeriesRecord[]>();

  for (const record of filtered) {
    const key = `${record.jurisdictionIso3}:${record.year}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(record);
    } else {
      grouped.set(key, [record]);
    }
  }

  return [...grouped.values()]
    .map((group) => chooseBestMedianIncomeRecord(group))
    .filter((record): record is MedianIncomeSeriesRecord => record !== null)
    .sort(compareMedianIncomeSeriesRecords);
}

export function getBestAvailableMedianIncomeSeries(
  query: MedianIncomeSeriesQuery = {},
): MedianIncomeSeriesRecord[] {
  return getBestAvailableMedianIncomeSeriesFromRecords(
    MEDIAN_INCOME_SERIES,
    query,
  );
}

function shouldFetchStrictAfterTaxMedianIncome(
  query: MedianIncomeSeriesQuery,
): boolean {
  if (query.source === 'World Bank PIP') return false;
  if (query.concept === 'median_income') return false;
  if (query.isAfterTax === false) return false;
  if (query.taxScope === 'unknown') return false;

  return true;
}

export async function fetchStrictAfterTaxMedianIncomeSeries(
  query: MedianIncomeSeriesQuery = {},
  dependencies: MedianIncomeSeriesDependencies = {},
): Promise<MedianIncomeSeriesRecord[]> {
  if (!shouldFetchStrictAfterTaxMedianIncome(query)) {
    return [];
  }

  const fetchOecdIddPoints =
    dependencies.fetchOecdIddPoints ?? fetchOECDIDDPoints;
  const fetchEurostatMedianIncome =
    dependencies.fetchEurostatMedianDisposableIncomeSeries ??
    fetchEurostatMedianDisposableIncomeSeries;
  const refArea = query.jurisdictions?.length ? query.jurisdictions : undefined;
  const fetchOptions = query.period ? { period: query.period } : {};
  const bundledStrictRecords = getMedianIncomeSeries({
    ...query,
    strictAfterTaxOnly: true,
  });
  const [medianPoints, cpiPoints, pppPoints, eurostatDerived] = await Promise.all([
    fetchOecdIddPoints(
      { ...OECD_IDD_SELECTORS.MEDIAN_DISPOSABLE_INCOME_TOTAL, refArea },
      fetchOptions,
    ),
    fetchOecdIddPoints(
      { ...OECD_IDD_SELECTORS.CPI_TOTAL, refArea },
      fetchOptions,
    ),
    fetchOecdIddPoints(
      { ...OECD_IDD_SELECTORS.PPP_PRIVATE_CONSUMPTION_TOTAL, refArea },
      fetchOptions,
    ),
    query.source === 'OECD IDD'
      ? Promise.resolve([])
      : fetchEurostatMedianIncome({
          jurisdictions: refArea,
          period: query.period,
        }),
  ]);
  const liveOecdRecords = buildOecdMedianIncomeSeries(
    deriveOecdRealMedianDisposableIncome(
      medianPoints,
      cpiPoints,
      pppPoints,
    ),
  );
  const liveEurostatRecords = buildEurostatMedianIncomeSeries(eurostatDerived);

  return filterMedianIncomeSeries(
    getBestAvailableMedianIncomeSeriesFromRecords(
      [...bundledStrictRecords, ...liveOecdRecords, ...liveEurostatRecords],
      { ...query, strictAfterTaxOnly: true },
    ),
    query,
  );
}

export async function fetchPreferredMedianIncomeSeries(
  query: MedianIncomeSeriesQuery = {},
  dependencies: MedianIncomeSeriesDependencies = {},
): Promise<MedianIncomeSeriesRecord[]> {
  const strictAfterTaxRecords = await fetchStrictAfterTaxMedianIncomeSeries(
    query,
    dependencies,
  );
  const fallbackRecords =
    query.source === 'OECD IDD' || query.strictAfterTaxOnly
      ? []
      : getMedianIncomeSeries(query);

  return getBestAvailableMedianIncomeSeriesFromRecords(
    [...strictAfterTaxRecords, ...fallbackRecords],
    query,
  );
}
