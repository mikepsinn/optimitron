import { describe, expect, it } from "vitest";

import { ROUTES, SHOW_DONATE_LINKS } from "../routes";
import { getSiteConfig } from "../site";
import {
  scoreSearchRecord,
  searchSiteDocuments,
  searchStaticSiteDocuments,
  staticSiteSearchDocuments,
} from "../site-search";

describe("site search helpers", () => {
  it("keeps static search documents deduplicated by href", () => {
    const hrefs = staticSiteSearchDocuments.map((document) => document.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("finds the government size page from a direct query", () => {
    const results = searchStaticSiteDocuments("government size");

    expect(results.map((result) => result.href)).toContain(
      ROUTES.governmentSize,
    );
  });

  it("scopes static page results to the War on Disease site", () => {
    const results = searchStaticSiteDocuments("scoreboard game prize", {
      site: getSiteConfig("warOnDisease"),
    });
    const hrefs = results.map((result) => result.href);

    expect(hrefs).not.toContain(ROUTES.scoreboard);
    expect(hrefs).not.toContain(ROUTES.game);
    expect(hrefs).not.toContain(ROUTES.prize);
  });

  it("keeps War on Disease nav pages searchable", () => {
    const results = searchStaticSiteDocuments("tasks", {
      site: getSiteConfig("warOnDisease"),
    });

    expect(results.map((result) => result.href)).toContain(ROUTES.tasks);
  });

  it("keeps the obvious vote destination searchable on Optimitron", () => {
    const results = searchStaticSiteDocuments("vote", {
      site: getSiteConfig("optimitron"),
    });

    expect(results[0]?.href).toBe(ROUTES.vote);
  });

  it("includes campaign footer destinations in variant search", () => {
    const results = searchStaticSiteDocuments("feedback", {
      site: getSiteConfig("warOnDisease"),
    });

    expect(results[0]?.href).toBe(ROUTES.feedback);
  });

  it.each(["optimitron", "warOnDisease"] as const)(
    "lists the donate destination in %s search only while donate links are shown",
    (siteKey) => {
      const results = searchStaticSiteDocuments("donate", {
        site: getSiteConfig(siteKey),
      });

      expect(
        results.map((result) => result.href).includes(ROUTES.donate),
      ).toBe(SHOW_DONATE_LINKS);
    },
  );

  it("finds the Earth Repair Manual by its new name", () => {
    const results = searchStaticSiteDocuments("earth repair manual", {
      site: getSiteConfig("optimitron"),
    });

    expect(results[0]?.title).toBe("Earth Repair Manual");
  });

  it("prioritizes direct title matches over generic descriptions", () => {
    const titleMatch = scoreSearchRecord("tasks", {
      title: "Tasks",
      description: "Claim what you can do and track the rest.",
      href: ROUTES.tasks,
      section: "Take Action",
    });
    const weakMatch = scoreSearchRecord("tasks", {
      title: "Feedback",
      description: "Background page that mentions tasks once in passing.",
      href: ROUTES.feedback,
      section: "Start Here",
    });

    expect(titleMatch).toBeGreaterThan(weakMatch);
  });

  it("returns ranked page suggestions without a server search", () => {
    const results = searchSiteDocuments("treaty", staticSiteSearchDocuments, 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results[0]?.href).toBe(ROUTES.treaty);
    expect(results.every((result) => result.score > 0)).toBe(true);
  });
});
