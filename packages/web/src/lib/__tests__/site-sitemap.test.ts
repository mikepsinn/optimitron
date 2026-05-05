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
  it("keeps treaty sitemaps focused on treaty routes", () => {
    const paths = pathsFor("onePercentTreaty");

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        ROUTES.signatories,
        ROUTES.treaty,
        ROUTES.vote,
        ROUTES.why,
      ]),
    );
    expect(paths).not.toContain(ROUTES.campaign);
    expect(paths).not.toContain(ROUTES.reasoning);
    expect(paths).not.toContain(ROUTES.scoreboard);
    expect(paths).not.toContain(`${ROUTES.agencies}/dfda/conditions`);
  });

  it("keeps the neutral survey sitemap neutral and small", () => {
    const paths = pathsFor("trialAbundanceSurvey");

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        ROUTES.survey,
        ROUTES.vote,
        ROUTES.organizations,
      ]),
    );
    expect(paths).not.toContain(ROUTES.why);
    expect(paths).not.toContain(ROUTES.governments);
    expect(paths.length).toBeLessThanOrEqual(5);
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
  });
});
