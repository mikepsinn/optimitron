import { fetchPrivateConsumptionPpp } from './world-bank';
import {
  EUROSTAT_API_BASE,
  EUROSTAT_GEO_TO_ISO3,
  EUROSTAT_HICP_DATASET,
  EUROSTAT_MEDIAN_INCOME_DATASET,
  EUROSTAT_MEDIAN_INCOME_SOURCE_URL,
  ISO3_TO_EUROSTAT_GEO,
} from './eurostat-income-shared';
import type {
  DerivedEurostatMedianDisposableIncomePoint,
  EurostatHicpPoint,
  EurostatJsonStatResponse,
  EurostatMedianIncomeLocalPoint,
} from './eurostat-income-shared';
import type { DataPoint, FetchOptions } from '../types';
interface EurostatObservation {
  dimensions: Record<string, string>;
  value: number;
  status?: string;
}

export {
  EUROSTAT_HICP_SOURCE_URL,
  EUROSTAT_MEDIAN_INCOME_SOURCE_URL,
} from './eurostat-income-shared';
export type {
  DerivedEurostatMedianDisposableIncomePoint,
  EurostatJsonStatResponse,
} from './eurostat-income-shared';
function decodeEurostatPosition(position: number, sizes: number[]): number[] {
  const coordinates = new Array(sizes.length).fill(0);
  let remainder = position;

  for (let index = sizes.length - 1; index >= 0; index -= 1) {
    const size = sizes[index] ?? 1;
    coordinates[index] = remainder % size;
    remainder = Math.floor(remainder / size);
  }

  return coordinates;
}
function invertCategoryIndex(categoryIndex: Record<string, number>): string[] {
  const inverted: string[] = [];
  for (const [key, value] of Object.entries(categoryIndex)) {
    inverted[value] = key;
  }
  return inverted;
}
export function extractEurostatObservations(
  json: EurostatJsonStatResponse,
): EurostatObservation[] {
  const dimensionIds = json.id ?? [];
  const dimensionSizes = json.size ?? [];
  if (dimensionIds.length === 0 || dimensionIds.length !== dimensionSizes.length) {
    return [];
  }

  const labelsByDimension = Object.fromEntries(
    dimensionIds.map((dimensionId) => [
      dimensionId,
      invertCategoryIndex(json.dimension?.[dimensionId]?.category?.index ?? {}),
    ]),
  ) as Record<string, string[]>;

  return Object.entries(json.value ?? {})
    .flatMap(([positionKey, value]) => {
      if (!Number.isFinite(value)) return [];
      const coordinates = decodeEurostatPosition(Number(positionKey), dimensionSizes);
      const dimensions = Object.fromEntries(
        dimensionIds.map((dimensionId, index) => [
          dimensionId,
          labelsByDimension[dimensionId]?.[coordinates[index] ?? 0] ?? '',
        ]),
      );

      return [{
        dimensions,
        value,
        status: json.status?.[positionKey],
      }];
    });
}
export function extractEurostatMedianIncomeLocalCurrencyPoints(
  json: EurostatJsonStatResponse,
  options: FetchOptions = {},
): EurostatMedianIncomeLocalPoint[] {
  const geoDimension = json.dimension?.['geo'];

  return extractEurostatObservations(json)
    .flatMap((observation) => {
      const geo = observation.dimensions['geo'];
      const iso3 = geo ? EUROSTAT_GEO_TO_ISO3[geo] : undefined;
      const year = Number.parseInt(observation.dimensions['time'] ?? '', 10);
      if (!iso3 || !Number.isFinite(year)) return [];
      if (options.jurisdictions?.length && !options.jurisdictions.includes(iso3)) {
        return [];
      }
      if (options.period && year < options.period.startYear) return [];
      if (options.period && year > options.period.endYear) return [];

      return [{
        jurisdictionIso3: iso3,
        jurisdictionName:
          (geo ? geoDimension?.category?.label?.[geo] : undefined) ?? iso3,
        year,
        nominalMedianLocalCurrency: observation.value,
        estimateType: observation.status,
        sourceUrl: EUROSTAT_MEDIAN_INCOME_SOURCE_URL,
      }];
    })
    .sort((a, b) => {
      if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
        return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
      }
      return a.year - b.year;
    });
}
export function extractEurostatHicpPoints(
  json: EurostatJsonStatResponse,
): EurostatHicpPoint[] {
  return extractEurostatObservations(json)
    .flatMap((observation) => {
      const geo = observation.dimensions['geo'];
      const iso3 = geo ? EUROSTAT_GEO_TO_ISO3[geo] : undefined;
      const year = Number.parseInt(observation.dimensions['time'] ?? '', 10);
      if (!iso3 || !Number.isFinite(year)) return [];

      return [{
        jurisdictionIso3: iso3,
        year,
        hicpAnnualAverage: observation.value,
      }];
    })
    .sort((a, b) => {
      if (a.jurisdictionIso3 !== b.jurisdictionIso3) {
        return a.jurisdictionIso3.localeCompare(b.jurisdictionIso3);
      }
      return a.year - b.year;
    });
}
export function deriveEurostatRealMedianDisposableIncome(
  medianPoints: EurostatMedianIncomeLocalPoint[],
  hicpPoints: EurostatHicpPoint[],
  pppPoints: DataPoint[],
): DerivedEurostatMedianDisposableIncomePoint[] {
  const hicpByKey = new Map<string, number>(
    hicpPoints.map((point) => [`${point.jurisdictionIso3}:${point.year}`, point.hicpAnnualAverage]),
  );
  const pppByKey = new Map<string, number>(
    pppPoints.map((point) => [`${point.jurisdictionIso3}:${point.year}`, point.value]),
  );

  return medianPoints.map((point) => {
    const key = `${point.jurisdictionIso3}:${point.year}`;
    const hicpAnnualAverage = hicpByKey.get(key) ?? null;
    const pppPrivateConsumption = pppByKey.get(key) ?? null;
    const realMedianLocalCurrency =
      hicpAnnualAverage && hicpAnnualAverage !== 0
        ? point.nominalMedianLocalCurrency / (hicpAnnualAverage / 100)
        : null;
    const nominalMedianPppUsd =
      pppPrivateConsumption && pppPrivateConsumption !== 0
        ? point.nominalMedianLocalCurrency / pppPrivateConsumption
        : null;
    const realMedianPppUsd =
      realMedianLocalCurrency !== null &&
      pppPrivateConsumption &&
      pppPrivateConsumption !== 0
        ? realMedianLocalCurrency / pppPrivateConsumption
        : null;

    return {
      jurisdictionIso3: point.jurisdictionIso3,
      jurisdictionName: point.jurisdictionName,
      year: point.year,
      nominalMedianLocalCurrency: point.nominalMedianLocalCurrency,
      hicpAnnualAverage,
      pppPrivateConsumption,
      realMedianLocalCurrency,
      nominalMedianPppUsd,
      realMedianPppUsd,
      estimateType: point.estimateType,
      source: 'Eurostat EU-SILC',
      sourceUrl: point.sourceUrl,
    };
  });
}
export async function fetchEurostatMedianDisposableIncomeSeries(
  options: FetchOptions = {},
): Promise<DerivedEurostatMedianDisposableIncomePoint[]> {
  const eurostatJurisdictions =
    options.jurisdictions?.filter(
      (jurisdictionIso3) => ISO3_TO_EUROSTAT_GEO[jurisdictionIso3],
    ) ?? undefined;

  try {
    const [incomeResponse, hicpResponse, pppPoints] = await Promise.all([
      fetch(
        `${EUROSTAT_API_BASE}/${EUROSTAT_MEDIAN_INCOME_DATASET}?lang=EN&age=TOTAL&sex=T&indic_il=MED_E&unit=NAC`,
      ),
      fetch(
        `${EUROSTAT_API_BASE}/${EUROSTAT_HICP_DATASET}?lang=EN&unit=INX_A_AVG&coicop=CP00`,
      ),
      fetchPrivateConsumptionPpp({
        jurisdictions: eurostatJurisdictions,
        period: options.period,
      }),
    ]);

    if (!incomeResponse.ok) {
      console.warn(
        `Eurostat median-income API ${incomeResponse.status}: ${incomeResponse.statusText}`,
      );
      return [];
    }
    if (!hicpResponse.ok) {
      console.warn(
        `Eurostat HICP API ${hicpResponse.status}: ${hicpResponse.statusText}`,
      );
      return [];
    }

    const [incomeJson, hicpJson] = await Promise.all([
      incomeResponse.json() as Promise<EurostatJsonStatResponse>,
      hicpResponse.json() as Promise<EurostatJsonStatResponse>,
    ]);

    const medianPoints = extractEurostatMedianIncomeLocalCurrencyPoints(
      incomeJson,
      { jurisdictions: eurostatJurisdictions, period: options.period },
    );
    const hicpPoints = extractEurostatHicpPoints(hicpJson).filter((point) => {
      if (
        eurostatJurisdictions?.length &&
        !eurostatJurisdictions.includes(point.jurisdictionIso3)
      ) {
        return false;
      }
      if (options.period && point.year < options.period.startYear) return false;
      if (options.period && point.year > options.period.endYear) return false;
      return true;
    });

    return deriveEurostatRealMedianDisposableIncome(
      medianPoints,
      hicpPoints,
      pppPoints,
    );
  } catch (error) {
    console.error('Eurostat median-income fetch error:', error);
    return [];
  }
}
