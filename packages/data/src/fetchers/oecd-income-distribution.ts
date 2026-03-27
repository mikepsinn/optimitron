import type { FetchOptions } from '../types';

const OECD_IDD_LEGACY_BASE = 'https://stats.oecd.org/SDMX-JSON/data/IDD';

export interface OecdIddDimensionValue {
  id: string;
  name?: string;
}

export interface OecdIddDimension {
  id: string;
  values?: OecdIddDimensionValue[];
}

export interface OecdIddSeries {
  observations?: Record<string, [number, ...unknown[]]>;
}

export interface OecdIddResponse {
  data?: {
    dataSets?: Array<{
      series?: Record<string, OecdIddSeries>;
    }>;
    structures?: Array<{
      dimensions?: {
        series?: OecdIddDimension[];
        observation?: OecdIddDimension[];
      };
    }>;
  };
  dataSets?: Array<{
    series?: Record<string, OecdIddSeries>;
  }>;
  structure?: {
    dimensions?: {
      series?: OecdIddDimension[];
      observation?: OecdIddDimension[];
    };
  };
}

export interface OecdIddSelector {
  refArea?: string | string[];
  frequency?: string;
  measure?: string;
  statisticalOperation?: string;
  unitMeasure?: string;
  age?: string;
  methodology?: string;
  definition?: string;
  povertyLine?: string;
}

export interface OecdIddPoint {
  jurisdictionIso3: string;
  jurisdictionName?: string;
  year: number;
  value: number;
  measure: string;
  statisticalOperation: string;
  unitMeasure: string;
  age: string;
  methodology: string;
  definition: string;
  povertyLine: string;
  source: string;
  sourceUrl: string;
}

export interface DerivedOecdMedianDisposableIncomePoint {
  jurisdictionIso3: string;
  jurisdictionName?: string;
  year: number;
  nominalMedianLocalCurrency: number;
  cpi: number | null;
  pppPrivateConsumption: number | null;
  realMedianLocalCurrency: number | null;
  nominalMedianPppUsd: number | null;
  realMedianPppUsd: number | null;
  methodology: string;
  definition: string;
  source: string;
  sourceUrl: string;
}

export const OECD_IDD_SELECTORS = {
  MEDIAN_DISPOSABLE_INCOME_TOTAL: {
    frequency: 'A',
    measure: 'INC_DISP',
    statisticalOperation: 'MEDIAN',
    unitMeasure: 'XDC_HH_EQ',
    age: '_T',
    povertyLine: '_Z',
  },
  CPI_TOTAL: {
    frequency: 'A',
    measure: 'CPI',
    statisticalOperation: '_Z',
    unitMeasure: 'IX',
    age: '_T',
    povertyLine: '_Z',
  },
  PPP_PRIVATE_CONSUMPTION_TOTAL: {
    frequency: 'A',
    measure: 'PPP_PRC',
    statisticalOperation: '_Z',
    unitMeasure: 'XDC_USD',
    age: '_T',
    povertyLine: '_Z',
  },
} as const;

function getOecdIddSeries(
  json: OecdIddResponse,
): Record<string, OecdIddSeries> {
  return json.data?.dataSets?.[0]?.series ?? json.dataSets?.[0]?.series ?? {};
}

function getOecdIddDimensions(
  json: OecdIddResponse,
): {
  series: OecdIddDimension[];
  observation: OecdIddDimension[];
} {
  const dimensions =
    json.data?.structures?.[0]?.dimensions ?? json.structure?.dimensions;

  return {
    series: dimensions?.series ?? [],
    observation: dimensions?.observation ?? [],
  };
}

function selectorMatches(
  point: OecdIddPoint,
  selector: OecdIddSelector,
): boolean {
  if (selector.refArea) {
    const allowedAreas = Array.isArray(selector.refArea)
      ? selector.refArea
      : [selector.refArea];
    if (!allowedAreas.includes(point.jurisdictionIso3)) return false;
  }
  if (selector.measure && point.measure !== selector.measure) return false;
  if (
    selector.statisticalOperation &&
    point.statisticalOperation !== selector.statisticalOperation
  ) {
    return false;
  }
  if (selector.unitMeasure && point.unitMeasure !== selector.unitMeasure) {
    return false;
  }
  if (selector.age && point.age !== selector.age) return false;
  if (selector.methodology && point.methodology !== selector.methodology) {
    return false;
  }
  if (selector.definition && point.definition !== selector.definition) {
    return false;
  }
  if (selector.povertyLine && point.povertyLine !== selector.povertyLine) {
    return false;
  }

  return true;
}

