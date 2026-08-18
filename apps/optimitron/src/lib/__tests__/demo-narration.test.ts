import { describe, expect, it } from "vitest";

import {
  getCanonicalNarrationManifestKey,
  getLegacyNarrationManifestKeys,
  getNarrationManifestLookupKeys,
  type NarrationManifest,
} from "../demo-narration";

describe("demo narration manifest helpers", () => {
  it("uses the segment id as the only canonical narration key", () => {
    expect(getCanonicalNarrationManifestKey("earth-optimization-game-brief")).toBe(
      "earth-optimization-game-brief",
    );
    expect(getNarrationManifestLookupKeys("earth-optimization-game-brief")).toEqual([
      "earth-optimization-game-brief",
    ]);
  });

  it("treats manifest entries outside the current segment set as legacy", () => {
    const manifest: NarrationManifest = {
      "earth-optimization-game-brief": {
        hash: "new",
        file: "earth-optimization-game-brief.mp3",
        generatedAt: "2026-03-31T03:20:45.971Z",
      },
      "pl-intro": {
        hash: "old",
        file: "pl-intro.mp3",
        generatedAt: "2026-03-30T07:14:33.860Z",
      },
      "custom-slide": {
        hash: "custom",
        file: "custom-slide.mp3",
        generatedAt: "2026-03-31T03:20:45.971Z",
      },
    };

    expect(
      getLegacyNarrationManifestKeys(manifest, [
        "earth-optimization-game-brief",
        "custom-slide",
      ]),
    ).toEqual(["pl-intro"]);
  });
});
