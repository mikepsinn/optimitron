import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  allocationsFindMany: vi.fn(),
  findUserByUsernameOrReferralCode: vi.fn(),
  loadAlignmentBenchmarkProfiles: vi.fn(),
  selectionsFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticAllocation: {
      findMany: mocks.allocationsFindMany,
    },
    wishocraticCategorySelection: {
      findMany: mocks.selectionsFindMany,
    },
  },
}));

vi.mock("@/lib/alignment-politicians.server", () => ({
  loadAlignmentBenchmarkProfiles: mocks.loadAlignmentBenchmarkProfiles,
}));

vi.mock("@/lib/referral.server", () => ({
  findUserByUsernameOrReferralCode: mocks.findUserByUsernameOrReferralCode,
}));

import {
  findAlignmentReportOwnerByIdentifier,
  getPersonalAlignmentState,
} from "@/lib/alignment-report.server";
import { ALIGNMENT_BENCHMARKS } from "@/lib/alignment-benchmarks";

describe("alignment report server loader", () => {
  beforeEach(() => {
    mocks.allocationsFindMany.mockReset();
    mocks.findUserByUsernameOrReferralCode.mockReset();
    mocks.loadAlignmentBenchmarkProfiles.mockReset();
    mocks.selectionsFindMany.mockReset();
    mocks.loadAlignmentBenchmarkProfiles.mockResolvedValue(ALIGNMENT_BENCHMARKS);
  });

  it("returns an empty state when the user has no saved allocations", async () => {
    mocks.allocationsFindMany.mockResolvedValue([]);
    mocks.selectionsFindMany.mockResolvedValue([]);

    const state = await getPersonalAlignmentState("user-1");

    expect(state.status).toBe("empty");
    if (state.status !== "empty") {
      throw new Error("Expected empty state.");
    }
    expect(state.comparisonCount).toBe(0);
  });

  it("returns a ready state when the user has saved comparisons", async () => {
    mocks.allocationsFindMany.mockResolvedValue([
      {
        userId: "user-1",
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 90,
        allocationB: 10,
        updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      },
      {
        userId: "user-1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 85,
        allocationB: 15,
        updatedAt: new Date("2026-03-11T00:05:00.000Z"),
      },
      {
        userId: "user-1",
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 55,
        allocationB: 45,
        updatedAt: new Date("2026-03-11T00:10:00.000Z"),
      },
    ]);
    mocks.selectionsFindMany.mockResolvedValue([
      { itemId: "PRAGMATIC_CLINICAL_TRIALS" },
      { itemId: "ADDICTION_TREATMENT" },
      { itemId: "MILITARY_OPERATIONS" },
    ]);

    const state = await getPersonalAlignmentState("user-1");

    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("Expected ready state.");
    }
    expect(state.report.comparisonCount).toBe(3);
    expect(state.report.totalPossiblePairs).toBe(3);
    expect(state.report.ranking.length).toBeGreaterThan(0);
  });

  it("surfaces a partial congress source note when all benchmark profiles use the live overlay", async () => {
    mocks.allocationsFindMany.mockResolvedValue([
      {
        userId: "user-1",
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 90,
        allocationB: 10,
        updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      },
      {
        userId: "user-1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 85,
        allocationB: 15,
        updatedAt: new Date("2026-03-11T00:05:00.000Z"),
      },
      {
        userId: "user-1",
        itemAId: "PRAGMATIC_CLINICAL_TRIALS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 55,
        allocationB: 45,
        updatedAt: new Date("2026-03-11T00:10:00.000Z"),
      },
    ]);
    mocks.selectionsFindMany.mockResolvedValue([
      { itemId: "PRAGMATIC_CLINICAL_TRIALS" },
      { itemId: "ADDICTION_TREATMENT" },
      { itemId: "MILITARY_OPERATIONS" },
    ]);
    mocks.loadAlignmentBenchmarkProfiles.mockResolvedValue(
      ALIGNMENT_BENCHMARKS.map((profile) => ({
        ...profile,
        sourceType: "congress_partial" as const,
        sourceNote: "Partial overlay",
        lastSyncedAt: "2026-03-12T00:00:00.000Z",
      })),
    );

    const state = await getPersonalAlignmentState("user-1");

    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("Expected ready state.");
    }
    expect(state.report.candidateSourceType).toBe("congress_partial");
    expect(state.report.candidateSourceNote).toContain("curated benchmark priors");
  });

  it("resolves a public alignment owner from username or referral code", async () => {
    mocks.findUserByUsernameOrReferralCode.mockResolvedValue({
      id: "user-1",
      name: "Jane Example",
      referralCode: "REF123",
      username: "jane",
    });

    const owner = await findAlignmentReportOwnerByIdentifier("jane");

    expect(owner).toMatchObject({
      id: "user-1",
      publicIdentifier: "jane",
      displayName: "@jane",
    });
  });
});
