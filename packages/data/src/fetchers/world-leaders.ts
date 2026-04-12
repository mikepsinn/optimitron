/**
 * Fetch current heads of state/government from Wikidata SPARQL.
 *
 * Returns leader name + Wikimedia Commons image URL for each country (ISO 3166-1 alpha-2).
 * Used to populate Person records for treaty signer tasks.
 */

export interface WorldLeader {
  countryCode: string;
  countryName: string;
  leaderName: string;
  leaderImageUrl: string | null;
  roleTitle: string;
  wikidataId: string;
}

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

/**
 * SPARQL query to get current heads of state and government with their images.
 * Prefers head of government (P6) over head of state (P35) since the HoG is
 * usually the decision-maker for treaty ratification.
 */
const SPARQL_QUERY = `
SELECT DISTINCT ?country ?countryLabel ?countryCode ?leader ?leaderLabel ?roleLabel ?image WHERE {
  {
    ?country p:P6 ?stmt .
    ?stmt ps:P6 ?leader .
    FILTER NOT EXISTS { ?stmt pq:P582 ?endDate }
    BIND("Head of Government" AS ?role)
  } UNION {
    ?country p:P35 ?stmt .
    ?stmt ps:P35 ?leader .
    FILTER NOT EXISTS { ?stmt pq:P582 ?endDate }
    BIND("Head of State" AS ?role)
  }
  ?country wdt:P31 wd:Q3624078 .
  ?country wdt:P297 ?countryCode .
  OPTIONAL { ?leader wdt:P18 ?image }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
ORDER BY ?countryCode
`;

export async function fetchWorldLeaders(): Promise<WorldLeader[]> {
  const url = new URL(WIKIDATA_SPARQL_URL);
  url.searchParams.set("query", SPARQL_QUERY);
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "Optimitron/1.0 (https://optimitron.com; contact@optimitron.com)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata SPARQL query failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: {
      bindings: Array<{
        country: { value: string };
        countryCode: { value: string };
        countryLabel: { value: string };
        image?: { value: string };
        leader: { value: string };
        leaderLabel: { value: string };
        roleLabel: { value: string };
      }>;
    };
  };

  // Deduplicate: prefer head of government over head of state for each country
  const byCountry = new Map<string, WorldLeader>();

  for (const binding of data.results.bindings) {
    const countryCode = binding.countryCode.value.toUpperCase();
    const role = binding.roleLabel.value;
    const existing = byCountry.get(countryCode);

    // Prefer Head of Government over Head of State
    if (existing && role === "Head of State") continue;

    const wikidataId = binding.leader.value.split("/").pop() ?? "";

    byCountry.set(countryCode, {
      countryCode,
      countryName: binding.countryLabel.value,
      leaderImageUrl: binding.image?.value ?? null,
      leaderName: binding.leaderLabel.value,
      roleTitle: role,
      wikidataId,
    });
  }

  const rows = [...byCountry.values()].sort((a, b) => a.countryCode.localeCompare(b.countryCode));
  await resolveMissingLabels(rows);
  applyOverrides(rows);
  return rows;
}

/**
 * Manual corrections for countries where Wikidata's current-HoG/HoS statement
 * is stale or wrong. Apply sparingly — prefer fixing the upstream Wikidata item.
 */
const OVERRIDES: Record<string, Partial<WorldLeader>> = {
  // Wikidata HoG statement is stale (Michel Barnier, ousted Dec 2024).
  // Current image on the row is already Sébastien Lecornu, so only the label needs a fix.
  FR: { leaderName: "Sébastien Lecornu" },
  // Wikidata has an open HoS statement for Delcy Rodríguez (VP, occasionally acting).
  // Nicolás Maduro is the actual Head of State.
  VE: { leaderName: "Nicolás Maduro", roleTitle: "Head of State", leaderImageUrl: null },
};

function applyOverrides(rows: WorldLeader[]): void {
  for (const row of rows) {
    const override = OVERRIDES[row.countryCode];
    if (override) Object.assign(row, override);
  }
}

const QID_PATTERN = /^Q\d+$/;
const LABEL_PREFERENCE = ["en", "en-gb", "en-ca", "es", "fr", "pt", "mul"];

async function resolveMissingLabels(rows: WorldLeader[]): Promise<void> {
  for (const row of rows) {
    if (!QID_PATTERN.test(row.leaderName)) continue;
    const label = await fetchWikidataLabel(row.wikidataId);
    if (label) row.leaderName = label;
  }
}

async function fetchWikidataLabel(qid: string): Promise<string | null> {
  if (!qid) return null;
  const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Optimitron/1.0 (https://optimitron.com; contact@optimitron.com)",
    },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    entities?: Record<string, { labels?: Record<string, { value: string }> }>;
  };
  const labels = data.entities?.[qid]?.labels;
  if (!labels) return null;

  for (const lang of LABEL_PREFERENCE) {
    const hit = labels[lang]?.value;
    if (hit) return hit;
  }
  const first = Object.values(labels)[0]?.value;
  return first ?? null;
}
