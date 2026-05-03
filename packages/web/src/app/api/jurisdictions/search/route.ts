import { NextResponse, type NextRequest } from "next/server";
import { JurisdictionType } from "@optimitron/db";
import { searchJurisdictions } from "@/lib/jurisdiction-search.server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set<JurisdictionType>([
  JurisdictionType.COUNTRY,
  JurisdictionType.STATE,
  JurisdictionType.CITY,
  JurisdictionType.COUNTY,
]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "12", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 12;
  const typeParams = url.searchParams.getAll("type");
  const requestedTypes = typeParams
    .map((t) => t.toUpperCase() as JurisdictionType)
    .filter((t) => ALLOWED_TYPES.has(t));
  const types = requestedTypes.length > 0 ? requestedTypes : undefined;

  const results = await searchJurisdictions(query, { limit, types });
  return NextResponse.json({ results });
}
