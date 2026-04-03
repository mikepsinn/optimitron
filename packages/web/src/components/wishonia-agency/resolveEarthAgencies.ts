import { getEarthAgency, type EarthAgency, type WishoniaAgency } from "@optimitron/data";

/**
 * Resolve all Earth agencies that a Wishonia agency replaces.
 * Filters to only agencies with performance data (needed for charts/grades).
 */
export function resolveEarthAgencies(agency: WishoniaAgency): EarthAgency[] {
  return agency.replaces
    .map((id) => getEarthAgency(id))
    .filter(
      (ea): ea is EarthAgency => ea !== undefined && ea.performance !== undefined,
    );
}
