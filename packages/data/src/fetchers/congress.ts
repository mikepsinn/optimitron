/**
 * Congress.gov API Fetcher
 *
 * Fetches US Congressional member data, bills, and roll call votes.
 * Optionally uses an API key via CONGRESS_API_KEY environment variable.
 *
 * API docs: https://api.congress.gov/
 * GitHub: https://github.com/LibraryOfCongress/api.congress.gov
 */

const CONGRESS_API_BASE = 'https://api.congress.gov/v3';

/** Default number of items per page (max 250 for Congress API) */
const DEFAULT_LIMIT = 250;

/** Current Congress number (119th Congress: 2025-2027) */
const CURRENT_CONGRESS = 119;

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

// ─── Types ──────────────────────────────────────────────────────────

/** A term of service for a Congress member */
export interface CongressTerm {
  chamber: string;
  congress?: number;
  startYear: number;
  endYear?: number;
  stateCode?: string;
  district?: number;
  partyName?: string;
}

/** A member of Congress */
export interface CongressMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  chamber: string;
  district?: number;
  terms: CongressTerm[];
}

/** A bill or resolution */
export interface Bill {
  billId: string;
  title: string;
  congress: number;
  type: string;
  number: number;
  subjects: string[];
  policyArea: string | null;
  latestAction: { date: string; text: string } | null;
}

/** A member's vote position on a roll call */
export interface MemberVotePosition {
  bioguideId: string;
  position: string;
}

/** A roll call vote */
export interface Vote {
  rollCallNumber: number;
  congress: number;
  chamber: string;
  session: number;
  date: string;
  question: string;
  result: string;
  memberVotes: MemberVotePosition[];
}

/** Pagination info from Congress API responses */
export interface CongressPagination {
  count: number;
  next?: string;
}

// ─── Raw API response shapes ────────────────────────────────────────

/** Raw member from list endpoint */
export interface RawMemberListItem {
  bioguideId: string;
  name: string;
  partyName: string;
  state: string;
  district?: number;
  terms: {
    item: Array<{
      chamber: string;
      startYear: number;
      endYear?: number;
    }>;
  };
}

/** Raw member from detail endpoint */
export interface RawMemberDetail {
  bioguideId: string;
  directOrderName?: string;
  invertedOrderName?: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  state?: string;
  district?: number;
  currentMember?: boolean;
  terms?: Array<{
    memberType?: string;
    congress?: number;
    chamber?: string;
    stateCode?: string;
    stateName?: string;
    startYear?: number;
    endYear?: number;
    district?: number;
    partyName?: string;
    partyCode?: string;
  }>;
}

/** Raw bill from list endpoint */
export interface RawBillListItem {
  congress: number;
  type: string;
  number: number | string;
  title: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  url: string;
}

/** Raw bill from detail endpoint */
export interface RawBillDetail {
  congress: number;
  type: string;
  number: number | string;
  title: string;
  policyArea?: { name: string };
  subjects?: {
    legislativeSubjects?: Array<{ name: string }>;
  };
  latestAction?: {
    actionDate: string;
    text: string;
  };
}

/** Raw bill subjects response */
export interface RawBillSubjectsResponse {
  subjects: {
    legislativeSubjects?: Array<{ name: string }>;
    policyArea?: { name: string };
  };
}

/** Raw vote from roll call endpoint */
export interface RawRollCallVote {
  rollCallNumber: number;
  congress: number;
  chamber: string;
  session: number;
  date: string;
  question: string;
  result: string;
  members?: Array<{
    bioguideId: string;
    votePosition?: string;
  }>;
}

/** Raw vote from bill actions/votes endpoint */
export interface RawBillVote {
  rollNumber?: number;
  chamber?: string;
  congress?: number;
  date?: string;
  question?: string;
  result?: string;
  sessionNumber?: number;
  url?: string;
}

// ─── API Key ────────────────────────────────────────────────────────

/**
 * Get the Congress API key from the environment.
 * Returns `null` if not set — the API works without a key but with lower rate limits.
 */
export function getCongressApiKey(): string | null {
  return process.env['CONGRESS_API_KEY'] ?? null;
}

// ─── Core fetch helper ──────────────────────────────────────────────

/**
 * Build a Congress API URL with optional API key.
 */
