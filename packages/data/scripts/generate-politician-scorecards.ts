/**
 * Generate politician scorecards from Congressional vote data.
 *
 * Fetches every member of the 118th and 119th Congresses from the
 * Congress.gov API, then pulls their votes on key military and health bills
 * from the direct XML sources (clerk.house.gov and senate.gov), computes
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
import {
  scoreMemberVotes,
  type BillRollCalls,
} from "../src/datasets/politician-vote-scoring.js";
import { parseHouseXml, parseSenateXml } from "../src/datasets/politician-roll-call-xml.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, "..", "src", "datasets", "generated");
const OUTPUT_FILE = join(OUTPUT_DIR, "politician-scorecards.json");

/**
 * The Congresses whose members are scored. Members who left after the 118th
 * keep their FY2023–FY2025 votes. Members new in the 119th are scored on the
 * 119th Congress's bills.
 */
const MEMBER_CONGRESSES = [118, 119] as const;

// ---------------------------------------------------------------------------
// Key budget bills to check votes on (FY2023–FY2026)
// ---------------------------------------------------------------------------

interface BudgetBill {
  name: string;
  amount: number;
  category: "military" | "clinical_trials" | "enforcement";
  /** URL to the bill on congress.gov or govtrack */
  sourceUrl?: string;
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
  // ═══════════════════════════════════════════════════════════════════
  // FY2023 (117th Congress)
  // ═══════════════════════════════════════════════════════════════════

