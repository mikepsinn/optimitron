/**
 * Inflation Adjustment & Per-Capita Conversion
 *
 * Converts nominal USD values to real (inflation-adjusted) per-capita values.
 *
 * Uses embedded CPI-U and population data so the conversion works offline
 * without a FRED API key. Data sources:
 * - CPI-U: Bureau of Labor Statistics (annual average, 1982-84=100)
 * - Population: US Census Bureau / BLS (thousands, mid-year)
 *
 * Default base year is 2017 to match the OECD PPP constant-dollar convention
 * used in the cross-country analysis.
 */

/** Annual CPI-U average (all urban consumers, all items, 1982-84 = 100) */
const CPI_U: Record<number, number> = {
  2000: 172.2,
  2001: 177.1,
  2002: 179.9,
  2003: 184.0,
  2004: 188.9,
  2005: 195.3,
  2006: 201.6,
  2007: 207.3,
  2008: 215.3,
  2009: 214.5,
  2010: 218.1,
  2011: 224.9,
  2012: 229.6,
  2013: 233.0,
  2014: 236.7,
  2015: 237.0,
  2016: 240.0,
  2017: 245.1,
  2018: 251.1,
  2019: 255.7,
  2020: 258.8,
  2021: 271.0,
  2022: 292.7,
  2023: 304.7,
  2024: 314.2,
  2025: 321.0, // CBO projection
};

/** US population in thousands (mid-year estimate, Census/BLS) */
const US_POPULATION_THOUSANDS: Record<number, number> = {
  2000: 282_162,
  2001: 285_082,
  2002: 287_804,
  2003: 290_326,
  2004: 293_046,
  2005: 295_753,
  2006: 298_593,
  2007: 301_580,
  2008: 304_375,
  2009: 307_007,
  2010: 309_327,
  2011: 311_583,
  2012: 313_877,
  2013: 316_060,
  2014: 318_386,
  2015: 320_743,
  2016: 323_072,
  2017: 325_147,
  2018: 327_096,
  2019: 328_330,
  2020: 331_449,
  2021: 332_049,
  2022: 333_288,
  2023: 335_893,
  2024: 337_500, // Census estimate
  2025: 339_000, // Census projection
};

const DEFAULT_BASE_YEAR = 2017;

/**
 * Get CPI-U value for a year. Returns undefined if year is out of range.
 */
export function getCpiForYear(year: number): number | undefined {
  return CPI_U[year];
}

/**
 * Get US population for a year. Returns undefined if year is out of range.
 */
export function getUSPopulationForYear(year: number): number | undefined {
  const thousands = US_POPULATION_THOUSANDS[year];
  return thousands !== undefined ? thousands * 1000 : undefined;
}

/**
 * Get the CPI deflator: multiply a nominal value by this to get real dollars.
 *
 * deflator = CPI(baseYear) / CPI(nominalYear)
 *
 * Example: deflateToReal(100, 2000, 2017) → 100 * (245.1 / 172.2) ≈ 142.33
 * (i.e. $100 in 2000 is equivalent to $142.33 in 2017 dollars)
 */
export function cpiDeflator(nominalYear: number, baseYear: number = DEFAULT_BASE_YEAR): number {
  const cpiNominal = CPI_U[nominalYear];
  const cpiBase = CPI_U[baseYear];
  if (cpiNominal === undefined || cpiBase === undefined) {
    throw new Error(
      `CPI data not available for year ${cpiNominal === undefined ? nominalYear : baseYear}. ` +
        `Available range: ${Math.min(...Object.keys(CPI_U).map(Number))}–${Math.max(...Object.keys(CPI_U).map(Number))}`,
    );
  }
  return cpiBase / cpiNominal;
}

/**
 * Convert a nominal USD amount to real (constant) dollars.
 *
 * @param nominalUsd - Value in current-year dollars
 * @param nominalYear - Year the nominal value is from
 * @param baseYear - Target year for constant dollars (default: 2017)
 * @returns Value in constant baseYear dollars
 */
export function deflateToReal(
  nominalUsd: number,
  nominalYear: number,
  baseYear: number = DEFAULT_BASE_YEAR,
): number {
  return nominalUsd * cpiDeflator(nominalYear, baseYear);
}

/**
 * Convert nominal USD to real per-capita dollars.
 *
 * This is the main function for fixing the US federal budget analysis:
 * takes billions of current-year USD and returns per-person constant dollars.
 *
 * @param nominalBillionsUsd - Spending in billions of current-year USD
 * @param year - Year of the spending
 * @param baseYear - Target year for constant dollars (default: 2017)
 * @returns Per-capita spending in constant baseYear dollars
 */
export function toRealPerCapita(
  nominalBillionsUsd: number,
  year: number,
  baseYear: number = DEFAULT_BASE_YEAR,
): number {
  const population = getUSPopulationForYear(year);
  if (population === undefined) {
    throw new Error(
      `Population data not available for year ${year}. ` +
        `Available range: ${Math.min(...Object.keys(US_POPULATION_THOUSANDS).map(Number))}–${Math.max(...Object.keys(US_POPULATION_THOUSANDS).map(Number))}`,
    );
  }

  const realBillions = deflateToReal(nominalBillionsUsd, year, baseYear);
  return (realBillions * 1e9) / population;
}

/**
 * Convert an array of {year, amount} pairs (nominal billions) to real per-capita.
 *
 * Useful for transforming the US_FEDERAL_BUDGET historicalSpending arrays.
 */
export function historicalToRealPerCapita(
  entries: Array<{ year: number; amount: number }>,
  baseYear: number = DEFAULT_BASE_YEAR,
): Array<{ year: number; nominalBillions: number; realPerCapita: number }> {
  return entries.map((e) => ({
    year: e.year,
    nominalBillions: e.amount,
    realPerCapita: toRealPerCapita(e.amount, e.year, baseYear),
  }));
}

/** Years for which both CPI and population data are available */
export function availableYears(): number[] {
  const cpiYears = new Set(Object.keys(CPI_U).map(Number));
  return Object.keys(US_POPULATION_THOUSANDS)
    .map(Number)
    .filter((y) => cpiYears.has(y))
    .sort((a, b) => a - b);
}
