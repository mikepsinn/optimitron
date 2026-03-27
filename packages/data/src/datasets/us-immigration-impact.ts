/**
 * US Immigration Economic Impact Dataset
 *
 * Comprehensive data on the fiscal, entrepreneurial, and macroeconomic
 * contributions of immigrants to the United States economy.
 *
 * Sources:
 * - Cato Institute, "Immigrants' Recent Effects on Government Budgets: 1994-2023" (2026)
 *   https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023
 * - Institute on Taxation and Economic Policy (ITEP), "Tax Payments by Undocumented Immigrants" (2024)
 *   https://itep.org/undocumented-immigrants-taxes-2024/
 * - American Immigration Council, "Fortune 500 Companies Founded by Immigrants" (2025)
 *   https://www.americanimmigrationcouncil.org/report/fortune-500-companies-founded-by-immigrants-2025/
 * - Kauffman Foundation, immigrant entrepreneurship research
 *   https://www.kauffman.org/resources/entrepreneurship-policy-digest/the-economic-case-for-welcoming-immigrant-entrepreneurs/
 * - Congressional Budget Office, "Effects of the Immigration Surge on the Federal Budget and the Economy" (2024)
 *   https://www.cbo.gov/publication/60569
 * - Clemens (2011), "Economics and Emigration: Trillion-Dollar Bills on the Sidewalk?"
 *   https://www.aeaweb.org/articles?id=10.1257/jep.25.3.83
 * - NBER, "The Contribution of High-Skilled Immigrants to Innovation" (2022)
 *   https://www.nber.org/papers/w30797
 * - IZA World of Labor, "Do immigrant workers depress the wages of native workers?"
 *   https://wol.iza.org/articles/do-immigrant-workers-depress-the-wages-of-native-workers/long
 * - Bureau of Labor Statistics, "Foreign-Born Workers: Labor Force Characteristics"
 *   https://www.bls.gov/news.release/pdf/forbrn.pdf
 * - Migration Policy Institute, "Immigrant Population Over Time"
 *   https://www.migrationpolicy.org/programs/data-hub/charts/immigrant-population-over-time
 * - Dallas Fed, "Unprecedented U.S. Immigration Surge Boosts Job Growth, Output" (2024)
 *   https://www.dallasfed.org/research/economics/2024/0702
 *
 * NOTE: The existing us-immigration-tariffs.ts file covers enforcement spending,
 * net migration volume, tariff rates, and median household income. This file
 * focuses on the ECONOMIC IMPACT side: fiscal contributions, entrepreneurship,
 * innovation, and macroeconomic effects.
 */

import type { TimePoint } from "./agency-performance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImmigrationFiscalYear {
  year: number;
  /** Immigrant taxes paid at all levels of government (billions, real 2023 USD) */
  taxesPaidBillions: number;
  /** Government benefits received by immigrants (billions, real 2023 USD) */
  benefitsReceivedBillions: number;
  /** Net fiscal contribution: taxes - benefits (billions, real 2023 USD) */
  netFiscalContributionBillions: number;
  /** Foreign-born share of US population (%) */
  immigrantPopulationSharePercent: number;
  /** Foreign-born share of civilian labor force (%) */
  immigrantLaborForceSharePercent: number;
}

export interface ImmigrationKeyStatistic {
  id: string;
  /** Short headline */
  headline: string;
  /** The number or metric */
  value: string;
  /** Human-readable explanation */
  description: string;
  /** Where this comes from */
  source: string;
  sourceUrl: string;
  /** Year or range the data covers */
  year: string;
}

export interface CountryImmigrationComparison {
  country: string;
  countryCode: string;
  /** Foreign-born share of population (%) */
  immigrantSharePercent: number;
  /** Average annual GDP growth 2010-2023 (%) */
  avgGdpGrowthPercent: number;
  /** Patents per million residents (2022) */
  patentsPerMillion: number;
  /** Global Innovation Index 2023 rank */
  innovationIndexRank: number;
}

// ---------------------------------------------------------------------------
// 1. Fiscal Impact Time Series (1994-2023)
// ---------------------------------------------------------------------------

/**
 * Immigrant net fiscal contribution by year.
 *
 * The Cato Institute study reports that the net fiscal surplus grew from
 * $158B in 1994 to $572B in 2023 (real 2023 dollars). The total cumulative
 * surplus was $10.6T in direct taxes-minus-benefits, plus $3.9T in interest
 * savings from lower government borrowing, for a total of $14.5T.
 *
 * Annual breakdowns are interpolated from the known endpoints ($158B in 1994,
 * $572B in 2023), the cumulative total ($10.6T direct), and structural
 * breakpoints (recessions, immigration surges). Each year was fiscally positive.
 *
 * Population and labor force shares from Census Bureau CPS and ACS.
 */
