import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  ActivityType,
  OrgStatus,
  ReferendumStatus,
  ReferendumVoteSource,
  VotePosition,
} from "@optimitron/db";
import { findUserByHandleOrReferralCode } from "@/lib/referral.server";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";
import { syncReferralVoteTokenMintForVote } from "@/lib/referral-vote-token-mint.server";
import {
  convertReferralInvitationForVote,
  resolveInvitationReferrer,
} from "@/lib/referral-invitations.server";
import { createLogger } from "@/lib/logger";
import { ensurePersonForUser } from "@/lib/person.server";
import { ensureSubjectForPerson } from "@/lib/subject.server";
import { ensureHumanityVGovernmentPlaintiffParty } from "@/lib/humanity-v-government-case.server";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { verifyOrgContextToken } from "@/lib/organization-context-token.server";

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
      orgContextToken?: string;
      /// Full URL the voter was on when they hit submit (window.location.href).
      /// Captured for forensic attribution — first-vote-wins, never overwritten.
      originUrl?: string;
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

    if (referendum.status !== ReferendumStatus.ACTIVE) {
      return NextResponse.json(
        { error: "This referendum is not currently accepting votes" },
        { status: 400 },
      );
    }

    // Resolve referrer if provided
    let referredByUserId: string | null = null;
    if (body.ref) {
      const referrer = await findUserByHandleOrReferralCode(body.ref);
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

    const orgContextVerification = verifyOrgContextToken(body.orgContextToken);
    const verifiedOrganization = orgContextVerification.ok
      ? await prisma.organization.findUnique({
          where: { id: orgContextVerification.organizationId },
          select: { id: true, status: true, deletedAt: true },
        })
      : null;
    const organizationId =
      verifiedOrganization &&
      verifiedOrganization.status === OrgStatus.APPROVED &&
      !verifiedOrganization.deletedAt
        ? verifiedOrganization.id
        : null;
    /// Full URL the voter was on (e.g. https://warondisease.org/vote?ref=alice).
    /// Captured at insert time from the client. Variant key is derivable from
    /// the URL host on demand. First-vote-wins — revote does not overwrite.
    const originUrl = typeof body.originUrl === "string" ? body.originUrl : null;
    const person = await ensurePersonForUser(userId);
    const vote = await prisma.referendumVote.upsert({
      where: {
        referendumId_personId: {
          referendumId: referendum.id,
          personId: person.id,
        },
      },
      // Org attribution is first-org-wins, matching referredByUserId semantics:
      // it is set on create only and never overwritten by later revotes.
      update: {
        answer: answer as VotePosition,
        deletedAt: null,
        isPublic: true,
        userId,
        voteSource: ReferendumVoteSource.SELF,
      },
      create: {
        userId,
        personId: person.id,
        referendumId: referendum.id,
        answer: answer as VotePosition,
        voteSource: ReferendumVoteSource.SELF,
        referredByUserId,
        isPublic: true,
        originUrl,
        ...(organizationId ? { organizationId } : {}),
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

    // Apply public-profile intent from the signature-box checkbox. Person owns
    // the public-profile flag; we route the toggle through personId. Only
    // writes when the caller sent an explicit boolean AND it differs from the
    // current state (avoids redundant writes).
    if (typeof body.makePublic === "boolean") {
      if (person.isPublic !== body.makePublic) {
        await prisma.person.update({
          where: { id: person.id },
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
            ...(organizationId ? { organizationId } : {}),
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

    if (referendum.slug === TREATY_REFERENDUM_SLUG) {
      try {
        await ensureUserTreatyTask({
          personId: person.id,
          userId,
        });
      } catch (taskError) {
        log.error("Treaty humanity-management task sync error", taskError);
      }

      // Auto-register YES voters as plaintiffs on Humanity v. Government.
      // Plaintiff = treaty signer = juror, one click. The case row is upserted
      // by ensureHumanityVGovernmentPlaintiffParty so we don't need a separate
      // seed; first plaintiff in creates the case. Skipped for NO/ABSTAIN since
      // dissenting voters do not register a plaintiff claim.
      if (answer === "YES") {
        try {
          // Re-read person.isPublic so the plaintiff visibility reflects the
          // makePublic toggle that may have just fired above.
          const refreshedPerson = await prisma.person.findUnique({
            where: { id: person.id },
            select: { displayName: true, isPublic: true },
          });
          await prisma.$transaction(async (tx) => {
            const subject = await ensureSubjectForPerson(tx, {
              id: person.id,
              displayName: refreshedPerson?.displayName ?? person.displayName,
            });
            await ensureHumanityVGovernmentPlaintiffParty(tx, {
              createdByUserId: userId,
              displayName: refreshedPerson?.displayName ?? person.displayName,
              isPublic: refreshedPerson?.isPublic ?? false,
              subjectId: subject.id,
            });
          });
        } catch (plaintiffError) {
          log.error("Plaintiff registration error", plaintiffError);
        }
      }
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
