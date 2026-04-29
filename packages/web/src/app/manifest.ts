import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getSiteManifest } from "@/lib/site-assets";
import { getSiteFromHost } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  return getSiteManifest(site);
}
