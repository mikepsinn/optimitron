import { NextResponse } from "next/server";
import {
  OrganizationReferendumPositionStatus,
  OrgType,
  VotePosition,
} from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  canManageOrganization,
  createOrganizationWithOwner,
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
      select: { id: true, deletedAt: true },
    });
    if (!referendum || referendum.deletedAt) {
      return NextResponse.json(
        { error: "Referendum not found" },
        { status: 404 },
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
      const org = await createOrganizationWithOwner(
        {
          name,
          type,
          website: body.newOrganization.website ?? null,
          description: body.newOrganization.description ?? null,
          logo: body.newOrganization.logo ?? null,
          contactEmail: body.newOrganization.contactEmail ?? null,
        },
        userId,
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
      select: { id: true, status: true },
    });

    if (existing?.status === OrganizationReferendumPositionStatus.APPROVED) {
      return NextResponse.json(
        {
          error:
            "This organization already has an approved position on this referendum. An admin must reject or delete it before a new one can be submitted.",
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
        status: OrganizationReferendumPositionStatus.PENDING,
      },
      create: {
        organizationId,
        referendumId: referendum.id,
        position,
        statement: body.statement ?? null,
        submittedByUserId: userId,
        status: OrganizationReferendumPositionStatus.PENDING,
      },
    });

    return NextResponse.json({ success: true, position: record }, { status: 201 });
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
