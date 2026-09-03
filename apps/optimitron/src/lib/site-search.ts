import {
  fullManualPaperLink,
  ROUTES,
  SHOW_DONATE_LINKS,
  navSections,
  routeReviewNavItems,
  type NavItem,
} from "@/lib/routes";
import type { SiteConfig } from "@/lib/site";
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
      "Landing page for the Earth Optimization Game, the 1% Treaty, the prize mechanics, and the core argument for fixing public systems with evidence.",
    section: "Primary",
    keywords: [
      "landing",
      "home",
      "earth optimization game",
      "planetary debugging",
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
    ...navSections.flatMap((section) =>
      section.items.map((item) =>
        buildDocumentFromNavItem(section.label, item),
      ),
    ),
    ...routeReviewNavItems
      .filter((item) => SHOW_DONATE_LINKS || item.href !== ROUTES.donate)
      .map((item) => buildDocumentFromNavItem("Pages", item)),
  ]);

function buildHomeDocument(site: SiteConfig): StaticSiteSearchDocument {
  return {
    href: ROUTES.home,
    title: site.shortName,
    description: site.rootMetadata.description,
    emoji: "🏠",
    section: "Primary",
    keywords: site.rootMetadata.keywords,
  };
}

export function getStaticSiteSearchDocuments(site?: SiteConfig) {
  if (!site || site.key === "optimitron") {
    return staticSiteSearchDocuments;
  }

  return dedupeByHref([
    buildHomeDocument(site),
    ...extraStaticDocuments.filter(
      (document) => document.href === fullManualPaperLink.href,
    ),
    ...site.ui.nav.sections.flatMap((section) =>
      section.items.map((item) =>
        buildDocumentFromNavItem(section.label, item),
      ),
    ),
    ...site.ui.footer.columns.flatMap((column) =>
      column.items.map((item) => buildDocumentFromNavItem(column.title, item)),
    ),
  ]);
}

export function searchStaticSiteDocuments(
  query: string,
  options?: {
    limit?: number;
    site?: SiteConfig;
  },
) {
  const limit = options?.limit ?? 12;

  return searchSiteDocuments(
    query,
    getStaticSiteSearchDocuments(options?.site),
    limit,
  );
}
