import { beforeEach, describe, expect, it, vi } from "vitest";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

const mocks = vi.hoisted(() => ({
  getPendingDeclarationVote: vi.fn(),
  removePendingDeclarationVote: vi.fn(),
  setPendingDeclarationVote: vi.fn(),
  setDeclarationSigned: vi.fn(),
  getPendingTreatyVote: vi.fn(),
  removePendingTreatyVote: vi.fn(),
  setPendingTreatyVote: vi.fn(),
  setVoteStatusCache: vi.fn(),
  getHandleOrReferralCode: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    getPendingDeclarationVote: mocks.getPendingDeclarationVote,
    removePendingDeclarationVote: mocks.removePendingDeclarationVote,
    setPendingDeclarationVote: mocks.setPendingDeclarationVote,
    setDeclarationSigned: mocks.setDeclarationSigned,
    getPendingTreatyVote: mocks.getPendingTreatyVote,
    removePendingTreatyVote: mocks.removePendingTreatyVote,
    setPendingTreatyVote: mocks.setPendingTreatyVote,
    setVoteStatusCache: mocks.setVoteStatusCache,
  },
}));

vi.mock("@/lib/referral.client", () => ({
  getHandleOrReferralCode: mocks.getHandleOrReferralCode,
}));

import { syncPendingReferendumVotes } from "../referendum-vote-sync";

describe("referendum vote sync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mocks.getPendingDeclarationVote.mockReset();
    mocks.removePendingDeclarationVote.mockReset();
    mocks.getPendingTreatyVote.mockReset();
    mocks.removePendingTreatyVote.mockReset();
    mocks.setVoteStatusCache.mockReset();
    mocks.getHandleOrReferralCode.mockReset();
    mocks.getHandleOrReferralCode.mockReturnValue("demo-referral");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("is a no-op when nothing is staged", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
    mocks.getPendingTreatyVote.mockReturnValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.removePendingDeclarationVote).not.toHaveBeenCalled();
    expect(mocks.removePendingTreatyVote).not.toHaveBeenCalled();
  });

  it("posts and clears a pending declaration vote on success", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue({
      answer: "YES",
      timestamp: "2026-03-23T12:00:00.000Z",
    });
    mocks.getPendingTreatyVote.mockReturnValue(null);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes({ user: { id: "u1" } } as never);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/referendums/${DECLARATION_SLUG}/vote`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(mocks.removePendingDeclarationVote).toHaveBeenCalledTimes(1);
    expect(mocks.setVoteStatusCache).toHaveBeenCalledWith({
      hasVoted: true,
      voteAnswer: "YES",
      referralCode: "demo-referral",
    });
  });

  it("syncs a treaty vote with allocation and clears both on success", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
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
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes({ user: { id: "u1" } } as never);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/wishocracy/allocations",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(mocks.removePendingTreatyVote).toHaveBeenCalledTimes(1);
    expect(mocks.setVoteStatusCache).toHaveBeenCalledWith({
      hasVoted: true,
      voteAnswer: "YES",
      referralCode: "demo-referral",
    });
  });

  it("posts signed organization context with a pending treaty vote", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
    mocks.getPendingTreatyVote.mockReturnValue({
      answer: "YES",
      referredBy: "ref-user",
      timestamp: "2026-03-23T12:00:00.000Z",
      organizationId: null,
      orgContextToken: "signed-org-token",
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes({ user: { id: "u1" } } as never);

    const voteRequest = fetchMock.mock.calls.find(
      ([url]) => url === `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
    );
    expect(voteRequest).toBeDefined();
    expect(JSON.parse(String(voteRequest?.[1]?.body))).toEqual(
      expect.objectContaining({
        answer: "YES",
        ref: "ref-user",
        orgContextToken: "signed-org-token",
      }),
    );
  });

  it("posts public organization survey slug with a pending treaty vote", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
    mocks.getPendingTreatyVote.mockReturnValue({
      answer: "YES",
      referredBy: "ref-user",
      timestamp: "2026-03-23T12:00:00.000Z",
      organizationId: null,
      organizationSlug: "institute-for-accelerated-medicine",
      orgContextToken: null,
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes({ user: { id: "u1" } } as never);

    const voteRequest = fetchMock.mock.calls.find(
      ([url]) => url === `/api/referendums/${TREATY_REFERENDUM_SLUG}/vote`,
    );
    expect(voteRequest).toBeDefined();
    expect(JSON.parse(String(voteRequest?.[1]?.body))).toEqual(
      expect.objectContaining({
        answer: "YES",
        ref: "ref-user",
        organizationSlug: "institute-for-accelerated-medicine",
      }),
    );
  });

  it("syncs an allocation-only treaty entry without clearing storage", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
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

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/wishocracy/allocations",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mocks.removePendingTreatyVote).not.toHaveBeenCalled();
    expect(mocks.setVoteStatusCache).not.toHaveBeenCalled();
  });

  it("keeps staged treaty data when the allocation sync fails", async () => {
    mocks.getPendingDeclarationVote.mockReturnValue(null);
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
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await syncPendingReferendumVotes({ user: { id: "u1" } } as never);

    expect(mocks.removePendingTreatyVote).not.toHaveBeenCalled();
    expect(mocks.setVoteStatusCache).toHaveBeenCalledWith({
      hasVoted: true,
      voteAnswer: "NO",
      referralCode: "demo-referral",
    });
  });
});
