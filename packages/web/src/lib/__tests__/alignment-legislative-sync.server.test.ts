import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchBillSubjects: vi.fn(),
  fetchBillVotes: vi.fn(),
  fetchBills: vi.fn(),
  fetchBillsByType: vi.fn(),
  fetchRollCallVote: vi.fn(),
}));

vi.mock("@optomitron/data", () => ({
  fetchers: {
    fetchBillSubjects: mocks.fetchBillSubjects,
    fetchBillVotes: mocks.fetchBillVotes,
    fetchBills: mocks.fetchBills,
    fetchBillsByType: mocks.fetchBillsByType,
    fetchRollCallVote: mocks.fetchRollCallVote,
  },
}));

import {
  buildAllocationRecordFromStoredVotes,
  buildPartialAllocationRecordFromStoredVotes,
  deriveRecentLegislativeVoteRows,
} from "@/lib/alignment-legislative-sync.server";
import { ALIGNMENT_BENCHMARKS } from "@/lib/alignment-benchmarks";

describe("alignment legislative sync helpers", () => {
  beforeEach(() => {
    mocks.fetchBillSubjects.mockReset();
    mocks.fetchBillVotes.mockReset();
    mocks.fetchBills.mockReset();
    mocks.fetchBillsByType.mockReset();
    mocks.fetchRollCallVote.mockReset();
  });

  it("aggregates raw legislative vote signals into normalized allocations", () => {
    const record = buildAllocationRecordFromStoredVotes([
      { allocationPct: 1, billId: "bill-1", itemCategory: "ADDICTION_TREATMENT", updatedAt: new Date(), voteDate: new Date("2026-01-01") },
      { allocationPct: 0.8, billId: "bill-2", itemCategory: "ADDICTION_TREATMENT", updatedAt: new Date(), voteDate: new Date("2026-01-02") },
      { allocationPct: 0.9, billId: "bill-3", itemCategory: "EARLY_CHILDHOOD_EDUCATION", updatedAt: new Date(), voteDate: new Date("2026-01-03") },
      { allocationPct: 0.7, billId: "bill-4", itemCategory: "PRAGMATIC_CLINICAL_TRIALS", updatedAt: new Date(), voteDate: new Date("2026-01-04") },
      { allocationPct: -0.9, billId: "bill-5", itemCategory: "MILITARY_OPERATIONS", updatedAt: new Date(), voteDate: new Date("2026-01-05") },
      { allocationPct: -0.7, billId: "bill-6", itemCategory: "MILITARY_OPERATIONS", updatedAt: new Date(), voteDate: new Date("2026-01-06") },
    ]);

    expect(record).not.toBeNull();
    expect(record?.categoriesCovered).toBe(4);
    expect(record?.rollCallCount).toBe(6);
    expect(record?.allocations.ADDICTION_TREATMENT).toBeGreaterThan(
      record?.allocations.MILITARY_OPERATIONS ?? 0,
    );
  });

  it("returns null when the stored vote coverage is too thin", () => {
    const record = buildAllocationRecordFromStoredVotes([
      { allocationPct: 1, billId: "bill-1", itemCategory: "ADDICTION_TREATMENT", updatedAt: new Date(), voteDate: new Date("2026-01-01") },
      { allocationPct: 0.8, billId: "bill-2", itemCategory: "EARLY_CHILDHOOD_EDUCATION", updatedAt: new Date(), voteDate: new Date("2026-01-02") },
    ]);

    expect(record).toBeNull();
  });

  it("builds a partial blended allocation record when live coverage exists but stays thin", () => {
    const bernie = ALIGNMENT_BENCHMARKS[0];
    if (!bernie) {
      throw new Error("Missing Bernie benchmark.");
    }

    const negativeRecord = buildPartialAllocationRecordFromStoredVotes(
      [
        {
          allocationPct: -0.8,
          billId: "bill-1",
          itemCategory: "ICE_IMMIGRATION_ENFORCEMENT",
          updatedAt: new Date(),
          voteDate: new Date("2026-01-01"),
        },
        {
          allocationPct: -0.9,
          billId: "bill-2",
          itemCategory: "ICE_IMMIGRATION_ENFORCEMENT",
          updatedAt: new Date(),
          voteDate: new Date("2026-01-02"),
        },
      ],
      bernie.allocations,
    );
    const positiveRecord = buildPartialAllocationRecordFromStoredVotes(
      [
        {
          allocationPct: 0.8,
          billId: "bill-1",
          itemCategory: "ICE_IMMIGRATION_ENFORCEMENT",
          updatedAt: new Date(),
          voteDate: new Date("2026-01-01"),
        },
        {
          allocationPct: 0.9,
          billId: "bill-2",
          itemCategory: "ICE_IMMIGRATION_ENFORCEMENT",
          updatedAt: new Date(),
          voteDate: new Date("2026-01-02"),
        },
      ],
      bernie.allocations,
    );

    expect(negativeRecord).not.toBeNull();
    expect(negativeRecord?.coverageLevel).toBe("partial");
    expect(negativeRecord?.rollCallCount).toBe(2);
    expect(negativeRecord?.categoriesCovered).toBe(1);
    expect(positiveRecord).not.toBeNull();
    expect(negativeRecord?.allocations.ICE_IMMIGRATION_ENFORCEMENT).toBeLessThan(
      positiveRecord?.allocations.ICE_IMMIGRATION_ENFORCEMENT ?? 0,
    );
  });

  it("derives raw vote rows from recent classified roll calls", async () => {
    mocks.fetchBills
      .mockResolvedValueOnce([
        {
          billId: "119-hr-1",
          title: "A bill to expand opioid treatment and recovery grants",
          congress: 119,
          type: "hr",
          number: 1,
          subjects: [],
          policyArea: null,
          latestAction: { date: "2026-02-01", text: "Introduced in House" },
        },
      ])
      .mockResolvedValueOnce([]);
    mocks.fetchBillsByType.mockResolvedValue([]);
    mocks.fetchBillSubjects.mockResolvedValue({
      subjects: ["Substance abuse treatment"],
      policyArea: "Health",
    });
    mocks.fetchBillVotes.mockResolvedValue([
      {
        chamber: "house",
        congress: 119,
        rollNumber: 42,
        sessionNumber: 1,
      },
    ]);
    mocks.fetchRollCallVote.mockResolvedValue({
      chamber: "house",
      congress: 119,
      date: "2026-02-03",
      memberVotes: [
        { bioguideId: "S000033", position: "Yea" },
        { bioguideId: "OTHER1", position: "No" },
      ],
      question: "On Passage",
      result: "Passed",
      rollCallNumber: 42,
      session: 1,
    });

    const rows = await deriveRecentLegislativeVoteRows(["S000033"]);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.externalId).toBe("S000033");
    expect(rows.some((row) => row.itemCategory === "ADDICTION_TREATMENT")).toBe(true);
    expect(rows[0]?.allocationPct).toBeGreaterThan(0);
  });

  it("includes senate-specific bill feeds when the mixed recent bill list misses them", async () => {
    mocks.fetchBills.mockResolvedValue([]);
    mocks.fetchBillsByType.mockImplementation(
      async (congress?: number, billType?: string) => {
        if (congress === 119 && billType === "s") {
          return [
            {
              billId: "119-s-5",
              title: "Laken Riley Act",
              congress: 119,
              type: "s",
              number: 5,
              subjects: [],
              policyArea: null,
              latestAction: { date: "2025-01-20", text: "Passed Senate with an amendment" },
            },
          ];
        }

        return [];
      },
    );
    mocks.fetchBillSubjects.mockResolvedValue({
      subjects: ["Border security and unlawful immigration", "Detention of persons"],
      policyArea: "Immigration",
    });
    mocks.fetchBillVotes.mockResolvedValue([
      {
        chamber: "senate",
        congress: 119,
        rollNumber: 7,
        sessionNumber: 1,
        url: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00007.xml",
      },
    ]);
    mocks.fetchRollCallVote.mockResolvedValue({
      chamber: "senate",
      congress: 119,
      date: "2025-01-20",
      memberVotes: [{ bioguideId: "S000033", position: "Nay" }],
      question: "On Passage",
      result: "Passed",
      rollCallNumber: 7,
      session: 1,
    });

    const rows = await deriveRecentLegislativeVoteRows(["S000033"]);

    expect(mocks.fetchBillsByType).toHaveBeenCalledWith(119, "s", 60);
    expect(mocks.fetchBillsByType).toHaveBeenCalledWith(119, "sjres", 25);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      externalId: "S000033",
      billId: "119-s-5:senate:1:7",
      itemCategory: "ICE_IMMIGRATION_ENFORCEMENT",
    });
    expect(rows[0]?.allocationPct).toBeLessThan(0);
  });
});
