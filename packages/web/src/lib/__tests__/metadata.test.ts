import { describe, expect, it } from "vitest";
import {
  getRootLayoutMetadata,
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
    const site = getSiteConfig("warOnDisease");
    const metadata = getSiteMetadata(
      site,
      {
        title: "Treaty — 1% Treaty",
        description: "The treaty text.",
      },
      "/treaty",
      { robots: { index: true, follow: true } },
    );

    expect(metadata.metadataBase?.toString()).toBe("https://warondisease.org/");
    expect(metadata.alternates?.canonical).toBe("/treaty");
    expect(metadata.openGraph?.siteName).toBe(
      "International Campaign to End War and Disease",
    );
    expect(metadata.twitter?.images).toEqual([
      "/api/og/route?path=%2Ftreaty",
    ]);
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("builds root metadata from the selected site config", () => {
    const treatyMetadata = getRootSiteMetadata(
      getSiteConfig("warOnDisease"),
    );
    const optimitronMetadata = getRootSiteMetadata(getSiteConfig("optimitron"));

    expect(treatyMetadata.title).toEqual({
      absolute: "International Campaign to End War and Disease",
    });
    expect(treatyMetadata.openGraph?.siteName).toBe(
      "International Campaign to End War and Disease",
    );
    expect(treatyMetadata.twitter?.title).toBe(
      "International Campaign to End War and Disease",
    );
    expect(optimitronMetadata.title).toEqual({
      absolute: expect.stringContaining("Optimitron"),
    });
    expect(optimitronMetadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "/og-image.jpg" }),
    ]);
  });

  it("builds root layout metadata with isolated manifest, icons, and social image", () => {
    const metadata = getRootLayoutMetadata(
      getSiteConfig("warOnDisease"),
    );

    expect(metadata.manifest).toBe(
      "/manifest.webmanifest?site=warOnDisease",
    );
    expect(metadata.title).toEqual({
      default: "International Campaign to End War and Disease",
      template: "%s | International Campaign to End War and Disease",
    });
    expect(metadata.icons).toEqual(
      expect.objectContaining({
        shortcut: "/site-assets/warondisease/warondisease-favicon.png",
        apple:
          "/site-assets/warondisease/warondisease-apple-touch-icon.png",
      }),
    );
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
      }),
    ]);
    expect(metadata.twitter?.images).toEqual([
      "/site-assets/warondisease/war-on-disease-og-1200x630.png",
    ]);
  });
});
