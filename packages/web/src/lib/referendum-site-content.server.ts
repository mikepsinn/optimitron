import { notFound } from "next/navigation";
import {
  getOptionalReferendumSiteContent,
  type ReferendumSiteContent,
} from "@/content/referendum-sites";
import type { SiteConfig } from "@/lib/site";

export function requireReferendumSiteContent(
  site: SiteConfig,
): ReferendumSiteContent {
  const content = getOptionalReferendumSiteContent(site.contentKey);
  if (!content) {
    notFound();
  }

  return content;
}
