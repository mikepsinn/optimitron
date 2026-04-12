/**
 * Inflation-adjustment and per-capita utilities for FRED economic data.
 *
 * CPI source: FRED CPIAUCSL (Consumer Price Index for All Urban Consumers: All Items)
 *   Annual averages, index 1982-84 = 100.
 * Population source: FRED POP (Total Population: All Ages including Armed Forces Overseas)
 *   In thousands; stored here in millions for convenience.
 *
 * Both series cover 1950–2023.
 */

// ── CPI annual averages (FRED CPIAUCSL, 1982-84 = 100) ─────────────────────
const CPI: Record<number, number> = {
  1950: 24.1,
  1951: 26.0,
  1952: 26.5,
  1953: 26.7,
  1954: 26.9,
  1955: 26.8,
  1956: 27.2,
  1957: 28.1,
  1958: 28.9,
  1959: 29.1,
  1960: 29.6,
  1961: 29.9,
  1962: 30.2,
  1963: 30.6,
  1964: 31.0,
  1965: 31.5,
  1966: 32.4,
  1967: 33.4,
  1968: 34.8,
  1969: 36.7,
  1970: 38.8,
  1971: 40.5,
  1972: 41.8,
  1973: 44.4,
  1974: 49.3,
  1975: 53.8,
  1976: 56.9,
  1977: 60.6,
  1978: 65.2,
  1979: 72.6,
  1980: 82.4,
  1981: 90.9,
  1982: 96.5,
  1983: 99.6,
  1984: 103.9,
  1985: 107.6,
  1986: 109.6,
  1987: 113.6,
  1988: 118.3,
  1989: 124.0,
  1990: 130.7,
  1991: 136.2,
  1992: 140.3,
  1993: 144.5,
  1994: 148.2,
  1995: 152.4,
  1996: 156.9,
  1997: 160.5,
  1998: 163.0,
  1999: 166.6,
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
};

// ── US population in millions (FRED POP, midyear estimates) ─────────────────
const POPULATION_MILLIONS: Record<number, number> = {
  1950: 152.3,
  1951: 154.9,
  1952: 157.6,
  1953: 160.2,
  1954: 163.0,
  1955: 165.9,
  1956: 168.9,
  1957: 172.0,
  1958: 174.9,
  1959: 177.8,
  1960: 180.7,
  1961: 183.7,
  1962: 186.5,
  1963: 189.2,
  1964: 191.9,
  1965: 194.3,
  1966: 196.6,
  1967: 198.7,
  1968: 200.7,
  1969: 202.7,
  1970: 205.1,
  1971: 207.7,
  1972: 209.9,
  1973: 211.9,
  1974: 213.9,
  1975: 216.0,
  1976: 218.0,
  1977: 220.2,
  1978: 222.6,
  1979: 225.1,
  1980: 227.2,
  1981: 229.5,
  1982: 231.7,
  1983: 233.8,
  1984: 235.8,
  1985: 237.9,
  1986: 240.1,
  1987: 242.3,
  1988: 244.5,
  1989: 246.8,
  1990: 249.6,
  1991: 252.2,
  1992: 255.0,
  1993: 257.7,
  1994: 260.3,
  1995: 263.0,
  1996: 265.6,
  1997: 268.3,
  1998: 270.2,
  1999: 272.7,
  2000: 282.2,
  2001: 285.0,
  2002: 287.6,
  2003: 290.1,
  2004: 292.8,
  2005: 295.5,
  2006: 298.4,
  2007: 301.2,
  2008: 304.1,
  2009: 306.8,
  2010: 309.3,
  2011: 311.6,
  2012: 313.9,
  2013: 316.1,
  2014: 318.4,
  2015: 320.7,
  2016: 323.1,
  2017: 325.1,
  2018: 326.8,
  2019: 328.2,
  2020: 331.5,
  2021: 332.0,
  2022: 333.3,
  2023: 335.0,
};

const MIN_YEAR = 1950;
const MAX_YEAR = 2023;

function assertYearInRange(year: number, label = 'year'): void {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError(
      `${label} ${year} is out of range. Supported range: ${MIN_YEAR}–${MAX_YEAR}.`,
    );
  }
}

/**
 * Convert nominal dollars to real (inflation-adjusted) dollars.
 *
 * @param nominalBillions - Value in nominal (current-year) billions of dollars
 * @param year            - The year the nominal value is denominated in
 * @param baseYear        - Target year for real dollars (default 2023)
 * @returns Value in real (baseYear) billions of dollars
 */
export function deflateToRealDollars(
  nominalBillions: number,
  year: number,
  baseYear: number = 2023,
): number {
  assertYearInRange(year, 'year');
  assertYearInRange(baseYear, 'baseYear');
  const baseYearCpi = CPI[baseYear];
  const yearCpi = CPI[year];
  if (baseYearCpi === undefined || yearCpi === undefined) {
    throw new Error(`Missing CPI data for ${baseYear} or ${year}`);
  }
  return nominalBillions * (baseYearCpi / yearCpi);
}

/**
 * Convert a total value in billions to dollars per person.
 *
 * @param totalBillions - Aggregate value in billions of dollars
 * @param year          - Year (determines population denominator)
 * @returns Dollars per capita
 */
export function toPerCapita(totalBillions: number, year: number): number {
  assertYearInRange(year, 'year');
  // totalBillions * 1e9 / (populationMillions * 1e6) = totalBillions * 1000 / populationMillions
  const populationMillions = POPULATION_MILLIONS[year];
  if (populationMillions === undefined) {
    throw new Error(`Missing population data for ${year}`);
  }
  return (totalBillions * 1_000) / populationMillions;
}

/**
 * Inflate-adjust to real dollars, then compute per-capita.
 *
 * @param nominalBillions - Value in nominal (current-year) billions of dollars
 * @param year            - The year the nominal value is denominated in
 * @param baseYear        - Target year for real dollars (default 2023)
 * @returns Real (baseYear) dollars per capita
 */
export function deflateAndPerCapita(
  nominalBillions: number,
  year: number,
  baseYear: number = 2023,
): number {
  const realBillions = deflateToRealDollars(nominalBillions, year, baseYear);
  return toPerCapita(realBillions, year);
}

export { CPI, POPULATION_MILLIONS, MIN_YEAR, MAX_YEAR };
