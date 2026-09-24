import { describe, expect, it } from "vitest";

import { ROUTES, SHOW_DONATE_LINKS, warOnDiseaseUrl } from "../routes";
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

  it("sends the obvious vote query to the War on Disease vote page", () => {
    const results = searchStaticSiteDocuments("vote");

    expect(results[0]?.href).toBe(warOnDiseaseUrl(ROUTES.vote));
  });

  it("lists the donate destination only while donate links are shown", () => {
    const results = searchStaticSiteDocuments("donate");

    expect(
      results.map((result) => result.href).includes(ROUTES.donate),
    ).toBe(SHOW_DONATE_LINKS);
  });

  it("finds the Earth Repair Manual by its new name", () => {
    const results = searchStaticSiteDocuments("earth repair manual");

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
    expect(results[0]?.href).toBe(warOnDiseaseUrl(ROUTES.treaty));
    expect(results.every((result) => result.score > 0)).toBe(true);
  });
});
