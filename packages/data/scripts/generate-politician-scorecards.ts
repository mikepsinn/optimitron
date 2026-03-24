/**
 * Generate politician scorecards from Congress.gov API data.
 *
 * Fetches all current members of Congress, pulls their votes on key
 * military and health bills, computes military:trials ratios, and
 * writes to a generated JSON file.
 *
 * Usage: pnpm --filter @optimitron/data run data:refresh:politicians
 *
 * Requires: CONGRESS_API_KEY in .env (free from api.congress.gov)
 * Without key: rate-limited to 50 requests/hour
 */

import "./load-env.js";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchMembers, fetchRollCallVote } from "../src/fetchers/congress.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, "..", "src", "datasets", "generated");
const OUTPUT_FILE = join(OUTPUT_DIR, "politician-scorecards.json");

// ---------------------------------------------------------------------------
// Key budget bills to check votes on (FY2024)
// ---------------------------------------------------------------------------

interface BudgetBill {
  name: string;
  congress: number;
  chamber: "senate" | "house";
  session: number;
  rollCallNumber: number;
  amount: number;
  category: "military" | "health" | "enforcement";
}

// These are the actual roll call votes on the NDAA and appropriations
const KEY_BILLS: BudgetBill[] = [
  // NDAA FY2024 — final passage votes
  {
    name: "NDAA FY2024 ($886B)",
    congress: 118, session: 1, chamber: "senate", rollCallNumber: 325,
    amount: 886_000_000_000, category: "military",
  },
  {
    name: "NDAA FY2024 ($886B)",
    congress: 118, session: 1, chamber: "house", rollCallNumber: 711,
    amount: 886_000_000_000, category: "military",
  },
  // Israel supplemental
  {
    name: "Israel Security Supplemental ($14.3B)",
    congress: 118, session: 2, chamber: "house", rollCallNumber: 168,
    amount: 14_300_000_000, category: "military",
  },
  // Ukraine + Israel + Taiwan supplemental (April 2024)
  {
    name: "Ukraine/Israel/Taiwan Supplemental ($95B)",
    congress: 118, session: 2, chamber: "senate", rollCallNumber: 132,
    amount: 95_000_000_000, category: "military",
  },
  {
    name: "Ukraine/Israel/Taiwan Supplemental ($95B)",
    congress: 118, session: 2, chamber: "house", rollCallNumber: 165,
    amount: 95_000_000_000, category: "military",
  },
  // Labor-HHS Appropriations (includes NIH funding)
  {
    name: "Labor-HHS Appropriations FY2024 (includes NIH $47.3B)",
    congress: 118, session: 2, chamber: "senate", rollCallNumber: 64,
    amount: 47_300_000_000, category: "health",
  },
];

// Clinical trials are ~3.3% of NIH budget (NIH_CLINICAL_TRIALS_SPENDING_PCT from parameters)
const CLINICAL_TRIAL_PCT_OF_NIH = 0.033;

interface MemberVoteRecord {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  militaryDollarsVotedFor: number;
  clinicalTrialDollarsVotedFor: number;
  ratio: number;
  grade: string;
  votes: Array<{ bill: string; vote: string; amount: number; category: string }>;
}

