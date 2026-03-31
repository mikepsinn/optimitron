import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  checkBadgesAfterWish: vi.fn(),
  requireAuth: vi.fn(),
  findUnique: vi.fn(),
  grantWishes: vi.fn(),
  upsert: vi.fn(),
  findUserByUsernameOrReferralCode: vi.fn(),
  userFindUnique: vi.fn(),
  voteTokenMintUpsert: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: { create: mocks.activityCreate },
    referendum: { findUnique: mocks.findUnique },
    referendumVote: { upsert: mocks.upsert },
    user: { findUnique: mocks.userFindUnique },
    voteTokenMint: { upsert: mocks.voteTokenMintUpsert },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  findUserByUsernameOrReferralCode: mocks.findUserByUsernameOrReferralCode,
}));

vi.mock("@/lib/env", () => ({
  serverEnv: {
    VOTE_TOKEN_CHAIN_ID: "84532",
  },
}));

vi.mock("@/lib/wishes.server", () => ({
  grantWishes: mocks.grantWishes,
}));

vi.mock("@/lib/badges.server", () => ({
  checkBadgesAfterWish: mocks.checkBadgesAfterWish,
}));

import { POST } from "./route";

function makeRequest(slug: string, body: Record<string, unknown>) {
  return new Request(`http://localhost/api/referendums/${slug}/vote`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

const ACTIVE_REFERENDUM = {
  id: "ref_1",
  slug: "test-ref",
  status: "ACTIVE",
  deletedAt: null,
};

describe("POST /api/referendums/[slug]/vote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.activityCreate.mockResolvedValue({ id: "activity_1" });
    mocks.checkBadgesAfterWish.mockResolvedValue(undefined);
    mocks.grantWishes.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.voteTokenMintUpsert.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(makeRequest("test-ref", { answer: "YES" }), makeParams("test-ref"));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for invalid answer value", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const res = await POST(makeRequest("test-ref", { answer: "MAYBE" }), makeParams("test-ref"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Answer must be YES, NO, or ABSTAIN",
    });
  });

  it("returns 400 when answer is missing", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const res = await POST(makeRequest("test-ref", {}), makeParams("test-ref"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Answer must be YES, NO, or ABSTAIN",
    });
  });

  it("returns 404 for non-existent referendum slug", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("nope", { answer: "YES" }), makeParams("nope"));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Referendum not found" });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { slug: "nope", deletedAt: null },
    });
  });

  it("returns 400 when referendum is not ACTIVE", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue({ ...ACTIVE_REFERENDUM, status: "CLOSED" });

    const res = await POST(makeRequest("test-ref", { answer: "YES" }), makeParams("test-ref"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "This referendum is not currently accepting votes",
    });
  });

  it("casts a YES vote successfully", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    const vote = { id: "vote_1", answer: "YES", userId: "user_1", referendumId: "ref_1" };
    mocks.upsert.mockResolvedValue(vote);
    mocks.grantWishes.mockResolvedValue({ amount: 2 });

    const res = await POST(makeRequest("test-ref", { answer: "yes" }), makeParams("test-ref"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ vote, voteTokenMint: null, wishesEarned: 2 });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId_referendumId: { userId: "user_1", referendumId: "ref_1" } },
      update: { answer: "YES", deletedAt: null },
      create: { userId: "user_1", referendumId: "ref_1", answer: "YES", referredByUserId: null },
    });
    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        type: "VOTED_REFERENDUM",
        description: "",
        entityType: "Referendum",
        entityId: "ref_1",
        metadata: JSON.stringify({
          answer: "YES",
          referendumId: "ref_1",
          referendumSlug: "test-ref",
        }),
      },
    });
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user_1",
      reason: "REFERENDUM_VOTE",
      amount: 2,
      activityId: "activity_1",
      dedupeKey: "ref_1",
    });
  });

  it("casts a NO vote successfully", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    const vote = { id: "vote_2", answer: "NO", userId: "user_1", referendumId: "ref_1" };
    mocks.upsert.mockResolvedValue(vote);

    const res = await POST(makeRequest("test-ref", { answer: "no" }), makeParams("test-ref"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ vote, voteTokenMint: null, wishesEarned: 0 });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ answer: "NO" }),
      }),
    );
  });

  it("upserts (updates) an existing vote", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    const updatedVote = { id: "vote_1", answer: "ABSTAIN", userId: "user_1", referendumId: "ref_1" };
    mocks.upsert.mockResolvedValue(updatedVote);

    const res = await POST(makeRequest("test-ref", { answer: "ABSTAIN" }), makeParams("test-ref"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ vote: updatedVote, voteTokenMint: null, wishesEarned: 0 });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { answer: "ABSTAIN", deletedAt: null },
      }),
    );
  });

  it("resolves referrer from ref parameter", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.findUserByUsernameOrReferralCode.mockResolvedValue({ id: "referrer_1" });
    mocks.upsert.mockResolvedValue({ id: "vote_1" });

    await POST(makeRequest("test-ref", { answer: "YES", ref: "friend123" }), makeParams("test-ref"));

    expect(mocks.findUserByUsernameOrReferralCode).toHaveBeenCalledWith("friend123");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: "referrer_1" }),
      }),
    );
  });

  it("does NOT set referrer when ref is the voter's own ID", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.findUserByUsernameOrReferralCode.mockResolvedValue({ id: "user_1" });
    mocks.upsert.mockResolvedValue({ id: "vote_1" });

    await POST(makeRequest("test-ref", { answer: "YES", ref: "myself" }), makeParams("test-ref"));

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: null }),
      }),
    );
  });

  it("does NOT resolve referrer when ref is not provided", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.upsert.mockResolvedValue({ id: "vote_1" });

    await POST(makeRequest("test-ref", { answer: "YES" }), makeParams("test-ref"));

    expect(mocks.findUserByUsernameOrReferralCode).not.toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: null }),
      }),
    );
  });

  it("returns success even when activity logging fails", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.upsert.mockResolvedValue({ id: "vote_1", answer: "YES" });
    mocks.activityCreate.mockRejectedValue(new Error("activity down"));

    const res = await POST(makeRequest("test-ref", { answer: "YES" }), makeParams("test-ref"));

    expect(res.status).toBe(200);
    expect(mocks.grantWishes).toHaveBeenCalledWith({
      userId: "user_1",
      reason: "REFERENDUM_VOTE",
      amount: 2,
      activityId: undefined,
      dedupeKey: "ref_1",
    });
  });
});
