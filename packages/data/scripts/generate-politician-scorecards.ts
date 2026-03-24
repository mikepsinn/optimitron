/**
 * Generate politician scorecards from Congressional vote data.
 *
 * Fetches all current members of Congress from the Congress.gov API,
 * then pulls their votes on key military and health bills from the
 * direct XML sources (clerk.house.gov and senate.gov), computes
 * military:trials ratios, and writes to a generated JSON file.
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
import { fetchMembers } from "../src/fetchers/congress.js";
import type { CongressMember } from "../src/fetchers/congress.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, "..", "src", "datasets", "generated");
const OUTPUT_FILE = join(OUTPUT_DIR, "politician-scorecards.json");

// ---------------------------------------------------------------------------
// Key budget bills to check votes on (FY2024)
// ---------------------------------------------------------------------------

interface BudgetBill {
  name: string;
  amount: number;
  category: "military" | "health" | "enforcement";
  /** House vote: calendar year */
  houseYear?: number;
  /** House vote: roll call number */
  houseRollCall?: number;
  /** Senate vote: congress number (e.g. 118) */
  senateCongress?: number;
  /** Senate vote: session (1 or 2) */
  senateSession?: number;
  /** Senate vote: vote number */
  senateVoteNumber?: number;
}

const KEY_BILLS: BudgetBill[] = [
  // NDAA FY2024 — final passage votes
  {
    name: "NDAA FY2024 ($886B)",
    amount: 886_000_000_000,
    category: "military",
    houseYear: 2023,
    houseRollCall: 723,
    senateCongress: 118,
    senateSession: 1,
    senateVoteNumber: 343,
  },
  // Israel Security Supplemental (House only)
  {
    name: "Israel Security Supplemental ($14.3B)",
    amount: 14_300_000_000,
    category: "military",
    houseYear: 2024,
    houseRollCall: 168,
  },
  // Ukraine + Israel + Taiwan Supplemental (April 2024)
  {
    name: "Ukraine/Israel/Taiwan Supplemental ($95B)",
    amount: 95_000_000_000,
    category: "military",
    houseYear: 2024,
    houseRollCall: 165,
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 132,
  },
  // Labor-HHS Appropriations (includes NIH funding) — Senate only
  {
    name: "Labor-HHS Appropriations FY2024 (includes NIH $47.3B)",
    amount: 47_300_000_000,
    category: "health",
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 64,
  },
];

// Clinical trials are ~3.3% of NIH budget (NIH_CLINICAL_TRIALS_SPENDING_PCT from parameters)
const CLINICAL_TRIAL_PCT_OF_NIH = 0.033;

// ---------------------------------------------------------------------------
// XML fetching and parsing
// ---------------------------------------------------------------------------

/**
 * Fetch text from a URL with error handling. Returns null on failure.
 */
async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  HTTP ${response.status}: ${response.statusText} — ${url}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`  Fetch error: ${error}`);
    return null;
  }
}

/**
 * Build the URL for a House roll call vote XML.
 *
 * Source: https://clerk.house.gov/evs/{year}/roll{number}.xml
 */
function houseXmlUrl(year: number, rollCall: number): string {
  const paddedRoll = String(rollCall).padStart(3, "0");
  return `https://clerk.house.gov/evs/${year}/roll${paddedRoll}.xml`;
}

/**
 * Build the URL for a Senate roll call vote XML.
 *
 * Source: https://www.senate.gov/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{number}.xml
 * Number must be zero-padded to 5 digits.
 */
function senateXmlUrl(congress: number, session: number, voteNumber: number): string {
  const paddedVote = String(voteNumber).padStart(5, "0");
  return `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}${session}/vote_${congress}_${session}_${paddedVote}.xml`;
}

/**
 * Parse House clerk XML and return a map of bioguideId → vote position.
 *
 * XML structure:
 * ```xml
 * <recorded-vote>
 *   <legislator name-id="B001302" party="R" state="AZ">Biggs</legislator>
 *   <vote>Yea</vote>
 * </recorded-vote>
 * ```
 */
