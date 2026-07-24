import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import {
  assertOrganizationCanBePrivate,
  canManageOrganization,
  normalizeOrganizationHttpUrl,
  normalizeOrganizationImageUrl,
  PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR,
} from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { ContentVisibility } from "@optimitron/db";

async function requireManager(userId: string, organizationId: string) {
  if (await canManageOrganization(userId, organizationId)) return;
  throw new Error("Forbidden");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.EARTHDATA_WRITE,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await params;
    await requireManager(userId, id);

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                person: { select: { displayName: true } },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        referendumPositions: {
          include: {
            referendum: { select: { id: true, slug: true, title: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!org || org.deletedAt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Organization GET error:", error);
    return NextResponse.json(
      { error: "Failed to load organization" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth(request, [
      McpScope.EARTHDATA_WRITE,
      McpScope.TASKS_ADMIN,
    ]);
    const { id } = await params;
    await requireManager(userId, id);

    const body = (await request.json()) as {
      name?: string;
      website?: string | null;
      description?: string | null;
      donationUrl?: string | null;
      squareLogoUrl?: string | null;
      wordmarkLogoUrl?: string | null;
      contactEmail?: string | null;
      visibility?: string;
    };
    const squareLogoUrl =
      body.squareLogoUrl === undefined
        ? undefined
        : normalizeOrganizationImageUrl(body.squareLogoUrl);
    const wordmarkLogoUrl =
      body.wordmarkLogoUrl === undefined
        ? undefined
        : normalizeOrganizationImageUrl(body.wordmarkLogoUrl);
    const website =
      body.website === undefined
        ? undefined
        : normalizeOrganizationHttpUrl(body.website);
    const donationUrl =
      body.donationUrl === undefined
        ? undefined
        : normalizeOrganizationHttpUrl(body.donationUrl);

    if (squareLogoUrl === false) {
      return NextResponse.json(
        { error: "Invalid square logo URL" },
        { status: 400 },
      );
    }
    if (wordmarkLogoUrl === false) {
      return NextResponse.json(
        { error: "Invalid wordmark logo URL" },
        { status: 400 },
      );
    }
    if (website === false) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 },
      );
    }
    if (donationUrl === false) {
      return NextResponse.json(
        { error: "Invalid donation URL" },
        { status: 400 },
      );
    }
    const visibility =
      body.visibility === undefined
        ? undefined
        : ContentVisibility[body.visibility as keyof typeof ContentVisibility];
    if (body.visibility !== undefined && !visibility) {
      return NextResponse.json(
        { error: "Invalid organization visibility" },
        { status: 400 },
      );
    }
    if (visibility === ContentVisibility.PRIVATE) {
      await assertOrganizationCanBePrivate(id);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name?.trim() || undefined,
        website,
        donationUrl,
        description:
          body.description === undefined ? undefined : body.description,
        squareLogoUrl,
        wordmarkLogoUrl,
        contactEmail:
          body.contactEmail === undefined ? undefined : body.contactEmail,
        visibility,
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      error instanceof Error &&
      error.message === PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Organization PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
