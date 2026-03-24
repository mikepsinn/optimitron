/**
 * Corporate tax avoidance — they extract from the system without paying into it.
 * Source: ITEP (Institute on Taxation & Economic Policy), IRS SOI, Fortune 500 reports
 */

import type { TimePoint } from "./agency-performance.js";

export const CORPORATE_TAX_RATE_EFFECTIVE: TimePoint[] = [
  { year: 1950, value: 42, annotation: "Corporations paid a real share" },
  { year: 1960, value: 40 },
  { year: 1970, value: 32 },
  { year: 1980, value: 25 },
  { year: 1990, value: 21 },
  { year: 2000, value: 21 },
  { year: 2010, value: 18 },
  {
    year: 2017,
    value: 21,
    annotation:
      "Tax Cuts and Jobs Act cuts statutory rate from 35% to 21%",
    annotationUrl:
      "https://www.congress.gov/bill/115th-congress/house-bill/1",
  },
  {
    year: 2020,
    value: 8,
    annotation:
      "55 Fortune 500 companies paid $0 in federal taxes on $40B combined profit",
    annotationUrl:
      "https://itep.org/55-profitable-corporations-zero-federal-tax-2020/",
  },
  { year: 2024, value: 14 },
];

export const OFFSHORE_PROFIT_SHIFTING = {
  totalOffshoreProfit: 1_000_000_000_000, // $1T+ held offshore
  taxRevenueForegone: 90_000_000_000, // $90B/yr lost
  topOffshoreJurisdictions: [
    {
      jurisdiction: "Ireland",
      profitShifted: 300_000_000_000,
      effectiveRate: 2,
    },
    {
      jurisdiction: "Netherlands",
      profitShifted: 200_000_000_000,
      effectiveRate: 3,
    },
    {
      jurisdiction: "Luxembourg",
      profitShifted: 150_000_000_000,
      effectiveRate: 1,
    },
    {
      jurisdiction: "Bermuda",
      profitShifted: 120_000_000_000,
      effectiveRate: 0,
    },
    {
      jurisdiction: "Cayman Islands",
      profitShifted: 100_000_000_000,
      effectiveRate: 0,
    },
  ],
  source: "ITEP / Joint Committee on Taxation / Tax Justice Network",
  sourceUrl: "https://itep.org/",
};

export interface ZeroTaxCompany {
  company: string;
  profit2020: number;
  taxPaid2020: number;
  effectiveRate: number;
}

export const ZERO_TAX_COMPANIES_2020: ZeroTaxCompany[] = [
  {
    company: "FedEx",
    profit2020: 1_200_000_000,
    taxPaid2020: 0,
    effectiveRate: 0,
  },
  {
    company: "Nike",
    profit2020: 2_900_000_000,
    taxPaid2020: 0,
    effectiveRate: 0,
  },
  {
    company: "Salesforce",
    profit2020: 2_600_000_000,
    taxPaid2020: 0,
    effectiveRate: 0,
  },
  {
    company: "DTE Energy",
    profit2020: 1_200_000_000,
    taxPaid2020: 0,
    effectiveRate: 0,
  },
  {
    company: "DISH Network",
    profit2020: 2_100_000_000,
    taxPaid2020: 0,
    effectiveRate: 0,
  },
];
