/**
 * Politician Scorecards — based on ACTUAL budget votes, not hypothetical allocations.
 *
 * Single source of truth: generated/politician-scorecards.json
 * Regenerate with: pnpm data:refresh:politicians
 *
 * The key metric: for every dollar of clinical trial funding a politician voted for,
 * how many dollars of military spending did they also vote for?
 *
 * Sources: Congress.gov roll call votes, OMB budget data
 */

import generatedData from "./generated/politician-scorecards.json";

// ---------------------------------------------------------------------------
// Actual budget line items (FY2024 dollars)
// ---------------------------------------------------------------------------

/** Real dollar amounts for major budget categories */
const BUDGET_ITEMS = {
  // Military / Destructive
  NDAA_DEFENSE: 886_000_000_000,          // National Defense Authorization Act FY2024
  NUCLEAR_WEAPONS: 37_700_000_000,         // NNSA weapons activities
  ISRAEL_MILITARY_AID: 3_800_000_000,      // Annual baseline + supplementals
  UKRAINE_MILITARY_AID: 24_000_000_000,    // FY2024 supplemental
  DRUG_WAR_ENFORCEMENT: 47_000_000_000,    // ONDCP total drug control budget
  ICE_CBP: 29_000_000_000,                // Immigration enforcement
  BOP_PRISONS: 8_500_000_000,             // Bureau of Prisons
  // Health / Constructive
  NIH_CLINICAL_TRIALS: 810_000_000,        // Actual clinical trial spending (JAMA)
  NIH_TOTAL_BUDGET: 47_300_000_000,        // NIH total (97% is NOT clinical trials)
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoliticianScorecard {
  id: string;
  name: string;
  party: string;
  title: string;
  district?: string;
  chamber?: string;
  militaryToTrialsRatio: number;
  militaryPctOfTotal: number;
  trialsPctOfTotal: number;
  grade: "A" | "B" | "C" | "D" | "F" | "—";
  destructiveDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  constructiveDollarsVotedFor: number;
  keyVotes: KeyVote[];
}

export interface KeyVote {
  bill: string;
  amount: number;
  category: "military" | "health" | "enforcement" | "other";
  vote: "YEA" | "NAY";
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Read from generated JSON (single source of truth)
// ---------------------------------------------------------------------------

interface GeneratedScorecard {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
  grade: string;
  votes: { bill: string; vote: string; amount: number; category: string }[];
}

const scorecards = (generatedData as { scorecards: GeneratedScorecard[] }).scorecards;

function toScorecard(raw: GeneratedScorecard): PoliticianScorecard {
  const mil = raw.militaryDollarsVotedFor;
  const trials = raw.clinicalTrialDollarsVotedFor;
  const total = mil + trials;

  return {
    id: raw.bioguideId.toLowerCase(),
    name: raw.name.includes(",")
      ? raw.name.split(", ").reverse().join(" ") // "Paul, Rand" → "Rand Paul"
      : raw.name,
    party: raw.party,
    title: raw.chamber === "Senate" ? "Senator" : "Representative",
    district: raw.state,
    chamber: raw.chamber.toLowerCase(),
    militaryToTrialsRatio: raw.ratio,
    militaryPctOfTotal: total > 0 ? Math.round((mil / total) * 1000) / 10 : 0,
    trialsPctOfTotal: total > 0 ? Math.round((trials / total) * 1000) / 10 : 0,
    grade: (raw.grade as PoliticianScorecard["grade"]) || "—",
    destructiveDollarsVotedFor: mil,
    clinicalTrialDollarsVotedFor: trials,
    constructiveDollarsVotedFor: trials, // simplified — trials ≈ constructive for this dataset
    keyVotes: raw.votes.map((v) => ({
      bill: v.bill,
      amount: v.amount,
      category: v.category as KeyVote["category"],
      vote: v.vote as KeyVote["vote"],
    })),
  };
}

/** All scorecards sorted by ratio (best first) */
export const POLITICIAN_SCORECARDS: PoliticianScorecard[] = scorecards
  .map(toScorecard)
  .sort((a, b) => a.militaryToTrialsRatio - b.militaryToTrialsRatio);

/** Get scorecards ranked by military:trials ratio (best first) */
export function getPoliticiansByAlignment(): PoliticianScorecard[] {
  return [...POLITICIAN_SCORECARDS];
}

/** The system-wide ratio for comparison (from generated data) */
export const SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO =
  (generatedData as { systemWideRatio: number }).systemWideRatio;

/** Budget items for display */
export { BUDGET_ITEMS };
