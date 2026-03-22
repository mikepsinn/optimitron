export const EUROSTAT_API_BASE =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
export const EUROSTAT_MEDIAN_INCOME_DATASET = 'ilc_di03';
export const EUROSTAT_HICP_DATASET = 'prc_hicp_aind';

export const EUROSTAT_MEDIAN_INCOME_SOURCE_URL =
  'https://ec.europa.eu/eurostat/databrowser/view/ilc_di03/default/table?lang=en';
export const EUROSTAT_HICP_SOURCE_URL =
  'https://ec.europa.eu/eurostat/databrowser/view/prc_hicp_aind/default/table?lang=en';

export const EUROSTAT_GEO_TO_ISO3: Record<string, string> = {
  AL: 'ALB',
  AT: 'AUT',
  BE: 'BEL',
  BG: 'BGR',
  CH: 'CHE',
  CY: 'CYP',
  CZ: 'CZE',
  DE: 'DEU',
  DK: 'DNK',
  EE: 'EST',
  EL: 'GRC',
  ES: 'ESP',
  FI: 'FIN',
  FR: 'FRA',
  HR: 'HRV',
  HU: 'HUN',
  IE: 'IRL',
  IS: 'ISL',
  IT: 'ITA',
  LT: 'LTU',
  LU: 'LUX',
  LV: 'LVA',
  ME: 'MNE',
  MK: 'MKD',
  MT: 'MLT',
  NL: 'NLD',
  NO: 'NOR',
  PL: 'POL',
  PT: 'PRT',
  RO: 'ROU',
  RS: 'SRB',
  SE: 'SWE',
  SI: 'SVN',
  SK: 'SVK',
  TR: 'TUR',
  UK: 'GBR',
  XK: 'XKX',
};

export const ISO3_TO_EUROSTAT_GEO = Object.fromEntries(
  Object.entries(EUROSTAT_GEO_TO_ISO3).map(([geo, iso3]) => [iso3, geo]),
) as Record<string, string>;

export interface EurostatJsonStatCategory {
  index?: Record<string, number>;
  label?: Record<string, string>;
}

export interface EurostatJsonStatDimension {
  label?: string;
  category?: EurostatJsonStatCategory;
}

export interface EurostatJsonStatResponse {
  id?: string[];
  size?: number[];
  value?: Record<string, number>;
  status?: Record<string, string>;
  updated?: string;
  dimension?: Record<string, EurostatJsonStatDimension>;
}

export interface EurostatMedianIncomeLocalPoint {
  jurisdictionIso3: string;
  jurisdictionName: string;
  year: number;
  nominalMedianLocalCurrency: number;
  estimateType?: string;
  sourceUrl: string;
}

export interface EurostatHicpPoint {
  jurisdictionIso3: string;
  year: number;
  hicpAnnualAverage: number;
}

export interface DerivedEurostatMedianDisposableIncomePoint {
  jurisdictionIso3: string;
  jurisdictionName: string;
  year: number;
  nominalMedianLocalCurrency: number;
  hicpAnnualAverage: number | null;
  pppPrivateConsumption: number | null;
  realMedianLocalCurrency: number | null;
  nominalMedianPppUsd: number | null;
  realMedianPppUsd: number | null;
  estimateType?: string;
  source: string;
  sourceUrl: string;
}
