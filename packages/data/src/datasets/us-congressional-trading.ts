/**
 * Congressional stock trading — the people writing the laws profit from them.
 * Source: Capitol Trades, Unusual Whales, STOCK Act disclosures
 */

import type { TimePoint } from "./agency-performance.js";

export interface CongressionalTradingStat {
  metric: string;
  value: string;
  description: string;
  source: string;
  sourceUrl: string;
}

export const CONGRESSIONAL_TRADING_STATS: CongressionalTradingStat[] = [
  {
    metric: "Total stock trades (2019-2024)",
    value: "$788M+",
    description:
      "Members of Congress reported $788M+ in stock trades between 2019 and 2024 while having access to classified briefings, advance knowledge of legislation, and regulatory decisions.",
    source: "Capitol Trades / Unusual Whales",
    sourceUrl: "https://www.capitoltrades.com/",
  },
  {
    metric: "Members trading regulated stocks",
    value: "97",
    description:
      "97 members of Congress traded stocks of companies directly affected by committees they sat on.",
    source: "Insider.com Investigation 2022",
    sourceUrl:
      "https://www.businessinsider.com/congress-stock-act-violations",
  },
  {
    metric: "Outperformance vs S&P 500",
    value: "6-12%",
    description:
      "Studies show Congress members' stock picks outperform the S&P 500 by 6-12% annually \u2014 far exceeding what random chance or skill explains.",
    source:
      "Ziobrowski et al. (2004) Journal of Financial & Quantitative Analysis",
    sourceUrl: "https://doi.org/10.1017/S0022109000003161",
  },
  {
    metric: "STOCK Act enforcement actions",
    value: "0 criminal prosecutions",
    description:
      "The STOCK Act (2012) made congressional insider trading illegal. Zero criminal prosecutions in 12 years. Penalties are $200 late-filing fines.",
    source: "Campaign Legal Center",
    sourceUrl:
      "https://campaignlegal.org/update/stock-act-has-been-law-decade-congress-has-done-almost-nothing-enforce-it",
  },
  {
    metric: "COVID briefing trades",
    value: "Multiple members",
    description:
      "After classified COVID briefings in January 2020, multiple members of Congress sold millions in stocks before the market crashed. None were criminally charged.",
    source: "Department of Justice \u2014 cases declined",
    sourceUrl: "https://www.justice.gov/criminal-fraud",
  },
];
