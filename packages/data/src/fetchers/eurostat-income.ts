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
import { INCOME_PRICE_REFERENCE_YEAR, positiveValue, toReferenceYearIncome } from './income-price-basis';
interface EurostatObservation {
  dimensions: Record<string, string>;
  value: number;
  status?: string;
}

// Audited ilc_di03 NAC currency breaks in the September 2026 source snapshot,
// not euro-adoption dates. WDI's refreshed PPP series use the current euro unit
// for these countries, while earlier NAC observations retain legacy currencies.
// Cyprus and Malta's published breaks differ from their adoption dates; Latvia
// and Estonia already back-convert NAC history and must not be excluded here.
// See ilc_di03 and WDI PA.NUS.PRVT.PP; do not use historical market exchange rates
// to bridge the mismatch. Retain the source observation until a verified currency
// conversion is available.
const EUROSTAT_NAC_EURO_UNIT_START_YEAR: Readonly<Record<string, number>> = {
  BGR: 2026,
  HRV: 2023,
  LTU: 2015,
  CYP: 2009,
  MLT: 2007,
  SVN: 2007,
  SVK: 2009,
};

export {
  EUROSTAT_HICP_SOURCE_URL,
  EUROSTAT_MEDIAN_INCOME_SOURCE_URL,
} from './eurostat-income-shared';
export type {
  DerivedEurostatMedianDisposableIncomePoint,
  EurostatJsonStatResponse,
} from './eurostat-income-shared';
function decodeEurostatPosition(position: number, sizes: number[]): number[] {
  const coordinates = Array.from({ length: sizes.length }, () => 0);
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
  referenceYear = INCOME_PRICE_REFERENCE_YEAR,
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
    const referenceKey = `${point.jurisdictionIso3}:${referenceYear}`;
    const pppPrivateConsumption = positiveValue(pppByKey.get(key));
    const referenceCpi = positiveValue(hicpByKey.get(referenceKey));
    const referencePpp = positiveValue(pppByKey.get(referenceKey));
    const euroUnitStartYear = EUROSTAT_NAC_EURO_UNIT_START_YEAR[point.jurisdictionIso3];
    const pppCurrencyCompatible = euroUnitStartYear === undefined || point.year >= euroUnitStartYear;
    const pppCurrencyCompatibilityNote = pppCurrencyCompatible
      ? undefined
      : `Eurostat NAC before ${euroUnitStartYear} retains a legacy national currency, while the refreshed World Bank PPP series is euro-denominated. Nominal NAC is retained; real and PPP conversions are withheld until currency units can be verified.`;
    // A CPI ratio adjusts prices, not currency denominations. Suppress real NAC
    // too, rather than label legacy-currency amounts as reference-year currency.
    const realMedianLocalCurrency = pppCurrencyCompatible
      ? toReferenceYearIncome(point.nominalMedianLocalCurrency, hicpAnnualAverage, referenceCpi)
      : null;
    const nominalMedianPppUsd =
      pppCurrencyCompatible && pppPrivateConsumption !== null
        ? point.nominalMedianLocalCurrency / pppPrivateConsumption
        : null;
    const realMedianPppUsd =
      realMedianLocalCurrency !== null &&
      referencePpp !== null
        ? realMedianLocalCurrency / referencePpp
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
      pppCurrencyCompatible,
      pppCurrencyCompatibilityNote,
      priceReferenceYear: referenceYear,
      referenceCpi,
      referencePpp,
      priceIndexSource: 'Eurostat HICP',
      pppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
      nominalPppSource: 'World Bank WDI (PA.NUS.PRVT.PP)',
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
        `${EUROSTAT_API_BASE}/${EUROSTAT_MEDIAN_INCOME_DATASET}?lang=EN&age=TOTAL&sex=T&statinfo=MED_EI&unit=NAC`,
      ),
      fetch(
        `${EUROSTAT_API_BASE}/${EUROSTAT_HICP_DATASET}?lang=EN&unit=INX_A_AVG&coicop=CP00`,
      ),
      fetchPrivateConsumptionPpp({
        jurisdictions: eurostatJurisdictions,
        period: options.period ? {
          startYear: Math.min(options.period.startYear, INCOME_PRICE_REFERENCE_YEAR),
          endYear: Math.max(options.period.endYear, INCOME_PRICE_REFERENCE_YEAR),
        } : undefined,
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
      if (point.year === INCOME_PRICE_REFERENCE_YEAR) return true;
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
