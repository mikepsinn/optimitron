/**
 * US Immigration Enforcement Spending, Net Immigration, and Tariff Data
 *
 * Sources:
 * - Immigration enforcement (CBP + ICE budgets): American Immigration Council,
 *   DHS Budget in Brief (various years), USASpending.gov
 * - Net migration: World Bank (SM.POP.NETM) — 5-year estimates, interpolated annually
 * - Effective tariff rate: USITC DataWeb (duties collected / imports value)
 *   https://www.usitc.gov/documents/dataweb/ave_table_1891_2023.pdf
 * - Customs duties collected: FRED series B235RC1Q027SBEA
 * - Median household income: FRED series MEHOINUSA672N (real 2023 dollars)
 */

export interface ImmigrationDataPoint {
  year: number;
  /** CBP + ICE combined budget (billions USD, nominal) */
  immigrationEnforcementBillions: number;
  /** Net migration (thousands of people) — World Bank estimates */
  netMigrationThousands: number;
  /** Median household income (real 2023 USD) */
  medianHouseholdIncomeReal: number;
}

/**
 * US Immigration enforcement spending vs income (2003-2023).
 * CBP + ICE budgets from DHS Budget in Brief.
 * Income in real 2023 dollars from FRED MEHOINUSA672N.
 */
export const US_IMMIGRATION_DATA: ImmigrationDataPoint[] = [
  { year: 2003, immigrationEnforcementBillions: 9.2,  netMigrationThousands: 1019, medianHouseholdIncomeReal: 63179 },
  { year: 2004, immigrationEnforcementBillions: 10.0, netMigrationThousands: 1019, medianHouseholdIncomeReal: 63410 },
  { year: 2005, immigrationEnforcementBillions: 10.6, netMigrationThousands: 1019, medianHouseholdIncomeReal: 63344 },
  { year: 2006, immigrationEnforcementBillions: 11.3, netMigrationThousands: 1019, medianHouseholdIncomeReal: 63761 },
  { year: 2007, immigrationEnforcementBillions: 12.1, netMigrationThousands: 1019, medianHouseholdIncomeReal: 64970 },
  { year: 2008, immigrationEnforcementBillions: 13.9, netMigrationThousands: 869,  medianHouseholdIncomeReal: 63366 },
  { year: 2009, immigrationEnforcementBillions: 15.0, netMigrationThousands: 869,  medianHouseholdIncomeReal: 62222 },
  { year: 2010, immigrationEnforcementBillions: 16.8, netMigrationThousands: 869,  medianHouseholdIncomeReal: 60236 },
  { year: 2011, immigrationEnforcementBillions: 17.2, netMigrationThousands: 869,  medianHouseholdIncomeReal: 58627 },
  { year: 2012, immigrationEnforcementBillions: 17.9, netMigrationThousands: 869,  medianHouseholdIncomeReal: 58627 },
  { year: 2013, immigrationEnforcementBillions: 17.9, netMigrationThousands: 997,  medianHouseholdIncomeReal: 59340 },
  { year: 2014, immigrationEnforcementBillions: 18.1, netMigrationThousands: 997,  medianHouseholdIncomeReal: 60462 },
  { year: 2015, immigrationEnforcementBillions: 18.7, netMigrationThousands: 997,  medianHouseholdIncomeReal: 63743 },
  { year: 2016, immigrationEnforcementBillions: 19.1, netMigrationThousands: 997,  medianHouseholdIncomeReal: 66149 },
  { year: 2017, immigrationEnforcementBillions: 19.8, netMigrationThousands: 997,  medianHouseholdIncomeReal: 67521 },
  { year: 2018, immigrationEnforcementBillions: 21.6, netMigrationThousands: 954,  medianHouseholdIncomeReal: 70784 },
  { year: 2019, immigrationEnforcementBillions: 23.1, netMigrationThousands: 954,  medianHouseholdIncomeReal: 74580 },
  { year: 2020, immigrationEnforcementBillions: 23.5, netMigrationThousands: 954,  medianHouseholdIncomeReal: 74099 },
  { year: 2021, immigrationEnforcementBillions: 24.3, netMigrationThousands: 954,  medianHouseholdIncomeReal: 76330 },
  { year: 2022, immigrationEnforcementBillions: 25.3, netMigrationThousands: 954,  medianHouseholdIncomeReal: 79500 },
  { year: 2023, immigrationEnforcementBillions: 29.2, netMigrationThousands: 1200, medianHouseholdIncomeReal: 82690 },
];