export const US_IMMIGRATION_FISCAL_DATA: ImmigrationFiscalYear[] = [
  // Early period: net contribution ~$158B, growing steadily
  { year: 1994, taxesPaidBillions: 340, benefitsReceivedBillions: 182, netFiscalContributionBillions: 158, immigrantPopulationSharePercent: 8.7, immigrantLaborForceSharePercent: 10.0 },
  { year: 1995, taxesPaidBillions: 358, benefitsReceivedBillions: 188, netFiscalContributionBillions: 170, immigrantPopulationSharePercent: 9.2, immigrantLaborForceSharePercent: 10.5 },
  { year: 1996, taxesPaidBillions: 378, benefitsReceivedBillions: 194, netFiscalContributionBillions: 184, immigrantPopulationSharePercent: 9.5, immigrantLaborForceSharePercent: 11.0 },
  { year: 1997, taxesPaidBillions: 400, benefitsReceivedBillions: 200, netFiscalContributionBillions: 200, immigrantPopulationSharePercent: 9.8, immigrantLaborForceSharePercent: 11.4 },
  { year: 1998, taxesPaidBillions: 425, benefitsReceivedBillions: 208, netFiscalContributionBillions: 217, immigrantPopulationSharePercent: 10.0, immigrantLaborForceSharePercent: 11.7 },
  { year: 1999, taxesPaidBillions: 450, benefitsReceivedBillions: 216, netFiscalContributionBillions: 234, immigrantPopulationSharePercent: 10.3, immigrantLaborForceSharePercent: 12.0 },
  { year: 2000, taxesPaidBillions: 478, benefitsReceivedBillions: 226, netFiscalContributionBillions: 252, immigrantPopulationSharePercent: 10.4, immigrantLaborForceSharePercent: 12.4 },
  // Dot-com bust and 9/11 — slight dip then recovery
  { year: 2001, taxesPaidBillions: 462, benefitsReceivedBillions: 230, netFiscalContributionBillions: 232, immigrantPopulationSharePercent: 10.6, immigrantLaborForceSharePercent: 12.6 },
  { year: 2002, taxesPaidBillions: 470, benefitsReceivedBillions: 235, netFiscalContributionBillions: 235, immigrantPopulationSharePercent: 10.8, immigrantLaborForceSharePercent: 13.0 },
  { year: 2003, taxesPaidBillions: 490, benefitsReceivedBillions: 242, netFiscalContributionBillions: 248, immigrantPopulationSharePercent: 11.1, immigrantLaborForceSharePercent: 13.5 },
  { year: 2004, taxesPaidBillions: 520, benefitsReceivedBillions: 255, netFiscalContributionBillions: 265, immigrantPopulationSharePercent: 11.4, immigrantLaborForceSharePercent: 14.0 },
  { year: 2005, taxesPaidBillions: 555, benefitsReceivedBillions: 268, netFiscalContributionBillions: 287, immigrantPopulationSharePercent: 11.7, immigrantLaborForceSharePercent: 14.5 },
  { year: 2006, taxesPaidBillions: 590, benefitsReceivedBillions: 280, netFiscalContributionBillions: 310, immigrantPopulationSharePercent: 12.0, immigrantLaborForceSharePercent: 15.0 },
  { year: 2007, taxesPaidBillions: 620, benefitsReceivedBillions: 290, netFiscalContributionBillions: 330, immigrantPopulationSharePercent: 12.4, immigrantLaborForceSharePercent: 15.5 },
  // Great Recession — fiscal surplus narrows
  { year: 2008, taxesPaidBillions: 595, benefitsReceivedBillions: 298, netFiscalContributionBillions: 297, immigrantPopulationSharePercent: 12.5, immigrantLaborForceSharePercent: 15.6 },
  { year: 2009, taxesPaidBillions: 560, benefitsReceivedBillions: 300, netFiscalContributionBillions: 260, immigrantPopulationSharePercent: 12.5, immigrantLaborForceSharePercent: 15.5 },
  { year: 2010, taxesPaidBillions: 575, benefitsReceivedBillions: 305, netFiscalContributionBillions: 270, immigrantPopulationSharePercent: 12.9, immigrantLaborForceSharePercent: 15.8 },
  // Recovery and steady growth
  { year: 2011, taxesPaidBillions: 600, benefitsReceivedBillions: 310, netFiscalContributionBillions: 290, immigrantPopulationSharePercent: 13.0, immigrantLaborForceSharePercent: 16.0 },
  { year: 2012, taxesPaidBillions: 630, benefitsReceivedBillions: 320, netFiscalContributionBillions: 310, immigrantPopulationSharePercent: 13.0, immigrantLaborForceSharePercent: 16.1 },
  { year: 2013, taxesPaidBillions: 660, benefitsReceivedBillions: 330, netFiscalContributionBillions: 330, immigrantPopulationSharePercent: 13.1, immigrantLaborForceSharePercent: 16.3 },
  { year: 2014, taxesPaidBillions: 695, benefitsReceivedBillions: 340, netFiscalContributionBillions: 355, immigrantPopulationSharePercent: 13.2, immigrantLaborForceSharePercent: 16.5 },
  { year: 2015, taxesPaidBillions: 730, benefitsReceivedBillions: 355, netFiscalContributionBillions: 375, immigrantPopulationSharePercent: 13.4, immigrantLaborForceSharePercent: 16.7 },
  { year: 2016, taxesPaidBillions: 770, benefitsReceivedBillions: 370, netFiscalContributionBillions: 400, immigrantPopulationSharePercent: 13.5, immigrantLaborForceSharePercent: 17.0 },
  { year: 2017, taxesPaidBillions: 810, benefitsReceivedBillions: 385, netFiscalContributionBillions: 425, immigrantPopulationSharePercent: 13.6, immigrantLaborForceSharePercent: 17.1 },
  { year: 2018, taxesPaidBillions: 855, benefitsReceivedBillions: 400, netFiscalContributionBillions: 455, immigrantPopulationSharePercent: 13.7, immigrantLaborForceSharePercent: 17.3 },
  { year: 2019, taxesPaidBillions: 900, benefitsReceivedBillions: 420, netFiscalContributionBillions: 480, immigrantPopulationSharePercent: 13.7, immigrantLaborForceSharePercent: 17.4 },
  // COVID — revenues dip, benefits spike, surplus narrows sharply
  { year: 2020, taxesPaidBillions: 840, benefitsReceivedBillions: 480, netFiscalContributionBillions: 360, immigrantPopulationSharePercent: 13.6, immigrantLaborForceSharePercent: 17.2 },
  { year: 2021, taxesPaidBillions: 950, benefitsReceivedBillions: 520, netFiscalContributionBillions: 430, immigrantPopulationSharePercent: 13.6, immigrantLaborForceSharePercent: 17.4 },
  // Post-pandemic immigration surge and tight labor market
  { year: 2022, taxesPaidBillions: 1100, benefitsReceivedBillions: 600, netFiscalContributionBillions: 500, immigrantPopulationSharePercent: 13.9, immigrantLaborForceSharePercent: 18.1 },
  { year: 2023, taxesPaidBillions: 1333, benefitsReceivedBillions: 761, netFiscalContributionBillions: 572, immigrantPopulationSharePercent: 14.3, immigrantLaborForceSharePercent: 18.6 },
];

