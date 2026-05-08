import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  findCandidateDuplicateDeceasedPersons,
  type DuplicatePersonCandidate,
} from "@/lib/people-dedup.server";

export const dynamic = "force-dynamic";

interface SerializedCandidate
  extends Omit<DuplicatePersonCandidate, "birthDate" | "deathDate"> {
  birthDate: string | null;
  deathDate: string | null;
}

function parseOptionalDate(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
}

function serializeCandidate(
  candidate: DuplicatePersonCandidate,
): SerializedCandidate {
  return {
    id: candidate.id,
    displayName: candidate.displayName,
    handle: candidate.handle,
    image: candidate.image,
    isPublic: candidate.isPublic,
    birthDate: candidate.birthDate ? candidate.birthDate.toISOString() : null,
    deathDate: candidate.deathDate ? candidate.deathDate.toISOString() : null,
  };
}

/**
 * GET /api/people/duplicate-search?name=X&deathDate=YYYY-MM-DD&birthDate=YYYY-MM-DD
 *
 * Returns up to 10 existing `Person` candidates that look like duplicates
 * of a draft registration. Used by the represented-person form to surface
 * "did you mean to register an existing estate?" before the user submits a
 * new record.
 *
 * Auth required so we don't hand the Person table to unauthenticated
 * scrapers.
 */
export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  if (name.length < 2) {
    return NextResponse.json({ candidates: [] });
  }

  const deathDate = parseOptionalDate(url.searchParams.get("deathDate"));
  const birthDate = parseOptionalDate(url.searchParams.get("birthDate"));

  const candidates = await findCandidateDuplicateDeceasedPersons({
    displayName: name,
    deathDate,
    birthDate,
  });

  return NextResponse.json({
    candidates: candidates.map(serializeCandidate),
  });
}
