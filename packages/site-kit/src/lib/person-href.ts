/**
 * Person URL resolver. Always use this when building a `/people/{...}` link
 * so we have a single source of truth for handle-vs-id behavior.
 *
 * Order of preference:
 *   1. Person.handle (the readable URL we want)
 *   2. Person.id when no handle is available
 */

export interface PersonRefForHref {
  id: string
  handle?: string | null
}

export function getPersonHref(person: PersonRefForHref): string {
  return `/people/${person.handle ?? person.id}`
}
