import { describe, expect, it } from "vitest";
import { ALIGNMENT_BENCHMARKS } from "@/lib/alignment-benchmarks";
import {
  buildEmptyPersonalAlignmentState,
  buildPersonalAlignmentReport,
  dedupeLatestWishocraticAllocations,
} from "@/lib/alignment-report";

describe("alignment report utilities", () => {
  it("keeps the latest normalized Wishocratic comparison per pair", () => {
    const comparisons = dedupeLatestWishocraticAllocations([
      {
        userId: "user-1",
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "ADDICTION_TREATMENT",
        allocationA: 20,
        allocationB: 80,
        timestamp: "2026-03-10T00:00:00.000Z",
      },
      {
        userId: "user-1",
        itemAId: "ADDICTION_TREATMENT",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 85,
        allocationB: 15,
        timestamp: "2026-03-11T00:00:00.000Z",
      },
      {
        userId: "user-1",
        itemAId: "UNKNOWN",
        itemBId: "MILITARY_OPERATIONS",
        allocationA: 50,
        allocationB: 50,
        timestamp: "2026-03-11T00:00:00.000Z",
      },
    ]);

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]).toMatchObject({
      itemAId: "ADDICTION_TREATMENT",
      itemBId: "MILITARY_OPERATIONS",
      allocationA: 85,
      allocationB: 15,
    });
  });

  it("returns a category-selection empty state when only one category is in scope", () => {
    const state = buildEmptyPersonalAlignmentState({
      allocationCount: 0,
      selectedItemCount: 1,
    });

    expect(state.status).toBe("empty");
    expect(state.reason).toBe("single_category");
    expect(state.ctaLabel).toBe("Update Categories");
  });

  it("builds a ready personal alignment report for a complete three-category run", () => {
    const report = buildPersonalAlignmentReport({
      comparisons: [
        {
          userId: "user-1",
          itemAId: "PRAGMATIC_CLINICAL_TRIALS",
          itemBId: "MILITARY_OPERATIONS",
          allocationA: 90,
          allocationB: 10,
          timestamp: "2026-03-11T00:00:00.000Z",
        },
        {
          userId: "user-1",
          itemAId: "ADDICTION_TREATMENT",
          itemBId: "MILITARY_OPERATIONS",
          allocationA: 85,
          allocationB: 15,
          timestamp: "2026-03-11T00:05:00.000Z",
        },
        {
          userId: "user-1",
          itemAId: "PRAGMATIC_CLINICAL_TRIALS",
          itemBId: "ADDICTION_TREATMENT",
          allocationA: 55,
          allocationB: 45,
          timestamp: "2026-03-11T00:10:00.000Z",
        },
      ],
      selectedItemCount: 3,
      benchmarkProfiles: ALIGNMENT_BENCHMARKS,
      generatedAt: "2026-03-12T00:00:00.000Z",
    });

    expect(report.allocationCount).toBe(3);
    expect(report.selectedItemCount).toBe(3);
    expect(report.totalPossiblePairs).toBe(3);
    expect(report.completionRatio).toBe(1);
    expect(report.isPreliminary).toBe(false);
    expect(report.topPriorities[0]?.itemId).toBe("PRAGMATIC_CLINICAL_TRIALS");
    expect(report.ranking).toHaveLength(ALIGNMENT_BENCHMARKS.length);
    expect(report.ranking[0]?.score).toBeGreaterThanOrEqual(
      report.ranking[1]?.score ?? 0,
    );
    expect(report.politicians[0]?.closestMatches.length).toBeGreaterThan(0);
    expect(report.politicians[0]?.sourceLabel).toBeTruthy();
  });

  it("keeps simulated benchmark profiles normalized to 100 percent", () => {
    for (const benchmark of ALIGNMENT_BENCHMARKS) {
      const total = Object.values(benchmark.allocations).reduce(
        (sum, value) => sum + value,
        0,
      );
      expect(total).toBe(100);
    }
  });
});
