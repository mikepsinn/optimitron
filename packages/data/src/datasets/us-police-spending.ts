/**
 * US Police Spending vs Crime Rates
 *
 * Sources:
 * - Police Spending: Bureau of Justice Statistics (BJS) "Justice Expenditure and Employment Extracts",
 *   Census Bureau "Annual Survey of State and Local Government Finances".
 *   Includes State, Local, and Federal police protection expenditures.
 * - Crime Rates: FBI Uniform Crime Reporting (UCR) Program.
 *   Violent Crime: Murder, rape, robbery, aggravated assault.
 *   Property Crime: Burglary, larceny-theft, motor vehicle theft.
 * - Homicide Rate: FBI UCR / CDC.
 * - Officers Per Capita: BJS "Census of State and Local Law Enforcement Agencies", FBI UCR "Police Employee Data".
 *   Sworn officers per 100,000 inhabitants.
 */

export interface USPoliceSpendingDataPoint {
  year: number;
  /** Total police spending (billions USD, nominal) - State, Local, and Federal combined */
  totalPoliceSpendingBillions: number;
  /** Violent crime rate per 100k population (FBI UCR) */
  violentCrimeRate: number;
  /** Property crime rate per 100k population (FBI UCR) */
  propertyCrimeRate: number;
  /** Homicide rate per 100k population (FBI UCR) */
  homicideRate: number;
  /** Sworn police officers per 100k population (FBI UCR / BJS) */
  officersPerCapita: number;
}

/**
 * US Police Spending data: 1990-2023.
 *
 * Tracks the relationship between police funding/staffing and crime outcomes.
 * Note: Crime peaked in the early 1990s and declined significantly while spending increased.
 * Recent years (2020+) show divergence in trends (spending up, some crime up/down).
 */
