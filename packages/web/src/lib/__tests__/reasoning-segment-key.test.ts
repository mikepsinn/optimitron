import { describe, expect, it } from "vitest";
import { buildLevelKeys, buildSegmentKey } from "../reasoning/segment-key";

describe("buildSegmentKey", () => {
  it("includes the actual runtime dimensions in the most-specific key", () => {
    expect(
      buildSegmentKey({
        localeKey: "en",
        hostKey: "example.org",
        organizationId: "org_123",
        relationshipBucket: "professional",
        referralSource: "whatsapp",
        device: "mobile",
        chainDepth: "deep",
        returningVsFirst: "returning",
        surface: "embed",
      }),
    ).toBe(
      "loc:en/host:example.org/org:org_123/bucket:professional/ref:whatsapp/dev:mobile/depth:deep/ret:returning/surf:embed",
    );
  });
});

describe("buildLevelKeys", () => {
  it("builds the hierarchy from GLOBAL through SEGMENT", () => {
    const levels = buildLevelKeys({
      localeKey: "en",
      hostKey: "example.org",
      organizationId: null,
      relationshipBucket: null,
      referralSource: null,
      device: null,
      chainDepth: "90s",
      returningVsFirst: "first",
      surface: "hosted",
    });

    expect(levels.map((l) => l.level)).toEqual([
      "GLOBAL",
      "LOCALE",
      "HOST",
      "ORG",
      "BUCKET",
      "SEGMENT",
    ]);
    expect(levels.at(-1)?.segmentKey).toBe(
      "loc:en/host:example.org/org:null/bucket:null/ref:null/dev:null/depth:90s/ret:first/surf:hosted",
    );
  });
});
