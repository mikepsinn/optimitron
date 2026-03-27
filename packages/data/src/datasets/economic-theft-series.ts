/**
 * Economic Theft Series — the wealth transfer after the gold standard ended.
 *
 * These datasets document the systematic extraction of purchasing power from
 * working people since 1971. Each series shows a different angle of the same
 * phenomenon: productivity gains captured by finance instead of workers.
 *
 * Sources: EPI, Census Bureau, Macrotrends, FRED, BLS, FDIC, CRS.
 */

import type { TimePoint } from "./agency-performance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarCostEntry {
  war: string;
  years: string;
  /** Cost in 2024 inflation-adjusted dollars */
  cost: number;
  usDeaths: number;
  civilianDeaths: number;
  /** The lie used to justify the war, if applicable */
  lie?: string;
  annotation?: string;
  annotationUrl?: string;
}

// ---------------------------------------------------------------------------
// 1. Productivity vs Wages (1948-2024)
// Source: Economic Policy Institute (EPI)
// ---------------------------------------------------------------------------

export const PRODUCTIVITY_VS_WAGES: {
  productivity: TimePoint[];
  compensation: TimePoint[];
} = {
  productivity: [
    { year: 1948, value: 100 },
    { year: 1953, value: 120 },
    { year: 1958, value: 135 },
    { year: 1963, value: 150 },
    { year: 1968, value: 165 },
    { year: 1973, value: 170 },
    {
      year: 1978,
      value: 185,
      annotation: "Revenue Act creates 401(k) — pensions replaced by individual risk",
    },
    {
      year: 1979,
      value: 190,
      annotation: "Gap opens after gold standard ends",
    },
    { year: 1985, value: 210 },
    { year: 1990, value: 230 },
    { year: 1995, value: 250 },
    { year: 2000, value: 280 },
    { year: 2005, value: 305 },
    { year: 2010, value: 320 },
    { year: 2015, value: 330 },
    { year: 2020, value: 340 },
    {
      year: 2024,
      value: 346,
      annotation:
        "Productivity up 246%, wages up 115%. The gap is the theft.",
      annotationUrl: "https://www.epi.org/productivity-pay-gap/",
    },
  ],
  compensation: [
    { year: 1948, value: 100 },
    { year: 1953, value: 120 },
    { year: 1958, value: 133 },
    { year: 1963, value: 148 },
    { year: 1968, value: 163 },
    { year: 1973, value: 170 },
    { year: 1979, value: 175 },
    { year: 1985, value: 180 },
    { year: 1990, value: 185 },
    { year: 1995, value: 190 },
    { year: 2000, value: 215 },
    { year: 2005, value: 210 },
    { year: 2010, value: 212 },
    { year: 2015, value: 213 },
    { year: 2020, value: 214 },
    { year: 2024, value: 215 },
  ],
};

// ---------------------------------------------------------------------------
// 2. Median Income in Gold Ounces (1972-2024)
// Source: Census Bureau (median household income) + Macrotrends (gold price)
// ---------------------------------------------------------------------------

export const MEDIAN_INCOME_IN_GOLD: TimePoint[] = [
  {
    year: 1972,
    value: 191,
    annotation:
      "Last year of gold standard. A family could buy 191 oz of gold.",
  },
  { year: 1975, value: 82 },
  { year: 1980, value: 44 },
  { year: 1985, value: 75 },
  { year: 1990, value: 82 },
  { year: 1995, value: 89 },
  { year: 2000, value: 133 },
  { year: 2005, value: 107 },
  {
    year: 2011,
    value: 32,
    annotation: "Gold hits $1,900/oz",
  },
  { year: 2015, value: 49 },
  { year: 2020, value: 43 },
  {
    year: 2024,
    value: 14,
    annotation:
      "93% purchasing power lost. Same work buys 14 oz instead of 191.",
    annotationUrl:
      "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart",
  },
];

// ---------------------------------------------------------------------------
// 3. Finance Sector as % of GDP (1947-2024)
// Source: FRED (VAPGDPFI)
// ---------------------------------------------------------------------------

