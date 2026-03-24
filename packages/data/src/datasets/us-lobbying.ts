/**
 * Industry lobbying spending in the United States — who buys the dysfunction.
 * Source: OpenSecrets (Center for Responsive Politics)
 */

import type { TimePoint } from "./agency-performance.js";

export interface LobbyingIndustry {
  industry: string;
  emoji: string;
  annualSpending: number; // most recent year USD
  totalSpending1998to2024: number;
  topIssue: string; // what they lobbied for
  whatTheyGot: string; // what policy they achieved
  source: string;
  sourceUrl: string;
  trend?: TimePoint[];
}

export const LOBBYING_BY_INDUSTRY: LobbyingIndustry[] = [
  {
    industry: "Pharmaceuticals & Health Products",
    emoji: "\u{1F48A}",
    annualSpending: 374_000_000,
    totalSpending1998to2024: 7_600_000_000,
    topIssue:
      "Block drug price negotiation, extend patent exclusivity, maintain FDA user fee dependency",
    whatTheyGot:
      "Medicare banned from negotiating prices (2003-2022). PDUFA makes FDA dependent on pharma fees. Insulin stayed at $300 for 20 years.",
    source: "OpenSecrets Lobbying Database",
    sourceUrl: "https://www.opensecrets.org/federal-lobbying/industries",
    trend: [
      { year: 1998, value: 138_000_000 },
      {
        year: 2002,
        value: 171_000_000,
        annotation: "Medicare Part D lobbied \u2014 price negotiation banned",
      },
      { year: 2006, value: 213_000_000 },
      {
        year: 2009,
        value: 273_000_000,
        annotation:
          "ACA negotiations \u2014 pharma deal preserves pricing power",
        annotationUrl:
          "https://www.opensecrets.org/federal-lobbying/industries/summary?id=H04",
      },
      { year: 2012, value: 234_000_000 },
      { year: 2016, value: 246_000_000 },
      { year: 2020, value: 306_000_000 },
      { year: 2024, value: 374_000_000 },
    ],
  },
  {
    industry: "Insurance",
    emoji: "\u{1F3E5}",
    annualSpending: 178_000_000,
    totalSpending1998to2024: 3_200_000_000,
    topIssue:
      "Preserve private insurance model, block single-payer, maintain prior authorization",
    whatTheyGot:
      "ACA mandated private insurance purchase instead of public option. Prior auth delays 35% of care. 32% claim denial rate.",
    source: "OpenSecrets",
    sourceUrl:
      "https://www.opensecrets.org/federal-lobbying/industries/summary?id=F09",
  },
  {
    industry: "Finance / Securities / Investment",
    emoji: "\u{1F3E6}",
    annualSpending: 320_000_000,
    totalSpending1998to2024: 6_400_000_000,
    topIssue:
      "Deregulation, weaken Dodd-Frank, block fiduciary rules, maintain carried interest loophole",
    whatTheyGot:
      "Glass-Steagall repealed (1999). $16.1T in Fed emergency lending (2008). Zero bankers jailed. Carried interest taxed at 20% not 37%.",
    source: "OpenSecrets",
    sourceUrl:
      "https://www.opensecrets.org/federal-lobbying/industries/summary?id=F07",
    trend: [
      {
        year: 1998,
        value: 210_000_000,
        annotation: "Glass-Steagall repeal lobbied",
      },
      { year: 2002, value: 250_000_000 },
      { year: 2006, value: 290_000_000 },
      {
        year: 2010,
        value: 340_000_000,
        annotation:
          "Dodd-Frank weakened during implementation \u2014 80% of proposed rules lobbied against",
        annotationUrl:
          "https://www.opensecrets.org/federal-lobbying/industries/summary?id=F07",
      },
      { year: 2014, value: 300_000_000 },
      { year: 2018, value: 290_000_000 },
      { year: 2024, value: 320_000_000 },
    ],
  },
  {
    industry: "Oil / Gas / Energy",
    emoji: "\u26FD",
    annualSpending: 125_000_000,
    totalSpending1998to2024: 2_800_000_000,
    topIssue:
      "Block climate regulation, maintain $20B/yr in fossil fuel subsidies",
    whatTheyGot:
      "$20B/yr in federal subsidies. Climate legislation delayed 30+ years. Pipeline approvals. Drilling on public land.",
    source: "OpenSecrets",
    sourceUrl:
      "https://www.opensecrets.org/federal-lobbying/industries/summary?id=E01",
  },
  {
    industry: "Defense / Aerospace",
    emoji: "\u{1F6E9}\uFE0F",
    annualSpending: 150_000_000,
    totalSpending1998to2024: 3_000_000_000,
    topIssue:
      "Maintain military spending, block base closures, fund weapons programs",
    whatTheyGot:
      "$886B military budget (2024). F-35 program: $1.7T total cost, 10 years behind schedule. Weapons distributed across 45+ states to make them politically unkillable.",
    source: "OpenSecrets",
    sourceUrl:
      "https://www.opensecrets.org/federal-lobbying/industries/summary?id=D",
  },
  {
    industry: "Agriculture / Food",
    emoji: "\u{1F33E}",
    annualSpending: 80_000_000,
    totalSpending1998to2024: 1_600_000_000,
    topIssue:
      "Maintain farm subsidies, block labeling requirements, weaken environmental rules",
    whatTheyGot:
      "$36.5B/yr in subsidies \u2014 78% to top 10% of farms. Sugar import quotas cost consumers $3.5B/yr. USDA nutritional guidelines influenced by industry.",
    source: "OpenSecrets",
    sourceUrl:
      "https://www.opensecrets.org/federal-lobbying/industries/summary?id=A",
  },
];

export const TOTAL_ANNUAL_LOBBYING = LOBBYING_BY_INDUSTRY.reduce(
  (s, i) => s + i.annualSpending,
  0,
);
