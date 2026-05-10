import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { OrgStatus } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { getPersonHref } from "@/lib/person-href";
import { getOrganizationSurveyPath, getTaskPath, ROUTES } from "@/lib/routes";
import { isSiteRouteAllowed, type SiteConfig } from "@/lib/site";

const PUBLIC_DETAIL_SITEMAP_LIMIT = 500;
const PUBLIC_DETAIL_SITEMAP_REVALIDATE_SECONDS = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function makeEntry(
  site: SiteConfig,
  path: string,
  lastModified: Date,
  priority: number,
): SitemapEntry {
  const origin = site.canonicalOrigin.replace(/\/+$/, "");
  return {
    url: `${origin}${path.startsWith("/") ? path : `/${path}`}`,
    lastModified,
    changeFrequency: "daily",
    priority,
  };
}

const getCachedPublicDetailSitemapRows = unstable_cache(
  async () => {
    const [organizations, people, tasks] = await Promise.all([
      prisma.organization.findMany({
        where: { deletedAt: null, status: OrgStatus.APPROVED },
        orderBy: [{ updatedAt: "desc" }],
        select: { slug: true, updatedAt: true },
        take: PUBLIC_DETAIL_SITEMAP_LIMIT,
      }),
      prisma.person.findMany({
        where: {
          deletedAt: null,
          OR: [
            { isPublic: true },
            { assignedTasks: { some: { deletedAt: null, isPublic: true } } },
          ],
        },
        orderBy: [{ updatedAt: "desc" }],
        select: { handle: true, id: true, updatedAt: true },
        take: PUBLIC_DETAIL_SITEMAP_LIMIT,
      }),
      prisma.task.findMany({
        where: { deletedAt: null, isPublic: true },
        orderBy: [{ updatedAt: "desc" }],
        select: { id: true, updatedAt: true },
        take: PUBLIC_DETAIL_SITEMAP_LIMIT,
      }),
    ]);

    return { organizations, people, tasks };
  },
  ["public-detail-sitemap"],
  { revalidate: PUBLIC_DETAIL_SITEMAP_REVALIDATE_SECONDS },
);

export async function getPublicDetailSitemapEntries(
  site: SiteConfig,
): Promise<SitemapEntry[]> {
  if (site.sitemap.landingPageOnly) {
    return [];
  }

  const includePeople = isSiteRouteAllowed(site, ROUTES.people);
  const includeOrganizations = Boolean(site.primaryReferendumSlug) &&
    isSiteRouteAllowed(site, ROUTES.survey);
  const includeTasks = isSiteRouteAllowed(site, ROUTES.tasks);

  if (!includeOrganizations && !includePeople && !includeTasks) {
    return [];
  }

  const { organizations, people, tasks } =
    await getCachedPublicDetailSitemapRows();

  return [
    ...(includeOrganizations
      ? organizations.map((organization) =>
          makeEntry(
            site,
            getOrganizationSurveyPath(organization.slug),
            organization.updatedAt,
            0.65,
          ),
        )
      : []),
    ...(includePeople
      ? people.map((person) =>
          makeEntry(site, getPersonHref(person), person.updatedAt, 0.55),
        )
      : []),
    ...(includeTasks
      ? tasks.map((task) =>
          makeEntry(site, getTaskPath(task.id), task.updatedAt, 0.6),
        )
      : []),
  ];
}
