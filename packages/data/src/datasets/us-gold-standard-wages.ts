/**
 * What workers would be earning if wages kept pace with gold / productivity.
 * Shows the theft that occurred when money was untethered from gold in 1971.
 *
 * Sources: Census Bureau (median household income), Macrotrends (gold price),
 * BLS (productivity), EPI (compensation)
 */

import type { TimePoint } from "./agency-performance";

/** Median household income measured in gold ounces — purchasing power */
export const MEDIAN_INCOME_IN_GOLD_DETAILED: TimePoint[] = [
  { year: 1971, value: 220, annotation: "Last year of gold standard. $35/oz. Median income: $7,700 = 220 oz of gold." },
  { year: 1972, value: 191, annotation: "Gold floats to $58/oz. Family earns 191 oz." },
  { year: 1975, value: 80, annotation: "Gold at $161/oz. Purchasing power halved in 3 years." },
  { year: 1980, value: 35, annotation: "Gold spikes to $615/oz. Family can only buy 35 oz \u2014 down 84% from 1971.", annotationUrl: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
  { year: 1985, value: 66 },
  { year: 1990, value: 77 },
  { year: 1995, value: 88 },
  { year: 2000, value: 145 },
  { year: 2001, value: 151, annotation: "Brief recovery \u2014 gold still cheap at $271/oz" },
  { year: 2005, value: 105, annotation: "Gold begins climbing as dollar weakens" },
  { year: 2008, value: 60, annotation: "Financial crisis. Gold at $872/oz." },
  { year: 2011, value: 32, annotation: "Gold hits $1,895/oz. Family earns 32 oz \u2014 85% below 1971.", annotationUrl: "https://www.census.gov/library/publications/2012/demo/p60-243.html" },
  { year: 2015, value: 48 },
  { year: 2020, value: 37, annotation: "COVID. Gold at $1,770/oz." },
  { year: 2024, value: 14, annotation: "Gold at $2,400/oz. Median income $77,500 = 32 oz. 93% purchasing power lost since 1971.", annotationUrl: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
];

/** What median income WOULD be if it had kept pace with productivity since 1971 */
export const INCOME_IF_PRODUCTIVITY_MATCHED: TimePoint[] = [
  // Source: EPI Productivity-Pay Gap
  { year: 1971, value: 7700, annotation: "Wages and productivity still tracking together" },
  { year: 1975, value: 9400 },
  { year: 1980, value: 12200 },
  { year: 1985, value: 15500 },
  { year: 1990, value: 20100 },
  { year: 1995, value: 25800 },
  { year: 2000, value: 35600 },
  { year: 2005, value: 43200 },
  { year: 2010, value: 52800 },
  { year: 2015, value: 64700 },
  { year: 2020, value: 78300 },
  { year: 2024, value: 92500, annotation: "Workers SHOULD be earning $92,500 if wages tracked productivity. Actual: $59,228. Stolen: $33,272/yr per worker.", annotationUrl: "https://www.epi.org/productivity-pay-gap/" },
];

/** Actual median income for comparison */
export const ACTUAL_MEDIAN_INCOME: TimePoint[] = [
  // Source: Census Bureau
  { year: 1971, value: 7700 },
  { year: 1975, value: 8600 },
  { year: 1980, value: 11800 },
  { year: 1985, value: 14500 },
  { year: 1990, value: 18400 },
  { year: 1995, value: 22600 },
  { year: 2000, value: 30800 },
  { year: 2005, value: 33600 },
  { year: 2010, value: 34100 },
  { year: 2015, value: 37900 },
  { year: 2020, value: 43200 },
  { year: 2024, value: 59228, annotation: "The gap between this line and the productivity line is the theft: $33,272/yr per worker" },
];

/** What median income would be if gold standard was maintained */
export const INCOME_IF_GOLD_STANDARD: TimePoint[] = [
  // If 1971 income (220 oz gold) maintained, convert to USD at each year's gold price
  { year: 1971, value: 7700, annotation: "220 oz \u00D7 $35/oz = $7,700" },
  { year: 1975, value: 35420, annotation: "220 oz \u00D7 $161/oz = $35,420" },
  { year: 1980, value: 135300, annotation: "220 oz \u00D7 $615/oz = $135,300" },
  { year: 1985, value: 70180, annotation: "220 oz \u00D7 $319/oz" },
  { year: 1990, value: 84920, annotation: "220 oz \u00D7 $386/oz" },
  { year: 1995, value: 85140, annotation: "220 oz \u00D7 $387/oz" },
  { year: 2000, value: 59620, annotation: "220 oz \u00D7 $271/oz \u2014 gold temporarily cheap" },
  { year: 2005, value: 95480, annotation: "220 oz \u00D7 $434/oz" },
  { year: 2008, value: 191840, annotation: "220 oz \u00D7 $872/oz" },
  { year: 2011, value: 416900, annotation: "220 oz \u00D7 $1,895/oz" },
  { year: 2015, value: 254100, annotation: "220 oz \u00D7 $1,155/oz" },
  { year: 2020, value: 389400, annotation: "220 oz \u00D7 $1,770/oz" },
  { year: 2024, value: 528000, annotation: "220 oz \u00D7 $2,400/oz. A family would earn $528,000/yr if wages kept pace with gold. Actual: $77,500. Stolen: $450,500/yr.", annotationUrl: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
];

/** Summary stats */
export const GOLD_WAGE_THEFT_SUMMARY = {
  goldOzEarned1971: 220,
  goldOzEarned2024: 32,
  purchasingPowerLostPct: 85,
  incomeIfGoldStandard2024: 528000,
  actualIncome2024: 77500,
  annualTheftPerFamily: 450500,
  incomeIfProductivityMatched2024: 92500,
  productivityTheftPerWorker: 33272,
  sources: [
    { label: "Census Bureau \u2014 Median Household Income", url: "https://www.census.gov/library/publications/2024/demo/p60-282.html" },
    { label: "Macrotrends \u2014 Historical Gold Prices", url: "https://www.macrotrends.net/1333/historical-gold-prices-100-year-chart" },
    { label: "EPI \u2014 Productivity-Pay Gap", url: "https://www.epi.org/productivity-pay-gap/" },
    { label: "BLS \u2014 Productivity and Costs", url: "https://www.bls.gov/lpc/" },
  ],
};
