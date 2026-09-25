import { describe, expect, it } from "vitest";
import { isRedirectOnlyRoutePath } from "@/lib/redirect-review";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site";
import { getSitemapForSite } from "@/lib/site-sitemap";

function sitemapPaths() {
  return getSitemapForSite(getSiteConfig("optimitron")).map(
    (entry) => new URL(entry.url).pathname,
  );
}

describe("site sitemap routing", () => {
  // The campaign pages moved to warondisease.org. A sitemap entry that only
  // redirects tells search engines the wrong canonical page.
  it("lists no path that only redirects", () => {
    expect(sitemapPaths().filter(isRedirectOnlyRoutePath)).toEqual([]);
  });

  it("lists the agent-readable files that only this app serves", () => {
    expect(sitemapPaths()).toEqual(
      expect.arrayContaining([
        "/llms.txt",
        "/llms-full.txt",
        "/treaty.md",
        "/faq.md",
        "/api/agent/manifest",
        "/api/agent/campaign-state",
        "/api/agent/signatories",
        "/api/agent/parameters",
      ]),
    );
  });

  it("keeps the homepage and preserved services catalog in the Optimitron sitemap", () => {
    const paths = sitemapPaths();

    expect(paths).toContain(ROUTES.home);
    expect(paths).toContain(ROUTES.services);
  });
});
