import { describe, expect, it } from "vitest";
import { WISHOCRATIC_ITEMS } from "../wishocracy-data";
import {
  calculateAllocationsFromPairwise,
} from "../wishocracy-calculations";

describe("wishocracy calculations", () => {
  it("normalizes pairwise allocations into percentages", () => {
    const allocations = calculateAllocationsFromPairwise([
      {
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 70,
        allocationB: 30,
      },
      {
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "ADDICTION_TREATMENT",
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
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 0,
        allocationB: 0,
      },
    ]);

    expect(Object.keys(allocations)).toHaveLength(
      Object.keys(WISHOCRATIC_ITEMS).length,
    );
    expect(Object.values(allocations).every((value) => value === 0)).toBe(true);
  });

});
