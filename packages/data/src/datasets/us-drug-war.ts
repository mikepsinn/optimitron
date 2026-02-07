/**
 * US Drug War: Federal Drug Control Spending vs Drug Overdose Deaths
 *
 * Sources:
 * - Drug control spending: ONDCP National Drug Control Budget (FY 2013-2024)
 *   https://www.drugpolicyfacts.org/chapter/economics
 *   Earlier years: ONDCP historical tables, various reports
 * - Drug overdose deaths: CDC WONDER / NCHS
 *   https://en.wikipedia.org/wiki/United_States_drug_overdose_death_rates_and_totals_over_time
 *   https://www.cdc.gov/nchs/nvss/vsrr/drug-overdose-data.htm
 *
 * Key finding from RAND (1994): Treatment saves $7.46 per $1 spent.
 * Enforcement saves 15-52 cents per $1 spent.
 */

export interface DrugWarDataPoint {
  year: number;
  /** Federal drug control spending (billions USD, nominal) */
  drugControlSpendingBillions: number;
  /** Total drug overdose deaths */
  overdoseDeaths: number;
  /** Overdose death rate per 100K population */
  overdoseDeathRate: number;
  /** US population (July 1) */
  population: number;
}

/**
 * US Drug War data: federal drug control spending vs overdose outcomes.
 *
 * Drug control spending includes: interdiction, enforcement, treatment,
 * prevention, and intelligence. Note: spending INCREASED dramatically
 * while overdose deaths ALSO increased — a textbook case of policy failure
 * or reverse causation.
 */
export const US_DRUG_WAR_DATA: DrugWarDataPoint[] = [
  // Pre-modern drug war era (spending estimates from various ONDCP reports)
  { year: 1999, drugControlSpendingBillions: 17.1, overdoseDeaths: 16849, overdoseDeathRate: 6.0, population: 279040168 },
  { year: 2000, drugControlSpendingBillions: 18.2, overdoseDeaths: 17415, overdoseDeathRate: 6.2, population: 281421906 },
  { year: 2001, drugControlSpendingBillions: 18.5, overdoseDeaths: 19394, overdoseDeathRate: 6.8, population: 284968955 },
  { year: 2002, drugControlSpendingBillions: 19.2, overdoseDeaths: 23518, overdoseDeathRate: 8.2, population: 287625193 },
  { year: 2003, drugControlSpendingBillions: 19.4, overdoseDeaths: 25785, overdoseDeathRate: 8.9, population: 290107933 },
  { year: 2004, drugControlSpendingBillions: 20.4, overdoseDeaths: 27424, overdoseDeathRate: 9.4, population: 292805298 },
  { year: 2005, drugControlSpendingBillions: 20.7, overdoseDeaths: 29813, overdoseDeathRate: 10.1, population: 295516599 },
  { year: 2006, drugControlSpendingBillions: 21.5, overdoseDeaths: 34425, overdoseDeathRate: 11.5, population: 298379912 },
  { year: 2007, drugControlSpendingBillions: 22.3, overdoseDeaths: 36010, overdoseDeathRate: 12.0, population: 301231207 },
  { year: 2008, drugControlSpendingBillions: 23.1, overdoseDeaths: 36450, overdoseDeathRate: 12.0, population: 304093966 },
  { year: 2009, drugControlSpendingBillions: 23.9, overdoseDeaths: 37004, overdoseDeathRate: 12.1, population: 306771529 },
  { year: 2010, drugControlSpendingBillions: 24.5, overdoseDeaths: 38329, overdoseDeathRate: 12.4, population: 308745538 },
  { year: 2011, drugControlSpendingBillions: 25.2, overdoseDeaths: 41340, overdoseDeathRate: 13.3, population: 311591917 },
  { year: 2012, drugControlSpendingBillions: 25.4, overdoseDeaths: 41502, overdoseDeathRate: 13.2, population: 313914040 },
  // ONDCP published budgets (FY 2013-2024)
  { year: 2013, drugControlSpendingBillions: 25.4, overdoseDeaths: 43982, overdoseDeathRate: 13.9, population: 316128839 },
  { year: 2014, drugControlSpendingBillions: 25.3, overdoseDeaths: 47055, overdoseDeathRate: 14.8, population: 318857056 },
  { year: 2015, drugControlSpendingBillions: 26.3, overdoseDeaths: 52404, overdoseDeathRate: 16.3, population: 321418820 },
  { year: 2016, drugControlSpendingBillions: 27.6, overdoseDeaths: 63632, overdoseDeathRate: 19.7, population: 323127513 },
  { year: 2017, drugControlSpendingBillions: 29.7, overdoseDeaths: 70237, overdoseDeathRate: 21.6, population: 325719178 },
  { year: 2018, drugControlSpendingBillions: 32.6, overdoseDeaths: 67367, overdoseDeathRate: 20.6, population: 327167434 },
  { year: 2019, drugControlSpendingBillions: 34.6, overdoseDeaths: 70630, overdoseDeathRate: 21.5, population: 328239523 },
  { year: 2020, drugControlSpendingBillions: 35.7, overdoseDeaths: 91799, overdoseDeathRate: 27.9, population: 329484123 },
  { year: 2021, drugControlSpendingBillions: 39.0, overdoseDeaths: 109100, overdoseDeathRate: 32.9, population: 332100000 },
  { year: 2022, drugControlSpendingBillions: 42.5, overdoseDeaths: 110900, overdoseDeathRate: 33.2, population: 334020000 },
  { year: 2023, drugControlSpendingBillions: 44.2, overdoseDeaths: 108600, overdoseDeathRate: 32.2, population: 336810000 },
];

/** Longer historical overdose data (deaths only, no spending breakdown) */
export const US_OVERDOSE_DEATHS_HISTORICAL: Array<{ year: number; deaths: number; rate: number; population: number }> = [
  { year: 1968, deaths: 5033, rate: 2.5, population: 199533564 },
  { year: 1970, deaths: 7101, rate: 3.5, population: 203458035 },
  { year: 1975, deaths: 7145, rate: 3.3, population: 215457198 },
  { year: 1980, deaths: 2492, rate: 1.1, population: 226624371 },
  { year: 1985, deaths: 3612, rate: 1.5, population: 238005715 },
  { year: 1990, deaths: 4506, rate: 1.8, population: 248922111 },
  { year: 1995, deaths: 8000, rate: 3.0, population: 266386596 },
  { year: 1999, deaths: 16849, rate: 6.0, population: 279040168 },
  { year: 2000, deaths: 17415, rate: 6.2, population: 281421906 },
  { year: 2005, deaths: 29813, rate: 10.1, population: 295516599 },
  { year: 2010, deaths: 38329, rate: 12.4, population: 308745538 },
  { year: 2015, deaths: 52404, rate: 16.3, population: 321418820 },
  { year: 2020, deaths: 91799, rate: 27.9, population: 329484123 },
  { year: 2022, deaths: 110900, rate: 33.2, population: 334020000 },
  { year: 2023, deaths: 108600, rate: 32.2, population: 336810000 },
];
