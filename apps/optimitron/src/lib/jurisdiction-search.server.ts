import { JurisdictionType, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface JurisdictionSearchResult {
  code: string | null;
  id: string;
  name: string;
  type: JurisdictionType;
}

/**
 * Typeahead lookup for jurisdictions. Used by the represented-person form's
 * "responsible governments" multi-picker and by future memorial/conflict
 * filtering surfaces. Defaults to country-level results since that's the
 * dominant attribution unit for memorial cases.
 */
export async function searchJurisdictions(
  query: string,
  options: {
    limit?: number;
    types?: JurisdictionType[];
  } = {},
): Promise<JurisdictionSearchResult[]> {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const types = options.types ?? [JurisdictionType.COUNTRY];

  const trimmed = query.trim();

  const where: Prisma.JurisdictionWhereInput = {
    deletedAt: null,
    type: { in: types },
    ...(trimmed
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { code: { equals: trimmed.toUpperCase() } },
          ],
        }
      : {}),
  };

  const rows = await prisma.jurisdiction.findMany({
    where,
    orderBy: [{ name: "asc" }],
    select: { code: true, id: true, name: true, type: true },
    take: limit,
  });

  return rows;
}
