import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { getSiteConfig } from "@/lib/site";
import { getSitemapForSite } from "@/lib/site-sitemap";

function pathsFor(siteKey: Parameters<typeof getSiteConfig>[0]) {
  const site = getSiteConfig(siteKey);
  return getSitemapForSite(site).map((entry) => {
    const url = new URL(entry.url);
    return url.pathname;
  });
}

describe("site sitemap routing", () => {
  it("keeps the campaign sitemap focused on campaign routes", () => {
    const paths = pathsFor("warOnDisease");

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        ROUTES.court,
        ROUTES.humanityVGovernment,
        ROUTES.signatories,
        ROUTES.treaty,
        ROUTES.vote,
        ROUTES.donate,
        ROUTES.employees,
        "/llms.txt",
        "/llms-full.txt",
        "/treaty.md",
        "/court.md",
        "/humanity-v-government.md",
        "/plaintiffs.md",
        "/faq",
        "/faq.md",
        "/api/agent/manifest",
        "/api/agent/campaign-state",
        "/api/agent/signatories",
        "/api/agent/plaintiffs",
        "/api/agent/parameters",
      ]),
    );
    expect(paths).not.toContain(ROUTES.reasoning);
    expect(paths).not.toContain(ROUTES.scoreboard);
  });

  it("adds DFDA medical index and detail routes to the DFDA sitemap", () => {
    const site = getSiteConfig("dfda");
    const sitemap = getSitemapForSite(site);
    const urls = sitemap.map((entry) => entry.url);
    const paths = urls.map((url) => new URL(url).pathname);

    expect(urls.every((url) => url.startsWith("https://dfda.earth/"))).toBe(
      true,
    );
    expect(paths).toContain("/conditions");
    expect(paths).toContain("/treatments");
    expect(paths).not.toContain(`${ROUTES.agencies}/dfda/conditions`);
    expect(paths).not.toContain(`${ROUTES.agencies}/dfda/treatments`);
    expect(paths.some((path) => path.startsWith("/conditions/"))).toBe(true);
    expect(paths.some((path) => path.startsWith("/treatments/"))).toBe(true);
    expect(paths).not.toContain("/llms.txt");
    expect(paths).not.toContain("/api/agent/campaign-state");
  });
});
