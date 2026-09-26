import {
  fullManualPaperLink,
  ROUTES,
  SHOW_DONATE_LINKS,
  legacyNavLinks,
  navSections,
  routeReviewNavItems,
  type NavItem,
} from "@/lib/routes";
import {
  searchSiteDocuments,
  type StaticSiteSearchDocument,
} from "@/lib/site-search-ranking";

export {
  getSearchTerms,
  scoreSearchRecord,
  searchSiteDocuments,
  type SearchScorableRecord,
  type SearchTerms,
  type StaticSiteSearchDocument,
} from "@/lib/site-search-ranking";

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

function buildDocumentFromNavItem(
  section: string,
  item: NavItem,
): StaticSiteSearchDocument {
  return {
    description: item.tagline ?? item.description,
    emoji: item.emoji || undefined,
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
    emoji: "🏠",
    description:
      "Compare policy evidence and government spending. Inspect sources, assumptions, and proposed changes.",
    section: "Primary",
    keywords: [
      "landing",
      "home",
      "policy analysis",
      "budget comparisons",
    ],
  },
  {
    description: fullManualPaperLink.description,
    emoji: fullManualPaperLink.emoji,
    external: true,
    href: fullManualPaperLink.href,
    keywords: ["guide", "handbook", "instruction manual", "manual"],
    section: "Manual",
    title: "Earth Repair Manual",
  },
  {
    href: ROUTES.mcp,
    title: "Optimitron MCP",
    emoji: "🔌",
    description:
      "Connect AI agents to the live Optimitron task graph so they can take the highest-value action to optimize Earth.",
    section: "Developer Tools",
    keywords: [
      "api",
      "oauth",
      "mcp",
      "developers",
      "integration",
      "agents",
      "tasks",
    ],
  },
];

export const staticSiteSearchDocuments: StaticSiteSearchDocument[] =
  dedupeByHref([
    ...extraStaticDocuments,
    ...legacyNavLinks.map((item) => buildDocumentFromNavItem("Pages", item)),
    ...navSections.flatMap((section) =>
      section.items.map((item) =>
        buildDocumentFromNavItem(section.label, item),
      ),
    ),
    ...routeReviewNavItems
      .filter((item) => SHOW_DONATE_LINKS || item.href !== ROUTES.donate)
      .map((item) => buildDocumentFromNavItem("Pages", item)),
  ]);

export function searchStaticSiteDocuments(
  query: string,
  options?: {
    limit?: number;
  },
) {
  const limit = options?.limit ?? 12;

  return searchSiteDocuments(query, staticSiteSearchDocuments, limit);
}
