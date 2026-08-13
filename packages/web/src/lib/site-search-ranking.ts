const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "how",
  "into",
  "not",
  "the",
  "this",
  "that",
  "what",
  "with",
  "you",
  "your",
]);

export interface SearchTerms {
  normalizedQuery: string;
  terms: string[];
}

export interface SearchScorableRecord {
  title: string;
  description?: string | null;
  href?: string | null;
  keywords?: string[];
  section?: string | null;
}

export interface StaticSiteSearchDocument {
  description: string;
  external?: boolean;
  href: string;
  keywords?: string[];
  section: string;
  title: string;
}

export function getSearchTerms(query: string): SearchTerms {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      normalizedQuery,
      terms: [],
    };
  }

  const terms = Array.from(
    new Set(
      normalizedQuery
        .split(/[^a-z0-9%]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2 && !STOP_WORDS.has(term)),
    ),
  );

  return {
    normalizedQuery,
    terms,
  };
}

export function scoreSearchRecord(
  query: string | SearchTerms,
  record: SearchScorableRecord,
) {
  const searchTerms = typeof query === "string" ? getSearchTerms(query) : query;

  if (!searchTerms.normalizedQuery) {
    return 0;
  }

  const title = record.title.toLowerCase();
  const description = (record.description ?? "").toLowerCase();
  const href = (record.href ?? "").toLowerCase();
  const hrefPath = href
    .replace(/^https?:\/\/[^/]+/u, "")
    .split(/[?#]/u)[0]
    ?.replace(/^\/+|\/+$/gu, "");
  const section = (record.section ?? "").toLowerCase();
  const keywords =
    record.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];

  let score = 0;

  if (hrefPath === searchTerms.normalizedQuery) {
    score += 24;
  }

  if (title.includes(searchTerms.normalizedQuery)) {
    score += 14;
  }

  if (
    keywords.some((keyword) => keyword.includes(searchTerms.normalizedQuery))
  ) {
    score += 10;
  }

  if (description.includes(searchTerms.normalizedQuery)) {
    score += 8;
  }

  if (section.includes(searchTerms.normalizedQuery)) {
    score += 4;
  }

  if (href.includes(searchTerms.normalizedQuery)) {
    score += 4;
  }

  for (const term of searchTerms.terms) {
    if (title.includes(term)) {
      score += 5;
    }

    if (keywords.some((keyword) => keyword.includes(term))) {
      score += 3;
    }

    if (description.includes(term)) {
      score += 2;
    }

    if (section.includes(term)) {
      score += 1.5;
    }

    if (href.includes(term)) {
      score += 1.5;
    }
  }

  return Number(score.toFixed(3));
}

export function searchSiteDocuments(
  query: string,
  documents: StaticSiteSearchDocument[],
  limit = 12,
) {
  const searchTerms = getSearchTerms(query);

  if (!searchTerms.normalizedQuery) {
    return [];
  }

  return documents
    .map((document) => ({
      ...document,
      score: scoreSearchRecord(searchTerms, document),
    }))
    .filter((document) => document.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}
