/**
 * Historical US tariff rates and their effects on prosperity.
 * Shows that high tariffs correlate with economic damage, not prosperity.
 * The Smoot-Hawley tariff (1930) deepened the Great Depression. NAFTA and WTO entry
 * correlated with massive consumer price drops and GDP growth.
 *
 * Sources: USITC DataWeb, Douglas Irwin "Clashing over Commerce",
 * World Bank, BLS CPI
 */

import type { TimePoint } from "./agency-performance";

/** Effective US tariff rate 1821-2024 (duties collected / imports value) */
export const US_TARIFF_RATE_HISTORICAL: TimePoint[] = [
  // Source: USITC DataWeb, Douglas Irwin (Dartmouth)
  { year: 1821, value: 45, annotation: "Early republic — high tariffs to protect infant industries" },
  { year: 1830, value: 57, annotation: "Tariff of Abominations (1828) — South Carolina threatens secession" },
  { year: 1840, value: 30 },
  { year: 1846, value: 25, annotation: "Walker Tariff — reduction correlates with economic boom" },
  { year: 1857, value: 18, annotation: "Tariff of 1857 — lowest rate in decades. Economy growing." },
  { year: 1861, value: 37, annotation: "Morrill Tariff — rates raised to fund Civil War" },
  { year: 1870, value: 44 },
  { year: 1880, value: 43 },
  { year: 1890, value: 48, annotation: "McKinley Tariff — highest peacetime tariff. Prices spike. Party loses 78 House seats in midterms." },
  { year: 1897, value: 46 },
  { year: 1900, value: 27, annotation: "Rates decline. US becomes world's largest exporter." },
  { year: 1913, value: 15, annotation: "Underwood Tariff — rates cut to 15%. Import prices drop." },
  { year: 1920, value: 16 },
  { year: 1930, value: 45, annotation: "Smoot-Hawley Tariff — 1,028 economists signed letter warning against it. Passed anyway. Global trade collapsed 66%. Depression deepened.", annotationUrl: "https://www.econlib.org/library/Enc/SmootHawleyTariff.html" },
  { year: 1934, value: 32, annotation: "Reciprocal Trade Agreements Act — begins reducing Smoot-Hawley damage" },
  { year: 1945, value: 13 },
  { year: 1950, value: 6 },
  { year: 1960, value: 7 },
  { year: 1970, value: 6 },
  { year: 1980, value: 3.1 },
  { year: 1990, value: 3.5 },
  { year: 1994, value: 2.7, annotation: "NAFTA signed. Consumer goods prices drop. Manufacturing employment was already declining before NAFTA." },
  { year: 2000, value: 1.6, annotation: "China enters WTO (2001). Consumer electronics prices collapse. Walmart's rise.", annotationUrl: "https://www.usitc.gov/documents/dataweb/ave_table_1891_2023.pdf" },
  { year: 2005, value: 1.5 },
  { year: 2010, value: 1.5 },
  { year: 2015, value: 1.4, annotation: "Lowest effective tariff rate in US history" },
  { year: 2018, value: 1.6 },
  { year: 2019, value: 2.7, annotation: "Trade war tariffs on $370B of Chinese goods. US farmers lose $27B in exports. Taxpayers pay $28B in farm bailouts to offset the damage.", annotationUrl: "https://www.usitc.gov/documents/dataweb/ave_table_1891_2023.pdf" },
  { year: 2020, value: 3.0 },
  { year: 2024, value: 2.5 },
  { year: 2025, value: 17, annotation: "Tariffs raised to 10-145% on various trading partners. 1,028 economists warned against Smoot-Hawley in 1930. 1,400+ economists signed letter warning against these." },
];

/** What tariffs actually cost consumers — the hidden tax */
export interface TariffCostToConsumers {
  year: number;
  tariffAction: string;
  estimatedCostPerHousehold: number;
  source: string;
  sourceUrl: string;
}

export const TARIFF_COSTS_TO_CONSUMERS: TariffCostToConsumers[] = [
  {
    year: 2002,
    tariffAction: "Steel tariffs (8-30%)",
    estimatedCostPerHousehold: 326,
    source: "ITC / Trade Partnership Worldwide",
    sourceUrl: "https://www.tradepartnership.com/",
  },
  {
    year: 2018,
    tariffAction: "Steel & aluminum tariffs (25% / 10%)",
    estimatedCostPerHousehold: 831,
    source: "Federal Reserve Bank of New York",
    sourceUrl: "https://www.newyorkfed.org/research/staff_reports/sr877",
  },
  {
    year: 2019,
    tariffAction: "China trade war (25% on $370B goods)",
    estimatedCostPerHousehold: 1277,
    source: "NY Fed / Columbia / Princeton joint study",
    sourceUrl: "https://www.nber.org/papers/w25638",
  },
  {
    year: 2025,
    tariffAction: "Broad tariffs (10-145%)",
    estimatedCostPerHousehold: 3800,
    source: "Tax Foundation / Budget Lab at Yale",
    sourceUrl: "https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/",
  },
];

