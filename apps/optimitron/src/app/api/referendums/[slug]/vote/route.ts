import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import {
  ActivityType,
  ContentVisibility,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  OrgStatus,
  ReferendumStatus,
  ReferendumVoteSource,
  VotePosition,
} from "@optimitron/db";
import { findUserByHandleOrReferralCode } from "@/lib/referral.server";
import { grantWishes } from "@/lib/wishes.server";
import { checkBadgesAfterWish } from "@/lib/badges.server";
import { syncReferralPointMintForVote } from "@/lib/referral-point-mint.server";
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
import { sendPostVoteShareEmail } from "@/lib/email/post-vote-share-email";
import { sendReferralFirstConversionEmail } from "@/lib/email/referral-first-conversion-email";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { getUserDisplayName, userDisplaySelect } from "@/lib/user-display";

const log = createLogger("referendum-vote");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [McpScope.EARTHDATA_WRITE]);
    const { slug } = await params;
    const body = (await request.json()) as {
      answer: string;
      displayName?: string;
      ref?: string;
      makePublic?: boolean;
      inviteToken?: string;
      organizationSlug?: string;
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
    const submittedDisplayName =
      typeof body.displayName === "string"
        ? body.displayName.trim().replace(/\s+/g, " ")
        : "";
    const makePublic =
      typeof body.makePublic === "boolean" ? body.makePublic : true;

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
      const invitationReferrer = await resolveInvitationReferrer(
        body.inviteToken,
      );
      if (invitationReferrer && invitationReferrer.referrerUserId !== userId) {
        referredByUserId = invitationReferrer.referrerUserId;
      }
    }

    const publicOrganizationSlug =
      typeof body.organizationSlug === "string"
        ? body.organizationSlug.trim()
        : "";
    const verifiedOrganization = publicOrganizationSlug
      ? await prisma.organization.findUnique({
          where: { slug: publicOrganizationSlug },
          select: {
            id: true,
            status: true,
            deletedAt: true,
            visibility: true,
          },
        })
      : null;
    const organizationId =
      verifiedOrganization &&
      verifiedOrganization.status === OrgStatus.APPROVED &&
      verifiedOrganization.visibility === ContentVisibility.PUBLIC &&
      !verifiedOrganization.deletedAt
        ? verifiedOrganization.id
        : null;
    /// Full URL the voter was on (e.g. https://warondisease.org/vote?ref=alice).
    /// Captured at insert time from the client. Variant key is derivable from
    /// the URL host on demand. First-vote-wins — revote does not overwrite.
    const originUrl =
      typeof body.originUrl === "string" ? body.originUrl : null;
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
        isPublic: makePublic,
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
        isPublic: makePublic,
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

    // Person owns the public-profile and display-name fields used by signer
    // lists. The vote keeps its own public flag so users can hide a specific
    // signature without changing old private votes into public signatories.
    const personUpdateData: { displayName?: string; isPublic?: boolean } = {};
    if (submittedDisplayName && submittedDisplayName !== person.displayName) {
      personUpdateData.displayName = submittedDisplayName;
    }
    if (
      typeof body.makePublic === "boolean" &&
      person.isPublic !== makePublic
    ) {
      personUpdateData.isPublic = makePublic;
    }
    if (Object.keys(personUpdateData).length > 0) {
      await prisma.person.update({
        where: { id: person.id },
        data: personUpdateData,
      });
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

    // Queue referral point reward for the referrer when the referred voter is verified.
    let referrerPointMint = null;
    try {
      referrerPointMint = await syncReferralPointMintForVote({
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

    async function registerHumanityVGovernmentPlaintiff() {
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

    if (referendum.slug === TREATY_REFERENDUM_SLUG) {
      try {
        await ensureUserTreatyTask({
          personId: person.id,
          userId,
        });
      } catch (taskError) {
        log.error("Treaty humanity-management task sync error", taskError);
      }
    }

    // Auto-register YES voters as plaintiffs on Humanity v. Government.
    // Skipped for NO/ABSTAIN since dissenting or undecided voters do not
    // register a plaintiff claim.
    if (
      answer === "YES" &&
      (referendum.slug === TREATY_REFERENDUM_SLUG ||
        referendum.slug === HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG)
    ) {
      await registerHumanityVGovernmentPlaintiff();
    }

    if (referendum.slug === TREATY_REFERENDUM_SLUG && answer === "YES") {
      // Forward-friendly post-vote share email + first-conversion email to
      // the referrer (if any). Both are deduped by emailLog dedupeKey so
      // re-votes and subsequent referral conversions don't fire again. The
      // two sends are independent: a voter share failure must not suppress
      // the referrer's first-conversion email (or vice-versa).
      type VoterRecord = {
        id: string;
        email: string;
        referralCode: string | null;
        person: {
          id: string;
          handle: string | null;
          displayName: string | null;
          image: string | null;
          isPublic: boolean | null;
        } | null;
      };
      let voter: VoterRecord | null = null;
      try {
        voter = (await prisma.user.findUnique({
          where: { id: userId },
          select: {
            ...userDisplaySelect,
            referralCode: true,
            // isPublic gates whether we surface this voter's name to the
            // referrer below. Not part of userDisplaySelect because most
            // display sites don't need it.
            person: {
              select: {
                id: true,
                handle: true,
                displayName: true,
                image: true,
                isPublic: true,
              },
            },
          },
        })) as VoterRecord | null;

        if (voter?.email) {
          const referralUrl = buildUserReferralUrl({
            handle: voter.person?.handle ?? null,
            referralCode: voter.referralCode,
          });
          await sendPostVoteShareEmail({
            voteId: vote.id,
            userId,
            toAddress: voter.email,
            referralUrl,
          });
        }
      } catch (postVoteShareError) {
        log.error("Post-vote share email error", postVoteShareError);
      }

      if (vote.referredByUserId) {
        try {
          const referrer = await prisma.user.findUnique({
            where: { id: vote.referredByUserId },
            select: {
              ...userDisplaySelect,
              referralCode: true,
            },
          });
          if (referrer?.email) {
            // Referral links can be shared anywhere (Twitter, group chats),
            // so the "referrer" may not actually know the voter. Only
            // expose the voter's display name when they've opted into a
            // public profile; otherwise fall back to a generic label.
            const voterDisplayName = voter?.person?.isPublic
              ? getUserDisplayName(voter)
              : "A new voter";
            const referrerReferralUrl = buildUserReferralUrl({
              handle: referrer.person?.handle ?? null,
              referralCode: referrer.referralCode,
            });
            await sendReferralFirstConversionEmail({
              referrerUserId: vote.referredByUserId,
              referrerEmail: referrer.email,
              voterDisplayName,
              dashboardUrl: `${getBaseUrl()}${ROUTES.dashboard}`,
              referrerReferralUrl,
            });
          }
        } catch (firstConversionError) {
          log.error(
            "Referral first-conversion email error",
            firstConversionError,
          );
        }
      }
    }

    return NextResponse.json({
      vote,
      referrerPointMint,
      wishesEarned,
      convertedReferralInvitation,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Error", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}

/**
 * GET /api/referendums/[slug]/vote — the session user's own vote, if any.
 * Lets signature surfaces render the already-signed state on a fresh page
 * load (e.g. returning from an email sign-in link) instead of re-offering
 * the signature box.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth(request);
    const { slug } = await params;

    const referendum = await prisma.referendum.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!referendum) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
      );
    }

    const person = await ensurePersonForUser(userId);
    const vote = await prisma.referendumVote.findUnique({
      where: {
        referendumId_personId: {
          referendumId: referendum.id,
          personId: person.id,
        },
      },
      select: {
        answer: true,
        createdAt: true,
        deletedAt: true,
        isPublic: true,
        person: { select: { displayName: true } },
      },
    });

    return NextResponse.json({
      vote: vote && !vote.deletedAt
        ? {
            answer: vote.answer,
            createdAt: vote.createdAt,
            displayName: vote.person.displayName,
            isPublic: vote.isPublic,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Error", error);
    return NextResponse.json({ error: "Failed to load vote" }, { status: 500 });
  }
}
