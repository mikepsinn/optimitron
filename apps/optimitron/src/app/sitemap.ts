import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicDetailSitemapEntries } from "@/lib/public-detail-sitemap.server";
import { getSiteFromHeaders } from "@/lib/site";
import { getSitemapForSite } from "@/lib/site-sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const [staticEntries, publicDetailEntries] = await Promise.all([
    Promise.resolve(getSitemapForSite(site)),
    getPublicDetailSitemapEntries(site),
  ]);

  return [...staticEntries, ...publicDetailEntries];
}
