import { beforeEach, describe, expect, it, vi } from "vitest";
import { TREATY_REFERENDUM_SLUG } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  getPendingTreatyVote: vi.fn(),
  removePendingTreatyVote: vi.fn(),
  setVoteStatusCache: vi.fn(),
  getUsernameOrReferralCode: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    getPendingTreatyVote: mocks.getPendingTreatyVote,
    removePendingTreatyVote: mocks.removePendingTreatyVote,
    setVoteStatusCache: mocks.setVoteStatusCache,
  },
}));

vi.mock("@/lib/referral.client", () => ({
  getUsernameOrReferralCode: mocks.getUsernameOrReferralCode,
}));

import { syncPendingTreatyVote } from "../treaty-vote-sync";

describe("treaty vote sync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mocks.getPendingTreatyVote.mockReset();
    mocks.removePendingTreatyVote.mockReset();
    mocks.setVoteStatusCache.mockReset();
    mocks.getUsernameOrReferralCode.mockReset();
    mocks.getUsernameOrReferralCode.mockReturnValue("demo-referral");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns false when there is nothing staged", async () => {
    mocks.getPendingTreatyVote.mockReturnValue(null);

    await expect(syncPendingTreatyVote()).resolves.toBe(false);
  });

  it("syncs an allocation-only staged treaty allocation without clearing it", async () => {
    mocks.getPendingTreatyVote.mockReturnValue({
      answer: "",
      referredBy: null,
      timestamp: "2026-03-23T12:00:00.000Z",
      wishocraticAllocation: {
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "PRAGMATIC_CLINICAL_TRIALS",
        allocationA: 30,
        allocationB: 70,
        timestamp: "2026-03-23T12:00:00.000Z",
      },
      organizationId: null,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(syncPendingTreatyVote()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/wishocracy/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "PRAGMATIC_CLINICAL_TRIALS",
        allocationA: 30,
        allocationB: 70,
        timestamp: "2026-03-23T12:00:00.000Z",
      }),
    });
    expect(mocks.removePendingTreatyVote).not.toHaveBeenCalled();
    expect(mocks.setVoteStatusCache).not.toHaveBeenCalled();
  });

  it("clears storage once vote and allocation both sync", async () => {
    mocks.getPendingTreatyVote.mockReturnValue({
      answer: "YES",
      referredBy: "ref-user",
      timestamp: "2026-03-23T12:00:00.000Z",
      wishocraticAllocation: {
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "PRAGMATIC_CLINICAL_TRIALS",
        allocationA: 25,
        allocationB: 75,
        timestamp: "2026-03-23T12:00:00.000Z",
      },
      organizationId: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      syncPendingTreatyVote({
        user: {
          id: "user_1",
        },
      } as never),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/wishocracy/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "PRAGMATIC_CLINICAL_TRIALS",
        allocationA: 25,
        allocationB: 75,
        timestamp: "2026-03-23T12:00:00.000Z",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: "YES",
          ref: "ref-user",
        }),
      },
    );
    expect(mocks.removePendingTreatyVote).toHaveBeenCalledTimes(1);
    expect(mocks.setVoteStatusCache).toHaveBeenCalledWith({
      hasVoted: true,
      voteAnswer: "YES",
      referralCode: "demo-referral",
    });
  });

  it("keeps staged landing data when the treaty allocation sync fails", async () => {
    mocks.getPendingTreatyVote.mockReturnValue({
      answer: "NO",
      referredBy: null,
      timestamp: "2026-03-23T12:00:00.000Z",
      wishocraticAllocation: {
        itemAId: "MILITARY_OPERATIONS",
        itemBId: "PRAGMATIC_CLINICAL_TRIALS",
        allocationA: 80,
        allocationB: 20,
        timestamp: "2026-03-23T12:00:00.000Z",
      },
      organizationId: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "wishocracy unavailable" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      syncPendingTreatyVote({
        user: {
          id: "user_1",
        },
      } as never),
    ).resolves.toBe(false);

    expect(mocks.removePendingTreatyVote).not.toHaveBeenCalled();
    expect(mocks.setVoteStatusCache).toHaveBeenCalledWith({
      hasVoted: true,
      voteAnswer: "NO",
      referralCode: "demo-referral",
    });
  });
});
