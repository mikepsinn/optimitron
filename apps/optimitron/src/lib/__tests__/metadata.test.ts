import { describe, expect, it } from "vitest";
import {
  getRootSiteMetadata,
  getSiteMetadata,
  getRouteMetadata,
} from "@/lib/metadata";
import { feedbackLink } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site";

describe("metadata helpers", () => {
  it("adds a canonical path for route metadata", () => {
    const metadata = getRouteMetadata(feedbackLink);

    expect(metadata.title).toBe("Feedback");
    expect(metadata.alternates?.canonical).toBe("/feedback");
    expect(metadata.openGraph?.title).toBe("Feedback");
  });

  it("uses NavItem social preview config for route OG and Twitter images", () => {
    const metadata = getRouteMetadata({
      ...feedbackLink,
      socialPreview: {
        title: "You May Be Owed $2.74 Million",
        description: "Render your verdict.",
        image: {
          url: "/humanity-v-government/opengraph-image",
          width: 1200,
          height: 630,
        },
        blackWhiteTextOgImage: {
          eyebrow: "Humanity v. Government",
          primaryLines: ["You May Be Owed", "$2.74 Million"],
          footer: "WarOnDisease.org",
        },
      },
    });

    expect(metadata.openGraph?.title).toBe("You May Be Owed $2.74 Million");
    expect(metadata.openGraph?.description).toBe("Render your verdict.");
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/humanity-v-government/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Humanity v. Government. You May Be Owed $2.74 Million. WarOnDisease.org.",
      },
    ]);
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "You May Be Owed $2.74 Million",
      description: "Render your verdict.",
      images: ["/humanity-v-government/opengraph-image"],
    });
  });

  it("builds site metadata with host-specific canonicals", () => {
    const site = getSiteConfig("optimitron");
    const metadata = getSiteMetadata(
      site,
      {
        title: "Feedback",
        description: "Tell us what broke.",
      },
      "/feedback",
      { robots: { index: true, follow: true } },
    );

    expect(metadata.metadataBase?.toString()).toBe("https://optimitron.com/");
    expect(metadata.alternates?.canonical).toBe("/feedback");
    expect(metadata.openGraph?.siteName).toBe("Optimitron");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("builds root metadata from the site config", () => {
    const optimitronMetadata = getRootSiteMetadata(getSiteConfig("optimitron"));

    expect(optimitronMetadata.title).toEqual({
      absolute: expect.stringContaining("Optimitron"),
    });
    expect(optimitronMetadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/og-image.jpg" }),
    ]);
  });
});