export const US_POLICE_SPENDING_DATA: USPoliceSpendingDataPoint[] = [
  { year: 1990, totalPoliceSpendingBillions: 34.1, violentCrimeRate: 731.8, propertyCrimeRate: 5088.5, homicideRate: 9.4, officersPerCapita: 232 },
  { year: 1991, totalPoliceSpendingBillions: 36.4, violentCrimeRate: 758.1, propertyCrimeRate: 5140.2, homicideRate: 9.8, officersPerCapita: 234 },
  { year: 1992, totalPoliceSpendingBillions: 38.2, violentCrimeRate: 757.5, propertyCrimeRate: 4902.7, homicideRate: 9.3, officersPerCapita: 235 },
  { year: 1993, totalPoliceSpendingBillions: 40.5, violentCrimeRate: 746.8, propertyCrimeRate: 4737.7, homicideRate: 9.5, officersPerCapita: 236 },
  { year: 1994, totalPoliceSpendingBillions: 43.6, violentCrimeRate: 713.6, propertyCrimeRate: 4660.2, homicideRate: 9.0, officersPerCapita: 238 },
  { year: 1995, totalPoliceSpendingBillions: 46.8, violentCrimeRate: 684.5, propertyCrimeRate: 4591.3, homicideRate: 8.2, officersPerCapita: 240 },
  { year: 1996, totalPoliceSpendingBillions: 49.7, violentCrimeRate: 636.6, propertyCrimeRate: 4451.0, homicideRate: 7.4, officersPerCapita: 242 },
  { year: 1997, totalPoliceSpendingBillions: 53.4, violentCrimeRate: 611.0, propertyCrimeRate: 4311.9, homicideRate: 6.8, officersPerCapita: 244 },
  { year: 1998, totalPoliceSpendingBillions: 56.6, violentCrimeRate: 566.4, propertyCrimeRate: 4049.1, homicideRate: 6.3, officersPerCapita: 246 },
  { year: 1999, totalPoliceSpendingBillions: 60.1, violentCrimeRate: 523.0, propertyCrimeRate: 3743.6, homicideRate: 5.7, officersPerCapita: 245 },
  { year: 2000, totalPoliceSpendingBillions: 63.8, violentCrimeRate: 506.5, propertyCrimeRate: 3618.3, homicideRate: 5.5, officersPerCapita: 244 },
  { year: 2001, totalPoliceSpendingBillions: 68.4, violentCrimeRate: 504.5, propertyCrimeRate: 3658.1, homicideRate: 5.6, officersPerCapita: 243 },
  { year: 2002, totalPoliceSpendingBillions: 73.6, violentCrimeRate: 494.4, propertyCrimeRate: 3630.6, homicideRate: 5.6, officersPerCapita: 242 },
  { year: 2003, totalPoliceSpendingBillions: 77.2, violentCrimeRate: 475.8, propertyCrimeRate: 3591.2, homicideRate: 5.7, officersPerCapita: 241 },
  { year: 2004, totalPoliceSpendingBillions: 80.5, violentCrimeRate: 463.2, propertyCrimeRate: 3514.1, homicideRate: 5.5, officersPerCapita: 240 },
  { year: 2005, totalPoliceSpendingBillions: 84.8, violentCrimeRate: 469.0, propertyCrimeRate: 3431.5, homicideRate: 5.6, officersPerCapita: 239 },
  { year: 2006, totalPoliceSpendingBillions: 89.2, violentCrimeRate: 479.3, propertyCrimeRate: 3346.6, homicideRate: 5.8, officersPerCapita: 239 },
  { year: 2007, totalPoliceSpendingBillions: 95.1, violentCrimeRate: 471.8, propertyCrimeRate: 3276.4, homicideRate: 5.7, officersPerCapita: 238 },
  { year: 2008, totalPoliceSpendingBillions: 100.5, violentCrimeRate: 458.6, propertyCrimeRate: 3214.6, homicideRate: 5.4, officersPerCapita: 240 },
  { year: 2009, totalPoliceSpendingBillions: 103.8, violentCrimeRate: 431.9, propertyCrimeRate: 3041.3, homicideRate: 5.0, officersPerCapita: 241 },
  { year: 2010, totalPoliceSpendingBillions: 104.9, violentCrimeRate: 404.5, propertyCrimeRate: 2945.9, homicideRate: 4.8, officersPerCapita: 240 },
  { year: 2011, totalPoliceSpendingBillions: 105.7, violentCrimeRate: 387.1, propertyCrimeRate: 2905.4, homicideRate: 4.7, officersPerCapita: 238 },
  { year: 2012, totalPoliceSpendingBillions: 106.4, violentCrimeRate: 387.8, propertyCrimeRate: 2868.0, homicideRate: 4.7, officersPerCapita: 237 },
  { year: 2013, totalPoliceSpendingBillions: 108.2, violentCrimeRate: 369.1, propertyCrimeRate: 2730.7, homicideRate: 4.5, officersPerCapita: 236 },
  { year: 2014, totalPoliceSpendingBillions: 111.9, violentCrimeRate: 361.6, propertyCrimeRate: 2574.1, homicideRate: 4.4, officersPerCapita: 235 },
  { year: 2015, totalPoliceSpendingBillions: 116.3, violentCrimeRate: 373.7, propertyCrimeRate: 2487.0, homicideRate: 4.9, officersPerCapita: 234 },
  { year: 2016, totalPoliceSpendingBillions: 120.5, violentCrimeRate: 397.5, propertyCrimeRate: 2450.7, homicideRate: 5.4, officersPerCapita: 236 },
  { year: 2017, totalPoliceSpendingBillions: 125.4, violentCrimeRate: 383.8, propertyCrimeRate: 2362.2, homicideRate: 5.3, officersPerCapita: 235 },
  { year: 2018, totalPoliceSpendingBillions: 129.8, violentCrimeRate: 368.9, propertyCrimeRate: 2199.5, homicideRate: 5.0, officersPerCapita: 235 },
  { year: 2019, totalPoliceSpendingBillions: 134.5, violentCrimeRate: 380.8, propertyCrimeRate: 2130.6, homicideRate: 5.1, officersPerCapita: 234 },
  { year: 2020, totalPoliceSpendingBillions: 139.1, violentCrimeRate: 398.5, propertyCrimeRate: 1958.2, homicideRate: 6.5, officersPerCapita: 231 },
  { year: 2021, totalPoliceSpendingBillions: 145.2, violentCrimeRate: 387.0, propertyCrimeRate: 1832.3, homicideRate: 6.8, officersPerCapita: 228 },
  { year: 2022, totalPoliceSpendingBillions: 152.6, violentCrimeRate: 380.7, propertyCrimeRate: 1954.4, homicideRate: 6.3, officersPerCapita: 225 },
  { year: 2023, totalPoliceSpendingBillions: 158.4, violentCrimeRate: 363.8, propertyCrimeRate: 1917.0, homicideRate: 5.7, officersPerCapita: 221 },
];
