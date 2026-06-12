import { describe, expect, it } from "vitest";

import { ROUTES } from "../routes";
import {
  scoreSearchRecord,
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

    expect(results.map((result) => result.href)).toContain(ROUTES.governmentSize);
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
});
