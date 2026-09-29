import type { DataPoint, FetchOptions } from '../types';
import { INCOME_PRICE_REFERENCE_YEAR, positiveValue, toReferenceYearIncome } from './income-price-basis';
import type { IncomePriceBasis } from './income-price-basis';

const OECD_IDD_BASE = 'https://sdmx.oecd.org/public/rest/v1/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD,1.0';

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
      structure?: number;
      observations?: Record<string, [number, ...unknown[]]>;
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
    structure?: number;
    observations?: Record<string, [number, ...unknown[]]>;
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

export interface DerivedOecdMedianDisposableIncomePoint extends IncomePriceBasis {
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

/** OECD IDD countries with data (all OECD members + key partners) */
export const OECD_IDD_COUNTRIES = [
  'AUS', 'AUT', 'BEL', 'CAN', 'CHE', 'CHL', 'CHN', 'COL', 'CRI', 'CZE',
  'DEU', 'DNK', 'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GRC', 'HUN', 'IND',
  'IRL', 'ISL', 'ISR', 'ITA', 'JPN', 'KOR', 'LTU', 'LUX', 'LVA', 'MEX',
  'NLD', 'NOR', 'NZL', 'POL', 'PRT', 'RUS', 'SVK', 'SVN', 'SWE', 'TUR',
  'USA',
];

export const OECD_IDD_SELECTORS = {
  MEDIAN_DISPOSABLE_INCOME_TOTAL: {
    refArea: OECD_IDD_COUNTRIES,
    frequency: 'A',
    measure: 'INC_DISP',
    statisticalOperation: 'MEDIAN',
    unitMeasure: 'XDC_HH_EQ',
    age: '_T',
    methodology: 'METH2012',
    definition: 'D_CUR',
    povertyLine: '_Z',
  },
  CPI_TOTAL: {
    refArea: OECD_IDD_COUNTRIES,
    frequency: 'A',
    measure: 'CPI',
    statisticalOperation: '_Z',
    unitMeasure: 'IX',
    age: '_T',
    methodology: 'METH2012',
    definition: 'D_CUR',
    povertyLine: '_Z',
  },
  PPP_PRIVATE_CONSUMPTION_TOTAL: {
    refArea: OECD_IDD_COUNTRIES,
    frequency: 'A',
    measure: 'PPP_PRC',
    statisticalOperation: '_Z',
    unitMeasure: 'XDC_USD',
    age: '_T',
    methodology: 'METH2012',
    definition: 'D_CUR',
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
  // AllDimensions avoids duplicate series keys returned by the IDD API's
  // TIME_PERIOD layout, which JSON.parse would silently overwrite.
  const dataSets = json.data?.dataSets ?? json.dataSets ?? [];
  if (dataSets.some(dataSet => dataSet.observations)) {
    const points: OecdIddPoint[] = [];
    for (const dataSet of dataSets) {
      const dimensions = (json.data?.structures?.[dataSet.structure ?? 0]
        ?? json.structure)?.dimensions?.observation ?? [];
      const timeIndex = dimensions.findIndex(dimension => dimension.id === 'TIME_PERIOD');
      if (timeIndex < 0) continue;
      for (const [key, observation] of Object.entries(dataSet.observations ?? {})) {
        const decoded = decodeSeriesPoint(key, dimensions);
        const year = Number(dimensions[timeIndex]?.values?.[Number(key.split(':')[timeIndex])]?.id);
        const value = observation[0];
        if (!decoded || !Number.isInteger(year) || !Number.isFinite(value)) continue;
        const point = { ...decoded, year, value, source, sourceUrl: 'https://data-explorer.oecd.org' };
        if (selectorMatches(point, selector)) points.push(point);
      }
    }
    return points.sort((a, b) => a.jurisdictionIso3.localeCompare(b.jurisdictionIso3) || a.year - b.year);
  }
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
        timeDimension.values[parseInt(observationKey, 10)]?.id;
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
  fallbackPppPoints?: DataPoint[],
  options: { referenceYear?: number; fallbackCpiPoints?: DataPoint[] } = {},
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

  const wbPppByKey = new Map((fallbackPppPoints ?? []).map(p => [`${p.jurisdictionIso3}:${p.year}`, p]));
  const wbCpiByKey = new Map((options.fallbackCpiPoints ?? []).map(p => [`${p.jurisdictionIso3}:${p.year}`, p]));
  const referenceYear = options.referenceYear ?? INCOME_PRICE_REFERENCE_YEAR;

  return selectedMedianPoints.map((point) => {
    const key = `${point.jurisdictionIso3}:${point.year}`;
    const referenceKey = `${point.jurisdictionIso3}:${referenceYear}`;
    // Never mix CPI index bases within a country. Fall back as a pair.
    const hasOecdPair = positiveValue(cpiByKey.get(key)?.value) !== null
      && positiveValue(cpiByKey.get(referenceKey)?.value) !== null;
    const cpiPoint = hasOecdPair ? cpiByKey.get(key) : wbCpiByKey.get(key);
    const referenceCpiPoint = hasOecdPair ? cpiByKey.get(referenceKey) : wbCpiByKey.get(referenceKey);
    const pppPoint = pppByKey.get(key) ?? wbPppByKey.get(key);
    const referencePppPoint = pppByKey.get(referenceKey) ?? wbPppByKey.get(referenceKey);
    const cpi = positiveValue(cpiPoint?.value);
    const referenceCpi = positiveValue(referenceCpiPoint?.value);
    const referencePpp = positiveValue(referencePppPoint?.value);
    const ppp = positiveValue(pppPoint?.value);
    const realMedianLocalCurrency = toReferenceYearIncome(point.value, cpi, referenceCpi);
    const nominalMedianPppUsd = ppp && ppp !== 0 ? point.value / ppp : null;
    const realMedianPppUsd =
      realMedianLocalCurrency !== null && referencePpp !== null
        ? realMedianLocalCurrency / referencePpp
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
      priceReferenceYear: referenceYear,
      referenceCpi,
      referencePpp,
      priceIndexSource: cpiPoint?.source ?? '',
      pppSource: referencePppPoint?.source ?? '',
      nominalPppSource: pppPoint?.source ?? '',
      methodology: point.methodology,
      definition: point.definition,
      source: point.source,
      sourceUrl: point.sourceUrl,
    };
  });
}

export function buildOECDIDDUrl(
  selector: OecdIddSelector = {},
  options: FetchOptions = {},
): string {
  const refArea = selector.refArea
    ? Array.isArray(selector.refArea)
      ? selector.refArea.join('+')
      : selector.refArea
    : '';
  const filter = [
    refArea,
    selector.frequency ?? 'A',
    selector.measure ?? '',
    selector.statisticalOperation ?? '',
    selector.unitMeasure ?? '',
    selector.age ?? '',
    selector.methodology ?? '',
    selector.definition ?? '',
    selector.povertyLine ?? '',
  ].join('.');
  const startYear = options.period?.startYear;
  const endYear = options.period?.endYear;
  const params = new URLSearchParams();
  if (startYear && endYear) {
    params.set('startPeriod', String(startYear));
    params.set('endPeriod', String(endYear));
  }
  params.set('dimensionAtObservation', 'AllDimensions');
  return `${OECD_IDD_BASE}/${filter}?${params.toString()}`;
}

export async function fetchOECDIDDPoints(
  selector: OecdIddSelector = {},
  options: FetchOptions = {},
): Promise<OecdIddPoint[]> {
  const url = buildOECDIDDUrl(selector, options);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.sdmx.data+json;version=2.0.0',
        'Accept-Language': 'en',
      },
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
