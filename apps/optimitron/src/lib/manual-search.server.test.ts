import { describe, expect, it } from "vitest";
import {
  correctTranscript,
  formatManualEntryForUpload,
  searchManualContent,
  type ManualSearchEntry,
} from "./manual-search.server";

const sampleIndex: ManualSearchEntry[] = [
  {
    title: "A 1% Treaty",
    url: "/knowledge/solution/1-percent-treaty.html",
    description: "Redirect 1% of military spending to pragmatic clinical trials.",
    sections: ["Funding", "Why It Works"],
    tags: ["1-percent-treaty", "clinical-trials"],
    text: "The treaty redirects military spending into pragmatic clinical trials and public-health capacity.",
  },
  {
    title: "Wishocracy",
    url: "/knowledge/solution/wishocracy.html",
    description: "Pairwise allocation system for public budgets.",
    sections: ["Pairwise Slider Allocation", "Task Tree"],
    tags: ["wishocracy", "allocation"],
    text: "Wishocracy lets people split public funding with pairwise sliders and aggregate the results.",
  },
];

describe("manual search helpers", () => {
  it("corrects common transcript errors before retrieval", () => {
    expect(correctTranscript("tell me about wish own ya and optimitran")).toBe(
      "tell me about Wishonia and Optimitron",
    );
  });

  it("finds relevant chapters using corrected tokens and query expansions", () => {
    const result = searchManualContent(sampleIndex, "one percent treaty funding");

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.entry.title).toBe("A 1% Treaty");
    expect(result.context).toContain("Redirect 1% of military spending");
    expect(result.context).toContain(
      "Source: https://manual.warondisease.org/knowledge/solution/1-percent-treaty.html",
    );
  });

  it("serializes search-index entries into a structured upload document", () => {
    const formatted = formatManualEntryForUpload(sampleIndex[1]!);

    expect(formatted).toContain("# Wishocracy");
    expect(formatted).toContain(
      "URL: https://manual.warondisease.org/knowledge/solution/wishocracy.html",
    );
    expect(formatted).toContain("Sections: Pairwise Slider Allocation, Task Tree");
    expect(formatted).toContain("Tags: wishocracy, allocation");
  });
});
