import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPersonHref } from "@/lib/person-href";
import { getTaskPath, ROUTES } from "@/lib/routes";
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
    const [people, tasks] = await Promise.all([
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

    return { people, tasks };
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
  const includeTasks = isSiteRouteAllowed(site, ROUTES.tasks);

  if (!includePeople && !includeTasks) {
    return [];
  }

  const { people, tasks } = await getCachedPublicDetailSitemapRows();

  return [
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
