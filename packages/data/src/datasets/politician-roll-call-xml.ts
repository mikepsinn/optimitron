/**
 * Parse House and Senate roll-call XML into bioguide ID → vote position maps.
 *
 * The scorecard generator (scripts/generate-politician-scorecards.ts) downloads
 * the XML; this module holds the pure parsing so it can be tested without the
 * network.
 */

/** A senator from the Congress.gov member list, as the Senate parser needs it. */
export interface SenatorListing {
  bioguideId: string;
  /** Congress.gov list name, such as "Graham, Lindsey". */
  name: string;
  /** Full state name or two-letter code. */
  state: string;
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
export function parseHouseXml(xml: string): Map<string, string> {
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
 * Senate XML uses lis_member_id, not bioguide. We match each voter against the
 * Congress.gov member list by first name + last name + state. When that fails
 * (the XML may use a different first name), we match by last name + state,
 * but only when one listed senator from that state has that last name. Two
 * senators from one state can share a last name (Lindsey and Darline Graham).
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
export function parseSenateXml(
  xml: string,
  senators: readonly SenatorListing[],
): Map<string, string> {
  // normalized(first last):STATE → bioguideId
  const bioguideByFullName = new Map<string, string>();
  // normalized(last):STATE → bioguideId, or null when two senators share it
  const bioguideByLastName = new Map<string, string | null>();
  for (const senator of senators) {
    if (!senator.bioguideId || !senator.state) continue;
    const { firstName, lastName } = extractNameParts(senator.name);
    const stateCode = normalizeState(senator.state);
    bioguideByFullName.set(
      `${normalizeName(`${firstName} ${lastName}`)}:${stateCode}`,
      senator.bioguideId,
    );
    const lastNameKey = `${normalizeName(lastName)}:${stateCode}`;
    const listed = bioguideByLastName.get(lastNameKey);
    bioguideByLastName.set(
      lastNameKey,
      listed === undefined || listed === senator.bioguideId ? senator.bioguideId : null,
    );
  }

  const voteMap = new Map<string, string>();
  const memberPattern =
    /<member>\s*<member_full>([\s\S]*?)<\/member_full>[\s\S]*?<last_name>([\s\S]*?)<\/last_name>[\s\S]*?<first_name>([\s\S]*?)<\/first_name>[\s\S]*?<party>([\s\S]*?)<\/party>[\s\S]*?<state>([\s\S]*?)<\/state>[\s\S]*?<vote_cast>([\s\S]*?)<\/vote_cast>[\s\S]*?<\/member>/gi;

  let match = memberPattern.exec(xml);
  while (match) {
    const lastName = decodeXmlEntities(match[2]?.trim() ?? "");
    const firstName = decodeXmlEntities(match[3]?.trim() ?? "");
    const state = normalizeState(decodeXmlEntities(match[5]?.trim() ?? ""));
    const voteCast = decodeXmlEntities(match[6]?.trim() ?? "");

    const bioguideId =
      bioguideByFullName.get(`${normalizeName(`${firstName} ${lastName}`)}:${state}`) ??
      bioguideByLastName.get(`${normalizeName(lastName)}:${state}`);

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
    .replace(/[̀-ͯ]/g, "")
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
