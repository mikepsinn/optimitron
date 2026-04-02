import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  deriveRecentLegislativeVoteRows: vi.fn(),
  fetchMemberDetails: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  getCongressApiKey: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    jurisdiction: {
      findUnique: mocks.findUnique,
    },
    politician: {
      findMany: mocks.findMany,
      upsert: mocks.upsert,
    },
    politicianVote: {
      createMany: mocks.createMany,
      deleteMany: mocks.deleteMany,
    },
  },
}));

vi.mock("@optimitron/data", async () => {
  const actual = await vi.importActual<typeof import("@optimitron/data")>(
    "@optimitron/data",
  );

  return {
    ...actual,
    fetchers: {
      ...actual.fetchers,
      fetchMemberDetails: mocks.fetchMemberDetails,
      getCongressApiKey: mocks.getCongressApiKey,
    },
  };
});

vi.mock("@/lib/alignment-legislative-sync.server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/alignment-legislative-sync.server")>(
    "@/lib/alignment-legislative-sync.server",
  );

  return {
    ...actual,
    deriveRecentLegislativeVoteRows: mocks.deriveRecentLegislativeVoteRows,
  };
});

import { ALIGNMENT_BENCHMARKS } from "@/lib/alignment-benchmarks";
import {
  loadAlignmentBenchmarkProfiles,
  syncAlignmentBenchmarkPoliticians,
} from "@/lib/alignment-politicians.server";