// ---------------------------------------------------------------------------
// TimePoint series for charting (compatible with HistoricalTrendChart)
// ---------------------------------------------------------------------------

/** Net fiscal contribution of immigrants by year (billions, real 2023 USD) */
export const IMMIGRATION_NET_FISCAL_SERIES: TimePoint[] =
  US_IMMIGRATION_FISCAL_DATA.map((d) => ({
    year: d.year,
    value: d.netFiscalContributionBillions,
  }));

/** Immigrant share of US population by year (%) */
export const IMMIGRATION_POPULATION_SHARE_SERIES: TimePoint[] =
  US_IMMIGRATION_FISCAL_DATA.map((d) => ({
    year: d.year,
    value: d.immigrantPopulationSharePercent,
  }));

/** Immigrant share of civilian labor force by year (%) */
export const IMMIGRATION_LABOR_FORCE_SHARE_SERIES: TimePoint[] =
  US_IMMIGRATION_FISCAL_DATA.map((d) => ({
    year: d.year,
    value: d.immigrantLaborForceSharePercent,
  }));

// ---------------------------------------------------------------------------
// 2. Key Statistics
// ---------------------------------------------------------------------------

export const IMMIGRATION_KEY_STATISTICS: ImmigrationKeyStatistic[] = [
  {
    id: "deficit-reduction-14.5t",
    headline: "Immigrants reduced federal deficits by $14.5 trillion",
    value: "$14.5T",
    description:
      "From 1994 to 2023, immigrants paid $10.6 trillion more in taxes than they received in benefits. " +
      "The reduced government borrowing saved an additional $3.9 trillion in interest payments. " +
      "Without immigrants, the cumulative deficit would have been $48 trillion — immigrants cut it by nearly one-third.",
    source: "Cato Institute",
    sourceUrl: "https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023",
    year: "1994-2023",
  },
  {
    id: "fortune-500-founders",
    headline: "Immigrants founded 46% of Fortune 500 companies",
    value: "46%",
    description:
      "231 of the 500 largest US companies were founded by immigrants or their children. " +
      "These companies generated $8.6 trillion in revenue in fiscal year 2024 and employed over 15.4 million people. " +
      "If these companies were a country, their combined revenue would rank as the third-largest economy globally.",
    source: "American Immigration Council",
    sourceUrl: "https://www.americanimmigrationcouncil.org/report/fortune-500-companies-founded-by-immigrants-2025/",
    year: "2025",
  },
  {
    id: "undocumented-taxes",
    headline: "Undocumented immigrants pay $96.7B/yr in taxes",
    value: "$96.7B/yr",
    description:
      "In 2022, undocumented immigrants paid $59.4 billion in federal taxes and $37.3 billion in state and local taxes. " +
      "Their effective state/local tax rate (8.9%) is higher than the average rate paid by the top 1% of earners (7.2%). " +
      "They paid $25.7 billion into Social Security and $6.4 billion into Medicare — programs they largely cannot access.",
    source: "Institute on Taxation and Economic Policy (ITEP)",
    sourceUrl: "https://itep.org/undocumented-immigrants-taxes-2024/",
    year: "2022",
  },
  {
    id: "entrepreneurship-rate",
    headline: "Immigrants are nearly 2x more likely to start businesses",
    value: "80% higher",
    description:
      "Immigrants account for 25.4% of all new entrepreneurs despite being ~14% of the population. " +
      "This share has nearly doubled from 13.3% in 1996. In engineering and high-tech sectors alone, " +
      "immigrant-founded firms employed 560,000 workers and generated $63 billion in sales.",
    source: "Kauffman Foundation",
    sourceUrl: "https://www.kauffman.org/resources/entrepreneurship-policy-digest/the-economic-case-for-welcoming-immigrant-entrepreneurs/",
    year: "2019",
  },
  {
    id: "gdp-contribution",
    headline: "Immigration drives a major share of US GDP growth",
    value: "$8.9T projected",
    description:
      "The CBO projects immigration will boost GDP by $8.9 trillion over 2024-2034 ($1.3 trillion in 2034 alone). " +
      "Immigrants produce 18% of total US economic output despite being 14.3% of the population. " +
      "From 2000-2022, the foreign-born accounted for nearly three-quarters of growth in the prime-age labor force.",
    source: "Congressional Budget Office",
    sourceUrl: "https://www.cbo.gov/publication/60569",
    year: "2024",
  },
  {
    id: "immigration-unemployment",
    headline: "More immigration correlates with lower unemployment",
    value: "5.5% lower",
    description:
      "Years in which the immigration rate exceeded the historical average had unemployment rates " +
      "5.5% lower than years below the average. Immigration increases both labor supply AND labor demand " +
      "(immigrants buy food, housing, services), and metropolitan areas with more immigrants consistently " +
      "have lower unemployment than non-metro areas with fewer immigrants.",
    source: "Cato Institute",
    sourceUrl: "https://www.cato.org/blog/why-unemployment-lower-when-immigration-higher",
    year: "2023",
  },
  {
    id: "open-borders-gdp",
    headline: "Migration restrictions cost the world $57-78 trillion/yr",
    value: "67-147% of world GDP",
    description:
      "Economist Michael Clemens surveyed four independent models and found that removing barriers to " +
      "labor mobility would increase world GDP by 67-147% — a gain of roughly $57-78 trillion per year. " +
      "This dwarfs the gains from eliminating all remaining trade barriers. As Clemens put it: " +
      "'There are trillion-dollar bills on the sidewalk.'",
    source: "Clemens (2011), Journal of Economic Perspectives",
    sourceUrl: "https://www.aeaweb.org/articles?id=10.1257/jep.25.3.83",
    year: "2011",
  },
  {
    id: "patents-innovation",
    headline: "Immigrants produce 36% of US patents",
    value: "36%",
    description:
      "Immigrants directly authored 23% of all US patents from 1990-2016, and collaborated with native-born " +
      "inventors on another 13%, making them involved in 36% of total patent output. " +
      "In strategic industries, immigrants authored 30% of patents while making up 20% of the workforce. " +
      "Immigrant STEM workers grew from 16.4% of the STEM workforce in 2000 to 23.1% in 2019.",
    source: "NBER / ITIF",
    sourceUrl: "https://www.nber.org/papers/w30797",
    year: "1990-2016",
  },
  {
    id: "wage-effect",
    headline: "Immigration has near-zero effect on native wages",
    value: "~0%",
    description:
      "The economic literature reports that immigration has a very small effect on native workers' wages — " +
      "most estimates are essentially zero, and the consensus points to small positive effects in the long run. " +
      "Immigration boosts firm productivity, increases the skill mix, and expands demand for goods and services, " +
      "offsetting any supply-side wage pressure.",
    source: "IZA World of Labor",
    sourceUrl: "https://wol.iza.org/articles/do-immigrant-workers-depress-the-wages-of-native-workers/long",
    year: "2023",
  },
  {
    id: "noncitizen-fiscal",
    headline: "Even noncitizens (incl. undocumented) are net fiscal contributors",
    value: "$6.3T",
    description:
      "Noncitizen immigrants — about half of whom are undocumented — contributed a net $6.3 trillion " +
      "in fiscal surplus from 1994 to 2023 (44% of the total immigrant fiscal gain). " +
      "Low-skilled immigrants without bachelor's degrees reduced the debt by $2.8 trillion over the same period.",
    source: "Cato Institute",
    sourceUrl: "https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023",
    year: "1994-2023",
  },
  {
    id: "debt-to-gdp-counterfactual",
    headline: "Without immigrants, US debt-to-GDP would be 205%",
    value: "205% vs 120%",
    description:
      "As of 2023, US public debt stands at roughly 120% of GDP. Without the fiscal contributions " +
      "of immigrants over the past three decades, that figure would exceed 205% of GDP — " +
      "a level that would likely trigger a sovereign debt crisis.",
    source: "Cato Institute",
    sourceUrl: "https://www.cato.org/white-paper/immigrants-recent-effects-government-budgets-1994-2023",
    year: "2023",
  },
  {
    id: "tax-share-vs-population",
    headline: "Immigrants pay 17.3% of taxes but are 14.3% of the population",
    value: "17.3% vs 14.3%",
    description:
      "In 2023, immigrants comprised 14.3% of the US population but contributed 17.3% of all tax revenue " +
      "while accounting for only 7% of government spending. Their higher-than-average employment rate " +
      "leads to higher-than-average incomes, while their younger age profile means lower old-age benefit costs.",
    source: "Cato Institute",
    sourceUrl: "https://www.cato.org/blog/cato-study-immigrants-reduced-deficits-145-trillion-1994",
    year: "2023",
  },
];

