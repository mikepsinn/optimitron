import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { getSiteMetadata } from "@/lib/metadata";
import { getSiteFromHost } from "@/lib/site";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);
  return getSiteMetadata(site, content.metadata.impact, "/impact");
}

export default async function ImpactPage() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);

  redirect(content.impactUrl);
}
