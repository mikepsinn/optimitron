/**
 * Healthcare waste in the United States — money spent that doesn't improve health outcomes.
 * The US spends $4.5T/yr on healthcare and gets worse outcomes than countries spending 1/4 as much.
 */

import type { TimePoint } from "./agency-performance";

export interface HealthcareWasteCategory {
  id: string;
  name: string;
  emoji: string;
  annualCost: number;  // USD
  description: string;
  comparison: string;
  source: string;
  sourceUrl: string;
}

export const HEALTHCARE_WASTE_CATEGORIES: HealthcareWasteCategory[] = [
  {
    id: "admin-overhead",
    name: "Administrative Overhead",
    emoji: "📋",
    annualCost: 1_000_000_000_000,
    description: "Billing, coding, prior authorizations, claims processing, credentialing. 25% of all US healthcare spending goes to paperwork. Canada: 10%.",
    comparison: "$1 trillion per year on paperwork. That is more than the entire military budget.",
    source: "JAMA 2019 (Himmelstein et al)",
    sourceUrl: "https://jamanetwork.com/journals/jama/article-abstract/2785479",
  },
  {
    id: "insurance-profits",
    name: "Insurance Company Profits & Overhead",
    emoji: "💰",
    annualCost: 350_000_000_000,
    description: "Private health insurance administrative costs, executive compensation, marketing, shareholder returns. None of this heals anyone.",
    comparison: "UnitedHealth Group CEO earned $20.9M in 2023. The company denied 32% of claims.",
    source: "NAIC Health Insurance Industry Analysis Report",
    sourceUrl: "https://content.naic.org/sites/default/files/publication-hia-lr-industry-analysis-report.pdf",
  },
  {
    id: "drug-pricing-markup",
    name: "Drug Pricing Markup (US vs World)",
    emoji: "💊",
    annualCost: 200_000_000_000,
    description: "Americans pay 2-10x more for the same drugs as every other country. Insulin: US $300, Canada $30. Humira: US $80K, UK $15K.",
    comparison: "$200B per year in excess drug costs. Congress banned Medicare from negotiating prices until 2022.",
    source: "RAND Corporation Drug Price Comparison 2021",
    sourceUrl: "https://www.rand.org/pubs/research_reports/RRA788-1.html",
  },
  {
    id: "pharma-marketing",
    name: "Pharma Marketing (More Than R&D)",
    emoji: "📺",
    annualCost: 30_000_000_000,
    description: "Pharmaceutical companies spend more on marketing ($30B) than on R&D ($28B). The US and New Zealand are the ONLY countries that allow direct-to-consumer drug advertising.",
    comparison: "The industry that claims high prices are needed to fund research spends more money convincing you to ask your doctor about their product.",
    source: "JAMA 2019 / GlobalData Pharma Intelligence",
    sourceUrl: "https://jamanetwork.com/journals/jama/fullarticle/2720029",
  },
  {
    id: "defensive-medicine",
    name: "Defensive Medicine (Unnecessary Tests)",
    emoji: "🔬",
    annualCost: 100_000_000_000,
    description: "Doctors order unnecessary tests and procedures to avoid lawsuits. An estimated $55-200B per year wasted on defensive medicine.",
    comparison: "The fear of being sued costs more than the lawsuits themselves.",
    source: "Mello et al, Health Affairs 2010",
    sourceUrl: "https://www.healthaffairs.org/doi/10.1377/hlthaff.2009.0267",
  },
  {
    id: "er-preventable",
    name: "ER Visits for Preventable Conditions",
    emoji: "🚑",
    annualCost: 32_000_000_000,
    description: "Millions use the ER for conditions that primary care could handle — because they can't afford a doctor or can't get an appointment.",
    comparison: "$32B per year because people don't have a $50 doctor visit.",
    source: "AHRQ Healthcare Cost and Utilization Project",
    sourceUrl: "https://hcup-us.ahrq.gov/",
  },
  {
    id: "fda-user-fees",
    name: "Pharma Funding Its Own Regulator",
    emoji: "🔄",
    annualCost: 1_100_000_000,
    description: "Through PDUFA (Prescription Drug User Fee Act), pharmaceutical companies pay $1.1B per year in 'user fees' to the FDA — funding 65% of the drug review budget. The agency that decides if your drug is safe is funded by the company selling the drug.",
    comparison: "Imagine if restaurant health inspectors were paid by the restaurants. That is the FDA.",
    source: "FDA PDUFA Performance Reports",
    sourceUrl: "https://www.fda.gov/industry/prescription-drug-user-fee-amendments/pdufa-performance",
  },
];

/** Total annual healthcare waste */
export const TOTAL_ANNUAL_HEALTHCARE_WASTE = HEALTHCARE_WASTE_CATEGORIES.reduce(
  (sum, c) => sum + c.annualCost, 0,
);

/** Drug pricing comparison: same drugs, different countries */
export interface DrugPriceComparison {
  drug: string;
  condition: string;
  usPrice: number;
  canadaPrice: number;
  ukPrice: number;
  markup: number;  // US price / average of other countries
  source: string;
}

export const DRUG_PRICE_COMPARISONS: DrugPriceComparison[] = [
  { drug: "Insulin (Humalog)", condition: "Diabetes", usPrice: 300, canadaPrice: 30, ukPrice: 25, markup: 10.9, source: "KFF / RAND 2021" },
  { drug: "Humira", condition: "Rheumatoid Arthritis", usPrice: 80000, canadaPrice: 20000, ukPrice: 15000, markup: 4.6, source: "RAND 2021" },
  { drug: "Xarelto", condition: "Blood Clots", usPrice: 540, canadaPrice: 100, ukPrice: 60, markup: 6.8, source: "PharmacyChecker" },
  { drug: "Truvada (PrEP)", condition: "HIV Prevention", usPrice: 2100, canadaPrice: 270, ukPrice: 45, markup: 13.3, source: "AVERT / KFF" },
  { drug: "EpiPen (2-pack)", condition: "Allergic Reactions", usPrice: 690, canadaPrice: 130, ukPrice: 85, markup: 6.4, source: "KFF" },
  { drug: "Enbrel", condition: "Psoriasis", usPrice: 66000, canadaPrice: 14000, ukPrice: 11000, markup: 5.3, source: "RAND 2021" },
];
