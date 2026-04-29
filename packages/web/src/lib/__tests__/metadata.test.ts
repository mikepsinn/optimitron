import { describe, expect, it } from "vitest";
import {
  getRootLayoutMetadata,
  getRootSiteMetadata,
  getSiteMetadata,
  getRouteMetadata,
} from "@/lib/metadata";
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
    expect(metadata.twitter?.images).toEqual([
      "/site-assets/treaty/treaty-og-1200x630.png",
    ]);
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("builds root metadata from the selected site config", () => {
    const treatyMetadata = getRootSiteMetadata(
      getSiteConfig("onePercentTreaty"),
    );
    const optimitronMetadata = getRootSiteMetadata(getSiteConfig("optimitron"));

    expect(treatyMetadata.title).toBe("1% Treaty");
    expect(treatyMetadata.openGraph?.siteName).toBe("1% Treaty");
    expect(treatyMetadata.twitter?.title).toBe("1% Treaty");
    expect(optimitronMetadata.title).toContain("Optimitron");
    expect(optimitronMetadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/og-image.jpg" }),
    ]);
  });

  it("builds root layout metadata with isolated manifest, icons, and social image", () => {
    const metadata = getRootLayoutMetadata(
      getSiteConfig("trialAbundanceSurvey"),
    );

    expect(metadata.manifest).toBe(
      "/manifest.webmanifest?site=trialAbundanceSurvey",
    );
    expect(metadata.icons).toEqual(
      expect.objectContaining({
        shortcut:
          "/site-assets/survey/favicon.ico",
        apple:
          "/site-assets/survey/apple-touch-icon.png",
      }),
    );
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "/site-assets/survey/survey-og-1200x630.png",
      }),
    ]);
    expect(metadata.twitter?.images).toEqual([
      "/site-assets/survey/survey-og-1200x630.png",
    ]);
  });
});
