/**
 * Build the canonical lookup key stored on OrganizationName rows.
 * Keep this deterministic and locale-independent so imports and search agree.
 */
export function normalizeOrganizationName(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['\u2019]/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
