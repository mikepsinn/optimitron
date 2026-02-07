/**
 * US Incarceration vs Crime Rates
 *
 * Sources:
 * - Incarceration Rate: Bureau of Justice Statistics (BJS) "Prisoners" series.
 *   Sentenced prisoners under state or federal jurisdiction per 100,000 U.S. residents.
 *   (Note: Used per capita population to align with crime rate denominators).
 * - Total Incarcerated: BJS "Correctional Populations in the United States".
 *   Includes prisoners under state/federal jurisdiction plus local jail inmates.
 * - Violent & Property Crime Rates: FBI Uniform Crime Reporting (UCR) Program.
 *   Per 100,000 inhabitants.
 * - Corrections Spending: BJS "Justice Expenditure and Employment Extracts",
 *   Census Bureau "Annual Survey of State and Local Government Finances".
 *   Total corrections expenditure (State, Local, Federal) in billions USD (nominal).
 */

export interface USIncarcerationDataPoint {
  year: number;
  /** Sentenced prisoners per 100k population (BJS Prisoners) */
  incarcerationRate: number;
  /** Total inmates in custody: State/Fed Prisons + Local Jails (Thousands) */
  totalIncarcerated: number;
  /** Violent crime rate per 100k population (FBI UCR) */
  violentCrimeRate: number;
  /** Property crime rate per 100k population (FBI UCR) */
  propertyCrimeRate: number;
  /** Total corrections spending (billions USD, nominal) */
  correctionsSpendingBillions: number;
}

/**
 * US Incarceration data: 1980-2023.
 *
 * Tracks the "mass incarceration" era and its relationship with crime rates.
 * Incarceration exploded in the 80s/90s while crime peaked in 1991.
 * Both have declined in the 2010s/2020s, though spending remains high.
 */
