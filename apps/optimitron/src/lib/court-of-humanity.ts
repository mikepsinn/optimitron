/**
 * Slug for the Court of Humanity referendum. Lives in its own file
 * (mirroring `lib/treaty.ts` and `lib/declaration.ts`) so the slug constant
 * can be imported from the API route, the config module, the storage layer,
 * and the seed without forming an import cycle.
 *
 * The Court of Humanity is framed as something users JOIN (becoming a
 * member of the decentralized court / jury), not "sign" — but the
 * underlying data model is the same `ReferendumVote` table as the 1% Treaty
 * (one YES vote per user per referendum). The "join" framing lives entirely
 * in the UX/copy layer (referendum config: introText, signedTitle,
 * signedBody, shareText, etc.). See `config/referendums.ts`.
 */
export const COURT_OF_HUMANITY_SLUG = "court-of-humanity";
