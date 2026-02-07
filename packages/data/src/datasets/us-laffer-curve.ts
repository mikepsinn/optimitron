/**
 * US Laffer Curve: Top Marginal Tax Rates vs Federal Revenue
 *
 * Sources:
 * - Top marginal income tax rate: IRS SOI Historical Table 23, Tax Policy Center
 *   https://www.taxpolicycenter.org/statistics/historical-highest-marginal-income-tax-rates
 * - Federal revenue as % GDP: OMB Historical Table 1.2
 *   https://www.whitehouse.gov/omb/historical-tables/
 * - Real GDP growth: BEA NIPA Table 1.1.1
 *   https://apps.bea.gov/iTable/
 * - Real median household income: FRED MEHOINUSA672N (starts 1967)
 *   https://fred.stlouisfed.org/series/MEHOINUSA672N
 *
 * Key insight: Revenue as % GDP has remained remarkably stable (15-20%)
 * despite top marginal rates ranging from 28% to 91%. Known as "Hauser's Law."
 */

export interface LafferCurveDataPoint {
  year: number;
  /** Top marginal individual income tax rate (percent) */
  topMarginalTaxRate: number;
  /** Total federal revenue as percent of GDP */
  federalRevenuePercentGDP: number;
  /** Real GDP growth rate (percent, annual) */
  realGDPGrowthRate: number;
  /** Real median household income (2023 dollars). Null before 1967. */
  realMedianHouseholdIncome: number | null;
}

/**
 * US tax rates, revenue, GDP growth, and income (1950-2023).
 * Tests the Laffer Curve hypothesis: do tax cuts pay for themselves?
 */