export const US_INCARCERATION_DATA: USIncarcerationDataPoint[] = [
  { year: 1980, incarcerationRate: 139, totalIncarcerated: 503600, violentCrimeRate: 596.6, propertyCrimeRate: 5353.3, correctionsSpendingBillions: 9.0 },
  { year: 1981, incarcerationRate: 154, totalIncarcerated: 560400, violentCrimeRate: 594.3, propertyCrimeRate: 5264.3, correctionsSpendingBillions: 10.4 },
  { year: 1982, incarcerationRate: 171, totalIncarcerated: 612500, violentCrimeRate: 571.1, propertyCrimeRate: 5016.6, correctionsSpendingBillions: 11.7 },
  { year: 1983, incarcerationRate: 179, totalIncarcerated: 645200, violentCrimeRate: 537.7, propertyCrimeRate: 4633.4, correctionsSpendingBillions: 13.1 },
  { year: 1984, incarcerationRate: 188, totalIncarcerated: 692500, violentCrimeRate: 539.2, propertyCrimeRate: 4492.1, correctionsSpendingBillions: 14.9 },
  { year: 1985, incarcerationRate: 202, totalIncarcerated: 744200, violentCrimeRate: 556.6, propertyCrimeRate: 4650.5, correctionsSpendingBillions: 16.6 },
  { year: 1986, incarcerationRate: 217, totalIncarcerated: 806400, violentCrimeRate: 617.7, propertyCrimeRate: 4862.6, correctionsSpendingBillions: 19.0 },
  { year: 1987, incarcerationRate: 231, totalIncarcerated: 869600, violentCrimeRate: 609.7, propertyCrimeRate: 4940.3, correctionsSpendingBillions: 21.0 },
  { year: 1988, incarcerationRate: 247, totalIncarcerated: 953400, violentCrimeRate: 637.2, propertyCrimeRate: 5027.1, correctionsSpendingBillions: 23.4 },
  { year: 1989, incarcerationRate: 276, totalIncarcerated: 1078900, violentCrimeRate: 663.1, propertyCrimeRate: 5077.9, correctionsSpendingBillions: 26.8 },
  { year: 1990, incarcerationRate: 297, totalIncarcerated: 1148700, violentCrimeRate: 731.8, propertyCrimeRate: 5088.5, correctionsSpendingBillions: 30.1 },
  { year: 1991, incarcerationRate: 313, totalIncarcerated: 1219000, violentCrimeRate: 758.1, propertyCrimeRate: 5140.2, correctionsSpendingBillions: 32.7 },
  { year: 1992, incarcerationRate: 332, totalIncarcerated: 1295200, violentCrimeRate: 757.5, propertyCrimeRate: 4902.7, correctionsSpendingBillions: 34.9 },
  { year: 1993, incarcerationRate: 359, totalIncarcerated: 1369200, violentCrimeRate: 746.8, propertyCrimeRate: 4737.7, correctionsSpendingBillions: 36.9 },
  { year: 1994, incarcerationRate: 389, totalIncarcerated: 1476600, violentCrimeRate: 713.6, propertyCrimeRate: 4660.2, correctionsSpendingBillions: 40.0 },
  { year: 1995, incarcerationRate: 411, totalIncarcerated: 1585600, violentCrimeRate: 684.5, propertyCrimeRate: 4591.3, correctionsSpendingBillions: 43.5 },
  { year: 1996, incarcerationRate: 427, totalIncarcerated: 1646000, violentCrimeRate: 636.6, propertyCrimeRate: 4451.0, correctionsSpendingBillions: 46.2 },
  { year: 1997, incarcerationRate: 444, totalIncarcerated: 1743600, violentCrimeRate: 611.0, propertyCrimeRate: 4311.9, correctionsSpendingBillions: 49.0 },
  { year: 1998, incarcerationRate: 461, totalIncarcerated: 1816900, violentCrimeRate: 566.4, propertyCrimeRate: 4049.1, correctionsSpendingBillions: 52.3 },
  { year: 1999, incarcerationRate: 463, totalIncarcerated: 1893100, violentCrimeRate: 523.0, propertyCrimeRate: 3743.6, correctionsSpendingBillions: 55.4 },
  { year: 2000, incarcerationRate: 469, totalIncarcerated: 1937500, violentCrimeRate: 506.5, propertyCrimeRate: 3618.3, correctionsSpendingBillions: 58.8 },
  { year: 2001, incarcerationRate: 470, totalIncarcerated: 1961200, violentCrimeRate: 504.5, propertyCrimeRate: 3658.1, correctionsSpendingBillions: 62.4 },
  { year: 2002, incarcerationRate: 476, totalIncarcerated: 2033000, violentCrimeRate: 494.4, propertyCrimeRate: 3630.6, correctionsSpendingBillions: 66.0 },
  { year: 2003, incarcerationRate: 482, totalIncarcerated: 2085600, violentCrimeRate: 475.8, propertyCrimeRate: 3591.2, correctionsSpendingBillions: 68.7 },
  { year: 2004, incarcerationRate: 486, totalIncarcerated: 2135900, violentCrimeRate: 463.2, propertyCrimeRate: 3514.1, correctionsSpendingBillions: 71.4 },
  { year: 2005, incarcerationRate: 491, totalIncarcerated: 2195800, violentCrimeRate: 469.0, propertyCrimeRate: 3431.5, correctionsSpendingBillions: 74.5 },
  { year: 2006, incarcerationRate: 501, totalIncarcerated: 2256600, violentCrimeRate: 479.3, propertyCrimeRate: 3346.6, correctionsSpendingBillions: 79.0 },
  { year: 2007, incarcerationRate: 506, totalIncarcerated: 2296400, violentCrimeRate: 471.8, propertyCrimeRate: 3276.4, correctionsSpendingBillions: 84.2 },
  { year: 2008, incarcerationRate: 506, totalIncarcerated: 2307500, violentCrimeRate: 458.6, propertyCrimeRate: 3214.6, correctionsSpendingBillions: 88.0 },
  { year: 2009, incarcerationRate: 502, totalIncarcerated: 2284900, violentCrimeRate: 431.9, propertyCrimeRate: 3041.3, correctionsSpendingBillions: 89.5 },
  { year: 2010, incarcerationRate: 500, totalIncarcerated: 2266800, violentCrimeRate: 404.5, propertyCrimeRate: 2945.9, correctionsSpendingBillions: 90.0 },
  { year: 2011, incarcerationRate: 492, totalIncarcerated: 2239800, violentCrimeRate: 387.1, propertyCrimeRate: 2905.4, correctionsSpendingBillions: 89.1 },
  { year: 2012, incarcerationRate: 480, totalIncarcerated: 2231300, violentCrimeRate: 387.8, propertyCrimeRate: 2868.0, correctionsSpendingBillions: 88.4 },
  { year: 2013, incarcerationRate: 478, totalIncarcerated: 2220300, violentCrimeRate: 369.1, propertyCrimeRate: 2730.7, correctionsSpendingBillions: 89.5 },
  { year: 2014, incarcerationRate: 471, totalIncarcerated: 2203000, violentCrimeRate: 361.6, propertyCrimeRate: 2574.1, correctionsSpendingBillions: 91.8 },
  { year: 2015, incarcerationRate: 459, totalIncarcerated: 2173800, violentCrimeRate: 373.7, propertyCrimeRate: 2487.0, correctionsSpendingBillions: 94.5 },
  { year: 2016, incarcerationRate: 450, totalIncarcerated: 2163500, violentCrimeRate: 397.5, propertyCrimeRate: 2450.7, correctionsSpendingBillions: 97.2 },
  { year: 2017, incarcerationRate: 440, totalIncarcerated: 2145100, violentCrimeRate: 383.8, propertyCrimeRate: 2362.2, correctionsSpendingBillions: 100.1 },
  { year: 2018, incarcerationRate: 431, totalIncarcerated: 2123100, violentCrimeRate: 368.9, propertyCrimeRate: 2199.5, correctionsSpendingBillions: 103.5 },
  { year: 2019, incarcerationRate: 419, totalIncarcerated: 2086600, violentCrimeRate: 380.8, propertyCrimeRate: 2130.6, correctionsSpendingBillions: 106.4 },
  { year: 2020, incarcerationRate: 358, totalIncarcerated: 1691600, violentCrimeRate: 398.5, propertyCrimeRate: 1958.2, correctionsSpendingBillions: 108.2 },
  { year: 2021, incarcerationRate: 361, totalIncarcerated: 1798700, violentCrimeRate: 387.0, propertyCrimeRate: 1832.3, correctionsSpendingBillions: 112.5 },
  { year: 2022, incarcerationRate: 370, totalIncarcerated: 1848900, violentCrimeRate: 380.7, propertyCrimeRate: 1954.4, correctionsSpendingBillions: 118.1 },
  { year: 2023, incarcerationRate: 375, totalIncarcerated: 1890200, violentCrimeRate: 363.8, propertyCrimeRate: 1917.0, correctionsSpendingBillions: 123.4 },
];
