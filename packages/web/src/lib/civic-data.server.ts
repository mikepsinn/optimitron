import { fetchers } from "@optimitron/data";
import { ALIGNMENT_BENCHMARKS } from "./alignment-benchmarks";
import type { CivicRepresentative, StateDistrict } from "./civic-data";

export type { CivicRepresentative, StateDistrict };

type CongressMember = Awaited<ReturnType<typeof fetchers.fetchMembers>>[number];

/**
 * Resolve a US ZIP code to a state + congressional district
 * via the Census Geocoding API.
 */
export async function zipToStateDistrict(zip: string): Promise<StateDistrict | null> {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/address?zip=${encodeURIComponent(zip)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    result?: {
      addressMatches?: Array<{
        geographies?: {
          "Congressional Districts"?: Array<{
            STATE?: string;
            CD119?: string;
          }>;
          States?: Array<{
            STUSAB?: string;
          }>;
        };
      }>;
    };
  };

  const match = data.result?.addressMatches?.[0];
  if (!match) return null;

  const cd = match.geographies?.["Congressional Districts"]?.[0];
  const stateAbbr = match.geographies?.States?.[0]?.STUSAB;

  if (!stateAbbr) return null;

  const district = cd?.CD119 ? parseInt(cd.CD119, 10) : undefined;
  return { state: stateAbbr, district: district === 0 ? undefined : district };
}

function memberToRepresentative(m: CongressMember): CivicRepresentative {
  const benchmark = ALIGNMENT_BENCHMARKS.find(
    (b) => b.externalId === m.bioguideId || b.politicianId === m.bioguideId,
  );

  return {
    bioguideId: m.bioguideId,
    name: m.name,
    party: m.party,
    state: m.state,
    district: m.district,
    chamber: m.chamber,
    title: m.chamber === "Senate" ? "Senator" : "Representative",
    alignmentScore: benchmark
      ? Object.values(benchmark.allocations).reduce((a, b) => a + b, 0) > 0
        ? undefined // alignment score is user-specific, can't compute here
        : undefined
      : undefined,
  };
}

/**
 * Look up representatives for a given state and optional district.
 */
export async function lookupRepresentatives(
  state: string,
  district?: number,
): Promise<CivicRepresentative[]> {
  const members = await fetchers.fetchMembers(undefined, undefined, 500);
  if (!members.length) return [];

  const stateUpper = state.toUpperCase();

  // Senators: match state, chamber = Senate
  const senators = members.filter(
    (m) => m.state.toUpperCase() === stateUpper && m.chamber.toLowerCase() === "senate",
  );

  // House: match state + district
  const houseMembers = members.filter((m) => {
    if (m.state.toUpperCase() !== stateUpper) return false;
    if (m.chamber.toLowerCase() !== "house") return false;
    if (district != null && m.district != null) return m.district === district;
    return true;
  });

  return [...senators, ...houseMembers].map(memberToRepresentative);
}