export const FINANCE_SECTOR_PCT_GDP: TimePoint[] = [
  { year: 1947, value: 2.5 },
  { year: 1950, value: 2.7 },
  { year: 1955, value: 3.0 },
  { year: 1960, value: 3.5 },
  { year: 1965, value: 3.8 },
  {
    year: 1971,
    value: 4.0,
    annotation: "Gold standard ends",
  },
  { year: 1975, value: 4.2 },
  { year: 1980, value: 4.5 },
  { year: 1985, value: 5.2 },
  { year: 1990, value: 6.0 },
  { year: 1995, value: 6.8 },
  {
    year: 1999,
    value: 7.2,
    annotation: "Glass-Steagall repealed — banks allowed to gamble with deposits",
  },
  {
    year: 2000,
    value: 7.5,
    annotation: "Dot-com bubble",
  },
  { year: 2003, value: 7.8 },
  {
    year: 2006,
    value: 8.3,
    annotation:
      "Pre-crash peak — finance sector earns more than manufacturing",
  },
  {
    year: 2010,
    value: 7.5,
    annotation: "Citizens United — unlimited corporate political spending allowed",
  },
  { year: 2015, value: 7.8 },
  { year: 2020, value: 8.0 },
  {
    year: 2024,
    value: 8.2,
    annotation:
      "$2.3T/yr captured. 6.7M employees. Produces zero goods.",
    annotationUrl: "https://fred.stlouisfed.org/series/VAPGDPFI",
  },
];

// ---------------------------------------------------------------------------
// 4. Single-Earner vs Dual-Income Families (1967-2024)
// Source: Bureau of Labor Statistics (BLS)
// ---------------------------------------------------------------------------

export const SINGLE_EARNER_FAMILIES_PCT: TimePoint[] = [
  {
    year: 1967,
    value: 50,
    annotation: "Half of families had one breadwinner",
  },
  { year: 1970, value: 46 },
  { year: 1975, value: 40 },
  { year: 1980, value: 35 },
  { year: 1985, value: 30 },
  { year: 1990, value: 27 },
  { year: 1995, value: 24 },
  { year: 2000, value: 22 },
  { year: 2005, value: 20 },
  {
    year: 2011,
    value: 19,
    annotation:
      "Both parents work. Combined income buys LESS than one salary in 1972.",
  },
  { year: 2015, value: 18.5 },
  { year: 2020, value: 18 },
  { year: 2024, value: 17 },
];

// ---------------------------------------------------------------------------
// 5. War Costs in Today's Dollars
// Source: Congressional Research Service (CRS) 2010, adjusted to 2024 dollars
// ---------------------------------------------------------------------------

export const WAR_COSTS_2024_DOLLARS: WarCostEntry[] = [
  {
    war: "Revolutionary War",
    years: "1775-1783",
    cost: 2_400_000_000,
    usDeaths: 4_435,
    civilianDeaths: 0,
  },
  {
    war: "Civil War",
    years: "1861-1865",
    cost: 112_000_000_000,
    usDeaths: 750_000,
    civilianDeaths: 0,
    annotation:
      "Lincoln printed $450M in greenbacks — first US fiat currency",
  },
  {
    war: "World War I",
    years: "1917-1918",
    cost: 468_000_000_000,
    usDeaths: 116_000,
    civilianDeaths: 6_800_000,
  },
  {
    war: "World War II",
    years: "1939-1945",
    cost: 5_700_000_000_000,
    usDeaths: 405_000,
    civilianDeaths: 50_000_000,
  },
  {
    war: "Korean War",
    years: "1950-1953",
    cost: 478_000_000_000,
    usDeaths: 54_000,
    civilianDeaths: 2_500_000,
  },
  {
    war: "Vietnam War",
    years: "1955-1975",
    cost: 1_000_000_000_000,
    usDeaths: 58_000,
    civilianDeaths: 2_000_000,
    lie: "Gulf of Tonkin — NSA confirmed 2nd attack never happened",
  },
  {
    war: "Gulf War",
    years: "1991",
    cost: 116_000_000_000,
    usDeaths: 383,
    civilianDeaths: 0,
    lie: "Nayirah testimony — incubator babies fabricated by PR firm",
  },
  {
    war: "Post-9/11 Wars",
    years: "2001-present",
    cost: 8_000_000_000_000,
    usDeaths: 7_000,
    civilianDeaths: 900_000,
    lie: "WMDs — fabricated evidence presented to UN",
    annotation: "38M displaced",
  },
];