function decodeSeriesPoint(
  seriesKey: string,
  seriesDimensions: OecdIddDimension[],
): Omit<OecdIddPoint, 'year' | 'value' | 'source' | 'sourceUrl'> | null {
  const indices = seriesKey.split(':').map(Number);
  const decoded = new Map<string, OecdIddDimensionValue | undefined>();

  for (let i = 0; i < indices.length; i++) {
    decoded.set(
      seriesDimensions[i]?.id ?? `UNKNOWN_${i}`,
      seriesDimensions[i]?.values?.[indices[i] ?? 0],
    );
  }

  const refArea = decoded.get('REF_AREA');
  const measure = decoded.get('MEASURE');
  const statisticalOperation = decoded.get('STATISTICAL_OPERATION');
  const unitMeasure = decoded.get('UNIT_MEASURE');
  const age = decoded.get('AGE');
  const methodology = decoded.get('METHODOLOGY');
  const definition = decoded.get('DEFINITION');
  const povertyLine = decoded.get('POVERTY_LINE');

  if (
    !refArea?.id ||
    !measure?.id ||
    !statisticalOperation?.id ||
    !unitMeasure?.id ||
    !age?.id ||
    !methodology?.id ||
    !definition?.id ||
    !povertyLine?.id
  ) {
    return null;
  }

  return {
    jurisdictionIso3: refArea.id,
    jurisdictionName: refArea.name,
    measure: measure.id,
    statisticalOperation: statisticalOperation.id,
    unitMeasure: unitMeasure.id,
    age: age.id,
    methodology: methodology.id,
    definition: definition.id,
    povertyLine: povertyLine.id,
  };
}

export function extractOecdIddPoints(
  json: OecdIddResponse,
  selector: OecdIddSelector = {},
  source = 'OECD IDD',
): OecdIddPoint[] {
  const series = getOecdIddSeries(json);
  const dimensions = getOecdIddDimensions(json);
  const timeDimension = dimensions.observation.find(
    (dimension) => dimension.id === 'TIME_PERIOD',
  );

  if (!timeDimension?.values?.length) return [];

  const points: OecdIddPoint[] = [];

  for (const [seriesKey, seriesEntry] of Object.entries(series)) {
    const decoded = decodeSeriesPoint(seriesKey, dimensions.series);
    if (!decoded) continue;

    const observations = seriesEntry.observations ?? {};
    for (const [observationKey, observationValue] of Object.entries(
      observations,
    )) {
      const timeValue =
        timeDimension.values?.[parseInt(observationKey, 10)]?.id;
      const numericValue = observationValue[0];

      if (
        !timeValue ||
        typeof numericValue !== 'number' ||
        Number.isNaN(numericValue)
      ) {
        continue;
      }

      const point: OecdIddPoint = {
        ...decoded,
        year: parseInt(timeValue, 10),
        value: numericValue,
        source,
        sourceUrl: 'https://data-explorer.oecd.org',
      };

      if (!selectorMatches(point, selector)) continue;
      points.push(point);
    }
  }

  return points.sort((a, b) => {
    if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
      return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
    }
    return a.year - b.year;
  });
}

function getOecdPreferenceScore(point: OecdIddPoint): number {
  let score = 0;

  if (point.methodology === 'METH2012') score += 20;
  if (point.methodology === 'METH2011') score += 10;
  if (point.definition === 'D_CUR') score += 3;
  if (point.definition === 'D_PREV') score += 2;
  if (point.definition === 'D_INC') score += 1;

  return score;
}

