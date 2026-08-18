const MANUAL_BASE_URL = "https://manual.warondisease.org";
const SEARCH_INDEX_URL = `${MANUAL_BASE_URL}/assets/json/search-index.json`;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ManualSearchEntry {
  path?: string;
  url?: string;
  title?: string;
  description?: string;
  section?: string;
  sections?: string[];
  tags?: string[];
  text?: string;
}

export interface ManualSearchCitation {
  description?: string;
  path?: string;
  score: number;
  title: string;
  url: string;
}

export interface ManualSearchResult {
  entry: ManualSearchEntry;
  score: number;
}

interface SearchIndexPayload {
  entries?: ManualSearchEntry[];
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "from",
  "been",
  "will",
  "more",
  "when",
  "who",
  "how",
  "its",
  "than",
  "them",
  "then",
  "what",
  "your",
  "which",
  "would",
  "about",
  "could",
  "into",
  "just",
  "also",
  "each",
  "other",
  "their",
  "there",
  "these",
  "those",
  "some",
  "only",
  "very",
  "such",
  "like",
  "over",
  "most",
  "his",
  "she",
  "him",
  "they",
]);

const TRANSCRIPT_CORRECTIONS: Array<[RegExp, string]> = [
  [/\b(optometran|optimetron|optimitran|opt a metron|opt i metron|optimatron)\b/gi, "Optimitron"],
  [/\b(op democracy|optimo cracy|opt democracy|opt a mocracy|optim ocracy)\b/gi, "Optimocracy"],
  [/\b(wish own ya|wishon ya|wish on ya|we shown ya|wish own ia|wisha nia)\b/gi, "Wishonia"],
  [/\b(wish ocracy|wish ah cracy|wisho cracy)\b/gi, "Wishocracy"],
  [/\b(d f d a|d\.f\.d\.a\.?)\b/gi, "DFDA"],
  [/\b(i a b|i\.a\.b\.?)\b/gi, "IAB"],
  [/\b(o b g|o\.b\.g\.?)\b/gi, "OBG"],
  [/\b(o p g|o\.p\.g\.?)\b/gi, "OPG"],
  [/\b(dolly|daily)(?=\s+adjusted|\s+life|\s+year)/gi, "DALY"],
  [/\b(collie|quality)(?=[\s-]+adjusted\s+life)/gi, "QALY"],
  [/\bone percent treaty\b/gi, "1% Treaty"],
];

const QUERY_EXPANSIONS: Record<string, string[]> = {
  cost: ["price", "expense", "budget", "spending", "daly", "effectiveness"],
  corrupt: ["corruption", "waste", "fraud", "transparency"],
  cure: ["treatment", "therapy", "drug", "medicine", "clinical", "trial"],
  dfda: ["fda", "decentralized", "regulatory", "trial"],
  disease: ["illness", "health", "medical", "patient", "daly"],
  get: ["earn", "receive", "reward", "bonus", "referral", "incentive"],
  invest: ["investor", "investment", "bond", "return", "profit"],
  money: ["fund", "investment", "return", "profit", "revenue", "bond"],
  optimitron: ["policy", "generator", "budget", "optimal"],
  optimocracy: ["governance", "optimitron", "policy"],
  pay: ["earn", "revenue", "return", "compensation", "bonus"],
  save: ["prevent", "avert", "death", "daly", "lives"],
  spend: ["spending", "budget", "military", "allocation"],
  vote: ["voter", "voting", "campaign", "politician", "senator", "election"],
  wishocracy: ["allocation", "funding", "voting", "rappa"],
  work: ["mechanism", "function", "operate", "process", "architecture"],
};

let cachedIndex: ManualSearchEntry[] = [];
let lastFetchTime = 0;
let fetchPromise: Promise<ManualSearchEntry[]> | null = null;

export function correctTranscript(text: string): string {
  let corrected = text;

  for (const [pattern, replacement] of TRANSCRIPT_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }

  return corrected;
}

export function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function getEntryText(entry: ManualSearchEntry): string {
  if (entry.text) {
    return entry.text;
  }

  const parts: string[] = [];

  if (entry.description) {
    parts.push(entry.description);
  }

  if (entry.section) {
    parts.push(entry.section);
  }

  if (entry.sections?.length) {
    parts.push(entry.sections.join(" "));
  }

  if (entry.tags?.length) {
    parts.push(entry.tags.join(" "));
  }

  return parts.join(" ");
}

