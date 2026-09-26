import { usBudgetAnalysis } from "@/data/us-budget-analysis";

type BudgetCategoryOutput = (typeof usBudgetAnalysis.categories)[number];
export type BudgetCategoryWithEfficiency = BudgetCategoryOutput & {
  efficiency: NonNullable<BudgetCategoryOutput["efficiency"]>;
};

// Select a consistent outcome independently of the spending gap. Social spending
// also appeared against life expectancy on justice/environment rows; that must
// not silently replace a missing income comparison.
const COMPARISON_CATEGORY: Record<string, string> = {
  militarySpendingPerCapitaPpp: "military",
  healthSpendingPerCapitaPpp: "health_discretionary",
  educationSpendingPerCapitaPpp: "education",
  rdSpendingPerCapitaPpp: "science_nasa",
  socialSpendingPerCapitaPpp: "transportation",
};

export interface NationalBudgetComparison {
  spendingField: string;
  label: string;
  category: BudgetCategoryOutput;
  relatedCategories: BudgetCategoryOutput[];
}

export function getNationalBudgetComparisons(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
): NationalBudgetComparison[] {
  const grouped = new Map<string, BudgetCategoryOutput[]>();
  for (const category of categories) {
    const field = category.oecdBenchmark?.spendingField;
    if (!field) continue;
    const group = grouped.get(field) ?? [];
    group.push(category);
    grouped.set(field, group);
  }

  return [...grouped.entries()].map(([spendingField, relatedCategories]) => {
    const sorted = [...relatedCategories].sort((a, b) => a.id.localeCompare(b.id));
    const category = sorted.find((row) => row.id === COMPARISON_CATEGORY[spendingField]) ?? sorted[0]!;
    return {
      spendingField,
      label: category.oecdBenchmark!.fieldLabel,
      category,
      relatedCategories: sorted,
    };
  });
}

export function deduplicateEfficiencyCategories(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
): BudgetCategoryWithEfficiency[] {
  return getNationalBudgetComparisons(categories)
    .map((comparison) => comparison.category)
    .filter((category): category is BudgetCategoryWithEfficiency => category.efficiency != null);
}

/**
 * Peer spending differences are neither causal fiscal savings nor distributable
 * revenue. Fields overlap and mix public/private and federal/local spending.
 * Even a category-specific comparison cannot establish a cash dividend.
 */
export function getOptimizationDividendSummary(
  _categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
): null {
  return null;
}
