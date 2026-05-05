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
  canManageOrganization,
  createOrganizationWithOwner,
  normalizeOrganizationHttpUrl,
  normalizeOrganizationLogoUrl,
} from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";

interface NewOrganizationInput {
  name: string;
  type?: string | null;
  website?: string | null;
  description?: string | null;
  logo?: string | null;
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
    const { userId } = await requireAuth();
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
      const logo = normalizeOrganizationLogoUrl(body.newOrganization.logo);
      if (logo === false) {
        return NextResponse.json(
          { error: "Invalid logo URL" },
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
      const org = await createOrganizationWithOwner(
        {
          name,
          type,
          website,
          description: body.newOrganization.description ?? null,
          logo,
          contactEmail: body.newOrganization.contactEmail ?? null,
          status: OrgStatus.APPROVED,
        },
        userId,
        { rejectDuplicates: false },
      );
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
    } else {
      return NextResponse.json(
        { error: "Provide organizationId or newOrganization" },
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

    return NextResponse.json(
      { success: true, position: record },
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
