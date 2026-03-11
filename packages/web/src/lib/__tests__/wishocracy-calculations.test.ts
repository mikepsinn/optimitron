import { describe, expect, it } from "vitest";
import { BUDGET_CATEGORIES } from "../wishocracy-data";
import {
  calculateAllocationsFromPairwise,
  getRemainingPairs,
  validateComparisons,
} from "../wishocracy-calculations";

describe("wishocracy calculations", () => {
  it("normalizes pairwise allocations into percentages", () => {
    const allocations = calculateAllocationsFromPairwise([
      {
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 70,
        allocationB: 30,
      },
      {
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "ADDICTION_TREATMENT",
        allocationA: 60,
        allocationB: 40,
      },
    ]);

    expect(allocations.PRAGMATIC_CLINICAL_TRIALS).toBe(65);
    expect(allocations.ADDICTION_TREATMENT).toBe(20);
    expect(allocations.MILITARY_OPERATIONS).toBe(15);
    expect(
      Object.values(allocations).reduce((sum, value) => sum + value, 0),
    ).toBeCloseTo(100, 5);
  });

  it("returns zero allocations when every comparison is rejected", () => {
    const allocations = calculateAllocationsFromPairwise([
      {
        categoryA: "PRAGMATIC_CLINICAL_TRIALS",
        categoryB: "MILITARY_OPERATIONS",
        allocationA: 0,
        allocationB: 0,
      },
    ]);

    expect(Object.keys(allocations)).toHaveLength(
      Object.keys(BUDGET_CATEGORIES).length,
    );
    expect(Object.values(allocations).every((value) => value === 0)).toBe(true);
  });

  it("validates non-empty comparison batches", () => {
    expect(validateComparisons([])).toBe(false);
    expect(
      validateComparisons([
        {
          categoryA: "PRAGMATIC_CLINICAL_TRIALS",
          categoryB: "MILITARY_OPERATIONS",
          allocationA: 50,
          allocationB: 50,
        },
      ]),
    ).toBe(true);
  });

  it("never returns negative remaining pair counts", () => {
    expect(getRemainingPairs(3, 10)).toBe(7);
    expect(getRemainingPairs(15, 10)).toBe(0);
  });
});
