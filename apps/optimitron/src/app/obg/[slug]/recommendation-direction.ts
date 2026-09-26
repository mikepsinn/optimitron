import type { BudgetReportCategory } from "@optimitron/obg";

export type RecommendationDirection = "decrease" | "increase" | "neutral";

export function recommendationDirection(
  category: Pick<
    BudgetReportCategory,
    "currentSpending" | "optimalSpendingNominal" | "recommendation"
  >,
): RecommendationDirection {
  // No line-specific benchmark means no optimal and no direction to move.
  if (category.optimalSpendingNominal == null) return "neutral";

  const action = category.recommendation.toLowerCase();

  if (action.includes("maintain")) return "neutral";
  if (action.includes("decrease")) return "decrease";
  if (action.includes("increase") || action === "scale_up") return "increase";

  if (category.currentSpending === category.optimalSpendingNominal) {
    return "neutral";
  }

  return category.currentSpending > category.optimalSpendingNominal
    ? "decrease"
    : "increase";
}
