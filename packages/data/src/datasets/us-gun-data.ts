/**
 * US Gun Ownership, Background Checks, and Violence Data
 *
 * Sources:
 * - Estimated Guns Per Capita: Small Arms Survey (2018 estimate of 120.5), ATF "Firearms Commerce in the United States" (manufacturing + import - export trends).
 *   Interpolated annual estimates based on cumulative stock growth.
 * - NICS Background Checks: FBI National Instant Criminal Background Check System (NICS) annual totals.
 *   Note: Checks do not equal sales (1 check can cover multiple guns, or be for permit), but are the best proxy.
 * - Homicide Rate: FBI Uniform Crime Reporting (UCR) / CDC WONDER.
 *   Deaths per 100,000 population.
 * - Gun Homicide Rate: CDC WONDER (Underlying Cause of Death).
 *   Deaths per 100,000 population (Firearm Homicides).
 * - Gun Suicide Rate: CDC WONDER.
 *   Deaths per 100,000 population (Firearm Suicides).
 * - Mass Shooting Deaths: Mother Jones Mass Shooting Database / Gun Violence Archive (GVA).
 *   Definition: 4+ victims killed (excluding shooter) in a single incident.
 *   Note: "Mass Shooting" definitions vary. This tracks high-fatality incidents (Mass Killings).
 */

export interface USGunDataPoint {
  year: number;
  /** Estimated firearms per 100 residents (Cumulative stock estimate) */
  estimatedGunsPerCapita: number;
  /** Total annual NICS background checks (millions) */
  nicsBackgroundChecks: number;
  /** Homicide rate per 100k population (FBI/CDC) */
  homicideRate: number;
  /** Firearm homicide rate per 100k population (CDC) */
  gunHomicideRate: number;
  /** Firearm suicide rate per 100k population (CDC) */
  gunSuicideRate: number;
  /** Total deaths in mass shootings (4+ killed excluding shooter) */
  massShootingDeaths: number;
}

/**
 * US Gun Data: 2000-2023.
 *
 * Tracks the relationship between gun prevalence/sales (NICS) and violence.
 * Note: NICS checks spiked significantly in 2020-2021.
 * Gun Homicides also spiked in 2020-2021, breaking a long declining/flat trend.
 * Gun Suicides have steadily increased over the period.
 */
