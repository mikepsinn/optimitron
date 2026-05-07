import { PersonLifeStatus } from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";

/**
 * Plaintiff-dedup pre-search.
 *
 * Before letting a user register a deceased relative as a plaintiff on
 * Humanity v. Government, we look for likely-existing rows so two grand-
 * children registering the same grandfather don't create two `Person` rows
 * (and therefore two `CourtCaseParty` rows, double-counting the estate).
 *
 * Real class actions reconcile duplicates with SSN + court-supervised
 * notice; we don't have either, so the practical ceiling is canonicalized
 * fuzzy match on `displayName` + `deathDate` (the two fields a registrant
 * is most likely to fill in correctly), plus an obviously-deceased filter.
 */

const MAX_CANDIDATES = 10;

export interface DuplicatePersonCandidate {
  id: string;
  displayName: string;
  handle: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
  image: string | null;
  isPublic: boolean;
}

export interface FindDuplicateInput {
  displayName: string;
  deathDate?: Date | null;
  birthDate?: Date | null;
}

/**
 * Lowercase, strip diacritics, collapse whitespace, drop common punctuation.
 * Returns "" for empty/whitespace-only input. The same canonicalization is
 * intended for both the input and the candidate row's displayName so case +
 * accent + spacing variants collide.
 */
export function canonicalizePersonName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritic marks
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // keep letters, digits, space, hyphen
    .replace(/\s+/g, " ")
    .trim();
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * Find existing `Person` rows that look like duplicates of the given
 * registration draft. Returns up to {@link MAX_CANDIDATES} matches.
 *
 * Match policy (on first ship, deliberately conservative):
 *
 * - The candidate's canonicalized displayName equals the input's (full
 *   normalized form). No edit-distance / token-overlap fuzzy match yet —
 *   exact canonical match keeps false-positives low at the cost of missing
 *   "John Smith" vs "John A. Smith"-style near-misses.
 * - If `deathDate` is provided, the candidate must have a matching
 *   `deathDate` on the same UTC day, OR no `deathDate` at all (records
 *   created from a partial obituary that hasn't filled in the date).
 * - The candidate must not be soft-deleted.
 *
 * Returns the candidate set ordered most recently created first.
 */
export async function findCandidateDuplicateDeceasedPersons(
  input: FindDuplicateInput,
  db: typeof prisma = prisma,
): Promise<DuplicatePersonCandidate[]> {
  const canonical = canonicalizePersonName(input.displayName);
  if (canonical.length < 2) return [];

  const where: Prisma.PersonWhereInput = {
    deletedAt: null,
    displayName: { equals: input.displayName.trim(), mode: "insensitive" },
  };

  if (input.deathDate) {
    const start = startOfUtcDay(input.deathDate);
    const end = endOfUtcDay(input.deathDate);
    where.OR = [
      { deathDate: { gte: start, lte: end } },
      { deathDate: null, lifeStatus: PersonLifeStatus.DECEASED },
    ];
  } else {
    // Without a deathDate input, only pre-filter to deceased records to
    // keep this from accidentally surfacing living-person matches as
    // potential estate duplicates.
    where.lifeStatus = PersonLifeStatus.DECEASED;
  }

  const rows = await db.person.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_CANDIDATES,
    select: {
      id: true,
      displayName: true,
      handle: true,
      birthDate: true,
      deathDate: true,
      image: true,
      isPublic: true,
    },
  });

  // Final canonicalization filter — Postgres `mode: insensitive` handles
  // case but not diacritics/punctuation, so re-check with the canonical
  // function. This makes "Wishonia" match "wishónia" and "St. Jude"
  // match "St Jude" without burdening the DB with the normalization.
  return rows.filter(
    (row) => canonicalizePersonName(row.displayName) === canonical,
  );
}
