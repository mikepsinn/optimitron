import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import {
  createOrganizationWithOwner,
  normalizeOrganizationHttpUrl,
} from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { ContentVisibility, OrgStatus, OrgType } from "@optimitron/db";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const orgs = await prisma.organization.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        status: OrgStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(orgs);
  } catch (error) {
    console.error("Error searching organizations:", error);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail } = await requireAuth(req, [
      McpScope.EARTHDATA_WRITE,
      McpScope.TASKS_ADMIN,
    ]);
    const body = (await req.json()) as {
      name?: string;
      type?: string;
      website?: string;
      description?: string;
      jurisdictionId?: string;
      visibility?: string;
    };
    const name = body.name?.trim();
    const website = normalizeOrganizationHttpUrl(body.website);

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    if (website === false) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 },
      );
    }

    const type =
      body.type && body.type in OrgType
        ? (body.type as OrgType)
        : OrgType.NONPROFIT;
    if (body.visibility && !(body.visibility in ContentVisibility)) {
      return NextResponse.json(
        { error: "Invalid organization visibility" },
        { status: 400 },
      );
    }
    const visibility = body.visibility
      ? (body.visibility as ContentVisibility)
      : ContentVisibility.PUBLIC;

    const organization = await createOrganizationWithOwner(
      {
        name,
        type,
        status: OrgStatus.APPROVED,
        visibility,
        website,
        description: body.description ?? null,
        contactEmail: userEmail ?? null,
        jurisdictionId: body.jurisdictionId ?? null,
      },
      userId,
      { rejectDuplicates: false },
    );

    return NextResponse.json({ success: true, organization }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 },
    );
  }
}