  // NDAA FY2023 — H.R. 7776, $858B military authorization
  // House roll 516/2022 (H.Res. 1512 concurrence, 350-80)
  // Senate vote 396/117-2 (83-11)
  {
    name: "NDAA FY2023 ($858B)",
    amount: 858_000_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/117th-congress/house-bill/7776",
    houseYear: 2022,
    houseRollCall: 516,
    senateCongress: 117,
    senateSession: 2,
    senateVoteNumber: 396,
  },
  // Omnibus FY2023 — H.R. 2617, military portion (~$858B)
  // House roll 549/2022 (225-201)
  // Senate vote 421/117-2 (68-29)
  {
    name: "Omnibus FY2023 — Military ($858B)",
    amount: 858_000_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/117th-congress/house-bill/2617",
    houseYear: 2022,
    houseRollCall: 549,
    senateCongress: 117,
    senateSession: 2,
    senateVoteNumber: 421,
  },
  // Omnibus FY2023 — H.R. 2617, NIH portion ($47.5B → $1.57B trials at 3.3%)
  // Same roll call as above — a YEA on the omnibus funds both military AND NIH
  {
    name: "Omnibus FY2023 — NIH ($47.5B)",
    amount: 47_500_000_000,
    category: "clinical_trials",
    sourceUrl: "https://www.congress.gov/bill/117th-congress/house-bill/2617",
    houseYear: 2022,
    houseRollCall: 549,
    senateCongress: 117,
    senateSession: 2,
    senateVoteNumber: 421,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FY2024 (118th Congress)
  // ═══════════════════════════════════════════════════════════════════

  // NDAA FY2024 — H.R. 2670, $886B military authorization
  // House roll 723/2023 (310-118)
  // Senate vote 343/118-1 (87-13)
  {
    name: "NDAA FY2024 ($886B)",
    amount: 886_000_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/2670",
    houseYear: 2023,
    houseRollCall: 723,
    senateCongress: 118,
    senateSession: 1,
    senateVoteNumber: 343,
  },
  // Supplementals — House voted on these separately (April 20, 2024)
  {
    name: "Ukraine Security Supplemental ($60.8B)",
    amount: 60_800_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/8035",
    houseYear: 2024,
    houseRollCall: 151, // H.R. 8035, 311-112
  },
  {
    name: "Israel Security Supplemental ($14.3B)",
    amount: 14_300_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/8034",
    houseYear: 2024,
    houseRollCall: 152, // H.R. 8034, 366-58
  },
  {
    name: "Indo-Pacific Security Supplemental ($8.1B)",
    amount: 8_100_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/8036",
    houseYear: 2024,
    houseRollCall: 146, // H.R. 8036, 385-34
  },
  // Senate voted on the combined supplemental package (April 23, 2024)
  {
    name: "Ukraine/Israel/Taiwan Supplemental ($95B)",
    amount: 95_000_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/815",
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 154, // H.R. 815 concurrence, 79-18
  },
  // Omnibus FY2024 — H.R. 2882, military portion (~$886B)
  // House roll 102/2024 (286-134)
  // Senate vote 114/118-2 (74-24)
  {
    name: "Omnibus FY2024 — Military ($886B)",
    amount: 886_000_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/2882",
    houseYear: 2024,
    houseRollCall: 102,
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 114,
  },
  // Omnibus FY2024 — H.R. 2882, NIH portion ($47.3B → $1.56B trials at 3.3%)
  {
    name: "Omnibus FY2024 — NIH ($47.3B)",
    amount: 47_300_000_000,
    category: "clinical_trials",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/2882",
    houseYear: 2024,
    houseRollCall: 102,
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 114,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FY2025 (118th Congress)
  // ═══════════════════════════════════════════════════════════════════

  // NDAA FY2025 — H.R. 5009, $895B military authorization
  // House roll 500/2024 (281-140)
  // Senate vote 325/118-2 (85-14)
  {
    name: "NDAA FY2025 ($895B)",
    amount: 895_200_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/118th-congress/house-bill/5009",
    houseYear: 2024,
    houseRollCall: 500,
    senateCongress: 118,
    senateSession: 2,
    senateVoteNumber: 325,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FY2025 (119th Congress)
  // ═══════════════════════════════════════════════════════════════════

  // Full-Year CR FY2025 — H.R. 1968 (P.L. 119-4), military portion ($892.5B base defense, CBO via CRS R48517)
  // House roll 70/2025 (passage, 217-213)
  // Senate vote 133/119-1 (54-46)
  {
    name: "Full-Year CR FY2025 — Military ($892.5B)",
    amount: 892_500_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/1968",
    houseYear: 2025,
    houseRollCall: 70,
    senateCongress: 119,
    senateSession: 1,
    senateVoteNumber: 133,
  },
  // Full-Year CR FY2025 — H.R. 1968, NIH portion ($47.035B program level, CRS R43341 → $1.55B trials at 3.3%)
  // Same roll calls as above
  {
    name: "Full-Year CR FY2025 — NIH ($47.0B)",
    amount: 47_000_000_000,
    category: "clinical_trials",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/1968",
    houseYear: 2025,
    houseRollCall: 70,
    senateCongress: 119,
    senateSession: 1,
    senateVoteNumber: 133,
  },
  // Reconciliation 2025 — H.R. 1 One Big Beautiful Bill Act (P.L. 119-21), Title II defense ($156.2B, CRS IN12580)
  // House roll 190/2025 (Senate amendment concurrence, 218-214)
  // Senate vote 372/119-1 (50-50, Vice President voted Yea)
  {
    name: "Reconciliation 2025 (H.R. 1) — Military ($156.2B)",
    amount: 156_200_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/1",
    houseYear: 2025,
    houseRollCall: 190,
    senateCongress: 119,
    senateSession: 1,
    senateVoteNumber: 372,
  },

  // ═══════════════════════════════════════════════════════════════════
  // FY2026 (119th Congress)
  // ═══════════════════════════════════════════════════════════════════

  // NDAA FY2026 — S. 1071 (P.L. 119-60), $900.6B military authorization
  // House roll 320/2025 (passage with House amendment, 312-112)
  // Senate vote 648/119-1 (House amendment concurrence, 77-20)
  {
    name: "NDAA FY2026 ($900.6B)",
    amount: 900_600_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/senate-bill/1071",
    houseYear: 2025,
    houseRollCall: 320,
    senateCongress: 119,
    senateSession: 1,
    senateVoteNumber: 648,
  },
  // CR + MilCon-VA FY2026 — H.R. 5371 (P.L. 119-37), Division D military construction ($19.737B, CRS IN12622)
  // Only the full-year MilCon money: H.R. 7148 below replaced this law's continuing-resolution DoD and NIH money.
  // House roll 285/2025 (Senate amendment concurrence, 222-209)
  // Senate vote 618/119-1 (60-40)
  {
    name: "MilCon FY2026 (H.R. 5371) — Military ($19.7B)",
    amount: 19_700_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/5371",
    houseYear: 2025,
    houseRollCall: 285,
    senateCongress: 119,
    senateSession: 1,
    senateVoteNumber: 618,
  },
  // Omnibus FY2026 — H.R. 7148 (P.L. 119-75), Division A Defense ($838.7B)
  // House roll 53/2026 (Senate amendments concurrence, 217-214)
  // Senate vote 20/119-2 (71-29)
  {
    name: "Omnibus FY2026 — Military ($838.7B)",
    amount: 838_700_000_000,
    category: "military",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/7148",
    houseYear: 2026,
    houseRollCall: 53,
    senateCongress: 119,
    senateSession: 2,
    senateVoteNumber: 20,
  },
  // Omnibus FY2026 — H.R. 7148, Division B NIH ($47.493B program level, CRS R43341 → $1.57B trials at 3.3%)
  // Same roll calls as above
  {
    name: "Omnibus FY2026 — NIH ($47.5B)",
    amount: 47_500_000_000,
    category: "clinical_trials",
    sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/7148",
    houseYear: 2026,
    houseRollCall: 53,
    senateCongress: 119,
    senateSession: 2,
    senateVoteNumber: 20,
  },
];

// Clinical trials are ~3.3% of NIH budget (NIH_CLINICAL_TRIALS_SPENDING_PCT from parameters)
const CLINICAL_TRIAL_PCT_OF_NIH = 0.033;

// ---------------------------------------------------------------------------
// XML fetching
// ---------------------------------------------------------------------------

/** The rollCalls key of a bill's House vote, or null when the bill has none. */
function houseRollCallKey(bill: BudgetBill): string | null {
  return bill.houseYear != null && bill.houseRollCall != null
    ? `house:${bill.houseYear}:${bill.houseRollCall}`
    : null;
}

/** The rollCalls key of a bill's Senate vote, or null when the bill has none. */
function senateRollCallKey(bill: BudgetBill): string | null {
  return bill.senateCongress != null && bill.senateSession != null && bill.senateVoteNumber != null
    ? `senate:${bill.senateCongress}:${bill.senateSession}:${bill.senateVoteNumber}`
    : null;
}

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
  votes: Array<{ bill: string; vote: string; amount: number; category: string; sourceUrl?: string }>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Generating politician scorecards from XML vote sources...\n");

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ─── Step 1: Fetch the members of each scored Congress ─────────────
  console.log(`Step 1: Fetching members of Congresses ${MEMBER_CONGRESSES.join(" and ")}...`);
  const membersById = new Map<string, CongressMember>();
  for (const congress of MEMBER_CONGRESSES) {
    const congressMembers = await fetchMembers(congress);
    // A Congress has 535 voting seats, so a shorter list means a page failed to load.
    if (congressMembers.length < 535) {
      console.error(
        `Fetched only ${congressMembers.length} members of Congress ${congress}. Check CONGRESS_API_KEY.`,
      );
      process.exit(1);
    }
    console.log(`  Congress ${congress}: ${congressMembers.length} members`);
    // The later Congress's record replaces the earlier one, so party, state and chamber are current.
    for (const member of congressMembers) {
      if (member.bioguideId) membersById.set(member.bioguideId, member);
    }
  }
  const members = [...membersById.values()];
  console.log(`  ${members.length} members after removing duplicates\n`);

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

  // A member missing from both roll calls of a bill is scored as not in office
  // for it. So a roll call that failed to load would silently drop that bill,
  // or a member, from the scorecards. Stop before any file is written.
  const missingRollCalls = [
    ...new Set(KEY_BILLS.flatMap((bill) => [houseRollCallKey(bill), senateRollCallKey(bill)])),
  ].filter((key): key is string => key !== null && !rollCalls.get(key)?.size);
  if (missingRollCalls.length > 0) {
    console.error(
      `\nNo votes loaded for ${missingRollCalls.join(", ")}. The scorecards were not written.`,
    );
    process.exit(1);
  }

  // ─── Step 3: Compute scorecards ────────────────────────────────────
  console.log("\nStep 3: Computing scorecards...");
  const scorecards: MemberVoteRecord[] = [];

  const billRollCalls: BillRollCalls[] = KEY_BILLS.map((bill) => {
    const houseKey = houseRollCallKey(bill);
    const senateKey = senateRollCallKey(bill);
    return {
      bill,
      house: houseKey ? rollCalls.get(houseKey) : undefined,
      senate: senateKey ? rollCalls.get(senateKey) : undefined,
    };
  });

  for (const member of members) {
    const bioguideId = member.bioguideId ?? "";
    if (!bioguideId) continue;

    const {
      militaryDollarsVotedFor: militaryDollars,
      clinicalTrialDollarsVotedFor: clinicalTrialDollars,
      votes,
    } = scoreMemberVotes(bioguideId, billRollCalls, CLINICAL_TRIAL_PCT_OF_NIH);

    // Skip members with no votes found
    if (votes.length === 0) continue;

    const ratio =
      militaryDollars === 0 && clinicalTrialDollars === 0
        ? 1
        : clinicalTrialDollars > 0
          ? Math.round(militaryDollars / clinicalTrialDollars)
          : 999_999;

    scorecards.push({
      bioguideId,
      name: member.name ?? "Unknown",
      party: member.party ?? "",
      state: member.state ?? "",
      chamber: member.chamber ?? "",
      militaryDollarsVotedFor: militaryDollars,
      clinicalTrialDollarsVotedFor: clinicalTrialDollars,
      ratio,
      votes,
    });
  }

  // Sort by ratio (best first). Ties sort by bioguide ID, so the order does not
  // depend on the order in which the API returns members.
  scorecards.sort((a, b) => a.ratio - b.ratio || a.bioguideId.localeCompare(b.bioguideId));

  console.log(`  ${scorecards.length} scorecards computed\n`);

  // ─── Step 4: Presidential scorecards ───────────────────────────────
  console.log("\nStep 4: Computing presidential scorecards...");

  interface PresidentRecord {
    name: string;
    term: string;
    totalMilitarySigned: number;
    totalNIHSigned: number;
    clinicalTrialPortion: number;
    ratio: number;
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
      ratio: 0,
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
      ratio: 0,
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
      ratio: 0,
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
      ratio: 0,
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
  }

  console.log("\nPresidential scorecards:");
  console.log("Name                    | Military Signed | Trials Signed | Ratio");
  console.log("------------------------|-----------------|---------------|----------");
  for (const p of presidents) {
    console.log(
      `${p.name.padEnd(24)}| $${(p.totalMilitarySigned / 1e12).toFixed(1)}T${" ".repeat(12)}| $${(p.clinicalTrialPortion / 1e9).toFixed(1)}B${" ".repeat(10)}| ${p.ratio.toLocaleString()}:1`,
    );
  }

  // ─── Write output ──────────────────────────────────────────────────
  const output = {
    generatedAt: new Date().toISOString(),
    congress: Math.max(...MEMBER_CONGRESSES),
    congresses: [...MEMBER_CONGRESSES],
    memberCount: scorecards.length,
    // The latest enacted NDAA (FY2026, S. 1071: $900.6B) over NIH clinical-trial
    // spending (~$810M a year, JAMA Health Forum).
    systemWideRatio: Math.round(900_600_000_000 / 810_000_000),
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
