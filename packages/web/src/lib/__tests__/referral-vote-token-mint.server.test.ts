import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  personhoodVerificationFindFirst: vi.fn(),
  referendumVoteFindMany: vi.fn(),
  socialAccountFindFirst: vi.fn(),
  voteTokenMintCreate: vi.fn(),
  voteTokenMintFindUnique: vi.fn(),
  voteTokenMintUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    personhoodVerification: {
      findFirst: mocks.personhoodVerificationFindFirst,
    },
    referendumVote: {
      findMany: mocks.referendumVoteFindMany,
    },
    socialAccount: {
      findFirst: mocks.socialAccountFindFirst,
    },
    voteTokenMint: {
      create: mocks.voteTokenMintCreate,
      findUnique: mocks.voteTokenMintFindUnique,
      update: mocks.voteTokenMintUpdate,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  serverEnv: {
    VOTE_TOKEN_CHAIN_ID: "84532",
  },
}));

import {
  syncPendingReferralVoteTokenMints,
  syncReferralVoteTokenMintForVote,
  syncReferralVoteTokenMintsForVerifiedVoter,
} from "../referral-vote-token-mint.server";

describe("referral vote token mint sync helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null when the vote has no eligible referrer", async () => {
    const result = await syncReferralVoteTokenMintForVote({
      referredVoterUserId: "voter_1",
      referrerUserId: null,
      referendumId: "ref_1",
    });

    expect(result).toBeNull();
    expect(mocks.personhoodVerificationFindFirst).not.toHaveBeenCalled();
    expect(mocks.socialAccountFindFirst).not.toHaveBeenCalled();
  });

  it("creates a pending mint for the referrer wallet", async () => {
    mocks.personhoodVerificationFindFirst.mockResolvedValue({
      externalId: "world-nullifier-1",
    });
    mocks.socialAccountFindFirst.mockResolvedValue({
      walletAddress: "0xreferrer",
    });
    mocks.voteTokenMintFindUnique.mockResolvedValue(null);
    mocks.voteTokenMintCreate.mockResolvedValue({
      id: "mint_1",
      userId: "referrer_1",
    });

    const result = await syncReferralVoteTokenMintForVote({
      referredVoterUserId: "voter_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
    });

    expect(mocks.voteTokenMintCreate).toHaveBeenCalledWith({
      data: {
        userId: "referrer_1",
        referendumId: "ref_1",
        nullifierHash: "world-nullifier-1",
        walletAddress: "0xreferrer",
        amount: "1000000000000000000",
        chainId: 84532,
      },
    });
    expect(result).toEqual({ id: "mint_1", userId: "referrer_1" });
  });

  it("updates mutable existing mints instead of creating duplicates", async () => {
    mocks.personhoodVerificationFindFirst.mockResolvedValue({
      externalId: "world-nullifier-1",
    });
    mocks.socialAccountFindFirst.mockResolvedValue({
      walletAddress: "0xnew-wallet",
    });
    mocks.voteTokenMintFindUnique.mockResolvedValue({
      id: "mint_existing",
      status: "FAILED",
    });
    mocks.voteTokenMintUpdate.mockResolvedValue({
      id: "mint_existing",
      userId: "referrer_1",
      walletAddress: "0xnew-wallet",
    });

    const result = await syncReferralVoteTokenMintForVote({
      referredVoterUserId: "voter_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
    });

    expect(mocks.voteTokenMintUpdate).toHaveBeenCalledWith({
      where: { id: "mint_existing" },
      data: {
        userId: "referrer_1",
        walletAddress: "0xnew-wallet",
        amount: "1000000000000000000",
        chainId: 84532,
        deletedAt: null,
      },
    });
    expect(result).toEqual({
      id: "mint_existing",
      userId: "referrer_1",
      walletAddress: "0xnew-wallet",
    });
  });

  it("leaves confirmed mints unchanged", async () => {
    mocks.personhoodVerificationFindFirst.mockResolvedValue({
      externalId: "world-nullifier-1",
    });
    mocks.socialAccountFindFirst.mockResolvedValue({
      walletAddress: "0xreferrer",
    });
    mocks.voteTokenMintFindUnique.mockResolvedValue({
      id: "mint_confirmed",
      status: "CONFIRMED",
      userId: "referrer_1",
    });

    const result = await syncReferralVoteTokenMintForVote({
      referredVoterUserId: "voter_1",
      referrerUserId: "referrer_1",
      referendumId: "ref_1",
    });

    expect(mocks.voteTokenMintUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: "mint_confirmed",
      status: "CONFIRMED",
      userId: "referrer_1",
    });
  });

  it("syncs all referred votes for a newly verified voter", async () => {
    mocks.referendumVoteFindMany.mockResolvedValue([
      { referendumId: "ref_1", referredByUserId: "referrer_1" },
      { referendumId: "ref_2", referredByUserId: "referrer_2" },
    ]);
    mocks.personhoodVerificationFindFirst.mockResolvedValue({
      externalId: "world-nullifier-1",
    });
    mocks.socialAccountFindFirst
      .mockResolvedValueOnce({ walletAddress: "0x1" })
      .mockResolvedValueOnce({ walletAddress: "0x2" });
    mocks.voteTokenMintFindUnique.mockResolvedValue(null);
    mocks.voteTokenMintCreate
      .mockResolvedValueOnce({ id: "mint_1" })
      .mockResolvedValueOnce({ id: "mint_2" });

    const result = await syncReferralVoteTokenMintsForVerifiedVoter("voter_1");

    expect(mocks.referendumVoteFindMany).toHaveBeenCalledWith({
      where: {
        userId: "voter_1",
        referredByUserId: { not: null },
        deletedAt: null,
        person: {
          deletedAt: null,
          lifeStatus: "LIVING",
        },
        voteSource: "SELF",
      },
      orderBy: { createdAt: "asc" },
      select: {
        referendumId: true,
        referredByUserId: true,
      },
    });
    expect(result).toEqual([{ id: "mint_1" }, { id: "mint_2" }]);
  });

  it("syncs globally eligible referral rewards for cron backfill", async () => {
    mocks.referendumVoteFindMany.mockResolvedValue([
      {
        userId: "voter_1",
        referendumId: "ref_1",
        referredByUserId: "referrer_1",
      },
    ]);
    mocks.personhoodVerificationFindFirst.mockResolvedValue({
      externalId: "world-nullifier-1",
    });
    mocks.socialAccountFindFirst.mockResolvedValue({
      walletAddress: "0xreferrer",
    });
    mocks.voteTokenMintFindUnique.mockResolvedValue(null);
    mocks.voteTokenMintCreate.mockResolvedValue({ id: "mint_1" });

    const result = await syncPendingReferralVoteTokenMints(25);

    expect(mocks.referendumVoteFindMany).toHaveBeenCalledWith({
      where: {
        referredByUserId: { not: null },
        deletedAt: null,
        person: {
          deletedAt: null,
          lifeStatus: "LIVING",
        },
        user: {
          personhoodVerifications: {
            some: {
              provider: "WORLD_ID",
              status: "VERIFIED",
              deletedAt: null,
            },
          },
        },
        referrer: {
          socialAccounts: {
            some: {
              platform: { in: ["BASE", "ETHEREUM"] },
              walletAddress: { not: null },
              deletedAt: null,
            },
          },
        },
        voteSource: "SELF",
      },
      orderBy: { createdAt: "asc" },
      take: 25,
      select: {
        userId: true,
        referendumId: true,
        referredByUserId: true,
      },
    });
    expect(result).toEqual([{ id: "mint_1" }]);
  });
});
