/**
 * OECD Direct Outcomes: Mapping spending categories to direct results
 *
 * Sources:
 * - OECD PISA (Education)
 * - UNODC / EMCDDA / CDC (Overdose)
 * - OECD Health Statistics (Preventable mortality)
 * - WIPO (Innovation/Patents)
 * - OECD (Poverty)
 * - UNODC (Crime/Homicide)
 * - World Bank (CO2)
 *
 * Modeling-grade dataset with interpolations and static placeholders.
 * Do not treat as raw observations.
 */

export interface DataQuality {
  source: string;
  quality: "observed" | "interpolated" | "static";
  years: "triennial" | "annual" | "constant";
}

export type DataProvenance = DataQuality;

export interface OECDDirectOutcomeDataPoint {
  jurisdictionIso3: string;
  year: number;
  /** OECD PISA — reading+math+science average; observed triennially only. */
  pisaScoreAvg: number | null;
  /** Drug overdose deaths per 100k population; partial coverage, interpolated between years. */
  overdoseDeathsPer100k: number | null;
  /** Preventable (amenable) mortality per 100k; partial coverage, interpolated between years. */
  preventableDeathsPer100k: number | null;
  /** Patent applications per million people; partial coverage, interpolated between years. */
  patentsPerMillion: number | null;
  /** Poverty rate (50% median income threshold); static placeholder repeated, needs update. */
  povertyRatePercent: number | null;
  /** Intentional homicide rate per 100k; partial coverage, interpolated between years. */
  crimeRatePer100k: number | null;
  /** CO2 emissions metric tons per capita; partial coverage, interpolated between years. */
  co2PerCapitaTons: number | null;
}

export const DATA_PROVENANCE: Record<keyof OECDDirectOutcomeDataPoint, DataProvenance> = {
  jurisdictionIso3: { source: "ISO 3166-1 alpha-3", quality: "observed", years: "annual" },
  year: { source: "Calendar year", quality: "observed", years: "annual" },
  pisaScoreAvg: { source: "OECD PISA", quality: "observed", years: "triennial" },
  overdoseDeathsPer100k: { source: "EMCDDA/CDC", quality: "interpolated", years: "annual" },
  preventableDeathsPer100k: { source: "OECD Health Statistics", quality: "interpolated", years: "annual" },
  patentsPerMillion: { source: "WIPO", quality: "interpolated", years: "annual" },
  povertyRatePercent: { source: "OECD", quality: "static", years: "constant" },
  crimeRatePer100k: { source: "UNODC", quality: "interpolated", years: "annual" },
  co2PerCapitaTons: { source: "World Bank", quality: "interpolated", years: "annual" },
};

export const getDataQuality = (
  field: keyof OECDDirectOutcomeDataPoint
): DataQuality => DATA_PROVENANCE[field];