export function buildCongressUrl(path: string, params: Record<string, string | number> = {}): string {
  const apiKey = getCongressApiKey();
  const allParams: Record<string, string> = {
    format: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  };
  if (apiKey) {
    allParams['api_key'] = apiKey;
  }

  const query = new URLSearchParams(allParams).toString();
  return `${CONGRESS_API_BASE}${path}?${query}`;
}

/**
 * Fetch JSON from the Congress API with error handling.
 * Returns `null` on failure for graceful degradation.
 */
export async function fetchCongressJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Congress API ${response.status}: ${response.statusText} — ${url}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error('Congress API fetch error:', error);
    return null;
  }
}

async function fetchCongressText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Congress API ${response.status}: ${response.statusText} — ${url}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error('Congress API fetch error:', error);
    return null;
  }
}

// ─── Parsers ────────────────────────────────────────────────────────

/**
 * Parse a raw member list item into a CongressMember.
 */
export function parseMemberListItem(raw: RawMemberListItem): CongressMember {
  const terms: CongressTerm[] = (raw.terms?.item ?? []).map((t) => ({
    chamber: t.chamber,
    startYear: t.startYear,
    endYear: t.endYear,
  }));

  const latestTerm = terms[terms.length - 1];
  const chamber = latestTerm?.chamber ?? 'Unknown';

  return {
    bioguideId: raw.bioguideId,
    name: raw.name,
    party: raw.partyName,
    state: raw.state,
    chamber,
    district: raw.district,
    terms,
  };
}

/**
 * Parse a raw member detail response into a CongressMember.
 */
export function parseMemberDetail(raw: RawMemberDetail): CongressMember {
  const terms: CongressTerm[] = (raw.terms ?? []).map((t) => ({
    chamber: t.chamber ?? 'Unknown',
    congress: t.congress,
    startYear: t.startYear ?? 0,
    endYear: t.endYear,
    stateCode: t.stateCode,
    district: t.district,
    partyName: t.partyName,
  }));

  const latestTerm = terms[terms.length - 1];

  return {
    bioguideId: raw.bioguideId,
    name: raw.directOrderName ?? raw.invertedOrderName ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
    party: raw.party ?? latestTerm?.partyName ?? 'Unknown',
    state: raw.state ?? latestTerm?.stateCode ?? 'Unknown',
    chamber: latestTerm?.chamber ?? 'Unknown',
    district: raw.district ?? latestTerm?.district,
    terms,
  };
}

/**
 * Parse a raw bill list item into a Bill.
 */
export function parseBillListItem(raw: RawBillListItem): Bill {
  return {
    billId: `${raw.congress}-${raw.type.toLowerCase()}-${raw.number}`,
    title: raw.title,
    congress: raw.congress,
    type: raw.type,
    number: Number(raw.number),
    subjects: [],
    policyArea: null,
    latestAction: raw.latestAction
      ? { date: raw.latestAction.actionDate, text: raw.latestAction.text }
      : null,
  };
}

/**
 * Parse a raw bill detail response into a Bill.
 */
export function parseBillDetail(raw: RawBillDetail): Bill {
  const subjects = (raw.subjects?.legislativeSubjects ?? []).map((s) => s.name);

  return {
    billId: `${raw.congress}-${raw.type.toLowerCase()}-${raw.number}`,
    title: raw.title,
    congress: raw.congress,
    type: raw.type,
    number: Number(raw.number),
    subjects,
    policyArea: raw.policyArea?.name ?? null,
    latestAction: raw.latestAction
      ? { date: raw.latestAction.actionDate, text: raw.latestAction.text }
      : null,
  };
}

function buildBillListPath(congress: number, billType?: string): string {
  const normalizedBillType = billType?.trim().toLowerCase();
  return normalizedBillType ? `/bill/${congress}/${normalizedBillType}` : `/bill/${congress}`;
}

// ─── Fetch functions ────────────────────────────────────────────────

/**
 * Fetch a list of Congress members.
 *
 * @param congress - Congress number (e.g. 118 for 118th Congress). Defaults to current.
 * @param chamber - Filter by chamber: 'house' or 'senate'.
 * @param limit - Maximum number of members to return.
 */
