/**
 * US Death Penalty Statistics
 *
 * Sources:
 * - Executions: Death Penalty Information Center (DPIC)
 * - Death Row Population: Death Penalty Information Center (DPIC), Bureau of Justice Statistics (BJS)
 * - Homicide Rate: FBI Uniform Crime Reporting (UCR) Program
 * - States with Death Penalty: Death Penalty Information Center (DPIC) timeline of abolition/reinstatement
 */

export interface USDeathPenaltyDataPoint {
  year: number;
  /** Number of executions carried out in the US that year */
  executionsCarriedOut: number;
  /** Total number of inmates on death row at year-end */
  deathRowPopulation: number;
  /** Homicide rate per 100k population (FBI UCR) */
  homicideRate: number;
  /** Number of US states with the death penalty (legal statute) */
  statesWithDeathPenalty: number;
}

/**
 * US Death Penalty Data: 1976-2023.
 *
 * Tracks the relationship between the usage of the death penalty (executions, death row size)
 * and the homicide rate.
 */
export const US_DEATH_PENALTY_DATA: USDeathPenaltyDataPoint[] = [
  { year: 1976, executionsCarriedOut: 0, deathRowPopulation: 420, homicideRate: 8.8, statesWithDeathPenalty: 35 },
  { year: 1977, executionsCarriedOut: 1, deathRowPopulation: 423, homicideRate: 8.8, statesWithDeathPenalty: 33 },
  { year: 1978, executionsCarriedOut: 0, deathRowPopulation: 482, homicideRate: 9.0, statesWithDeathPenalty: 35 },
  { year: 1979, executionsCarriedOut: 2, deathRowPopulation: 539, homicideRate: 9.7, statesWithDeathPenalty: 37 },
  { year: 1980, executionsCarriedOut: 0, deathRowPopulation: 691, homicideRate: 10.2, statesWithDeathPenalty: 37 },
  { year: 1981, executionsCarriedOut: 1, deathRowPopulation: 856, homicideRate: 9.8, statesWithDeathPenalty: 37 },
  { year: 1982, executionsCarriedOut: 2, deathRowPopulation: 1050, homicideRate: 9.1, statesWithDeathPenalty: 37 },
  { year: 1983, executionsCarriedOut: 5, deathRowPopulation: 1209, homicideRate: 8.3, statesWithDeathPenalty: 37 },
  { year: 1984, executionsCarriedOut: 21, deathRowPopulation: 1405, homicideRate: 7.9, statesWithDeathPenalty: 36 },
  { year: 1985, executionsCarriedOut: 18, deathRowPopulation: 1591, homicideRate: 7.9, statesWithDeathPenalty: 36 },
  { year: 1986, executionsCarriedOut: 18, deathRowPopulation: 1781, homicideRate: 8.6, statesWithDeathPenalty: 36 },
  { year: 1987, executionsCarriedOut: 25, deathRowPopulation: 1984, homicideRate: 8.3, statesWithDeathPenalty: 36 },
  { year: 1988, executionsCarriedOut: 11, deathRowPopulation: 2124, homicideRate: 8.4, statesWithDeathPenalty: 36 },
  { year: 1989, executionsCarriedOut: 16, deathRowPopulation: 2250, homicideRate: 8.7, statesWithDeathPenalty: 36 },
  { year: 1990, executionsCarriedOut: 23, deathRowPopulation: 2356, homicideRate: 9.4, statesWithDeathPenalty: 36 },
  { year: 1991, executionsCarriedOut: 14, deathRowPopulation: 2482, homicideRate: 9.8, statesWithDeathPenalty: 36 },
  { year: 1992, executionsCarriedOut: 31, deathRowPopulation: 2575, homicideRate: 9.3, statesWithDeathPenalty: 36 },
  { year: 1993, executionsCarriedOut: 38, deathRowPopulation: 2716, homicideRate: 9.5, statesWithDeathPenalty: 36 },
  { year: 1994, executionsCarriedOut: 31, deathRowPopulation: 2890, homicideRate: 9.0, statesWithDeathPenalty: 37 },
  { year: 1995, executionsCarriedOut: 56, deathRowPopulation: 3054, homicideRate: 8.2, statesWithDeathPenalty: 38 },
  { year: 1996, executionsCarriedOut: 45, deathRowPopulation: 3219, homicideRate: 7.4, statesWithDeathPenalty: 38 },
  { year: 1997, executionsCarriedOut: 74, deathRowPopulation: 3335, homicideRate: 6.8, statesWithDeathPenalty: 38 },
  { year: 1998, executionsCarriedOut: 68, deathRowPopulation: 3452, homicideRate: 6.3, statesWithDeathPenalty: 38 },
  { year: 1999, executionsCarriedOut: 98, deathRowPopulation: 3527, homicideRate: 5.7, statesWithDeathPenalty: 38 },
  { year: 2000, executionsCarriedOut: 85, deathRowPopulation: 3593, homicideRate: 5.5, statesWithDeathPenalty: 38 },
  { year: 2001, executionsCarriedOut: 66, deathRowPopulation: 3581, homicideRate: 5.6, statesWithDeathPenalty: 38 },
  { year: 2002, executionsCarriedOut: 71, deathRowPopulation: 3557, homicideRate: 5.6, statesWithDeathPenalty: 38 },
  { year: 2003, executionsCarriedOut: 65, deathRowPopulation: 3374, homicideRate: 5.7, statesWithDeathPenalty: 38 },
  { year: 2004, executionsCarriedOut: 59, deathRowPopulation: 3315, homicideRate: 5.5, statesWithDeathPenalty: 37 },
  { year: 2005, executionsCarriedOut: 60, deathRowPopulation: 3254, homicideRate: 5.6, statesWithDeathPenalty: 37 },
  { year: 2006, executionsCarriedOut: 53, deathRowPopulation: 3228, homicideRate: 5.8, statesWithDeathPenalty: 37 },
  { year: 2007, executionsCarriedOut: 42, deathRowPopulation: 3215, homicideRate: 5.7, statesWithDeathPenalty: 36 },
  { year: 2008, executionsCarriedOut: 37, deathRowPopulation: 3207, homicideRate: 5.4, statesWithDeathPenalty: 36 },
  { year: 2009, executionsCarriedOut: 52, deathRowPopulation: 3173, homicideRate: 5.0, statesWithDeathPenalty: 35 },
  { year: 2010, executionsCarriedOut: 46, deathRowPopulation: 3158, homicideRate: 4.8, statesWithDeathPenalty: 35 },
  { year: 2011, executionsCarriedOut: 43, deathRowPopulation: 3082, homicideRate: 4.7, statesWithDeathPenalty: 34 },
  { year: 2012, executionsCarriedOut: 43, deathRowPopulation: 3033, homicideRate: 4.7, statesWithDeathPenalty: 33 },
  { year: 2013, executionsCarriedOut: 39, deathRowPopulation: 2979, homicideRate: 4.5, statesWithDeathPenalty: 32 },
  { year: 2014, executionsCarriedOut: 35, deathRowPopulation: 2942, homicideRate: 4.4, statesWithDeathPenalty: 32 },
  { year: 2015, executionsCarriedOut: 28, deathRowPopulation: 2881, homicideRate: 4.9, statesWithDeathPenalty: 32 },
  { year: 2016, executionsCarriedOut: 20, deathRowPopulation: 2814, homicideRate: 5.4, statesWithDeathPenalty: 31 },
  { year: 2017, executionsCarriedOut: 23, deathRowPopulation: 2768, homicideRate: 5.4, statesWithDeathPenalty: 31 },
  { year: 2018, executionsCarriedOut: 25, deathRowPopulation: 2690, homicideRate: 5.0, statesWithDeathPenalty: 30 },
  { year: 2019, executionsCarriedOut: 22, deathRowPopulation: 2620, homicideRate: 5.1, statesWithDeathPenalty: 29 },
  { year: 2020, executionsCarriedOut: 17, deathRowPopulation: 2528, homicideRate: 6.5, statesWithDeathPenalty: 28 },
  { year: 2021, executionsCarriedOut: 11, deathRowPopulation: 2436, homicideRate: 6.8, statesWithDeathPenalty: 27 },
  { year: 2022, executionsCarriedOut: 18, deathRowPopulation: 2331, homicideRate: 6.3, statesWithDeathPenalty: 27 },
  { year: 2023, executionsCarriedOut: 24, deathRowPopulation: 2241, homicideRate: 5.7, statesWithDeathPenalty: 27 },
];
