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

vi.mock("@optomitron/data", () => ({
  fetchers: {
    fetchMemberDetails: mocks.fetchMemberDetails,
    getCongressApiKey: mocks.getCongressApiKey,
  },
}));

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
        votes: Object.entries(bernie?.allocations ?? {}).map(([itemCategory, allocationPct]) => ({
          billId: `alignment-benchmark:${bernie?.politicianId ?? "bernie-sanders"}`,
          itemCategory,
          allocationPct,
          updatedAt: new Date("2026-03-12T00:00:00.000Z"),
          voteDate: new Date("2026-03-12T00:00:00.000Z"),
        })),
      },
    ]);

    const profiles = await loadAlignmentBenchmarkProfiles();

    expect(profiles[0]?.sourceType).toBe("congress_sync");
    expect(profiles[0]?.name).toBe("Bernard Sanders");
    expect(profiles[0]?.lastSyncedAt).toBe("2026-03-12T00:00:00.000Z");
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
          itemCategory: "ADDICTION_TREATMENT",
          voteDate: new Date("2026-03-12T00:00:00.000Z"),
        },
        {
          externalId: benchmark?.externalId,
          allocationPct: -0.6,
          billId: `bill-${index + 10}`,
          itemCategory: "MILITARY_OPERATIONS",
          voteDate: new Date("2026-03-13T00:00:00.000Z"),
        },
      ])).filter((row): row is {
        externalId: string;
        allocationPct: number;
        billId: string;
        itemCategory: "ADDICTION_TREATMENT" | "MILITARY_OPERATIONS";
        voteDate: Date;
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
});
