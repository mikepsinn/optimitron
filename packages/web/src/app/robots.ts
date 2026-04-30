import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSiteRobots } from "@/lib/site-assets";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return getSiteRobots(site);
}
