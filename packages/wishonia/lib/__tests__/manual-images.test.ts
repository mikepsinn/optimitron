import { describe, expect, it } from "vitest";
import {
  findRelevantImage,
  findTopImageCandidates,
  prepareImageIndex,
} from "../manual-images";
import type { ScoredResult } from "../search";

const results: ScoredResult[] = [
  {
    score: 5,
    entry: {
      title: "A 1% Treaty",
      url: "/solution/1-percent-treaty.html",
    },
  },
];

describe("manual-images", () => {
  it("filters unusable images and prepares search tokens", () => {
    const prepared = prepareImageIndex([
      { path: "cover.jpg", imageType: "cover", width: 1200, keywords: ["war", "disease"] },
      { path: "favicon.png", imageType: "icon", width: 512, keywords: ["icon"] },
      { path: "tiny.png", imageType: "other", width: 200, keywords: ["small"] },
    ]);

    expect(prepared).toHaveLength(1);
    expect(prepared[0]?.searchTokens).toContain("disease");
  });

  it("ranks treaty images above weak matches", () => {
    const prepared = prepareImageIndex([
      {
        path: "assets/solution/1-percent-treaty-overview.png",
        filename: "1-percent-treaty-overview.png",
        imageType: "infographic",
        width: 1400,
        title: "1% Treaty overview",
        keywords: ["1% treaty", "military spending", "clinical trials"],
      },
      {
        path: "assets/misc/random-cover.png",
        filename: "random-cover.png",
        imageType: "cover",
        width: 1400,
        title: "Unrelated cover",
        keywords: ["cover", "retro"],
      },
    ]);

    const ranked = findTopImageCandidates(prepared, "What is the 1% Treaty?", results, 2);

    expect(ranked[0]?.path).toBe("assets/solution/1-percent-treaty-overview.png");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });

  it("returns a relevant image only when the score is strong enough", () => {
    const prepared = prepareImageIndex([
      {
        path: "assets/solution/1-percent-treaty-overview.png",
        imageType: "chart",
        width: 1400,
        keywords: ["1% treaty", "clinical trials"],
      },
    ]);

    expect(findRelevantImage(prepared, "What is the 1% Treaty?", results)?.path).toBe(
      "assets/solution/1-percent-treaty-overview.png"
    );
    expect(findRelevantImage(prepared, "Tell me about astronomy", [])).toBeNull();
  });
});
