/**
 * Government leader records — one entry per sovereign head of government,
 * bundling country identity, canonical office/contact metadata, and budget
 * figures (military + total general-government expenditure).
 *
 * Consumed by:
 *   - Web app (treaty signer sync, seed.ts, share-text templates, leader
 *     directory pages)
 *   - Any future "government accountability" feature that needs a uniform
 *     list of heads of government with budgets.
 *
 * The leader roster is derived from the country panel + the canonical
 * government registry + world-leaders personal data. Rows are returned
 * sorted by military budget descending, with a stable `sortOrder` index.
 *
 * Data gaps are a hard error: `listGovernmentLeaders()` throws if it can
 * resolve a leader but cannot produce a total-government-budget figure
 * from the panel, the hand-curated overrides, or the fallback formula.
 * This forces the data package to stay honest — missing coverage is
 * surfaced instead of silently dropping the "tax received" template token.
 */

import type { CountryPanelRow } from "./country-panel";
import { getCountryPanelLatestResolved } from "./country-panel";
import {
  getCanonicalGovernmentDisplayName,
  getGovernmentCodeForCountryIso3,
  getGovernmentProfile,
  isSovereignGovernment,
} from "./governments";

/** Public DTO — one per head of government. No campaign-specific fields. */
export interface GovernmentLeaderRecord {
  contactEmail: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  /** ISO 3166-1 alpha-2 */
  countryCode: string;
  /** ISO 3166-1 alpha-3 */
  countryIso3: string;
  /** Human-readable, canonical country name */
  countryName: string;
  decisionMakerLabel: string;
  governmentName: string;
  governmentWebsite: string | null;
  leaderImageUrl: string | null;
  leaderName: string | null;
  leaderSourceRef: string | null;
  /** Annual military expenditure in absolute USD */
  militaryBudgetUsd: number;
  /**
   * Annual total general-government expenditure (IMF Fiscal Monitor, all
   * levels). Includes transfers, subsidies, debt service. Guaranteed non-null
   * in the output of `listGovernmentLeaders()` — the call throws if any
   * leader is missing this number.
   */
  governmentBudgetUsd: number;
  officialSourceUrl: string | null;
  roleTitle: string;
  sortOrder: number;
}

/**
 * Hand-curated total general-government expenditure (USD/year, most recent
 * available) for leaders whose country-panel row doesn't ship enough fields
 * to compute one automatically. Every entry MUST cite its source.
 *
 * Add entries here instead of silently defaulting — the estimator will
 * throw until every sovereign leader has a number.
 */
const GOVERNMENT_TOTAL_BUDGET_OVERRIDES_USD: Record<
  string,
  { value: number; source: string }
> = {
  LIE: {
    // Liechtenstein central budget 2023: CHF 1.09B ≈ $1.22B. Principality has
    // no general-government panel row; IMF doesn't publish it. Source:
    // State of Liechtenstein annual financial statement 2023.
    value: 1_220_000_000,
    source: "Liechtenstein Staatsrechnung 2023 (llv.li)",
  },
  PSE: {
    // Palestinian Authority budget 2023 ~$6.2B (World Bank PER).
    value: 6_200_000_000,
    source: "World Bank Palestinian Expenditure Review 2023",
  },
  SOM: {
    // Federal Government of Somalia 2024 budget ~$1.0B.
    value: 1_000_000_000,
    source: "IMF Somalia Article IV 2024",
  },
  TWN: {
    // Taiwan central + local government 2024 total expenditure ~$305B PPP
    // (nominal ~$100B central; grossed up for all-levels PPP by applying
    // 17.1% pctGdp to Taiwan's ~$1.79T PPP GDP).
    value: 305_000_000_000,
    source: "DGBAS Taiwan 2024 National Statistics + IMF WEO 2024",
  },
  XKX: {
    // Republic of Kosovo consolidated budget 2024 ~$3.5B.
    value: 3_500_000_000,
    source: "Republic of Kosovo Ministry of Finance 2024 budget law",
  },
};

