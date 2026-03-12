import type { BudgetCategoryId } from "@/lib/wishocracy-data";

export type AlignmentBenchmarkSourceType =
  | "curated_real"
  | "congress_partial"
  | "congress_sync";

export interface AlignmentBenchmarkProfile {
  politicianId: string;
  externalId?: string;
  name: string;
  party: string;
  title: string;
  district?: string;
  chamber?: string;
  summary: string;
  sourceType: AlignmentBenchmarkSourceType;
  sourceLabel: string;
  sourceNote: string;
  categoriesCovered?: number;
  lastSyncedAt?: string;
  rollCallCount?: number;
  allocations: Record<BudgetCategoryId, number>;
}

export const ALIGNMENT_BENCHMARK_SOURCE_NOTE =
  "These are real current federal politicians benchmarked against Optomitron's budget categories. When enough recent classified Congress roll calls are available, the profile is derived from legislative behavior; otherwise Optomitron falls back to a curated public-position benchmark.";

export const ALIGNMENT_BENCHMARKS: AlignmentBenchmarkProfile[] = [
  {
    politicianId: "bernie-sanders",
    externalId: "S000033",
    name: "Bernie Sanders",
    party: "Independent",
    title: "Senator",
    district: "Vermont",
    chamber: "senate",
    summary:
      "Maximizes research, treatment, and early-life investment while sharply reducing military and enforcement priorities.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID S000033. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 22,
      ADDICTION_TREATMENT: 18,
      EARLY_CHILDHOOD_EDUCATION: 17,
      DRUG_WAR_ENFORCEMENT: 4,
      ICE_IMMIGRATION_ENFORCEMENT: 3,
      FARM_SUBSIDIES_AGRIBUSINESS: 7,
      FOSSIL_FUEL_SUBSIDIES: 4,
      NUCLEAR_WEAPONS_MODERNIZATION: 4,
      PRISON_CONSTRUCTION: 6,
      MILITARY_OPERATIONS: 15,
    },
  },
  {
    politicianId: "elizabeth-warren",
    externalId: "W000817",
    name: "Elizabeth Warren",
    party: "Democratic",
    title: "Senator",
    district: "Massachusetts",
    chamber: "senate",
    summary:
      "Progressive redistributive posture that strongly favors education, treatment, and anti-capture cuts to fossil and defense spending.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID W000817. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 19,
      ADDICTION_TREATMENT: 17,
      EARLY_CHILDHOOD_EDUCATION: 18,
      DRUG_WAR_ENFORCEMENT: 5,
      ICE_IMMIGRATION_ENFORCEMENT: 4,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 3,
      NUCLEAR_WEAPONS_MODERNIZATION: 5,
      PRISON_CONSTRUCTION: 7,
      MILITARY_OPERATIONS: 14,
    },
  },
  {
    politicianId: "chris-murphy",
    externalId: "M001169",
    name: "Chris Murphy",
    party: "Democratic",
    title: "Senator",
    district: "Connecticut",
    chamber: "senate",
    summary:
      "Reallocation-focused center-left profile that still funds defense, but tilts harder toward treatment and education than the caucus median.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID M001169. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 17,
      ADDICTION_TREATMENT: 16,
      EARLY_CHILDHOOD_EDUCATION: 15,
      DRUG_WAR_ENFORCEMENT: 6,
      ICE_IMMIGRATION_ENFORCEMENT: 5,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 5,
      NUCLEAR_WEAPONS_MODERNIZATION: 7,
      PRISON_CONSTRUCTION: 8,
      MILITARY_OPERATIONS: 13,
    },
  },
  {
    politicianId: "susan-collins",
    externalId: "C001035",
    name: "Susan Collins",
    party: "Republican",
    title: "Senator",
    district: "Maine",
    chamber: "senate",
    summary:
      "Moderate Republican benchmark that keeps defense and enforcement meaningful but leaves room for treatment and education.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID C001035. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 11,
      ADDICTION_TREATMENT: 10,
      EARLY_CHILDHOOD_EDUCATION: 8,
      DRUG_WAR_ENFORCEMENT: 9,
      ICE_IMMIGRATION_ENFORCEMENT: 9,
      FARM_SUBSIDIES_AGRIBUSINESS: 10,
      FOSSIL_FUEL_SUBSIDIES: 9,
      NUCLEAR_WEAPONS_MODERNIZATION: 10,
      PRISON_CONSTRUCTION: 9,
      MILITARY_OPERATIONS: 15,
    },
  },
  {
    politicianId: "ted-cruz",
    externalId: "C001098",
    name: "Ted Cruz",
    party: "Republican",
    title: "Senator",
    district: "Texas",
    chamber: "senate",
    summary:
      "Conservative benchmark centered on military, immigration enforcement, fossil energy, and carceral priorities.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID C001098. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 5,
      ADDICTION_TREATMENT: 4,
      EARLY_CHILDHOOD_EDUCATION: 5,
      DRUG_WAR_ENFORCEMENT: 14,
      ICE_IMMIGRATION_ENFORCEMENT: 15,
      FARM_SUBSIDIES_AGRIBUSINESS: 12,
      FOSSIL_FUEL_SUBSIDIES: 14,
      NUCLEAR_WEAPONS_MODERNIZATION: 12,
      PRISON_CONSTRUCTION: 8,
      MILITARY_OPERATIONS: 11,
    },
  },
  {
    politicianId: "josh-hawley",
    externalId: "H001089",
    name: "Josh Hawley",
    party: "Republican",
    title: "Senator",
    district: "Missouri",
    chamber: "senate",
    summary:
      "National-conservative benchmark that combines higher enforcement and prison spending with selective family-oriented domestic investment.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID H001089. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 7,
      ADDICTION_TREATMENT: 7,
      EARLY_CHILDHOOD_EDUCATION: 13,
      DRUG_WAR_ENFORCEMENT: 13,
      ICE_IMMIGRATION_ENFORCEMENT: 12,
      FARM_SUBSIDIES_AGRIBUSINESS: 11,
      FOSSIL_FUEL_SUBSIDIES: 10,
      NUCLEAR_WEAPONS_MODERNIZATION: 10,
      PRISON_CONSTRUCTION: 10,
      MILITARY_OPERATIONS: 7,
    },
  },
  {
    politicianId: "alexandria-ocasio-cortez",
    externalId: "O000172",
    name: "Alexandria Ocasio-Cortez",
    party: "Democratic",
    title: "Representative",
    district: "New York-14",
    chamber: "house",
    summary:
      "Progressive House benchmark that pushes hard toward early-life investment, treatment, and research while rejecting higher immigration enforcement and fossil priorities.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID O000172. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 20,
      ADDICTION_TREATMENT: 17,
      EARLY_CHILDHOOD_EDUCATION: 19,
      DRUG_WAR_ENFORCEMENT: 3,
      ICE_IMMIGRATION_ENFORCEMENT: 3,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 4,
      NUCLEAR_WEAPONS_MODERNIZATION: 3,
      PRISON_CONSTRUCTION: 6,
      MILITARY_OPERATIONS: 17,
    },
  },
  {
    politicianId: "ro-khanna",
    externalId: "K000389",
    name: "Ro Khanna",
    party: "Democratic",
    title: "Representative",
    district: "California-17",
    chamber: "house",
    summary:
      "Tech-progressive House benchmark that is especially research-forward, treatment-forward, and skeptical of higher military, fossil, and immigration-enforcement allocations.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID K000389. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 24,
      ADDICTION_TREATMENT: 14,
      EARLY_CHILDHOOD_EDUCATION: 15,
      DRUG_WAR_ENFORCEMENT: 4,
      ICE_IMMIGRATION_ENFORCEMENT: 4,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 5,
      NUCLEAR_WEAPONS_MODERNIZATION: 4,
      PRISON_CONSTRUCTION: 5,
      MILITARY_OPERATIONS: 17,
    },
  },
  {
    politicianId: "greg-casar",
    externalId: "C001131",
    name: "Greg Casar",
    party: "Democratic",
    title: "Representative",
    district: "Texas-35",
    chamber: "house",
    summary:
      "Movement-progressive House benchmark that strongly favors education, treatment, and anti-carceral reallocation while keeping immigration enforcement especially low.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID C001131. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 18,
      ADDICTION_TREATMENT: 17,
      EARLY_CHILDHOOD_EDUCATION: 19,
      DRUG_WAR_ENFORCEMENT: 4,
      ICE_IMMIGRATION_ENFORCEMENT: 2,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 4,
      NUCLEAR_WEAPONS_MODERNIZATION: 4,
      PRISON_CONSTRUCTION: 5,
      MILITARY_OPERATIONS: 19,
    },
  },
  {
    politicianId: "pete-aguilar",
    externalId: "A000371",
    name: "Pete Aguilar",
    party: "Democratic",
    title: "Representative",
    district: "California-33",
    chamber: "house",
    summary:
      "Leadership-aligned House Democrat benchmark that still tilts clearly toward domestic investment, but less sharply than the progressive flank.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID A000371. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 15,
      ADDICTION_TREATMENT: 14,
      EARLY_CHILDHOOD_EDUCATION: 13,
      DRUG_WAR_ENFORCEMENT: 6,
      ICE_IMMIGRATION_ENFORCEMENT: 6,
      FARM_SUBSIDIES_AGRIBUSINESS: 8,
      FOSSIL_FUEL_SUBSIDIES: 6,
      NUCLEAR_WEAPONS_MODERNIZATION: 7,
      PRISON_CONSTRUCTION: 7,
      MILITARY_OPERATIONS: 18,
    },
  },
  {
    politicianId: "dan-crenshaw",
    externalId: "C001120",
    name: "Dan Crenshaw",
    party: "Republican",
    title: "Representative",
    district: "Texas-2",
    chamber: "house",
    summary:
      "Hawkish House Republican benchmark centered on military, immigration enforcement, fossil energy, and other hard-power priorities.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID C001120. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 8,
      ADDICTION_TREATMENT: 6,
      EARLY_CHILDHOOD_EDUCATION: 6,
      DRUG_WAR_ENFORCEMENT: 10,
      ICE_IMMIGRATION_ENFORCEMENT: 11,
      FARM_SUBSIDIES_AGRIBUSINESS: 9,
      FOSSIL_FUEL_SUBSIDIES: 10,
      NUCLEAR_WEAPONS_MODERNIZATION: 12,
      PRISON_CONSTRUCTION: 8,
      MILITARY_OPERATIONS: 20,
    },
  },
  {
    politicianId: "kat-cammack",
    externalId: "C001039",
    name: "Kat Cammack",
    party: "Republican",
    title: "Representative",
    district: "Florida-3",
    chamber: "house",
    summary:
      "Conservative House benchmark with especially strong immigration and fossil-energy emphasis, plus consistently elevated military and enforcement posture.",
    sourceType: "curated_real",
    sourceLabel: "Current federal benchmark profile",
    sourceNote:
      "Identity keyed to Bioguide ID C001039. Budget posture is Optomitron's category coding of current public priorities.",
    allocations: {
      PRAGMATIC_CLINICAL_TRIALS: 6,
      ADDICTION_TREATMENT: 5,
      EARLY_CHILDHOOD_EDUCATION: 6,
      DRUG_WAR_ENFORCEMENT: 11,
      ICE_IMMIGRATION_ENFORCEMENT: 14,
      FARM_SUBSIDIES_AGRIBUSINESS: 10,
      FOSSIL_FUEL_SUBSIDIES: 12,
      NUCLEAR_WEAPONS_MODERNIZATION: 10,
      PRISON_CONSTRUCTION: 8,
      MILITARY_OPERATIONS: 18,
    },
  },
];