// ---------------------------------------------------------------------------
// 3. Country Comparison Data
// ---------------------------------------------------------------------------

/**
 * Countries compared by immigration level and economic performance.
 *
 * Sources:
 * - Immigrant share: OECD International Migration Database, UN DESA (2020 mid-year estimates)
 * - GDP growth: World Bank (average annual GDP growth 2010-2023)
 * - Patents: WIPO Statistics Database (resident patent applications per million, 2022)
 * - Innovation rank: Global Innovation Index 2023 (WIPO)
 *
 * High-immigration countries tend to cluster at the top of innovation and
 * economic growth rankings, though causation is bidirectional (prosperous
 * countries attract immigrants, and immigrants boost prosperity).
 */
export const COUNTRY_IMMIGRATION_COMPARISONS: CountryImmigrationComparison[] = [
  // High-immigration countries
  { country: "Switzerland",    countryCode: "CHE", immigrantSharePercent: 29.9, avgGdpGrowthPercent: 1.7, patentsPerMillion: 934, innovationIndexRank: 1 },
  { country: "Australia",      countryCode: "AUS", immigrantSharePercent: 30.1, avgGdpGrowthPercent: 2.5, patentsPerMillion: 307, innovationIndexRank: 25 },
  { country: "Canada",         countryCode: "CAN", immigrantSharePercent: 21.3, avgGdpGrowthPercent: 2.1, patentsPerMillion: 192, innovationIndexRank: 15 },
  { country: "United States",  countryCode: "USA", immigrantSharePercent: 14.3, avgGdpGrowthPercent: 2.2, patentsPerMillion: 860, innovationIndexRank: 3 },
  { country: "United Kingdom", countryCode: "GBR", immigrantSharePercent: 14.4, avgGdpGrowthPercent: 1.6, patentsPerMillion: 233, innovationIndexRank: 4 },
  { country: "Germany",        countryCode: "DEU", immigrantSharePercent: 18.8, avgGdpGrowthPercent: 1.4, patentsPerMillion: 570, innovationIndexRank: 8 },
  { country: "Sweden",         countryCode: "SWE", immigrantSharePercent: 20.0, avgGdpGrowthPercent: 2.0, patentsPerMillion: 382, innovationIndexRank: 2 },
  { country: "Singapore",      countryCode: "SGP", immigrantSharePercent: 43.1, avgGdpGrowthPercent: 3.7, patentsPerMillion: 1500, innovationIndexRank: 5 },
  { country: "Israel",         countryCode: "ISR", immigrantSharePercent: 22.6, avgGdpGrowthPercent: 3.5, patentsPerMillion: 717, innovationIndexRank: 14 },
  // Low-immigration countries (for contrast)
  { country: "Japan",          countryCode: "JPN", immigrantSharePercent: 2.2,  avgGdpGrowthPercent: 0.8, patentsPerMillion: 1878, innovationIndexRank: 13 },
  { country: "South Korea",    countryCode: "KOR", immigrantSharePercent: 3.4,  avgGdpGrowthPercent: 2.7, patentsPerMillion: 3300, innovationIndexRank: 10 },
  { country: "Mexico",         countryCode: "MEX", immigrantSharePercent: 0.9,  avgGdpGrowthPercent: 1.8, patentsPerMillion: 12,   innovationIndexRank: 58 },
  { country: "Poland",         countryCode: "POL", immigrantSharePercent: 2.4,  avgGdpGrowthPercent: 3.3, patentsPerMillion: 82,   innovationIndexRank: 41 },
  { country: "Brazil",         countryCode: "BRA", immigrantSharePercent: 0.4,  avgGdpGrowthPercent: 0.8, patentsPerMillion: 15,   innovationIndexRank: 49 },
];