export const US_LAFFER_CURVE_DATA: LafferCurveDataPoint[] = [
  // Eisenhower era: 91% top rate
  { year: 1950, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 14.4, realGDPGrowthRate: 8.7, realMedianHouseholdIncome: null },
  { year: 1951, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 16.1, realGDPGrowthRate: 8.0, realMedianHouseholdIncome: null },
  { year: 1952, topMarginalTaxRate: 92.0, federalRevenuePercentGDP: 19.0, realGDPGrowthRate: 4.1, realMedianHouseholdIncome: null },
  { year: 1953, topMarginalTaxRate: 92.0, federalRevenuePercentGDP: 18.7, realGDPGrowthRate: 4.7, realMedianHouseholdIncome: null },
  { year: 1954, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 18.5, realGDPGrowthRate: -0.6, realMedianHouseholdIncome: null },
  { year: 1955, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 16.5, realGDPGrowthRate: 7.1, realMedianHouseholdIncome: null },
  { year: 1956, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.5, realGDPGrowthRate: 2.1, realMedianHouseholdIncome: null },
  { year: 1957, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.7, realGDPGrowthRate: 2.1, realMedianHouseholdIncome: null },
  { year: 1958, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.3, realGDPGrowthRate: -0.7, realMedianHouseholdIncome: null },
  { year: 1959, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 16.2, realGDPGrowthRate: 6.9, realMedianHouseholdIncome: null },
  { year: 1960, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.8, realGDPGrowthRate: 2.6, realMedianHouseholdIncome: null },
  { year: 1961, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.8, realGDPGrowthRate: 2.3, realMedianHouseholdIncome: null },
  { year: 1962, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 6.1, realMedianHouseholdIncome: null },
  { year: 1963, topMarginalTaxRate: 91.0, federalRevenuePercentGDP: 17.8, realGDPGrowthRate: 4.4, realMedianHouseholdIncome: null },
  // Kennedy-Johnson tax cut: 91% → 77% → 70%
  { year: 1964, topMarginalTaxRate: 77.0, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 5.8, realMedianHouseholdIncome: null },
  { year: 1965, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.0, realGDPGrowthRate: 6.5, realMedianHouseholdIncome: null },
  { year: 1966, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.3, realGDPGrowthRate: 6.6, realMedianHouseholdIncome: null },
  // FRED median household income begins 1967
  { year: 1967, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 18.4, realGDPGrowthRate: 2.7, realMedianHouseholdIncome: 48210 },
  { year: 1968, topMarginalTaxRate: 75.3, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 4.9, realMedianHouseholdIncome: 50511 },
  { year: 1969, topMarginalTaxRate: 77.0, federalRevenuePercentGDP: 19.7, realGDPGrowthRate: 3.1, realMedianHouseholdIncome: 51587 },
  { year: 1970, topMarginalTaxRate: 71.8, federalRevenuePercentGDP: 19.0, realGDPGrowthRate: 0.2, realMedianHouseholdIncome: 50523 },
  { year: 1971, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.3, realGDPGrowthRate: 3.3, realMedianHouseholdIncome: 50333 },
  { year: 1972, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 5.3, realMedianHouseholdIncome: 52542 },
  { year: 1973, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 5.6, realMedianHouseholdIncome: 53264 },
  { year: 1974, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 18.3, realGDPGrowthRate: -0.5, realMedianHouseholdIncome: 51334 },
  { year: 1975, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.9, realGDPGrowthRate: -0.2, realMedianHouseholdIncome: 49623 },
  { year: 1976, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 17.1, realGDPGrowthRate: 5.4, realMedianHouseholdIncome: 50439 },
  { year: 1977, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 18.0, realGDPGrowthRate: 4.6, realMedianHouseholdIncome: 50154 },
  { year: 1978, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 18.0, realGDPGrowthRate: 5.6, realMedianHouseholdIncome: 51681 },
  { year: 1979, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 18.5, realGDPGrowthRate: 3.2, realMedianHouseholdIncome: 51331 },
  { year: 1980, topMarginalTaxRate: 70.0, federalRevenuePercentGDP: 19.0, realGDPGrowthRate: -0.3, realMedianHouseholdIncome: 49220 },
  // Reagan tax cuts: 70% → 50% → 28%
  { year: 1981, topMarginalTaxRate: 69.1, federalRevenuePercentGDP: 19.6, realGDPGrowthRate: 2.5, realMedianHouseholdIncome: 48758 },
  { year: 1982, topMarginalTaxRate: 50.0, federalRevenuePercentGDP: 19.2, realGDPGrowthRate: -1.8, realMedianHouseholdIncome: 48227 },
  { year: 1983, topMarginalTaxRate: 50.0, federalRevenuePercentGDP: 17.5, realGDPGrowthRate: 4.6, realMedianHouseholdIncome: 47718 },
  { year: 1984, topMarginalTaxRate: 50.0, federalRevenuePercentGDP: 17.3, realGDPGrowthRate: 7.2, realMedianHouseholdIncome: 49293 },
  { year: 1985, topMarginalTaxRate: 50.0, federalRevenuePercentGDP: 17.7, realGDPGrowthRate: 4.2, realMedianHouseholdIncome: 50145 },
  { year: 1986, topMarginalTaxRate: 50.0, federalRevenuePercentGDP: 17.5, realGDPGrowthRate: 3.5, realMedianHouseholdIncome: 51484 },
  { year: 1987, topMarginalTaxRate: 38.5, federalRevenuePercentGDP: 18.4, realGDPGrowthRate: 3.5, realMedianHouseholdIncome: 52240 },
  { year: 1988, topMarginalTaxRate: 28.0, federalRevenuePercentGDP: 18.2, realGDPGrowthRate: 4.2, realMedianHouseholdIncome: 52529 },
  { year: 1989, topMarginalTaxRate: 28.0, federalRevenuePercentGDP: 18.4, realGDPGrowthRate: 3.7, realMedianHouseholdIncome: 53362 },
  { year: 1990, topMarginalTaxRate: 28.0, federalRevenuePercentGDP: 18.0, realGDPGrowthRate: 1.9, realMedianHouseholdIncome: 52324 },
  // Bush/Clinton rate increases: 28% → 31% → 39.6%
  { year: 1991, topMarginalTaxRate: 31.0, federalRevenuePercentGDP: 17.8, realGDPGrowthRate: -0.1, realMedianHouseholdIncome: 51073 },
  { year: 1992, topMarginalTaxRate: 31.0, federalRevenuePercentGDP: 17.5, realGDPGrowthRate: 3.5, realMedianHouseholdIncome: 50458 },
  { year: 1993, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 17.5, realGDPGrowthRate: 2.8, realMedianHouseholdIncome: 50331 },
  { year: 1994, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 18.0, realGDPGrowthRate: 4.0, realMedianHouseholdIncome: 50464 },
  { year: 1995, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 18.4, realGDPGrowthRate: 2.7, realMedianHouseholdIncome: 52152 },
  { year: 1996, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 18.8, realGDPGrowthRate: 3.8, realMedianHouseholdIncome: 52609 },
  { year: 1997, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 19.2, realGDPGrowthRate: 4.5, realMedianHouseholdIncome: 54058 },
  { year: 1998, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 19.9, realGDPGrowthRate: 4.5, realMedianHouseholdIncome: 56080 },
  { year: 1999, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 19.8, realGDPGrowthRate: 4.8, realMedianHouseholdIncome: 57909 },
  { year: 2000, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 20.0, realGDPGrowthRate: 4.1, realMedianHouseholdIncome: 58544 },
  // Bush tax cuts: 39.6% → 35%
  { year: 2001, topMarginalTaxRate: 39.1, federalRevenuePercentGDP: 19.5, realGDPGrowthRate: 1.0, realMedianHouseholdIncome: 57246 },
  { year: 2002, topMarginalTaxRate: 38.6, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 1.7, realMedianHouseholdIncome: 56599 },
  { year: 2003, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 16.2, realGDPGrowthRate: 2.8, realMedianHouseholdIncome: 56528 },
  { year: 2004, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 16.1, realGDPGrowthRate: 3.8, realMedianHouseholdIncome: 56332 },
  { year: 2005, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 17.3, realGDPGrowthRate: 3.5, realMedianHouseholdIncome: 56194 },
  { year: 2006, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 18.2, realGDPGrowthRate: 2.7, realMedianHouseholdIncome: 56436 },
  { year: 2007, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 18.5, realGDPGrowthRate: 2.0, realMedianHouseholdIncome: 57423 },
  { year: 2008, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: -0.1, realMedianHouseholdIncome: 55313 },
  { year: 2009, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 14.6, realGDPGrowthRate: -2.5, realMedianHouseholdIncome: 54988 },
  { year: 2010, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 14.6, realGDPGrowthRate: 2.6, realMedianHouseholdIncome: 53568 },
  { year: 2011, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 15.0, realGDPGrowthRate: 1.6, realMedianHouseholdIncome: 52546 },
  { year: 2012, topMarginalTaxRate: 35.0, federalRevenuePercentGDP: 15.2, realGDPGrowthRate: 2.2, realMedianHouseholdIncome: 52666 },
  // Fiscal cliff: 35% → 39.6%
  { year: 2013, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 16.7, realGDPGrowthRate: 1.8, realMedianHouseholdIncome: 53585 },
  { year: 2014, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 17.4, realGDPGrowthRate: 2.5, realMedianHouseholdIncome: 53657 },
  { year: 2015, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 18.0, realGDPGrowthRate: 3.1, realMedianHouseholdIncome: 57230 },
  { year: 2016, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 17.6, realGDPGrowthRate: 1.8, realMedianHouseholdIncome: 60309 },
  { year: 2017, topMarginalTaxRate: 39.6, federalRevenuePercentGDP: 17.2, realGDPGrowthRate: 2.3, realMedianHouseholdIncome: 62626 },
  // Trump TCJA: 39.6% → 37%
  { year: 2018, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 16.4, realGDPGrowthRate: 3.0, realMedianHouseholdIncome: 64324 },
  { year: 2019, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 16.3, realGDPGrowthRate: 2.3, realMedianHouseholdIncome: 68703 },
  { year: 2020, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 16.3, realGDPGrowthRate: -2.8, realMedianHouseholdIncome: 67521 },
  { year: 2021, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 18.1, realGDPGrowthRate: 5.9, realMedianHouseholdIncome: 70784 },
  { year: 2022, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 19.6, realGDPGrowthRate: 2.1, realMedianHouseholdIncome: 74580 },
  { year: 2023, topMarginalTaxRate: 37.0, federalRevenuePercentGDP: 16.5, realGDPGrowthRate: 2.5, realMedianHouseholdIncome: 80610 },
];