function getEntryUrl(entry: ManualSearchEntry): string {
  const rawUrl = entry.url?.trim();

  if (!rawUrl) {
    return entry.path?.trim() ? `${MANUAL_BASE_URL}/${entry.path.replace(/^\//, "")}` : MANUAL_BASE_URL;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  return `${MANUAL_BASE_URL}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
}

function expandQueryTokens(tokens: string[]): Array<{ token: string; weight: number }> {
  const expanded: Array<{ token: string; weight: number }> = [];

  for (const token of tokens) {
    expanded.push({ token, weight: 1 });

    for (const synonym of QUERY_EXPANSIONS[token] ?? []) {
      if (!tokens.includes(synonym) && !expanded.some((item) => item.token === synonym)) {
        expanded.push({ token: synonym, weight: 0.5 });
      }
    }
  }

  return expanded;
}

function extractSnippets(fullText: string, queryTokens: string[], maxChars: number): string {
  if (fullText.length <= maxChars) {
    return fullText;
  }

  const windowRadius = 200;
  const loweredText = fullText.toLowerCase();
  const positions: number[] = [];

  for (const queryToken of queryTokens) {
    let start = 0;
    while (start < loweredText.length) {
      const matchIndex = loweredText.indexOf(queryToken, start);

      if (matchIndex === -1) {
        break;
      }

      positions.push(matchIndex);
      start = matchIndex + queryToken.length;
    }
  }

  if (positions.length === 0) {
    return `${fullText.slice(0, maxChars)}...`;
  }

  positions.sort((left, right) => left - right);

  const windows: Array<{ start: number; end: number }> = [];

  for (const position of positions) {
    const start = Math.max(0, position - windowRadius);
    const end = Math.min(fullText.length, position + windowRadius);
    const previousWindow = windows[windows.length - 1];

    if (previousWindow && start <= previousWindow.end) {
      previousWindow.end = Math.max(previousWindow.end, end);
      continue;
    }

    windows.push({ start, end });
  }

  const intro = fullText.slice(0, Math.min(300, maxChars));
  const snippets = [intro];
  let totalLength = intro.length;

  for (const window of windows) {
    if (totalLength >= maxChars) {
      break;
    }

    const start = window.start < intro.length ? intro.length : window.start;

    if (start >= window.end) {
      continue;
    }

    let snippet = fullText.slice(start, window.end);
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20) {
      snippet = snippet.slice(firstSpace + 1);
    }

    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > snippet.length - 20) {
      snippet = snippet.slice(0, lastSpace);
    }

    snippets.push(`...${snippet}`);
    totalLength += snippet.length + 3;
  }

  return snippets.join("\n");
}

export async function getManualSearchIndex(options?: {
  forceRefresh?: boolean;
}): Promise<ManualSearchEntry[]> {
  const now = Date.now();
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && cachedIndex.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedIndex;
  }

  if (!forceRefresh && fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const response = await fetch(SEARCH_INDEX_URL, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Manual search index request failed with HTTP ${response.status}`);
      }

      const data = (await response.json()) as ManualSearchEntry[] | SearchIndexPayload;
      cachedIndex = Array.isArray(data) ? data : data.entries ?? [];
      lastFetchTime = Date.now();
    } catch (error) {
      if (cachedIndex.length > 0) {
        console.error("[manual-search] Failed to refresh index, using stale cache:", error);
        return cachedIndex;
      }

      throw error;
    }

    return cachedIndex;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

export function searchManualContent(
  index: ManualSearchEntry[],
  query: string,
  maxResults = 5,
  maxChars = 4500,
): { context: string; results: ManualSearchResult[] } {
  if (!index.length) {
    return { context: "", results: [] };
  }

  const correctedQuery = correctTranscript(query);
  const queryTokens = tokenize(correctedQuery);

  if (!queryTokens.length) {
    return { context: "", results: [] };
  }

  const expandedTokens = expandQueryTokens(queryTokens);

  const scoredResults = index
    .map((entry) => {
      const titleTokens = tokenize(entry.title ?? "");
      const sectionTokens = tokenize([entry.section, ...(entry.sections ?? [])].filter(Boolean).join(" "));
      const textTokens = tokenize(getEntryText(entry));

      let score = 0;

      for (const expandedToken of expandedTokens) {
        if (titleTokens.includes(expandedToken.token)) {
          score += 3 * expandedToken.weight;
        }

        if (sectionTokens.includes(expandedToken.token)) {
          score += 3 * expandedToken.weight;
        }

        let count = 0;
        for (const token of textTokens) {
          if (token === expandedToken.token) {
            count++;
          }
        }

        score += Math.log(1 + count) * expandedToken.weight;
      }

      return { entry, score };
    })
    .sort((left, right) => right.score - left.score)
    .filter((result) => result.score > 0)
    .slice(0, maxResults);

  if (!scoredResults.length) {
    return {
      context: "No relevant sections found in the manual search index.",
      results: [],
    };
  }

  const maxCharsPerResult = Math.max(700, Math.floor(maxChars / scoredResults.length));
  const context = scoredResults
    .map((result) => {
      const entry = result.entry;
      const heading =
        entry.section && entry.section !== entry.title
          ? `${entry.title ?? "Untitled"} (from ${entry.section})`
          : (entry.title ?? "Untitled");
      const text = extractSnippets(getEntryText(entry), queryTokens, maxCharsPerResult);
      const sections = entry.sections?.length ? `\nSections: ${entry.sections.join(", ")}` : "";

      return [
        `### ${heading}`,
        entry.description ?? "",
        text,
        sections,
        `Source: ${getEntryUrl(entry)}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return { context, results: scoredResults };
}

export async function retrieveManualContext(
  query: string,
  options?: { forceRefresh?: boolean; maxChars?: number; maxResults?: number },
): Promise<{ citations: ManualSearchCitation[]; context: string }> {
  const index = await getManualSearchIndex({ forceRefresh: options?.forceRefresh });
  const search = searchManualContent(
    index,
    query,
    options?.maxResults ?? 5,
    options?.maxChars ?? 4500,
  );

  return {
    context: search.context,
    citations: search.results.map((result) => ({
      description: result.entry.description,
      path: result.entry.path,
      score: Number(result.score.toFixed(3)),
      title: result.entry.title ?? "Untitled",
      url: getEntryUrl(result.entry),
    })),
  };
}

export function formatManualEntryForUpload(entry: ManualSearchEntry): string {
  const sections = entry.sections?.length ? entry.sections.join(", ") : "";
  const tags = entry.tags?.length ? entry.tags.join(", ") : "";

  return [
    `# ${entry.title ?? "Untitled"}`,
    `URL: ${getEntryUrl(entry)}`,
    entry.path ? `Path: ${entry.path}` : "",
    entry.description ? `Description: ${entry.description}` : "",
    entry.section ? `Section: ${entry.section}` : "",
    sections ? `Sections: ${sections}` : "",
    tags ? `Tags: ${tags}` : "",
    "",
    entry.text ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
