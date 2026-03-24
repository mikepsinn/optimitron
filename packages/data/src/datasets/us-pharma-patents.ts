/**
 * Pharmaceutical patent abuse — why drugs stay expensive forever.
 * Source: I-MAK, FDA Orange Book, academic patent analysis
 */

import type { TimePoint } from "./agency-performance.js";

export interface PatentAbuseStat {
  metric: string;
  value: string;
  description: string;
  source: string;
  sourceUrl: string;
}

export const PHARMA_PATENT_STATS: PatentAbuseStat[] = [
  {
    metric: "Patents on existing drugs (evergreening)",
    value: "78%",
    description:
      "78% of drug patents filed in the US are for existing drugs \u2014 not new ones. Companies make minor modifications (different salt form, new coating, combination) to extend patent protection.",
    source: "I-MAK Overpatented Overpriced 2023",
    sourceUrl: "https://www.i-mak.org/overpatented-overpriced/",
  },
  {
    metric: "Average patent extension via evergreening",
    value: "7+ years",
    description:
      "Evergreening extends effective patent monopoly by an average of 7+ years beyond the original 20-year patent term.",
    source: "I-MAK",
    sourceUrl: "https://www.i-mak.org/overpatented-overpriced/",
  },
  {
    metric: "Humira patent wall",
    value: "132 patents",
    description:
      "AbbVie filed 132 patents on Humira (originally patented in 2002). This patent wall delayed biosimilar competition until 2023 \u2014 generating $200B+ in revenue during the extended monopoly.",
    source: "I-MAK Humira Patent Analysis",
    sourceUrl: "https://www.i-mak.org/humira/",
  },
  {
    metric: "Insulin patent history",
    value: "101 years",
    description:
      "Insulin was discovered in 1923. The discoverers sold the patent for $1 each, wanting it to be affordable. Through reformulations, patents have been continuously extended. A vial costs $2-4 to manufacture and sells for $300 in the US.",
    source: "Yale School of Medicine / T1International",
    sourceUrl: "https://t1international.com/insulin-pricing/",
  },
  {
    metric: "Pay-for-delay agreements",
    value: "$3.5B/yr cost to consumers",
    description:
      "Brand-name drug companies pay generic manufacturers to delay entering the market ('reverse payment settlements'). These agreements cost consumers an estimated $3.5B per year in higher drug prices.",
    source: "FTC Pay-for-Delay Reports",
    sourceUrl:
      "https://www.ftc.gov/reports/pay-delay-how-drug-company-pay-offs-cost-consumers-billions",
  },
];

/** Cost to manufacture vs US retail price for selected drugs */
export interface DrugManufacturingVsRetail {
  drug: string;
  condition: string;
  manufacturingCost: number;
  usRetailPrice: number;
  markup: number;
  source: string;
}

export const DRUG_MANUFACTURING_VS_RETAIL: DrugManufacturingVsRetail[] = [
  {
    drug: "Insulin (Humalog)",
    condition: "Diabetes",
    manufacturingCost: 3.69,
    usRetailPrice: 300,
    markup: 81,
    source: "BMJ Global Health 2018",
  },
  {
    drug: "Imatinib (Gleevec)",
    condition: "Leukemia",
    manufacturingCost: 159,
    usRetailPrice: 10_000,
    markup: 63,
    source: "Hill et al. JAMA Oncology 2017",
  },
  {
    drug: "Sofosbuvir (Sovaldi)",
    condition: "Hepatitis C",
    manufacturingCost: 68,
    usRetailPrice: 28_000,
    markup: 412,
    source: "Hill et al. Clinical Infectious Diseases 2016",
  },
  {
    drug: "EpiPen",
    condition: "Allergic reactions",
    manufacturingCost: 8,
    usRetailPrice: 345,
    markup: 43,
    source: "Pharmaceutical Journal 2016",
  },
];