describe("alignment politician source", () => {
  beforeEach(() => {
    mocks.createMany.mockReset();
    mocks.deleteMany.mockReset();
    mocks.fetchMemberDetails.mockReset();
    mocks.findMany.mockReset();
    mocks.findUnique.mockReset();
    mocks.getCongressApiKey.mockReset();
    mocks.upsert.mockReset();
    mocks.deriveRecentLegislativeVoteRows.mockReset();
  });

  it("falls back to curated real profiles when the database has no synced rows", async () => {
    mocks.findMany.mockResolvedValue([]);

    const profiles = await loadAlignmentBenchmarkProfiles();

    expect(profiles).toEqual(ALIGNMENT_BENCHMARKS);
  });

  it("uses congress-synced politician rows when a complete vote record exists", async () => {
    const bernie = ALIGNMENT_BENCHMARKS[0];
    mocks.findMany.mockResolvedValue([
      {
        externalId: bernie?.externalId ?? null,
        name: "Bernard Sanders",
        party: "Independent",
        title: "Senator",
        chamber: "senate",
        district: "VT",
        updatedAt: new Date("2026-03-12T00:00:00.000Z"),
        votes: Object.entries(bernie?.allocations ?? {}).map(([itemId, allocationPct]) => ({
          billId: `alignment-benchmark:${bernie?.politicianId ?? "bernie-sanders"}`,
          itemId,
          allocationPct,
          updatedAt: new Date("2026-03-12T00:00:00.000Z"),
          votedAt: new Date("2026-03-12T00:00:00.000Z"),
        })),
      },
    ]);

    const profiles = await loadAlignmentBenchmarkProfiles();

    expect(profiles[0]?.sourceType).toBe("congress_sync");
    expect(profiles[0]?.name).toBe("Bernard Sanders");
    expect(profiles[0]?.lastSyncedAt).toBe("2026-03-12T00:00:00.000Z");
  });

  it("uses a partial congress overlay when recent live votes are informative but incomplete", async () => {
    const bernie = ALIGNMENT_BENCHMARKS[0];
    if (!bernie) {
      throw new Error("Missing Bernie benchmark.");
    }

    mocks.findMany.mockResolvedValue([
      {
        externalId: bernie.externalId ?? null,
        name: "Bernard Sanders",
        party: "Independent",
        title: "Senator",
        chamber: "senate",
        district: "VT",
        updatedAt: new Date("2026-03-12T00:00:00.000Z"),
        votes: [
          {
            billId: "119-hr-23:Senate:1:22",
            itemId: "ICE_CRIMINAL_DEPORTATION",
            allocationPct: -0.8,
            updatedAt: new Date("2026-03-12T00:00:00.000Z"),
            votedAt: new Date("2026-03-12T00:00:00.000Z"),
          },
          {
            billId: "118-hjres-7:Senate:1:80",
            itemId: "ICE_CRIMINAL_DEPORTATION",
            allocationPct: -0.7,
            updatedAt: new Date("2026-03-11T00:00:00.000Z"),
            votedAt: new Date("2026-03-11T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const profiles = await loadAlignmentBenchmarkProfiles();

    expect(profiles[0]?.sourceType).toBe("congress_partial");
    expect(profiles[0]?.sourceLabel).toBeTruthy();
    expect(profiles[0]?.sourceNote.length).toBeGreaterThan(0);
    expect(profiles[0]?.categoriesCovered).toBeGreaterThan(0);
    expect(profiles[0]?.rollCallCount).toBe(2);
    expect(profiles[0]?.lastSyncedAt).toBe("2026-03-12T00:00:00.000Z");
    expect(profiles[0]?.allocations.ICE_CRIMINAL_DEPORTATION).not.toBe(
      bernie.allocations.ICE_CRIMINAL_DEPORTATION,
    );
    expect(profiles[0]?.summary).toBeTruthy();
    expect(profiles[0]?.summary).not.toBe(bernie.summary);
  });

  it("skips sync cleanly when CONGRESS_API_KEY is missing", async () => {
    mocks.getCongressApiKey.mockReturnValue(null);

    const result = await syncAlignmentBenchmarkPoliticians();

    expect(result.skipped).toBe(true);
    expect(result.reason).toContain("CONGRESS_API_KEY");
  });

  it("syncs benchmark politicians into the database when congress access is configured", async () => {
    mocks.getCongressApiKey.mockReturnValue("test-key");
    mocks.findUnique.mockResolvedValue({ id: "jur-us" });
    mocks.fetchMemberDetails.mockImplementation(async (externalId: string) => ({
      bioguideId: externalId,
      chamber: "Senate",
      name: `Member ${externalId}`,
      party: "Independent",
      state: "VT",
      terms: [],
    }));
    let upsertCallCount = 0;
    mocks.upsert.mockImplementation(async () => {
      upsertCallCount += 1;
      return { id: `pol-${upsertCallCount}` };
    });
    mocks.deleteMany.mockResolvedValue({ count: 10 });
    mocks.deriveRecentLegislativeVoteRows.mockResolvedValue(
      ALIGNMENT_BENCHMARKS.slice(0, 2).flatMap((benchmark, index) => ([
        {
          externalId: benchmark?.externalId,
          allocationPct: 0.8,
          billId: `bill-${index + 1}`,
          itemId: "ADDICTION_TREATMENT",
          votedAt: new Date("2026-03-12T00:00:00.000Z"),
        },
        {
          externalId: benchmark?.externalId,
          allocationPct: -0.6,
          billId: `bill-${index + 10}`,
          itemId: "MILITARY_OPERATIONS",
          votedAt: new Date("2026-03-13T00:00:00.000Z"),
        },
      ])).filter((row): row is {
        externalId: string;
        allocationPct: number;
        billId: string;
        itemId: "ADDICTION_TREATMENT" | "MILITARY_OPERATIONS";
        votedAt: Date;
      } => typeof row.externalId === "string"),
    );
    mocks.createMany.mockResolvedValue({ count: 4 });

    const result = await syncAlignmentBenchmarkPoliticians();

    expect(result.skipped).toBe(false);
    expect(result.syncedPoliticians).toBe(ALIGNMENT_BENCHMARKS.length);
    expect(result.syncedVotes).toBe(4);
    expect(mocks.fetchMemberDetails).toHaveBeenCalledTimes(ALIGNMENT_BENCHMARKS.length);
    expect(mocks.deriveRecentLegislativeVoteRows).toHaveBeenCalledTimes(1);
  });

  it("does not wipe stored live votes when the refresh yields no classified rows", async () => {
    mocks.getCongressApiKey.mockReturnValue("test-key");
    mocks.findUnique.mockResolvedValue({ id: "jur-us" });
    mocks.fetchMemberDetails.mockImplementation(async (externalId: string) => ({
      bioguideId: externalId,
      chamber: "Senate",
      name: `Member ${externalId}`,
      party: "Independent",
      state: "VT",
      terms: [],
    }));
    mocks.upsert.mockImplementation(async ({ where }: { where: { jurisdictionId_externalId: { externalId: string } } }) => ({
      id: `pol-${where.jurisdictionId_externalId.externalId}`,
    }));
    mocks.deriveRecentLegislativeVoteRows.mockResolvedValue([]);

    const result = await syncAlignmentBenchmarkPoliticians();

    expect(result.skipped).toBe(false);
    expect(result.syncedVotes).toBe(0);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("replaces stored live votes only for politicians with fresh classified rows", async () => {
    const bernie = ALIGNMENT_BENCHMARKS[0];
    const warren = ALIGNMENT_BENCHMARKS[1];
    if (!bernie?.externalId || !warren?.externalId) {
      throw new Error("Missing benchmark external IDs.");
    }

    mocks.getCongressApiKey.mockReturnValue("test-key");
    mocks.findUnique.mockResolvedValue({ id: "jur-us" });
    mocks.fetchMemberDetails.mockImplementation(async (externalId: string) => ({
      bioguideId: externalId,
      chamber: "Senate",
      name: `Member ${externalId}`,
      party: "Independent",
      state: "VT",
      terms: [],
    }));
    mocks.upsert.mockImplementation(async ({ where }: { where: { jurisdictionId_externalId: { externalId: string } } }) => ({
      id: `pol-${where.jurisdictionId_externalId.externalId}`,
    }));
    mocks.deriveRecentLegislativeVoteRows.mockResolvedValue([
      {
        externalId: bernie.externalId,
        allocationPct: 0.8,
        billId: "bill-bernie",
        itemId: "ADDICTION_TREATMENT",
        votedAt: new Date("2026-03-12T00:00:00.000Z"),
      },
      {
        externalId: warren.externalId,
        allocationPct: -0.6,
        billId: "bill-warren",
        itemId: "MILITARY_OPERATIONS",
        votedAt: new Date("2026-03-13T00:00:00.000Z"),
      },
    ]);
    mocks.deleteMany.mockResolvedValue({ count: 7 });
    mocks.createMany.mockResolvedValue({ count: 2 });

    const result = await syncAlignmentBenchmarkPoliticians();

    expect(result.skipped).toBe(false);
    expect(result.syncedVotes).toBe(2);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        politicianId: {
          in: [`pol-${bernie.externalId}`, `pol-${warren.externalId}`],
        },
        itemId: {
          in: expect.any(Array),
        },
      },
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        {
          politicianId: `pol-${bernie.externalId}`,
          itemId: "ADDICTION_TREATMENT",
          allocationPct: 0.8,
          billId: "bill-bernie",
          votedAt: new Date("2026-03-12T00:00:00.000Z"),
        },
        {
          politicianId: `pol-${warren.externalId}`,
          itemId: "MILITARY_OPERATIONS",
          allocationPct: -0.6,
          billId: "bill-warren",
          votedAt: new Date("2026-03-13T00:00:00.000Z"),
        },
      ],
    });
  });
});
