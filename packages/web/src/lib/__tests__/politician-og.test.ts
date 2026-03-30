import { describe, expect, it } from "vitest";
import {
  formatPoliticianOgDescriptor,
  formatPoliticianOgRatio,
} from "../politician-og";

describe("politician OG helpers", () => {
  it("joins available descriptor parts into a single text node", () => {
    expect(
      formatPoliticianOgDescriptor(["Democratic", "senate", "MA"]),
    ).toBe("Democratic · senate · MA");
  });

  it("omits empty descriptor parts", () => {
    expect(
      formatPoliticianOgDescriptor(["Independent", "", null, "VT"]),
    ).toBe("Independent · VT");
  });

  it("avoids the infinity glyph for very large ratios", () => {
    expect(formatPoliticianOgRatio(1_500_000)).toBe("999,999+:1");
    expect(formatPoliticianOgRatio(1_094)).toBe("1,094:1");
  });
});
