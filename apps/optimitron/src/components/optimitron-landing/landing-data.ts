import { listGovernmentLeaders } from "@optimitron/data/datasets/government-leaders";
import type { PolicyReportPolicy } from "@optimitron/opg";
import { deduplicateEfficiencyCategories } from "@/lib/analysis-products";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";
import { policyDisplayName } from "@/lib/policy-presentation";

export interface PolicySample {
  category: string;
  evidenceKind: PolicyReportPolicy["evidenceKind"];
  name: string;
  recommendation: string;
  status: string;
}

export interface SpendingBenchmark {
  bestCountry: string;
  bestPerCapita: number;
  field: string;
  overspendRatio: number;
  usPerCapita: number;
}

export interface TaskTreeNode {
  depth: number;
  /** The node whose assignee line cycles through heads of government. */
  signers?: boolean;
  taskKey: string;
  title: string;
}

export interface Signer {
  country: string;
  name: string;
}

const POLICY_SAMPLE_SIZE = 6;

/** A name-ordered sample; proposals and comparisons have no causal ranking. */
export function getPolicySample(): { policies: PolicySample[]; total: number } {
  const policies = [...usPolicyAnalysis.policies]
    .sort((left, right) => policyDisplayName(left).localeCompare(policyDisplayName(right)))
    .slice(0, POLICY_SAMPLE_SIZE)
    .map((policy) => ({
      category: policy.category.replace(/_/g, " "),
      evidenceKind: policy.evidenceKind,
      name: policyDisplayName(policy),
      recommendation: policy.recommendationType.replace(/_/g, " "),
      status: policy.currentStatus,
    }));
  return { policies, total: usPolicyAnalysis.policies.length };
}

/**
 * One descriptive comparison per national spending field. Several federal
 * lines share a field, and fields can overlap, so these rows are not additive.
 */
export function getSpendingBenchmarks(): SpendingBenchmark[] {
  const byField = new Map<string, SpendingBenchmark>();
  for (const category of deduplicateEfficiencyCategories()) {
    const benchmark = category.oecdBenchmark;
    const efficiency = category.efficiency;
    if (!benchmark || !efficiency || byField.has(benchmark.spendingField)) continue;
    byField.set(benchmark.spendingField, {
      bestCountry: efficiency.bestCountry.name,
      bestPerCapita: efficiency.bestCountry.spendingPerCapita,
      field: benchmark.fieldLabel,
      overspendRatio: efficiency.overspendRatio,
      usPerCapita: efficiency.spendingPerCapita,
    });
  }
  return [...byField.values()].sort((left, right) => right.overspendRatio - left.overspendRatio);
}

/**
 * One path through the Optimize Earth task tree, from the goal down to the
 * treaty tasks: every mission, End War's programs, and the treaty's tasks.
 *
 * Copied, not imported: the tree lives in `@optimitron/db/managed-data`,
 * whose entry point also loads the seed-sync code. `landing-data.test.ts`
 * fails when a title or parent here stops matching the tree.
 */
export const TASK_TREE_PATH: readonly TaskTreeNode[] = [
  { depth: 0, taskKey: "program:optimize-earth", title: "Optimize Earth" },
  { depth: 1, taskKey: "mission:end-war", title: "End War" },
  { depth: 2, taskKey: "program:end-war-and-disease", title: "End War and Disease" },
  { depth: 2, taskKey: "program:court-of-humanity:establish", title: "Establish the Court of Humanity" },
  { depth: 2, taskKey: "program:one-percent-treaty:ratify", title: "Ratify the 1% Treaty" },
  { depth: 3, taskKey: "program:one-percent-treaty:majority-vote", title: "Get a majority of humanity to vote yes" },
  {
    depth: 3,
    signers: true,
    taskKey: "program:one-percent-treaty:heads-of-government",
    title: "Get 193 heads of government to sign",
  },
  { depth: 3, taskKey: "program:earth-optimization-prize", title: "Fund the referendum: the Earth Optimization Prize" },
  { depth: 2, taskKey: "program:eos:capitalize", title: "Build and capitalize a public-welfare investment company" },
  { depth: 1, taskKey: "mission:end-disease", title: "End Disease" },
  { depth: 1, taskKey: "mission:end-poverty", title: "End Poverty" },
  { depth: 1, taskKey: "mission:prevent-extinction", title: "Prevent Extinction" },
  { depth: 1, taskKey: "mission:minimize-animal-suffering", title: "Minimize Animal Suffering" },
];

/** Heads of government with a sourced name, in the dataset's order. */
export function getTreatySigners(): Signer[] {
  return listGovernmentLeaders().flatMap((leader) =>
    leader.leaderSourceRef != null && leader.leaderName != null
      ? [{ country: leader.countryName, name: leader.leaderName }]
      : [],
  );
}
