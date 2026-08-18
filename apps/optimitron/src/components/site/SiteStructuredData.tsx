import type { SiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";
import { JsonLdScript } from "./JsonLdScript";

export function SiteStructuredData({ site }: { site: SiteConfig }) {
  return <JsonLdScript data={buildSiteStructuredData(site)} />;
}
