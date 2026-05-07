import { NextRequest, NextResponse } from "next/server";
import { OrganizationReferendumPositionStatus } from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | OrganizationReferendumPositionStatus
      | null;
    const referendumSlug = searchParams.get("referendumSlug");
    const organizationId = searchParams.get("organizationId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;
    if (referendumSlug) {
      where.referendum = { slug: referendumSlug };
    }

    const [positions, total] = await Promise.all([
      prisma.organizationReferendumPosition.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              squareLogoUrl: true,
              website: true,
            },
          },
          referendum: { select: { id: true, slug: true, title: true } },
          submittedBy: {
            select: {
              id: true,
              email: true,
              person: { select: { displayName: true } },
            },
          },
          approvedBy: {
            select: { id: true, person: { select: { displayName: true } } },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.organizationReferendumPosition.count({ where }),
    ]);

    return NextResponse.json({
      positions,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin referendum-positions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 },
    );
  }
}
