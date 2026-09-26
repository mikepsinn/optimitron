import { getPolicyPath, ROUTES } from "@/lib/routes";

/**
 * The generator once emitted one efficiency policy per federal budget line
 * ("Veterans Affairs: Adopt South Korea's Approach"). Lines that shared an
 * OECD spending field got copies of the same field-level effects. It now
 * emits one policy per field. Each retired URL points at the field that
 * replaced it, so the redirect survives a change of benchmark country.
 */
const RETIRED_POLICY_SLUG_FIELDS: Record<string, string> = {
  "national-randd-spending-adopt-netherlands-s-approach": "rdSpendingPerCapitaPpp",
  "public-social-spending-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "military-adopt-switzerland-s-approach": "militarySpendingPerCapitaPpp",
  "homeland-security-adopt-switzerland-s-approach": "militarySpendingPerCapitaPpp",
  "veterans-affairs-adopt-south-korea-s-approach": "healthSpendingPerCapitaPpp",
  "health-non-medicare-medicaid-adopt-south-korea-s-approach": "healthSpendingPerCapitaPpp",
  "justice-law-enforcement-adopt-south-korea-s-approach": "socialSpendingPerCapitaPpp",
  "epa-environment-adopt-south-korea-s-approach": "socialSpendingPerCapitaPpp",
  "energy-adopt-netherlands-s-approach": "rdSpendingPerCapitaPpp",
  "science-nasa-adopt-netherlands-s-approach": "rdSpendingPerCapitaPpp",
  "commerce-economic-development-adopt-netherlands-s-approach": "rdSpendingPerCapitaPpp",
  "education-adopt-japan-s-approach": "educationSpendingPerCapitaPpp",
  "transportation-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "hud-housing-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "foreign-aid-international-affairs-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "labor-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "agriculture-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "treasury-general-government-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "state-department-diplomacy-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
  "interior-natural-resources-adopt-singapore-s-approach": "socialSpendingPerCapitaPpp",
};

/**
 * Where a retired policy slug should go: the current policy for the same
 * spending field, or the policy index when that field has no policy.
 * Returns null for a slug that was never retired.
 */
export function retiredPolicyRedirectPath(
  slug: string,
  policies: ReadonlyArray<{ name: string; oecdSpendingField?: string }>,
): string | null {
  const field = RETIRED_POLICY_SLUG_FIELDS[slug];
  if (!field) return null;
  const successor = policies.find((policy) => policy.oecdSpendingField === field);
  return successor ? getPolicyPath(successor.name) : ROUTES.opg;
}
