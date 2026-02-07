/**
 * US Abstinence Education: Federal Funding vs Teen Sexual Health Outcomes
 *
 * Sources:
 * - Federal Abstinence Funding:
 *   - Title V (Section 510) State Abstinence Education Grant Program (1996-Present)
 *   - Community-Based Abstinence Education (CBAE) (2001-2009)
 *   - Adolescent Family Life Act (AFLA) (1981-Present, partially abstinence-focused)
 *   - Sexual Risk Avoidance Education (SRAE) (2016-Present)
 *   - HHS Administration for Children and Families (ACF) Reports
 *   - Kaiser Family Foundation (KFF) Policy tracking
 *
 * - Teen Birth Rate (Ages 15-19):
 *   - CDC National Center for Health Statistics (NCHS) National Vital Statistics Reports
 *
 * - Teen Pregnancy Rate (Ages 15-19):
 *   - Guttmacher Institute (Historical comprehensive studies)
 *   - Note: Data often lags significantly behind birth data.
 *
 * - STD Rates (Chlamydia + Gonorrhea, Ages 15-19):
 *   - CDC National Notifiable Diseases Surveillance System (NNDSS)
 *   - CDC Sexually Transmitted Disease Surveillance Reports
 */

export interface USAbstinenceEducationDataPoint {
  year: number;
  /** Federal funding specifically for "abstinence-only" or "sexual risk avoidance" programs (Millions USD) */
  federalAbstinenceFundingMillions: number;
  /** Teen birth rate per 1,000 females ages 15-19 */
  teenBirthRatePer1000: number;
  /** Teen pregnancy rate per 1,000 females ages 15-19 (Births + Abortions + Miscarriages) */
  teenPregnancyRatePer1000: number | null;
  /** Combined rate of Chlamydia and Gonorrhea per 100,000 population ages 15-19 */
  stdRatePer100k: number | null;
}

/**
 * US Abstinence Education Data
 *
 * Tracks the relationship between federal investment in abstinence-only-until-marriage
 * education and key teen sexual health outcomes.
 *
 * Trends to observe:
 * - Teen pregnancy and birth rates have declined steadily since the early 1990s,
 *   largely independent of fluctuations in abstinence funding.
 * - STD rates among teens have generally increased or remained high despite funding.
 * - Funding peaked in the mid-2000s (CBAE era), dropped under Obama (2010-2016),
 *   and increased again under Trump (SRAE era).
 */
