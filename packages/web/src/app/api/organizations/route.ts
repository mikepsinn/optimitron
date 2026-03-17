import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { OrgStatus } from "@optomitron/db";

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
    const { name, type, website, description, jurisdictionId } =
      await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Generate slug
    let slug = slugify(name);

    // Ensure uniqueness
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      const count = await prisma.organization.count({
        where: { slug: { startsWith: slug } },
      });
      slug = `${slug}-${count + 1}`;
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        type: type || "NONPROFIT",
        website: website || null,
        description: description || null,
        contactEmail: userEmail,
        status: OrgStatus.APPROVED,
        creatorId: userId,
        jurisdictionId: jurisdictionId || null,
      },
    });

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
