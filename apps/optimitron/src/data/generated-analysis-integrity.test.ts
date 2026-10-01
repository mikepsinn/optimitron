import { describe, expect, it } from "vitest";
import { OECD_BUDGET_PANEL, OECD_CATEGORY_MAPPINGS } from "@optimitron/data";
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

  it("scales modeled dividends with observed survey income, never income derived from spending", () => {
    const measured = OECD_BUDGET_PANEL.filter(row => row.jurisdictionIso3 === "USA" && row.afterTaxMedianIncome)
      .sort((a, b) => b.year - a.year)[0]!.afterTaxMedianIncome!;
    const latestMedianIncome = Math.round(measured.value);
    expect(measured.taxScope).toBe("after_direct_taxes_and_cash_transfers");
    expect(usPolicyAnalysis.methodology?.incomeReference).toEqual(measured);
    const efficiencyPolicies = usPolicyAnalysis.policies.filter(
      (policy) => policy.oecdSpendingField,
    );

    expect(efficiencyPolicies.length).toBeGreaterThan(0);
    for (const policy of efficiencyPolicies) {
      const dividend = policy.rationale.match(/\$([\d,]+)\/person\/yr/);
      expect(dividend, policy.name).not.toBeNull();
      const dividendPerPerson = Number(dividend![1]!.replace(/,/g, ""));
      expect(policy.modeledAnnualSavingsPerPerson, policy.name).toBe(dividendPerPerson);
      expect(policy.incomeEffect, policy.name).toBeCloseTo(
        dividendPerPerson / latestMedianIncome,
        3,
      );
    }
  });

  it("uses matching observed years for the target and every displayed comparator", () => {
    for (const category of usBudgetAnalysis.categories) {
      const efficiency = category.efficiency!;
      const years = efficiency.comparisonYears!;
      expect(years.length, category.id).toBeGreaterThan(0);
      const mapping = OECD_CATEGORY_MAPPINGS[category.id]!;
      for (const code of new Set(["USA", efficiency.bestCountry.code, ...efficiency.topEfficient.map(c => c.code)])) {
        const rows = years.map(year => OECD_BUDGET_PANEL.find(row => row.jurisdictionIso3 === code && row.year === year));
        for (const row of rows) {
          expect(row?.[mapping.spendingField], `${code}:${category.id}`).toBeTypeOf("number");
          expect(row?.[mapping.outcomeField], `${code}:${category.id}`).toBeTypeOf("number");
        }
        const spending = rows.reduce((sum, row) => sum + (row![mapping.spendingField] as number), 0) / years.length;
        const displayed = code === "USA" ? efficiency.spendingPerCapita
          : efficiency.topEfficient.find(country => country.code === code)!.spendingPerCapita;
        expect(displayed, `${code}:${category.id}`).toBe(Math.round(spending));
      }
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
