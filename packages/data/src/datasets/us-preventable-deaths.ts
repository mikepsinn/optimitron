/**
 * Preventable deaths in the United States — deaths that policy choices cause or fail to prevent.
 * Each dataset shows a category of death that could be reduced to near-zero with known interventions.
 */

import type { TimePoint } from "./agency-performance";

export interface PreventableDeathCategory {
  id: string;
  name: string;
  emoji: string;
  annualDeaths: number;
  description: string;
  comparison: string;  // shocking comparison
  source: string;
  sourceUrl: string;
  trend?: TimePoint[];  // historical trend if available
}

export const PREVENTABLE_DEATH_CATEGORIES: PreventableDeathCategory[] = [
  {
    id: "fda-drug-lag",
    name: "FDA Efficacy Lag Deaths",
    emoji: "⏳",
    annualDeaths: 1_645_161,  // 102M over 62 years
    description: "People murdered by the 8.2-year delay in approving drugs already proven safe. The FDA requires efficacy testing AFTER safety is established — treatments sit in a queue while patients die waiting.",
    comparison: "34,100 9/11s. 17 Holocausts. More than WWI and WWII combined.",
    source: "The Invisible Graveyard — Efficacy Lag Deaths 1962-2024",
    sourceUrl: "https://manual.warondisease.org/knowledge/appendix/invisible-graveyard.html",
    trend: [
      { year: 1962, value: 0, annotation: "Kefauver-Harris Amendment. Efficacy testing begins. 8.2-year queue starts.", annotationUrl: "https://manual.warondisease.org/knowledge/appendix/invisible-graveyard.html" },
      { year: 1970, value: 13_000_000 },
      { year: 1980, value: 30_000_000 },
      { year: 1990, value: 47_000_000 },
      { year: 2000, value: 64_000_000 },
      { year: 2010, value: 81_000_000 },
      { year: 2020, value: 97_000_000 },
      { year: 2024, value: 102_000_000, annotation: "102M cumulative. Type II error kills 3,070x more than Type I prevents." },
    ],
  },
  {
    id: "medical-errors",
    name: "Medical Errors",
    emoji: "🏥",
    annualDeaths: 250_000,
    description: "Killed by mistakes in hospitals — wrong drugs, wrong doses, hospital-acquired infections, surgical errors. Would be the 3rd leading cause of death if counted as a single category.",
    comparison: "A 9/11 every 4.4 days. 685 people killed per day by the healthcare system itself.",
    source: "BMJ 2016 (Makary & Daniel, Johns Hopkins)",
    sourceUrl: "https://www.bmj.com/content/353/bmj.i2139",
  },
  {
    id: "uninsured-deaths",
    name: "Deaths from Lack of Insurance",
    emoji: "🚫",
    annualDeaths: 45_000,
    description: "Killed by not having health insurance in the only developed country without universal coverage. They delay care until it's too late.",
    comparison: "15 9/11s per year. The US is the ONLY developed nation where this happens.",
    source: "Harvard Medical School / American Journal of Public Health 2009",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2775760/",
  },
  {
    id: "maternal-mortality",
    name: "Maternal Mortality",
    emoji: "🤰",
    annualDeaths: 1_205,
    description: "Killed during pregnancy or childbirth. The US is the ONLY developed country where the maternal death rate is RISING. Black women die at 2.6x the rate of white women.",
    comparison: "US: 32.9 per 100K live births. Japan: 3.3. The Netherlands: 3.0. US is 10x worse.",
    source: "CDC NCHS Maternal Mortality Rates 2021",
    sourceUrl: "https://www.cdc.gov/nchs/data/hestat/maternal-mortality/2021/maternal-mortality-rates-2021.htm",
    trend: [
      { year: 2000, value: 9.8 },
      { year: 2005, value: 15.1 },
      { year: 2010, value: 16.7 },
      { year: 2015, value: 17.2 },
      { year: 2018, value: 17.4, annotation: "Only developed country where maternal mortality is rising" },
      { year: 2020, value: 23.8 },
      { year: 2021, value: 32.9, annotation: "32.9 per 100K. Black women: 69.9. Native women: 62.4." },
    ],
  },
  {
    id: "infant-mortality-racial",
    name: "Infant Mortality (Racial Gap)",
    emoji: "👶",
    annualDeaths: 20_000,
    description: "20,000 infants die per year in the US. The US ranks 33rd among OECD nations. Black infants die at 2.1x the rate of white infants.",
    comparison: "US: 5.4 per 1,000. Finland: 1.8. Japan: 1.7. The richest country on earth has 3x the infant death rate of the best.",
    source: "CDC NCHS / OECD Health Statistics",
    sourceUrl: "https://www.cdc.gov/nchs/data/nvsr/nvsr73/nvsr73-04.pdf",
  },
  {
    id: "antimicrobial-resistance",
    name: "Antimicrobial Resistance Deaths",
    emoji: "🦠",
    annualDeaths: 35_000,
    description: "Killed by antibiotic-resistant infections in the US (1.27M globally). Overuse of antibiotics in factory farming and overprescription created superbugs that existing drugs can't treat.",
    comparison: "1.27M murdered globally per year — more than HIV/AIDS or malaria. By 2050: projected 10M/yr.",
    source: "CDC AR Threats Report 2019 / Lancet 2022",
    sourceUrl: "https://www.cdc.gov/antimicrobial-resistance/data-research/threats/index.html",
  },
  {
    id: "overdose-deaths",
    name: "Drug Overdose Deaths",
    emoji: "💊",
    annualDeaths: 107_941,
    description: "Killed by drug overdoses — primarily fentanyl since 2016. The DEA's budget doubled while deaths increased 600%. Portugal decriminalized all drugs in 2001 and deaths dropped 80%.",
    comparison: "A 9/11 every 10 days. 296 people murdered by the drug war's failure every single day.",
    source: "CDC NCHS Drug Overdose Deaths 2022",
    sourceUrl: "https://www.cdc.gov/nchs/products/databriefs/db522.htm",
  },
];

/** Total annual preventable deaths across all categories */
export const TOTAL_ANNUAL_PREVENTABLE_DEATHS = PREVENTABLE_DEATH_CATEGORIES.reduce(
  (sum, c) => sum + c.annualDeaths, 0,
);
