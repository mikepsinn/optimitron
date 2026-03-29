import { describe, expect, it } from "vitest";
import { hasVisualContent, trimVisualsContext } from "../visuals-utils";

describe("visuals-utils", () => {
  it("trims oversized visuals context", () => {
    const trimmed = trimVisualsContext("A".repeat(9000), 100);
    expect(trimmed.length).toBeGreaterThan(100);
    expect(trimmed.startsWith("AAA")).toBe(true);
    expect(trimmed.endsWith("[Context truncated for visuals]")).toBe(true);
  });

  it("leaves small visuals context untouched", () => {
    expect(trimVisualsContext("short context", 100)).toBe("short context");
  });

  it("detects whether a visuals payload has renderable content", () => {
    expect(hasVisualContent(null)).toBe(false);
    expect(hasVisualContent({ sourceLinks: [] })).toBe(false);
    expect(hasVisualContent({ keyFigure: { value: "10x", label: "ROI", context: null } })).toBe(true);
    expect(hasVisualContent({ image: "assets/example.png" })).toBe(true);
  });
});