/** Vatican — real sovereign signer that doesn't appear in the country panel. */
const EXTRA_SOVEREIGN_LEADER_ROWS: CountryPanelRow[] = [
  {
    afterTaxMedianIncomeIsAfterTax: false,
    afterTaxMedianIncomePerCapitaPpp: null,
    afterTaxMedianIncomeSource: null,
    educationSpendingPctGdp: null,
    educationSpendingPerCapitaPpp: null,
    gdpPerCapitaPpp: null,
    giniIndex: null,
    haleYears: null,
    healthSpendingPctGdp: null,
    healthSpendingPerCapitaPpp: null,
    infantMortalityPer1000: null,
    jurisdictionIso3: "VAT",
    jurisdictionName: "Holy See (Vatican City)",
    lifeExpectancyYears: null,
    medianIncomePerCapitaPpp: null,
    militarySpendingPctGdp: null,
    militarySpendingPerCapitaPpp: null,
    population: 882,
    povertyRate: null,
    rdSpendingPctGdp: null,
    rdSpendingPerCapitaPpp: null,
    totalGovSpendingPctGdp: null,
    totalGovSpendingPerCapitaPpp: null,
    year: 2024,
  },
];

const EXTRA_VAT_BUDGET_USD = 450_000_000; // Holy See 2023 consolidated budget, ~€415M. Source: APSA annual report 2023.

/**
 * Best-effort annual military budget for a country, in absolute USD.
 *
 * 1. `militarySpendingPerCapitaPpp × population`
 * 2. `(militarySpendingPctGdp / 100) × gdpPerCapitaPpp × population`
 * 3. `0.5% of GDP × population` — a conservative floor for sovereigns with
 *    no published military data. Returns 1 when nothing at all is known.
 */
export function estimateCountryMilitaryBudgetUsd(row: CountryPanelRow): number {
  const perCapita = row.militarySpendingPerCapitaPpp;
  const population = row.population;
  if (perCapita != null && population != null && perCapita > 0 && population > 0) {
    return Math.max(perCapita * population, 1);
  }

  const gdpPerCapita = row.gdpPerCapitaPpp;
  const militaryPct = row.militarySpendingPctGdp;
  if (
    gdpPerCapita != null &&
    population != null &&
    militaryPct != null &&
    gdpPerCapita > 0 &&
    population > 0 &&
    militaryPct > 0
  ) {
    return Math.max((militaryPct / 100) * gdpPerCapita * population, 1);
  }

  if (gdpPerCapita != null && population != null && gdpPerCapita > 0 && population > 0) {
    return Math.max(gdpPerCapita * population * 0.005, 1);
  }

  return 1;
}

/**
 * Annual total general-government expenditure (all levels) in absolute USD.
 *
 * Resolution order:
 * 1. `totalGovSpendingPerCapitaPpp × population` — the IMF-derived number
 *    directly, when both fields are on the coalesced panel row.
 * 2. `(totalGovSpendingPctGdp / 100) × gdpPerCapitaPpp × population` — same
 *    economics, different source columns.
 * 3. `GOVERNMENT_TOTAL_BUDGET_OVERRIDES_USD[iso3]` — hand-curated value for
 *    sovereigns missing from IMF Fiscal Monitor.
 *
 * Returns `null` only if none of the three paths produce a number. The
 * roster builder throws on null.
 */
export function estimateCountryGovernmentBudgetUsd(row: CountryPanelRow): number | null {
  const population = row.population;
  const gdpPerCapita = row.gdpPerCapitaPpp;

  if (population != null && population > 0) {
    const perCapita = row.totalGovSpendingPerCapitaPpp;
    if (perCapita != null && perCapita > 0) {
      return perCapita * population;
    }

    const pctGdp = row.totalGovSpendingPctGdp;
    if (gdpPerCapita != null && gdpPerCapita > 0 && pctGdp != null && pctGdp > 0) {
      return (pctGdp / 100) * gdpPerCapita * population;
    }
  }

  const override = GOVERNMENT_TOTAL_BUDGET_OVERRIDES_USD[row.jurisdictionIso3.toUpperCase()];
  if (override) return override.value;

  return null;
}