export async function fetchMembers(
  congress?: number,
  chamber?: 'house' | 'senate',
): Promise<CongressMember[]> {
  const congressNum = congress ?? CURRENT_CONGRESS;
  const path = `/member/congress/${congressNum}`;
  const congressApiKey = getCongressApiKey();

  // Paginate through all results (API max 250 per page, Congress has 535+ members)
  const allRaw: RawMemberListItem[] = [];
  let nextUrl: string | undefined = buildCongressUrl(path, {
    limit: DEFAULT_LIMIT,
    currentMember: 'false',
  });

  while (nextUrl) {
    const json: { members: RawMemberListItem[]; pagination?: CongressPagination } | null =
      await fetchCongressJson(nextUrl);
    if (!json?.members || json.members.length === 0) break;
    allRaw.push(...json.members);
    nextUrl = json.pagination?.next;
    // Append API key to pagination URL if needed
    if (nextUrl && congressApiKey && !nextUrl.includes('api_key')) {
      const sep: '&' | '?' = nextUrl.includes('?') ? '&' : '?';
      nextUrl = `${nextUrl}${sep}api_key=${congressApiKey}`;
    }
  }

  let members = allRaw.map(parseMemberListItem);

  if (chamber) {
    const chamberName = chamber === 'house' ? 'House of Representatives' : 'Senate';
    members = members.filter((m) => m.chamber === chamberName);
  }

  return members;
}

/**
 * Fetch detailed information about a specific Congress member.
 *
 * @param bioguideId - The member's Bioguide ID (e.g. 'L000174').
 */
export async function fetchMemberDetails(bioguideId: string): Promise<CongressMember | null> {
  const url = buildCongressUrl(`/member/${bioguideId}`);

  const json = await fetchCongressJson<{ member: RawMemberDetail }>(url);
  if (!json?.member) return null;

  return parseMemberDetail(json.member);
}

/**
 * Fetch a list of bills.
 *
 * @param congress - Congress number. Defaults to current.
 * @param subject - Filter by subject keyword (not directly supported by list endpoint; requires post-filter).
 * @param limit - Maximum number of bills to return.
 */
export async function fetchBills(
  congress?: number,
  _subject?: string,
  limit = DEFAULT_LIMIT,
): Promise<Bill[]> {
  return fetchBillsByType(congress, undefined, limit);
}

export async function fetchBillsByType(
  congress?: number,
  billType?: string,
  limit = DEFAULT_LIMIT,
): Promise<Bill[]> {
  const congressNum = congress ?? CURRENT_CONGRESS;
  const url = buildCongressUrl(buildBillListPath(congressNum, billType), { limit });

  const json = await fetchCongressJson<{ bills: RawBillListItem[]; pagination?: CongressPagination }>(url);
  if (!json?.bills) return [];

  return json.bills.map(parseBillListItem);
}

/**
 * Fetch detailed bill information including subjects and policy area.
 *
 * @param billType - Bill type (e.g. 'hr', 's', 'hjres', 'sjres').
 * @param billNumber - Bill number.
 * @param congress - Congress number. Defaults to current.
 */
export async function fetchBillDetail(
  billType: string,
  billNumber: number,
  congress?: number,
): Promise<Bill | null> {
  const congressNum = congress ?? CURRENT_CONGRESS;
  const url = buildCongressUrl(`/bill/${congressNum}/${billType.toLowerCase()}/${billNumber}`);

  const json = await fetchCongressJson<{ bill: RawBillDetail }>(url);
  if (!json?.bill) return null;

  return parseBillDetail(json.bill);
}

/**
 * Fetch subjects for a specific bill.
 *
 * @param billType - Bill type (e.g. 'hr', 's').
 * @param billNumber - Bill number.
 * @param congress - Congress number. Defaults to current.
 */
export async function fetchBillSubjects(
  billType: string,
  billNumber: number,
  congress?: number,
): Promise<{ subjects: string[]; policyArea: string | null }> {
  const congressNum = congress ?? CURRENT_CONGRESS;
  const url = buildCongressUrl(`/bill/${congressNum}/${billType.toLowerCase()}/${billNumber}/subjects`);

  const json = await fetchCongressJson<RawBillSubjectsResponse>(url);
  if (!json?.subjects) return { subjects: [], policyArea: null };

  return {
    subjects: (json.subjects.legislativeSubjects ?? []).map((s) => s.name),
    policyArea: json.subjects.policyArea?.name ?? null,
  };
}

/**
 * Fetch votes associated with a specific bill.
 *
 * The Congress API provides vote actions on the bill's actions endpoint.
 *
 * @param billType - Bill type (e.g. 'hr', 's').
 * @param billNumber - Bill number.
 * @param congress - Congress number. Defaults to current.
 */
