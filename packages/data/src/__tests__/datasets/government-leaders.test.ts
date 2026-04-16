import "../../generated/country-panel";
import { describe, expect, it } from "vitest";
import {
  estimateCountryGovernmentBudgetUsd,
  estimateCountryMilitaryBudgetUsd,
  listGovernmentLeaders,
} from "../../datasets/government-leaders";
import { getCountryPanelLatestResolved } from "../../datasets/country-panel";

describe("listGovernmentLeaders", () => {
  it("returns a non-empty roster with every record fully resolved", () => {
    const records = listGovernmentLeaders();
    expect(records.length).toBeGreaterThan(180);

    for (const record of records) {
      expect(record.militaryBudgetUsd).toBeGreaterThan(0);
      expect(record.governmentBudgetUsd).toBeGreaterThan(0);
      expect(record.countryCode).toMatch(/^[A-Z]{2}$/);
      expect(record.countryIso3).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("includes the Vatican (VAT) via the extra-row fallback", () => {
    const records = listGovernmentLeaders();
    expect(records.some((record) => record.countryIso3 === "VAT")).toBe(true);
  });

  it("ranks the US first by military budget", () => {
    const records = listGovernmentLeaders();
    expect(records[0]?.countryCode).toBe("US");
    expect(records[0]?.sortOrder).toBe(0);
  });

  it("assigns stable sortOrder matching array index", () => {
    const records = listGovernmentLeaders();
    for (let index = 0; index < records.length; index += 1) {
      expect(records[index]!.sortOrder).toBe(index);
    }
  });
});

describe("estimateCountryGovernmentBudgetUsd", () => {
  it("uses totalGovSpendingPerCapitaPpp × population when available", () => {
    const usa = getCountryPanelLatestResolved().find(
      (row) => row.jurisdictionIso3 === "USA",
    );
    expect(usa).toBeDefined();
    const estimate = estimateCountryGovernmentBudgetUsd(usa!);
    expect(estimate).not.toBeNull();
    // US general-government expenditure (PPP, all levels) ≈ $11T.
    expect(estimate!).toBeGreaterThan(5_000_000_000_000);
    expect(estimate!).toBeLessThan(20_000_000_000_000);
  });

  it("returns null when no path produces a number", () => {
    const estimate = estimateCountryGovernmentBudgetUsd({
      afterTaxMedianIncomeIsAfterTax: false,
      afterTaxMedianIncomePerCapitaPpp: null,
      afterTaxMedianIncomeSource: null,
      educationSpendingPctGdp: null,
      educationSpendingPerCapitaPpp: null,
      gdpPerCapitaPpp: null,
      giniIndex: null,
      haleYears: null,
      healthSpendingPctGdp: null,
      healthSpendingPerCapitaPpp: null,
      infantMortalityPer1000: null,
      jurisdictionIso3: "ZZZ",
      jurisdictionName: "Nowhere",
      lifeExpectancyYears: null,
      medianIncomePerCapitaPpp: null,
      militarySpendingPctGdp: null,
      militarySpendingPerCapitaPpp: null,
      population: null,
      povertyRate: null,
      rdSpendingPctGdp: null,
      rdSpendingPerCapitaPpp: null,
      totalGovSpendingPctGdp: null,
      totalGovSpendingPerCapitaPpp: null,
      year: 2024,
    });
    expect(estimate).toBeNull();
  });
});

describe("estimateCountryMilitaryBudgetUsd", () => {
  it("computes via perCapita × population when both are present", () => {
    const usa = getCountryPanelLatestResolved().find(
      (row) => row.jurisdictionIso3 === "USA",
    );
    expect(usa).toBeDefined();
    const estimate = estimateCountryMilitaryBudgetUsd(usa!);
    // US military spending ~$850B.
    expect(estimate).toBeGreaterThan(300_000_000_000);
    expect(estimate).toBeLessThan(2_000_000_000_000);
  });
});