function parseHouseXml(xml: string): Map<string, string> {
  const voteMap = new Map<string, string>();
  const pattern =
    /<recorded-vote>\s*<legislator\b[^>]*name-id="([^"]+)"[\s\S]*?<\/legislator>\s*<vote>([\s\S]*?)<\/vote>\s*<\/recorded-vote>/gi;

  let match = pattern.exec(xml);
  while (match) {
    const bioguideId = match[1]?.trim();
    const vote = decodeXmlEntities(match[2]?.trim() ?? "");
    if (bioguideId && vote) {
      voteMap.set(bioguideId, vote.toUpperCase());
    }
    match = pattern.exec(xml);
  }

  return voteMap;
}

/**
 * Parse Senate XML and return a map of bioguideId → vote position.
 *
 * Senate XML uses lis_member_id, not bioguide. We match by last_name + state
 * against the known member list from the Congress.gov API.
 *
 * XML structure:
 * ```xml
 * <member>
 *   <member_full>Baldwin (D-WI)</member_full>
 *   <last_name>Baldwin</last_name>
 *   <first_name>Tammy</first_name>
 *   <party>D</party>
 *   <state>WI</state>
 *   <vote_cast>Yea</vote_cast>
 *   <lis_member_id>S354</lis_member_id>
 * </member>
 * ```
 */
