import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";

async function requireManagerOrAdmin(userId: string, organizationId: string) {
  if (await canManageOrganization(userId, organizationId)) return;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (u?.isAdmin) return;
  throw new Error("Forbidden");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    await requireManagerOrAdmin(userId, id);

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
    const { userId } = await requireAuth();
    const { id } = await params;
    await requireManagerOrAdmin(userId, id);

    const body = (await request.json()) as {
      name?: string;
      website?: string | null;
      description?: string | null;
      logo?: string | null;
      contactEmail?: string | null;
    };

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name?.trim() || undefined,
        website: body.website === undefined ? undefined : body.website,
        description:
          body.description === undefined ? undefined : body.description,
        logo: body.logo === undefined ? undefined : body.logo,
        contactEmail:
          body.contactEmail === undefined ? undefined : body.contactEmail,
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
    console.error("Organization PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
