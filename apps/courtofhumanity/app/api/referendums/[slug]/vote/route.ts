import { NextResponse } from "next/server";
import {
  ActivityType,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  ReferendumStatus,
  ReferendumVoteSource,
  VotePosition,
} from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ensurePersonForUser } from "@/lib/person.server";
import { findUserByHandleOrReferralCode } from "@/lib/referral.server";
import { createLogger } from "@/lib/logger";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { ensureHumanityVGovernmentPlaintiffParty } from "@/lib/humanity-v-government-case.server";
import { ensureSubjectForPerson } from "@/lib/subject.server";

const log = createLogger("referendum-vote");

/**
 * Court of Humanity vote endpoint, ported from the monolith's
 * `/api/referendums/[slug]/vote`. Scoped to the two referendums this app
 * serves (the Humanity v. Government verdict and Court of Humanity
 * membership) so the treaty flow — with its wish grants, badges, referral
 * point mints, invitation conversions, and post-vote emails — stays on the
 * app that owns those systems. Votes recorded here land in the same
 * `ReferendumVote` table, and YES verdicts still register the voter as a
 * named plaintiff on the case.
 */

const SERVED_REFERENDUM_SLUGS = new Set<string>([
  COURT_OF_HUMANITY_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;

    if (!SERVED_REFERENDUM_SLUGS.has(slug)) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      answer: string;
      displayName?: string;
      ref?: string;
      makePublic?: boolean;
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
      // Referrer attribution is first-referrer-wins, matching the monolith:
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
      },
    });

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

    try {
      await prisma.activity.create({
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
    } catch (activityError) {
      log.error("Activity log error", { error: activityError });
    }

    // Auto-register YES verdict voters as plaintiffs on Humanity v.
    // Government, matching the monolith. Skipped for NO/ABSTAIN since
    // dissenting or undecided voters do not register a plaintiff claim.
    if (
      answer === "YES" &&
      referendum.slug === HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG
    ) {
      try {
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
        log.error("Plaintiff registration error", { error: plaintiffError });
      }
    }

    return NextResponse.json({ vote });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Error", { error });
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
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { slug } = await params;

    if (!SERVED_REFERENDUM_SLUGS.has(slug)) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
      );
    }

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
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.error("Error", { error });
    return NextResponse.json({ error: "Failed to load vote" }, { status: 500 });
  }
}
