import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  checkBadgesAfterWish: vi.fn(),
  organizationFindUnique: vi.fn(),
  requireAuth: vi.fn(),
  findUnique: vi.fn(),
  grantWishes: vi.fn(),
  upsert: vi.fn(),
  findUserByUsernameOrReferralCode: vi.fn(),
  syncReferralVoteTokenMintForVote: vi.fn(),
  resolveInvitationReferrer: vi.fn(),
  convertReferralInvitationForVote: vi.fn(),
  ensurePersonForUser: vi.fn(),
  ensureUserTreatyTask: vi.fn(),
  verifyOrgContextToken: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activity: { create: mocks.activityCreate },
    organization: { findUnique: mocks.organizationFindUnique },
    referendum: { findUnique: mocks.findUnique },
    referendumVote: { upsert: mocks.upsert },
  },
}));

vi.mock("@/lib/referral.server", () => ({
  findUserByUsernameOrReferralCode: mocks.findUserByUsernameOrReferralCode,
}));

vi.mock("@/lib/referral-vote-token-mint.server", () => ({
  syncReferralVoteTokenMintForVote: mocks.syncReferralVoteTokenMintForVote,
}));

vi.mock("@/lib/referral-invitations.server", () => ({
  resolveInvitationReferrer: mocks.resolveInvitationReferrer,
  convertReferralInvitationForVote: mocks.convertReferralInvitationForVote,
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}));

vi.mock("@/lib/tasks/user-treaty-task.server", () => ({
  ensureUserTreatyTask: mocks.ensureUserTreatyTask,
}));

