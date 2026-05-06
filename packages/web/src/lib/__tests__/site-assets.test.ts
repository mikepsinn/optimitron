import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getManifestIconPath,
  getSiteIconPath,
  getSiteManifest,
  getSiteManifestPath,
  getSiteRobots,
  getSiteSocialImage,
  getSiteStaticAssetRedirectPath,
} from "@/lib/site-assets";
import { getSiteConfig } from "@/lib/site";

describe("site-specific SEO assets", () => {
  it("builds a per-site manifest instead of reusing the Optimitron public manifest", () => {
    const site = getSiteConfig("warOnDisease");
    const manifest = getSiteManifest(site);

    expect(manifest.name).toBe("International Campaign to End War and Disease");
    expect(manifest.short_name).toBe("IC2EWD");
    expect(manifest.description).toBe(site.rootMetadata.description);
    expect(manifest.theme_color).toBe(site.emailBranding.primaryColor);
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/site-assets/warondisease/warondisease-android-chrome-192x192.png",
          sizes: "192x192",
        }),
        expect.objectContaining({
          src: "/site-assets/warondisease/warondisease-android-chrome-512x512.png",
          sizes: "512x512",
        }),
      ]),
    );
    expect(JSON.stringify(manifest)).not.toContain("/icons/icon-192.png");
  });

  it("uses site-keyed manifest and icon paths in metadata", () => {
    const site = getSiteConfig("dfda");

    expect(getSiteManifestPath(site)).toBe("/manifest.webmanifest?site=dfda");
    expect(getSiteIconPath(site, 32)).toBe(
      "/site-assets/dfda/favicon-32x32.png",
    );
    expect(getManifestIconPath(site, 512)).toBe(
      "/site-assets/dfda/android-chrome-512x512.png",
    );
    expect(getSiteSocialImage(site)).toMatchObject({
      url: "/site-assets/dfda/dfda-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "DFDA — Decentralized FDA",
    });
  });

  it("emits robots data on the canonical host without indexing private account routes", () => {
    const site = getSiteConfig("warOnDisease");
    const robots = getSiteRobots(site);

    expect(robots.host).toBe("https://warondisease.org");
    expect(robots.sitemap).toEqual(["https://warondisease.org/sitemap.xml"]);
    expect(robots.rules).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: "/",
        disallow: expect.arrayContaining([
          "/api",
          "/auth",
          "/dashboard",
          "/profile",
          "/settings",
        ]),
      }),
    );
    expect(JSON.stringify(robots.rules)).not.toContain("/vote");
  });

  it("redirects legacy root asset paths to the active site's copied assets", () => {
    const surveySite = getSiteConfig("warOnDisease");

    expect(getSiteStaticAssetRedirectPath(surveySite, "/favicon.ico")).toBe(
      "/site-assets/warondisease/warondisease-favicon.png",
    );
    expect(getSiteStaticAssetRedirectPath(surveySite, "/manifest.json")).toBe(
      "/manifest.webmanifest?site=warOnDisease",
    );
    expect(getSiteStaticAssetRedirectPath(surveySite, "/og-image.jpg")).toBe(
      "/site-assets/warondisease/war-on-disease-og-1200x630.png",
    );
    expect(
      getSiteStaticAssetRedirectPath(
        getSiteConfig("optimitron"),
        "/favicon.ico",
      ),
    ).toBeNull();
  });

  it("keeps host-aware metadata routes dynamic", () => {
    const appDir = join(process.cwd(), "src/app");

    for (const relativePath of ["robots.ts", "manifest.ts"]) {
      const source = readFileSync(join(appDir, relativePath), "utf8");
      expect(source).toContain('dynamic = "force-dynamic"');
    }
  });

  it("lets middleware handle legacy root asset redirects", () => {
    const source = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

    expect(source).not.toContain("favicon.ico|");
    expect(source).not.toContain("manifest.json|");
    expect(source).not.toContain("twitter-image|");
  });

  it("points copied DIH-neobrutalist site assets at real files", () => {
    const publicDir = join(process.cwd(), "public");

    for (const siteKey of [
      "dfda",
      "dih",
      "warOnDisease",
    ] as const) {
      const site = getSiteConfig(siteKey);
      const paths = [
        site.assets.favicon,
        site.assets.icon32,
        site.assets.icon192,
        site.assets.icon512,
        site.assets.appleTouchIcon,
        site.rootMetadata.openGraphImage.url,
        site.rootMetadata.twitterImage,
      ];

      for (const assetPath of paths) {
        expect(assetPath).toContain("/site-assets/");
        expect(existsSync(join(publicDir, assetPath))).toBe(true);
      }
    }
  });
});
