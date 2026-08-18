import {
  PersonhoodProvider,
  PersonhoodVerificationStatus,
  SocialPlatform,
  PointMintStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";

const REWARD_WALLET_PLATFORMS = [
  SocialPlatform.BASE,
  SocialPlatform.ETHEREUM,
] as const;
const POINT_AMOUNT = "1000000000000000000";
const DEFAULT_SYNC_BATCH_SIZE = 500;

interface SyncReferralPointMintForVoteParams {
  referredVoterUserId: string;
  referrerUserId: string | null;
  referendumId: string;
}

function getPointChainId() {
  return Number(serverEnv.EOP_CHAIN_ID ?? "84532");
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

function canRewriteMint(status: PointMintStatus) {
  return status === PointMintStatus.PENDING || status === PointMintStatus.FAILED;
}

export async function syncReferralPointMintForVote({
  referredVoterUserId,
  referrerUserId,
  referendumId,
}: SyncReferralPointMintForVoteParams) {
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

  const existingMint = await prisma.pointMint.findUnique({
    where: {
      nullifierHash_referendumId: {
        nullifierHash,
        referendumId,
      },
    },
  });

  if (!existingMint) {
    return prisma.pointMint.create({
      data: {
        userId: referrerUserId,
        referendumId,
        nullifierHash,
        walletAddress,
        amount: POINT_AMOUNT,
        chainId: getPointChainId(),
      },
    });
  }

  if (!canRewriteMint(existingMint.status)) {
    return existingMint;
  }

  return prisma.pointMint.update({
    where: { id: existingMint.id },
    data: {
      userId: referrerUserId,
      walletAddress,
      amount: POINT_AMOUNT,
      chainId: getPointChainId(),
      deletedAt: null,
    },
  });
}

export async function syncReferralPointMintsForVerifiedVoter(
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
      syncReferralPointMintForVote({
        referredVoterUserId,
        referrerUserId: vote.referredByUserId,
        referendumId: vote.referendumId,
      }),
    ),
  );

  return syncedMints.filter((mint) => mint !== null);
}

export async function syncPendingReferralPointMints(
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
      syncReferralPointMintForVote({
        referredVoterUserId: vote.userId,
        referrerUserId: vote.referredByUserId,
        referendumId: vote.referendumId,
      }),
    ),
  );

  return syncedMints.filter((mint) => mint !== null);
}