export const US_ABSTINENCE_EDUCATION_DATA: USAbstinenceEducationDataPoint[] = [
  // Late 90s: Title V (Welfare Reform) era
  { year: 1998, federalAbstinenceFundingMillions: 50, teenBirthRatePer1000: 51.1, teenPregnancyRatePer1000: 83.0, stdRatePer100k: 2320 },
  { year: 1999, federalAbstinenceFundingMillions: 60, teenBirthRatePer1000: 49.6, teenPregnancyRatePer1000: 80.0, stdRatePer100k: 2450 },
  { year: 2000, federalAbstinenceFundingMillions: 70, teenBirthRatePer1000: 47.7, teenPregnancyRatePer1000: 77.0, stdRatePer100k: 2560 },

  // Bush Era: Expansion with CBAE (Community-Based Abstinence Education)
  { year: 2001, federalAbstinenceFundingMillions: 80, teenBirthRatePer1000: 45.3, teenPregnancyRatePer1000: 73.0, stdRatePer100k: 2610 },
  { year: 2002, federalAbstinenceFundingMillions: 100, teenBirthRatePer1000: 43.0, teenPregnancyRatePer1000: 70.0, stdRatePer100k: 2750 },
  { year: 2003, federalAbstinenceFundingMillions: 115, teenBirthRatePer1000: 41.6, teenPregnancyRatePer1000: 67.0, stdRatePer100k: 2800 },
  { year: 2004, federalAbstinenceFundingMillions: 140, teenBirthRatePer1000: 41.1, teenPregnancyRatePer1000: 66.0, stdRatePer100k: 2850 },
  { year: 2005, federalAbstinenceFundingMillions: 160, teenBirthRatePer1000: 40.5, teenPregnancyRatePer1000: 64.0, stdRatePer100k: 2900 },
  { year: 2006, federalAbstinenceFundingMillions: 176, teenBirthRatePer1000: 41.9, teenPregnancyRatePer1000: 66.0, stdRatePer100k: 2950 },
  { year: 2007, federalAbstinenceFundingMillions: 176, teenBirthRatePer1000: 41.5, teenPregnancyRatePer1000: 66.0, stdRatePer100k: 3000 },
  { year: 2008, federalAbstinenceFundingMillions: 176, teenBirthRatePer1000: 40.2, teenPregnancyRatePer1000: 64.0, stdRatePer100k: 3100 },
  { year: 2009, federalAbstinenceFundingMillions: 145, teenBirthRatePer1000: 37.9, teenPregnancyRatePer1000: 60.0, stdRatePer100k: 3150 },

  // Obama Era: Elimination of CBAE, shift to Evidence-Based (TPPE), Title V remains
  { year: 2010, federalAbstinenceFundingMillions: 50, teenBirthRatePer1000: 34.2, teenPregnancyRatePer1000: 54.0, stdRatePer100k: 3250 },
  { year: 2011, federalAbstinenceFundingMillions: 50, teenBirthRatePer1000: 31.3, teenPregnancyRatePer1000: 50.0, stdRatePer100k: 3350 },
  { year: 2012, federalAbstinenceFundingMillions: 50, teenBirthRatePer1000: 29.4, teenPregnancyRatePer1000: 46.0, stdRatePer100k: 3300 },
  { year: 2013, federalAbstinenceFundingMillions: 50, teenBirthRatePer1000: 26.5, teenPregnancyRatePer1000: 42.0, stdRatePer100k: 3200 },
  { year: 2014, federalAbstinenceFundingMillions: 55, teenBirthRatePer1000: 24.2, teenPregnancyRatePer1000: 38.0, stdRatePer100k: 3250 },
  { year: 2015, federalAbstinenceFundingMillions: 60, teenBirthRatePer1000: 22.3, teenPregnancyRatePer1000: 35.0, stdRatePer100k: 3300 },

  // Trump Era: Resurgence via SRAE (Sexual Risk Avoidance Education)
  { year: 2016, federalAbstinenceFundingMillions: 75, teenBirthRatePer1000: 20.3, teenPregnancyRatePer1000: 32.0, stdRatePer100k: 3400 },
  { year: 2017, federalAbstinenceFundingMillions: 85, teenBirthRatePer1000: 18.8, teenPregnancyRatePer1000: 30.0, stdRatePer100k: 3500 },
  { year: 2018, federalAbstinenceFundingMillions: 100, teenBirthRatePer1000: 17.4, teenPregnancyRatePer1000: 28.0, stdRatePer100k: 3600 },
  { year: 2019, federalAbstinenceFundingMillions: 110, teenBirthRatePer1000: 16.7, teenPregnancyRatePer1000: 27.0, stdRatePer100k: 3700 },

  // Recent Years
  { year: 2020, federalAbstinenceFundingMillions: 110, teenBirthRatePer1000: 15.4, teenPregnancyRatePer1000: 25.0, stdRatePer100k: 3400 }, // Drop in STD reporting due to COVID
  { year: 2021, federalAbstinenceFundingMillions: 110, teenBirthRatePer1000: 13.9, teenPregnancyRatePer1000: null, stdRatePer100k: 3450 },
  { year: 2022, federalAbstinenceFundingMillions: 110, teenBirthRatePer1000: 13.5, teenPregnancyRatePer1000: null, stdRatePer100k: 3500 },
  { year: 2023, federalAbstinenceFundingMillions: 110, teenBirthRatePer1000: 13.2, teenPregnancyRatePer1000: null, stdRatePer100k: 3550 },
];