export async function fetchBillVotes(
  billType: string,
  billNumber: number,
  congress?: number,
): Promise<RawBillVote[]> {
  const congressNum = congress ?? CURRENT_CONGRESS;
  const url = buildCongressUrl(
    `/bill/${congressNum}/${billType.toLowerCase()}/${billNumber}/actions`,
    { limit: DEFAULT_LIMIT },
  );

  const json = await fetchCongressJson<{ actions: Array<RawBillVote & { type?: string; recordedVotes?: RawBillVote[] }> }>(url);
  if (!json?.actions) return [];

  // Extract actions that have recorded votes
  const votes: RawBillVote[] = [];
  for (const action of json.actions) {
    if (action.recordedVotes) {
      for (const rv of action.recordedVotes) {
        votes.push(rv);
      }
    }
  }

  return votes;
}

/**
 * Fetch a specific roll call vote with individual member positions.
 *
 * NOTE: The Congress.gov API added House roll call votes in 2025.
 * Senate roll call votes may use a different endpoint structure.
 *
 * @param congress - Congress number.
 * @param chamber - Chamber ('house' or 'senate').
 * @param sessionNumber - Session number (1 or 2).
 * @param rollCallNumber - Roll call vote number.
 */
export async function fetchRollCallVote(
  congress: number,
  chamber: string,
  sessionNumber: number,
  rollCallNumber: number,
  sourceUrl?: string | null,
): Promise<Vote | null> {
  const chamberPath = chamber.toLowerCase();
  const url = buildCongressUrl(
    `/rollcall/${chamberPath}/${congress}/${sessionNumber}/${rollCallNumber}`,
  );

  const json = await fetchCongressJson<{ rollcallVote: RawRollCallVote }>(url);

  // Fall back to trying the house-vote endpoint structure
  if (!json?.rollcallVote) {
    if (chamberPath === 'house') {
      const altUrl = buildCongressUrl(
        `/house-vote/${congress}/${sessionNumber}/${rollCallNumber}`,
      );
      const altJson = await fetchCongressJson<{ 'house-vote': RawRollCallVote }>(altUrl);
      if (altJson?.['house-vote']) {
        return parseRollCallVote(altJson['house-vote'], congress, chamberPath, sessionNumber);
      }

      if (!sourceUrl) {
        return null;
      }

      const xml = await fetchCongressText(sourceUrl);
      if (!xml) {
        return null;
      }

      return parseHouseClerkRollCallVote(xml);
    }

    if (chamberPath === 'senate' && sourceUrl) {
      const [xml, senators] = await Promise.all([
        fetchCongressText(sourceUrl),
        fetchMembers(congress, 'senate'),
      ]);
      if (!xml) {
        return null;
      }

      return parseSenateRollCallVote(xml, congress, senators);
    }

    return null;
  }

  return parseRollCallVote(json.rollcallVote, congress, chamberPath, sessionNumber);
}

/**
 * Parse a raw roll call vote response into a Vote.
 */
function parseRollCallVote(
  raw: RawRollCallVote,
  congress: number,
  chamber: string,
  session: number,
): Vote {
  const memberVotes: MemberVotePosition[] = (raw.members ?? [])
    .filter((m) => m.bioguideId && m.votePosition)
    .map((m) => ({
      bioguideId: m.bioguideId,
      position: m.votePosition ?? 'Unknown',
    }));

  return {
    rollCallNumber: raw.rollCallNumber,
    congress: raw.congress ?? congress,
    chamber: raw.chamber ?? chamber,
    session: raw.session ?? session,
    date: raw.date ?? '',
    question: raw.question ?? '',
    result: raw.result ?? '',
    memberVotes,
  };
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractXmlTagValue(xml: string, tagName: string): string | null {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1] ? decodeXmlEntities(match[1].trim()) : null;
}

function normalizePersonNameKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function normalizeStateCode(state: string): string {
  const trimmed = state.trim();
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  return US_STATE_ABBREVIATIONS[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

function extractCongressNameParts(name: string): { firstName: string; lastName: string } {
  if (name.includes(',')) {
    const [lastName = '', firstName = ''] = name.split(',', 2);
    return {
      firstName: firstName.trim().split(/\s+/)[0] ?? '',
      lastName: lastName.trim(),
    };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

function parseHouseClerkSessionNumber(sessionLabel: string | null): number {
  const match = sessionLabel?.match(/(\d+)/);
  return match ? Number(match[1]) : 1;
}

function parseHouseClerkRollCallVote(xml: string): Vote | null {
  const rollCallNumber = Number(extractXmlTagValue(xml, 'rollcall-num'));
  if (!Number.isFinite(rollCallNumber)) {
    return null;
  }

  const congress = Number(extractXmlTagValue(xml, 'congress'));
  const memberVotes: MemberVotePosition[] = [];
  const memberPattern =
    /<recorded-vote>\s*<legislator\b[^>]*name-id="([^"]+)"[\s\S]*?<\/legislator>\s*<vote>([\s\S]*?)<\/vote>\s*<\/recorded-vote>/gi;

  let match = memberPattern.exec(xml);
  while (match) {
    const bioguideId = match[1]?.trim();
    const position = match[2] ? decodeXmlEntities(match[2].trim()) : '';
    if (bioguideId && position) {
      memberVotes.push({ bioguideId, position });
    }
    match = memberPattern.exec(xml);
  }

  return {
    rollCallNumber,
    congress: Number.isFinite(congress) ? congress : CURRENT_CONGRESS,
    chamber: 'House',
    session: parseHouseClerkSessionNumber(extractXmlTagValue(xml, 'session')),
    date: extractXmlTagValue(xml, 'action-date') ?? '',
    question: extractXmlTagValue(xml, 'vote-question') ?? '',
    result: extractXmlTagValue(xml, 'vote-result') ?? '',
    memberVotes,
  };
}

function parseSenateRollCallVote(
  xml: string,
  congress: number,
  senators: CongressMember[],
): Vote | null {
  const rollCallNumber = Number(extractXmlTagValue(xml, 'vote_number'));
  if (!Number.isFinite(rollCallNumber)) {
    return null;
  }

  const memberIdByNameState = new Map<string, string>();
  for (const senator of senators) {
    if (!senator.bioguideId || !senator.state) {
      continue;
    }

    const { firstName, lastName } = extractCongressNameParts(senator.name);
    memberIdByNameState.set(
      `${normalizePersonNameKey(lastName)}:${normalizeStateCode(senator.state)}`,
      senator.bioguideId,
    );
    memberIdByNameState.set(
      `${normalizePersonNameKey(`${firstName} ${lastName}`)}:${normalizeStateCode(senator.state)}`,
      senator.bioguideId,
    );
  }

  const memberVotes: MemberVotePosition[] = [];
  const memberPattern =
    /<member>\s*<member_full>([\s\S]*?)<\/member_full>[\s\S]*?<last_name>([\s\S]*?)<\/last_name>[\s\S]*?<first_name>([\s\S]*?)<\/first_name>[\s\S]*?<party>([\s\S]*?)<\/party>[\s\S]*?<state>([\s\S]*?)<\/state>[\s\S]*?<vote_cast>([\s\S]*?)<\/vote_cast>[\s\S]*?<\/member>/gi;

  let match = memberPattern.exec(xml);
  while (match) {
    const fullName = decodeXmlEntities(match[1]?.trim() ?? '');
    const lastName = decodeXmlEntities(match[2]?.trim() ?? '');
    const firstName = decodeXmlEntities(match[3]?.trim() ?? '');
    const state = decodeXmlEntities(match[5]?.trim() ?? '');
    const position = decodeXmlEntities(match[6]?.trim() ?? '');
    const bioguideId =
      memberIdByNameState.get(`${normalizePersonNameKey(lastName)}:${state}`) ??
      memberIdByNameState.get(
        `${normalizePersonNameKey(`${firstName} ${lastName}`)}:${state}`,
      ) ??
      memberIdByNameState.get(`${normalizePersonNameKey(fullName)}:${state}`);

    if (bioguideId && position) {
      memberVotes.push({ bioguideId, position });
    }
    match = memberPattern.exec(xml);
  }

  return {
    rollCallNumber,
    congress,
    chamber: 'Senate',
    session: parseHouseClerkSessionNumber(extractXmlTagValue(xml, 'session')),
    date:
      extractXmlTagValue(xml, 'vote_date') ??
      extractXmlTagValue(xml, 'modify_date') ??
      '',
    question:
      extractXmlTagValue(xml, 'question') ??
      extractXmlTagValue(xml, 'vote_question_text') ??
      '',
    result:
      extractXmlTagValue(xml, 'vote_result') ??
      extractXmlTagValue(xml, 'vote_result_text') ??
      '',
    memberVotes,
  };
}
