/**
 * Convert a name to a URL-safe slug.
 *
 * Deliberately separate from `slug.ts`'s `generateSlug`: this one maps `&` to
 * "and" and strips underscores. Plaintiff `relationshipType` and responsible
 * party `roleSlug` values are persisted with these rules, so the two slug
 * helpers must not be merged.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
