import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NOf1VariableRelationship } from "@optimitron/optimizer";

// Mock prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    nOf1VariableRelationship: {
      findMany: vi.fn(),
    },
    aggregateVariableRelationship: {
      upsert: vi.fn(),
    },
  },
}));

// Mock the optimizer's aggregate function so we can verify mapping
vi.mock("@optimitron/optimizer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@optimitron/optimizer")>();
  return {
    ...actual,
    aggregateNOf1VariableRelationships: vi.fn(
      actual.aggregateNOf1VariableRelationships,
    ),
  };
});

import { prisma } from "@/lib/prisma";
import { runAggregation, runAggregationForPairs } from "../aggregate-relationships.server";
import { aggregateNOf1VariableRelationships } from "@optimitron/optimizer";

const mockPrisma = prisma as unknown as {
  nOf1VariableRelationship: { findMany: ReturnType<typeof vi.fn> };
  aggregateVariableRelationship: { upsert: ReturnType<typeof vi.fn> };
};

function makeDbRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    predictorGlobalVariableId: "pred-1",
    outcomeGlobalVariableId: "out-1",
    subjectId: "subject-1",
    forwardPearsonCorrelation: 0.5,
    reversePearsonCorrelation: 0.1,
    statisticalSignificance: 0.8,
    effectSize: 10,
    numberOfPairs: 100,
    valuePredictingHighOutcome: 50,
    valuePredictingLowOutcome: 10,
    optimalValue: 40,
    outcomeFollowUpPercentChangeFromBaseline: 15,
    onsetDelay: 1800,
    durationOfAction: 86400,
    ...overrides,
  };
}

describe("runAggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty result when no rows exist", async () => {
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([]);

    const result = await runAggregation();

    expect(result).toEqual({ aggregated: 0, errors: [] });
    expect(mockPrisma.aggregateVariableRelationship.upsert).not.toHaveBeenCalled();
  });

  it("maps DB fields to optimizer fields correctly", async () => {
    const row = makeDbRow();
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([row]);
    mockPrisma.aggregateVariableRelationship.upsert.mockResolvedValue({});

    await runAggregation();

    expect(aggregateNOf1VariableRelationships).toHaveBeenCalledWith([
      expect.objectContaining({
        subjectId: "subject-1",
        forwardPearson: 0.5,
        reversePearson: 0.1,
        predictivePearson: 0.4,
        statisticalSignificance: 0.8,
        effectSize: 10,
        numberOfPairs: 100,
        valuePredictingHighOutcome: 50,
        valuePredictingLowOutcome: 10,
        optimalDailyValue: 40,
        outcomeFollowUpPercentChangeFromBaseline: 15,
      } satisfies NOf1VariableRelationship),
    ]);
  });

  it("handles null optional fields by mapping to undefined", async () => {
    const row = makeDbRow({
      valuePredictingHighOutcome: null,
      valuePredictingLowOutcome: null,
      optimalValue: null,
      outcomeFollowUpPercentChangeFromBaseline: null,
      statisticalSignificance: null,
    });
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([row]);
    mockPrisma.aggregateVariableRelationship.upsert.mockResolvedValue({});

    await runAggregation();

    expect(aggregateNOf1VariableRelationships).toHaveBeenCalledWith([
      expect.objectContaining({
        statisticalSignificance: 0,
        effectSize: 10,
        valuePredictingHighOutcome: undefined,
        valuePredictingLowOutcome: undefined,
        optimalDailyValue: undefined,
        outcomeFollowUpPercentChangeFromBaseline: undefined,
      }),
    ]);
  });

  it("groups rows by predictor/outcome pair", async () => {
    const rows = [
      makeDbRow({ subjectId: "s1", predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" }),
      makeDbRow({ subjectId: "s2", predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" }),
      makeDbRow({ subjectId: "s3", predictorGlobalVariableId: "p2", outcomeGlobalVariableId: "o2" }),
    ];
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue(rows);
    mockPrisma.aggregateVariableRelationship.upsert.mockResolvedValue({});

    const result = await runAggregation();

    // Two groups: (p1,o1) and (p2,o2)
    expect(result.aggregated).toBe(2);
    expect(aggregateNOf1VariableRelationships).toHaveBeenCalledTimes(2);

    // First call should have 2 rows
    const firstCallArgs = vi.mocked(aggregateNOf1VariableRelationships).mock.calls[0]![0];
    expect(firstCallArgs).toHaveLength(2);

    // Second call should have 1 row
    const secondCallArgs = vi.mocked(aggregateNOf1VariableRelationships).mock.calls[1]![0];
    expect(secondCallArgs).toHaveLength(1);
  });

  it("upserts aggregate result with correct DB field mapping", async () => {
    const row = makeDbRow();
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([row]);
    mockPrisma.aggregateVariableRelationship.upsert.mockResolvedValue({});

    await runAggregation();

    expect(mockPrisma.aggregateVariableRelationship.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          predictorGlobalVariableId_outcomeGlobalVariableId: {
            predictorGlobalVariableId: "pred-1",
            outcomeGlobalVariableId: "out-1",
          },
        },
        update: expect.objectContaining({
          numberOfSubjects: 1,
          numberOfPairs: 100,
          predictorImpactScore: expect.any(Number) as number,
          forwardPearsonCorrelation: expect.any(Number) as number,
          reversePearsonCorrelation: expect.any(Number) as number,
          effectSize: expect.any(Number) as number,
        }),
        create: expect.objectContaining({
          predictorGlobalVariableId: "pred-1",
          outcomeGlobalVariableId: "out-1",
          numberOfSubjects: 1,
        }),
      }),
    );
  });

  it("captures errors without aborting other groups", async () => {
    const rows = [
      makeDbRow({ predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" }),
      makeDbRow({ predictorGlobalVariableId: "p2", outcomeGlobalVariableId: "o2" }),
    ];
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue(rows);
    mockPrisma.aggregateVariableRelationship.upsert
      .mockRejectedValueOnce(new Error("DB write failed"))
      .mockResolvedValueOnce({});

    const result = await runAggregation();

    expect(result.aggregated).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("DB write failed");
  });
});

describe("runAggregationForPairs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates pairs and queries only those", async () => {
    const row = makeDbRow();
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([row]);
    mockPrisma.aggregateVariableRelationship.upsert.mockResolvedValue({});

    const pairs = [
      { predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" },
      { predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" }, // duplicate
    ];

    const result = await runAggregationForPairs(pairs);

    expect(result.aggregated).toBe(1);
    expect(mockPrisma.nOf1VariableRelationship.findMany).toHaveBeenCalledTimes(1);
  });

  it("skips pairs with no rows", async () => {
    mockPrisma.nOf1VariableRelationship.findMany.mockResolvedValue([]);

    const result = await runAggregationForPairs([
      { predictorGlobalVariableId: "p1", outcomeGlobalVariableId: "o1" },
    ]);

    expect(result.aggregated).toBe(0);
    expect(mockPrisma.aggregateVariableRelationship.upsert).not.toHaveBeenCalled();
  });
});