function buildLeaderRecord(row: CountryPanelRow): GovernmentLeaderRecord | null {
  const countryIso3 = row.jurisdictionIso3.toUpperCase();
  const governmentProfile = getGovernmentProfile(countryIso3);
  const countryName =
    getCanonicalGovernmentDisplayName({
      countryName: row.jurisdictionName,
      iso3: countryIso3,
    }) ?? row.jurisdictionName.trim();
  const decisionMakerLabel =
    governmentProfile?.leader?.leaderName ??
    governmentProfile?.office.headOfGovernmentLabel ??
    `Head of government of ${countryName}`;
  const governmentName =
    governmentProfile?.governmentName ?? `Government of ${countryName}`;
  const roleTitle =
    governmentProfile?.office.headOfGovernmentTitle ??
    governmentProfile?.leader?.roleTitle ??
    "Head of Government";
  const militaryBudgetUsd =
    governmentProfile?.metrics?.militarySpendingAnnual.value ??
    estimateCountryMilitaryBudgetUsd(row);

  let governmentBudgetUsd = estimateCountryGovernmentBudgetUsd(row);
  if (governmentBudgetUsd == null && countryIso3 === "VAT") {
    governmentBudgetUsd = EXTRA_VAT_BUDGET_USD;
  }
  if (governmentBudgetUsd == null) {
    throw new Error(
      `estimateCountryGovernmentBudgetUsd: no coverage for ${countryIso3} (${countryName}). ` +
        `Add an entry to GOVERNMENT_TOTAL_BUDGET_OVERRIDES_USD in ` +
        `packages/data/src/datasets/government-leaders.ts with a cited source, ` +
        `or backfill totalGovSpendingPerCapitaPpp in country-panel for this country.`,
    );
  }

  return {
    contactEmail: governmentProfile?.office.contactEmail ?? null,
    contactLabel: governmentProfile?.office.contactLabel ?? null,
    contactUrl: governmentProfile?.office.contactUrl ?? null,
    countryCode:
      governmentProfile?.code ?? getGovernmentCodeForCountryIso3(countryIso3) ?? countryIso3,
    countryIso3,
    countryName,
    decisionMakerLabel,
    governmentBudgetUsd,
    governmentName,
    governmentWebsite: governmentProfile?.governmentWebsite ?? null,
    leaderImageUrl: governmentProfile?.leader?.leaderImageUrl ?? null,
    leaderName: governmentProfile?.leader?.leaderName ?? null,
    leaderSourceRef: governmentProfile?.leader?.wikidataId
      ? `wikidata:${governmentProfile.leader.wikidataId}`
      : null,
    militaryBudgetUsd,
    officialSourceUrl: governmentProfile?.office.officialSourceUrl ?? null,
    roleTitle,
    sortOrder: 0,
  };
}

/**
 * List every sovereign head of government with budgets resolved, sorted
 * descending by military budget with a stable `sortOrder` index.
 *
 * Throws when a country is missing a total-government-budget figure — add
 * an override entry instead of catching the error.
 */
export function listGovernmentLeaders(): GovernmentLeaderRecord[] {
  const panelRows = [
    ...getCountryPanelLatestResolved(),
    ...EXTRA_SOVEREIGN_LEADER_ROWS,
  ].filter((row) =>
    isSovereignGovernment({
      countryName: row.jurisdictionName,
      iso3: row.jurisdictionIso3,
    }),
  );

  const records = panelRows
    .map(buildLeaderRecord)
    .filter((record): record is GovernmentLeaderRecord => record !== null);

  records.sort((left, right) => right.militaryBudgetUsd - left.militaryBudgetUsd);
  for (let index = 0; index < records.length; index += 1) {
    records[index]!.sortOrder = index;
  }

  return records;
}

// ---------------------------------------------------------------------------
// Memoized per-country lookup
// ---------------------------------------------------------------------------

let leadersByCountry: Map<string, GovernmentLeaderRecord> | null = null;

/**
 * Lookup a single leader by ISO 3166-1 alpha-2 country code. The full roster
 * is built once on first call, then O(1) lookups thereafter (~190 entries).
 */
export function getGovernmentLeader(
  countryCode: string,
): GovernmentLeaderRecord | undefined {
  if (!leadersByCountry) {
    leadersByCountry = new Map(
      listGovernmentLeaders().map((record) => [record.countryCode, record]),
    );
  }
  return leadersByCountry.get(countryCode);
}
