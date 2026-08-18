import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishocraticAllocation: {
      findMany: mocks.findMany,
    },
  },
}));

import { GET, POST } from "./route";
import { WISHOCRATIC_ITEMS } from "@/lib/wishocracy-data";

const sampleComparisons = [
  {
    userId: "user-1",
    itemAId: "ADDICTION_TREATMENT",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 80,
    allocationB: 20,
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
  },
  {
    userId: "user-1",
    itemAId: "PRAGMATIC_CLINICAL_TRIALS",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 75,
    allocationB: 25,
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
  },
  {
    userId: "user-2",
    itemAId: "ADDICTION_TREATMENT",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 70,
    allocationB: 30,
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
  },
  {
    userId: "user-2",
    itemAId: "PRAGMATIC_CLINICAL_TRIALS",
    itemBId: "MILITARY_OPERATIONS",
    allocationA: 65,
    allocationB: 35,
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
  },
];

describe("wishocracy preferences route", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
  });

  it("returns an empty alignment summary when no comparisons exist", async () => {
    mocks.findMany.mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/wishocracy/preferences"),
    );
    const body = (await response.json()) as {
      totalAllocations: number;
      totalParticipants: number;
      preferenceWeights: unknown[];
      preferenceGaps: unknown[];
    };

    expect(response.status).toBe(200);
    expect(body.totalAllocations).toBe(0);
    expect(body.totalParticipants).toBe(0);
    expect(body.preferenceWeights).toEqual([]);
    expect(body.preferenceGaps).toEqual([]);
  });

  it("aggregates citizen preferences with confidence intervals", async () => {
    mocks.findMany.mockResolvedValue(sampleComparisons);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/wishocracy/preferences?bootstrapIterations=50",
      ),
    );
    const body = (await response.json()) as {
      totalAllocations: number;
      totalParticipants: number;
      itemsCompared: number;
      preferenceWeights: Array<{ ciLow?: number; ciHigh?: number }>;
      citizenAllocations: Record<string, number>;
    };

    expect(response.status).toBe(200);
    expect(body.totalAllocations).toBe(4);
    expect(body.totalParticipants).toBe(2);
    expect(body.itemsCompared).toBe(3);
    expect(body.preferenceWeights).toHaveLength(3);
    expect(body.preferenceWeights[0]?.ciLow).toBeDefined();
    expect(body.preferenceWeights[0]?.ciHigh).toBeDefined();
    expect(body.citizenAllocations.MILITARY_OPERATIONS).toBeGreaterThan(0);
  });

  it("rejects invalid politician payloads", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/wishocracy/preferences", {
        method: "POST",
        body: JSON.stringify({ politicians: [{ politicianId: "pol-1" }] }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "Each politician must include allocations or votes as an object or array of category percentages.",
    });
  });

  it("maps politician allocations and ranks aligned candidates first", async () => {
    mocks.findMany.mockResolvedValue(sampleComparisons);

    const response = await POST(
      new NextRequest("http://localhost/api/wishocracy/preferences", {
        method: "POST",
        body: JSON.stringify({
          bootstrapIterations: 50,
          politicians: [
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
              votes: [
                { category: WISHOCRATIC_ITEMS.MILITARY_OPERATIONS.name, allocationPct: 80 },
                { category: WISHOCRATIC_ITEMS.ADDICTION_TREATMENT.name, allocationPct: 10 },
                { category: WISHOCRATIC_ITEMS.PRAGMATIC_CLINICAL_TRIALS.name, allocationPct: 10 },
                { category: "mystery_bucket", allocationPct: 5 },
              ],
            },
          ],
        }),
      }),
    );
    const body = (await response.json()) as {
      ranking: Array<{ politicianId: string; score: number }>;
      politicians: Array<{
        politicianId: string;
        unresolvedItems: string[];
        normalizedAllocations: Record<string, number>;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.ranking[0]?.politicianId).toBe("aligned");
    expect(body.ranking[0]?.score).toBeGreaterThan(body.ranking[1]?.score ?? 0);
    expect(body.politicians[1]?.unresolvedItems).toEqual(["mystery_bucket"]);
    expect(body.politicians[0]?.normalizedAllocations.MILITARY_OPERATIONS).toBe(25);
  });
});
