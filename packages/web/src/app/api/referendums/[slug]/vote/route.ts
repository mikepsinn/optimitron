import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ActivityType, VotePosition } from "@optimitron/db";
import { findUserByUsernameOrReferralCode } from "@/lib/referral.server";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";
import { syncReferralVoteTokenMintForVote } from "@/lib/referral-vote-token-mint.server";
import {
  convertReferralInvitationForVote,
  resolveInvitationReferrer,
} from "@/lib/referral-invitations.server";
import { createLogger } from "@/lib/logger";

const log = createLogger("referendum-vote");

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
      makePublic?: boolean;
      inviteToken?: string;
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
    if (!referredByUserId && body.inviteToken) {
      const invitationReferrer = await resolveInvitationReferrer(body.inviteToken);
      if (invitationReferrer && invitationReferrer.referrerUserId !== userId) {
        referredByUserId = invitationReferrer.referrerUserId;
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

    let convertedReferralInvitation = null;
    try {
      convertedReferralInvitation = await convertReferralInvitationForVote({
        inviteToken: body.inviteToken,
        voterUserId: userId,
        referendumId: referendum.id,
        voteId: vote.id,
      });
    } catch (invitationError) {
      log.error("Referral invitation conversion error", invitationError);
    }

    // Apply public-profile intent from the signature-box checkbox. Only
    // updates User.isPublic when the caller sent an explicit boolean AND it
    // differs from the current state (avoids redundant writes).
    if (typeof body.makePublic === "boolean") {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPublic: true },
      });
      if (currentUser && currentUser.isPublic !== body.makePublic) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPublic: body.makePublic },
        });
      }
    }

    let activityId: string | undefined;
    try {
      const activity = await prisma.activity.create({
        data: {
          userId,
          type: ActivityType.VOTED_REFERENDUM,
          description: "",
          entityType: "Referendum",
          entityId: referendum.id,
          metadata: JSON.stringify({
            answer,
            referendumId: referendum.id,
            referendumSlug: referendum.slug,
          }),
        },
      });
      activityId = activity.id;
    } catch (activityError) {
      log.error("Activity log error", activityError);
    }

    // Queue referral VOTE reward for the referrer when the referred voter is verified.
    let referrerVoteTokenMint = null;
    try {
      referrerVoteTokenMint = await syncReferralVoteTokenMintForVote({
        referredVoterUserId: userId,
        referrerUserId: vote.referredByUserId,
        referendumId: referendum.id,
      });
    } catch (mintError) {
      log.error("Referral reward queue error", mintError);
    }

    // Grant wish points for voting
    let wishesEarned = 0;
    try {
      const wishResult = await grantWishes({
        userId,
        reason: "REFERENDUM_VOTE",
        amount: 2,
        activityId,
        dedupeKey: referendum.id,
      });
      if (wishResult) wishesEarned = wishResult.amount;
      void checkBadgesAfterWish(userId, "REFERENDUM_VOTE");
    } catch (wishError) {
      log.error("Wish grant error", wishError);
    }

    return NextResponse.json({
      vote,
      referrerVoteTokenMint,
      wishesEarned,
      convertedReferralInvitation,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Error", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 },
    );
  }
}
