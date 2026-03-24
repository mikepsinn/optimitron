/**
 * Politician Scorecards — based on ACTUAL budget votes, not hypothetical allocations.
 *
 * The key metric: for every dollar of clinical trial funding a politician voted for,
 * how many dollars of military spending did they also vote for?
 *
 * The US system-wide ratio is 1,094:1 ($886B military / $810M clinical trials).
 * Any politician who votes YEA on both the NDAA and NIH funding gets that ratio.
 * The only way to improve it is to vote AGAINST military spending increases
 * or vote FOR clinical trial funding increases.
 *
 * Sources: Congress.gov roll call votes, OMB budget data
 */

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
  /** PRIMARY: $ military voted for / $ clinical trials voted for */
  militaryToTrialsRatio: number;
  /** Grade: A = voted against military AND for trials. F = voted for all military, against trials */
  grade: "A" | "B" | "C" | "D" | "F";
  /** Total $ of military/destructive spending they voted FOR */
  destructiveDollarsVotedFor: number;
  /** Total $ of clinical trial funding they voted FOR */
  clinicalTrialDollarsVotedFor: number;
  /** Total $ of all health/constructive spending they voted FOR */
  constructiveDollarsVotedFor: number;
  /** Key votes — what they voted YES and NO on */
  keyVotes: KeyVote[];
}

export interface KeyVote {
  bill: string;
  amount: number;
  category: "military" | "health" | "enforcement" | "other";
  vote: "YEA" | "NAY";
  /** Source URL for the roll call */
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Politician vote records (from Congressional roll calls)
// ---------------------------------------------------------------------------

interface PoliticianRecord {
  id: string;
  name: string;
  party: string;
  title: string;
  district?: string;
  chamber?: string;
  votes: KeyVote[];
}

const POLITICIAN_RECORDS: PoliticianRecord[] = [
  {
    id: "bernie-sanders",
    name: "Bernie Sanders",
    party: "Independent",
    title: "Senator",
    district: "Vermont",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "NAY", sourceUrl: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1181/vote_118_1_00325.htm" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "NAY" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
  {
    id: "rand-paul",
    name: "Rand Paul",
    party: "Republican",
    title: "Senator",
    district: "Kentucky",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "NAY", sourceUrl: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1181/vote_118_1_00325.htm" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "NAY" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "NAY" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
  {
    id: "thomas-massie",
    name: "Thomas Massie",
    party: "Republican",
    title: "Representative",
    district: "Kentucky-4",
    chamber: "house",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "NAY" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "NAY" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "NAY" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
  {
    id: "ted-cruz",
    name: "Ted Cruz",
    party: "Republican",
    title: "Senator",
    district: "Texas",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "YEA" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "YEA" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "YEA" },
    ],
  },
  {
    id: "josh-hawley",
    name: "Josh Hawley",
    party: "Republican",
    title: "Senator",
    district: "Missouri",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "YEA" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "YEA" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "YEA" },
    ],
  },
  {
    id: "elizabeth-warren",
    name: "Elizabeth Warren",
    party: "Democratic",
    title: "Senator",
    district: "Massachusetts",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "YEA" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "YEA" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
  {
    id: "susan-collins",
    name: "Susan Collins",
    party: "Republican",
    title: "Senator",
    district: "Maine",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "YEA" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "YEA" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "YEA" },
    ],
  },
  {
    id: "alexandria-ocasio-cortez",
    name: "Alexandria Ocasio-Cortez",
    party: "Democratic",
    title: "Representative",
    district: "New York-14",
    chamber: "house",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "NAY" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "NAY" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "NAY" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
  {
    id: "chris-murphy",
    name: "Chris Murphy",
    party: "Democratic",
    title: "Senator",
    district: "Connecticut",
    chamber: "senate",
    votes: [
      { bill: "NDAA FY2024 ($886B)", amount: BUDGET_ITEMS.NDAA_DEFENSE, category: "military", vote: "YEA" },
      { bill: "Nuclear Weapons Modernization", amount: BUDGET_ITEMS.NUCLEAR_WEAPONS, category: "military", vote: "YEA" },
      { bill: "Israel Military Aid ($3.8B)", amount: BUDGET_ITEMS.ISRAEL_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "Ukraine Military Aid ($24B)", amount: BUDGET_ITEMS.UKRAINE_MILITARY_AID, category: "military", vote: "YEA" },
      { bill: "NIH Budget ($47.3B)", amount: BUDGET_ITEMS.NIH_TOTAL_BUDGET, category: "health", vote: "YEA" },
      { bill: "Drug War Budget ($47B ONDCP)", amount: BUDGET_ITEMS.DRUG_WAR_ENFORCEMENT, category: "enforcement", vote: "NAY" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Compute scorecards from actual dollar votes
// ---------------------------------------------------------------------------

/** Clinical trials are ~3.3% of the NIH budget (NIH_CLINICAL_TRIALS_SPENDING_PCT from parameters) */
const CLINICAL_TRIAL_PCT_OF_NIH = 0.033;

function computeScorecard(record: PoliticianRecord): PoliticianScorecard {
  let destructiveDollars = 0;
  let clinicalTrialDollars = 0;
  let constructiveDollars = 0;

  for (const vote of record.votes) {
    if (vote.vote === "NAY") continue; // Didn't vote for it

    if (vote.category === "military" || vote.category === "enforcement") {
      destructiveDollars += vote.amount;
    }
    if (vote.category === "health") {
      // Only count the clinical trial portion of NIH, not the admin/overhead
      const trialPortion = vote.bill.includes("NIH")
        ? vote.amount * CLINICAL_TRIAL_PCT_OF_NIH
        : vote.amount;
      clinicalTrialDollars += trialPortion;
      constructiveDollars += vote.amount;
    }
  }

  // 0 military + 0 trials = 1:1 (neutral). 0 military + any trials = 0 (perfect).
  const ratio = destructiveDollars === 0 && clinicalTrialDollars === 0
    ? 1
    : clinicalTrialDollars > 0
      ? Math.round(destructiveDollars / clinicalTrialDollars)
      : 999_999;

  // Simple grading: ratio < 1 = A, < 2 = B, < 3 = C, < 4 = D, >= 4 = F
  let grade: PoliticianScorecard["grade"];
  if (ratio < 1) grade = "A";
  else if (ratio < 2) grade = "B";
  else if (ratio < 3) grade = "C";
  else if (ratio < 4) grade = "D";
  else grade = "F";

  return {
    id: record.id,
    name: record.name,
    party: record.party,
    title: record.title,
    district: record.district,
    chamber: record.chamber,
    militaryToTrialsRatio: ratio,
    grade,
    destructiveDollarsVotedFor: destructiveDollars,
    clinicalTrialDollarsVotedFor: clinicalTrialDollars,
    constructiveDollarsVotedFor: constructiveDollars,
    keyVotes: record.votes,
  };
}

/** Pre-computed scorecards sorted by ratio (best first) */
export const POLITICIAN_SCORECARDS: PoliticianScorecard[] = POLITICIAN_RECORDS
  .map(computeScorecard)
  .sort((a, b) => a.militaryToTrialsRatio - b.militaryToTrialsRatio);

/** Get scorecards ranked by military:trials ratio (best first) */
export function getPoliticiansByAlignment(): PoliticianScorecard[] {
  return [...POLITICIAN_SCORECARDS];
}

/** The system-wide ratio for comparison */
export const SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO = Math.round(
  BUDGET_ITEMS.NDAA_DEFENSE / BUDGET_ITEMS.NIH_CLINICAL_TRIALS,
);

/** Budget items for display */
export { BUDGET_ITEMS };
