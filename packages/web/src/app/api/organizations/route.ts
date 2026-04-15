import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { createOrganizationWithOwner } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { OrgStatus, OrgType } from "@optimitron/db";

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
    const { userId, userEmail } = await requireAuth();
    const body = (await req.json()) as {
      name?: string;
      type?: string;
      website?: string;
      description?: string;
      jurisdictionId?: string;
    };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    const type =
      body.type && body.type in OrgType
        ? (body.type as OrgType)
        : OrgType.NONPROFIT;

    const organization = await createOrganizationWithOwner(
      {
        name,
        type,
        website: body.website ?? null,
        description: body.description ?? null,
        contactEmail: userEmail ?? null,
        jurisdictionId: body.jurisdictionId ?? null,
      },
      userId,
    );

    return NextResponse.json(
      { success: true, organization },
      { status: 201 },
    );
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
