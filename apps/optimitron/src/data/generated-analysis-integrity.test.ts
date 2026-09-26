import { describe, expect, it } from "vitest";
import { getBestAvailableMedianIncomeSeries } from "@optimitron/data/datasets/median-income-series";
import { usBudgetAnalysis } from "./us-budget-analysis";
import { usPolicyAnalysis } from "./us-policy-analysis";

/**
 * Guards the shipped output of scripts/generate-web-data.ts. Several federal
 * lines borrow one broad OECD field (e.g. total health spending, public and
 * private). The field's national figures must never be reported as a line's.
 */

function usdAmounts(text: string): number[] {
  return [...text.matchAll(/\$([\d.]+)([BT])\/yr/g)].map(
    ([, value, unit]) => Number(value) * (unit === "T" ? 1e12 : 1e9),
  );
}

describe("generated budget and policy analysis", () => {
  it("emits at most one efficiency policy per OECD spending field", () => {
    const fields = usPolicyAnalysis.policies.flatMap((policy) =>
      policy.oecdSpendingField ? [policy.oecdSpendingField] : [],
    );

    expect(fields.length).toBeGreaterThan(0);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it("never states savings for a federal line above that line's spending", () => {
    for (const recommendation of usBudgetAnalysis.topRecommendations) {
      const line = usBudgetAnalysis.categories.find((category) =>
        recommendation.startsWith(`${category.name}:`),
      );
      if (!line) continue; // A labeled national comparison, not a line.

      expect(line.oecdBenchmark?.scope, recommendation).toBe("category_specific");
      for (const amount of usdAmounts(recommendation)) {
        expect(amount, recommendation).toBeLessThanOrEqual(line.currentSpending);
      }
    }
  });

  // The series runs oldest year first, so index 0 is 1981 ($10,382). Dividing a
  // per-household dividend by that per-person income inflated every effect.
  it("divides each per-person dividend by the latest measured per-person median income", () => {
    const measured = getBestAvailableMedianIncomeSeries({
      jurisdictions: ["USA"],
      isAfterTax: true,
      purchasingPower: "ppp",
      excludeInterpolated: true,
    });
    const latestMedianIncome = Math.round(measured[measured.length - 1]!.value);
    const efficiencyPolicies = usPolicyAnalysis.policies.filter(
      (policy) => policy.oecdSpendingField,
    );

    expect(efficiencyPolicies.length).toBeGreaterThan(0);
    for (const policy of efficiencyPolicies) {
      const dividend = policy.rationale.match(/\$([\d,]+)\/person\/yr/);
      expect(dividend, policy.name).not.toBeNull();
      const dividendPerPerson = Number(dividend![1]!.replace(/,/g, ""));
      expect(policy.incomeEffect, policy.name).toBeCloseTo(
        dividendPerPerson / latestMedianIncome,
        3,
      );
    }
  });

  it("gives an optimal only to lines whose OECD field measures the line itself", () => {
    for (const category of usBudgetAnalysis.categories) {
      if (category.oecdBenchmark?.scope === "category_specific") {
        expect(category.optimalSpendingNominal, category.id).not.toBeNull();
        expect(category.gap, category.id).toBeLessThanOrEqual(category.currentSpending);
      } else {
        expect(category.optimalSpendingNominal, category.id).toBeNull();
      }
    }
  });
});
