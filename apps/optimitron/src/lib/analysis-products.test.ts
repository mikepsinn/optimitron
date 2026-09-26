import { describe, expect, it } from "vitest";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import {
  deduplicateEfficiencyCategories,
  getNationalBudgetComparisons,
  getOptimizationDividendSummary,
} from "./analysis-products";

describe("national budget comparisons", () => {
  it("shows the five spending fields once instead of repeating their national gaps on federal lines", () => {
    const comparisons = getNationalBudgetComparisons();
    expect(comparisons.map((row) => row.spendingField).sort()).toEqual([
      "educationSpendingPerCapitaPpp",
      "healthSpendingPerCapitaPpp",
      "militarySpendingPerCapitaPpp",
      "rdSpendingPerCapitaPpp",
      "socialSpendingPerCapitaPpp",
    ]);
    expect(comparisons.find((row) => row.spendingField === "healthSpendingPerCapitaPpp")!.relatedCategories.map((row) => row.id))
      .toEqual(expect.arrayContaining(["health_discretionary", "veterans_affairs"]));
    expect(comparisons.find((row) => row.spendingField === "militarySpendingPerCapitaPpp")!.relatedCategories.map((row) => row.id))
      .toEqual(expect.arrayContaining(["military", "homeland_security"]));
  });

  it("keeps one consistent social outcome regardless of row order or the largest reported gap", () => {
    const transportation = usBudgetAnalysis.categories.find((row) => row.id === "transportation")!;
    const justice = usBudgetAnalysis.categories.find((row) => row.id === "justice")!;
    const inflatedJustice = {
      ...justice,
      efficiency: {
        ...usBudgetAnalysis.categories.find((row) => row.efficiency)!.efficiency!,
        outcomeName: "Life Expectancy",
        potentialSavingsTotal: 1e15,
      },
    };

    for (const rows of [[transportation, inflatedJustice], [inflatedJustice, transportation]]) {
      const comparisons = getNationalBudgetComparisons(rows);
      expect(comparisons).toHaveLength(1);
      expect(comparisons[0]!.category.id).toBe("transportation");
    }
  });

  it("does not invent scope or substitute a different outcome when data are missing", () => {
    const transportation = usBudgetAnalysis.categories.find((row) => row.id === "transportation")!;
    const justice = usBudgetAnalysis.categories.find((row) => row.id === "justice")!;
    const rows = [
      { ...transportation, efficiency: undefined },
      justice,
      { ...justice, id: "unknown-scope", oecdBenchmark: undefined },
    ];
    expect(getNationalBudgetComparisons(rows)).toHaveLength(1);
    expect(deduplicateEfficiencyCategories(rows)).toEqual([]);
  });
});

describe("optimization dividend", () => {
  it("does not add overlapping national gaps or turn them into household payments", () => {
    expect(getOptimizationDividendSummary(usBudgetAnalysis.categories)).toBeNull();
  });

  it("does not treat the old line-share rule or a peer target as fiscal eligibility", () => {
    const military = usBudgetAnalysis.categories.find((row) => row.id === "military")!;
    expect(getOptimizationDividendSummary([{
      ...military,
      optimalSpendingNominal: military.currentSpending / 5,
      oecdBenchmark: { ...military.oecdBenchmark!, scope: "category_specific", lineShareOfField: 1 },
    }])).toBeNull();
  });

  it("reports an unavailable estimate rather than a zero dividend for missing evidence", () => {
    expect(getOptimizationDividendSummary([])).toBeNull();
  });
});
