import { describe, expect, it } from "vitest";
import { normalizeTaskTextLineBreaks } from "../task-text";

describe("normalizeTaskTextLineBreaks", () => {
  it("preserves real markdown line breaks", () => {
    expect(normalizeTaskTextLineBreaks("First\r\n\r\n- Second")).toBe(
      "First\n\n- Second",
    );
  });

  it("converts visible escaped line breaks into real markdown line breaks", () => {
    expect(normalizeTaskTextLineBreaks("First\\n\\n- Second")).toBe(
      "First\n\n- Second",
    );
    expect(normalizeTaskTextLineBreaks("First\\\\nSecond")).toBe(
      "First\nSecond",
    );
  });

  it("does not treat obvious file paths as escaped line breaks", () => {
    expect(normalizeTaskTextLineBreaks(String.raw`Open C:\new-folder`)).toBe(
      String.raw`Open C:\new-folder`,
    );
    expect(normalizeTaskTextLineBreaks(String.raw`Open \\server\new-folder`)).toBe(
      String.raw`Open \\server\new-folder`,
    );
  });
});
