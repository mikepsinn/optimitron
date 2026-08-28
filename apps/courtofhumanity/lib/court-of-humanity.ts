/**
 * Slug for the Court of Humanity referendum. Same constant as the
 * monolith's `lib/court-of-humanity.ts` — the underlying data model is the
 * shared `Referendum` / `ReferendumVote` tables, so the slug must match the
 * seeded row exactly.
 *
 * The Court of Humanity is framed as something users JOIN (becoming a
 * member of the decentralized court / jury), not "sign" — the "join"
 * framing lives entirely in the UX/copy layer.
 */
export const COURT_OF_HUMANITY_SLUG = "court-of-humanity";
