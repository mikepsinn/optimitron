import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { VotePosition } from "@optimitron/db";
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server";
import { serverEnv } from "@/lib/env";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;
    const body = (await request.json()) as {
      answer: string;
      ref?: string;
    };

    const answer = body.answer?.toUpperCase();
    if (!answer || !["YES", "NO", "ABSTAIN"].includes(answer)) {
      return NextResponse.json(
        { error: "Answer must be YES, NO, or ABSTAIN" },
        { status: 400 },
      );
    }

    const referendum = await prisma.referendum.findUnique({
      where: { slug, deletedAt: null },
    });

    if (!referendum) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
      );
    }

    if (referendum.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This referendum is not currently accepting votes" },
        { status: 400 },
      );
    }

    // Resolve referrer if provided
    let referredByUserId: string | null = null;
    if (body.ref) {
      const referrer = await findUserByUsernameOrReferralCode(body.ref);
      if (referrer && referrer.id !== userId) {
        referredByUserId = referrer.id;
      }
    }

    const vote = await prisma.referendumVote.upsert({
      where: {
        userId_referendumId: {
          userId,
          referendumId: referendum.id,
        },
      },
      update: {
        answer: answer as VotePosition,
        deletedAt: null,
      },
      create: {
        userId,
        referendumId: referendum.id,
        answer: answer as VotePosition,
        referredByUserId,
      },
    });

    // Queue VOTE token mint if user has verified World ID + wallet
    let voteTokenMint = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          personhoodVerifications: {
            where: { provider: "WORLD_ID", status: "VERIFIED", deletedAt: null },
            take: 1,
          },
        },
      });

      const verification = user?.personhoodVerifications[0];
      const walletAddress = (body as Record<string, unknown>).walletAddress as
        | string
        | undefined;

      if (verification && walletAddress) {
        const chainId = Number(serverEnv.VOTE_TOKEN_CHAIN_ID ?? "84532"); // Base Sepolia (testnet) by default
        const amount = "1000000000000000000"; // 1 VOTE (1e18)

        voteTokenMint = await prisma.voteTokenMint.upsert({
          where: {
            userId_referendumId: { userId, referendumId: referendum.id },
          },
          update: {
            walletAddress,
            deletedAt: null,
          },
          create: {
            userId,
            referendumId: referendum.id,
            nullifierHash: verification.externalId,
            walletAddress,
            amount,
            chainId,
          },
        });
      }
    } catch (mintError) {
      // Non-blocking: vote succeeds even if mint queue fails
      console.error("[VOTE TOKEN MINT] Queue error:", mintError);
    }

    // Grant wish points for voting
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "REFERENDUM_VOTE",
        amount: 2,
        dedupeKey: referendum.id,
      });
      if (wishResult) wishesEarned = wishResult.amount;
      void checkBadgesAfterWish(userId, "REFERENDUM_VOTE");
    } catch (wishError) {
      console.error("[REFERENDUM VOTE] Wish grant error:", wishError);
    }

    return NextResponse.json({ vote, voteTokenMint, wishesEarned });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[REFERENDUM VOTE] Error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 },
    );
  }
}
