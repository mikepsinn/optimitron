/**
 * US Foreign Aid: Official Development Assistance vs Global Outcomes
 *
 * Sources:
 * - ODA (Official Development Assistance): OECD DAC Table 1
 *   https://data.oecd.org/oda/net-oda.htm
 * - US Refugee Admissions: US Department of State / WRAPS
 *   https://www.wrapsnet.org/admissions-and-arrivals/
 * - Global Conflict Deaths: UCDP/PRIO Armed Conflict Dataset (Battle-related deaths)
 *   https://ucdp.uu.se/
 * - Global Extreme Poverty: World Bank PIP (Living under $2.15/day, 2017 PPP)
 *   https://pip.worldbank.org/
 *
 * Notes:
 * - US ODA as % of GNI consistently trails the UN target of 0.7%.
 * - Refugee admissions show sharp declines after 9/11 (2002) and policy shifts (2017-2020).
 * - Poverty data is often interpolated between survey years.
 */

export interface USForeignAidDataPoint {
  year: number;
  /** Net Official Development Assistance (Billions USD, nominal) */
  totalOdaBillions: number;
  /** ODA as percentage of Gross National Income */
  odaPercentGni: number;
  /** Total refugees admitted to the US (Fiscal Year) */
  refugeesAdmitted: number;
  /** Global battle-related deaths (UCDP best estimate) */
  conflictDeathsGlobal: number | null;
  /** Percentage of global population in extreme poverty ($2.15/day) */
  globalExtremePovertPercent: number | null;
}

