const PUBLIC_OFFICIAL_SOURCE_REF_PREFIXES = ["wikidata:", "bioguide:"] as const;

interface PublicFigureLike {
  isPublicFigure?: boolean | null;
  sourceRef?: string | null;
}

export function isPublicOfficialPerson(person: PublicFigureLike | null | undefined) {
  if (!person?.isPublicFigure) {
    return false;
  }

  const sourceRef = person.sourceRef?.trim().toLowerCase();
  if (!sourceRef) {
    return false;
  }

  return PUBLIC_OFFICIAL_SOURCE_REF_PREFIXES.some((prefix) => sourceRef.startsWith(prefix));
}
