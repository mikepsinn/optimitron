import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { OrgStatus } from "@optomitron/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    // Check admin status
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
    const status = searchParams.get("status") as OrgStatus | null;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          type: true,
          website: true,
          contactEmail: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      organizations,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 },
    );
  }
}
