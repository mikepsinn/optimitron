import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export interface ConditionSearchResult {
  id: string;
  name: string;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "12", 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 12, 1), 50);

  const rows = await prisma.globalVariable.findMany({
    where: {
      deletedAt: null,
      variableCategory: { name: "Condition" },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { synonyms: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true },
    take: limit,
  });

  const results: ConditionSearchResult[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));

  return NextResponse.json({ results });
}
