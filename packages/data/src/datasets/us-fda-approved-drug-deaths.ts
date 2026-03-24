/**
 * Deaths from FDA-APPROVED drugs — the drugs that PASSED the 8.2-year review process.
 * Shows that the efficacy review doesn't even prevent the harms it claims to prevent.
 */

import type { TimePoint } from "./agency-performance.js";

export interface FDAApprovedDrugDisaster {
  drug: string;
  manufacturer: string;
  yearApproved: number;
  yearWithdrawnOrWarning: number;
  yearsOnMarket: number;
  deathsOrHarm: string;
  /** Numeric estimate for charting — deaths directly attributable */
  estimatedDeaths: number;
  /** Numeric estimate for charting — injuries/adverse events */
  estimatedInjured: number;
  /** Total fines and settlements in USD */
  fineAmount: number;
  /** Total revenue while drug was on market in USD */
  revenueWhileOnMarket: number;
  whatFDAKnew: string;
  fine: string;
  jailTime: string;
  source: string;
  sourceUrl: string;
}

export const FDA_APPROVED_DRUG_DISASTERS: FDAApprovedDrugDisaster[] = [
  {
    drug: "Vioxx (rofecoxib)",
    manufacturer: "Merck",
    yearApproved: 1999,
    yearWithdrawnOrWarning: 2004,
    yearsOnMarket: 5,
    deathsOrHarm: "88,000-140,000 heart attacks. 27,785-55,000 deaths. Merck's own study showed doubled cardiac risk.",
    estimatedDeaths: 55000,
    estimatedInjured: 140000,
    fineAmount: 4_850_000_000,
    revenueWhileOnMarket: 11_000_000_000,
    whatFDAKnew: "FDA reviewer David Graham estimated the deaths but was pressured to soften findings. FDA advisory committee voted to keep it on market even after deaths were known.",
    fine: "$4.85B settlement (2007). Less than one year of Vioxx revenue.",
    jailTime: "Zero",
    source: "Lancet / FDA Safety Review / Senate Finance Committee Investigation",
    sourceUrl: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(04)17339-0/fulltext",
  },
  {
    drug: "OxyContin (oxycodone)",
    manufacturer: "Purdue Pharma",
    yearApproved: 1995,
    yearWithdrawnOrWarning: 2007,
    yearsOnMarket: 12,
    deathsOrHarm: "500,000+ overdose deaths from opioids (1999-2024). OxyContin was marketed as 'virtually non-addictive.' Purdue's internal documents showed they knew this was false.",
    estimatedDeaths: 500000,
    estimatedInjured: 2000000,
    fineAmount: 8_300_000_000,
    revenueWhileOnMarket: 35_000_000_000,
    whatFDAKnew: "FDA approved the misleading 'less addictive' label. The FDA reviewer who approved OxyContin later took a $400K/yr job at Purdue Pharma.",
    fine: "$634M criminal fine (2007), then $8.3B in 2020 bankruptcy settlement. The family extracted $10.8B from the company before bankruptcy.",
    jailTime: "Zero for the family. Three executives pleaded guilty to misdemeanor 'misbranding' in 2007.",
    source: "DOJ / Senate HELP Committee Investigation / ProPublica",
    sourceUrl: "https://www.justice.gov/archive/opa/pr/2007/May/07_civ_388.html",
  },
  {
    drug: "Avandia (rosiglitazone)",
    manufacturer: "GlaxoSmithKline",
    yearApproved: 1999,
    yearWithdrawnOrWarning: 2010,
    yearsOnMarket: 11,
    deathsOrHarm: "83,000 heart attacks, thousands of deaths. GSK's own analysis showed 43% increased risk of heart attack.",
    estimatedDeaths: 5000,
    estimatedInjured: 83000,
    fineAmount: 3_000_000_000,
    revenueWhileOnMarket: 25_000_000_000,
    whatFDAKnew: "FDA had data showing cardiac risk by 2003. Delayed action for 7 years. Internal FDA emails showed disagreement about whether to act.",
    fine: "$3B settlement (2012) \u2014 largest healthcare fraud settlement in history at the time.",
    jailTime: "Zero",
    source: "NEJM / Senate Finance Committee Avandia Investigation",
    sourceUrl: "https://www.nejm.org/doi/full/10.1056/nejmoa072761",
  },
  {
    drug: "Fen-Phen (fenfluramine/phentermine)",
    manufacturer: "Wyeth (now Pfizer)",
    yearApproved: 1973,
    yearWithdrawnOrWarning: 1997,
    yearsOnMarket: 24,
    deathsOrHarm: "Heart valve damage in 30% of users. Hundreds of deaths from primary pulmonary hypertension.",
    estimatedDeaths: 300,
    estimatedInjured: 1800000,
    fineAmount: 21_000_000_000,
    revenueWhileOnMarket: 10_000_000_000,
    whatFDAKnew: "Approved for weight loss despite cardiac concerns. Took 24 years and hundreds of deaths to withdraw.",
    fine: "$21B in settlements \u2014 largest pharmaceutical settlement in history.",
    jailTime: "Zero",
    source: "FDA Drug Safety Communication / Wyeth Settlement Records",
    sourceUrl: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-updated-information-about-fenfluramine",
  },
  {
    drug: "Thalidomide (historical comparison)",
    manufacturer: "Gr\u00FCnenthal",
    yearApproved: 0,
    yearWithdrawnOrWarning: 1962,
    yearsOnMarket: 0,
    estimatedDeaths: 2000,
    estimatedInjured: 10000,
    fineAmount: 0,
    revenueWhileOnMarket: 0,
    deathsOrHarm: "10,000+ babies born with severe birth defects worldwide. NOT approved in the US \u2014 blocked by FDA reviewer Frances Kelsey under the 1938 safety law (NOT the 1962 efficacy amendment).",
    whatFDAKnew: "This is the case the FDA uses to justify the 1962 efficacy amendment. But Thalidomide was blocked by the SAFETY review (1938 law), not the EFFICACY review (1962 law). The efficacy amendment solved a problem that didn't exist.",
    fine: "N/A \u2014 different country",
    jailTime: "N/A",
    source: "FDA History \u2014 Thalidomide",
    sourceUrl: "https://www.fda.gov/about-fda/histories-product-regulation/frances-oldham-kelsey-medical-reviewer-famous-averting-public-health-tragedy",
  },
  {
    drug: "Zantac (ranitidine)",
    manufacturer: "Multiple (Sanofi, GSK, others)",
    yearApproved: 1983,
    yearWithdrawnOrWarning: 2020,
    yearsOnMarket: 37,
    deathsOrHarm: "Contains NDMA, a probable carcinogen. Taken by millions for decades. Cancer risk still being assessed. 37 years on market before withdrawal.",
    estimatedDeaths: 0,
    estimatedInjured: 0,
    fineAmount: 0,
    revenueWhileOnMarket: 100_000_000_000,
    whatFDAKnew: "NDMA contamination discovered by independent testing, not FDA surveillance.",
    fine: "Ongoing litigation \u2014 billions in claims",
    jailTime: "Zero",
    source: "FDA Drug Safety Communication 2020",
    sourceUrl: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-updates-and-press-announcements-ndma-zantac-ranitidine",
  },
  {
    drug: "Bextra (valdecoxib)",
    manufacturer: "Pfizer",
    yearApproved: 2001,
    yearWithdrawnOrWarning: 2005,
    yearsOnMarket: 4,
    deathsOrHarm: "Stevens-Johnson syndrome, heart attacks. Withdrawn after FDA found risk of life-threatening skin reactions and cardiovascular events.",
    estimatedDeaths: 100,
    estimatedInjured: 5000,
    fineAmount: 2_300_000_000,
    revenueWhileOnMarket: 5_000_000_000,
    whatFDAKnew: "FDA's own advisory committee voted to keep it on market before public outcry forced withdrawal.",
    fine: "$2.3B settlement (2009) \u2014 Pfizer also illegally promoted it for unapproved uses.",
    jailTime: "Zero",
    source: "DOJ / FDA Safety Communication",
    sourceUrl: "https://www.justice.gov/opa/pr/justice-department-announces-largest-health-care-fraud-settlement-its-history",
  },
];

/** Total fines vs total deaths — the cost of a life */
export const FDA_DRUG_DISASTER_SUMMARY = {
  totalEstimatedDeaths: "600,000+ from Vioxx, OxyContin, Avandia, Fen-Phen combined",
  totalFinesPaid: FDA_APPROVED_DRUG_DISASTERS.reduce((sum, d) => sum + d.fineAmount, 0),
  costPerDeathToCompany: 65_000,  // $39B / 600K = ~$65K per death
  executivesJailed: 0,
  note: "These drugs PASSED the 8.2-year FDA efficacy review that has killed 102M by delaying access to safe drugs. The review process kills more people through delay than it saves through rejection.",
  source: "DOJ settlements, Lancet, NEJM",
  sourceUrl: "https://www.justice.gov/civil/pages/attachments/2019/02/04/pharmaceutical_cases.pdf",
};
