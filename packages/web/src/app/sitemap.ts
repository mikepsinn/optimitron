import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSiteFromHost } from "@/lib/site";
import { getSitemapForSite } from "@/lib/site-sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  return getSitemapForSite(site);
}
