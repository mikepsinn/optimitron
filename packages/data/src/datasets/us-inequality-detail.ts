/**
 * Inequality metrics in the United States — the structural wealth transfer
 * from workers to shareholders, renters to landlords, patients to insurers.
 */

import type { TimePoint } from "./agency-performance";

/** CEO-to-worker compensation ratio */
export const CEO_TO_WORKER_RATIO: TimePoint[] = [
  { year: 1965, value: 20, annotation: "CEO earned 20x the average worker" },
  { year: 1970, value: 24 },
  { year: 1978, value: 31, annotation: "Revenue Act creates 401(k) — pensions begin dying" },
  { year: 1980, value: 33 },
  { year: 1985, value: 51 },
  { year: 1990, value: 77 },
  { year: 1995, value: 122, annotation: "Stock options become primary CEO compensation" },
  { year: 2000, value: 366, annotation: "Dot-com peak. CEO of Yahoo earned $600M in one year." },
  { year: 2005, value: 240 },
  { year: 2010, value: 221 },
  { year: 2015, value: 275 },
  { year: 2020, value: 351 },
  { year: 2024, value: 350, annotation: "CEO earns in 1 day what average worker earns in 1 year.", annotationUrl: "https://www.epi.org/publication/ceo-pay-in-2022/" },
];

/** Median home price to median household income ratio */
export const HOME_PRICE_TO_INCOME: TimePoint[] = [
  { year: 1960, value: 2.0 },
  { year: 1970, value: 2.2 },
  { year: 1980, value: 3.0 },
  { year: 1990, value: 3.2 },
  { year: 2000, value: 3.5 },
  { year: 2006, value: 4.6, annotation: "Housing bubble peak" },
  { year: 2010, value: 3.2, annotation: "10M families foreclosed — banks bailed out, homeowners weren't" },
  { year: 2015, value: 3.7 },
  { year: 2020, value: 4.5 },
  { year: 2024, value: 5.5, annotation: "A home now costs 5.5x a family's annual income. In 1960 it was 2x.", annotationUrl: "https://fred.stlouisfed.org/series/MSPUS" },
];

/** Total student loan debt (trillions USD) */
export const STUDENT_LOAN_DEBT: TimePoint[] = [
  { year: 2003, value: 0.24 },
  { year: 2005, value: 0.38 },
  { year: 2007, value: 0.55 },
  { year: 2009, value: 0.76 },
  { year: 2010, value: 0.85, annotation: "Student debt surpasses credit card debt for the first time" },
  { year: 2012, value: 1.00, annotation: "Crosses $1 trillion" },
  { year: 2014, value: 1.16 },
  { year: 2016, value: 1.31 },
  { year: 2018, value: 1.46 },
  { year: 2020, value: 1.57 },
  { year: 2022, value: 1.75 },
  { year: 2024, value: 1.77, annotation: "$1.77T owed by 44M borrowers. Average balance: $37,850. Unlike every other debt, cannot be discharged in bankruptcy.", annotationUrl: "https://fred.stlouisfed.org/series/SLOAS" },
];

/** Rent-burdened households (paying >30% of income on rent) */
export const RENT_BURDENED_HOUSEHOLDS: TimePoint[] = [
  { year: 2000, value: 38 },
  { year: 2005, value: 42 },
  { year: 2010, value: 48, annotation: "Post-foreclosure crisis — former homeowners become renters, driving up demand" },
  { year: 2015, value: 47 },
  { year: 2020, value: 46 },
  { year: 2022, value: 50, annotation: "Half of all US renters are rent-burdened. 12M pay >50%.", annotationUrl: "https://www.jchs.harvard.edu/americas-rental-housing-2024" },
  { year: 2024, value: 50 },
];

/** Medical bankruptcies as % of all personal bankruptcies */
export const MEDICAL_BANKRUPTCY_PCT: TimePoint[] = [
  { year: 2001, value: 46 },
  { year: 2007, value: 62, annotation: "62% of all bankruptcies are medical — even for people WITH insurance", annotationUrl: "https://ajph.aphapublications.org/doi/10.2105/AJPH.2018.304901" },
  { year: 2013, value: 57 },
  { year: 2019, value: 66.5, annotation: "530K families per year bankrupted by medical bills. The US is the only developed country where this happens." },
];

/** Vacant housing units vs homeless population */
export interface VacantVsHomeless {
  year: number;
  vacantUnits: number;
  homelessPopulation: number;
  ratio: number;  // vacant per homeless person
  annotation?: string;
}

export const VACANT_VS_HOMELESS: VacantVsHomeless[] = [
  { year: 2010, vacantUnits: 18_700_000, homelessPopulation: 637_077, ratio: 29 },
  { year: 2015, vacantUnits: 17_000_000, homelessPopulation: 564_708, ratio: 30 },
  { year: 2020, vacantUnits: 16_400_000, homelessPopulation: 580_466, ratio: 28, annotation: "28 empty homes for every homeless person" },
  { year: 2023, vacantUnits: 15_100_000, homelessPopulation: 653_104, ratio: 23, annotation: "Record homelessness (653K) despite 15M vacant units. 23 empty homes per homeless person." },
];
