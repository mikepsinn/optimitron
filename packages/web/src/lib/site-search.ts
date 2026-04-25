import {
  ROUTES,
  navSections,
  type NavItem,
} from "@/lib/routes";

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

function dedupeByHref(documents: StaticSiteSearchDocument[]) {
  const seen = new Set<string>();

  return documents.filter((document) => {
    if (seen.has(document.href)) {
      return false;
    }

    seen.add(document.href);
    return true;
  });
}

function buildDocumentFromNavItem(section: string, item: NavItem): StaticSiteSearchDocument {
  return {
    description: item.tagline ?? item.description,
    external: item.external,
    href: item.href,
    section,
    title: item.label,
  };
}

const extraStaticDocuments: StaticSiteSearchDocument[] = [
  {
    href: ROUTES.home,
    title: "Optimitron",
    description:
      "Landing page for the Earth Optimization Game, the 1% Treaty, the prize mechanics, and the core argument for fixing public systems with evidence.",
    section: "Primary",
    keywords: ["landing", "home", "earth optimization game", "planetary debugging"],
  },
  {
    href: ROUTES.developers,
    title: "Optimitron MCP",
    description:
      "Connect AI agents to the live Optimitron task graph so they can take the highest-value action to optimize Earth.",
    section: "Developer Tools",
    keywords: ["api", "oauth", "mcp", "developers", "integration", "agents", "tasks"],
  },
];

export const staticSiteSearchDocuments: StaticSiteSearchDocument[] = dedupeByHref([
  ...extraStaticDocuments,
  ...navSections.flatMap((section) =>
    section.items.map((item) => buildDocumentFromNavItem(section.label, item)),
  ),
]);

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
  const section = (record.section ?? "").toLowerCase();
  const keywords = record.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];

  let score = 0;

  if (title.includes(searchTerms.normalizedQuery)) {
    score += 14;
  }

  if (keywords.some((keyword) => keyword.includes(searchTerms.normalizedQuery))) {
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

export function searchStaticSiteDocuments(
  query: string,
  options?: {
    limit?: number;
  },
) {
  const searchTerms = getSearchTerms(query);
  const limit = options?.limit ?? 12;

  if (!searchTerms.normalizedQuery) {
    return [];
  }

  return staticSiteSearchDocuments
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