export const US_GUN_DATA: USGunDataPoint[] = [
  { year: 2000, estimatedGunsPerCapita: 90.5, nicsBackgroundChecks: 8.5, homicideRate: 5.5, gunHomicideRate: 3.8, gunSuicideRate: 5.9, massShootingDeaths: 7 },
  { year: 2001, estimatedGunsPerCapita: 91.8, nicsBackgroundChecks: 8.9, homicideRate: 5.6, gunHomicideRate: 3.9, gunSuicideRate: 5.9, massShootingDeaths: 5 },
  { year: 2002, estimatedGunsPerCapita: 93.1, nicsBackgroundChecks: 8.4, homicideRate: 5.6, gunHomicideRate: 4.1, gunSuicideRate: 6.0, massShootingDeaths: 5 },
  { year: 2003, estimatedGunsPerCapita: 94.4, nicsBackgroundChecks: 8.5, homicideRate: 5.7, gunHomicideRate: 4.1, gunSuicideRate: 5.9, massShootingDeaths: 7 },
  { year: 2004, estimatedGunsPerCapita: 95.8, nicsBackgroundChecks: 8.7, homicideRate: 5.5, gunHomicideRate: 3.9, gunSuicideRate: 5.8, massShootingDeaths: 5 },
  { year: 2005, estimatedGunsPerCapita: 97.2, nicsBackgroundChecks: 9.0, homicideRate: 5.6, gunHomicideRate: 4.0, gunSuicideRate: 5.7, massShootingDeaths: 17 }, // Red Lake
  { year: 2006, estimatedGunsPerCapita: 98.7, nicsBackgroundChecks: 10.0, homicideRate: 5.8, gunHomicideRate: 4.2, gunSuicideRate: 5.7, massShootingDeaths: 16 },
  { year: 2007, estimatedGunsPerCapita: 100.2, nicsBackgroundChecks: 11.2, homicideRate: 5.7, gunHomicideRate: 4.1, gunSuicideRate: 5.8, massShootingDeaths: 53 }, // Virginia Tech
  { year: 2008, estimatedGunsPerCapita: 101.8, nicsBackgroundChecks: 12.7, homicideRate: 5.4, gunHomicideRate: 3.9, gunSuicideRate: 6.0, massShootingDeaths: 17 },
  { year: 2009, estimatedGunsPerCapita: 103.5, nicsBackgroundChecks: 14.0, homicideRate: 5.0, gunHomicideRate: 3.7, gunSuicideRate: 6.1, massShootingDeaths: 39 }, // Fort Hood / Binghamton
  { year: 2010, estimatedGunsPerCapita: 105.1, nicsBackgroundChecks: 14.4, homicideRate: 4.8, gunHomicideRate: 3.6, gunSuicideRate: 6.3, massShootingDeaths: 8 },
  { year: 2011, estimatedGunsPerCapita: 107.0, nicsBackgroundChecks: 16.5, homicideRate: 4.7, gunHomicideRate: 3.6, gunSuicideRate: 6.5, massShootingDeaths: 18 }, // Tucson
  { year: 2012, estimatedGunsPerCapita: 109.3, nicsBackgroundChecks: 19.6, homicideRate: 4.7, gunHomicideRate: 3.8, gunSuicideRate: 6.7, massShootingDeaths: 71 }, // Sandy Hook / Aurora
  { year: 2013, estimatedGunsPerCapita: 111.9, nicsBackgroundChecks: 21.1, homicideRate: 4.5, gunHomicideRate: 3.6, gunSuicideRate: 6.7, massShootingDeaths: 35 }, // Washington Navy Yard
  { year: 2014, estimatedGunsPerCapita: 114.2, nicsBackgroundChecks: 21.0, homicideRate: 4.4, gunHomicideRate: 3.5, gunSuicideRate: 6.7, massShootingDeaths: 17 },
  { year: 2015, estimatedGunsPerCapita: 116.8, nicsBackgroundChecks: 23.1, homicideRate: 4.9, gunHomicideRate: 4.0, gunSuicideRate: 6.9, massShootingDeaths: 46 }, // San Bernardino / Charleston
  { year: 2016, estimatedGunsPerCapita: 119.5, nicsBackgroundChecks: 27.5, homicideRate: 5.4, gunHomicideRate: 4.5, gunSuicideRate: 7.0, massShootingDeaths: 71 }, // Orlando Pulse
  { year: 2017, estimatedGunsPerCapita: 121.7, nicsBackgroundChecks: 25.2, homicideRate: 5.3, gunHomicideRate: 4.6, gunSuicideRate: 7.3, massShootingDeaths: 117 }, // Las Vegas / Sutherland Springs
  { year: 2018, estimatedGunsPerCapita: 123.9, nicsBackgroundChecks: 26.2, homicideRate: 5.0, gunHomicideRate: 4.3, gunSuicideRate: 7.5, massShootingDeaths: 80 }, // Parkland / Pittsburgh
  { year: 2019, estimatedGunsPerCapita: 126.3, nicsBackgroundChecks: 28.4, homicideRate: 5.1, gunHomicideRate: 4.4, gunSuicideRate: 7.3, massShootingDeaths: 73 }, // El Paso / Virginia Beach
  { year: 2020, estimatedGunsPerCapita: 129.8, nicsBackgroundChecks: 39.7, homicideRate: 6.5, gunHomicideRate: 6.1, gunSuicideRate: 7.2, massShootingDeaths: 28 }, // Lower mass shooting deaths, higher overall violence
  { year: 2021, estimatedGunsPerCapita: 133.2, nicsBackgroundChecks: 38.9, homicideRate: 6.8, gunHomicideRate: 6.7, gunSuicideRate: 7.5, massShootingDeaths: 70 }, // Boulder / Indy / Atlanta
  { year: 2022, estimatedGunsPerCapita: 136.0, nicsBackgroundChecks: 31.6, homicideRate: 6.3, gunHomicideRate: 6.0, gunSuicideRate: 7.6, massShootingDeaths: 68 }, // Uvalde / Buffalo
  { year: 2023, estimatedGunsPerCapita: 138.5, nicsBackgroundChecks: 29.8, homicideRate: 5.5, gunHomicideRate: 5.2, gunSuicideRate: 7.7, massShootingDeaths: 85 }, // Lewiston / Monterey Park
];
