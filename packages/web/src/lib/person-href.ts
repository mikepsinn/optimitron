/**
 * Person URL resolver. Always use this when building a `/people/{...}` link
 * so we have a single source of truth for handle-vs-id behavior.
 *
 * Order of preference:
 *   1. Person.handle (the readable URL we want)
 *   2. Person.id (cuid fallback for old data without a handle)
 *
 * The `/people/[id]` route accepts both forms — handle lookup first, then cuid.
 */

export interface PersonRefForHref {
  id: string;
  handle?: string | null;
}

export function getPersonHref(person: PersonRefForHref): string {
  return `/people/${person.handle ?? person.id}`;
}

/**
 * Resolve a User to a person href, when the user has a linked Person record.
 * Falls back to a no-link (`null`) when the user has no Person at all.
 */
export function getUserPersonHref(user: {
  person?: PersonRefForHref | null;
}): string | null {
  if (!user.person) return null;
  return getPersonHref(user.person);
}
