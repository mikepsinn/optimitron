import { describe, expect, it } from "vitest";
import {
  buildTreatyWishocraticAllocation,
  getMilitaryAllocationPercentFromPendingTreatyVote,
  getTreatyWishocraticAllocation,
} from "../treaty-vote";

describe("treaty vote helpers", () => {
  it("builds the canonical military-versus-trials allocation", () => {
    expect(
      buildTreatyWishocraticAllocation(35, "2026-03-23T12:00:00.000Z"),
    ).toEqual({
      itemAId: "MILITARY_OPERATIONS",
      itemBId: "PRAGMATIC_CLINICAL_TRIALS",
      allocationA: 35,
      allocationB: 65,
      timestamp: "2026-03-23T12:00:00.000Z",
    });
  });

  it("extracts military allocation from pending treaty vote", () => {
    expect(
      getMilitaryAllocationPercentFromPendingTreatyVote({
        answer: "",
        referredBy: null,
        timestamp: "2026-03-23T12:00:00.000Z",
        wishocraticAllocation: {
          itemAId: "PRAGMATIC_CLINICAL_TRIALS",
          itemBId: "MILITARY_OPERATIONS",
          allocationA: 70,
          allocationB: 30,
          timestamp: "2026-03-23T12:00:00.000Z",
        },
        organizationId: null,
      }),
    ).toBe(30);
  });

  it("returns null when no allocation is present", () => {
    expect(
      getTreatyWishocraticAllocation({
        answer: "",
        referredBy: null,
        timestamp: "2026-03-23T12:00:00.000Z",
        organizationId: null,
      }),
    ).toBeNull();
  });
});
