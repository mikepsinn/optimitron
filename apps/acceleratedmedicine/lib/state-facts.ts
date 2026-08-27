import {
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  RARE_DISEASES_COUNT_GLOBAL,
} from "@optimitron/data/parameters";

import type { StateName } from "./right-to-try";

export const STATE_FACT_SOURCES = {
  federalRightToTryAct:
    "https://www.congress.gov/bill/115th-congress/senate-bill/204",
  usRareDiseasePatients: "https://www.gao.gov/products/gao-25-106774",
  statePopulations:
    "https://www.census.gov/data/tables/time-series/demo/popest/2020s-state-total.html",
} as const;

export const FEDERAL_RIGHT_TO_TRY_YEAR = 2018;

/** GAO-25-106774: as many as 30 million people in the US live with a rare disease. */
export const US_RARE_DISEASE_PATIENTS_TOTAL = 30_000_000;

/** Census Bureau state population estimates, July 1, 2025 vintage. */
export const STATE_POPULATIONS: Record<StateName, number> = {
  Alabama: 5_193_088,
  Alaska: 737_270,
  Arizona: 7_623_818,
  Arkansas: 3_114_791,
  California: 39_355_309,
  Colorado: 6_012_561,
  Connecticut: 3_688_496,
  Delaware: 1_059_952,
  Florida: 23_462_518,
  Georgia: 11_302_748,
  Hawaii: 1_432_820,
  Idaho: 2_029_733,
  Illinois: 12_719_141,
  Indiana: 6_973_333,
  Iowa: 3_238_387,
  Kansas: 2_977_220,
  Kentucky: 4_606_864,
  Louisiana: 4_618_789,
  Maine: 1_414_874,
  Maryland: 6_265_347,
  Massachusetts: 7_154_084,
  Michigan: 10_127_884,
  Minnesota: 5_830_405,
  Mississippi: 2_954_160,
  Missouri: 6_270_541,
  Montana: 1_144_694,
  Nebraska: 2_018_006,
  Nevada: 3_282_188,
  "New Hampshire": 1_415_342,
  "New Jersey": 9_548_215,
  "New Mexico": 2_125_498,
  "New York": 20_002_427,
  "North Carolina": 11_197_968,
  "North Dakota": 799_358,
  Ohio: 11_900_510,
  Oklahoma: 4_123_288,
  Oregon: 4_273_586,
  Pennsylvania: 13_059_432,
  "Rhode Island": 1_114_521,
  "South Carolina": 5_570_274,
  "South Dakota": 935_094,
  Tennessee: 7_315_076,
  Texas: 31_709_821,
  Utah: 3_538_904,
  Vermont: 644_663,
  Virginia: 8_880_107,
  Washington: 8_001_020,
  "West Virginia": 1_766_147,
  Wisconsin: 5_972_787,
  Wyoming: 588_753,
};

export const STATE_POPULATION_TOTAL = Object.values(STATE_POPULATIONS).reduce(
  (sum, population) => sum + population,
  0,
);

/** Share of rare diseases with no approved treatment, from the parameter catalog. */
export const UNTREATED_RARE_DISEASE_SHARE_PCT = Math.round(
  (DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / RARE_DISEASES_COUNT_GLOBAL.value) *
    100,
);

export const RARE_DISEASES_COUNT = RARE_DISEASES_COUNT_GLOBAL.value;

/** The state's population share of a national headcount. */
export function estimateStateShare(state: StateName, usCount: number): number {
  return Math.round(
    (STATE_POPULATIONS[state] / STATE_POPULATION_TOTAL) * usCount,
  );
}

/** The state's population share of the ~30M Americans with a rare disease. */
export function estimatedRareDiseasePatients(state: StateName): number {
  return estimateStateShare(state, US_RARE_DISEASE_PATIENTS_TOTAL);
}

export interface NationalConditionCount {
  label: string;
  usCount: number;
  sourceUrl: string;
  sourceLabel: string;
}

/**
 * National headcounts for major conditions medicine manages but cannot cure.
 * State figures are the state's population share of these counts.
 */
export const NATIONAL_CONDITION_COUNTS: NationalConditionCount[] = [
  {
    label: "Diabetes",
    usCount: 40_000_000,
    sourceUrl: "https://diabetes.org/about-diabetes/statistics/about-diabetes",
    sourceLabel: "American Diabetes Association, 2023 CDC data",
  },
  {
    label: "Chronic kidney disease",
    usCount: 35_500_000,
    sourceUrl:
      "https://www.niddk.nih.gov/health-information/health-statistics/kidney-disease",
    sourceLabel: "NIDDK",
  },
  {
    label: "Rare diseases",
    usCount: US_RARE_DISEASE_PATIENTS_TOTAL,
    sourceUrl: "https://www.gao.gov/products/gao-25-106774",
    sourceLabel: "GAO, 2025",
  },
  {
    label: "Major depression (past year)",
    usCount: 21_000_000,
    sourceUrl: "https://www.nimh.nih.gov/health/statistics/major-depression",
    sourceLabel: "NIMH, 2021",
  },
  {
    label: "Living with or after cancer",
    usCount: 18_100_000,
    sourceUrl: "https://www.cancer.gov/about-cancer/understanding/statistics",
    sourceLabel: "National Cancer Institute, 2022",
  },
  {
    label: "COPD",
    usCount: 11_700_000,
    sourceUrl:
      "https://www.lung.org/lung-health-diseases/lung-disease-lookup/copd/learn-about-copd",
    sourceLabel: "American Lung Association",
  },
  {
    label: "Alzheimer's disease",
    usCount: 7_400_000,
    sourceUrl: "https://www.alz.org/alzheimers-dementia/facts-figures",
    sourceLabel: "Alzheimer's Association, 2026",
  },
];

/** Round to two significant figures for honest approximate display. */
export function formatPeopleApprox(count: number): string {
  if (count >= 950_000) {
    const millions = count / 1_000_000;
    const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
    return `${rounded} million`;
  }
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(count)) - 1);
  return (Math.round(count / magnitude) * magnitude).toLocaleString("en-US");
}