/** Smoot-Hawley disaster — the definitive case study */
export const SMOOT_HAWLEY = {
  year: 1930,
  tariffIncrease: "Average rate to 45% on 20,000+ goods",
  economistsWhoWarnedAgainst: 1028,
  effectOnTrade: "World trade collapsed 66% from 1929-1934",
  effectOnUnemployment: "US unemployment went from 3.2% (1929) to 24.9% (1933)",
  retaliation: "25+ countries imposed retaliatory tariffs. US exports fell 61%.",
  keyLesson: "The tariff didn't cause the Depression but massively deepened it. Every major economist agrees.",
  source: "Douglas Irwin, 'Peddling Protectionism: Smoot-Hawley and the Great Depression'",
  sourceUrl: "https://www.econlib.org/library/Enc/SmootHawleyTariff.html",
};

/** Tariff collateral damage — farm bankruptcies, retaliation, consumer price spikes */
export interface TariffDamageEvent {
  year: number;
  tariffAction: string;
  farmBankruptcyChange?: string;
  consumerPriceImpact: string;
  retaliationDamage: string;
  source: string;
  sourceUrl: string;
}

export const TARIFF_COLLATERAL_DAMAGE: TariffDamageEvent[] = [
  {
    year: 1930,
    tariffAction: "Smoot-Hawley (45% average rate)",
    farmBankruptcyChange: "Farm foreclosures doubled 1930-1933. 1 in 4 farmers lost their land.",
    consumerPriceImpact: "Consumer goods prices spiked despite deflation. Sugar, textiles, shoes all more expensive.",
    retaliationDamage: "25+ countries retaliated. US agricultural exports fell 66%. Canada imposed tariffs specifically targeting US goods that competed with Canadian production.",
    source: "Douglas Irwin 'Peddling Protectionism' / USDA Historical Data",
    sourceUrl: "https://www.econlib.org/library/Enc/SmootHawleyTariff.html",
  },
  {
    year: 2018,
    tariffAction: "Steel & aluminum tariffs (25% / 10%)",
    consumerPriceImpact: "Washing machine prices up 12% ($86/unit). Steel-dependent manufacturers lost 75,000 jobs — 5x the jobs 'saved' in steel production.",
    retaliationDamage: "EU imposed tariffs on bourbon, Harley-Davidson motorcycles, blue jeans — targeted at politically sensitive districts.",
    source: "Federal Reserve Bank of New York / Peterson Institute",
    sourceUrl: "https://www.newyorkfed.org/research/staff_reports/sr877",
  },
  {
    year: 2019,
    tariffAction: "China trade war (25% on $370B goods)",
    farmBankruptcyChange: "Chapter 12 farm bankruptcy filings up 20% (2018-2019). Soybean exports to China dropped 75%. $28B in taxpayer-funded farm bailouts — more than the 2009 auto bailout.",
    consumerPriceImpact: "Consumer electronics, clothing, furniture all more expensive. Total cost: $1,277/household/yr. Tariffs paid by US importers and consumers, not China.",
    retaliationDamage: "China targeted US soybeans (dropped from $12B to $3B/yr), pork, and aircraft. Farm income dropped $12B. Rural communities devastated.",
    source: "USDA ERS / NY Fed-Columbia-Princeton joint study",
    sourceUrl: "https://www.nber.org/papers/w25638",
  },
  {
    year: 2025,
    tariffAction: "Broad tariffs (10-145% on various partners)",
    farmBankruptcyChange: "Projected farm income decline of $10-15B from retaliatory tariffs on US agriculture.",
    consumerPriceImpact: "Estimated $3,800/household/yr. Disproportionately hits low-income families who spend higher % of income on goods.",
    retaliationDamage: "Canada, EU, China, Japan, South Korea all announced retaliatory tariffs. 1,400+ economists signed letter warning against, echoing the 1,028 who warned against Smoot-Hawley.",
    source: "Tax Foundation / Yale Budget Lab / Peterson Institute",
    sourceUrl: "https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/",
  },
];

/** Free trade impact — prices consumers actually pay */
export const FREE_TRADE_CONSUMER_SAVINGS = {
  tvPriceDropSince2000: -97,  // 50" TV: $10,000 (2000) → $300 (2024)
  clothingPriceDropSince1990: -43,  // inflation-adjusted
  electronicsDropSince1998: -96,  // computers, phones
  foodPriceIncreaseSince2000: 83,  // food has tariffs/subsidies — not free trade
  keyInsight: "Every product category with FREE trade saw prices collapse. The one category with heavy tariffs and subsidies (food) saw prices rise 83%. Tariffs are a tax on consumers that benefits a handful of producers.",
  source: "BLS CPI Detailed Reports",
  sourceUrl: "https://www.bls.gov/cpi/detailed-report.htm",
};
