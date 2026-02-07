/**
 * US Minimum Wage, Unemployment, and Median Income
 *
 * Sources:
 * - Federal Minimum Wage: U.S. Department of Labor
 *   https://www.dol.gov/agencies/whd/minimum-wage/history/chart
 * - Unemployment Rate: Bureau of Labor Statistics (BLS)
 *   https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm
 * - Real Median Household Income: U.S. Census Bureau, FRED (MEHOINUSA672N)
 *   https://www.census.gov/data/tables/time-series/demo/income-poverty/historical-income-households.html
 *   https://fred.stlouisfed.org/series/MEHOINUSA672N
 */

export interface MinimumWageDataPoint {
  year: number;
  /** Federal minimum wage (USD per hour, nominal) */
  federalMinimumWage: number;
  /** Annual unemployment rate (percent, BLS) */
  unemploymentRate: number;
  /** Real median household income (2023 dollars) */
  realMedianHouseholdIncome: number;
}

/**
 * US economic indicators: federal minimum wage, unemployment rate,
 * and real median household income from 1968 to 2023.
 */
export const US_MINIMUM_WAGE_DATA: MinimumWageDataPoint[] = [
  { year: 1968, federalMinimumWage: 1.60, unemploymentRate: 3.6, realMedianHouseholdIncome: 39300 },
  { year: 1969, federalMinimumWage: 1.60, unemploymentRate: 3.5, realMedianHouseholdIncome: 41500 },
  { year: 1970, federalMinimumWage: 1.60, unemploymentRate: 5.0, realMedianHouseholdIncome: 42400 },
  { year: 1971, federalMinimumWage: 1.60, unemploymentRate: 5.9, realMedianHouseholdIncome: 41500 },
  { year: 1972, federalMinimumWage: 1.60, unemploymentRate: 5.6, realMedianHouseholdIncome: 43600 },
  { year: 1973, federalMinimumWage: 1.60, unemploymentRate: 4.9, realMedianHouseholdIncome: 45800 },
  { year: 1974, federalMinimumWage: 2.00, unemploymentRate: 5.6, realMedianHouseholdIncome: 44900 },
  { year: 1975, federalMinimumWage: 2.10, unemploymentRate: 8.5, realMedianHouseholdIncome: 43400 },
  { year: 1976, federalMinimumWage: 2.30, unemploymentRate: 7.7, realMedianHouseholdIncome: 45000 },
  { year: 1977, federalMinimumWage: 2.30, unemploymentRate: 7.1, realMedianHouseholdIncome: 46000 },
  { year: 1978, federalMinimumWage: 2.65, unemploymentRate: 6.1, realMedianHouseholdIncome: 49000 },
  { year: 1979, federalMinimumWage: 2.90, unemploymentRate: 5.9, realMedianHouseholdIncome: 49900 },
  { year: 1980, federalMinimumWage: 3.10, unemploymentRate: 7.2, realMedianHouseholdIncome: 48700 },
  { year: 1981, federalMinimumWage: 3.35, unemploymentRate: 7.6, realMedianHouseholdIncome: 48500 },
  { year: 1982, federalMinimumWage: 3.35, unemploymentRate: 9.7, realMedianHouseholdIncome: 48400 },
  { year: 1983, federalMinimumWage: 3.35, unemploymentRate: 9.6, realMedianHouseholdIncome: 48600 },
  { year: 1984, federalMinimumWage: 3.35, unemploymentRate: 7.5, realMedianHouseholdIncome: 50300 },
  { year: 1985, federalMinimumWage: 3.35, unemploymentRate: 7.2, realMedianHouseholdIncome: 51900 },
  { year: 1986, federalMinimumWage: 3.35, unemploymentRate: 7.0, realMedianHouseholdIncome: 54000 },
  { year: 1987, federalMinimumWage: 3.35, unemploymentRate: 6.2, realMedianHouseholdIncome: 56100 },
  { year: 1988, federalMinimumWage: 3.35, unemploymentRate: 5.5, realMedianHouseholdIncome: 57700 },
  { year: 1989, federalMinimumWage: 3.35, unemploymentRate: 5.3, realMedianHouseholdIncome: 60000 },
  { year: 1990, federalMinimumWage: 3.80, unemploymentRate: 5.6, realMedianHouseholdIncome: 60300 },
  { year: 1991, federalMinimumWage: 4.25, unemploymentRate: 6.9, realMedianHouseholdIncome: 59500 },
  { year: 1992, federalMinimumWage: 4.25, unemploymentRate: 7.5, realMedianHouseholdIncome: 59800 },
  { year: 1993, federalMinimumWage: 4.25, unemploymentRate: 6.9, realMedianHouseholdIncome: 60100 },
  { year: 1994, federalMinimumWage: 4.25, unemploymentRate: 6.1, realMedianHouseholdIncome: 61200 },
  { year: 1995, federalMinimumWage: 4.25, unemploymentRate: 5.6, realMedianHouseholdIncome: 62700 },
  { year: 1996, federalMinimumWage: 4.75, unemploymentRate: 5.4, realMedianHouseholdIncome: 64000 },
  { year: 1997, federalMinimumWage: 5.15, unemploymentRate: 5.0, realMedianHouseholdIncome: 65500 },
  { year: 1998, federalMinimumWage: 5.15, unemploymentRate: 4.5, realMedianHouseholdIncome: 67700 },
  { year: 1999, federalMinimumWage: 5.15, unemploymentRate: 4.2, realMedianHouseholdIncome: 69900 },
  { year: 2000, federalMinimumWage: 5.15, unemploymentRate: 4.0, realMedianHouseholdIncome: 71400 },
  { year: 2001, federalMinimumWage: 5.15, unemploymentRate: 4.7, realMedianHouseholdIncome: 71900 },
  { year: 2002, federalMinimumWage: 5.15, unemploymentRate: 5.8, realMedianHouseholdIncome: 71500 },
  { year: 2003, federalMinimumWage: 5.15, unemploymentRate: 6.0, realMedianHouseholdIncome: 71000 },
  { year: 2004, federalMinimumWage: 5.15, unemploymentRate: 5.5, realMedianHouseholdIncome: 71200 },
  { year: 2005, federalMinimumWage: 5.15, unemploymentRate: 5.1, realMedianHouseholdIncome: 72000 },
  { year: 2006, federalMinimumWage: 5.15, unemploymentRate: 4.6, realMedianHouseholdIncome: 72500 },
  { year: 2007, federalMinimumWage: 5.85, unemploymentRate: 4.6, realMedianHouseholdIncome: 73600 },
  { year: 2008, federalMinimumWage: 6.55, unemploymentRate: 5.8, realMedianHouseholdIncome: 71000 },
  { year: 2009, federalMinimumWage: 7.25, unemploymentRate: 9.3, realMedianHouseholdIncome: 69400 },
  { year: 2010, federalMinimumWage: 7.25, unemploymentRate: 9.6, realMedianHouseholdIncome: 68500 },
  { year: 2011, federalMinimumWage: 7.25, unemploymentRate: 8.9, realMedianHouseholdIncome: 67800 },
  { year: 2012, federalMinimumWage: 7.25, unemploymentRate: 8.1, realMedianHouseholdIncome: 66900 },
  { year: 2013, federalMinimumWage: 7.25, unemploymentRate: 7.4, realMedianHouseholdIncome: 66700 },
  { year: 2014, federalMinimumWage: 7.25, unemploymentRate: 6.2, realMedianHouseholdIncome: 67600 },
  { year: 2015, federalMinimumWage: 7.25, unemploymentRate: 5.3, realMedianHouseholdIncome: 71000 },
  { year: 2016, federalMinimumWage: 7.25, unemploymentRate: 4.9, realMedianHouseholdIncome: 73300 },
  { year: 2017, federalMinimumWage: 7.25, unemploymentRate: 4.4, realMedianHouseholdIncome: 74600 },
  { year: 2018, federalMinimumWage: 7.25, unemploymentRate: 3.9, realMedianHouseholdIncome: 75200 },
  { year: 2019, federalMinimumWage: 7.25, unemploymentRate: 3.7, realMedianHouseholdIncome: 80200 },
  { year: 2020, federalMinimumWage: 7.25, unemploymentRate: 8.1, realMedianHouseholdIncome: 74700 },
  { year: 2021, federalMinimumWage: 7.25, unemploymentRate: 5.3, realMedianHouseholdIncome: 76400 },
  { year: 2022, federalMinimumWage: 7.25, unemploymentRate: 3.6, realMedianHouseholdIncome: 74700 },
  { year: 2023, federalMinimumWage: 7.25, unemploymentRate: 3.6, realMedianHouseholdIncome: 80610 },
];
