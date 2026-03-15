import { describe, expect, it } from "vitest";
import {
  buildCitizenPreferenceSummary,
  buildPoliticianAlignmentResults,
  mapVoteAllocationsToBudgetCategories,
  resolveBudgetCategoryId,
} from "@/lib/wishocracy-alignment";
import { BUDGET_CATEGORIES } from "@/lib/wishocracy-data";

const comparisons = [
  {
    userId: "user-1",
    itemAId: "ADDICTION_TREATMENT",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 80,
    allocationB: 20,
  },
  {
    userId: "user-1",
    itemAId: "PRAGMATIC_CLINICAL_TRIALS",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 75,
    allocationB: 25,
  },
  {
    userId: "user-2",
    itemAId: "ADDICTION_TREATMENT",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 70,
    allocationB: 30,
  },
  {
    userId: "user-2",
    itemAId: "PRAGMATIC_CLINICAL_TRIALS",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 65,
    allocationB: 35,
  },
];

describe("wishocracy alignment utilities", () => {
  it("resolves category keys, ids, and names", () => {
    expect(resolveBudgetCategoryId("MILITARY_OPERATIONS")).toBe("MILITARY_OPERATIONS");
    expect(resolveBudgetCategoryId("military")).toBe("MILITARY_OPERATIONS");
    expect(resolveBudgetCategoryId(BUDGET_CATEGORIES.MILITARY_OPERATIONS.name)).toBe(
      "MILITARY_OPERATIONS",
    );
  });

  it("normalizes mixed allocation inputs into budget categories", () => {
    const result = mapVoteAllocationsToBudgetCategories({
      military: 20,
      ADDICTION_TREATMENT: 30,
      [BUDGET_CATEGORIES.PRAGMATIC_CLINICAL_TRIALS.name]: 50,
      unknown_bucket: 10,
    });

    expect(result.allocations.MILITARY_OPERATIONS).toBe(20);
    expect(result.allocations.ADDICTION_TREATMENT).toBe(30);
    expect(result.allocations.PRAGMATIC_CLINICAL_TRIALS).toBe(50);
    expect(result.unresolvedCategories).toEqual(["unknown_bucket"]);
  });

  it("builds citizen preference summaries with confidence intervals", () => {
    const summary = buildCitizenPreferenceSummary(comparisons, {
      bootstrapIterations: 50,
      bootstrapSeed: 7,
    });

    expect(summary.totalComparisons).toBe(4);
    expect(summary.totalParticipants).toBe(2);
    expect(summary.itemsCompared).toBe(3);
    expect(summary.consistencyRatio).toBeGreaterThanOrEqual(0);
    expect(summary.preferenceWeights.length).toBe(3);
    expect(summary.preferenceWeights[0]?.ciLow).toBeDefined();
    expect(summary.preferenceWeights[0]?.ciHigh).toBeDefined();
    expect(summary.preferenceGaps.length).toBe(3);
  });

  it("scores and ranks politicians against citizen preferences", () => {
    const summary = buildCitizenPreferenceSummary(comparisons, {
      bootstrapIterations: 50,
      bootstrapSeed: 7,
    });
    const result = buildPoliticianAlignmentResults(summary, [
      {
        politicianId: "aligned",
        name: "Aligned Candidate",
        allocations: {
          addiction_treatment: 38,
          pragmatic_clinical_trials: 37,
          military: 25,
        },
      },
      {
        politicianId: "misaligned",
        name: "Misaligned Candidate",
        allocations: {
          military: 80,
          addiction_treatment: 10,
          pragmatic_clinical_trials: 10,
        },
      },
    ]);

    expect(result.politicians).toHaveLength(2);
    expect(result.ranking[0]?.politicianId).toBe("aligned");
    expect(result.ranking[0]?.score).toBeGreaterThan(result.ranking[1]?.score ?? 0);
    expect(result.politicians[0]?.preferenceGaps.length).toBe(3);
  });
});
