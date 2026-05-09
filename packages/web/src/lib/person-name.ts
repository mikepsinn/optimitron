export interface NameParts {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}

function normalizeNamePart(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function buildDisplayNameFromParts(parts: NameParts): string {
  return [
    normalizeNamePart(parts.firstName),
    normalizeNamePart(parts.middleName),
    normalizeNamePart(parts.lastName),
  ]
    .filter(Boolean)
    .join(" ");
}

export function splitDisplayNameIntoNameParts(displayName: string): {
  firstName: string;
  middleName: string;
  lastName: string;
} {
  const parts = normalizeNamePart(displayName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return {
      firstName: parts[0]!,
      middleName: "",
      lastName: "",
    };
  }
  return {
    firstName: parts[0]!,
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts.at(-1)!,
  };
}