function parseSenateXml(xml: string, senators: CongressMember[]): Map<string, string> {
  // Build lookup: normalized(lastName):STATE → bioguideId
  const bioguideByNameState = new Map<string, string>();
  for (const senator of senators) {
    if (!senator.bioguideId || !senator.state) continue;
    const nameParts = extractNameParts(senator.name);
    const stateCode = normalizeState(senator.state);
    // Key by last name + state
    bioguideByNameState.set(
      `${normalizeName(nameParts.lastName)}:${stateCode}`,
      senator.bioguideId,
    );
    // Also key by full name + state for disambiguation
    bioguideByNameState.set(
      `${normalizeName(`${nameParts.firstName} ${nameParts.lastName}`)}:${stateCode}`,
      senator.bioguideId,
    );
  }

  const voteMap = new Map<string, string>();
  const memberPattern =
    /<member>\s*<member_full>([\s\S]*?)<\/member_full>[\s\S]*?<last_name>([\s\S]*?)<\/last_name>[\s\S]*?<first_name>([\s\S]*?)<\/first_name>[\s\S]*?<party>([\s\S]*?)<\/party>[\s\S]*?<state>([\s\S]*?)<\/state>[\s\S]*?<vote_cast>([\s\S]*?)<\/vote_cast>[\s\S]*?<\/member>/gi;

  let match = memberPattern.exec(xml);
  while (match) {
    const fullName = decodeXmlEntities(match[1]?.trim() ?? "");
    const lastName = decodeXmlEntities(match[2]?.trim() ?? "");
    const firstName = decodeXmlEntities(match[3]?.trim() ?? "");
    const state = decodeXmlEntities(match[5]?.trim() ?? "");
    const voteCast = decodeXmlEntities(match[6]?.trim() ?? "");

    const bioguideId =
      bioguideByNameState.get(`${normalizeName(lastName)}:${state}`) ??
      bioguideByNameState.get(`${normalizeName(`${firstName} ${lastName}`)}:${state}`) ??
      bioguideByNameState.get(`${normalizeName(fullName)}:${state}`);

    if (bioguideId && voteCast) {
      voteMap.set(bioguideId, voteCast.toUpperCase());
    }
    match = memberPattern.exec(xml);
  }

  return voteMap;
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

/** Strip accents and non-alpha characters, lowercase. */
function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

function normalizeState(state: string): string {
  const trimmed = state.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return US_STATE_ABBREVIATIONS[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

function extractNameParts(name: string): { firstName: string; lastName: string } {
  if (name.includes(",")) {
    const [lastName = "", firstName = ""] = name.split(",", 2);
    return {
      firstName: firstName.trim().split(/\s+/)[0] ?? "",
      lastName: lastName.trim(),
    };
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Generating politician scorecards from XML vote sources...\n");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ─── Step 1: Fetch all current members ─────────────────────────────
  console.log("Step 1: Fetching current members of Congress...");
  const members = await fetchMembers(118);
  if (!members || members.length === 0) {
    console.error("Failed to fetch members. Check CONGRESS_API_KEY.");
    process.exit(1);
  }
  console.log(`  ${members.length} members found\n`);

  // Build a quick lookup for senators (needed for Senate XML matching)
  const senators = members.filter((m) => m.chamber === "Senate");
  console.log(`  ${senators.length} senators, ${members.length - senators.length} representatives\n`);

  // ─── Step 2: Fetch roll call votes from XML sources ────────────────
  console.log("Step 2: Fetching roll call votes from XML sources...");

  // Each bill can have a House vote, a Senate vote, or both.
  // We store: "house:{year}:{rollCall}" or "senate:{congress}:{session}:{voteNumber}" → Map<bioguideId, vote>
  const rollCalls = new Map<string, Map<string, string>>();

  for (const bill of KEY_BILLS) {
    // Fetch House vote XML
    if (bill.houseYear != null && bill.houseRollCall != null) {
      const houseKey = `house:${bill.houseYear}:${bill.houseRollCall}`;
      if (!rollCalls.has(houseKey)) {
        const url = houseXmlUrl(bill.houseYear, bill.houseRollCall);
        console.log(`  Fetching House roll call ${bill.houseRollCall} (${bill.houseYear})...`);
        const xml = await fetchText(url);
        if (xml) {
          const voteMap = parseHouseXml(xml);
          rollCalls.set(houseKey, voteMap);
          console.log(`    ${voteMap.size} votes recorded`);
        } else {
          console.log(`    No data returned`);
        }
        await delay(500);
      }
    }

    // Fetch Senate vote XML
    if (bill.senateCongress != null && bill.senateSession != null && bill.senateVoteNumber != null) {
      const senateKey = `senate:${bill.senateCongress}:${bill.senateSession}:${bill.senateVoteNumber}`;
      if (!rollCalls.has(senateKey)) {
        const url = senateXmlUrl(bill.senateCongress, bill.senateSession, bill.senateVoteNumber);
        console.log(`  Fetching Senate vote ${bill.senateVoteNumber} (${bill.senateCongress}-${bill.senateSession})...`);
        const xml = await fetchText(url);
        if (xml) {
          const voteMap = parseSenateXml(xml, senators);
          rollCalls.set(senateKey, voteMap);
          console.log(`    ${voteMap.size} votes recorded`);
        } else {
          console.log(`    No data returned`);
        }
        await delay(500);
      }
    }
  }

  // ─── Step 3: Compute scorecards ────────────────────────────────────
  console.log("\nStep 3: Computing scorecards...");
  const scorecards: MemberVoteRecord[] = [];

  for (const member of members) {
    const bioguideId = member.bioguideId ?? "";
    if (!bioguideId) continue;

    const isSenator = member.chamber === "Senate";
    let militaryDollars = 0;
    let clinicalTrialDollars = 0;
    const votes: MemberVoteRecord["votes"] = [];

    for (const bill of KEY_BILLS) {
      // Determine which vote (House or Senate) applies to this member
      let voteMap: Map<string, string> | undefined;

      if (isSenator && bill.senateCongress != null && bill.senateSession != null && bill.senateVoteNumber != null) {
        const senateKey = `senate:${bill.senateCongress}:${bill.senateSession}:${bill.senateVoteNumber}`;
        voteMap = rollCalls.get(senateKey);
      } else if (!isSenator && bill.houseYear != null && bill.houseRollCall != null) {
        const houseKey = `house:${bill.houseYear}:${bill.houseRollCall}`;
        voteMap = rollCalls.get(houseKey);
      }

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

    // Grades computed but hidden on front end until vote coverage is complete
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

  // ─── Step 4: Presidential scorecards ───────────────────────────────
  console.log("\nStep 4: Computing presidential scorecards...");

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

  const NIH_TRIAL_PCT = 0.033;
  const presidents: PresidentRecord[] = [
    {
      name: "George W. Bush",
      term: "2001-2009",
      totalMilitarySigned: 4_200_000_000_000,
      totalNIHSigned: 232_000_000_000,
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
      totalMilitarySigned: 5_100_000_000_000,
      totalNIHSigned: 244_000_000_000,
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
      totalMilitarySigned: 2_900_000_000_000,
      totalNIHSigned: 156_000_000_000,
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
      totalMilitarySigned: 3_400_000_000_000,
      totalNIHSigned: 182_000_000_000,
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
    // Grades computed but hidden on front end until vote coverage is complete
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

  // ─── Write output ──────────────────────────────────────────────────
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
