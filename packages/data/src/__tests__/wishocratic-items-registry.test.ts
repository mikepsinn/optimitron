import { describe, expect, it } from "vitest";
import {
  DEFAULT_WISHOCRATIC_JURISDICTION,
  DEFAULT_WISHOCRATIC_ITEMS,
  DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE,
  getAvailableWishocraticItemsJurisdictions,
  getDefaultWishocraticAllocations,
  getDefaultWishocraticCatalogRecord,
  getWishocraticItemsRegistryEntry,
} from "../wishocratic-items-registry";

describe("Wishocratic items registry", () => {
  it("exposes the default jurisdiction catalog", () => {
    expect(DEFAULT_WISHOCRATIC_ITEMS_JURISDICTION_CODE).toBe("US");
    expect(DEFAULT_WISHOCRATIC_JURISDICTION).toEqual({
      code: "US",
      name: "United States",
      type: "COUNTRY",
    });
    expect(DEFAULT_WISHOCRATIC_ITEMS.MILITARY_OPERATIONS.slug).toBe("military");
  });

  it("returns allocation data for the registered default jurisdiction", () => {
    const registryEntry = getWishocraticItemsRegistryEntry("US");
    const allocations = getDefaultWishocraticAllocations();
    const pragmaticTrials = getDefaultWishocraticCatalogRecord("PRAGMATIC_CLINICAL_TRIALS");

    expect(getAvailableWishocraticItemsJurisdictions()).toEqual(["US"]);
    expect(Object.keys(registryEntry?.wishocraticItems ?? {})).toHaveLength(23);
    expect(registryEntry?.wishocraticItems.PRAGMATIC_CLINICAL_TRIALS.name).toBe(
      "Pragmatic Clinical Trials",
    );
    expect(pragmaticTrials).toMatchObject({
      id: "PRAGMATIC_CLINICAL_TRIALS",
      jurisdictionCode: "US",
      currentAllocationUsd: expect.any(Number),
      currentAllocationPct: allocations.PRAGMATIC_CLINICAL_TRIALS,
      sourceUrl: "https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome",
    });
    expect(pragmaticTrials.currentAllocationUsd).toBeGreaterThan(0);
    expect(allocations.MILITARY_OPERATIONS).toBeGreaterThan(
      allocations.PRAGMATIC_CLINICAL_TRIALS,
    );
    expect(
      Object.values(allocations).reduce((sum, allocation) => sum + allocation, 0),
    ).toBeCloseTo(100, 0);
  });

  it("keeps the citizen estimate a possible average and every funded program sourced", () => {
    const items = Object.values(DEFAULT_WISHOCRATIC_ITEMS);
    expect(
      items.reduce((sum, item) => sum + item.estimatedCitizenAllocationPct, 0),
    ).toBeCloseTo(100, 6);
    for (const item of items) {
      const [low, high] = item.estimatedCitizenAllocationRange;
      // An average is 0 only if every person gives nothing.
      expect(item.estimatedCitizenAllocationPct, item.slug).toBeGreaterThan(0);
      expect(item.estimatedCitizenAllocationPct, item.slug).toBeGreaterThanOrEqual(low);
      expect(item.estimatedCitizenAllocationPct, item.slug).toBeLessThanOrEqual(high);
      expect(item.estimatedCitizenAllocationSources.length, item.slug).toBeGreaterThan(0);
      if (item.annualBudgetBillions > 0) {
        expect(item.budgetSourceUrl, item.slug).toMatch(/^https:\/\//);
        expect(item.budgetFiscalYear, item.slug).toBeTruthy();
      }
    }
  });
});
