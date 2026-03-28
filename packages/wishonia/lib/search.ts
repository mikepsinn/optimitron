/**
 * Server-side TF-IDF RAG search.
 * Ported from transmit/lib/search.ts.
 */

export interface SearchEntry {
  path?: string;
  url?: string;
  title?: string;
  description?: string;
  section?: string;
  sections?: string[];
  tags?: string[];
  text?: string;
}

export interface ScoredResult {
  entry: SearchEntry;
  score: number;
}

const STOP_WORDS = new Set([
  "the", "and", "that", "this", "with", "for", "are", "but", "not", "you",
  "all", "can", "had", "her", "was", "one", "our", "out", "has", "have",
  "from", "been", "will", "more", "when", "who", "how", "its", "than",
  "them", "then", "what", "your", "which", "would", "about", "could",
  "into", "just", "also", "each", "other", "their", "there", "these",
  "those", "some", "only", "very", "such", "like", "over", "most",
  "his", "she", "him", "they",
]);

/**
 * Correct common STT misrecognitions of domain-specific terms.
 * Applied before tokenization so RAG search finds the right content.
 */
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
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function getEntryText(entry: SearchEntry): string {
  if (entry.text) return entry.text;
  const parts: string[] = [];
  if (entry.description) parts.push(entry.description);
  if (entry.sections && Array.isArray(entry.sections))
    parts.push(entry.sections.join(" "));
  if (entry.tags && Array.isArray(entry.tags)) parts.push(entry.tags.join(" "));
  return parts.join(" ");
}

function getEntryUrl(entry: SearchEntry): string {
  return entry.url || "";
}

const QUERY_EXPANSIONS: Record<string, string[]> = {
  get: ["earn", "receive", "reward", "bonus", "referral", "incentive"],
  pay: ["earn", "revenue", "return", "compensation", "bonus"],
  money: ["fund", "investment", "return", "profit", "revenue", "bond"],
  vote: ["voter", "voting", "campaign", "politician", "senator", "election"],
  cure: ["treatment", "therapy", "drug", "medicine", "clinical", "trial"],
  disease: ["illness", "health", "medical", "patient", "daly"],
  cost: ["price", "expense", "budget", "spending", "daly", "effectiveness"],
  work: ["mechanism", "function", "operate", "process", "architecture"],
  corrupt: ["corruption", "waste", "fraud", "transparency"],
  spend: ["spending", "budget", "military", "allocation"],
  invest: ["investor", "investment", "bond", "return", "profit"],
  save: ["prevent", "avert", "death", "daly", "lives"],
  optimitron: ["policy", "generator", "budget", "optimal"],
  optimocracy: ["governance", "optimitron", "policy"],
  wishocracy: ["allocation", "funding", "voting", "rappa"],
  dfda: ["fda", "decentralized", "regulatory", "trial"],
};

function expandQueryTokens(
  tokens: string[]
): Array<{ token: string; weight: number }> {
  const expanded: Array<{ token: string; weight: number }> = [];
  for (const t of tokens) {
    expanded.push({ token: t, weight: 1 });
    if (QUERY_EXPANSIONS[t]) {
      for (const syn of QUERY_EXPANSIONS[t]) {
        if (!tokens.includes(syn) && !expanded.some((x) => x.token === syn)) {
          expanded.push({ token: syn, weight: 0.5 });
        }
      }
    }
  }
  return expanded;
}

function extractSnippets(
  fullText: string,
  queryTokens: string[],
  maxChars: number
): string {
  if (fullText.length <= maxChars) return fullText;

  const WINDOW = 200;
  const lower = fullText.toLowerCase();
  const positions: number[] = [];

  for (const qt of queryTokens) {
    let start = 0;
    while (start < lower.length) {
      const idx = lower.indexOf(qt, start);
      if (idx === -1) break;
      positions.push(idx);
      start = idx + qt.length;
    }
  }

  if (positions.length === 0) return fullText.substring(0, maxChars) + "...";

  positions.sort((a, b) => a - b);
  const windows: Array<{ start: number; end: number }> = [];
  for (const pos of positions) {
    const winStart = Math.max(0, pos - WINDOW);
    const winEnd = Math.min(fullText.length, pos + WINDOW);
    const last = windows[windows.length - 1];
    if (last && winStart <= last.end) {
      last.end = Math.max(last.end, winEnd);
    } else {
      windows.push({ start: winStart, end: winEnd });
    }
  }

  const intro = fullText.substring(0, 300);
  const snippets = [intro];
  let totalLen = intro.length;

  for (const w of windows) {
    if (totalLen >= maxChars) break;
    const start = w.start < 300 ? 300 : w.start;
    if (start >= w.end) continue;
    let snippet = fullText.substring(start, w.end);
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20) snippet = snippet.substring(firstSpace + 1);
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > snippet.length - 20) snippet = snippet.substring(0, lastSpace);
    snippets.push("..." + snippet);
    totalLen += snippet.length + 3;
  }

  return snippets.join("\n");
}

/**
 * TF-IDF search over the index.
 * Returns formatted context string ready for the LLM prompt.
 */
export function searchContent(
  index: SearchEntry[],
  query: string,
  maxResults = 8,
  maxChars = 6000
): { context: string; results: ScoredResult[] } {
  if (!index || index.length === 0)
    return { context: "", results: [] };

  query = correctTranscript(query);
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return { context: "", results: [] };

  const expandedTokens = expandQueryTokens(queryTokens);

  const scored: ScoredResult[] = index.map((entry) => {
    const titleTokens = tokenize(entry.title || "");
    const sectionTokens = tokenize(entry.section || "");
    const textTokens = tokenize(getEntryText(entry));

    let score = 0;
    for (const item of expandedTokens) {
      const qt = item.token;
      const w = item.weight;
      if (titleTokens.includes(qt)) score += 3 * w;
      if (sectionTokens.includes(qt)) score += 3 * w;
      let count = 0;
      for (const t of textTokens) {
        if (t === qt) count++;
      }
      score += Math.log(1 + count) * w;
    }

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, maxResults);

  if (top.length === 0)
    return { context: "No relevant sections found in the book.", results: [] };

  const context = top
    .map((item) => {
      const e = item.entry;
      let label = e.title || "Untitled";
      if (e.section && e.section !== e.title) label += " (from " + e.section + ")";
      const href = getEntryUrl(e);
      const fullText = getEntryText(e);
      const text = extractSnippets(fullText, queryTokens, maxChars);
      const sections =
        e.sections && Array.isArray(e.sections)
          ? "\nSections: " + e.sections.join(", ")
          : "";
      return (
        "### " + label + "\n" + (e.description || "") + "\n" + text + sections +
        (href ? "\nSource: " + href : "")
      );
    })
    .join("\n\n");

  return { context, results: top };
}