// ---------------------------------------------------------------------------
// 6. Bank Failures (1900-2024)
// Source: FDIC
// ---------------------------------------------------------------------------

export const BANK_FAILURES: TimePoint[] = [
  { year: 1900, value: 100 },
  { year: 1905, value: 100 },
  { year: 1910, value: 100 },
  { year: 1912, value: 100 },
  {
    year: 1913,
    value: 0,
    annotation: "Fed created",
  },
  { year: 1920, value: 168 },
  { year: 1925, value: 618 },
  {
    year: 1930,
    value: 1_350,
    annotation:
      "9,000+ banks fail 1930-33. Canada: zero failures without a central bank.",
    annotationUrl: "https://www.fdic.gov/bank-failures",
  },
  { year: 1931, value: 2_293 },
  { year: 1932, value: 1_453 },
  { year: 1933, value: 4_000 },
  {
    year: 1934,
    value: 57,
    annotation: "FDIC created — actually fixes the problem",
  },
  { year: 1940, value: 5 },
  { year: 1950, value: 5 },
  { year: 1960, value: 5 },
  { year: 1970, value: 5 },
  { year: 1980, value: 10 },
  { year: 1990, value: 169 },
  { year: 2000, value: 7 },
  { year: 2007, value: 3 },
  {
    year: 2008,
    value: 25,
    annotation: "Financial crisis begins",
  },
  {
    year: 2009,
    value: 140,
    annotation: "AIG bailed out for $182B. Lehman Brothers allowed to fail — 25,000 employees lose jobs. Bear Stearns sold for $2/share.",
  },
  {
    year: 2010,
    value: 157,
    annotation:
      "10M families lose homes. Citigroup gets $45B bailout, pays $5.33B in exec bonuses. Zero bankers jailed.",
  },
  { year: 2015, value: 8 },
  { year: 2020, value: 4 },
  {
    year: 2023,
    value: 5,
    annotation:
      "SVB, Signature, First Republic — $500B+ in assets collapsed in 2 weeks",
  },
  { year: 2024, value: 1 },
];

// ---------------------------------------------------------------------------
// 7. Top 1% vs Bottom 50% Net Worth (1989-2024)
// Source: FRED (Federal Reserve distributional data)
// ---------------------------------------------------------------------------

export const WEALTH_DISTRIBUTION: {
  top1pct: TimePoint[];
  bottom50pct: TimePoint[];
} = {
  top1pct: [
    { year: 1989, value: 5 },
    { year: 1992, value: 6 },
    { year: 1995, value: 8 },
    { year: 1998, value: 10 },
    { year: 2000, value: 12 },
    { year: 2003, value: 13 },
    { year: 2007, value: 18 },
    {
      year: 2009,
      value: 14,
      annotation: "Banks bailed out, homeowners foreclosed. 10M families lose homes.",
    },
    { year: 2012, value: 20 },
    { year: 2015, value: 25 },
    { year: 2018, value: 30 },
    {
      year: 2020,
      value: 34,
      annotation:
        "COVID: Fed creates $4.6T. Top 1% gains $4T. Bottom 50% gets $1,200 stimulus checks.",
      annotationUrl:
        "https://fred.stlouisfed.org/series/WFRBST01134",
    },
    { year: 2022, value: 42 },
    { year: 2024, value: 46 },
  ],
  bottom50pct: [
    { year: 1989, value: 0.7 },
    { year: 1992, value: 0.8 },
    { year: 1995, value: 0.9 },
    { year: 1998, value: 1.0 },
    { year: 2000, value: 1.2 },
    { year: 2003, value: 1.1 },
    { year: 2007, value: 1.3 },
    {
      year: 2009,
      value: 0.2,
      annotation:
        "Bottom 50% net worth crashes to near zero — they owned houses.",
    },
    { year: 2012, value: 0.6 },
    { year: 2015, value: 1.1 },
    { year: 2018, value: 1.8 },
    { year: 2020, value: 2.5 },
    { year: 2022, value: 3.4 },
    { year: 2024, value: 3.8 },
  ],
};
