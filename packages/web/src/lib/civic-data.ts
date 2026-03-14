import { ALIGNMENT_BENCHMARKS } from "./alignment-benchmarks";

export interface CivicRepresentative {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: number;
  chamber: string;
  title: string;
  contactUrl?: string;
  alignmentScore?: number;
}

export interface StateDistrict {
  state: string;
  district?: number;
}

/**
 * Check if a benchmark profile exists for a given bioguide ID.
 */
export function hasBenchmarkProfile(bioguideId: string): boolean {
  return ALIGNMENT_BENCHMARKS.some(
    (b) => b.externalId === bioguideId || b.politicianId === bioguideId,
  );
}
