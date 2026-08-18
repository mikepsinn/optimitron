import { NextResponse } from "next/server";
import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  OrgType,
  ReferendumStatus,
  VotePosition,
} from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  assertOrganizationCanBePubliclyReferenced,
  canManageOrganization,
  createOrganizationWithOwner,
  ensureOrganizationTreatyActivationTask,
  normalizeOrganizationHttpUrl,
  normalizeOrganizationImageUrl,
} from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";

interface NewOrganizationInput {
  name: string;
  type?: string | null;
  website?: string | null;
  description?: string | null;
  donationUrl?: string | null;
  squareLogoUrl?: string | null;
  wordmarkLogoUrl?: string | null;
  contactEmail?: string | null;
}

interface Body {
  organizationId?: string;
  newOrganization?: NewOrganizationInput;
  position?: string;
  statement?: string | null;
}

function parsePosition(raw: unknown): VotePosition | null {
  if (typeof raw !== "string") return null;
  const up = raw.toUpperCase();
  if (up === "YES" || up === "NO" || up === "ABSTAIN") {
    return up as VotePosition;
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { userEmail, userId } = await requireAuth();
    const { slug } = await params;
    const body = (await request.json()) as Body;

    const position = parsePosition(body.position);
    if (!position) {
      return NextResponse.json(
        { error: "position must be YES, NO, or ABSTAIN" },
        { status: 400 },
      );
    }

    const referendum = await prisma.referendum.findUnique({
      where: { slug },
      select: { id: true, status: true, deletedAt: true },
    });
    if (!referendum || referendum.deletedAt) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
      );
    }
    if (referendum.status !== ReferendumStatus.ACTIVE) {
      return NextResponse.json(
        {
          error:
            "This referendum is not currently accepting organization signatures",
        },
        { status: 400 },
      );
    }

    let organization: {
      id: string;
      name?: string | null;
      slug?: string | null;
    };
    let organizationId: string;

    if (body.newOrganization) {
      const name = body.newOrganization.name?.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Organization name is required" },
          { status: 400 },
        );
      }
      const type =
        body.newOrganization.type && body.newOrganization.type in OrgType
          ? (body.newOrganization.type as OrgType)
          : OrgType.NONPROFIT;
      const squareLogoUrl = normalizeOrganizationImageUrl(
        body.newOrganization.squareLogoUrl,
      );
      if (squareLogoUrl === false) {
        return NextResponse.json(
          { error: "Invalid square logo URL" },
          { status: 400 },
        );
      }
      const wordmarkLogoUrl = normalizeOrganizationImageUrl(
        body.newOrganization.wordmarkLogoUrl,
      );
      if (wordmarkLogoUrl === false) {
        return NextResponse.json(
          { error: "Invalid wordmark logo URL" },
          { status: 400 },
        );
      }
      const website = normalizeOrganizationHttpUrl(
        body.newOrganization.website,
      );
      if (website === false) {
        return NextResponse.json(
          { error: "Invalid website URL" },
          { status: 400 },
        );
      }
      const donationUrl = normalizeOrganizationHttpUrl(
        body.newOrganization.donationUrl,
      );
      if (donationUrl === false) {
        return NextResponse.json(
          { error: "Invalid donation URL" },
          { status: 400 },
        );
      }
      // Idempotency window for the AbortController retry race in
      // organization-endorsement-sync.ts. If our 12s fetch timeout fires
      // after the server already wrote the Organization but before the
      // client parsed the response, the client retries with the same draft.
      // `rejectDuplicates: false` is intentional cross-user (two real orgs
      // can share a name), so the only safe place to dedup is "same user,
      // same name, recent" — that's this user's own retry, never a
      // collision with another user's submission.
      const RETRY_WINDOW_MS = 5 * 60 * 1000;
      const recentOwn = await prisma.organization.findFirst({
        where: {
          creatorId: userId,
          name,
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - RETRY_WINDOW_MS) },
        },
        select: { id: true, name: true, slug: true },
      });
      const org =
        recentOwn ??
        (await createOrganizationWithOwner(
          {
            name,
            type,
            website,
            donationUrl,
            description: body.newOrganization.description ?? null,
            squareLogoUrl,
            wordmarkLogoUrl,
            contactEmail:
              body.newOrganization.contactEmail ?? userEmail ?? null,
            status: OrgStatus.APPROVED,
          },
          userId,
          { rejectDuplicates: false },
        ));
      organization = org;
      organizationId = org.id;
    } else if (body.organizationId) {
      const canManage = await canManageOrganization(
        userId,
        body.organizationId,
      );
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this organization" },
          { status: 403 },
        );
      }
      organizationId = body.organizationId;
      organization = { id: organizationId };
    } else {
      return NextResponse.json(
        { error: "Provide organizationId or newOrganization" },
        { status: 400 },
      );
    }

    try {
      await assertOrganizationCanBePubliclyReferenced(organizationId);
    } catch {
      return NextResponse.json(
        {
          error:
            "Organization must be approved and public before signing a public referendum",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.organizationReferendumPosition.findUnique({
      where: {
        organizationId_referendumId: {
          organizationId,
          referendumId: referendum.id,
        },
      },
      select: { id: true, status: true, deletedAt: true },
    });

    if (
      existing?.deletedAt ||
      existing?.status === OrganizationReferendumPositionStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          error:
            "This organization's signatory record was removed by an admin.",
        },
        { status: 409 },
      );
    }

    const record = await prisma.organizationReferendumPosition.upsert({
      where: {
        organizationId_referendumId: {
          organizationId,
          referendumId: referendum.id,
        },
      },
      update: {
        position,
        statement: body.statement ?? null,
        submittedByUserId: userId,
        approvedByUserId: null,
        deletedAt: null,
        status: OrganizationReferendumPositionStatus.APPROVED,
      },
      create: {
        organizationId,
        referendumId: referendum.id,
        position,
        statement: body.statement ?? null,
        submittedByUserId: userId,
        status: OrganizationReferendumPositionStatus.APPROVED,
      },
    });

    let task: { id: string } | null = null;
    if (position === VotePosition.YES) {
      try {
        task = await ensureOrganizationTreatyActivationTask(
          {
            organizationId,
            organizationName: organization.name,
            organizationSlug: organization.slug,
          },
          userId,
        );
      } catch (error) {
        console.error(
          "Error creating organization treaty activation task:",
          error,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        organizationId,
        position: record,
        taskId: task?.id ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error submitting organization position:", error);
    return NextResponse.json(
      { error: "Failed to submit position" },
      { status: 500 },
    );
  }
}
