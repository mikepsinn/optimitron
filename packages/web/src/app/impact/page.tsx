import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteMetadata } from "@/lib/metadata";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getSiteFromHeaders } from "@/lib/site";
import { ROUTES } from "@/lib/routes";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);
  return getSiteMetadata(site, content.metadata.impact, ROUTES.impact);
}

export default async function ImpactPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const content = requireReferendumSiteContent(site);

  redirect(content.impactUrl);
}
