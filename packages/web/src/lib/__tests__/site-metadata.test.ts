import { describe, expect, it } from "vitest";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { getSiteMetadata } from "@/lib/metadata";
import { getSiteConfig } from "@/lib/site";

describe("getSiteMetadata", () => {
  it("uses microsite branding for referendum-site pages", () => {
    const site = getSiteConfig("onePercentTreaty");
    const content = getReferendumSiteContent(site.contentKey);

    const metadata = getSiteMetadata(site, content.metadata.treaty);

    expect(metadata).toMatchObject({
      title: "Treaty — 1% Treaty",
      description: content.metadata.treaty.description,
    });
    expect(metadata.metadataBase?.toString()).toBe("https://1percenttreaty.org/");
    expect(metadata.openGraph).toMatchObject({
      title: "Treaty — 1% Treaty",
      description: content.metadata.treaty.description,
      siteName: "1% Treaty",
    });
  });
});
