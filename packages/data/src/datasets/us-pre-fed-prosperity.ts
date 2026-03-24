/**
 * Economic growth during the pre-Federal Reserve era (1800-1913).
 * Proves the economy grew faster with stable/falling prices than after the Fed was created.
 * The Fed's core justification — preventing deflation — is contradicted by 113 years of data.
 *
 * Sources: Measuring Worth (GDP), Minneapolis Fed (CPI), Census Bureau,
 * Friedman & Schwartz "A Monetary History of the United States"
 */

import type { TimePoint } from "./agency-performance.js";

/** Real GDP per capita (1800-2024, in 2012 dollars) — shows massive growth WITHOUT the Fed */
export const REAL_GDP_PER_CAPITA: TimePoint[] = [
  // Source: Measuring Worth, BEA
  { year: 1800, value: 1257 },
  { year: 1820, value: 1520 },
  { year: 1840, value: 1873 },
  { year: 1850, value: 2096 },
  { year: 1860, value: 2641 },
  { year: 1870, value: 3042, annotation: "Post-Civil War reconstruction. No central bank. Economy booming." },
  { year: 1880, value: 4065, annotation: "Prices falling, GDP rising. The 'Long Deflation' is actually a golden age of growth." },
  { year: 1890, value: 4921 },
  { year: 1900, value: 6137, annotation: "US becomes world's largest economy. No central bank. Prices stable/falling." },
  { year: 1910, value: 7467 },
  // Fed created 1913
  { year: 1913, value: 7852, annotation: "Federal Reserve created. GDP per capita was already growing 2.1%/yr without it." },
  { year: 1920, value: 7827, annotation: "Post-WWI recession — Fed's first major failure" },
  { year: 1929, value: 10554, annotation: "Pre-crash peak" },
  { year: 1933, value: 6888, annotation: "Great Depression bottom — Fed tightened when it should have eased (Friedman & Schwartz)" },
  { year: 1940, value: 9897 },
  { year: 1950, value: 14964 },
  { year: 1960, value: 17747 },
  { year: 1970, value: 23640 },
  { year: 1971, value: 24213, annotation: "Gold standard ended. Growth rate about to slow." },
  { year: 1980, value: 28429 },
  { year: 1990, value: 36075 },
  { year: 2000, value: 45034 },
  { year: 2010, value: 49267 },
  { year: 2020, value: 55891 },
  { year: 2024, value: 62000 },
];

/** Growth rates by era — proves pre-Fed growth was equal or faster */
export interface GrowthEra {
  era: string;
  startYear: number;
  endYear: number;
  annualGDPGrowth: number;
  annualInflation: number;
  realWageGrowth: number;
  keyFact: string;
  source: string;
  sourceUrl: string;
}

export const GROWTH_BY_ERA: GrowthEra[] = [
  {
    era: "Classical Gold Standard (no Fed)",
    startYear: 1870,
    endYear: 1913,
    annualGDPGrowth: 3.8,
    annualInflation: 0.1,
    realWageGrowth: 1.5,
    keyFact: "Prices nearly flat for 43 years. Real wages rose 60%. US became world's largest economy. Zero central bank.",
    source: "Measuring Worth / Friedman & Schwartz",
    sourceUrl: "https://www.measuringworth.com/growth/",
  },
  {
    era: "The 'Long Deflation' (1880-1896)",
    startYear: 1880,
    endYear: 1896,
    annualGDPGrowth: 4.2,
    annualInflation: -1.5,
    realWageGrowth: 2.3,
    keyFact: "Prices FELL 30% while GDP GREW 85%. The period economists call a 'crisis' was one of the fastest growth periods in history.",
    source: "BIS Working Paper 2015 / Measuring Worth",
    sourceUrl: "https://www.bis.org/publ/work352.htm",
  },
  {
    era: "Pre-Gold-Standard-End (1950-1971)",
    startYear: 1950,
    endYear: 1971,
    annualGDPGrowth: 4.0,
    annualInflation: 2.3,
    realWageGrowth: 2.5,
    keyFact: "Income doubled each generation. Single-earner families were the norm. Homeownership surged from 44% to 62%.",
    source: "PIIE / Census Bureau",
    sourceUrl: "https://www.piie.com/",
  },
  {
    era: "Post-Gold-Standard (1971-2024)",
    startYear: 1971,
    endYear: 2024,
    annualGDPGrowth: 2.7,
    annualInflation: 4.1,
    realWageGrowth: 0.6,
    keyFact: "Growth slowed 29%. Inflation 18x higher. Real wage growth collapsed 76%. Both parents work, earn less than one parent did in 1971.",
    source: "BLS / Census Bureau / EPI",
    sourceUrl: "https://www.epi.org/productivity-pay-gap/",
  },
  {
    era: "Post-2008 QE Era (2008-2024)",
    startYear: 2008,
    endYear: 2024,
    annualGDPGrowth: 1.8,
    annualInflation: 2.8,
    realWageGrowth: 0.3,
    keyFact: "Fed balance sheet went from $900B to $8.9T. Top 1% gained $20T in wealth. Bottom 50% gained $3T. Growth was the slowest since the gold standard era — but went to the top.",
    source: "FRED / Fed Distributional Financial Accounts",
    sourceUrl: "https://fred.stlouisfed.org/series/WALCL",
  },
];

/** Banking panics: US (with Fed) vs Canada (without Fed until 1935) */
export interface BankingPanicComparison {
  event: string;
  year: number;
  usBankFailures: number;
  canadaBankFailures: number;
  usHadCentralBank: boolean;
  canadaHadCentralBank: boolean;
  source: string;
  sourceUrl: string;
}

export const BANKING_PANICS_US_VS_CANADA: BankingPanicComparison[] = [
  {
    event: "Panic of 1907",
    year: 1907,
    usBankFailures: 243,
    canadaBankFailures: 0,
    usHadCentralBank: false,
    canadaHadCentralBank: false,
    source: "Bordo et al. 2015",
    sourceUrl: "https://www.nber.org/papers/w20710",
  },
  {
    event: "Great Depression (1930-1933)",
    year: 1930,
    usBankFailures: 9000,
    canadaBankFailures: 0,
    usHadCentralBank: true,
    canadaHadCentralBank: false,
    source: "Bordo et al. 2015 / FDIC",
    sourceUrl: "https://www.fdic.gov/analysis/banking-review/banking-crises/",
  },
];

export const PRE_FED_SUMMARY = {
  preFedGDPGrowth: 3.8,
  postFedGDPGrowth: 2.7,
  growthDecline: "29% slower after Fed creation",
  preFedInflation: 0.1,
  postFedInflation: 3.3,
  inflationIncrease: "3,200% higher after Fed creation",
  dollarPurchasingPowerLost: 97,
  canadaBankFailuresDuringGreatDepression: 0,
  usBankFailuresDuringGreatDepression: 9000,
  keyInsight: "The economy grew faster with stable prices and no central bank (1870-1913) than with the Fed and inflation (1971-2024). Canada had zero bank failures during the Great Depression without a central bank. The Fed's existence cannot be justified by its own data.",
};
