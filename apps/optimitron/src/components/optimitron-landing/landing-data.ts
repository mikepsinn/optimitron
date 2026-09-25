import { listGovernmentLeaders } from "@optimitron/data/datasets/government-leaders";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import { usPolicyAnalysis } from "@/data/us-policy-analysis";

export interface GradedPolicy {
  category: string;
  confidence: number;
  grade: string;
  healthEffect: number;
  incomeEffect: number;
  name: string;
  recommendation: string;
  status: string;
}

export interface BudgetLine {
  /** The cheapest top-quarter country the optimal is scaled from. */
  benchmarkCountry: string;
  current: number;
  name: string;
  optimal: number;
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
const GRADE_ORDER = ["A", "B", "C", "D", "F"];

/** The best-graded policies, strongest first, for the generator tile. */
export function getGradedPolicySample(): { policies: GradedPolicy[]; total: number } {
  const policies = [...usPolicyAnalysis.policies]
    .sort(
      (left, right) =>
        GRADE_ORDER.indexOf(left.evidenceGrade) - GRADE_ORDER.indexOf(right.evidenceGrade) ||
        right.policyImpactScore - left.policyImpactScore,
    )
    .slice(0, POLICY_SAMPLE_SIZE)
    .map((policy) => ({
      category: policy.category.replace(/_/g, " "),
      confidence: policy.causalConfidenceScore,
      grade: policy.evidenceGrade,
      healthEffect: policy.healthEffect,
      incomeEffect: policy.incomeEffect,
      name: policy.name,
      recommendation: policy.recommendationType.replace(/_/g, " "),
      status: policy.currentStatus,
    }));
  return { policies, total: usPolicyAnalysis.policies.length };
}

/**
 * One row per cross-country spending field: US spending per person against
 * the most efficient country with an equal or better outcome. Several budget
 * lines share a field, so rows come from fields, not lines.
 */
export function getSpendingBenchmarks(): SpendingBenchmark[] {
  const byField = new Map<string, SpendingBenchmark>();
  for (const category of usBudgetAnalysis.categories) {
    const benchmark = category.oecdBenchmark;
    const efficiency = category.efficiency;
    if (!benchmark || !efficiency || byField.has(benchmark.spendingField)) continue;
    byField.set(benchmark.spendingField, {
      bestCountry: efficiency.bestCountry.name,
      bestPerCapita: efficiency.bestCountry.spendingPerCapita,
      // "Public social spending (pensions, ...)" -> "Public social spending"
      field: benchmark.fieldLabel.replace(/\s*\(.*\)$/, ""),
      overspendRatio: efficiency.overspendRatio,
      usPerCapita: efficiency.spendingPerCapita,
    });
  }
  return [...byField.values()].sort((left, right) => right.overspendRatio - left.overspendRatio);
}

/** Budget lines a benchmark measures directly, so they have an optimal level. */
export function getMeasuredBudgetLines(): BudgetLine[] {
  return usBudgetAnalysis.categories.flatMap((category) =>
    category.optimalSpendingNominal == null
      ? []
      : [
          {
            benchmarkCountry: category.efficiency?.bestCountry.name ?? "the benchmark",
            current: category.currentSpending,
            name: category.name,
            optimal: category.optimalSpendingNominal,
          },
        ],
  );
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
