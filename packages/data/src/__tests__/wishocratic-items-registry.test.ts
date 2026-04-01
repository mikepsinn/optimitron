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
    expect(Object.keys(registryEntry?.wishocraticItems ?? {})).toHaveLength(18);
    expect(registryEntry?.wishocraticItems.PRAGMATIC_CLINICAL_TRIALS.name).toBe(
      "Pragmatic Clinical Trials",
    );
    expect(pragmaticTrials).toMatchObject({
      id: "PRAGMATIC_CLINICAL_TRIALS",
      jurisdictionCode: "US",
      currentAllocationUsd: 1_000_000_000,
      sourceUrl: "https://copenhagenconsensus.com/copenhagen-consensus-iii/outcome",
    });
    expect(allocations.MILITARY_OPERATIONS).toBeGreaterThan(
      allocations.PRAGMATIC_CLINICAL_TRIALS,
    );
    expect(
      Object.values(allocations).reduce((sum, allocation) => sum + allocation, 0),
    ).toBeCloseTo(100, 0);
  });
});