export function selectPreferredOecdIddPoints(
  points: OecdIddPoint[],
): OecdIddPoint[] {
  const byJurisdictionYear = new Map<string, OecdIddPoint>();

  for (const point of points) {
    const key = `${point.jurisdictionIso3}:${point.year}`;
    const existing = byJurisdictionYear.get(key);
    if (
      !existing ||
      getOecdPreferenceScore(point) > getOecdPreferenceScore(existing)
    ) {
      byJurisdictionYear.set(key, point);
    }
  }

  return [...byJurisdictionYear.values()].sort((a, b) => {
    if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
      return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
    }
    return a.year - b.year;
  });
}

export function deriveOecdRealMedianDisposableIncome(
  medianPoints: OecdIddPoint[],
  cpiPoints: OecdIddPoint[],
  pppPoints: OecdIddPoint[],
): DerivedOecdMedianDisposableIncomePoint[] {
  const selectedMedianPoints = selectPreferredOecdIddPoints(medianPoints);
  const selectedCpiPoints = selectPreferredOecdIddPoints(cpiPoints);
  const selectedPppPoints = selectPreferredOecdIddPoints(pppPoints);

  const cpiByKey = new Map<string, OecdIddPoint>(
    selectedCpiPoints.map((point) => [`${point.jurisdictionIso3}:${point.year}`, point]),
  );
  const pppByKey = new Map<string, OecdIddPoint>(
    selectedPppPoints.map((point) => [`${point.jurisdictionIso3}:${point.year}`, point]),
  );

  return selectedMedianPoints.map((point) => {
    const key = `${point.jurisdictionIso3}:${point.year}`;
    const cpiPoint = cpiByKey.get(key);
    const pppPoint = pppByKey.get(key);
    const cpi = cpiPoint?.value ?? null;
    const ppp = pppPoint?.value ?? null;
    const realMedianLocalCurrency =
      cpi && cpi !== 0 ? point.value / (cpi / 100) : null;
    const nominalMedianPppUsd = ppp && ppp !== 0 ? point.value / ppp : null;
    const realMedianPppUsd =
      realMedianLocalCurrency !== null && ppp && ppp !== 0
        ? realMedianLocalCurrency / ppp
        : null;

    return {
      jurisdictionIso3: point.jurisdictionIso3,
      jurisdictionName: point.jurisdictionName,
      year: point.year,
      nominalMedianLocalCurrency: point.value,
      cpi,
      pppPrivateConsumption: ppp,
      realMedianLocalCurrency,
      nominalMedianPppUsd,
      realMedianPppUsd,
      methodology: point.methodology,
      definition: point.definition,
      source: point.source,
      sourceUrl: point.sourceUrl,
    };
  });
}

export function buildOECDIDDLegacyUrl(
  selector: OecdIddSelector = {},
  options: FetchOptions = {},
): string {
  const refArea = selector.refArea
    ? Array.isArray(selector.refArea)
      ? selector.refArea.join('+')
      : selector.refArea
    : 'all';
  const filter = [
    refArea,
    selector.frequency ?? 'A',
    selector.measure ?? 'all',
    selector.statisticalOperation ?? 'all',
    selector.unitMeasure ?? 'all',
    selector.age ?? 'all',
    selector.methodology ?? 'all',
    selector.definition ?? 'all',
    selector.povertyLine ?? 'all',
  ].join('.');
  const startYear = options.period?.startYear;
  const endYear = options.period?.endYear;
  const periodQuery =
    startYear && endYear
      ? `?startTime=${startYear}&endTime=${endYear}`
      : '';

  return `${OECD_IDD_LEGACY_BASE}/${filter}/all${periodQuery}`;
}

export async function fetchOECDIDDPoints(
  selector: OecdIddSelector = {},
  options: FetchOptions = {},
): Promise<OecdIddPoint[]> {
  const url = buildOECDIDDLegacyUrl(selector, options);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.sdmx.data+json;version=2.0' },
    });

    if (!response.ok) {
      console.warn(`OECD IDD API ${response.status}: ${response.statusText}`);
      return [];
    }

    const json = (await response.json()) as OecdIddResponse;
    return extractOecdIddPoints(json, selector);
  } catch (error) {
    console.error('OECD IDD fetch error:', error);
    return [];
  }
}
