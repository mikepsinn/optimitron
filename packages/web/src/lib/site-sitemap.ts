import type { MetadataRoute } from "next";
import {
  getAllConditions,
  getAllTreatments,
} from "@optimitron/data/datasets/medical";
import { ROUTES } from "@/lib/routes";
import { isSiteRouteAllowed, type SiteConfig } from "@/lib/site";
import { getAgentReadableSitemapRoutes } from "@/lib/agent-readable/agent-sitemap";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

interface SiteSitemapRoute {
  changeFrequency: ChangeFrequency;
  path: string;
  priority: number;
}

const STATIC_SITEMAP_ROUTES: SiteSitemapRoute[] = [
  { path: ROUTES.home, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.treaty, priority: 0.95, changeFrequency: "weekly" },
  { path: ROUTES.court, priority: 0.85, changeFrequency: "weekly" },
  {
    path: ROUTES.humanityVGovernment,
    priority: 0.9,
    changeFrequency: "weekly",
  },
  { path: ROUTES.vote, priority: 0.95, changeFrequency: "daily" },
  { path: ROUTES.questions, priority: 0.75, changeFrequency: "monthly" },
  { path: ROUTES.donate, priority: 0.9, changeFrequency: "weekly" },
  { path: ROUTES.employees, priority: 0.8, changeFrequency: "daily" },
  { path: ROUTES.survey, priority: 0.95, changeFrequency: "weekly" },
  { path: ROUTES.love, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.poster, priority: 0.75, changeFrequency: "weekly" },
  { path: ROUTES.organizations, priority: 0.75, changeFrequency: "weekly" },
  { path: ROUTES.impact, priority: 0.75, changeFrequency: "weekly" },
  { path: ROUTES.join, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.feedback, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.signatories, priority: 0.65, changeFrequency: "weekly" },
  { path: ROUTES.people, priority: 0.65, changeFrequency: "weekly" },
  { path: ROUTES.plaintiffs, priority: 0.75, changeFrequency: "weekly" },
  { path: ROUTES.governments, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.declaration, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.conditions, priority: 0.9, changeFrequency: "weekly" },
  { path: ROUTES.treatments, priority: 0.9, changeFrequency: "weekly" },
  { path: ROUTES.dfda, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.dih, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.wishocracy, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.prize, priority: 0.9, changeFrequency: "daily" },
  { path: ROUTES.scoreboard, priority: 0.9, changeFrequency: "daily" },
  { path: ROUTES.referendum, priority: 0.8, changeFrequency: "daily" },
  { path: ROUTES.iab, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.video, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.demo, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.opg, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.obg, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.dividend, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.efficiency, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.governmentSize, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.legislation, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.agencies, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.alignment, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.dgao, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.dtreasury, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.dtreasuryDfed, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dtreasuryDirs, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dtreasuryDssa, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.ddod, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dcensus, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.wishonia, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.moronia, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.about, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.tools, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.contribute, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.fund, priority: 0.6, changeFrequency: "weekly" },
];

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldIncludeStaticRoute(site: SiteConfig, path: string) {
  if (!isSiteRouteAllowed(site, path)) {
    return false;
  }

  if (path === ROUTES.home || site.sitemap.includeAllStaticRoutes) {
    return true;
  }

  if (matchesAnyPrefix(path, site.routePolicy.canonicalPrefixes)) {
    return true;
  }

  return Boolean(
    site.sitemap.includePublicRoutes &&
      matchesAnyPrefix(path, site.routePolicy.publicPrefixes),
  );
}

function makeEntry(
  site: SiteConfig,
  route: SiteSitemapRoute,
  lastModified: Date,
): SitemapEntry {
  const path = getCanonicalSitemapPath(site, route.path);
  return {
    url: `${site.canonicalOrigin}${path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  };
}

function getCanonicalSitemapPath(site: SiteConfig, path: string) {
  if (site.key !== "dfda") {
    return path;
  }

  if (path === ROUTES.conditions || path.startsWith(`${ROUTES.conditions}/`)) {
    return path.replace(ROUTES.conditions, "/conditions");
  }

  if (path === ROUTES.treatments || path.startsWith(`${ROUTES.treatments}/`)) {
    return path.replace(ROUTES.treatments, "/treatments");
  }

  return path;
}

function dynamicMedicalRoutes(site: SiteConfig): SiteSitemapRoute[] {
  const groups = site.sitemap.dynamicRouteGroups ?? [];
  const routes: SiteSitemapRoute[] = [];

  if (groups.includes("conditions")) {
    routes.push(
      ...getAllConditions().map((condition) => ({
        path: `${ROUTES.conditions}/${condition.slug}`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      })),
    );
  }

  if (groups.includes("treatments")) {
    routes.push(
      ...getAllTreatments().map((treatment) => ({
        path: `${ROUTES.treatments}/${treatment.slug}`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      })),
    );
  }

  if (groups.includes("conditionTreatments")) {
    routes.push(
      ...getAllTreatments().flatMap((treatment) =>
        treatment.conditions.map((condition) => ({
          path: `${ROUTES.conditions}/${condition.conditionSlug}/treatments/${treatment.slug}`,
          priority: 0.7,
          changeFrequency: "weekly" as const,
        })),
      ),
    );
  }

  return routes.filter((route) => isSiteRouteAllowed(site, route.path));
}

export function getSitemapForSite(
  site: SiteConfig,
  lastModified = new Date(),
): MetadataRoute.Sitemap {
  if (site.sitemap.landingPageOnly) {
    return [makeEntry(site, STATIC_SITEMAP_ROUTES[0], lastModified)];
  }

  const routesByPath = new Map<string, SiteSitemapRoute>();
  for (const route of STATIC_SITEMAP_ROUTES) {
    if (shouldIncludeStaticRoute(site, route.path)) {
      routesByPath.set(route.path, route);
    }
  }

  for (const route of dynamicMedicalRoutes(site)) {
    routesByPath.set(route.path, route);
  }

  for (const route of getAgentReadableSitemapRoutes(site)) {
    routesByPath.set(route.path, route);
  }

  return [...routesByPath.values()].map((route) =>
    makeEntry(site, route, lastModified),
  );
}