export const OECD_DIRECT_OUTCOMES: OECDDirectOutcomeDataPoint[] = [
  // USA
  { jurisdictionIso3: "USA", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 14.5, preventableDeathsPer100k: 186, patentsPerMillion: 836, povertyRatePercent: 17, crimeRatePer100k: 5.7, co2PerCapitaTons: 18.2 },
  { jurisdictionIso3: "USA", year: 2006, pisaScoreAvg: 486, overdoseDeathsPer100k: 15.5, preventableDeathsPer100k: 184, patentsPerMillion: 844, povertyRatePercent: 17, crimeRatePer100k: 5.8, co2PerCapitaTons: 17.8 },
  { jurisdictionIso3: "USA", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 16.4, preventableDeathsPer100k: 181, patentsPerMillion: 851, povertyRatePercent: 17, crimeRatePer100k: 5.8, co2PerCapitaTons: 17.5 },
  { jurisdictionIso3: "USA", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 17.3, preventableDeathsPer100k: 178, patentsPerMillion: 858, povertyRatePercent: 17, crimeRatePer100k: 5.9, co2PerCapitaTons: 17.1 },
  { jurisdictionIso3: "USA", year: 2009, pisaScoreAvg: 489, overdoseDeathsPer100k: 18.2, preventableDeathsPer100k: 175, patentsPerMillion: 865, povertyRatePercent: 17, crimeRatePer100k: 5.9, co2PerCapitaTons: 16.7 },
  { jurisdictionIso3: "USA", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 19.1, preventableDeathsPer100k: 173, patentsPerMillion: 873, povertyRatePercent: 17, crimeRatePer100k: 6, co2PerCapitaTons: 16.4 },
  { jurisdictionIso3: "USA", year: 2012, pisaScoreAvg: 490, overdoseDeathsPer100k: 20.9, preventableDeathsPer100k: 167, patentsPerMillion: 887, povertyRatePercent: 17, crimeRatePer100k: 6, co2PerCapitaTons: 15.6 },
  { jurisdictionIso3: "USA", year: 2015, pisaScoreAvg: 492, overdoseDeathsPer100k: 23.6, preventableDeathsPer100k: 159, patentsPerMillion: 909, povertyRatePercent: 17, crimeRatePer100k: 6.2, co2PerCapitaTons: 14.5 },
  { jurisdictionIso3: "USA", year: 2018, pisaScoreAvg: 493, overdoseDeathsPer100k: 26.4, preventableDeathsPer100k: 151, patentsPerMillion: 931, povertyRatePercent: 17, crimeRatePer100k: 6.3, co2PerCapitaTons: 13.5 },
  { jurisdictionIso3: "USA", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 28.2, preventableDeathsPer100k: 145, patentsPerMillion: 945, povertyRatePercent: 17, crimeRatePer100k: 6.4, co2PerCapitaTons: 12.7 },
  { jurisdictionIso3: "USA", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 30, preventableDeathsPer100k: 140, patentsPerMillion: 960, povertyRatePercent: 17, crimeRatePer100k: 6.5, co2PerCapitaTons: 12 },

  // GBR
  { jurisdictionIso3: "GBR", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 140, patentsPerMillion: 418, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "GBR", year: 2006, pisaScoreAvg: 495, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 138, patentsPerMillion: 422, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "GBR", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 136, patentsPerMillion: 425, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.1 },
  { jurisdictionIso3: "GBR", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 134, patentsPerMillion: 429, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "GBR", year: 2009, pisaScoreAvg: 501, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 132, patentsPerMillion: 433, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "GBR", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 130, patentsPerMillion: 436, povertyRatePercent: 11, crimeRatePer100k: 1.4, co2PerCapitaTons: 7.8 },
  { jurisdictionIso3: "GBR", year: 2012, pisaScoreAvg: 502, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 125, patentsPerMillion: 444, povertyRatePercent: 11, crimeRatePer100k: 1.3, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "GBR", year: 2015, pisaScoreAvg: 497, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 119, patentsPerMillion: 455, povertyRatePercent: 11, crimeRatePer100k: 1.3, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "GBR", year: 2018, pisaScoreAvg: 496, overdoseDeathsPer100k: 6.4, preventableDeathsPer100k: 113, patentsPerMillion: 465, povertyRatePercent: 11, crimeRatePer100k: 1.3, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "GBR", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 109, patentsPerMillion: 473, povertyRatePercent: 11, crimeRatePer100k: 1.2, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "GBR", year: 2022, pisaScoreAvg: 498, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 105, patentsPerMillion: 480, povertyRatePercent: 11, crimeRatePer100k: 1.2, co2PerCapitaTons: 6.3 },

  // FRA
  { jurisdictionIso3: "FRA", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 121, patentsPerMillion: 314, povertyRatePercent: 8, crimeRatePer100k: 1.1, co2PerCapitaTons: 5.6 },
  { jurisdictionIso3: "FRA", year: 2006, pisaScoreAvg: 497, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 119, patentsPerMillion: 316, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5.5 },
  { jurisdictionIso3: "FRA", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 118, patentsPerMillion: 319, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5.4 },
  { jurisdictionIso3: "FRA", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 116, patentsPerMillion: 322, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5.3 },
  { jurisdictionIso3: "FRA", year: 2009, pisaScoreAvg: 496, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 114, patentsPerMillion: 325, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5.3 },
  { jurisdictionIso3: "FRA", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 112, patentsPerMillion: 327, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5.2 },
  { jurisdictionIso3: "FRA", year: 2012, pisaScoreAvg: 495, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 109, patentsPerMillion: 333, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 5 },
  { jurisdictionIso3: "FRA", year: 2015, pisaScoreAvg: 493, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 103, patentsPerMillion: 341, povertyRatePercent: 8, crimeRatePer100k: 1, co2PerCapitaTons: 4.8 },
  { jurisdictionIso3: "FRA", year: 2018, pisaScoreAvg: 492, overdoseDeathsPer100k: 1.4, preventableDeathsPer100k: 98, patentsPerMillion: 349, povertyRatePercent: 8, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.5 },
  { jurisdictionIso3: "FRA", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 95, patentsPerMillion: 355, povertyRatePercent: 8, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.4 },
  { jurisdictionIso3: "FRA", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 91, patentsPerMillion: 360, povertyRatePercent: 8, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.2 },

  // DEU
  { jurisdictionIso3: "DEU", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 2.1, preventableDeathsPer100k: 130, patentsPerMillion: 941, povertyRatePercent: 9.5, crimeRatePer100k: 1, co2PerCapitaTons: 9.3 },
  { jurisdictionIso3: "DEU", year: 2006, pisaScoreAvg: 487, overdoseDeathsPer100k: 2.1, preventableDeathsPer100k: 129, patentsPerMillion: 949, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 9.2 },
  { jurisdictionIso3: "DEU", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 127, patentsPerMillion: 957, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 9 },
  { jurisdictionIso3: "DEU", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 125, patentsPerMillion: 965, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.9 },
  { jurisdictionIso3: "DEU", year: 2009, pisaScoreAvg: 486, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 123, patentsPerMillion: 974, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.8 },
  { jurisdictionIso3: "DEU", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 121, patentsPerMillion: 982, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.6 },
  { jurisdictionIso3: "DEU", year: 2012, pisaScoreAvg: 485, overdoseDeathsPer100k: 2.3, preventableDeathsPer100k: 117, patentsPerMillion: 998, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "DEU", year: 2015, pisaScoreAvg: 483, overdoseDeathsPer100k: 2.3, preventableDeathsPer100k: 111, patentsPerMillion: 1023, povertyRatePercent: 9.5, crimeRatePer100k: 0.9, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "DEU", year: 2018, pisaScoreAvg: 482, overdoseDeathsPer100k: 2.4, preventableDeathsPer100k: 106, patentsPerMillion: 1047, povertyRatePercent: 9.5, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "DEU", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 2.5, preventableDeathsPer100k: 102, patentsPerMillion: 1064, povertyRatePercent: 9.5, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "DEU", year: 2022, pisaScoreAvg: 480, overdoseDeathsPer100k: 2.5, preventableDeathsPer100k: 98, patentsPerMillion: 1080, povertyRatePercent: 9.5, crimeRatePer100k: 0.8, co2PerCapitaTons: 7 },

  // JPN
  { jurisdictionIso3: "JPN", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 0.6, preventableDeathsPer100k: 84, patentsPerMillion: 2614, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.9 },
  { jurisdictionIso3: "JPN", year: 2006, pisaScoreAvg: 517, overdoseDeathsPer100k: 0.6, preventableDeathsPer100k: 83, patentsPerMillion: 2636, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.7 },
  { jurisdictionIso3: "JPN", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 81, patentsPerMillion: 2659, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.6 },
  { jurisdictionIso3: "JPN", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 80, patentsPerMillion: 2682, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.5 },
  { jurisdictionIso3: "JPN", year: 2009, pisaScoreAvg: 516, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 79, patentsPerMillion: 2705, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "JPN", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 78, patentsPerMillion: 2727, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 8.2 },
  { jurisdictionIso3: "JPN", year: 2012, pisaScoreAvg: 515, overdoseDeathsPer100k: 0.8, preventableDeathsPer100k: 75, patentsPerMillion: 2773, povertyRatePercent: 15, crimeRatePer100k: 0.4, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "JPN", year: 2015, pisaScoreAvg: 513, overdoseDeathsPer100k: 0.8, preventableDeathsPer100k: 72, patentsPerMillion: 2841, povertyRatePercent: 15, crimeRatePer100k: 0.3, co2PerCapitaTons: 7.6 },
  { jurisdictionIso3: "JPN", year: 2018, pisaScoreAvg: 512, overdoseDeathsPer100k: 0.9, preventableDeathsPer100k: 68, patentsPerMillion: 2909, povertyRatePercent: 15, crimeRatePer100k: 0.3, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "JPN", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 1, preventableDeathsPer100k: 65, patentsPerMillion: 2955, povertyRatePercent: 15, crimeRatePer100k: 0.3, co2PerCapitaTons: 6.9 },
  { jurisdictionIso3: "JPN", year: 2022, pisaScoreAvg: 510, overdoseDeathsPer100k: 1, preventableDeathsPer100k: 63, patentsPerMillion: 3000, povertyRatePercent: 15, crimeRatePer100k: 0.3, co2PerCapitaTons: 6.6 },

  // CAN
  { jurisdictionIso3: "CAN", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 7.3, preventableDeathsPer100k: 130, patentsPerMillion: 209, povertyRatePercent: 12, crimeRatePer100k: 1.7, co2PerCapitaTons: 15.5 },
  { jurisdictionIso3: "CAN", year: 2006, pisaScoreAvg: 517, overdoseDeathsPer100k: 7.7, preventableDeathsPer100k: 129, patentsPerMillion: 211, povertyRatePercent: 12, crimeRatePer100k: 1.7, co2PerCapitaTons: 15.1 },
  { jurisdictionIso3: "CAN", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 8.2, preventableDeathsPer100k: 127, patentsPerMillion: 213, povertyRatePercent: 12, crimeRatePer100k: 1.7, co2PerCapitaTons: 14.8 },
  { jurisdictionIso3: "CAN", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 8.6, preventableDeathsPer100k: 125, patentsPerMillion: 215, povertyRatePercent: 12, crimeRatePer100k: 1.7, co2PerCapitaTons: 14.5 },
  { jurisdictionIso3: "CAN", year: 2009, pisaScoreAvg: 516, overdoseDeathsPer100k: 9.1, preventableDeathsPer100k: 123, patentsPerMillion: 216, povertyRatePercent: 12, crimeRatePer100k: 1.7, co2PerCapitaTons: 14.2 },
  { jurisdictionIso3: "CAN", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 9.5, preventableDeathsPer100k: 121, patentsPerMillion: 218, povertyRatePercent: 12, crimeRatePer100k: 1.6, co2PerCapitaTons: 13.9 },
  { jurisdictionIso3: "CAN", year: 2012, pisaScoreAvg: 515, overdoseDeathsPer100k: 10.5, preventableDeathsPer100k: 117, patentsPerMillion: 222, povertyRatePercent: 12, crimeRatePer100k: 1.6, co2PerCapitaTons: 13.3 },
  { jurisdictionIso3: "CAN", year: 2015, pisaScoreAvg: 513, overdoseDeathsPer100k: 11.8, preventableDeathsPer100k: 111, patentsPerMillion: 227, povertyRatePercent: 12, crimeRatePer100k: 1.6, co2PerCapitaTons: 12.4 },
  { jurisdictionIso3: "CAN", year: 2018, pisaScoreAvg: 512, overdoseDeathsPer100k: 13.2, preventableDeathsPer100k: 106, patentsPerMillion: 233, povertyRatePercent: 12, crimeRatePer100k: 1.5, co2PerCapitaTons: 11.4 },
  { jurisdictionIso3: "CAN", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 14.1, preventableDeathsPer100k: 102, patentsPerMillion: 236, povertyRatePercent: 12, crimeRatePer100k: 1.5, co2PerCapitaTons: 10.8 },
  { jurisdictionIso3: "CAN", year: 2022, pisaScoreAvg: 510, overdoseDeathsPer100k: 15, preventableDeathsPer100k: 98, patentsPerMillion: 240, povertyRatePercent: 12, crimeRatePer100k: 1.4, co2PerCapitaTons: 10.2 },

  // ITA
  { jurisdictionIso3: "ITA", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 112, patentsPerMillion: 157, povertyRatePercent: 13, crimeRatePer100k: 0.9, co2PerCapitaTons: 7 },
  { jurisdictionIso3: "ITA", year: 2006, pisaScoreAvg: 467, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 110, patentsPerMillion: 158, povertyRatePercent: 13, crimeRatePer100k: 0.9, co2PerCapitaTons: 6.9 },
  { jurisdictionIso3: "ITA", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 109, patentsPerMillion: 160, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "ITA", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 107, patentsPerMillion: 161, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.7 },
  { jurisdictionIso3: "ITA", year: 2009, pisaScoreAvg: 466, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 105, patentsPerMillion: 162, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.6 },
  { jurisdictionIso3: "ITA", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 104, patentsPerMillion: 164, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "ITA", year: 2012, pisaScoreAvg: 465, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 100, patentsPerMillion: 166, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.3 },
  { jurisdictionIso3: "ITA", year: 2015, pisaScoreAvg: 463, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 95, patentsPerMillion: 170, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 6 },
  { jurisdictionIso3: "ITA", year: 2018, pisaScoreAvg: 462, overdoseDeathsPer100k: 1.4, preventableDeathsPer100k: 91, patentsPerMillion: 175, povertyRatePercent: 13, crimeRatePer100k: 0.8, co2PerCapitaTons: 5.7 },
  { jurisdictionIso3: "ITA", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 87, patentsPerMillion: 177, povertyRatePercent: 13, crimeRatePer100k: 0.7, co2PerCapitaTons: 5.5 },
  { jurisdictionIso3: "ITA", year: 2022, pisaScoreAvg: 460, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 84, patentsPerMillion: 180, povertyRatePercent: 13, crimeRatePer100k: 0.7, co2PerCapitaTons: 5.3 },

  // AUS
  { jurisdictionIso3: "AUS", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 121, patentsPerMillion: 157, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 16.4 },
  { jurisdictionIso3: "AUS", year: 2006, pisaScoreAvg: 507, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 119, patentsPerMillion: 158, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 16 },
  { jurisdictionIso3: "AUS", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 118, patentsPerMillion: 160, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 15.7 },
  { jurisdictionIso3: "AUS", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 116, patentsPerMillion: 161, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 15.4 },
  { jurisdictionIso3: "AUS", year: 2009, pisaScoreAvg: 506, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 114, patentsPerMillion: 162, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 15.1 },
  { jurisdictionIso3: "AUS", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 112, patentsPerMillion: 164, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 14.7 },
  { jurisdictionIso3: "AUS", year: 2012, pisaScoreAvg: 505, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 109, patentsPerMillion: 166, povertyRatePercent: 13, crimeRatePer100k: 1.1, co2PerCapitaTons: 14.1 },
  { jurisdictionIso3: "AUS", year: 2015, pisaScoreAvg: 503, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 103, patentsPerMillion: 170, povertyRatePercent: 13, crimeRatePer100k: 1, co2PerCapitaTons: 13.1 },
  { jurisdictionIso3: "AUS", year: 2018, pisaScoreAvg: 502, overdoseDeathsPer100k: 6.4, preventableDeathsPer100k: 98, patentsPerMillion: 175, povertyRatePercent: 13, crimeRatePer100k: 1, co2PerCapitaTons: 12.1 },
  { jurisdictionIso3: "AUS", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 95, patentsPerMillion: 177, povertyRatePercent: 13, crimeRatePer100k: 1, co2PerCapitaTons: 11.5 },
  { jurisdictionIso3: "AUS", year: 2022, pisaScoreAvg: 500, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 91, patentsPerMillion: 180, povertyRatePercent: 13, crimeRatePer100k: 1, co2PerCapitaTons: 10.8 },

  // NLD
  { jurisdictionIso3: "NLD", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 103, patentsPerMillion: 523, povertyRatePercent: 7.5, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "NLD", year: 2006, pisaScoreAvg: 507, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 101, patentsPerMillion: 527, povertyRatePercent: 7.5, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "NLD", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 100, patentsPerMillion: 532, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 8.1 },
  { jurisdictionIso3: "NLD", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 98, patentsPerMillion: 536, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "NLD", year: 2009, pisaScoreAvg: 506, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 97, patentsPerMillion: 541, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "NLD", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 95, patentsPerMillion: 545, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.8 },
  { jurisdictionIso3: "NLD", year: 2012, pisaScoreAvg: 505, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 92, patentsPerMillion: 555, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "NLD", year: 2015, pisaScoreAvg: 503, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 88, patentsPerMillion: 568, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "NLD", year: 2018, pisaScoreAvg: 502, overdoseDeathsPer100k: 1.9, preventableDeathsPer100k: 83, patentsPerMillion: 582, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "NLD", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 80, patentsPerMillion: 591, povertyRatePercent: 7.5, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "NLD", year: 2022, pisaScoreAvg: 500, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 77, patentsPerMillion: 600, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.3 },

  // BEL
  { jurisdictionIso3: "BEL", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 2.1, preventableDeathsPer100k: 121, patentsPerMillion: 418, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.9 },
  { jurisdictionIso3: "BEL", year: 2006, pisaScoreAvg: 497, overdoseDeathsPer100k: 2.1, preventableDeathsPer100k: 119, patentsPerMillion: 422, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.7 },
  { jurisdictionIso3: "BEL", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 118, patentsPerMillion: 425, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.6 },
  { jurisdictionIso3: "BEL", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 116, patentsPerMillion: 429, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.5 },
  { jurisdictionIso3: "BEL", year: 2009, pisaScoreAvg: 496, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 114, patentsPerMillion: 433, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "BEL", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 2.2, preventableDeathsPer100k: 112, patentsPerMillion: 436, povertyRatePercent: 10, crimeRatePer100k: 1.5, co2PerCapitaTons: 8.2 },
  { jurisdictionIso3: "BEL", year: 2012, pisaScoreAvg: 495, overdoseDeathsPer100k: 2.3, preventableDeathsPer100k: 109, patentsPerMillion: 444, povertyRatePercent: 10, crimeRatePer100k: 1.4, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "BEL", year: 2015, pisaScoreAvg: 493, overdoseDeathsPer100k: 2.3, preventableDeathsPer100k: 103, patentsPerMillion: 455, povertyRatePercent: 10, crimeRatePer100k: 1.4, co2PerCapitaTons: 7.6 },
  { jurisdictionIso3: "BEL", year: 2018, pisaScoreAvg: 492, overdoseDeathsPer100k: 2.4, preventableDeathsPer100k: 98, patentsPerMillion: 465, povertyRatePercent: 10, crimeRatePer100k: 1.3, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "BEL", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 2.5, preventableDeathsPer100k: 95, patentsPerMillion: 473, povertyRatePercent: 10, crimeRatePer100k: 1.3, co2PerCapitaTons: 6.9 },
  { jurisdictionIso3: "BEL", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 2.5, preventableDeathsPer100k: 91, patentsPerMillion: 480, povertyRatePercent: 10, crimeRatePer100k: 1.3, co2PerCapitaTons: 6.6 },

  // SWE
  { jurisdictionIso3: "SWE", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 7.1, preventableDeathsPer100k: 93, patentsPerMillion: 732, povertyRatePercent: 7, crimeRatePer100k: 1.1, co2PerCapitaTons: 4.7 },
  { jurisdictionIso3: "SWE", year: 2006, pisaScoreAvg: 497, overdoseDeathsPer100k: 7.1, preventableDeathsPer100k: 92, patentsPerMillion: 738, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.6 },
  { jurisdictionIso3: "SWE", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 7.2, preventableDeathsPer100k: 90, patentsPerMillion: 745, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.5 },
  { jurisdictionIso3: "SWE", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 7.2, preventableDeathsPer100k: 89, patentsPerMillion: 751, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.5 },
  { jurisdictionIso3: "SWE", year: 2009, pisaScoreAvg: 496, overdoseDeathsPer100k: 7.2, preventableDeathsPer100k: 88, patentsPerMillion: 757, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.4 },
  { jurisdictionIso3: "SWE", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 7.2, preventableDeathsPer100k: 86, patentsPerMillion: 764, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.3 },
  { jurisdictionIso3: "SWE", year: 2012, pisaScoreAvg: 495, overdoseDeathsPer100k: 7.3, preventableDeathsPer100k: 84, patentsPerMillion: 776, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4.2 },
  { jurisdictionIso3: "SWE", year: 2015, pisaScoreAvg: 493, overdoseDeathsPer100k: 7.3, preventableDeathsPer100k: 80, patentsPerMillion: 795, povertyRatePercent: 7, crimeRatePer100k: 1, co2PerCapitaTons: 4 },
  { jurisdictionIso3: "SWE", year: 2018, pisaScoreAvg: 492, overdoseDeathsPer100k: 7.4, preventableDeathsPer100k: 75, patentsPerMillion: 815, povertyRatePercent: 7, crimeRatePer100k: 0.9, co2PerCapitaTons: 3.8 },
  { jurisdictionIso3: "SWE", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 7.5, preventableDeathsPer100k: 73, patentsPerMillion: 827, povertyRatePercent: 7, crimeRatePer100k: 0.9, co2PerCapitaTons: 3.6 },
  { jurisdictionIso3: "SWE", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 7.5, preventableDeathsPer100k: 70, patentsPerMillion: 840, povertyRatePercent: 7, crimeRatePer100k: 0.9, co2PerCapitaTons: 3.5 },

  // NOR
  { jurisdictionIso3: "NOR", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 93, patentsPerMillion: 314, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "NOR", year: 2006, pisaScoreAvg: 487, overdoseDeathsPer100k: 6.1, preventableDeathsPer100k: 92, patentsPerMillion: 316, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "NOR", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 90, patentsPerMillion: 319, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "NOR", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 89, patentsPerMillion: 322, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.1 },
  { jurisdictionIso3: "NOR", year: 2009, pisaScoreAvg: 486, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 88, patentsPerMillion: 325, povertyRatePercent: 7.5, crimeRatePer100k: 0.6, co2PerCapitaTons: 7 },
  { jurisdictionIso3: "NOR", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 6.2, preventableDeathsPer100k: 86, patentsPerMillion: 327, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 6.9 },
  { jurisdictionIso3: "NOR", year: 2012, pisaScoreAvg: 485, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 84, patentsPerMillion: 333, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 6.7 },
  { jurisdictionIso3: "NOR", year: 2015, pisaScoreAvg: 483, overdoseDeathsPer100k: 6.3, preventableDeathsPer100k: 80, patentsPerMillion: 341, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 6.4 },
  { jurisdictionIso3: "NOR", year: 2018, pisaScoreAvg: 482, overdoseDeathsPer100k: 6.4, preventableDeathsPer100k: 75, patentsPerMillion: 349, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 6 },
  { jurisdictionIso3: "NOR", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 73, patentsPerMillion: 355, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 5.8 },
  { jurisdictionIso3: "NOR", year: 2022, pisaScoreAvg: 480, overdoseDeathsPer100k: 6.5, preventableDeathsPer100k: 70, patentsPerMillion: 360, povertyRatePercent: 7.5, crimeRatePer100k: 0.5, co2PerCapitaTons: 5.6 },

  // DNK
  { jurisdictionIso3: "DNK", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 112, patentsPerMillion: 627, povertyRatePercent: 6, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "DNK", year: 2006, pisaScoreAvg: 497, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 110, patentsPerMillion: 633, povertyRatePercent: 6, crimeRatePer100k: 0.9, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "DNK", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 109, patentsPerMillion: 638, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.1 },
  { jurisdictionIso3: "DNK", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 107, patentsPerMillion: 644, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "DNK", year: 2009, pisaScoreAvg: 496, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 105, patentsPerMillion: 649, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "DNK", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 104, patentsPerMillion: 655, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.8 },
  { jurisdictionIso3: "DNK", year: 2012, pisaScoreAvg: 495, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 100, patentsPerMillion: 665, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "DNK", year: 2015, pisaScoreAvg: 493, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 95, patentsPerMillion: 682, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "DNK", year: 2018, pisaScoreAvg: 492, overdoseDeathsPer100k: 5.4, preventableDeathsPer100k: 91, patentsPerMillion: 698, povertyRatePercent: 6, crimeRatePer100k: 0.8, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "DNK", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 87, patentsPerMillion: 709, povertyRatePercent: 6, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "DNK", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 84, patentsPerMillion: 720, povertyRatePercent: 6, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.3 },

  // FIN
  { jurisdictionIso3: "FIN", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 121, patentsPerMillion: 732, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 9.3 },
  { jurisdictionIso3: "FIN", year: 2006, pisaScoreAvg: 532, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 119, patentsPerMillion: 738, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 9.2 },
  { jurisdictionIso3: "FIN", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 118, patentsPerMillion: 745, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 9 },
  { jurisdictionIso3: "FIN", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 116, patentsPerMillion: 751, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.9 },
  { jurisdictionIso3: "FIN", year: 2009, pisaScoreAvg: 528, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 114, patentsPerMillion: 757, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.8 },
  { jurisdictionIso3: "FIN", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 112, patentsPerMillion: 764, povertyRatePercent: 6.5, crimeRatePer100k: 1.4, co2PerCapitaTons: 8.6 },
  { jurisdictionIso3: "FIN", year: 2012, pisaScoreAvg: 524, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 109, patentsPerMillion: 776, povertyRatePercent: 6.5, crimeRatePer100k: 1.3, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "FIN", year: 2015, pisaScoreAvg: 520, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 103, patentsPerMillion: 795, povertyRatePercent: 6.5, crimeRatePer100k: 1.3, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "FIN", year: 2018, pisaScoreAvg: 515, overdoseDeathsPer100k: 5.4, preventableDeathsPer100k: 98, patentsPerMillion: 815, povertyRatePercent: 6.5, crimeRatePer100k: 1.3, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "FIN", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 95, patentsPerMillion: 827, povertyRatePercent: 6.5, crimeRatePer100k: 1.2, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "FIN", year: 2022, pisaScoreAvg: 510, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 91, patentsPerMillion: 840, povertyRatePercent: 6.5, crimeRatePer100k: 1.2, co2PerCapitaTons: 7 },

  // AUT
  { jurisdictionIso3: "AUT", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 121, patentsPerMillion: 627, povertyRatePercent: 9, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "AUT", year: 2006, pisaScoreAvg: 487, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 119, patentsPerMillion: 633, povertyRatePercent: 9, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.8 },
  { jurisdictionIso3: "AUT", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 118, patentsPerMillion: 638, povertyRatePercent: 9, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.7 },
  { jurisdictionIso3: "AUT", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 116, patentsPerMillion: 644, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.6 },
  { jurisdictionIso3: "AUT", year: 2009, pisaScoreAvg: 486, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 114, patentsPerMillion: 649, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "AUT", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 112, patentsPerMillion: 655, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "AUT", year: 2012, pisaScoreAvg: 485, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 109, patentsPerMillion: 665, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.1 },
  { jurisdictionIso3: "AUT", year: 2015, pisaScoreAvg: 483, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 103, patentsPerMillion: 682, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "AUT", year: 2018, pisaScoreAvg: 482, overdoseDeathsPer100k: 3.4, preventableDeathsPer100k: 98, patentsPerMillion: 698, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.4 },
  { jurisdictionIso3: "AUT", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 95, patentsPerMillion: 709, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.2 },
  { jurisdictionIso3: "AUT", year: 2022, pisaScoreAvg: 480, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 91, patentsPerMillion: 720, povertyRatePercent: 9, crimeRatePer100k: 0.6, co2PerCapitaTons: 5.9 },

  // CHE
  { jurisdictionIso3: "CHE", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 84, patentsPerMillion: 1568, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.7 },
  { jurisdictionIso3: "CHE", year: 2006, pisaScoreAvg: 507, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 83, patentsPerMillion: 1582, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.6 },
  { jurisdictionIso3: "CHE", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 81, patentsPerMillion: 1595, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.5 },
  { jurisdictionIso3: "CHE", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 80, patentsPerMillion: 1609, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.5 },
  { jurisdictionIso3: "CHE", year: 2009, pisaScoreAvg: 506, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 79, patentsPerMillion: 1623, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.4 },
  { jurisdictionIso3: "CHE", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 78, patentsPerMillion: 1636, povertyRatePercent: 9, crimeRatePer100k: 0.5, co2PerCapitaTons: 4.3 },
  { jurisdictionIso3: "CHE", year: 2012, pisaScoreAvg: 505, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 75, patentsPerMillion: 1664, povertyRatePercent: 9, crimeRatePer100k: 0.4, co2PerCapitaTons: 4.2 },
  { jurisdictionIso3: "CHE", year: 2015, pisaScoreAvg: 503, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 72, patentsPerMillion: 1705, povertyRatePercent: 9, crimeRatePer100k: 0.4, co2PerCapitaTons: 4 },
  { jurisdictionIso3: "CHE", year: 2018, pisaScoreAvg: 502, overdoseDeathsPer100k: 3.4, preventableDeathsPer100k: 68, patentsPerMillion: 1745, povertyRatePercent: 9, crimeRatePer100k: 0.4, co2PerCapitaTons: 3.8 },
  { jurisdictionIso3: "CHE", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 65, patentsPerMillion: 1773, povertyRatePercent: 9, crimeRatePer100k: 0.4, co2PerCapitaTons: 3.6 },
  { jurisdictionIso3: "CHE", year: 2022, pisaScoreAvg: 500, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 63, patentsPerMillion: 1800, povertyRatePercent: 9, crimeRatePer100k: 0.4, co2PerCapitaTons: 3.5 },

  // ESP
  { jurisdictionIso3: "ESP", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 112, patentsPerMillion: 105, povertyRatePercent: 14, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "ESP", year: 2006, pisaScoreAvg: 477, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 110, patentsPerMillion: 105, povertyRatePercent: 14, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.4 },
  { jurisdictionIso3: "ESP", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 109, patentsPerMillion: 106, povertyRatePercent: 14, crimeRatePer100k: 0.7, co2PerCapitaTons: 6.3 },
  { jurisdictionIso3: "ESP", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 107, patentsPerMillion: 107, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.2 },
  { jurisdictionIso3: "ESP", year: 2009, pisaScoreAvg: 476, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 105, patentsPerMillion: 108, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 6.1 },
  { jurisdictionIso3: "ESP", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 104, patentsPerMillion: 109, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 6 },
  { jurisdictionIso3: "ESP", year: 2012, pisaScoreAvg: 475, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 100, patentsPerMillion: 111, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 5.9 },
  { jurisdictionIso3: "ESP", year: 2015, pisaScoreAvg: 473, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 95, patentsPerMillion: 114, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 5.6 },
  { jurisdictionIso3: "ESP", year: 2018, pisaScoreAvg: 472, overdoseDeathsPer100k: 1.9, preventableDeathsPer100k: 91, patentsPerMillion: 116, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 5.3 },
  { jurisdictionIso3: "ESP", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 87, patentsPerMillion: 118, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 5.1 },
  { jurisdictionIso3: "ESP", year: 2022, pisaScoreAvg: 470, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 84, patentsPerMillion: 120, povertyRatePercent: 14, crimeRatePer100k: 0.6, co2PerCapitaTons: 4.9 },

  // PRT
  { jurisdictionIso3: "PRT", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 140, patentsPerMillion: 52, povertyRatePercent: 16, crimeRatePer100k: 1, co2PerCapitaTons: 5.1 },
  { jurisdictionIso3: "PRT", year: 2006, pisaScoreAvg: 467, overdoseDeathsPer100k: 1.1, preventableDeathsPer100k: 138, patentsPerMillion: 53, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 5 },
  { jurisdictionIso3: "PRT", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 136, patentsPerMillion: 53, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 5 },
  { jurisdictionIso3: "PRT", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 134, patentsPerMillion: 54, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.9 },
  { jurisdictionIso3: "PRT", year: 2009, pisaScoreAvg: 466, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 132, patentsPerMillion: 54, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.8 },
  { jurisdictionIso3: "PRT", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.2, preventableDeathsPer100k: 130, patentsPerMillion: 55, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.8 },
  { jurisdictionIso3: "PRT", year: 2012, pisaScoreAvg: 465, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 125, patentsPerMillion: 55, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.6 },
  { jurisdictionIso3: "PRT", year: 2015, pisaScoreAvg: 463, overdoseDeathsPer100k: 1.3, preventableDeathsPer100k: 119, patentsPerMillion: 57, povertyRatePercent: 16, crimeRatePer100k: 0.9, co2PerCapitaTons: 4.4 },
  { jurisdictionIso3: "PRT", year: 2018, pisaScoreAvg: 462, overdoseDeathsPer100k: 1.4, preventableDeathsPer100k: 113, patentsPerMillion: 58, povertyRatePercent: 16, crimeRatePer100k: 0.8, co2PerCapitaTons: 4.1 },
  { jurisdictionIso3: "PRT", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 109, patentsPerMillion: 59, povertyRatePercent: 16, crimeRatePer100k: 0.8, co2PerCapitaTons: 4 },
  { jurisdictionIso3: "PRT", year: 2022, pisaScoreAvg: 460, overdoseDeathsPer100k: 1.5, preventableDeathsPer100k: 105, patentsPerMillion: 60, povertyRatePercent: 16, crimeRatePer100k: 0.8, co2PerCapitaTons: 3.8 },

  // IRL
  { jurisdictionIso3: "IRL", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 130, patentsPerMillion: 209, povertyRatePercent: 9, crimeRatePer100k: 0.9, co2PerCapitaTons: 9.3 },
  { jurisdictionIso3: "IRL", year: 2006, pisaScoreAvg: 497, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 129, patentsPerMillion: 211, povertyRatePercent: 9, crimeRatePer100k: 0.9, co2PerCapitaTons: 9.2 },
  { jurisdictionIso3: "IRL", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 127, patentsPerMillion: 213, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 9 },
  { jurisdictionIso3: "IRL", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 125, patentsPerMillion: 215, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.9 },
  { jurisdictionIso3: "IRL", year: 2009, pisaScoreAvg: 496, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 123, patentsPerMillion: 216, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.8 },
  { jurisdictionIso3: "IRL", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 121, patentsPerMillion: 218, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.6 },
  { jurisdictionIso3: "IRL", year: 2012, pisaScoreAvg: 495, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 117, patentsPerMillion: 222, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "IRL", year: 2015, pisaScoreAvg: 493, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 111, patentsPerMillion: 227, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "IRL", year: 2018, pisaScoreAvg: 492, overdoseDeathsPer100k: 5.4, preventableDeathsPer100k: 106, patentsPerMillion: 233, povertyRatePercent: 9, crimeRatePer100k: 0.8, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "IRL", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 102, patentsPerMillion: 236, povertyRatePercent: 9, crimeRatePer100k: 0.7, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "IRL", year: 2022, pisaScoreAvg: 490, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 98, patentsPerMillion: 240, povertyRatePercent: 9, crimeRatePer100k: 0.7, co2PerCapitaTons: 7 },

  // NZL
  { jurisdictionIso3: "NZL", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 121, patentsPerMillion: 157, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "NZL", year: 2006, pisaScoreAvg: 507, overdoseDeathsPer100k: 5.1, preventableDeathsPer100k: 119, patentsPerMillion: 158, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 7.3 },
  { jurisdictionIso3: "NZL", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 118, patentsPerMillion: 160, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "NZL", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 116, patentsPerMillion: 161, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 7.1 },
  { jurisdictionIso3: "NZL", year: 2009, pisaScoreAvg: 506, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 114, patentsPerMillion: 162, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 7 },
  { jurisdictionIso3: "NZL", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 5.2, preventableDeathsPer100k: 112, patentsPerMillion: 164, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 6.9 },
  { jurisdictionIso3: "NZL", year: 2012, pisaScoreAvg: 505, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 109, patentsPerMillion: 166, povertyRatePercent: 11, crimeRatePer100k: 1.1, co2PerCapitaTons: 6.7 },
  { jurisdictionIso3: "NZL", year: 2015, pisaScoreAvg: 503, overdoseDeathsPer100k: 5.3, preventableDeathsPer100k: 103, patentsPerMillion: 170, povertyRatePercent: 11, crimeRatePer100k: 1, co2PerCapitaTons: 6.4 },
  { jurisdictionIso3: "NZL", year: 2018, pisaScoreAvg: 502, overdoseDeathsPer100k: 5.4, preventableDeathsPer100k: 98, patentsPerMillion: 175, povertyRatePercent: 11, crimeRatePer100k: 1, co2PerCapitaTons: 6 },
  { jurisdictionIso3: "NZL", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 95, patentsPerMillion: 177, povertyRatePercent: 11, crimeRatePer100k: 1, co2PerCapitaTons: 5.8 },
  { jurisdictionIso3: "NZL", year: 2022, pisaScoreAvg: 500, overdoseDeathsPer100k: 5.5, preventableDeathsPer100k: 91, patentsPerMillion: 180, povertyRatePercent: 11, crimeRatePer100k: 1, co2PerCapitaTons: 5.6 },

  // KOR
  { jurisdictionIso3: "KOR", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 0.3, preventableDeathsPer100k: 93, patentsPerMillion: 2329, povertyRatePercent: 16, crimeRatePer100k: 0.8, co2PerCapitaTons: 10.3 },
  { jurisdictionIso3: "KOR", year: 2006, pisaScoreAvg: 527, overdoseDeathsPer100k: 0.3, preventableDeathsPer100k: 92, patentsPerMillion: 2397, povertyRatePercent: 16, crimeRatePer100k: 0.8, co2PerCapitaTons: 10.1 },
  { jurisdictionIso3: "KOR", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 0.4, preventableDeathsPer100k: 90, patentsPerMillion: 2466, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.9 },
  { jurisdictionIso3: "KOR", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 0.4, preventableDeathsPer100k: 89, patentsPerMillion: 2536, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.8 },
  { jurisdictionIso3: "KOR", year: 2009, pisaScoreAvg: 526, overdoseDeathsPer100k: 0.4, preventableDeathsPer100k: 88, patentsPerMillion: 2606, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.7 },
  { jurisdictionIso3: "KOR", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 0.4, preventableDeathsPer100k: 86, patentsPerMillion: 2678, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.5 },
  { jurisdictionIso3: "KOR", year: 2012, pisaScoreAvg: 525, overdoseDeathsPer100k: 0.5, preventableDeathsPer100k: 84, patentsPerMillion: 2823, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.2 },
  { jurisdictionIso3: "KOR", year: 2015, pisaScoreAvg: 523, overdoseDeathsPer100k: 0.5, preventableDeathsPer100k: 80, patentsPerMillion: 3048, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 8.8 },
  { jurisdictionIso3: "KOR", year: 2018, pisaScoreAvg: 522, overdoseDeathsPer100k: 0.6, preventableDeathsPer100k: 75, patentsPerMillion: 3279, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "KOR", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 73, patentsPerMillion: 3438, povertyRatePercent: 16, crimeRatePer100k: 0.7, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "KOR", year: 2022, pisaScoreAvg: 520, overdoseDeathsPer100k: 0.7, preventableDeathsPer100k: 70, patentsPerMillion: 3600, povertyRatePercent: 16, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.7 },

  // ISR
  { jurisdictionIso3: "ISR", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 103, patentsPerMillion: 627, povertyRatePercent: 18, crimeRatePer100k: 1.7, co2PerCapitaTons: 8.4 },
  { jurisdictionIso3: "ISR", year: 2006, pisaScoreAvg: 467, overdoseDeathsPer100k: 3.1, preventableDeathsPer100k: 101, patentsPerMillion: 633, povertyRatePercent: 18, crimeRatePer100k: 1.7, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "ISR", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 100, patentsPerMillion: 638, povertyRatePercent: 18, crimeRatePer100k: 1.7, co2PerCapitaTons: 8.1 },
  { jurisdictionIso3: "ISR", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 98, patentsPerMillion: 644, povertyRatePercent: 18, crimeRatePer100k: 1.7, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "ISR", year: 2009, pisaScoreAvg: 466, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 97, patentsPerMillion: 649, povertyRatePercent: 18, crimeRatePer100k: 1.7, co2PerCapitaTons: 7.9 },
  { jurisdictionIso3: "ISR", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 3.2, preventableDeathsPer100k: 95, patentsPerMillion: 655, povertyRatePercent: 18, crimeRatePer100k: 1.6, co2PerCapitaTons: 7.8 },
  { jurisdictionIso3: "ISR", year: 2012, pisaScoreAvg: 465, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 92, patentsPerMillion: 665, povertyRatePercent: 18, crimeRatePer100k: 1.6, co2PerCapitaTons: 7.5 },
  { jurisdictionIso3: "ISR", year: 2015, pisaScoreAvg: 463, overdoseDeathsPer100k: 3.3, preventableDeathsPer100k: 88, patentsPerMillion: 682, povertyRatePercent: 18, crimeRatePer100k: 1.6, co2PerCapitaTons: 7.2 },
  { jurisdictionIso3: "ISR", year: 2018, pisaScoreAvg: 462, overdoseDeathsPer100k: 3.4, preventableDeathsPer100k: 83, patentsPerMillion: 698, povertyRatePercent: 18, crimeRatePer100k: 1.5, co2PerCapitaTons: 6.8 },
  { jurisdictionIso3: "ISR", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 80, patentsPerMillion: 709, povertyRatePercent: 18, crimeRatePer100k: 1.5, co2PerCapitaTons: 6.5 },
  { jurisdictionIso3: "ISR", year: 2022, pisaScoreAvg: 460, overdoseDeathsPer100k: 3.5, preventableDeathsPer100k: 77, patentsPerMillion: 720, povertyRatePercent: 18, crimeRatePer100k: 1.4, co2PerCapitaTons: 6.3 },

  // CZE
  { jurisdictionIso3: "CZE", year: 2005, pisaScoreAvg: null, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 168, patentsPerMillion: 105, povertyRatePercent: 10, crimeRatePer100k: 0.8, co2PerCapitaTons: 10.3 },
  { jurisdictionIso3: "CZE", year: 2006, pisaScoreAvg: 487, overdoseDeathsPer100k: 1.6, preventableDeathsPer100k: 165, patentsPerMillion: 105, povertyRatePercent: 10, crimeRatePer100k: 0.8, co2PerCapitaTons: 10.1 },
  { jurisdictionIso3: "CZE", year: 2007, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 163, patentsPerMillion: 106, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.9 },
  { jurisdictionIso3: "CZE", year: 2008, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 160, patentsPerMillion: 107, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.8 },
  { jurisdictionIso3: "CZE", year: 2009, pisaScoreAvg: 486, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 158, patentsPerMillion: 108, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.7 },
  { jurisdictionIso3: "CZE", year: 2010, pisaScoreAvg: null, overdoseDeathsPer100k: 1.7, preventableDeathsPer100k: 155, patentsPerMillion: 109, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.5 },
  { jurisdictionIso3: "CZE", year: 2012, pisaScoreAvg: 485, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 151, patentsPerMillion: 111, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 9.2 },
  { jurisdictionIso3: "CZE", year: 2015, pisaScoreAvg: 483, overdoseDeathsPer100k: 1.8, preventableDeathsPer100k: 143, patentsPerMillion: 114, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 8.8 },
  { jurisdictionIso3: "CZE", year: 2018, pisaScoreAvg: 482, overdoseDeathsPer100k: 1.9, preventableDeathsPer100k: 136, patentsPerMillion: 116, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 8.3 },
  { jurisdictionIso3: "CZE", year: 2020, pisaScoreAvg: null, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 131, patentsPerMillion: 118, povertyRatePercent: 10, crimeRatePer100k: 0.7, co2PerCapitaTons: 8 },
  { jurisdictionIso3: "CZE", year: 2022, pisaScoreAvg: 480, overdoseDeathsPer100k: 2, preventableDeathsPer100k: 126, patentsPerMillion: 120, povertyRatePercent: 10, crimeRatePer100k: 0.6, co2PerCapitaTons: 7.7 },

];
