import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchBillSubjects: vi.fn(),
  fetchBillVotes: vi.fn(),
  fetchBills: vi.fn(),
  fetchRollCallVote: vi.fn(),
}));

vi.mock("@optomitron/data", () => ({
  fetchers: {
    fetchBillSubjects: mocks.fetchBillSubjects,
    fetchBillVotes: mocks.fetchBillVotes,
    fetchBills: mocks.fetchBills,
    fetchRollCallVote: mocks.fetchRollCallVote,
  },
}));

import {
  buildAllocationRecordFromStoredVotes,
  deriveRecentLegislativeVoteRows,
} from "@/lib/alignment-legislative-sync.server";

describe("alignment legislative sync helpers", () => {
  beforeEach(() => {
    mocks.fetchBillSubjects.mockReset();
    mocks.fetchBillVotes.mockReset();
    mocks.fetchBills.mockReset();
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
});
