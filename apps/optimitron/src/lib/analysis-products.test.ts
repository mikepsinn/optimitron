import { describe, expect, it } from "vitest";
import { usBudgetAnalysis } from "@/data/us-budget-analysis";
import {
  deduplicateEfficiencyCategories,
  getOptimizationDividendSummary,
  type BudgetCategoryWithEfficiency,
} from "./analysis-products";

const sample = usBudgetAnalysis.categories.find(category => category.efficiency)!;

function category(
  id: string,
  savings: number,
  spendingField?: string,
  lineSpendingPerCapita = 100,
): BudgetCategoryWithEfficiency {
  return {
    ...sample,
    id,
    name: `${id} budget line`,
    currentSpendingRealPerCapita: lineSpendingPerCapita,
    efficiency: { ...sample.efficiency!, spendingPerCapita: 2000, potentialSavingsTotal: savings },
    oecdBenchmark: spendingField ? {
      spendingField,
      fieldLabel: `${spendingField} national total`,
      scope: lineSpendingPerCapita >= 1000 ? "category_specific" : "national_field_proxy",
      lineShareOfField: lineSpendingPerCapita / 2000,
    } : undefined,
  };
}

describe("national efficiency and dividend totals", () => {
  it("counts a repeated field once and uses the smallest proxy savings claim", () => {
    const categories = [
      category("transportation", 900, "social"),
      category("housing", 400, "social"),
      category("labor", 600, "social"),
      category("military", 800, "military", 1900),
      category("homeland_security", 100, "military"),
    ];
    for (const input of [categories, [...categories].reverse()]) {
      const summary = getOptimizationDividendSummary(input, 10);
      expect(summary.breakdown).toHaveLength(2);
      expect(summary.annualTotal).toBe(1200);
      expect(summary.annualPerAdult).toBe(120);
      expect(summary.monthlyPerAdult).toBe(10);
      expect(summary.breakdown.map(row => [row.label, row.annualSavingsTotal])).toEqual([
        ["military national total", 800], ["social national total", 400],
      ]);
      expect(summary.breakdown[0]?.category.id).toBe("military");
      expect(summary.breakdown[0]?.category.name).toBe("military budget line");
      expect(summary.breakdown[1]?.category.id).toBe("housing");
      expect(summary.breakdown.reduce((sum, row) => sum + row.annualSavingsPerAdult, 0)).toBe(120);
    }
  });

  it("keeps legacy grouping and legislation links without field metadata", () => {
    const summary = getOptimizationDividendSummary([
      category("medicare", 900),
      category("medicaid", 700),
      category("health_discretionary", 400),
    ], 10);
    expect(summary.breakdown).toHaveLength(1);
    expect(summary.breakdown[0]).toMatchObject({
      label: "Healthcare",
      category: { id: "health_discretionary", name: "health_discretionary budget line" },
      legislationSlug: "health-non-medicare-medicaid-reform",
      annualSavingsTotal: 400,
    });
  });

  it("omits categories without an efficiency result", () => {
    expect(deduplicateEfficiencyCategories([{ ...sample, efficiency: undefined }])).toEqual([]);
  });

  it("publishes one dividend row for each bundled national spending field", () => {
    const summary = getOptimizationDividendSummary();
    const fields = summary.breakdown.map(row => row.category.oecdBenchmark!.spendingField);
    expect(fields).toHaveLength(5);
    expect(new Set(fields).size).toBe(5);
    expect(summary.breakdown.every(row => row.label === row.category.oecdBenchmark!.fieldLabel)).toBe(true);
  });
});
