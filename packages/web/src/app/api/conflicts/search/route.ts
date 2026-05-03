import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export interface ConflictSearchResult {
  endDate: string | null;
  id: string;
  name: string;
  primaryJurisdictionCode: string | null;
  slug: string;
  startDate: string | null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "12", 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 12, 1), 50);

  const rows = await prisma.conflict.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { slug: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
    select: {
      endDate: true,
      id: true,
      name: true,
      primaryJurisdiction: { select: { code: true } },
      slug: true,
      startDate: true,
    },
    take: limit,
  });

  const results: ConflictSearchResult[] = rows.map((row) => ({
    endDate: row.endDate ? row.endDate.toISOString() : null,
    id: row.id,
    name: row.name,
    primaryJurisdictionCode: row.primaryJurisdiction?.code ?? null,
    slug: row.slug,
    startDate: row.startDate ? row.startDate.toISOString() : null,
  }));

  return NextResponse.json({ results });
}
