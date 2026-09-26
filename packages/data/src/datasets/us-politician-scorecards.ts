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
// Actual budget line items (FY2024 dollars unless noted)
// ---------------------------------------------------------------------------

/** Real dollar amounts for major budget categories */
const BUDGET_ITEMS = {
  // Military / Destructive
  NDAA_DEFENSE: 900_600_000_000,          // NDAA FY2026 (S. 1071), the systemWideRatio numerator
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
  destructiveDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  constructiveDollarsVotedFor: number;
  keyVotes: KeyVote[];
}

export interface KeyVote {
  bill: string;
  amount: number;
  category: "military" | "clinical_trials" | "enforcement" | "other";
  vote: "YEA" | "NAY";
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Read from generated JSON (single source of truth)
// ---------------------------------------------------------------------------

/** One member as the generator writes it: raw name ("Paul, Rand"), upper-case bioguide ID. */
export interface GeneratedPoliticianScorecard {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
  votes: { bill: string; vote: string; amount: number; category: string; sourceUrl?: string }[];
}

export interface GeneratedPresidentScorecard {
  name: string;
  term: string;
  totalMilitarySigned: number;
  totalNIHSigned: number;
  clinicalTrialPortion: number;
  ratio: number;
  keyActions: string[];
}

export interface GeneratedPoliticianScorecardData {
  generatedAt: string;
  /** The latest Congress whose members are scored. */
  congress: number;
  /** Every Congress whose members are scored, such as [118, 119]. */
  congresses: number[];
  memberCount: number;
  systemWideRatio: number;
  scorecards: GeneratedPoliticianScorecard[];
  presidents: GeneratedPresidentScorecard[];
}

/**
 * The generated JSON, unchanged. Import this instead of reading the file from
 * disk: a bundled import ships with every build, and a path relative to the
 * app's working directory breaks when the app moves.
 */
export const GENERATED_POLITICIAN_SCORECARD_DATA =
  generatedData as GeneratedPoliticianScorecardData;

const scorecards = GENERATED_POLITICIAN_SCORECARD_DATA.scorecards;

function toScorecard(raw: GeneratedPoliticianScorecard): PoliticianScorecard {
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
    destructiveDollarsVotedFor: mil,
    clinicalTrialDollarsVotedFor: trials,
    constructiveDollarsVotedFor: trials, // simplified — trials ≈ constructive for this dataset
    keyVotes: raw.votes.map((v) => ({
      bill: v.bill,
      amount: v.amount,
      category: v.category as KeyVote["category"],
      vote: v.vote as KeyVote["vote"],
      sourceUrl: v.sourceUrl,
    })),
  };
}

/** All scorecards sorted by ratio (worst first — highest ratio at top) */
export const POLITICIAN_SCORECARDS: PoliticianScorecard[] = scorecards
  .map(toScorecard)
  .sort((a, b) => b.militaryToTrialsRatio - a.militaryToTrialsRatio);

/** Get scorecards ranked by military:trials ratio (worst first) */
export function getPoliticiansByAlignment(): PoliticianScorecard[] {
  return [...POLITICIAN_SCORECARDS];
}

/** The system-wide ratio for comparison (from generated data) */
export const SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO =
  GENERATED_POLITICIAN_SCORECARD_DATA.systemWideRatio;

/** Budget items for display */
export { BUDGET_ITEMS };
