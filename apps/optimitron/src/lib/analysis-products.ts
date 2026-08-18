import { usBudgetAnalysis } from "@/data/us-budget-analysis";

type BudgetCategoryOutput = (typeof usBudgetAnalysis.categories)[number];
export type BudgetCategoryWithEfficiency = BudgetCategoryOutput & {
  efficiency: NonNullable<BudgetCategoryOutput["efficiency"]>;
};

export const US_ADULT_POPULATION = 258_000_000;

export const BUDGET_LEGISLATION_SLUGS: Record<string, string> = {
  military: "military-reform",
  health_discretionary: "health-non-medicare-medicaid-reform",
  education: "education-reform",
  science_nasa: "science-nasa-reform",
};

const EFFICIENCY_GROUPS: Record<string, string> = {
  medicare: "health",
  medicaid: "health",
  health_discretionary: "health",
  military: "military",
  social_security: "social",
  education: "education",
  science_nasa: "science",
};

const EFFICIENCY_LABELS: Record<string, string> = {
  health: "Healthcare",
  military: "Military",
  social: "Social Programs",
  education: "Education",
  science: "Science & Space",
};

export interface OptimizationDividendRow {
  category: BudgetCategoryWithEfficiency;
  label: string;
  legislationSlug?: string;
  modelCountry: string;
  overspendRatio: number;
  annualSavingsTotal: number;
  annualSavingsPerAdult: number;
  monthlySavingsPerAdult: number;
}

function getEfficiencyGroup(category: BudgetCategoryOutput): string {
  return EFFICIENCY_GROUPS[category.id] ?? category.id;
}

function hasEfficiency(category: BudgetCategoryOutput): category is BudgetCategoryWithEfficiency {
  return category.efficiency !== null;
}

export function getBudgetCategoriesWithEfficiency(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
): BudgetCategoryWithEfficiency[] {
  return categories.filter(hasEfficiency);
}

export function deduplicateEfficiencyCategories(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
): BudgetCategoryWithEfficiency[] {
  const grouped = new Map<string, BudgetCategoryWithEfficiency>();

  for (const category of getBudgetCategoriesWithEfficiency(categories)) {
    const group = getEfficiencyGroup(category);
    const current = grouped.get(group);

    if (!current) {
      grouped.set(group, category);
      continue;
    }

    const currentScore =
      current.efficiency.potentialSavingsTotal +
      (BUDGET_LEGISLATION_SLUGS[current.id] ? 1e15 : 0);
    const nextScore =
      category.efficiency.potentialSavingsTotal +
      (BUDGET_LEGISLATION_SLUGS[category.id] ? 1e15 : 0);

    if (nextScore > currentScore) {
      grouped.set(group, category);
    }
  }

  return [...grouped.values()];
}

export function getOptimizationDividendBreakdown(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
  adults: number = US_ADULT_POPULATION,
): OptimizationDividendRow[] {
  return deduplicateEfficiencyCategories(categories)
    .map((category) => {
      const group = getEfficiencyGroup(category);
      const annualSavingsPerAdult = Math.round(category.efficiency.potentialSavingsTotal / adults);

      return {
        category,
        label: EFFICIENCY_LABELS[group] ?? category.name,
        legislationSlug: BUDGET_LEGISLATION_SLUGS[category.id],
        modelCountry: category.efficiency.bestCountry.name,
        overspendRatio: category.efficiency.overspendRatio,
        annualSavingsTotal: category.efficiency.potentialSavingsTotal,
        annualSavingsPerAdult,
        monthlySavingsPerAdult: Math.round(annualSavingsPerAdult / 12),
      };
    })
    .sort((left, right) => right.annualSavingsTotal - left.annualSavingsTotal);
}

export function getOptimizationDividendSummary(
  categories: readonly BudgetCategoryOutput[] = usBudgetAnalysis.categories,
  adults: number = US_ADULT_POPULATION,
) {
  const breakdown = getOptimizationDividendBreakdown(categories, adults);
  const annualTotal = breakdown.reduce((sum, row) => sum + row.annualSavingsTotal, 0);
  const annualPerAdult = Math.round(annualTotal / adults);

  return {
    breakdown,
    annualTotal,
    annualPerAdult,
    monthlyPerAdult: Math.round(annualPerAdult / 12),
  };
}
