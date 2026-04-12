import type { DataPoint } from './types';

function toCountryYearKey(row: Pick<DataPoint, 'jurisdictionIso3' | 'year'>): string {
  return `${row.jurisdictionIso3}::${row.year}`;
}

function indexByCountryYear(points: readonly DataPoint[]): Map<string, DataPoint> {
  return new Map(points.map((point) => [toCountryYearKey(point), point]));
}

interface DerivedSeriesOptions {
  unit?: string;
}

interface PercentGdpPerCapitaPppOptions extends DerivedSeriesOptions {
  gdpPerCapitaVariableId?: string;
}

/**
 * Convert a "% of GDP" series into a per-capita PPP series by multiplying it
 * by the matching GDP-per-capita PPP observation for each jurisdiction-year.
 */
export function buildDerivedPercentGdpPerCapitaPpp(
  raw: ReadonlyMap<string, readonly DataPoint[]>,
  percentOfGdpVariableId: string,
  sourceLabel: string,
  options: PercentGdpPerCapitaPppOptions = {},
): DataPoint[] {
  const percentRows = raw.get(percentOfGdpVariableId) ?? [];
  const gdpPerCapitaVariableId =
    options.gdpPerCapitaVariableId ?? 'outcome.wb.gdp_per_capita_ppp';
  const gdpByKey = indexByCountryYear(raw.get(gdpPerCapitaVariableId) ?? []);

  return percentRows.flatMap((row) => {
    const gdpPoint = gdpByKey.get(toCountryYearKey(row));
    if (!gdpPoint || !Number.isFinite(gdpPoint.value)) return [];

    return [{
      jurisdictionIso3: row.jurisdictionIso3,
      year: row.year,
      value: (row.value / 100) * gdpPoint.value,
      unit: options.unit ?? 'international $/person',
      source: sourceLabel,
      sourceUrl: row.sourceUrl ?? gdpPoint.sourceUrl,
      lastUpdated: row.lastUpdated ?? gdpPoint.lastUpdated,
    }];
  });
}

/**
 * Convert two aligned series into a percentage share series.
 */
export function buildDerivedShareOfVariablePercent(
  raw: ReadonlyMap<string, readonly DataPoint[]>,
  numeratorVariableId: string,
  denominatorVariableId: string,
  sourceLabel: string,
  options: DerivedSeriesOptions = {},
): DataPoint[] {
  const numeratorRows = raw.get(numeratorVariableId) ?? [];
  const denominatorByKey = indexByCountryYear(raw.get(denominatorVariableId) ?? []);

  return numeratorRows.flatMap((numeratorRow) => {
    const denominatorPoint = denominatorByKey.get(toCountryYearKey(numeratorRow));
    if (!denominatorPoint) return [];
    if (!Number.isFinite(numeratorRow.value) || !Number.isFinite(denominatorPoint.value)) {
      return [];
    }
    if (denominatorPoint.value <= 0) return [];

    const sharePercent = (numeratorRow.value / denominatorPoint.value) * 100;
    if (!Number.isFinite(sharePercent) || sharePercent < 0) return [];

    return [{
      jurisdictionIso3: numeratorRow.jurisdictionIso3,
      year: numeratorRow.year,
      value: sharePercent,
      unit: options.unit ?? '% of denominator',
      source: sourceLabel,
      sourceUrl: numeratorRow.sourceUrl ?? denominatorPoint.sourceUrl,
      lastUpdated: numeratorRow.lastUpdated ?? denominatorPoint.lastUpdated,
    }];
  });
}

/**
 * Subtract one aligned per-capita PPP series from another, suppressing
 * negative values when the derived quantity should not fall below zero.
 */
export function buildDerivedDifferencePerCapitaPpp(
  raw: ReadonlyMap<string, readonly DataPoint[]>,
  minuendVariableId: string,
  subtrahendVariableId: string,
  sourceLabel: string,
  options: DerivedSeriesOptions = {},
): DataPoint[] {
  const minuendRows = raw.get(minuendVariableId) ?? [];
  const subtrahendByKey = indexByCountryYear(raw.get(subtrahendVariableId) ?? []);

  return minuendRows.flatMap((minuendRow) => {
    const subtrahendPoint = subtrahendByKey.get(toCountryYearKey(minuendRow));
    if (!subtrahendPoint) return [];
    if (!Number.isFinite(minuendRow.value) || !Number.isFinite(subtrahendPoint.value)) {
      return [];
    }

    const difference = minuendRow.value - subtrahendPoint.value;
    if (!Number.isFinite(difference) || difference < 0) return [];

    return [{
      jurisdictionIso3: minuendRow.jurisdictionIso3,
      year: minuendRow.year,
      value: difference,
      unit: options.unit ?? 'international $/person',
      source: sourceLabel,
      sourceUrl: minuendRow.sourceUrl ?? subtrahendPoint.sourceUrl,
      lastUpdated: minuendRow.lastUpdated ?? subtrahendPoint.lastUpdated,
    }];
  });
}

/**
 * Convert a level series into year-over-year percent changes for each
 * jurisdiction. Only contiguous yearly observations are compared.
 */
export function buildDerivedYoYPercent(
  points: readonly DataPoint[],
  sourceLabel: string,
  options: DerivedSeriesOptions = {},
): DataPoint[] {
  const byJurisdiction = new Map<string, DataPoint[]>();
  for (const point of points) {
    const rows = byJurisdiction.get(point.jurisdictionIso3) ?? [];
    rows.push(point);
    byJurisdiction.set(point.jurisdictionIso3, rows);
  }

  const output: DataPoint[] = [];
  for (const [jurisdictionIso3, rows] of byJurisdiction) {
    const sorted = [...rows].sort((left, right) => left.year - right.year);
    for (let index = 1; index < sorted.length; index++) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous || !current) continue;
      if (current.year - previous.year !== 1) continue;
      if (!Number.isFinite(previous.value) || !Number.isFinite(current.value)) continue;
      if (previous.value === 0) continue;

      output.push({
        jurisdictionIso3,
        year: current.year,
        value: ((current.value - previous.value) / Math.abs(previous.value)) * 100,
        unit: options.unit ?? '% YoY',
        source: sourceLabel,
        sourceUrl: current.sourceUrl ?? previous.sourceUrl,
        lastUpdated: current.lastUpdated ?? previous.lastUpdated,
      });
    }
  }

  return output;
}

/**
 * Normalize a count series by matching population observations.
 */
export function buildDerivedRatePer100k(
  countPoints: readonly DataPoint[],
  populationPoints: readonly DataPoint[],
  sourceLabel: string,
  options: DerivedSeriesOptions = {},
): DataPoint[] {
  const populationByKey = new Map<string, DataPoint>();
  for (const point of populationPoints) {
    if (Number.isFinite(point.value) && point.value > 0) {
      populationByKey.set(toCountryYearKey(point), point);
    }
  }

  return countPoints.flatMap((point) => {
    if (!Number.isFinite(point.value)) return [];

    const populationPoint = populationByKey.get(toCountryYearKey(point));
    if (!populationPoint) return [];

    return [{
      jurisdictionIso3: point.jurisdictionIso3,
      year: point.year,
      value: (point.value / populationPoint.value) * 100_000,
      unit: options.unit ?? 'per 100,000',
      source: sourceLabel,
      sourceUrl: point.sourceUrl ?? populationPoint.sourceUrl,
      lastUpdated: point.lastUpdated ?? populationPoint.lastUpdated,
    }];
  });
}
