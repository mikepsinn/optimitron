/**
 * Maps OPG policy categories/names to relevant natural experiments
 * and international comparison datasets for the detail pages.
 */

import { naturalExperimentsData } from "@/data/natural-experiments";
import { NATURAL_EXPERIMENTS } from "@optimitron/data";
import {
  DRUG_POLICY_COMPARISON,
  HEALTH_SYSTEM_COMPARISON,
  EDUCATION_COMPARISON,
  CRIMINAL_JUSTICE_COMPARISON,
  type CountryDrugPolicy,
  type CountryHealthData,
  type CountryEducationData,
  type CountryCriminalJustice,
} from "@optimitron/data/datasets/international-comparisons";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface MatchedExperiment {
  /** Computed stats (correlation, p-value, effect size, etc.) */
  computed: (typeof naturalExperimentsData.experiments)[number];
  /** Raw year-by-year time-series data for charts */
  timeSeries: (typeof NATURAL_EXPERIMENTS)[number];
}

export type ComparisonType = "drug" | "health" | "education" | "criminal_justice";

export interface MatchedComparison {
  type: ComparisonType;
  label: string;
  data: CountryDrugPolicy[] | CountryHealthData[] | CountryEducationData[] | CountryCriminalJustice[];
}

export interface PolicyEvidence {
  experiments: MatchedExperiment[];
  comparison: MatchedComparison | null;
}

/* ------------------------------------------------------------------ */
/*  Experiment name mapping                                           */
/* ------------------------------------------------------------------ */

/**
 * Maps policy name keywords → natural experiment policy names.
 * Checked against both the policy name and description.
 */
const POLICY_EXPERIMENT_MAP: Record<string, string[]> = {
  // Drug-related policies
  "drug policy": ["Drug Decriminalization", "Supervised Drug Injection Facilities", "Cannabis Legalization and Regulation"],
  "drug decrim": ["Drug Decriminalization"],
  "cannabis": ["Cannabis Legalization and Regulation"],

  // Health-related
  "healthcare": ["Universal Healthcare with Market Competition (3M System)", "Universal Healthcare (CCSS + EBAIS primary care)", "Community Health Worker (CHW) Program"],
  "clinical trial": ["Universal Healthcare with Market Competition (3M System)"],

  // Military / firearms
  "firearms": ["National Firearms Agreement (Gun Buyback)"],
  "gun": ["National Firearms Agreement (Gun Buyback)"],

  // Justice
  "prison": ["Rehabilitative Prison System"],
  "justice": ["Rehabilitative Prison System"],
  "law enforcement": ["Rehabilitative Prison System"],

  // Environment / energy
  "carbon": ["Revenue-Neutral Carbon Tax"],
  "energy": ["Revenue-Neutral Carbon Tax"],

  // Infrastructure
  "broadband": ["National Broadband Infrastructure Investment"],
  "cycling": ["Urban Cycling Infrastructure Investment"],
  "transportation": ["Urban Cycling Infrastructure Investment"],
};

/**
 * Maps policy categories → comparison datasets
 */
const CATEGORY_COMPARISON_MAP: Record<string, { type: ComparisonType; label: string }> = {
  health: { type: "health", label: "Health Systems by Country" },
  health_research: { type: "health", label: "Health Systems by Country" },
  health_non_medicare_medicaid_: { type: "health", label: "Health Systems by Country" },
  veterans_affairs: { type: "health", label: "Health Systems by Country" },
  education: { type: "education", label: "Education Outcomes by Country" },
  justice_law_enforcement: { type: "criminal_justice", label: "Criminal Justice by Country" },
};

/** Special override: drug-related policies get drug comparison instead of health */
function isDrugPolicy(name: string, description: string): boolean {
  const text = `${name} ${description}`.toLowerCase();
  return text.includes("drug") || text.includes("cannabis") || text.includes("decriminal");
}

/* ------------------------------------------------------------------ */
/*  Lookup                                                            */
/* ------------------------------------------------------------------ */

function findExperimentByPolicy(policyName: string) {
  return NATURAL_EXPERIMENTS.find((e) => e.policy === policyName) ?? null;
}

function findComputedByPolicy(policyName: string) {
  return naturalExperimentsData.experiments.find(
    (e) => e.policy === policyName,
  ) ?? null;
}

function getComparisonData(type: ComparisonType) {
  switch (type) {
    case "drug": return DRUG_POLICY_COMPARISON;
    case "health": return HEALTH_SYSTEM_COMPARISON;
    case "education": return EDUCATION_COMPARISON;
    case "criminal_justice": return CRIMINAL_JUSTICE_COMPARISON;
  }
}

/**
 * Given a policy's name, category, and description, return matched
 * natural experiments and international comparison data.
 */
export function getPolicyEvidence(
  name: string,
  category: string,
  description: string,
): PolicyEvidence {
  const searchText = `${name} ${description}`.toLowerCase();

  // Find matching experiments by keyword scanning
  const matchedExperimentNames = new Set<string>();
  for (const [keyword, experimentNames] of Object.entries(POLICY_EXPERIMENT_MAP)) {
    if (searchText.includes(keyword)) {
      for (const en of experimentNames) matchedExperimentNames.add(en);
    }
  }

  const experiments: MatchedExperiment[] = [];
  for (const expName of matchedExperimentNames) {
    const computed = findComputedByPolicy(expName);
    const timeSeries = findExperimentByPolicy(expName);
    if (computed && timeSeries) {
      experiments.push({ computed, timeSeries });
    }
  }

  // Find comparison dataset
  let comparison: MatchedComparison | null = null;
  if (isDrugPolicy(name, description)) {
    comparison = {
      type: "drug",
      label: "Drug Policy by Country",
      data: DRUG_POLICY_COMPARISON,
    };
  } else if (CATEGORY_COMPARISON_MAP[category]) {
    const { type, label } = CATEGORY_COMPARISON_MAP[category];
    comparison = { type, label, data: getComparisonData(type) };
  }

  return { experiments, comparison };
}