async function main() {
  console.log("Generating politician scorecards from Congress.gov API...\n");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Fetch all current members
  console.log("Step 1: Fetching current members of Congress...");
  const members = await fetchMembers(118);
  if (!members || members.length === 0) {
    console.error("Failed to fetch members. Check CONGRESS_API_KEY.");
    process.exit(1);
  }
  console.log(`  ${members.length} members found\n`);

  // Step 2: Fetch roll call votes for key bills
  console.log("Step 2: Fetching roll call votes for key budget bills...");
  const rollCalls = new Map<string, Map<string, string>>(); // billKey → Map<bioguideId, vote>

  for (const bill of KEY_BILLS) {
    const key = `${bill.congress}-${bill.chamber}-${bill.rollCallNumber}`;
    console.log(`  Fetching ${bill.name} (${bill.chamber} roll call #${bill.rollCallNumber})...`);

    try {
      const rollCall = await fetchRollCallVote(
        bill.congress,
        bill.chamber,
        bill.session,
        bill.rollCallNumber,
      );

      if (rollCall) {
        const voteMap = new Map<string, string>();
        for (const v of rollCall.memberVotes) {
          if (v.bioguideId && v.position) {
            voteMap.set(v.bioguideId, v.position.toUpperCase());
          }
        }
        rollCalls.set(key, voteMap);
        console.log(`    ${voteMap.size} votes recorded`);
      } else {
        console.log(`    No data returned`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.log(`    Error: ${msg}`);
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Step 3: Compute scorecards
  console.log("\nStep 3: Computing scorecards...");
  const scorecards: MemberVoteRecord[] = [];

  for (const member of members) {
    const bioguideId = member.bioguideId ?? "";
    if (!bioguideId) continue;

    let militaryDollars = 0;
    let clinicalTrialDollars = 0;
    const votes: MemberVoteRecord["votes"] = [];

    for (const bill of KEY_BILLS) {
      // Only check bills from their chamber
      if (bill.chamber === "senate" && member.chamber !== "Senate") continue;
      if (bill.chamber === "house" && member.chamber !== "House of Representatives") continue;

      const key = `${bill.congress}-${bill.chamber}-${bill.rollCallNumber}`;
      const voteMap = rollCalls.get(key);
      if (!voteMap) continue;

      const vote = voteMap.get(bioguideId) ?? "NOT VOTING";
      const votedYea = vote === "YEA" || vote === "AYE" || vote === "YES";

      votes.push({
        bill: bill.name,
        vote,
        amount: bill.amount,
        category: bill.category,
      });

      if (votedYea) {
        if (bill.category === "military" || bill.category === "enforcement") {
          militaryDollars += bill.amount;
        }
        if (bill.category === "health") {
          clinicalTrialDollars += bill.amount * CLINICAL_TRIAL_PCT_OF_NIH;
        }
      }
    }

    // Skip members with no votes found
    if (votes.length === 0) continue;

    const ratio =
      militaryDollars === 0 && clinicalTrialDollars === 0
        ? 1
        : clinicalTrialDollars > 0
          ? Math.round(militaryDollars / clinicalTrialDollars)
          : 999_999;

    let grade: string;
    if (ratio < 1) grade = "A";
    else if (ratio < 2) grade = "B";
    else if (ratio < 3) grade = "C";
    else if (ratio < 4) grade = "D";
    else grade = "F";

    scorecards.push({
      bioguideId,
      name: member.name ?? "Unknown",
      party: member.party ?? "",
      state: member.state ?? "",
      chamber: member.chamber ?? "",
      militaryDollarsVotedFor: militaryDollars,
      clinicalTrialDollarsVotedFor: clinicalTrialDollars,
      ratio,
      grade,
      votes,
    });
  }

  // Sort by ratio (best first)
  scorecards.sort((a, b) => a.ratio - b.ratio);

  console.log(`  ${scorecards.length} scorecards computed\n`);

  // Grade distribution
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const s of scorecards) {
    grades[s.grade as keyof typeof grades]++;
  }
  console.log("Grade distribution:");
  for (const [g, count] of Object.entries(grades)) {
    console.log(`  ${g}: ${count} (${((count / scorecards.length) * 100).toFixed(0)}%)`);
  }

  // ─── Step 4: Presidential scorecards ──────────────────────────────────
  console.log("\nStep 4: Computing presidential scorecards...");

  // Presidents are scored on total military spending vs clinical trial funding
  // signed into law during their term. Data from OMB historical tables + NIH budgets.
  interface PresidentRecord {
    name: string;
    term: string;
    totalMilitarySigned: number;
    totalNIHSigned: number;
    clinicalTrialPortion: number;
    ratio: number;
    grade: string;
    keyActions: string[];
  }

  const NIH_TRIAL_PCT = 0.033; // NIH_CLINICAL_TRIALS_SPENDING_PCT from parameters
  const presidents: PresidentRecord[] = [
    {
      name: "George W. Bush",
      term: "2001-2009",
      totalMilitarySigned: 4_200_000_000_000, // ~$525B avg × 8 years, includes Iraq/Afghanistan supplementals
      totalNIHSigned: 232_000_000_000, // NIH budget doubled then flatlined ~$29B avg × 8
      clinicalTrialPortion: 232_000_000_000 * NIH_TRIAL_PCT,
      ratio: 0, grade: "",
      keyActions: [
        "Started Iraq War based on fabricated WMD evidence — $2.4T total cost",
        "Started Afghanistan War — $2.3T total cost",
        "Signed PATRIOT Act — warrantless surveillance of all Americans",
        "NIH budget doubling completed (2003) then flatlined",
      ],
    },
    {
      name: "Barack Obama",
      term: "2009-2017",
      totalMilitarySigned: 5_100_000_000_000, // ~$640B avg × 8
      totalNIHSigned: 244_000_000_000, // ~$30.5B avg × 8
      clinicalTrialPortion: 244_000_000_000 * NIH_TRIAL_PCT,
      ratio: 0, grade: "",
      keyActions: [
        "Expanded drone warfare to 7 countries",
        "Libya intervention — created failed state with open-air slave markets",
        "Signed ACA — premiums increased 105%",
        "NIH hit by sequestration ($1.7B cut in 2013)",
      ],
    },
    {
      name: "Donald Trump (1st term)",
      term: "2017-2021",
      totalMilitarySigned: 2_900_000_000_000, // ~$725B avg × 4
      totalNIHSigned: 156_000_000_000, // ~$39B avg × 4 (increases)
      clinicalTrialPortion: 156_000_000_000 * NIH_TRIAL_PCT,
      ratio: 0, grade: "",
      keyActions: [
        "Signed largest peacetime NDAA ($738B FY2020)",
        "Trade war tariffs cost $1,277/household/yr",
        "NIH budget increased to $41.7B (2020)",
        "Operation Warp Speed — $18B for COVID vaccines (rare clinical trial investment)",
      ],
    },
    {
      name: "Joe Biden",
      term: "2021-2025",
      totalMilitarySigned: 3_400_000_000_000, // ~$850B avg × 4
      totalNIHSigned: 182_000_000_000, // ~$45.5B avg × 4
      clinicalTrialPortion: 182_000_000_000 * NIH_TRIAL_PCT,
      ratio: 0, grade: "",
      keyActions: [
        "Signed $886B NDAA FY2024 — largest ever",
        "$95B supplemental for Ukraine + Israel military aid",
        "IRA included $80B IRS funding (later partially clawed back)",
        "Afghanistan withdrawal — ended 20-year war",
      ],
    },
  ];

  for (const p of presidents) {
    p.ratio = p.clinicalTrialPortion > 0
      ? Math.round(p.totalMilitarySigned / p.clinicalTrialPortion)
      : 999_999;
    if (p.ratio < 1) p.grade = "A";
    else if (p.ratio < 2) p.grade = "B";
    else if (p.ratio < 3) p.grade = "C";
    else if (p.ratio < 4) p.grade = "D";
    else p.grade = "F";
  }

  console.log("\nPresidential scorecards:");
  console.log("Name                    | Military Signed | Trials Signed | Ratio      | Grade");
  console.log("------------------------|-----------------|---------------|------------|------");
  for (const p of presidents) {
    console.log(
      `${p.name.padEnd(24)}| $${(p.totalMilitarySigned / 1e12).toFixed(1)}T${" ".repeat(12)}| $${(p.clinicalTrialPortion / 1e9).toFixed(1)}B${" ".repeat(10)}| ${p.ratio.toLocaleString()}:1${" ".repeat(5)}| ${p.grade}`,
    );
  }

  // Write output
  const output = {
    generatedAt: new Date().toISOString(),
    congress: 118,
    memberCount: scorecards.length,
    gradeDistribution: grades,
    systemWideRatio: Math.round(886_000_000_000 / 810_000_000),
    scorecards,
    presidents,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${OUTPUT_FILE}`);
  console.log(`${scorecards.length} Congress members + ${presidents.length} presidents scored.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
