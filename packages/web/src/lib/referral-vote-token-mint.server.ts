import {
  PersonhoodProvider,
  PersonhoodVerificationStatus,
  SocialPlatform,
  VoteTokenMintStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";

const REWARD_WALLET_PLATFORMS = [
  SocialPlatform.BASE,
  SocialPlatform.ETHEREUM,
] as const;
const VOTE_TOKEN_AMOUNT = "1000000000000000000";
const DEFAULT_SYNC_BATCH_SIZE = 500;

interface SyncReferralVoteTokenMintForVoteParams {
  referredVoterUserId: string;
  referrerUserId: string | null;
  referendumId: string;
}

function getVoteTokenChainId() {
  return Number(serverEnv.VOTE_TOKEN_CHAIN_ID ?? "84532");
}

async function getVerifiedWorldIdNullifier(userId: string) {
  const verification = await prisma.personhoodVerification.findFirst({
    where: {
      userId,
      provider: PersonhoodProvider.WORLD_ID,
      status: PersonhoodVerificationStatus.VERIFIED,
      deletedAt: null,
    },
    select: { externalId: true },
  });

  return verification?.externalId ?? null;
}

async function getReferrerRewardWalletAddress(userId: string) {
  const walletAccount = await prisma.socialAccount.findFirst({
    where: {
      userId,
      walletAddress: { not: null },
      deletedAt: null,
      platform: { in: [...REWARD_WALLET_PLATFORMS] },
    },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: { walletAddress: true },
  });

  return walletAccount?.walletAddress ?? null;
}

function canRewriteMint(status: VoteTokenMintStatus) {
  return status === VoteTokenMintStatus.PENDING || status === VoteTokenMintStatus.FAILED;
}

export async function syncReferralVoteTokenMintForVote({
  referredVoterUserId,
  referrerUserId,
  referendumId,
}: SyncReferralVoteTokenMintForVoteParams) {
  if (!referrerUserId || referrerUserId === referredVoterUserId) {
    return null;
  }

  const [nullifierHash, walletAddress] = await Promise.all([
    getVerifiedWorldIdNullifier(referredVoterUserId),
    getReferrerRewardWalletAddress(referrerUserId),
  ]);

  if (!nullifierHash || !walletAddress) {
    return null;
  }

  const existingMint = await prisma.voteTokenMint.findUnique({
    where: {
      nullifierHash_referendumId: {
        nullifierHash,
        referendumId,
      },
    },
  });

  if (!existingMint) {
    return prisma.voteTokenMint.create({
      data: {
        userId: referrerUserId,
        referendumId,
        nullifierHash,
        walletAddress,
        amount: VOTE_TOKEN_AMOUNT,
        chainId: getVoteTokenChainId(),
      },
    });
  }

  if (!canRewriteMint(existingMint.status)) {
    return existingMint;
  }

  return prisma.voteTokenMint.update({
    where: { id: existingMint.id },
    data: {
      userId: referrerUserId,
      walletAddress,
      amount: VOTE_TOKEN_AMOUNT,
      chainId: getVoteTokenChainId(),
      deletedAt: null,
    },
  });
}

export async function syncReferralVoteTokenMintsForVerifiedVoter(
  referredVoterUserId: string,
) {
  const referredVotes = await prisma.referendumVote.findMany({
    where: {
      ...buildOfficialReferendumVoteWhere(),
      userId: referredVoterUserId,
      referredByUserId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      referendumId: true,
      referredByUserId: true,
    },
  });

  const syncedMints = await Promise.all(
    referredVotes.map((vote) =>
      syncReferralVoteTokenMintForVote({
        referredVoterUserId,
        referrerUserId: vote.referredByUserId,
        referendumId: vote.referendumId,
      }),
    ),
  );

  return syncedMints.filter((mint) => mint !== null);
}

export async function syncPendingReferralVoteTokenMints(
  limit = DEFAULT_SYNC_BATCH_SIZE,
) {
  const referredVotes = await prisma.referendumVote.findMany({
    where: {
      ...buildOfficialReferendumVoteWhere(),
      referredByUserId: { not: null },
      user: {
        personhoodVerifications: {
          some: {
            provider: PersonhoodProvider.WORLD_ID,
            status: PersonhoodVerificationStatus.VERIFIED,
            deletedAt: null,
          },
        },
      },
      referrer: {
        socialAccounts: {
          some: {
            platform: { in: [...REWARD_WALLET_PLATFORMS] },
            walletAddress: { not: null },
            deletedAt: null,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      userId: true,
      referendumId: true,
      referredByUserId: true,
    },
  });

  const syncedMints = await Promise.all(
    referredVotes.map((vote) =>
      syncReferralVoteTokenMintForVote({
        referredVoterUserId: vote.userId,
        referrerUserId: vote.referredByUserId,
        referendumId: vote.referendumId,
      }),
    ),
  );

  return syncedMints.filter((mint) => mint !== null);
}
