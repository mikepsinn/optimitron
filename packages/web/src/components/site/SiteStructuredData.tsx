import type { SiteConfig } from "@/lib/site";
import { buildSiteStructuredData } from "@/lib/site-structured-data";

export function SiteStructuredData({ site }: { site: SiteConfig }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildSiteStructuredData(site)),
      }}
    />
  );
}
