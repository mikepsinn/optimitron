import { PersonLifeStatus } from "@optimitron/db";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { McpScope } from "@/lib/mcp-scopes";
import { getPersonHref } from "@/lib/person-href";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeQuery(value: string | null) {
  return value?.trim() ?? "";
}

export async function GET(request: Request) {
  try {
    await requireAuth(request, [
      McpScope.TASKS_PERSONAL,
      McpScope.EARTHDATA_WRITE,
    ]);
    const { searchParams } = new URL(request.url);
    const query = normalizeQuery(searchParams.get("q"));

    if (query.length < 2) {
      return NextResponse.json({ data: [], success: true });
    }

    const emailSearch = query.includes("@") ? query.toLowerCase() : null;
    const people = await prisma.person.findMany({
      orderBy: [{ isPublicFigure: "desc" }, { displayName: "asc" }],
      select: {
        currentAffiliation: true,
        displayName: true,
        handle: true,
        headline: true,
        id: true,
        image: true,
        isPublicFigure: true,
      },
      take: 8,
      where: {
        AND: [
          {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              {
                handle: {
                  contains: query.replace(/^@/u, ""),
                  mode: "insensitive",
                },
              },
              { headline: { contains: query, mode: "insensitive" } },
              {
                currentAffiliation: { contains: query, mode: "insensitive" },
              },
              ...(emailSearch ? [{ email: { equals: emailSearch } }] : []),
            ],
          },
          {
            OR: [
              { email: { not: null } },
              { user: { is: { deletedAt: null } } },
            ],
          },
        ],
        deletedAt: null,
        lifeStatus: { not: PersonLifeStatus.DECEASED },
      },
    });

    return NextResponse.json({
      data: people.map((person) => ({
        affiliation: person.currentAffiliation,
        displayName: person.displayName,
        handle: person.handle,
        headline: person.headline,
        href: getPersonHref(person),
        id: person.id,
        image: person.image,
        isPublicFigure: person.isPublicFigure,
      })),
      success: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[PEOPLE_SEARCH] Failed to search people:", error);
    return NextResponse.json(
      { error: "Failed to search people." },
      { status: 500 },
    );
  }
}
