import { describe, expect, it } from "vitest";
import {
  extractReadMoreLinks,
  mergeSourceLinks,
  normalizeManualUrl,
  sourceLinksFromSearchResults,
} from "../source-links";
import type { ScoredResult } from "../search";

describe("source-links", () => {
  it("strips the read more section and normalizes links", () => {
    const result = extractReadMoreLinks(
      "Short answer.\n\nRead more: [Treaty](/solution/1-percent-treaty.html) [Impact](economics/impact.html)"
    );

    expect(result.cleanText).toBe("Short answer.");
    expect(result.links).toEqual([
      {
        title: "Treaty",
        url: "https://manual.warondisease.org/solution/1-percent-treaty.html",
      },
      {
        title: "Impact",
        url: "https://manual.warondisease.org/economics/impact.html",
      },
    ]);
  });

  it("merges model links with rag fallbacks without duplicates", () => {
    const merged = mergeSourceLinks(
      [{ title: "Treaty", url: "/solution/1-percent-treaty.html" }],
      [
        { title: "Treaty duplicate", url: "https://manual.warondisease.org/solution/1-percent-treaty.html" },
        { title: "Impact", url: "/economics/1-pct-treaty-impact.html" },
      ]
    );

    expect(merged).toEqual([
      {
        title: "Treaty",
        url: "https://manual.warondisease.org/solution/1-percent-treaty.html",
      },
      {
        title: "Impact",
        url: "https://manual.warondisease.org/economics/1-pct-treaty-impact.html",
      },
    ]);
  });

  it("derives fallback pills from rag search results", () => {
    const results: ScoredResult[] = [
      {
        score: 4,
        entry: {
          title: "A 1% Treaty",
          url: "/solution/1-percent-treaty.html",
        },
      },
      {
        score: 3,
        entry: {
          title: "Impact Analysis",
          url: "/economics/1-pct-treaty-impact.html",
        },
      },
    ];

    expect(sourceLinksFromSearchResults(results)).toEqual([
      {
        title: "A 1% Treaty",
        url: "https://manual.warondisease.org/solution/1-percent-treaty.html",
      },
      {
        title: "Impact Analysis",
        url: "https://manual.warondisease.org/economics/1-pct-treaty-impact.html",
      },
    ]);
  });

  it("normalizes manual urls consistently", () => {
    expect(normalizeManualUrl("/solution/treaty.html")).toBe(
      "https://manual.warondisease.org/solution/treaty.html"
    );
    expect(normalizeManualUrl("economics/impact.html")).toBe(
      "https://manual.warondisease.org/economics/impact.html"
    );
    expect(normalizeManualUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});
