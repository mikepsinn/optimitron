import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getSiteRobots,
  getSiteStaticAssetRedirectPath,
} from "@/lib/site-assets";
import { AI_CRAWLER_USER_AGENTS } from "@/lib/agent-readable/ai-crawler-detection";
import { getSiteConfig } from "@/lib/site";

describe("site SEO assets", () => {
  it("emits robots data on the canonical host without indexing private account routes", () => {
    const site = getSiteConfig("optimitron");
    const robots = getSiteRobots(site);
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];
    const defaultRule = rules.find((rule) => rule.userAgent === "*");

    expect(robots.host).toBe("https://optimitron.com");
    expect(robots.sitemap).toEqual(["https://optimitron.com/sitemap.xml"]);
    expect(defaultRule).toEqual(
      expect.objectContaining({
        userAgent: "*",
        allow: expect.arrayContaining(["/", "/api/agent/"]),
        disallow: expect.arrayContaining([
          "/api",
          "/auth",
          "/dashboard",
          "/profile",
          "/settings",
        ]),
      }),
    );
  });

  it("allows agent API discovery for search and user-triggered AI crawlers", () => {
    const robots = getSiteRobots(getSiteConfig("optimitron"));
    const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];

    for (const userAgent of [
      ...AI_CRAWLER_USER_AGENTS,
      "Googlebot",
    ]) {
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userAgent,
            allow: expect.arrayContaining(["/", "/api/agent/"]),
            disallow: expect.arrayContaining(["/api"]),
          }),
        ]),
      );
    }
  });

  it("redirects legacy root asset paths only when the site serves them elsewhere", () => {
    const site = getSiteConfig("optimitron");

    expect(getSiteStaticAssetRedirectPath(site, "/manifest.json")).toBe(
      "/manifest.webmanifest?site=optimitron",
    );
    expect(getSiteStaticAssetRedirectPath(site, "/favicon.ico")).toBeNull();
    expect(getSiteStaticAssetRedirectPath(site, "/og-image.jpg")).toBeNull();
  });

  it("lets middleware handle legacy root asset redirects", () => {
    const source = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");

    expect(source).not.toContain("favicon.ico|");
    expect(source).not.toContain("manifest.json|");
    expect(source).not.toContain("twitter-image|");
  });

  it("points site assets at real files", () => {
    const publicDir = join(process.cwd(), "public");
    const site = getSiteConfig("optimitron");
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
      expect(existsSync(join(publicDir, assetPath))).toBe(true);
    }
  });
});