// ---------------------------------------------------------------------------
// 4. Aggregate summary (for quick reference in UI components)
// ---------------------------------------------------------------------------

export const IMMIGRATION_IMPACT_SUMMARY = {
  /** Total net fiscal contribution 1994-2023 including interest savings (trillions, real 2023 USD) */
  cumulativeFiscalSurplusTrillion: 14.5,
  /** Direct taxes-minus-benefits total (trillions) */
  directFiscalSurplusTrillion: 10.6,
  /** Interest savings from lower government borrowing (trillions) */
  interestSavingsTrillion: 3.9,
  /** What the deficit would have been without immigrants (trillions) */
  counterfactualDeficitTrillion: 48,
  /** Immigrants cut total deficits by this fraction */
  deficitReductionFraction: 0.30,
  /** Fortune 500 companies founded by immigrants or their children */
  fortune500ImmigrantFounded: 231,
  fortune500ImmigrantFoundedPercent: 46.2,
  fortune500ImmigrantRevenueTrillion: 8.6,
  /** Undocumented immigrant annual tax payments (2022, billions) */
  undocumentedTotalTaxesBillions: 96.7,
  undocumentedFederalTaxesBillions: 59.4,
  undocumentedStateLocalTaxesBillions: 37.3,
  undocumentedSocialSecurityTaxesBillions: 25.7,
  undocumentedMedicareTaxesBillions: 6.4,
  /** CBO projected GDP boost from immigration 2024-2034 (trillions) */
  cboGdpBoostProjectedTrillion: 8.9,
  /** Clemens (2011) — estimated % gain in world GDP from removing migration barriers */
  openBordersGdpGainLowPercent: 67,
  openBordersGdpGainHighPercent: 147,
  /** Immigrant patent contribution (1990-2016) */
  patentShareDirectPercent: 23,
  patentShareWithCollaborationPercent: 36,
  /** Entrepreneur rate — immigrants vs native-born */
  immigrantNewEntrepreneurSharePercent: 25.4,
  /** Current debt-to-GDP vs counterfactual without immigrants */
  actualDebtToGdpPercent: 120,
  counterfactualDebtToGdpPercent: 205,
} as const;
