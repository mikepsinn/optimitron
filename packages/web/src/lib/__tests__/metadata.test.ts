import { describe, expect, it } from "vitest";
import { getSiteMetadata, getRouteMetadata } from "@/lib/metadata";
import { aboutLink } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site";

describe("metadata helpers", () => {
  it("adds a canonical path for route metadata", () => {
    const metadata = getRouteMetadata(aboutLink);

    expect(metadata.alternates?.canonical).toBe("/about");
    expect(metadata.openGraph?.title).toBe("About | Optimitron");
  });

  it("builds site metadata with host-specific canonicals", () => {
    const site = getSiteConfig("onePercentTreaty");
    const metadata = getSiteMetadata(
      site,
      {
        title: "Why — 1% Treaty",
        description: "Why the treaty exists.",
      },
      "/why",
      { robots: { index: true, follow: true } },
    );

    expect(metadata.metadataBase?.toString()).toBe("https://1percenttreaty.org/");
    expect(metadata.alternates?.canonical).toBe("/why");
    expect(metadata.openGraph?.siteName).toBe("1% Treaty");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