export const US_FOREIGN_AID_DATA: USForeignAidDataPoint[] = [
  { year: 1990, totalOdaBillions: 11.4, odaPercentGni: 0.21, refugeesAdmitted: 122066, conflictDeathsGlobal: 51229, globalExtremePovertPercent: 37.8 },
  { year: 1991, totalOdaBillions: 11.3, odaPercentGni: 0.20, refugeesAdmitted: 113389, conflictDeathsGlobal: 53580, globalExtremePovertPercent: 36.8 },
  { year: 1992, totalOdaBillions: 11.7, odaPercentGni: 0.19, refugeesAdmitted: 132531, conflictDeathsGlobal: 46279, globalExtremePovertPercent: 35.6 },
  { year: 1993, totalOdaBillions: 10.1, odaPercentGni: 0.16, refugeesAdmitted: 119482, conflictDeathsGlobal: 36585, globalExtremePovertPercent: 34.5 },
  { year: 1994, totalOdaBillions: 9.9, odaPercentGni: 0.15, refugeesAdmitted: 112981, conflictDeathsGlobal: 36585, globalExtremePovertPercent: 33.3 }, // Rwanda genocide spike in conflict deaths often separate or estimated higher
  { year: 1995, totalOdaBillions: 7.3, odaPercentGni: 0.10, refugeesAdmitted: 99490, conflictDeathsGlobal: 33268, globalExtremePovertPercent: 32.2 },
  { year: 1996, totalOdaBillions: 9.4, odaPercentGni: 0.12, refugeesAdmitted: 76403, conflictDeathsGlobal: 32669, globalExtremePovertPercent: 30.5 },
  { year: 1997, totalOdaBillions: 6.9, odaPercentGni: 0.09, refugeesAdmitted: 70488, conflictDeathsGlobal: 34822, globalExtremePovertPercent: 29.8 },
  { year: 1998, totalOdaBillions: 8.8, odaPercentGni: 0.10, refugeesAdmitted: 77080, conflictDeathsGlobal: 49755, globalExtremePovertPercent: 29.1 },
  { year: 1999, totalOdaBillions: 9.1, odaPercentGni: 0.10, refugeesAdmitted: 85525, conflictDeathsGlobal: 68673, globalExtremePovertPercent: 28.6 },
  { year: 2000, totalOdaBillions: 9.9, odaPercentGni: 0.10, refugeesAdmitted: 73147, conflictDeathsGlobal: 74218, globalExtremePovertPercent: 27.8 },
  { year: 2001, totalOdaBillions: 11.4, odaPercentGni: 0.11, refugeesAdmitted: 70151, conflictDeathsGlobal: 42428, globalExtremePovertPercent: 26.5 },
  { year: 2002, totalOdaBillions: 13.3, odaPercentGni: 0.13, refugeesAdmitted: 27131, conflictDeathsGlobal: 36531, globalExtremePovertPercent: 25.4 },
  { year: 2003, totalOdaBillions: 16.3, odaPercentGni: 0.15, refugeesAdmitted: 28422, conflictDeathsGlobal: 33504, globalExtremePovertPercent: 24.3 },
  { year: 2004, totalOdaBillions: 19.7, odaPercentGni: 0.17, refugeesAdmitted: 52868, conflictDeathsGlobal: 27367, globalExtremePovertPercent: 23.2 },
  { year: 2005, totalOdaBillions: 27.9, odaPercentGni: 0.23, refugeesAdmitted: 53813, conflictDeathsGlobal: 25684, globalExtremePovertPercent: 21.9 }, // Iraq reconstruction spike
  { year: 2006, totalOdaBillions: 23.5, odaPercentGni: 0.18, refugeesAdmitted: 41223, conflictDeathsGlobal: 31224, globalExtremePovertPercent: 20.7 },
  { year: 2007, totalOdaBillions: 21.8, odaPercentGni: 0.16, refugeesAdmitted: 48282, conflictDeathsGlobal: 34691, globalExtremePovertPercent: 19.5 },
  { year: 2008, totalOdaBillions: 26.8, odaPercentGni: 0.19, refugeesAdmitted: 60191, conflictDeathsGlobal: 38815, globalExtremePovertPercent: 18.3 },
  { year: 2009, totalOdaBillions: 28.8, odaPercentGni: 0.21, refugeesAdmitted: 74602, conflictDeathsGlobal: 34664, globalExtremePovertPercent: 17.2 },
  { year: 2010, totalOdaBillions: 30.2, odaPercentGni: 0.21, refugeesAdmitted: 73311, conflictDeathsGlobal: 31083, globalExtremePovertPercent: 16.3 },
  { year: 2011, totalOdaBillions: 30.9, odaPercentGni: 0.20, refugeesAdmitted: 56424, conflictDeathsGlobal: 42475, globalExtremePovertPercent: 14.9 },
  { year: 2012, totalOdaBillions: 30.7, odaPercentGni: 0.19, refugeesAdmitted: 58238, conflictDeathsGlobal: 68674, globalExtremePovertPercent: 13.8 },
  { year: 2013, totalOdaBillions: 31.5, odaPercentGni: 0.19, refugeesAdmitted: 69926, conflictDeathsGlobal: 85966, globalExtremePovertPercent: 12.8 },
  { year: 2014, totalOdaBillions: 33.1, odaPercentGni: 0.19, refugeesAdmitted: 69987, conflictDeathsGlobal: 109866, globalExtremePovertPercent: 11.7 }, // Syria peak
  { year: 2015, totalOdaBillions: 30.9, odaPercentGni: 0.17, refugeesAdmitted: 69933, conflictDeathsGlobal: 101416, globalExtremePovertPercent: 10.8 },
  { year: 2016, totalOdaBillions: 33.5, odaPercentGni: 0.18, refugeesAdmitted: 84995, conflictDeathsGlobal: 87405, globalExtremePovertPercent: 10.1 },
  { year: 2017, totalOdaBillions: 34.7, odaPercentGni: 0.18, refugeesAdmitted: 53716, conflictDeathsGlobal: 72033, globalExtremePovertPercent: 9.3 },
  { year: 2018, totalOdaBillions: 33.8, odaPercentGni: 0.17, refugeesAdmitted: 22491, conflictDeathsGlobal: 56950, globalExtremePovertPercent: 8.9 },
  { year: 2019, totalOdaBillions: 33.1, odaPercentGni: 0.16, refugeesAdmitted: 30000, conflictDeathsGlobal: 54181, globalExtremePovertPercent: 8.5 },
  { year: 2020, totalOdaBillions: 35.5, odaPercentGni: 0.17, refugeesAdmitted: 11814, conflictDeathsGlobal: 52932, globalExtremePovertPercent: 9.3 }, // COVID poverty spike
  { year: 2021, totalOdaBillions: 42.3, odaPercentGni: 0.18, refugeesAdmitted: 11411, conflictDeathsGlobal: 87158, globalExtremePovertPercent: 9.1 },
  { year: 2022, totalOdaBillions: 55.3, odaPercentGni: 0.22, refugeesAdmitted: 25465, conflictDeathsGlobal: 237000, globalExtremePovertPercent: 9.0 }, // Ukraine war ODA spike & conflict death spike (approx)
  { year: 2023, totalOdaBillions: 66.0, odaPercentGni: 0.24, refugeesAdmitted: 60014, conflictDeathsGlobal: 153000, globalExtremePovertPercent: 8.8 },
];