export interface TariffDataPoint {
  year: number;
  /** Effective tariff rate: customs duties collected / total imports value (%) */
  effectiveTariffRate: number;
  /** Customs duties collected (billions USD) */
  customsDutiesBillions: number;
  /** Median household income (real 2023 USD) */
  medianHouseholdIncomeReal: number;
  /** CPI-U (Consumer Price Index, All Urban Consumers, annual average, 1982-84=100) */
  cpi: number;
}

/**
 * US tariff rates and income (2000-2023).
 * Effective tariff rate from USITC (duties/imports).
 * Pre-Trump: ~1.5-1.7%. Trump tariffs (2018-19): rose to ~2.5-3%.
 * Biden kept most Trump tariffs.
 */
export const US_TARIFF_DATA: TariffDataPoint[] = [
  { year: 2000, effectiveTariffRate: 1.6, customsDutiesBillions: 19.9, medianHouseholdIncomeReal: 63535, cpi: 172.2 },
  { year: 2001, effectiveTariffRate: 1.6, customsDutiesBillions: 18.6, medianHouseholdIncomeReal: 62545, cpi: 177.1 },
  { year: 2002, effectiveTariffRate: 1.6, customsDutiesBillions: 18.6, medianHouseholdIncomeReal: 61888, cpi: 179.9 },
  { year: 2003, effectiveTariffRate: 1.5, customsDutiesBillions: 19.8, medianHouseholdIncomeReal: 63179, cpi: 184.0 },
  { year: 2004, effectiveTariffRate: 1.5, customsDutiesBillions: 22.5, medianHouseholdIncomeReal: 63410, cpi: 188.9 },
  { year: 2005, effectiveTariffRate: 1.4, customsDutiesBillions: 23.4, medianHouseholdIncomeReal: 63344, cpi: 195.3 },
  { year: 2006, effectiveTariffRate: 1.3, customsDutiesBillions: 24.8, medianHouseholdIncomeReal: 63761, cpi: 201.6 },
  { year: 2007, effectiveTariffRate: 1.3, customsDutiesBillions: 26.0, medianHouseholdIncomeReal: 64970, cpi: 207.3 },
  { year: 2008, effectiveTariffRate: 1.3, customsDutiesBillions: 27.6, medianHouseholdIncomeReal: 63366, cpi: 215.3 },
  { year: 2009, effectiveTariffRate: 1.4, customsDutiesBillions: 22.5, medianHouseholdIncomeReal: 62222, cpi: 214.5 },
  { year: 2010, effectiveTariffRate: 1.3, customsDutiesBillions: 25.3, medianHouseholdIncomeReal: 60236, cpi: 218.1 },
  { year: 2011, effectiveTariffRate: 1.3, customsDutiesBillions: 28.6, medianHouseholdIncomeReal: 58627, cpi: 224.9 },
  { year: 2012, effectiveTariffRate: 1.3, customsDutiesBillions: 30.3, medianHouseholdIncomeReal: 58627, cpi: 229.6 },
  { year: 2013, effectiveTariffRate: 1.4, customsDutiesBillions: 31.8, medianHouseholdIncomeReal: 59340, cpi: 233.0 },
  { year: 2014, effectiveTariffRate: 1.4, customsDutiesBillions: 33.9, medianHouseholdIncomeReal: 60462, cpi: 236.7 },
  { year: 2015, effectiveTariffRate: 1.5, customsDutiesBillions: 34.6, medianHouseholdIncomeReal: 63743, cpi: 237.0 },
  { year: 2016, effectiveTariffRate: 1.5, customsDutiesBillions: 33.9, medianHouseholdIncomeReal: 66149, cpi: 240.0 },
  { year: 2017, effectiveTariffRate: 1.5, customsDutiesBillions: 34.6, medianHouseholdIncomeReal: 67521, cpi: 245.1 },
  { year: 2018, effectiveTariffRate: 1.7, customsDutiesBillions: 41.3, medianHouseholdIncomeReal: 70784, cpi: 251.1 }, // Trump tariffs begin
  { year: 2019, effectiveTariffRate: 2.5, customsDutiesBillions: 71.9, medianHouseholdIncomeReal: 74580, cpi: 255.7 }, // Full Trump tariffs
  { year: 2020, effectiveTariffRate: 2.7, customsDutiesBillions: 68.4, medianHouseholdIncomeReal: 74099, cpi: 258.8 },
  { year: 2021, effectiveTariffRate: 2.4, customsDutiesBillions: 74.4, medianHouseholdIncomeReal: 76330, cpi: 271.0 },
  { year: 2022, effectiveTariffRate: 2.3, customsDutiesBillions: 98.8, medianHouseholdIncomeReal: 79500, cpi: 292.7 },
  { year: 2023, effectiveTariffRate: 2.2, customsDutiesBillions: 80.3, medianHouseholdIncomeReal: 82690, cpi: 304.7 },
];