vi.mock("@/lib/organization-context-token.server", () => ({
  verifyOrgContextToken: mocks.verifyOrgContextToken,
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

const TREATY_REFERENDUM = {
  ...ACTIVE_REFERENDUM,
  slug: "one-percent-treaty",
};

describe("POST /api/referendums/[slug]/vote", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.activityCreate.mockResolvedValue({ id: "activity_1" });
    mocks.checkBadgesAfterWish.mockResolvedValue(undefined);
    mocks.grantWishes.mockResolvedValue(null);
    mocks.organizationFindUnique.mockResolvedValue(null);
    mocks.syncReferralVoteTokenMintForVote.mockResolvedValue(null);
    mocks.resolveInvitationReferrer.mockResolvedValue(null);
    mocks.convertReferralInvitationForVote.mockResolvedValue(null);
    mocks.ensurePersonForUser.mockResolvedValue({ id: "person_1" });
    mocks.ensureUserTreatyTask.mockResolvedValue({
      created: false,
      taskId: "task_root",
      subtaskIds: {
        assignFirstHuman: "task_assign_1",
        assignSecondHuman: "task_assign_2",
        completeTraining: "task_training",
        shareReferralUrl: "task_share",
      },
    });
    mocks.verifyOrgContextToken.mockReturnValue({ ok: false, reason: "no-token" });
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
    await expect(res.json()).resolves.toEqual({
      vote,
      referrerVoteTokenMint: null,
      wishesEarned: 2,
      convertedReferralInvitation: null,
    });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId_referendumId: { userId: "user_1", referendumId: "ref_1" } },
      update: { answer: "YES", deletedAt: null },
      create: { userId: "user_1", referendumId: "ref_1", answer: "YES", referredByUserId: null },
    });
    expect(mocks.syncReferralVoteTokenMintForVote).toHaveBeenCalledWith({
      referredVoterUserId: "user_1",
      referrerUserId: undefined,
      referendumId: "ref_1",
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

  it("syncs the treaty task without sending a vote-receipt email", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(TREATY_REFERENDUM);
    const vote = { id: "vote_1", answer: "YES", userId: "user_1", referendumId: "ref_1" };
    mocks.upsert.mockResolvedValue(vote);

    const res = await POST(
      makeRequest("one-percent-treaty", { answer: "yes" }),
      makeParams("one-percent-treaty"),
    );

    expect(res.status).toBe(200);
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1");
    expect(mocks.ensureUserTreatyTask).toHaveBeenCalledWith({
      personId: "person_1",
      userId: "user_1",
    });
  });

  it("casts a NO vote successfully", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    const vote = { id: "vote_2", answer: "NO", userId: "user_1", referendumId: "ref_1" };
    mocks.upsert.mockResolvedValue(vote);

    const res = await POST(makeRequest("test-ref", { answer: "no" }), makeParams("test-ref"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      vote,
      referrerVoteTokenMint: null,
      wishesEarned: 0,
      convertedReferralInvitation: null,
    });
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
    await expect(res.json()).resolves.toEqual({
      vote: updatedVote,
      referrerVoteTokenMint: null,
      wishesEarned: 0,
      convertedReferralInvitation: null,
    });
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

  it("uses invite token referrer when no generic ref is provided", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.resolveInvitationReferrer.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
      convertedVoteId: null,
      status: "PENDING",
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      referredByUserId: "referrer_1",
    });

    await POST(
      makeRequest("test-ref", { answer: "YES", inviteToken: "token_1" }),
      makeParams("test-ref"),
    );

    expect(mocks.findUserByUsernameOrReferralCode).not.toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: "referrer_1" }),
      }),
    );
  });

  it("still uses an already-converted invite token as referral attribution for forwarded links", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "second_voter" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.resolveInvitationReferrer.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
      convertedVoteId: "original_vote",
      status: "CONVERTED",
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_2",
      referredByUserId: "referrer_1",
    });
    mocks.convertReferralInvitationForVote.mockResolvedValue({
      id: "invite_1",
      convertedVoteId: "original_vote",
      status: "CONVERTED",
    });

    const res = await POST(
      makeRequest("test-ref", { answer: "YES", inviteToken: "token_1" }),
      makeParams("test-ref"),
    );

    expect(res.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: "referrer_1" }),
      }),
    );
    expect(mocks.convertReferralInvitationForVote).toHaveBeenCalledWith({
      inviteToken: "token_1",
      voterUserId: "second_voter",
      referendumId: "ref_1",
      voteId: "vote_2",
    });
  });

  it("does NOT set referrer when invite token belongs to the voter", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.resolveInvitationReferrer.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "user_1",
      referendumId: "ref_1",
      convertedVoteId: null,
      status: "PENDING",
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      referredByUserId: null,
    });

    await POST(
      makeRequest("test-ref", { answer: "YES", inviteToken: "token_1" }),
      makeParams("test-ref"),
    );

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ referredByUserId: null }),
      }),
    );
    expect(mocks.syncReferralVoteTokenMintForVote).toHaveBeenCalledWith({
      referredVoterUserId: "user_1",
      referrerUserId: null,
      referendumId: "ref_1",
    });
  });

  it("converts a matching invitation after a verified vote", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    const vote = {
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
      referredByUserId: "referrer_1",
    };
    mocks.upsert.mockResolvedValue(vote);
    mocks.resolveInvitationReferrer.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
      convertedVoteId: null,
      status: "PENDING",
    });
    mocks.convertReferralInvitationForVote.mockResolvedValue({
      id: "invite_1",
      status: "CONVERTED",
      convertedVoteId: "vote_1",
    });

    const res = await POST(
      makeRequest("test-ref", { answer: "YES", inviteToken: "token_1" }),
      makeParams("test-ref"),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      vote,
      referrerVoteTokenMint: null,
      wishesEarned: 0,
      convertedReferralInvitation: {
        id: "invite_1",
        status: "CONVERTED",
        convertedVoteId: "vote_1",
      },
    });
    expect(mocks.convertReferralInvitationForVote).toHaveBeenCalledWith({
      inviteToken: "token_1",
      voterUserId: "user_1",
      referendumId: "ref_1",
      voteId: "vote_1",
    });
  });

  it("leaves treaty invitation conversion notification to the task system", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(TREATY_REFERENDUM);
    const vote = {
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
      referredByUserId: "referrer_1",
    };
    mocks.upsert.mockResolvedValue(vote);
    mocks.resolveInvitationReferrer.mockResolvedValue({
      id: "invite_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
      convertedVoteId: null,
      status: "PENDING",
    });
    mocks.convertReferralInvitationForVote.mockResolvedValue({
      id: "invite_1",
      status: "CONVERTED",
      convertedVoteId: "vote_1",
    });

    const res = await POST(
      makeRequest("one-percent-treaty", { answer: "YES", inviteToken: "token_1" }),
      makeParams("one-percent-treaty"),
    );

    expect(res.status).toBe(200);
    expect(mocks.convertReferralInvitationForVote).toHaveBeenCalledWith({
      inviteToken: "token_1",
      voterUserId: "user_1",
      referendumId: "ref_1",
      voteId: "vote_1",
    });
    expect(mocks.ensurePersonForUser).toHaveBeenCalledWith("user_1");
    expect(mocks.ensureUserTreatyTask).toHaveBeenCalledWith({
      personId: "person_1",
      userId: "user_1",
    });
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

  it("queues the referral reward for the vote's stored referrer", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
      referredByUserId: "referrer_1",
    });
    mocks.syncReferralVoteTokenMintForVote.mockResolvedValue({
      id: "mint_1",
      userId: "referrer_1",
    });

    const res = await POST(
      makeRequest("test-ref", { answer: "YES", ref: "friend123" }),
      makeParams("test-ref"),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      vote: {
        id: "vote_1",
        answer: "YES",
        userId: "user_1",
        referendumId: "ref_1",
        referredByUserId: "referrer_1",
      },
      referrerVoteTokenMint: {
        id: "mint_1",
        userId: "referrer_1",
      },
      wishesEarned: 0,
      convertedReferralInvitation: null,
    });
    expect(mocks.syncReferralVoteTokenMintForVote).toHaveBeenCalledWith({
      referredVoterUserId: "user_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
    });
  });

  it("stores verified organization attribution alongside personal referral credit", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.findUserByUsernameOrReferralCode.mockResolvedValue({ id: "referrer_1" });
    mocks.verifyOrgContextToken.mockReturnValue({
      ok: true,
      organizationId: "org_1",
      payload: {
        organizationId: "org_1",
        issuedAt: "2026-04-29T00:00:00.000Z",
        expiresAt: "2026-05-06T00:00:00.000Z",
        sessionSalt: "salt",
      },
    });
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      status: "APPROVED",
      deletedAt: null,
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
      referredByUserId: "referrer_1",
      organizationId: "org_1",
    });

    await POST(
      makeRequest("test-ref", {
        answer: "YES",
        ref: "friend123",
        orgContextToken: "signed-org-token",
      }),
      makeParams("test-ref"),
    );

    expect(mocks.verifyOrgContextToken).toHaveBeenCalledWith("signed-org-token");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        // Org attribution is first-org-wins: set on create, never on update.
        update: expect.not.objectContaining({ organizationId: expect.anything() }),
        create: expect.objectContaining({
          referredByUserId: "referrer_1",
          organizationId: "org_1",
        }),
      }),
    );
  });

  it("does not overwrite existing organization attribution on a revote", async () => {
    // The upsert.update branch must never carry organizationId — first org wins.
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.verifyOrgContextToken.mockReturnValue({
      ok: true,
      organizationId: "org_b",
      payload: {
        organizationId: "org_b",
        issuedAt: "2026-04-29T00:00:00.000Z",
        expiresAt: "2026-05-06T00:00:00.000Z",
        sessionSalt: "salt",
      },
    });
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_b",
      status: "APPROVED",
      deletedAt: null,
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      answer: "NO",
      userId: "user_1",
      referendumId: "ref_1",
    });

    await POST(
      makeRequest("test-ref", { answer: "NO", orgContextToken: "org-b-token" }),
      makeParams("test-ref"),
    );

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.not.objectContaining({ organizationId: expect.anything() }),
        // create still carries the new org so a brand-new voter from Org B is attributed.
        create: expect.objectContaining({ organizationId: "org_b" }),
      }),
    );
  });

  it("does not attribute an organization when the token signature is invalid", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.verifyOrgContextToken.mockReturnValue({ ok: false, reason: "bad-signature" });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
    });

    await POST(
      makeRequest("test-ref", { answer: "YES", orgContextToken: "tampered-token" }),
      makeParams("test-ref"),
    );

    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.not.objectContaining({ organizationId: expect.anything() }),
        create: expect.not.objectContaining({ organizationId: expect.anything() }),
      }),
    );
  });

  it("ignores signed organization attribution when the organization is no longer approved", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.verifyOrgContextToken.mockReturnValue({
      ok: true,
      organizationId: "org_1",
      payload: {
        organizationId: "org_1",
        issuedAt: "2026-04-29T00:00:00.000Z",
        expiresAt: "2026-05-06T00:00:00.000Z",
        sessionSalt: "salt",
      },
    });
    mocks.organizationFindUnique.mockResolvedValue({
      id: "org_1",
      status: "REJECTED",
      deletedAt: null,
    });
    mocks.upsert.mockResolvedValue({
      id: "vote_1",
      answer: "YES",
      userId: "user_1",
      referendumId: "ref_1",
    });

    await POST(
      makeRequest("test-ref", {
        answer: "YES",
        orgContextToken: "signed-org-token",
      }),
      makeParams("test-ref"),
    );

    expect(mocks.organizationFindUnique).toHaveBeenCalledWith({
      where: { id: "org_1" },
      select: { id: true, status: true, deletedAt: true },
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.not.objectContaining({ organizationId: "org_1" }),
        create: expect.not.objectContaining({ organizationId: "org_1" }),
      }),
    );
  });
});
