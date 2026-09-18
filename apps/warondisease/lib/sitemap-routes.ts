import { ROUTES } from "@optimitron/site-kit/lib/routes";
import type { SitemapRoute } from "@optimitron/site-kit/lib/sitemap-routes";

// Only canonical public pages owned by this app. Authentication, account,
// success, dynamic-record, and redirect routes do not belong in this list.
export const PUBLIC_CAMPAIGN_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.contact,
  ROUTES.developers,
  ROUTES.developersTools,
  ROUTES.donate,
  ROUTES.doorToDoor,
  ROUTES.employees,
  ROUTES.faq,
  ROUTES.feedback,
  ROUTES.fixAi,
  ROUTES.foundations,
  ROUTES.institutes,
  ROUTES.join,
  ROUTES.joke,
  ROUTES.love,
  ROUTES.mcp,
  ROUTES.missions,
  ROUTES.poster,
  ROUTES.privacy,
  ROUTES.research,
  ROUTES.search,
  ROUTES.shirt,
  ROUTES.signatories,
  ROUTES.soldiers,
  ROUTES.surveyDemo,
  ROUTES.terms,
  ROUTES.thePlan,
  ROUTES.treaty,
  ROUTES.vote,
] as const;

export function getCampaignSitemapRoutes(): SitemapRoute[] {
  return PUBLIC_CAMPAIGN_ROUTES.map((path) => ({
    path,
    priority: path === "/" ? 1 : 0.7,
    changeFrequency: "weekly",
  }));
}
